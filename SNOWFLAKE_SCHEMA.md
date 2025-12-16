# Snowflake Database Structure

## Database: COREDATA

```
COREDATA
│
├── CUSTOMER
│   ├── customers_monthly__net_revenue
│   │   ├── CUSTOMER_ACCOUNT_ID (VARCHAR) - Primary join key to customer_wide
│   │   ├── REPORT_MONTH_DATE (DATE)
│   │   ├── PRIOR_REPORT_MONTH_DATE (DATE)
│   │   ├── NET_INTERCHANGE_REVENUE (FLOAT) - Interchange revenue in USD
│   │   ├── NET_FX_REVENUE (FLOAT) - Foreign exchange revenue in USD
│   │   ├── DEPOSITS_REVENUE (FLOAT) - Deposits revenue in USD
│   │   ├── EMPOWER_REVENUE (FLOAT) - Empower product revenue in USD
│   │   ├── NET_REVENUE (FLOAT) - Total: interchange + FX + deposits + empower
│   │   ├── NET_INTERCHANGE_REVENUE_PRIOR (FLOAT) - Prior month interchange
│   │   ├── NET_FX_REVENUE_PRIOR (FLOAT) - Prior month FX
│   │   ├── DEPOSITS_REVENUE_PRIOR (FLOAT) - Prior month deposits
│   │   ├── EMPOWER_REVENUE_PRIOR (FLOAT) - Prior month empower
│   │   ├── NET_REVENUE_PRIOR (FLOAT) - Prior month total revenue
│   │   ├── NET_REVENUE_EXCLUDING_DEPOSITS_PRIOR (FLOAT) - Prior month (no deposits)
│   │   ├── CLEARED_GMV_AMOUNT (FLOAT) - Total cleared gross merchandise volume
│   │   └── LAST_UPDATED_AT_TIME (TIMESTAMP_NTZ) - Last update timestamp
│   │
│   └── empower_details (Empower product details & SaaS customer identification)
│       ├── CUSTOMER_ID (VARCHAR) - Customer identifier
│       ├── EMPOWER_EDITION (VARCHAR) - Edition type (identifies SaaS customers)
│       │   • 'Premium Edition' - SaaS customer
│       │   • 'Enterprise Edition' - SaaS customer
│       │   • Other values - Non-SaaS customers
│       └── [Additional Empower product fields]
│
├── SALESFORCE
│   ├── accounts (Salesforce account master data)
│   │   ├── SALESFORCE_ACCOUNT_ID (VARCHAR) - Primary key from Salesforce
│   │   ├── CUSTOMER_ACCOUNT_ID (VARCHAR) - Links to customer records
│   │   ├── NAME (VARCHAR) - Account name
│   │   ├── TYPE (VARCHAR) - Account type
│   │   ├── INDUSTRY (VARCHAR) - Industry classification  
│   │   ├── ANNUAL_REVENUE (NUMBER) - Annual revenue
│   │   ├── NUMBER_OF_EMPLOYEES (NUMBER) - Employee count
│   │   ├── OWNER_NAME (VARCHAR) - Account owner
│   │   ├── CREATED_DATE (TIMESTAMP) - When account was created
│   │   ├── LAST_MODIFIED_DATE (TIMESTAMP) - Last update
│   │   └── [400+ additional Salesforce fields]
│   │
│   └── opportunities (Salesforce deals/pipeline)
│       ├── OPPORTUNITY_ID (VARCHAR) - Primary key from Salesforce
│       ├── SALESFORCE_ACCOUNT_ID (VARCHAR) - Links to accounts
│       ├── NAME (VARCHAR) - Opportunity name
│       ├── STAGE_NAME (VARCHAR) - Current stage (e.g., Prospecting, Closed Won)
│       ├── AMOUNT (NUMBER) - Deal value
│       ├── CLOSE_DATE (DATE) - Expected/actual close date
│       ├── PROBABILITY (NUMBER) - Win probability %
│       ├── TYPE (VARCHAR) - Opportunity type
│       ├── LEAD_SOURCE (VARCHAR) - How lead originated
│       ├── OWNER_NAME (VARCHAR) - Opportunity owner
│       ├── CREATED_DATE (TIMESTAMP) - When opportunity was created
│       ├── LAST_MODIFIED_DATE (TIMESTAMP) - Last update
│       ├── IS_WON (BOOLEAN) - Whether opportunity is won
│       ├── IS_CLOSED (BOOLEAN) - Whether opportunity is closed
│       └── [600+ additional Salesforce fields]
│
└── CASH
    └── cash_customer__wide (Wide table with cash/deposit data)
        ├── CUSTOMER_ACCOUNT_ID (VARCHAR) - Customer account identifier
        ├── IS_DDA (BOOLEAN) - Has demand deposit account
        ├── NUMBER_OF_DEPOSIT_ACCOUNTS (NUMBER) - Count of BBA/Cash accounts
        ├── FIRST_DEPOSIT_DATE (TIMESTAMP) - First deposit timestamp
        ├── HAS_BILL_PAY (BOOLEAN) - Has bill pay enabled
        ├── BILL_PAY_PRODUCT (VARCHAR) - Bill pay version (v1/v2/v3)
        ├── HAS_PAYROLL (BOOLEAN) - Has connected payroll provider
        ├── NUM_OF_PAYROLL_PROVIDERS (NUMBER) - Count of payroll providers
        ├── PAYROLL_PROVIDERS_ARRAY (ARRAY) - List of provider names
        ├── TOTAL_BALANCE (NUMBER) - Total cash balance
        ├── AVAILABLE_BALANCE (NUMBER) - Available balance
        ├── PENDING_BALANCE (NUMBER) - Pending transactions
        └── [100+ additional cash metrics and flags]

## COREDATA.CUSTOMER.CUSTOMER_WIDE (Master Customer Table)

```
CUSTOMER_WIDE (Primary customer master table)
├── CUSTOMER_ACCOUNT_ID (VARCHAR) - Primary customer identifier
├── DBA_NAME (VARCHAR) - Customer business name
├── EMPOWER_EDITION (VARCHAR) - Customer edition type
│   • 'Premium Edition' - SaaS customer
│   • 'Enterprise Edition' - SaaS customer  
│   • 'Essentials Edition' (or any variation with 'Essentials') - Non-SaaS customer
├── ONE_BREX_SEGMENT (VARCHAR) - Finance/company-wide segmentation (OBS)
│   • 'Early Stage' - Early stage companies
│   • 'Growth' - Growth stage companies
│   • 'Mid-Market' - Mid-market companies
│   • 'Enterprise' - Enterprise companies
│   NOTE: OBS is used by Finance. Revenue Operations uses different segmentation.
├── COHORT_START_DATE (DATE) - Customer cohort start date
│   Used for cohort analysis to track business evolution over time
│   Can be truncated to different periods: year, quarter, month
│   Filter: cohort_start_date IS NOT NULL
├── EMPLOYEE_COUNT (NUMBER) - Number of employees at customer company
├── INTERNAL_ACCOUNT_TYPE (VARCHAR) - Account classification
│   • 'customer_account' - Actual customer (use this filter)
├── STATUS (VARCHAR) - Account status
│   • 'active' - Active customer (use this filter)
└── [Additional customer fields]
```
```

