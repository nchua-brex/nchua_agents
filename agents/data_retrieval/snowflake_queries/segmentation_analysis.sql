-- Segmentation Analysis Query Template
-- Analyzes customer segmentation distribution and changes

WITH current_segments AS (
    SELECT 
        c.customer_id,
        c.customer_name,
        c.segment as current_segment,
        c.edition,
        c.obs_segment,
        cr.net_revenue,
        cr.revenue_month,
        ROW_NUMBER() OVER (PARTITION BY c.customer_id ORDER BY cr.revenue_month DESC) as rn
    FROM coredata.salesforce.accounts c
    JOIN coredata.customer.customers_monthly__net_revenue cr ON c.id = cr.customer_id
    WHERE c.type != 'Test Account'
    AND c.is_active = true
),

segment_summary AS (
    SELECT 
        current_segment,
        COUNT(*) as customer_count,
        SUM(net_revenue) as total_revenue,
        AVG(net_revenue) as avg_revenue,
        MIN(net_revenue) as min_revenue,
        MAX(net_revenue) as max_revenue
    FROM current_segments 
    WHERE rn = 1  -- Most recent month only
    GROUP BY current_segment
)

{% if analysis_type == 'current' %}
SELECT 
    current_segment,
    customer_count,
    total_revenue,
    avg_revenue,
    min_revenue,
    max_revenue,
    ROUND(100.0 * customer_count / SUM(customer_count) OVER (), 2) as pct_of_customers,
    ROUND(100.0 * total_revenue / SUM(total_revenue) OVER (), 2) as pct_of_revenue
FROM segment_summary
ORDER BY total_revenue DESC

{% elif analysis_type == 'historical' %}
SELECT 
    cs.revenue_month,
    cs.current_segment,
    COUNT(*) as customer_count,
    SUM(cs.net_revenue) as total_revenue,
    AVG(cs.net_revenue) as avg_revenue
FROM current_segments cs
WHERE cs.revenue_month >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY cs.revenue_month, cs.current_segment
ORDER BY cs.revenue_month DESC, total_revenue DESC

{% elif analysis_type == 'changes' %}
-- Analysis of segment changes over time would go here
SELECT 
    'Segment change analysis not yet implemented' as message,
    CURRENT_TIMESTAMP as timestamp

{% endif %}