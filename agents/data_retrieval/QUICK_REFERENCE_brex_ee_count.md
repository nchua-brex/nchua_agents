# Quick Reference: Salesforce Employee Count Fields

## ✅ CORRECT FIELD IDENTIFIED: brex_ee_count_number_c

### ✅ brex_ee_count_number_c (CORRECT Brex Custom Field)
```
Table: fivetran.salesforce.account
Field: brex_ee_count_number_c
Type:  NUMBER
Status: POPULATED with actual data
Recommendation: PRIMARY CHOICE - Use this field
```

### ✅ number_of_employees (Standard Salesforce Field)
```
Table: fivetran.salesforce.account
Field: number_of_employees
Type:  NUMBER
Status: ~91% Coverage (3.2M of 3.5M accounts)
Recommendation: ALTERNATIVE OPTION
```

### ❌ brex_ee_count_c (Wrong Custom Field)
```
Table: fivetran.salesforce.account
Field: brex_ee_count_c
Type:  NUMBER
Status: 100% NULL - COMPLETELY UNPOPULATED
Recommendation: DO NOT USE - Wrong field name
```

## Join Pattern (Copy-Paste Ready)
```sql
FROM your_base_table
LEFT JOIN fivetran.salesforce.account sf
    ON your_table.salesforce_account_id = sf.id
    AND sf.is_deleted = FALSE
```

## Full 3-Table Join (With Customer Data)
```sql
-- Step 1: Start with opportunities or your base table
FROM coredata.salesforce.opportunities opp

-- Step 2: Get customer_account_id
LEFT JOIN coredata.salesforce.accounts acc
    ON opp.salesforce_account_id = acc.salesforce_account_id
    AND acc.is_primary_salesforce_account_for_cuacc = TRUE

-- Step 3: Add brex_ee_count_c
LEFT JOIN fivetran.salesforce.account sf
    ON acc.salesforce_account_id = sf.id
    AND sf.is_deleted = FALSE

-- Step 4: Add customer data
LEFT JOIN coredata.customer.customer_wide cw
    ON acc.customer_account_id = cw.customer_account_id
```

## Essential Filters
```sql
WHERE sf.is_deleted = FALSE
  AND acc.is_primary_salesforce_account_for_cuacc = TRUE
```

## Common Columns (UPDATED - CORRECT FIELD)
```sql
SELECT
    sf.brex_ee_count_number_c as salesforce_ee_count,   -- CORRECT FIELD - Primary choice
    cw.employee_count as cw_employee_count,             -- Brex internal count
    sf.name as salesforce_account_name,
    cw.dba_name as customer_name
```

## Data Quality Check (UPDATED - CORRECT FIELD)
```sql
-- Add to your SELECT to monitor data quality
CASE
    WHEN sf.brex_ee_count_number_c IS NULL THEN 'Missing'
    WHEN ABS(sf.brex_ee_count_number_c - cw.employee_count) > 50 THEN 'Large Gap'
    WHEN ABS(sf.brex_ee_count_number_c - cw.employee_count) > 10 THEN 'Moderate Gap'
    ELSE 'Aligned'
END as ee_count_quality
```

## When to Use What

| Need | Use This | From Table |
|------|----------|------------|
| Brex Salesforce employee data | brex_ee_count_number_c | fivetran.salesforce.account |
| Reliable internal employee count | employee_count | customer_wide |
| Customer analytics | employee_count | customer_wide |
| Alternative Salesforce data | number_of_employees | fivetran.salesforce.account |
| Data quality comparison | Both brex fields | Compare values |

## Expect These Stats (CORRECTED)
- brex_ee_count_number_c: Good coverage with actual data (CORRECT FIELD)
- number_of_employees: ~9% NULL rate (alternative option)
- brex_ee_count_c: 100% NULL rate (wrong field name - avoid)
- Data quality comparison now possible between cw.employee_count and sf.brex_ee_count_number_c

## Full Docs
- Usage Guide: `BREX_EE_COUNT_USAGE_GUIDE.md`
- Schema Details: `salesforce_account_schema_analysis.md`
- Validation: `validate_brex_ee_count_schema.sql`