## Key Revenue Metrics

### Current Month Revenue Components
- **NET_INTERCHANGE_REVENUE** - Card interchange fees
- **NET_FX_REVENUE** - Foreign exchange revenue
- **DEPOSITS_REVENUE** - Interest from deposits
- **EMPOWER_REVENUE** - Empower product revenue
- **NET_REVENUE** - Total of all revenue streams

### Prior Month Metrics
All current metrics have `_PRIOR` versions for month-over-month comparisons

## Customer Segmentation

### Cohort Analysis
Cohorts track customers by their start date to analyze how the business evolves over time across different customer acquisition periods:

```sql
-- Customer metrics by cohort year
SELECT 
    DATE_TRUNC('year', cohort_start_date) AS cohort_start_year,
    COUNT(*) as customer_count,
    SUM(net_revenue) as total_revenue
FROM coredata.customer.customer_wide cw
LEFT JOIN coredata.customer.customers_monthly__net_revenue nrr 
    ON cw.customer_account_id = nrr.customer_account_id
WHERE internal_account_type = 'customer_account'
  AND status = 'active'
  AND cohort_start_date IS NOT NULL
GROUP BY cohort_start_year
ORDER BY cohort_start_year;
```

**Common cohort periods**:
- **Year**: `DATE_TRUNC('year', cohort_start_date)`
- **Quarter**: `DATE_TRUNC('quarter', cohort_start_date)`
- **Month**: `DATE_TRUNC('month', cohort_start_date)`

