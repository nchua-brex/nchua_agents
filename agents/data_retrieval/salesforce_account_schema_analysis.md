# Salesforce Account Table Schema Analysis

## Overview
This document provides schema information for the Salesforce account tables in the Brex Snowflake environment, specifically focusing on the `brex_ee_count_c` field and proper join patterns.

## Table Structure

### FIVETRAN.SALESFORCE.ACCOUNT
This is the raw Fivetran sync of Salesforce Account objects, containing all custom fields including:

**Key Fields for Analysis:**
- `id` (VARCHAR) - Salesforce Account ID (18-character SFDC ID)
- `name` (VARCHAR) - Account name
- `brex_ee_count_c` (NUMBER) - Brex Enterprise Edition employee count (custom field)
- `brex_entity_id_c` (VARCHAR) - Brex entity/customer identifier
- `is_deleted` (BOOLEAN) - Soft delete flag from Salesforce

**Important Notes:**
- This is the **raw Fivetran table** containing all Salesforce accounts including prospects
- Field names end with `_c` for custom Salesforce fields
- Contains Salesforce-specific IDs, not Brex customer account IDs
- May have duplicates if `is_deleted = true` records exist

### COREDATA.SALESFORCE.ACCOUNTS
This is the **processed/cleaned version** used in analytics:

**Key Fields:**
- `salesforce_account_id` (VARCHAR) - Same as FIVETRAN id
- `customer_account_id` (VARCHAR) - **Primary join key to customer tables**
- `is_primary_salesforce_account_for_cuacc` (BOOLEAN) - Primary account flag
- Does NOT contain `brex_ee_count_c` (not synced to this table)

## Join Patterns

### Pattern 1: Accessing brex_ee_count_c with Customer Data

```sql
-- Join FIVETRAN.SALESFORCE.ACCOUNT -> COREDATA.SALESFORCE.ACCOUNTS -> COREDATA.CUSTOMER.CUSTOMER_WIDE
SELECT
    sf.id as salesforce_account_id,
    sf.name as account_name,
    sf.brex_ee_count_c,                    -- EE count from Salesforce
    sf.brex_entity_id_c,
    cs.customer_account_id,
    cw.dba_name,
    cw.employee_count,                     -- Brex's employee count (may differ)
    cw.empower_edition,
    cw.one_brex_segment
FROM fivetran.salesforce.account sf
INNER JOIN coredata.salesforce.accounts cs
    ON sf.id = cs.salesforce_account_id
    AND sf.is_deleted = FALSE
INNER JOIN coredata.customer.customer_wide cw
    ON cs.customer_account_id = cw.customer_account_id
    AND cs.is_primary_salesforce_account_for_cuacc = TRUE
WHERE cw.internal_account_type = 'customer_account'
    AND cw.status = 'active'
```

### Pattern 2: Accessing brex_ee_count_c with Opportunities

```sql
-- Join FIVETRAN.SALESFORCE.ACCOUNT -> OPPORTUNITIES
SELECT
    opp.opportunity_id,
    opp.name as opportunity_name,
    opp.close_date,
    opp.arr_deal_size,
    sf.brex_ee_count_c,                    -- EE count from Salesforce
    sf.name as account_name,
    cs.customer_account_id
FROM coredata.salesforce.opportunities opp
INNER JOIN coredata.salesforce.accounts cs
    ON opp.salesforce_account_id = cs.salesforce_account_id
    AND cs.is_primary_salesforce_account_for_cuacc = TRUE
LEFT JOIN fivetran.salesforce.account sf
    ON cs.salesforce_account_id = sf.id
    AND sf.is_deleted = FALSE
WHERE opp.record_type_name = 'Empower'
    AND opp.is_won = true
```

## Data Quality Considerations

### brex_ee_count_c Field
- **Data Type**: NUMBER (integer)
- **Nullable**: Yes - many accounts may not have this field populated
- **Source**: Manually entered in Salesforce by sales reps
- **Reliability**: May be outdated or missing
- **Comparison**: Different from `cw.employee_count` which comes from Brex's internal data

### Field Comparison: brex_ee_count_c vs employee_count

