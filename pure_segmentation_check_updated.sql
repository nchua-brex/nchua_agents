-- ============================================================================
-- Pure FY27 Post-Sales Segmentation Check (UPDATED RANGES)
-- ============================================================================
-- Purpose: Validate customer counts by segment (NO SaaS filtering)
-- Just pure segmentation based on EE Count and L3M Avg Cleared GMV
-- GMV Ranges: 0-7k, 7k-20k, 20k-100k, 100k-150k, 150k-300k, 300k-700k, >700k
-- EE Ranges: 0-25, 26-50, 51-100, 101-250, 251-500, 501-1000, >1001
-- ============================================================================

WITH customer_metrics AS (
    -- Calculate L3M average cleared GMV and get employee count
    SELECT
        cw.CUSTOMER_ACCOUNT_ID,
        cw.DBA_NAME,
        cw.EMPLOYEE_COUNT,
        cw.EMPOWER_EDITION,
        AVG(nrr.CLEARED_GMV_AMOUNT) AS l3m_avg_cleared_gmv
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
        
        -- Segment Assignment based on FY27 PS Segmentation Matrix
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

-- Pure segmentation counts (no SaaS filter)
SELECT
    segment,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS total_customers,
    ROUND(COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) * 100.0 / SUM(COUNT(DISTINCT CUSTOMER_ACCOUNT_ID)) OVER (), 2) AS pct_of_customers,
    ROUND(AVG(EMPLOYEE_COUNT), 0) AS avg_employee_count,
    ROUND(AVG(l3m_avg_cleared_gmv), 0) AS avg_l3m_cleared_gmv
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