**Use cases**: 
- Track customer retention by cohort
- Compare revenue growth across different vintages
- Analyze product adoption patterns over time
- Measure cohort-based LTV and expansion

### One Brex Segment (OBS) - Finance Segmentation
One Brex Segment is used by Finance and some other teams for company-wide reporting:

```sql
-- Query customers by OBS
SELECT 
    one_brex_segment AS obs_segment,
    COUNT(*) as customer_count
FROM coredata.customer.customer_wide
WHERE internal_account_type = 'customer_account'
  AND status = 'active'
  AND one_brex_segment IS NOT NULL
GROUP BY obs_segment
ORDER BY obs_segment;
```

**OBS Segments**: Early Stage, Growth, Mid-Market, Enterprise

**Note**: Revenue Operations uses a different segmentation system (Growth, Mid-Market, Enterprise, etc.) that does not rely on OBS. Use OBS only when specifically needed for Finance reporting.

## SaaS Customer Identification

### Method 1: Using customer_wide table (Recommended)
```sql
-- SaaS customers (Premium/Enterprise)
SELECT * FROM coredata.customer.customer_wide
WHERE empower_edition IN ('Premium Edition', 'Enterprise Edition')
  AND internal_account_type = 'customer_account'
  AND status = 'active';

-- Non-SaaS customers (Essentials)
SELECT * FROM coredata.customer.customer_wide
WHERE empower_edition LIKE '%Essentials%'
  AND internal_account_type = 'customer_account'
  AND status = 'active';
```

### Method 2: Using empower_details table
```sql
SELECT * FROM coredata.customer.empower_details
WHERE empower_edition IN ('Premium Edition', 'Enterprise Edition');
```

### Customer Edition Types:
- **SaaS Customers**: Premium Edition, Enterprise Edition
- **Non-SaaS Customers**: Essentials Edition (any variation containing 'Essentials')

### Best Practices for Customer Queries:
1. Always filter by `internal_account_type = 'customer_account'` to get actual customers
2. Add `status = 'active'` to focus on active customers only
3. Normalize Essentials variations: `CASE WHEN empower_edition LIKE '%Essentials%' THEN 'Essentials Edition' ELSE empower_edition END`

This is critical for segmenting revenue analysis, commission calculations, and customer success metrics.

## Common Queries

### Identify SaaS customers (Empower Premium/Enterprise)
```sql
SELECT 
    CUSTOMER_ID,
    EMPOWER_EDITION
FROM coredata.customer.empower_details
WHERE EMPOWER_EDITION IN ('Premium Edition', 'Enterprise Edition');
```

### Get SaaS customer revenue
```sql
SELECT 
    e.CUSTOMER_ID,
    e.EMPOWER_EDITION,
    a.NAME as account_name,
    r.REPORT_MONTH_DATE,
    r.EMPOWER_REVENUE,
    r.NET_REVENUE
FROM coredata.customer.empower_details e
INNER JOIN coredata.customer.customers_monthly__net_revenue r
    ON e.CUSTOMER_ID = r.CUSTOMER_ID
LEFT JOIN coredata.salesforce.accounts a
    ON e.CUSTOMER_ID = a.CUSTOMER_ACCOUNT_ID
WHERE e.EMPOWER_EDITION IN ('Premium Edition', 'Enterprise Edition')
  AND r.REPORT_MONTH_DATE >= DATEADD(month, -6, CURRENT_DATE())
ORDER BY r.EMPOWER_REVENUE DESC;
```

