-- Reference SQL Queries from Data Team
-- These are validated patterns for analyzing Brex customer data

-- ============================================================================
-- Customer Edition Analysis (SaaS vs Non-SaaS)
-- Source: Data Team - Customer Revenue by Edition
-- Purpose: Compare metrics across customer editions (Premium, Enterprise, Essentials)
-- ============================================================================

WITH customers AS (
    SELECT
        cw.customer_account_id,
        CASE
            WHEN cw.empower_edition LIKE '%Essentials%' THEN 'Essentials Edition'
            ELSE cw.empower_edition 
        END AS actual_edition,
        cw.employee_count,
        AVG(nrr.cleared_gmv_amount) AS avg_l3m_cleared_gmv,
        AVG(nrr.empower_revenue) AS avg_l3m_saas_revenue,
        AVG(nrr.net_revenue) AS avg_l3m_net_revenue,
        SUM(nrr.cleared_gmv_amount) AS cleared_gmv_amount,
        SUM(nrr.empower_revenue) AS empower_revenue,
        SUM(nrr.net_revenue) AS net_revenue
    FROM coredata.customer.customer_wide cw
    LEFT JOIN coredata.customer.customers_monthly__net_revenue nrr 
        ON cw.customer_account_id = nrr.customer_account_id 
        AND nrr.report_month_date >= DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE)) 
        AND nrr.report_month_date < DATE_TRUNC('month', CURRENT_DATE)
    WHERE cw.internal_account_type = 'customer_account'
        AND actual_edition IS NOT NULL
        AND cw.status = 'active'
    GROUP BY 1, 2, 3
    ORDER BY 1
)

SELECT
    actual_edition,
    COUNT(DISTINCT customer_account_id) AS num_customers,
    num_customers / SUM(num_customers) OVER () AS perc_of_customers,
    SUM(cleared_gmv_amount) AS cleared_gmv,
    cleared_gmv / SUM(cleared_gmv) OVER () AS perc_of_gmv,
    AVG(avg_l3m_cleared_gmv) AS avg_l3m_cleared_gmv_per_cust,
    SUM(empower_revenue) AS saas_revenue,
    saas_revenue / SUM(saas_revenue) OVER () AS perc_of_saas_revenue,
    AVG(avg_l3m_saas_revenue) AS avg_l3m_saas_revenue_per_cust,
    SUM(net_revenue) AS net_revenue_,
    net_revenue_ / SUM(net_revenue_) OVER () AS perc_of_net_revenue,
    AVG(avg_l3m_net_revenue) AS avg_l3m_net_revenue_per_cust,
    AVG(employee_count) AS avg_employee_count,
    MEDIAN(employee_count) AS median_employee_count
FROM customers
GROUP BY 1
ORDER BY 1;

-- ============================================================================
-- Customer Edition Analysis by One Brex Segment (OBS)
-- Source: Data Team - Customer Revenue by Edition and OBS
-- Purpose: Analyze metrics by both edition and OBS (Finance segmentation)
-- ============================================================================

WITH customers AS (
    SELECT
        cw.customer_account_id,
        CASE
            WHEN cw.empower_edition LIKE '%Essentials%' THEN 'Essentials Edition'
            ELSE cw.empower_edition 
        END AS actual_edition,
        cw.one_brex_segment AS obs,
        cw.employee_count,
        AVG(nrr.cleared_gmv_amount) AS avg_l3m_cleared_gmv,
        AVG(nrr.empower_revenue) AS avg_l3m_saas_revenue,
        AVG(nrr.net_revenue) AS avg_l3m_net_revenue,
        SUM(nrr.cleared_gmv_amount) AS cleared_gmv_amount,
        SUM(nrr.empower_revenue) AS empower_revenue,
        SUM(nrr.net_revenue) AS net_revenue
    FROM coredata.customer.customer_wide cw
    LEFT JOIN coredata.customer.customers_monthly__net_revenue nrr 
        ON cw.customer_account_id = nrr.customer_account_id 
        AND nrr.report_month_date >= DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE)) 
        AND nrr.report_month_date < DATE_TRUNC('month', CURRENT_DATE)
    WHERE cw.internal_account_type = 'customer_account'
        AND actual_edition IS NOT NULL
        AND cw.status = 'active'
        AND cw.one_brex_segment IS NOT NULL
    GROUP BY 1, 2, 3, 4
    ORDER BY 1
)

SELECT
    actual_edition,
    obs,
    COUNT(DISTINCT customer_account_id) AS num_customers,
    num_customers / SUM(num_customers) OVER () AS perc_of_customers,
    SUM(cleared_gmv_amount) AS cleared_gmv,
    cleared_gmv / SUM(cleared_gmv) OVER () AS perc_of_gmv,
    AVG(avg_l3m_cleared_gmv) AS avg_l3m_cleared_gmv_per_cust,
    SUM(empower_revenue) AS saas_revenue,
    saas_revenue / SUM(saas_revenue) OVER () AS perc_of_saas_revenue,
    AVG(avg_l3m_saas_revenue) AS avg_l3m_saas_revenue_per_cust,
    SUM(net_revenue) AS net_revenue_,
    net_revenue_ / SUM(net_revenue_) OVER () AS perc_of_net_revenue,
    AVG(avg_l3m_net_revenue) AS avg_l3m_net_revenue_per_cust,
    AVG(employee_count) AS avg_employee_count,
    MEDIAN(employee_count) AS median_employee_count