| Field | Source | Table | Use Case |
|-------|--------|-------|----------|
| `brex_ee_count_c` | Salesforce (manual entry) | `fivetran.salesforce.account` | Sales rep's view of company size |
| `employee_count` | Brex internal data | `coredata.customer.customer_wide` | Brex's validated employee count |

**Recommendation**: Use `cw.employee_count` from customer_wide for analytics unless specifically comparing Salesforce data quality.

## Common Query Scenarios

### Scenario 1: Validate brex_ee_count_c Data Quality
```sql
-- Compare Salesforce EE count vs Brex employee count
SELECT
    sf.brex_ee_count_c as salesforce_ee_count,
    cw.employee_count as brex_employee_count,
    ABS(sf.brex_ee_count_c - cw.employee_count) as difference,
    CASE
        WHEN sf.brex_ee_count_c IS NULL THEN 'Missing in Salesforce'
        WHEN cw.employee_count IS NULL THEN 'Missing in Brex'
        WHEN ABS(sf.brex_ee_count_c - cw.employee_count) > 50 THEN 'Large Discrepancy'
        WHEN ABS(sf.brex_ee_count_c - cw.employee_count) > 10 THEN 'Moderate Discrepancy'
        ELSE 'Aligned'
    END as data_quality_flag,
    cw.dba_name,
    cw.one_brex_segment
FROM fivetran.salesforce.account sf
INNER JOIN coredata.salesforce.accounts cs
    ON sf.id = cs.salesforce_account_id
    AND cs.is_primary_salesforce_account_for_cuacc = TRUE
INNER JOIN coredata.customer.customer_wide cw
    ON cs.customer_account_id = cw.customer_account_id
WHERE cw.internal_account_type = 'customer_account'
    AND cw.status = 'active'
    AND sf.is_deleted = FALSE
ORDER BY difference DESC;
```

### Scenario 2: Enrich Opportunity Analysis with EE Count
```sql
-- Add brex_ee_count_c to opportunity analysis
WITH fy26_opportunities AS (
    SELECT
        opp.opportunity_id,
        opp.name,
        opp.close_date,
        opp.arr_deal_size,
        opp.salesforce_account_id,
        cs.customer_account_id
    FROM coredata.salesforce.opportunities opp
    LEFT JOIN coredata.salesforce.accounts cs
        ON opp.salesforce_account_id = cs.salesforce_account_id
        AND cs.is_primary_salesforce_account_for_cuacc = TRUE
    WHERE opp.close_date >= '2025-02-01'
        AND opp.close_date < '2026-02-01'
        AND opp.record_type_name = 'Empower'
        AND opp.is_won = true
)
SELECT
    op.*,
    sf.brex_ee_count_c,
    sf.name as account_name,
    cw.employee_count as brex_employee_count,
    cw.one_brex_segment
FROM fy26_opportunities op
LEFT JOIN fivetran.salesforce.account sf
    ON op.salesforce_account_id = sf.id
    AND sf.is_deleted = FALSE
LEFT JOIN coredata.customer.customer_wide cw
    ON op.customer_account_id = cw.customer_account_id
```

## Best Practices

1. **Always filter `is_deleted = FALSE`** when using FIVETRAN tables
2. **Use `is_primary_salesforce_account_for_cuacc = TRUE`** to avoid duplicates
3. **Handle NULL values** - brex_ee_count_c is frequently NULL
4. **Prefer coredata.customer.customer_wide.employee_count** for reliable employee counts
5. **Use LEFT JOIN** when accessing FIVETRAN tables (to not lose records if field is missing)
6. **Document the source** when presenting employee count metrics

## Performance Considerations

- FIVETRAN tables are large and not optimized for analytics
- Filter early in CTEs to reduce data volume
- Use INNER JOIN only when you specifically need brex_ee_count_c populated
- Consider materialized views if querying frequently

## Related Documentation

- Main schema: `/Users/nchua/Desktop/Cursor/agents/data_retrieval/brex_snowflake_schema.md`
- Reference patterns: `/Users/nchua/Desktop/Cursor/agents/data_retrieval/brex_reference_patterns.sql`
- Salesforce opportunities analysis: See cross-sell/upsell patterns
