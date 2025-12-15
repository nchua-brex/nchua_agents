-- ============================================================================
-- SaaS TAM Analysis - Detailed Matrix View (FY26)
-- ============================================================================
-- Purpose: Show customer distribution across the full segmentation matrix
-- Output: Customers by EE Bucket x GMV Bucket with segment assignment
-- ============================================================================

WITH customer_metrics AS (
    -- Calculate L3M average cleared GMV and get employee count
    SELECT
        cw.CUSTOMER_ACCOUNT_ID,
        cw.DBA_NAME,
        cw.EMPLOYEE_COUNT,
        cw.EMPOWER_EDITION,
        AVG(nrr.CLEARED_GMV_AMOUNT) AS l3m_avg_cleared_gmv,
        -- Flag for SaaS customers
        CASE 
            WHEN cw.EMPOWER_EDITION IN ('Premium Edition', 'Enterprise Edition') 
            THEN 1 
            ELSE 0 
        END AS is_saas_customer
    FROM coredata.customer.customer_wide cw
    LEFT JOIN coredata.customer.customers_monthly__net_revenue nrr 
        ON cw.CUSTOMER_ACCOUNT_ID = nrr.CUSTOMER_ACCOUNT_ID
        -- Last 3 months (L3M)
        AND nrr.REPORT_MONTH_DATE >= DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE))
        AND nrr.REPORT_MONTH_DATE < DATE_TRUNC('month', CURRENT_DATE)
    WHERE cw.INTERNAL_ACCOUNT_TYPE = 'customer_account'
        AND cw.STATUS = 'active'
        AND cw.EMPLOYEE_COUNT IS NOT NULL
    GROUP BY 1, 2, 3, 4
),

segmented_customers AS (
    -- Apply segmentation logic from matrix
    SELECT
        CUSTOMER_ACCOUNT_ID,
        DBA_NAME,
        EMPLOYEE_COUNT,
        l3m_avg_cleared_gmv,
        EMPOWER_EDITION,
        is_saas_customer,
        
        -- Employee Count Bucket
        CASE
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 THEN '0-25'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 THEN '26-50'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 THEN '51-100'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 THEN '101-250'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 THEN '251-500'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 THEN '501-1000'
            WHEN EMPLOYEE_COUNT > 1000 THEN '>1001'
            ELSE 'Unknown'
        END AS ee_bucket,
        
        -- For ordering EE buckets
        CASE
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 THEN 1
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 THEN 2
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 THEN 3
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 THEN 4
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 THEN 5
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 THEN 6
            WHEN EMPLOYEE_COUNT > 1000 THEN 7
            ELSE 8
        END AS ee_bucket_order,
        
        -- GMV Bucket
        CASE
            WHEN l3m_avg_cleared_gmv < 10000 THEN '0-10k'
            WHEN l3m_avg_cleared_gmv >= 10000 AND l3m_avg_cleared_gmv < 20000 THEN '10k-20k'
            WHEN l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN '20k-100k'
            WHEN l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000 THEN '100k-120k'
            WHEN l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000 THEN '120k-200k'
            WHEN l3m_avg_cleared_gmv >= 200000 AND l3m_avg_cleared_gmv < 600000 THEN '200k-600k'
            WHEN l3m_avg_cleared_gmv >= 600000 THEN '>600k'
            ELSE 'Unknown'
        END AS gmv_bucket,
        
        -- For ordering GMV buckets
        CASE
            WHEN l3m_avg_cleared_gmv < 10000 THEN 1
            WHEN l3m_avg_cleared_gmv >= 10000 AND l3m_avg_cleared_gmv < 20000 THEN 2
            WHEN l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 3
            WHEN l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000 THEN 4
            WHEN l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000 THEN 5
            WHEN l3m_avg_cleared_gmv >= 200000 AND l3m_avg_cleared_gmv < 600000 THEN 6
            WHEN l3m_avg_cleared_gmv >= 600000 THEN 7
            ELSE 8
        END AS gmv_bucket_order,
        
        -- Segment Assignment based on matrix
        CASE
            -- Row 0: 0-25 EE
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv < 10000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv >= 10000 AND l3m_avg_cleared_gmv < 20000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv >= 200000 AND l3m_avg_cleared_gmv < 600000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv >= 600000 THEN 'Enterprise'
            
            -- Row 1: 26-50 EE
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv < 10000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv >= 10000 AND l3m_avg_cleared_gmv < 20000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv >= 200000 AND l3m_avg_cleared_gmv < 600000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv >= 600000 THEN 'Enterprise'
            
            -- Row 2: 51-100 EE
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv < 10000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv >= 10000 AND l3m_avg_cleared_gmv < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv >= 200000 AND l3m_avg_cleared_gmv < 600000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv >= 600000 THEN 'Enterprise'
            
            -- Row 3: 101-250 EE
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv < 10000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv >= 10000 AND l3m_avg_cleared_gmv < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv >= 200000 AND l3m_avg_cleared_gmv < 600000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv >= 600000 THEN 'Enterprise'
            
            -- Row 4: 251-500 EE
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv < 10000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv >= 10000 AND l3m_avg_cleared_gmv < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv >= 200000 AND l3m_avg_cleared_gmv < 600000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv >= 600000 THEN 'Enterprise'
            
            -- Row 5: 501-1000 EE
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv < 10000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv >= 10000 AND l3m_avg_cleared_gmv < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv >= 200000 AND l3m_avg_cleared_gmv < 600000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv >= 600000 THEN 'Enterprise'
            
            -- Row 6: >1001 EE
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv < 10000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 10000 AND l3m_avg_cleared_gmv < 20000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 200000 AND l3m_avg_cleared_gmv < 600000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 600000 THEN 'Enterprise'
            
            ELSE 'Unknown'
        END AS segment
    FROM customer_metrics
)

-- Matrix View: Customer counts by EE x GMV bucket
SELECT
    ee_bucket AS employee_count_bucket,
    gmv_bucket,
    segment,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS total_customers,
    SUM(is_saas_customer) AS saas_customers,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) - SUM(is_saas_customer) AS non_saas_customers,
    ROUND(SUM(is_saas_customer) * 100.0 / NULLIF(COUNT(DISTINCT CUSTOMER_ACCOUNT_ID), 0), 2) AS saas_penetration_pct
FROM segmented_customers
GROUP BY ee_bucket, ee_bucket_order, gmv_bucket, gmv_bucket_order, segment
ORDER BY ee_bucket_order, gmv_bucket_order;








