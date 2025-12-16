-- ============================================================================
-- SaaS TAM Analysis by New Post-Sales Segmentation (FY27)
-- ============================================================================
-- Purpose: Analyze Total Addressable Market for SaaS across new segments
-- Segmentation based on:
--   - Brex EE Count (Employee Count): 0-25, 26-50, 51-100, 101-250, 251-500, 501-1000, >1001
--   - L3M Average Cleared GMV: 0-7k, 7k-20k, 20k-100k, 100k-150k, 150k-300k, 300k-700k, >700k
-- Updated: December 10, 2025 with new GMV thresholds
-- ============================================================================

WITH customer_metrics AS (
    -- Calculate L3M average cleared GMV and SaaS revenue, and get employee count
    SELECT
        cw.CUSTOMER_ACCOUNT_ID,
        cw.DBA_NAME,
        cw.EMPLOYEE_COUNT,
        cw.EMPOWER_EDITION,
        AVG(nrr.CLEARED_GMV_AMOUNT) AS l3m_avg_cleared_gmv,
        AVG(nrr.EMPOWER_REVENUE) AS l3m_avg_saas_revenue,
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
        l3m_avg_saas_revenue,
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
        
        -- GMV Bucket
        CASE
            WHEN l3m_avg_cleared_gmv < 7000 THEN '0-7k'
            WHEN l3m_avg_cleared_gmv >= 7000 AND l3m_avg_cleared_gmv < 20000 THEN '7k-20k'
            WHEN l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN '20k-100k'
            WHEN l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 150000 THEN '100k-150k'
            WHEN l3m_avg_cleared_gmv >= 150000 AND l3m_avg_cleared_gmv < 300000 THEN '150k-300k'
            WHEN l3m_avg_cleared_gmv >= 300000 AND l3m_avg_cleared_gmv < 700000 THEN '300k-700k'
            WHEN l3m_avg_cleared_gmv >= 700000 THEN '>700k'
            ELSE 'Unknown'
        END AS gmv_bucket,
        
        -- Segment Assignment based on matrix
        CASE
            -- Row 0: 0-25 EE
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv < 7000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv >= 7000 AND l3m_avg_cleared_gmv < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 150000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv >= 150000 AND l3m_avg_cleared_gmv < 300000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv >= 300000 AND l3m_avg_cleared_gmv < 700000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv >= 700000 THEN 'Enterprise'
            
            -- Row 1: 26-50 EE
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv < 7000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv >= 7000 AND l3m_avg_cleared_gmv < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 150000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv >= 150000 AND l3m_avg_cleared_gmv < 300000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv >= 300000 AND l3m_avg_cleared_gmv < 700000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv >= 700000 THEN 'Enterprise'
            
            -- Row 2: 51-100 EE
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv < 7000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv >= 7000 AND l3m_avg_cleared_gmv < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 150000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv >= 150000 AND l3m_avg_cleared_gmv < 300000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv >= 300000 AND l3m_avg_cleared_gmv < 700000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv >= 700000 THEN 'Enterprise'
            
            -- Row 3: 101-250 EE
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv < 7000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv >= 7000 AND l3m_avg_cleared_gmv < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 150000 THEN 'Growth'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv >= 150000 AND l3m_avg_cleared_gmv < 300000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv >= 300000 AND l3m_avg_cleared_gmv < 700000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv >= 700000 THEN 'Enterprise'
            
            -- Row 4: 251-500 EE
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv < 7000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv >= 7000 AND l3m_avg_cleared_gmv < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 150000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv >= 150000 AND l3m_avg_cleared_gmv < 300000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv >= 300000 AND l3m_avg_cleared_gmv < 700000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv >= 700000 THEN 'Enterprise'
            
            -- Row 5: 501-1000 EE
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv < 7000 THEN 'Unassigned'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv >= 7000 AND l3m_avg_cleared_gmv < 20000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 150000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv >= 150000 AND l3m_avg_cleared_gmv < 300000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv >= 300000 AND l3m_avg_cleared_gmv < 700000 THEN 'Mid-Market'
            WHEN EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv >= 700000 THEN 'Enterprise'
            
            -- Row 6: >1001 EE
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv < 7000 THEN 'BSC'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 7000 AND l3m_avg_cleared_gmv < 20000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 100000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 150000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 150000 AND l3m_avg_cleared_gmv < 300000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 300000 AND l3m_avg_cleared_gmv < 700000 THEN 'Enterprise'
            WHEN EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 700000 THEN 'Enterprise'
            
            ELSE 'Unknown'
        END AS segment
    FROM customer_metrics
)

-- Final Summary: TAM by Segment
SELECT
    segment,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS total_customers,
    SUM(is_saas_customer) AS saas_customers,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) - SUM(is_saas_customer) AS non_saas_customers,
    ROUND(SUM(is_saas_customer) * 100.0 / COUNT(DISTINCT CUSTOMER_ACCOUNT_ID), 2) AS saas_penetration_pct,
    ROUND(AVG(EMPLOYEE_COUNT), 0) AS avg_employee_count,
    ROUND(AVG(l3m_avg_saas_revenue), 0) AS avg_l3m_saas_revenue
FROM segmented_customers
GROUP BY segment
ORDER BY 
    CASE segment
        WHEN 'Enterprise' THEN 1
        WHEN 'Mid-Market' THEN 2
        WHEN 'Growth' THEN 3
        WHEN 'BSC' THEN 4
        WHEN 'Unassigned' THEN 5
        ELSE 6
    END;