### Compare SaaS vs Non-SaaS revenue (Recommended Pattern)
```sql
-- Revenue and metrics by customer edition (last 3 months)
WITH customers AS (
    SELECT
        cw.customer_account_id,
        CASE
            WHEN cw.empower_edition LIKE '%Essentials%' THEN 'Essentials Edition'
            ELSE cw.empower_edition 
        END AS actual_edition,
        cw.employee_count,
        AVG(nrr.cleared_gmv_amount) as avg_l3m_cleared_gmv,
        AVG(nrr.empower_revenue) as avg_l3m_saas_revenue,
        AVG(nrr.net_revenue) as avg_l3m_net_revenue,
        SUM(nrr.cleared_gmv_amount) as cleared_gmv_amount,
        SUM(nrr.empower_revenue) as empower_revenue,
        SUM(nrr.net_revenue) as net_revenue
    FROM coredata.customer.customer_wide cw
    LEFT JOIN coredata.customer.customers_monthly__net_revenue nrr 
        ON cw.customer_account_id = nrr.customer_account_id 
        AND nrr.report_month_date >= DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE)) 
        AND nrr.report_month_date < DATE_TRUNC('month', CURRENT_DATE)
    WHERE cw.internal_account_type = 'customer_account'
        AND actual_edition IS NOT NULL
        AND cw.status = 'active'
    GROUP BY 1, 2, 3
)

SELECT
    actual_edition,
    COUNT(DISTINCT customer_account_id) as num_customers,
    num_customers / SUM(num_customers) OVER () as perc_of_customers,
    SUM(cleared_gmv_amount) as cleared_gmv,
    cleared_gmv / SUM(cleared_gmv) OVER () as perc_of_gmv,
    AVG(avg_l3m_cleared_gmv) as avg_l3m_cleared_gmv_per_cust,
    SUM(empower_revenue) as saas_revenue,
    saas_revenue / SUM(saas_revenue) OVER () as perc_of_saas_revenue,
    AVG(avg_l3m_saas_revenue) as avg_l3m_saas_revenue_per_cust,
    SUM(net_revenue) as net_revenue_,
    net_revenue_ / SUM(net_revenue_) OVER () as perc_of_net_revenue,
    AVG(avg_l3m_net_revenue) as avg_l3m_net_revenue_per_cust,
    AVG(employee_count) as avg_employee_count,
    MEDIAN(employee_count) as median_employee_count
FROM customers
GROUP BY 1
ORDER BY 1;
```

### Get monthly revenue for a customer
```sql
SELECT 
    CUSTOMER_ID,
    REPORT_MONTH_DATE,
    NET_REVENUE,
    NET_INTERCHANGE_REVENUE,
    NET_FX_REVENUE,
    DEPOSITS_REVENUE,
    EMPOWER_REVENUE
FROM coredata.customer.customers_monthly__net_revenue
WHERE CUSTOMER_ID = 'your_customer_id'
ORDER BY REPORT_MONTH_DATE DESC;
```

### Get month-over-month revenue growth
```sql
SELECT 
    CUSTOMER_ID,
    REPORT_MONTH_DATE,
    NET_REVENUE,
    NET_REVENUE_PRIOR,
    (NET_REVENUE - NET_REVENUE_PRIOR) AS revenue_change,
    CASE 
        WHEN NET_REVENUE_PRIOR > 0 
        THEN ((NET_REVENUE - NET_REVENUE_PRIOR) / NET_REVENUE_PRIOR) * 100
        ELSE NULL 
    END AS revenue_growth_pct
FROM coredata.customer.customers_monthly__net_revenue
WHERE REPORT_MONTH_DATE >= DATEADD(month, -6, CURRENT_DATE());
```

### Get account overview with revenue and cash data
```sql
SELECT 
    a.SALESFORCE_ACCOUNT_ID,
    a.NAME as account_name,
    a.INDUSTRY,
    a.OWNER_NAME,
    r.REPORT_MONTH_DATE,
    r.NET_REVENUE,
    r.NET_INTERCHANGE_REVENUE,
    r.DEPOSITS_REVENUE,
    c.IS_DDA,
    c.NUMBER_OF_DEPOSIT_ACCOUNTS,
    c.HAS_BILL_PAY,
    c.HAS_PAYROLL
FROM coredata.salesforce.accounts a
LEFT JOIN coredata.customer.customers_monthly__net_revenue r
    ON a.CUSTOMER_ACCOUNT_ID = r.CUSTOMER_ID
    AND r.REPORT_MONTH_DATE >= DATEADD(month, -3, CURRENT_DATE())
LEFT JOIN coredata.cash.cash_customer__wide c
    ON a.CUSTOMER_ACCOUNT_ID = c.CUSTOMER_ACCOUNT_ID
WHERE a.CUSTOMER_ACCOUNT_ID IS NOT NULL
ORDER BY r.NET_REVENUE DESC;
```