FROM customers
GROUP BY 1, 2
ORDER BY 1, 2;

-- ============================================================================
-- Cohort Analysis by Customer Edition
-- Source: Data Team - Customer Revenue by Edition and Cohort
-- Purpose: Analyze how business evolves over time across different customer start points
-- ============================================================================

WITH customers AS (
    SELECT
        cw.customer_account_id,
        CASE
            WHEN cw.empower_edition LIKE '%Essentials%' THEN 'Essentials Edition'
            ELSE cw.empower_edition 
        END AS actual_edition,
        DATE_TRUNC('year', cohort_start_date) AS cohort_start_year,
        cw.employee_count,
        AVG(nrr.cleared_gmv_amount) AS avg_l3m_cleared_gmv,
        AVG(nrr.empower_revenue) AS avg_l3m_saas_revenue,
        AVG(nrr.net_revenue) AS avg_l3m_net_revenue,
        SUM(nrr.cleared_gmv_amount) AS cleared_gmv_amount,
        SUM(nrr.empower_revenue) AS empower_revenue,
        SUM(nrr.net_revenue) AS net_revenue
    FROM coredata.customer.customer_wide cw
    LEFT JOIN coredata.customer.customers_monthly__net_revenue nrr 
        ON cw.customer_account_id = nrr.customer_account_id 
        AND nrr.report_month_date >= DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE)) 
        AND nrr.report_month_date < DATE_TRUNC('month', CURRENT_DATE)
    WHERE cw.internal_account_type = 'customer_account'
        AND actual_edition IS NOT NULL
        AND cw.status = 'active'
        AND cohort_start_date IS NOT NULL
    GROUP BY 1, 2, 3, 4
    ORDER BY 1
)

SELECT
    actual_edition,
    cohort_start_year,
    COUNT(DISTINCT customer_account_id) AS num_customers,
    num_customers / SUM(num_customers) OVER () AS perc_of_customers,
    SUM(cleared_gmv_amount) AS cleared_gmv,
    cleared_gmv / SUM(cleared_gmv) OVER () AS perc_of_gmv,
    AVG(avg_l3m_cleared_gmv) AS avg_l3m_cleared_gmv_per_cust,
    SUM(empower_revenue) AS saas_revenue,
    saas_revenue / SUM(saas_revenue) OVER () AS perc_of_saas_revenue,
    AVG(avg_l3m_saas_revenue) AS avg_l3m_saas_revenue_per_cust,
    SUM(net_revenue) AS net_revenue_,
    net_revenue_ / SUM(net_revenue_) OVER () AS perc_of_net_revenue,
    AVG(avg_l3m_net_revenue) AS avg_l3m_net_revenue_per_cust,
    AVG(employee_count) AS avg_employee_count,
    MEDIAN(employee_count) AS median_employee_count
FROM customers
GROUP BY 1, 2
ORDER BY 1, 2;

-- ============================================================================
-- Key Patterns to Follow:
-- ============================================================================
-- 1. Always filter by internal_account_type = 'customer_account' for actual customers
-- 2. Use status = 'active' to focus on active customers
-- 3. Normalize Essentials edition variations with CASE WHEN
-- 4. L3M (Last 3 Months) pattern: 
--    DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE)) to < DATE_TRUNC('month', CURRENT_DATE)
-- 5. Use window functions for percentage calculations across groups
-- 6. Primary join key is customer_account_id (not customer_id)
-- 7. Edition types:
--    - SaaS: 'Premium Edition', 'Enterprise Edition'  
--    - Non-SaaS: Any edition containing 'Essentials'
-- 8. One Brex Segment (OBS) - Finance segmentation:
--    - Early Stage, Growth, Mid-Market, Enterprise
--    - NOTE: OBS is Finance's segmentation. Revenue Operations uses different segments.
--    - Filter: one_brex_segment IS NOT NULL
--    - Optional one-off trick for custom sorting (not recommended as default):
--      CASE WHEN one_brex_segment = 'Early Stage' THEN 'a. Early Stage' ... END
-- 9. Cohort Analysis:
--    - Field: cohort_start_date from customer_wide
--    - Purpose: Track customer evolution over time by acquisition period
--    - Common periods: DATE_TRUNC('year', ...), DATE_TRUNC('quarter', ...), DATE_TRUNC('month', ...)
--    - Filter: cohort_start_date IS NOT NULL
--    - Use cases: retention, revenue growth, product adoption, LTV analysis

