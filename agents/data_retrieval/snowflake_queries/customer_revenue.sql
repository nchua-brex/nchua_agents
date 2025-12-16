-- Customer Revenue Analysis Query Template
-- Retrieves customer revenue data with flexible date ranges and segments

SELECT 
    c.customer_id,
    c.customer_name,
    c.segment,
    c.edition,
    cr.revenue_month,
    cr.net_revenue,
    cr.gross_revenue,
    cr.churned_revenue,
    cr.expansion_revenue,
    cr.contraction_revenue
FROM coredata.customer.customers_monthly__net_revenue cr
JOIN coredata.salesforce.accounts c ON cr.customer_id = c.id
WHERE 1=1
    AND cr.revenue_month >= '{start_date}'::date
    AND cr.revenue_month <= '{end_date}'::date
    -- Dynamic segment filter
    {% if segment %}
    AND c.segment = '{segment}'
    {% endif %}
    -- Business rules
    AND c.type != 'Test Account'
    AND c.is_active = true
    AND cr.net_revenue > 0
ORDER BY cr.revenue_month DESC, cr.net_revenue DESC