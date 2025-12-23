# Brex EE Count Usage Guide

## Quick Reference

### Field Location
- **Field Name**: `brex_ee_count_c`
- **Table**: `fivetran.salesforce.account`
- **Data Type**: NUMBER (integer)
- **Nullable**: YES (frequently NULL)

### Key Join Pattern
```sql
fivetran.salesforce.account (sf)
  ↓ JOIN on sf.id = cs.salesforce_account_id
coredata.salesforce.accounts (cs)
  ↓ JOIN on cs.customer_account_id = cw.customer_account_id
coredata.customer.customer_wide (cw)
```

## Why Use brex_ee_count_c vs employee_count?

| Scenario | Use Field | Source Table |
|----------|-----------|--------------|
| **Sales data quality analysis** | `brex_ee_count_c` | `fivetran.salesforce.account` |
| **Validate Salesforce rep inputs** | `brex_ee_count_c` | `fivetran.salesforce.account` |
| **Customer analytics (default)** | `employee_count` | `coredata.customer.customer_wide` |
| **Reliable employee count** | `employee_count` | `coredata.customer.customer_wide` |

## Complete Working Example

### Scenario: Add brex_ee_count_c to Cross-sell/Upsell Analysis

```sql
WITH fy26_empower_deals AS (
    -- Base opportunity filtering
    SELECT
        opp.opportunity_id,
        opp.name AS opportunity_name,
        opp.owner_name AS opportunity_owner,
        opp.closed_owner_second_level_team AS owner_segment,
        opp.close_date,
        opp.arr_deal_size,
        opp.sc_name,
        opp.salesforce_account_id,      -- Critical for Salesforce join
        acc.customer_account_id,        -- Critical for customer join

        -- Fiscal period logic
        DATE_TRUNC('month', opp.close_date) AS close_month,
        CASE
            WHEN MONTH(opp.close_date) IN (2, 3, 4) THEN 'Q1'
            WHEN MONTH(opp.close_date) IN (5, 6, 7) THEN 'Q2'
            WHEN MONTH(opp.close_date) IN (8, 9, 10) THEN 'Q3'
            WHEN MONTH(opp.close_date) IN (11, 12, 1) THEN 'Q4'
        END AS fiscal_quarter,
        CASE
            WHEN MONTH(opp.close_date) = 1 THEN YEAR(opp.close_date) - 1
            ELSE YEAR(opp.close_date)
        END AS fiscal_year
    FROM coredata.salesforce.opportunities AS opp
    LEFT JOIN coredata.salesforce.accounts AS acc
        ON opp.salesforce_account_id = acc.salesforce_account_id
        AND acc.is_primary_salesforce_account_for_cuacc = TRUE
    WHERE opp.close_date >= '2025-02-01'
        AND opp.close_date < '2026-02-01'  -- FY'26
        AND opp.record_type_name = 'Empower'
        AND opp.is_won = true
        AND opp.closed_owner_second_level_team IN ('Client Sales','ENT','MM')
        AND opp.stage_name NOT IN ('DQ: Duplicate')
),

-- Add brex_ee_count_c and customer data
enriched_deals AS (
    SELECT
        deals.*,
        -- Add Salesforce EE count
        sf_account.brex_ee_count_c as salesforce_ee_count,
        sf_account.name as salesforce_account_name,
        -- Add Brex customer data
        cw.dba_name,
        cw.employee_count as brex_employee_count,
        cw.empower_edition,
        cw.one_brex_segment,
        -- Data quality flag
        CASE
            WHEN sf_account.brex_ee_count_c IS NULL THEN 'EE Count Missing'
            WHEN cw.employee_count IS NULL THEN 'Brex Employee Count Missing'
            WHEN ABS(sf_account.brex_ee_count_c - cw.employee_count) > 50 THEN 'Large Discrepancy'
            WHEN ABS(sf_account.brex_ee_count_c - cw.employee_count) > 10 THEN 'Moderate Discrepancy'
            ELSE 'Aligned'
        END as ee_count_data_quality
    FROM fy26_empower_deals deals
    -- LEFT JOIN to Fivetran Salesforce (to not lose opportunities without brex_ee_count_c)
    LEFT JOIN fivetran.salesforce.account sf_account
        ON deals.salesforce_account_id = sf_account.id
        AND sf_account.is_deleted = FALSE
    -- LEFT JOIN to customer_wide (to not lose prospects)
    LEFT JOIN coredata.customer.customer_wide cw
        ON deals.customer_account_id = cw.customer_account_id
),

-- Check for prior revenue (cross-sell vs upsell)
prior_revenue_check AS (
    SELECT
        deals.*,
        MAX(CASE
            WHEN rev.empower_revenue > 0
                AND rev.report_month_date < deals.close_date
            THEN 1 ELSE 0
        END) AS had_prior_saas_revenue
    FROM enriched_deals deals
    LEFT JOIN coredata.customer.customers_monthly__net_revenue AS rev
        ON deals.customer_account_id = rev.customer_account_id
    GROUP BY
        deals.opportunity_id, deals.opportunity_name, deals.opportunity_owner,
        deals.owner_segment, deals.close_date, deals.arr_deal_size,
        deals.sc_name, deals.salesforce_account_id, deals.customer_account_id,
        deals.close_month, deals.fiscal_quarter, deals.fiscal_year,
        deals.salesforce_ee_count, deals.salesforce_account_name,
        deals.dba_name, deals.brex_employee_count, deals.empower_edition,
        deals.one_brex_segment, deals.ee_count_data_quality
)

-- Final output with all enrichments
SELECT
    opportunity_id,
    opportunity_name,
    opportunity_owner,
    owner_segment,
    close_date,
    fiscal_quarter,
    fiscal_year,
    arr_deal_size,
    sc_name,

    -- Cross-sell vs Upsell
    CASE
        WHEN had_prior_saas_revenue = 1 THEN 'Cross-sell'
        ELSE 'Upsell'
    END AS deal_type,

    -- Employee count fields
    salesforce_ee_count,
    brex_employee_count,
    ee_count_data_quality,

    -- Customer context
    dba_name,
    empower_edition,
    one_brex_segment
FROM prior_revenue_check
ORDER BY close_date DESC;
```

