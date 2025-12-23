# Brex Snowflake Schema Documentation for Data Retrieval Agent

## Overview
This document provides comprehensive schema knowledge for the Brex Snowflake data warehouse to enable effective data analysis and query generation.

## Database Structure: COREDATA

### Core Tables and Relationships

```
COREDATA
├── CUSTOMER
│   ├── customers_monthly__net_revenue (Revenue metrics by customer/month)
│   ├── customer_wide (Master customer table)
│   └── empower_details (SaaS product details)
├── SALESFORCE
│   ├── accounts (Account master data)
│   └── opportunities (Sales pipeline/deals)
└── CASH
    └── cash_customer__wide (Deposit/cash products)

FIVETRAN (Raw Salesforce Sync)
└── SALESFORCE
    └── account (Raw Salesforce accounts with hierarchy fields and SoT rollups)
```

### Primary Join Keys
- **CUSTOMER_ACCOUNT_ID**: Primary key linking all customer tables
- **SALESFORCE_ACCOUNT_ID**: Links accounts to opportunities
- **OPPORTUNITY_ID**: Primary key for opportunities

### Salesforce Account Tables
- **coredata.salesforce.accounts**: Processed accounts with customer_account_id (use for analytics)
- **fivetran.salesforce.account**: Raw Salesforce sync with hierarchy SoT fields
- **Join Pattern**: fivetran.salesforce.account → coredata.salesforce.accounts → coredata.customer.customer_wide
- **Key Insight**: Use Brex_[Field]__c SoT fields, not individual source fields
- **See**: `DATA_HIERARCHY_GUIDE.md` for complete field hierarchy and priorities

## Key Tables Schema

### customers_monthly__net_revenue
```sql
-- Revenue metrics aggregated by customer and month
CUSTOMER_ACCOUNT_ID (VARCHAR)     -- Primary join key
REPORT_MONTH_DATE (DATE)          -- Revenue month
NET_REVENUE (FLOAT)               -- Total revenue (interchange + FX + deposits + empower)
NET_INTERCHANGE_REVENUE (FLOAT)   -- Card interchange revenue
NET_FX_REVENUE (FLOAT)           -- Foreign exchange revenue
DEPOSITS_REVENUE (FLOAT)         -- Deposits/cash revenue
EMPOWER_REVENUE (FLOAT)          -- SaaS product revenue (KEY FOR SAAS ANALYSIS)
CLEARED_GMV_AMOUNT (FLOAT)       -- Gross merchandise volume
```

### customer_wide
```sql
-- Master customer table with segmentation and status
CUSTOMER_ACCOUNT_ID (VARCHAR)    -- Primary key
DBA_NAME (VARCHAR)              -- Business name
EMPOWER_EDITION (VARCHAR)       -- SaaS vs Non-SaaS identifier
  • 'Premium Edition' = SaaS customer
  • 'Enterprise Edition' = SaaS customer
  • '%Essentials%' = Non-SaaS customer
ONE_BREX_SEGMENT (VARCHAR)      -- Finance segmentation
  • 'Early Stage', 'Growth', 'Mid-Market', 'Enterprise'
INTERNAL_ACCOUNT_TYPE (VARCHAR) -- Filter: 'customer_account'
STATUS (VARCHAR)                -- Filter: 'active'
COHORT_START_DATE (DATE)        -- Customer acquisition date
EMPLOYEE_COUNT (NUMBER)         -- Company size
```

### salesforce.opportunities
```sql
-- Sales pipeline and deal data
OPPORTUNITY_ID (VARCHAR)              -- Primary key
SALESFORCE_ACCOUNT_ID (VARCHAR)       -- Links to accounts
NAME (VARCHAR)                        -- Opportunity name
RECORD_TYPE_NAME (VARCHAR)           -- Product type (e.g., 'Empower')
STAGE_NAME (VARCHAR)                 -- Deal stage
CLOSE_DATE (DATE)                    -- Expected/actual close
AMOUNT (NUMBER)                      -- Deal value
ARR_DEAL_SIZE (NUMBER)              -- Annual recurring revenue
IS_WON (BOOLEAN)                    -- Deal won
IS_CLOSED (BOOLEAN)                 -- Deal closed
OWNER_NAME (VARCHAR)                -- Sales rep
CLOSED_OWNER_SECOND_LEVEL_TEAM (VARCHAR) -- Segmentation
  • 'Client Sales' = CSE opportunities
  • 'MM' = Mid-Market
  • 'ENT' = Enterprise
SC_NAME (VARCHAR)                   -- Solutions Consultant name
IS_SC_ACTIVELY_WORKING (BOOLEAN)    -- SC engagement flag
```

## Business Logic Patterns

### SaaS Customer Identification
```sql
-- Method 1: Using customer_wide (Recommended)
WHERE empower_edition IN ('Premium Edition', 'Enterprise Edition')
  AND internal_account_type = 'customer_account'
  AND status = 'active'

-- Method 2: Non-SaaS customers
WHERE empower_edition LIKE '%Essentials%'
  AND internal_account_type = 'customer_account'
  AND status = 'active'
```

### Segmentation Logic
```sql
-- CSE vs Mid-Market vs Enterprise (from opportunities)
CASE
  WHEN closed_owner_second_level_team = 'Client Sales' THEN 'CSE'
  WHEN closed_owner_second_level_team = 'MM' THEN 'Mid-Market'
  WHEN closed_owner_second_level_team = 'ENT' THEN 'Enterprise'
END AS segment

-- One Brex Segment (Finance segmentation)
WHERE one_brex_segment IN ('Early Stage', 'Growth', 'Mid-Market', 'Enterprise')
```

