-- Customer Edition Analysis (SaaS vs Non-SaaS)
-- Source: Data Team - Customer Revenue by Edition
-- Purpose: Compare metrics across customer editions (Premium, Enterprise, Essentials)
-- Template parameters: {{start_date}}, {{end_date}}, {{edition_filter}}

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
        AND nrr.report_month_date >= COALESCE('{{start_date}}', DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE)))
        AND nrr.report_month_date < COALESCE('{{end_date}}', DATE_TRUNC('month', CURRENT_DATE))
    WHERE cw.internal_account_type = 'customer_account'
        AND actual_edition IS NOT NULL
        AND cw.status = 'active'
        {{#if edition_filter}}
        AND actual_edition = '{{edition_filter}}'
        {{/if}}
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