## Common Pitfalls and Solutions

### Pitfall 1: Using brex_ee_count_c without filtering is_deleted
```sql
-- ❌ WRONG: Includes deleted accounts
FROM fivetran.salesforce.account

-- ✅ CORRECT: Filter out deleted accounts
FROM fivetran.salesforce.account
WHERE is_deleted = FALSE
```

### Pitfall 2: INNER JOIN loses records with NULL brex_ee_count_c
```sql
-- ❌ WRONG: Loses opportunities without EE count
INNER JOIN fivetran.salesforce.account sf
    ON opp.salesforce_account_id = sf.id

-- ✅ CORRECT: Keeps all opportunities
LEFT JOIN fivetran.salesforce.account sf
    ON opp.salesforce_account_id = sf.id
    AND sf.is_deleted = FALSE
```

### Pitfall 3: Forgetting is_primary_salesforce_account_for_cuacc
```sql
-- ❌ WRONG: Can create duplicate customer records
LEFT JOIN coredata.salesforce.accounts cs
    ON opp.salesforce_account_id = cs.salesforce_account_id

-- ✅ CORRECT: Ensures one primary account per customer
LEFT JOIN coredata.salesforce.accounts cs
    ON opp.salesforce_account_id = cs.salesforce_account_id
    AND cs.is_primary_salesforce_account_for_cuacc = TRUE
```

## Data Quality Expectations

Based on Brex data patterns:

| Metric | Expected Value |
|--------|----------------|
| **Accounts with brex_ee_count_c populated** | ~40-60% |
| **Alignment with employee_count (±10)** | ~60-70% |
| **Large discrepancy (>100 difference)** | ~5-10% |
| **Missing in Salesforce** | ~40-60% |

## When to Use Each Approach

### Use brex_ee_count_c when:
1. Analyzing **Salesforce data quality**
2. Understanding **sales rep behavior** (what size companies they target)
3. **Validating Salesforce inputs** against Brex data
4. **Historical analysis** of how company size was viewed at time of sale

### Use employee_count when:
1. **General customer analytics** (default choice)
2. Calculating **revenue per employee**
3. **Segmentation analysis**
4. **Reliable, current employee counts** needed

### Use BOTH when:
1. **Data quality reporting**
2. **Salesforce data governance**
3. **Comparing external vs internal data sources**
4. **Identifying data entry issues**

## Testing Your Query

Run this quick validation after writing your query:

```sql
-- Add to end of your query to check data quality
SELECT
    COUNT(*) as total_records,
    COUNT(brex_ee_count_c) as with_ee_count,
    ROUND(COUNT(brex_ee_count_c) * 100.0 / COUNT(*), 1) as pct_with_ee_count,
    COUNT(employee_count) as with_brex_employee_count,
    ROUND(COUNT(employee_count) * 100.0 / COUNT(*), 1) as pct_with_brex_employee_count
FROM your_final_cte;
```

## Related Documentation

- **Full schema analysis**: `/Users/nchua/Desktop/Cursor/agents/data_retrieval/salesforce_account_schema_analysis.md`
- **Validation queries**: `/Users/nchua/Desktop/Cursor/agents/data_retrieval/validate_brex_ee_count_schema.sql`
- **Main Snowflake schema**: `/Users/nchua/Desktop/Cursor/agents/data_retrieval/brex_snowflake_schema.md`
- **Reference patterns**: `/Users/nchua/Desktop/Cursor/agents/data_retrieval/brex_reference_patterns.sql`

## Quick Command to Run Validation

```bash
# From agents/data_retrieval directory
snow sql -f validate_brex_ee_count_schema.sql > ee_count_validation_results.txt
```