### Fiscal Year Logic (Brex FY)
```sql
-- FY starts in February
CASE
  WHEN MONTH(close_date) IN (2, 3, 4) THEN 'Q1'
  WHEN MONTH(close_date) IN (5, 6, 7) THEN 'Q2'
  WHEN MONTH(close_date) IN (8, 9, 10) THEN 'Q3'
  WHEN MONTH(close_date) IN (11, 12, 1) THEN 'Q4'
END AS fiscal_quarter

CASE
  WHEN MONTH(close_date) = 1 THEN YEAR(close_date) - 1
  ELSE YEAR(close_date)
END AS fiscal_year
```

### Solutions Consultant Logic
```sql
-- SC assignment logic (changed July 2, 2025)
CASE
  WHEN close_date <= '2025-07-02'
    AND sc_name IS NOT NULL
    AND is_sc_actively_working = true THEN true
  WHEN close_date > '2025-07-02'
    AND sc_name IS NOT NULL THEN true
  ELSE FALSE
END AS has_solutions_consultant
```

### Cross-sell vs Upsell Analysis Pattern
```sql
-- Determine if customer had prior Empower revenue
WITH prior_revenue AS (
  SELECT
    opp.opportunity_id,
    opp.close_date,
    MAX(CASE
      WHEN rev.empower_revenue > 0
        AND rev.report_month_date < opp.close_date
      THEN 1 ELSE 0
    END) AS had_prior_saas_revenue
  FROM opportunities opp
  LEFT JOIN customers_monthly__net_revenue rev
    ON opp.customer_account_id = rev.customer_account_id
  GROUP BY 1, 2
)
SELECT
  CASE
    WHEN had_prior_saas_revenue = 1 THEN 'Cross-sell'
    ELSE 'Upsell'
  END AS deal_type
FROM prior_revenue
```

## Standard Filtering Patterns

### Active Customers Only
```sql
WHERE internal_account_type = 'customer_account'
  AND status = 'active'
```

### Date Filtering
```sql
-- Last 3 Months (L3M)
AND report_month_date >= DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE))
AND report_month_date < DATE_TRUNC('month', CURRENT_DATE)

-- FY'26 (Feb 2025 - Jan 2026)
AND close_date >= '2025-02-01'
AND close_date < '2026-02-01'
```

### Empower Opportunities
```sql
WHERE record_type_name = 'Empower'
  AND is_closed = true
  AND stage_name NOT IN ('DQ: Duplicate')
  AND closed_owner_second_level_team IN ('Client Sales', 'ENT', 'MM')
```

## Commission/Revenue Attribution Tables

### AE/CSE Account Holding Periods
```sql
-- From: salesforce.public.ae_cse_account_holding_periods
-- Links opportunities to revenue attribution periods
account_holding_period_id
customer_account_id
opportunity_id_determining_account_holding
owner_segment_territory_role AS segment
account_holding_period_start_date
account_holding_period_end_date
baseline_gmv, baseline_net_interchange_revenue
```

### Monthly Commission Revenue
```sql
-- From: salesforce.public.account_holding_periods_monthly_gmv_and_revenue
account_holding_period_id
calendar_month
rep_receiving_comm_rev_credit
commissionable_revenue
cse_commissionable_revenue
saas_commissionable_revenue AS incremental_saas_revenue
gmv_commissionable_revenue
```

## Performance Optimization

### Best Practices
1. **Always filter by date** when querying revenue tables
2. **Use CUSTOMER_ACCOUNT_ID IS NOT NULL** for customer focus
3. **Select only needed columns** from wide tables (400+ columns)
4. **Filter early** in CTEs to reduce data volume
5. **Use proper date functions** for fiscal year calculations

### Common CTEs Pattern
```sql
WITH base_opportunities AS (
  -- Filter early for performance
  SELECT * FROM coredata.salesforce.opportunities
  WHERE close_date >= '2025-02-01'
    AND record_type_name = 'Empower'
    AND is_closed = true
),
customer_revenue AS (
  -- Pre-aggregate revenue data
  SELECT
    customer_account_id,
    SUM(empower_revenue) as total_empower_revenue
  FROM coredata.customer.customers_monthly__net_revenue
  WHERE report_month_date >= '2025-02-01'
  GROUP BY 1
)
-- Join filtered datasets
SELECT ... FROM base_opportunities opp
LEFT JOIN customer_revenue rev ON ...
```

## Data Quality Notes

### Important Conventions
- All revenue values in **USD**
- Timestamps in **UTC**
- Monthly aggregation by `REPORT_MONTH_DATE`
- Many Salesforce accounts lack `CUSTOMER_ACCOUNT_ID` (prospects)

### Normalization Patterns
```sql
-- Normalize Essentials variations
CASE
  WHEN empower_edition LIKE '%Essentials%' THEN 'Essentials Edition'
  ELSE empower_edition
END AS normalized_edition

-- Handle NULL revenue safely
COALESCE(empower_revenue, 0) AS empower_revenue
```

This schema knowledge enables the data retrieval agent to:
1. Generate accurate Snowflake queries using proper table relationships
2. Apply correct business logic for segmentation and filtering
3. Use validated patterns from the Brex data team
4. Optimize query performance for large datasets
5. Handle edge cases and data quality issues appropriately