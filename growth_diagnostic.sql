-- Diagnostic: Count Growth customers by each criteria
WITH customer_metrics AS (
    SELECT
        cw.CUSTOMER_ACCOUNT_ID,
        cw.DBA_NAME,
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
    GROUP BY 1, 2, 3
)

SELECT
    'Growth: 0-25 EE, $120K-$200K GMV' AS growth_criteria,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS customer_count
FROM customer_metrics
WHERE EMPLOYEE_COUNT BETWEEN 0 AND 25 
  AND l3m_avg_cleared_gmv >= 120000 
  AND l3m_avg_cleared_gmv < 200000

UNION ALL

SELECT
    'Growth: 26-50 EE, $120K-$200K GMV' AS growth_criteria,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS customer_count
FROM customer_metrics
WHERE EMPLOYEE_COUNT BETWEEN 26 AND 50 
  AND l3m_avg_cleared_gmv >= 120000 
  AND l3m_avg_cleared_gmv < 200000

UNION ALL

SELECT
    'Growth: 51-100 EE, $100K-$120K GMV' AS growth_criteria,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS customer_count
FROM customer_metrics
WHERE EMPLOYEE_COUNT BETWEEN 51 AND 100 
  AND l3m_avg_cleared_gmv >= 100000 
  AND l3m_avg_cleared_gmv < 120000

UNION ALL

SELECT
    'Growth: 101-250 EE, $100K-$120K GMV' AS growth_criteria,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS customer_count
FROM customer_metrics
WHERE EMPLOYEE_COUNT BETWEEN 101 AND 250 
  AND l3m_avg_cleared_gmv >= 100000 
  AND l3m_avg_cleared_gmv < 120000

UNION ALL

SELECT
    'Growth: 251-500 EE, $100K-$120K GMV' AS growth_criteria,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS customer_count
FROM customer_metrics
WHERE EMPLOYEE_COUNT BETWEEN 251 AND 500 
  AND l3m_avg_cleared_gmv >= 100000 
  AND l3m_avg_cleared_gmv < 120000

UNION ALL

SELECT
    'Growth: 501-1000 EE, $100K-$120K GMV' AS growth_criteria,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS customer_count
FROM customer_metrics
WHERE EMPLOYEE_COUNT BETWEEN 501 AND 1000 
  AND l3m_avg_cleared_gmv >= 100000 
  AND l3m_avg_cleared_gmv < 120000

UNION ALL

SELECT
    'TOTAL GROWTH (all criteria combined)' AS growth_criteria,
    COUNT(DISTINCT CUSTOMER_ACCOUNT_ID) AS customer_count
FROM customer_metrics
WHERE (
    (EMPLOYEE_COUNT BETWEEN 0 AND 25 AND l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000)
    OR (EMPLOYEE_COUNT BETWEEN 26 AND 50 AND l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000)
    OR (EMPLOYEE_COUNT BETWEEN 51 AND 100 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000)
    OR (EMPLOYEE_COUNT BETWEEN 101 AND 250 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000)
    OR (EMPLOYEE_COUNT BETWEEN 251 AND 500 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000)
    OR (EMPLOYEE_COUNT BETWEEN 501 AND 1000 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000)
);