### Get sales pipeline with current customer revenue
```sql
SELECT 
    o.OPPORTUNITY_ID,
    o.NAME as opportunity_name,
    o.STAGE_NAME,
    o.AMOUNT as deal_value,
    o.CLOSE_DATE,
    o.PROBABILITY,
    a.NAME as account_name,
    a.INDUSTRY,
    r.NET_REVENUE as current_monthly_revenue,
    r.REPORT_MONTH_DATE
FROM coredata.salesforce.opportunities o
INNER JOIN coredata.salesforce.accounts a
    ON o.SALESFORCE_ACCOUNT_ID = a.SALESFORCE_ACCOUNT_ID
LEFT JOIN coredata.customer.customers_monthly__net_revenue r
    ON a.CUSTOMER_ACCOUNT_ID = r.CUSTOMER_ID
    AND r.REPORT_MONTH_DATE = (
        SELECT MAX(REPORT_MONTH_DATE) 
        FROM coredata.customer.customers_monthly__net_revenue
    )
WHERE o.IS_CLOSED = FALSE
ORDER BY o.AMOUNT DESC;
```

### Get customers with cash products and revenue trends
```sql
SELECT 
    c.CUSTOMER_ACCOUNT_ID,
    a.NAME as account_name,
    c.NUMBER_OF_DEPOSIT_ACCOUNTS,
    c.HAS_BILL_PAY,
    c.BILL_PAY_PRODUCT,
    c.HAS_PAYROLL,
    c.NUM_OF_PAYROLL_PROVIDERS,
    r.REPORT_MONTH_DATE,
    r.NET_REVENUE,
    r.DEPOSITS_REVENUE,
    LAG(r.NET_REVENUE, 1) OVER (
        PARTITION BY c.CUSTOMER_ACCOUNT_ID 
        ORDER BY r.REPORT_MONTH_DATE
    ) as prior_month_revenue
FROM coredata.cash.cash_customer__wide c
INNER JOIN coredata.salesforce.accounts a
    ON c.CUSTOMER_ACCOUNT_ID = a.CUSTOMER_ACCOUNT_ID
LEFT JOIN coredata.customer.customers_monthly__net_revenue r
    ON c.CUSTOMER_ACCOUNT_ID = r.CUSTOMER_ID
WHERE c.IS_DDA = TRUE
  AND r.REPORT_MONTH_DATE >= DATEADD(month, -6, CURRENT_DATE())
ORDER BY c.CUSTOMER_ACCOUNT_ID, r.REPORT_MONTH_DATE DESC;
```

### Revenue by industry with cash adoption
```sql
SELECT 
    a.INDUSTRY,
    COUNT(DISTINCT a.CUSTOMER_ACCOUNT_ID) as num_customers,
    SUM(r.NET_REVENUE) as total_revenue,
    AVG(r.NET_REVENUE) as avg_revenue_per_customer,
    COUNT(DISTINCT CASE WHEN c.IS_DDA = TRUE THEN a.CUSTOMER_ACCOUNT_ID END) as customers_with_deposits,
    COUNT(DISTINCT CASE WHEN c.HAS_BILL_PAY = TRUE THEN a.CUSTOMER_ACCOUNT_ID END) as customers_with_billpay
FROM coredata.salesforce.accounts a
INNER JOIN coredata.customer.customers_monthly__net_revenue r
    ON a.CUSTOMER_ACCOUNT_ID = r.CUSTOMER_ID
    AND r.REPORT_MONTH_DATE = DATE_TRUNC('month', CURRENT_DATE())
LEFT JOIN coredata.cash.cash_customer__wide c
    ON a.CUSTOMER_ACCOUNT_ID = c.CUSTOMER_ACCOUNT_ID
WHERE a.INDUSTRY IS NOT NULL
GROUP BY a.INDUSTRY
ORDER BY total_revenue DESC
LIMIT 20;
```

