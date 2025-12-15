-- Show distribution across all segments with clear breakdown
WITH customer_metrics AS (
    SELECT
        cw.CUSTOMER_ACCOUNT_ID,
        cw.EMPLOYEE_COUNT,
        AVG(nrr.CLEARED_GMV_AMOUNT) AS l3m_avg_cleared_gmv
    FROM coredata.customer.customer_wide cw
    LEFT JOIN coredata.customer.customers_monthly__net_revenue nrr 
        ON cw.CUSTOMER_ACCOUNT_ID = nrr.CUSTOMER_ACCOUNT_ID
        AND nrr.REPORT_MONTH_DATE >= DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE))
        AND nrr.REPORT_MONTH_DATE < DATE_TRUNC('month', CURRENT_DATE)
    WHERE cw.INTERNAL_ACCOUNT_TYPE = 'customer_account'
        AND cw.STATUS = 'active'
        AND cw.EMPLOYEE_COUNT IS NOT NULL
    GROUP BY 1, 2
)

SELECT
    'Total Active Customers' AS metric,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS count
FROM customer_metrics

UNION ALL

SELECT
    'Enterprise (>$600K GMV OR >1000 EE)' AS metric,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS count
FROM customer_metrics
WHERE (l3m_avg_cleared_gmv >= 600000)
   OR (EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 10000)

UNION ALL

SELECT
    'Mid-Market ($120-600K GMV, various EE)' AS metric,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS count  
FROM customer_metrics
WHERE (
    (EMPLOYEE_COUNT BETWEEN 0 AND 50 AND l3m_avg_cleared_gmv >= 200000 AND l3m_avg_cleared_gmv < 600000)
    OR (EMPLOYEE_COUNT BETWEEN 51 AND 1000 AND l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 600000)
)

UNION ALL

SELECT
    'Growth ($100-120K for 51+ EE, $120-200K for 0-50 EE)' AS metric,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS count
FROM customer_metrics
WHERE (
    (EMPLOYEE_COUNT BETWEEN 0 AND 50 AND l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000)
    OR (EMPLOYEE_COUNT BETWEEN 51 AND 1000 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000)
)

UNION ALL

SELECT
    'BSC ($10-100K GMV OR $100-120K with 0-50 EE)' AS metric,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS count
FROM customer_metrics
WHERE (
    (EMPLOYEE_COUNT BETWEEN 0 AND 50 AND l3m_avg_cleared_gmv >= 20000 AND l3m_avg_cleared_gmv < 120000)
    OR (EMPLOYEE_COUNT BETWEEN 51 AND 1000 AND l3m_avg_cleared_gmv >= 10000 AND l3m_avg_cleared_gmv < 100000)
    OR (EMPLOYEE_COUNT > 1000 AND l3m_avg_cleared_gmv >= 0 AND l3m_avg_cleared_gmv < 10000)
)

UNION ALL

SELECT
    'Unassigned (<$20K GMV for 0-50 EE, <$10K for others)' AS metric,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS count
FROM customer_metrics
WHERE (
    (EMPLOYEE_COUNT BETWEEN 0 AND 50 AND (l3m_avg_cleared_gmv < 20000 OR l3m_avg_cleared_gmv IS NULL))
    OR (EMPLOYEE_COUNT > 50 AND EMPLOYEE_COUNT <= 1000 AND (l3m_avg_cleared_gmv < 10000 OR l3m_avg_cleared_gmv IS NULL))
    OR (EMPLOYEE_COUNT > 1000 AND (l3m_avg_cleared_gmv < 10000 OR l3m_avg_cleared_gmv IS NULL))
);








