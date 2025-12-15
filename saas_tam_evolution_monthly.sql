-- ============================================================================
-- SaaS TAM Monthly Evolution Analysis (FY27)
-- ============================================================================
-- Purpose: Track SaaS adoption over time by segment (Feb 2025 - Present)
-- Segmentation: Fixed based on November 2025 data (L3M GMV from Aug-Oct 2025, EE count)
-- Time Series: Monthly stats from Feb 2025 to current month
-- ============================================================================

WITH 

-- Step 1: Calculate November 2025 segmentation (one-time snapshot)
nov_2025_metrics AS (
    SELECT
        cw.CUSTOMER_ACCOUNT_ID,
        cw.DBA_NAME,
        cw.EMPLOYEE_COUNT,
        AVG(nrr.CLEARED_GMV_AMOUNT) AS l3m_avg_cleared_gmv_nov2025
    FROM coredata.customer.customer_wide cw
    LEFT JOIN coredata.customer.customers_monthly__net_revenue nrr 
        ON cw.CUSTOMER_ACCOUNT_ID = nrr.CUSTOMER_ACCOUNT_ID
        -- L3M for Nov 2025 = Aug, Sep, Oct 2025
        AND nrr.REPORT_MONTH_DATE IN ('2025-08-01', '2025-09-01', '2025-10-01')
    WHERE cw.INTERNAL_ACCOUNT_TYPE = 'customer_account'
        AND cw.EMPLOYEE_COUNT IS NOT NULL
    GROUP BY 1, 2, 3
),

-- Step 2: Assign segments based on Nov 2025 data
customer_segments AS (
    SELECT
        CUSTOMER_ACCOUNT_ID,
        DBA_NAME,
        EMPLOYEE_COUNT,
        l3m_avg_cleared_gmv_nov2025,
        
        -- Segment Assignment based on FY27 matrix
        CASE
            -- Row 0: 0-25 EE
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv_nov2025 < 7000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv_nov2025 >= 7000 AND l3m_avg_cleared_gmv_nov2025 < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv_nov2025 >= 20000 AND l3m_avg_cleared_gmv_nov2025 < 100000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv_nov2025 >= 100000 AND l3m_avg_cleared_gmv_nov2025 < 150000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv_nov2025 >= 150000 AND l3m_avg_cleared_gmv_nov2025 < 300000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv_nov2025 >= 300000 AND l3m_avg_cleared_gmv_nov2025 < 700000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv_nov2025 >= 700000 THEN 'Enterprise'
            
            -- Row 1: 26-50 EE
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv_nov2025 < 7000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv_nov2025 >= 7000 AND l3m_avg_cleared_gmv_nov2025 < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv_nov2025 >= 20000 AND l3m_avg_cleared_gmv_nov2025 < 100000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv_nov2025 >= 100000 AND l3m_avg_cleared_gmv_nov2025 < 150000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv_nov2025 >= 150000 AND l3m_avg_cleared_gmv_nov2025 < 300000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv_nov2025 >= 300000 AND l3m_avg_cleared_gmv_nov2025 < 700000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv_nov2025 >= 700000 THEN 'Enterprise'
            
            -- Row 2: 51-100 EE
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv_nov2025 < 7000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv_nov2025 >= 7000 AND l3m_avg_cleared_gmv_nov2025 < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv_nov2025 >= 20000 AND l3m_avg_cleared_gmv_nov2025 < 100000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv_nov2025 >= 100000 AND l3m_avg_cleared_gmv_nov2025 < 150000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv_nov2025 >= 150000 AND l3m_avg_cleared_gmv_nov2025 < 300000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv_nov2025 >= 300000 AND l3m_avg_cleared_gmv_nov2025 < 700000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv_nov2025 >= 700000 THEN 'Enterprise'
            
            -- Row 3: 101-250 EE
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv_nov2025 < 7000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv_nov2025 >= 7000 AND l3m_avg_cleared_gmv_nov2025 < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv_nov2025 >= 20000 AND l3m_avg_cleared_gmv_nov2025 < 100000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv_nov2025 >= 100000 AND l3m_avg_cleared_gmv_nov2025 < 150000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv_nov2025 >= 150000 AND l3m_avg_cleared_gmv_nov2025 < 300000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv_nov2025 >= 300000 AND l3m_avg_cleared_gmv_nov2025 < 700000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv_nov2025 >= 700000 THEN 'Enterprise'
            
            -- Row 4: 251-500 EE
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv_nov2025 < 7000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv_nov2025 >= 7000 AND l3m_avg_cleared_gmv_nov2025 < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv_nov2025 >= 20000 AND l3m_avg_cleared_gmv_nov2025 < 100000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv_nov2025 >= 100000 AND l3m_avg_cleared_gmv_nov2025 < 150000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv_nov2025 >= 150000 AND l3m_avg_cleared_gmv_nov2025 < 300000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv_nov2025 >= 300000 AND l3m_avg_cleared_gmv_nov2025 < 700000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv_nov2025 >= 700000 THEN 'Enterprise'
            
            -- Row 5: 501-1000 EE
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv_nov2025 < 7000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv_nov2025 >= 7000 AND l3m_avg_cleared_gmv_nov2025 < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv_nov2025 >= 20000 AND l3m_avg_cleared_gmv_nov2025 < 100000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv_nov2025 >= 100000 AND l3m_avg_cleared_gmv_nov2025 < 150000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv_nov2025 >= 150000 AND l3m_avg_cleared_gmv_nov2025 < 300000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv_nov2025 >= 300000 AND l3m_avg_cleared_gmv_nov2025 < 700000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv_nov2025 >= 700000 THEN 'Enterprise'
            
            -- Row 6: >1001 EE
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv_nov2025 < 7000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv_nov2025 >= 7000 AND l3m_avg_cleared_gmv_nov2025 < 20000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv_nov2025 >= 20000 AND l3m_avg_cleared_gmv_nov2025 < 100000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv_nov2025 >= 100000 AND l3m_avg_cleared_gmv_nov2025 < 150000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv_nov2025 >= 150000 AND l3m_avg_cleared_gmv_nov2025 < 300000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv_nov2025 >= 300000 AND l3m_avg_cleared_gmv_nov2025 < 700000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv_nov2025 >= 700000 THEN 'Enterprise'
            
            ELSE 'Unknown'
        END AS segment
    FROM nov_2025_metrics
),