## Table Relationships

```
┌──────────────────────────────────┐
│  salesforce.accounts             │
│  (Account master data)           │
│  Key: SALESFORCE_ACCOUNT_ID      │
│       CUSTOMER_ACCOUNT_ID        │
└──────┬───────────────────┬───────┘
       │                   │
       │                   │ SALESFORCE_ACCOUNT_ID
       │                   │
       │                   ▼
       │         ┌──────────────────────────────┐
       │         │  salesforce.opportunities    │
       │         │  (Deals/Pipeline)            │
       │         │  Key: OPPORTUNITY_ID         │
       │         │       SALESFORCE_ACCOUNT_ID  │
       │         └──────────────────────────────┘
       │
       │ CUSTOMER_ACCOUNT_ID (common join key)
       │
       ├─────────────────────────────────────────┬────────────────────┐
       │                                         │                    │
       ▼                                         ▼                    ▼
┌──────────────────────────────┐    ┌──────────────────────┐    ┌──────────────────────────┐
│  customer.customers_         │    │  cash.cash_          │    │  customer.empower_       │
│  monthly__net_revenue        │    │  customer__wide      │    │  details                 │
│  Key: CUSTOMER_ID            │    │  (Cash/Deposits)     │    │  (SaaS identification)   │
│       REPORT_MONTH_DATE      │    │  Key: CUSTOMER_      │    │  Key: CUSTOMER_ID        │
│                              │    │       ACCOUNT_ID     │    │  EMPOWER_EDITION         │
└──────────────────────────────┘    └──────────────────────┘    └──────────────────────────┘

** Primary Join Key: CUSTOMER_ACCOUNT_ID (or CUSTOMER_ID) links all tables **
```

## Important Notes

### Data Conventions
- All revenue values are in **USD**
- Timestamps are in **UTC**
- Monthly data is aggregated by `REPORT_MONTH_DATE`
- Prior month comparisons use `PRIOR_REPORT_MONTH_DATE`

### Join Keys
- **CUSTOMER_ACCOUNT_ID** is the primary key to join across all tables
- **SALESFORCE_ACCOUNT_ID** links accounts to opportunities
- Many Salesforce accounts don't have a `CUSTOMER_ACCOUNT_ID` (prospects not yet customers)

### Table Sizes
- **salesforce.accounts**: ~1M+ rows with 400+ columns
- **salesforce.opportunities**: ~822K rows with 600+ columns  
- **customer.customers_monthly__net_revenue**: Historical monthly data per customer
- **customer.empower_details**: One row per customer with Empower product
- **cash.cash_customer__wide**: One row per customer with 100+ columns

### Performance Tips
1. Always filter by date when querying revenue tables
2. Use `CUSTOMER_ACCOUNT_ID IS NOT NULL` to focus on actual customers
3. These are wide tables - select only columns you need
4. Consider using CTEs for complex multi-table joins

### Common Patterns
- To get **latest month revenue**: `MAX(REPORT_MONTH_DATE)`
- To get **active customers**: Filter `internal_account_type = 'customer_account'` AND `status = 'active'`
- To get **last 3 months (L3M)**: `report_month_date >= DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE)) AND report_month_date < DATE_TRUNC('month', CURRENT_DATE)`
- To get **pipeline value**: Filter opportunities where `IS_CLOSED = FALSE`
- To get **cash customers**: Filter cash table where `IS_DDA = TRUE`
- To get **SaaS customers**: Filter `empower_edition IN ('Premium Edition', 'Enterprise Edition')` AND `internal_account_type = 'customer_account'` AND `status = 'active'`
- To get **Non-SaaS customers**: Filter `empower_edition LIKE '%Essentials%'` AND `internal_account_type = 'customer_account'` AND `status = 'active'`
- To **normalize edition names**: `CASE WHEN empower_edition LIKE '%Essentials%' THEN 'Essentials Edition' ELSE empower_edition END`
- To **use OBS segments**: Add `AND one_brex_segment IS NOT NULL` filter
- To **analyze by cohort**: Use `DATE_TRUNC('year', cohort_start_date)` (or 'quarter', 'month') and filter `cohort_start_date IS NOT NULL`

