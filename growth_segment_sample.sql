-- Sample Growth segment customers to validate segmentation
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
    CUSTOMER_ACCOUNT_ID,
    DBA_NAME,
    EMPLOYEE_COUNT,
    ROUND(l3m_avg_cleared_gmv, 0) AS l3m_avg_cleared_gmv,
    CASE
        WHEN EMPLOYEE_COUNT BETWEEN 0 AND 50 AND l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000 THEN 'Growth'
        WHEN EMPLOYEE_COUNT BETWEEN 51 AND 1000 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000 THEN 'Growth'
        ELSE 'Not Growth'
    END AS segment
FROM customer_metrics
WHERE (
    (EMPLOYEE_COUNT BETWEEN 0 AND 50 AND l3m_avg_cleared_gmv >= 120000 AND l3m_avg_cleared_gmv < 200000)
    OR (EMPLOYEE_COUNT BETWEEN 51 AND 1000 AND l3m_avg_cleared_gmv >= 100000 AND l3m_avg_cleared_gmv < 120000)
)
ORDER BY EMPLOYEE_COUNT, l3m_avg_cleared_gmv
LIMIT 20;