-- Step 3: Generate monthly time series from Feb 2025 to current month
month_series AS (
    SELECT DISTINCT REPORT_MONTH_DATE AS month_date
    FROM coredata.customer.customers_monthly__net_revenue
    WHERE REPORT_MONTH_DATE >= '2025-02-01'
        AND REPORT_MONTH_DATE < DATE_TRUNC('month', CURRENT_DATE())
),

-- Step 4: Get customer status and SaaS info for each month (historical)
monthly_customer_status AS (
    SELECT 
        ms.month_date,
        cs.CUSTOMER_ACCOUNT_ID,
        cs.segment,
        -- Determine SaaS status for EACH MONTH historically
        -- A customer is a SaaS customer in a given month if they had SaaS revenue that month
        CASE 
            WHEN nrr.EMPOWER_REVENUE > 0 
            THEN 1 
            ELSE 0 
        END AS is_saas_customer,
        nrr.EMPOWER_REVENUE AS monthly_saas_revenue,
        -- Also track if customer was active that month
        CASE 
            WHEN nrr.CUSTOMER_ACCOUNT_ID IS NOT NULL 
            THEN 1 
            ELSE 0 
        END AS was_active_this_month
    FROM month_series ms
    CROSS JOIN customer_segments cs
    LEFT JOIN coredata.customer.customers_monthly__net_revenue nrr
        ON cs.CUSTOMER_ACCOUNT_ID = nrr.CUSTOMER_ACCOUNT_ID
        AND ms.month_date = nrr.REPORT_MONTH_DATE
    -- Only include customers that had activity in that month
    WHERE nrr.CUSTOMER_ACCOUNT_ID IS NOT NULL
)

-- Step 5: Aggregate monthly stats by segment
SELECT
    month_date,
    segment,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS total_customers,
    SUM(is_saas_customer) AS saas_customers,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) - SUM(is_saas_customer) AS non_saas_customers,
    -- Format as percentage with 2 decimal places (e.g., 45.67 means 45.67%)
    ROUND(SUM(is_saas_customer) * 100.0 / NULLIF(COUNT(DISTINCT CUSTOMER_ACCOUNT_ID), 0), 2) AS saas_penetration_pct,
    ROUND(AVG(CASE WHEN is_saas_customer = 1 THEN monthly_saas_revenue END), 0) AS avg_monthly_saas_revenue
FROM monthly_customer_status
GROUP BY month_date, segment
ORDER BY month_date, 
    CASE segment
        WHEN 'Enterprise' THEN 1
        WHEN 'Mid-Market' THEN 2
        WHEN 'Growth' THEN 3
        WHEN 'BSC' THEN 4
        WHEN 'Unassigned' THEN 5
        ELSE 6
    END;

