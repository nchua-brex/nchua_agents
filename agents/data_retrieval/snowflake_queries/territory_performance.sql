-- Territory Performance Query Template
-- Analyzes Solutions Consultant territory performance and metrics

WITH territory_metrics AS (
    SELECT 
        o.owner_email as sc_owner,
        o.owner_name,
        COUNT(DISTINCT c.customer_id) as total_customers,
        SUM(cr.net_revenue) as total_revenue,
        COUNT(DISTINCT CASE WHEN o.stage_name = 'Closed Won' THEN o.opportunity_id END) as closed_won_count,
        SUM(CASE WHEN o.stage_name = 'Closed Won' THEN o.amount END) as closed_won_revenue,
        COUNT(DISTINCT CASE WHEN o.created_date >= CURRENT_DATE - INTERVAL '90 days' THEN o.opportunity_id END) as new_opps_90d
    FROM coredata.salesforce.opportunities o
    JOIN coredata.salesforce.accounts c ON o.account_id = c.id
    LEFT JOIN coredata.customer.customers_monthly__net_revenue cr ON c.id = cr.customer_id
    WHERE 1=1
        -- Time period filter
        {% if period == 'current_quarter' %}
        AND o.created_date >= DATE_TRUNC('quarter', CURRENT_DATE)
        {% elif period == 'last_quarter' %}
        AND o.created_date >= DATE_TRUNC('quarter', CURRENT_DATE) - INTERVAL '3 months'
        AND o.created_date < DATE_TRUNC('quarter', CURRENT_DATE)
        {% elif period == 'ytd' %}
        AND o.created_date >= DATE_TRUNC('year', CURRENT_DATE)
        {% endif %}
        -- SC owner filter
        {% if sc_owner %}
        AND o.owner_email = '{sc_owner}'
        {% endif %}
        -- Business rules
        AND c.type != 'Test Account'
        AND o.record_type_name = 'New Business'
    GROUP BY o.owner_email, o.owner_name
)

SELECT 
    sc_owner,
    owner_name,
    total_customers,
    total_revenue,
    closed_won_count,
    closed_won_revenue,
    new_opps_90d,
    CASE 
        WHEN total_customers > 0 
        THEN total_revenue / total_customers 
        ELSE 0 
    END as avg_revenue_per_customer,
    CASE 
        WHEN new_opps_90d > 0 
        THEN closed_won_count::float / new_opps_90d 
        ELSE 0 
    END as win_rate_90d
FROM territory_metrics
ORDER BY total_revenue DESC