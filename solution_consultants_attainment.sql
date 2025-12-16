WITH workday_employees AS (
    SELECT *
    FROM WORKDAY.WORKDAY.EMPLOYEES
    QUALIFY ROW_NUMBER() OVER(PARTITION BY email ORDER BY _fivetran_deleted, _fivetran_synced DESC) = 1
),

base_data AS (
    SELECT 
        -- Rep and Customer identifiers
        monthly.rep_receiving_comm_rev_credit,
        we.employee_id,
        we.first_name || ' ' || we.last_name AS rep_name,
        opp.owner_name AS opportunity_owner_name,
        monthly.rep_manager_receiving_comm_rev_credit AS rep_manager,
        ahp.customer_account_id,
        cw.dba_name AS customer_name,
        ahp.opportunity_id_determining_account_holding,
        opp.name AS opportunity_name,
        ahp.owner_segment_territory_role AS segment,
        
        -- Account holding period details
        ahp.account_holding_period_start_date,
        ahp.account_holding_period_end_date,
        ahp.activation_date,
        ahp.card_activation_date,
        ahp.close_date,
        
        -- Non-SAAS accrual period
        ahp.non_saas_commissionable_revenue_accrual_start_date,
        ahp.non_saas_commissionable_revenue_accrual_end_date,
        
        -- Baseline metrics
        ahp.baseline_gmv,
        ahp.baseline_net_interchange_revenue,
        ahp.baseline_interchange_rate,
        ahp.baseline_rewards_rate,
        
        -- Monthly metrics
        DATE_TRUNC('month', monthly.calendar_month) AS revenue_month,
        monthly.billing_terms,
        monthly.choose_rewards_offer AS rewards_offer,
        
        -- Commissionable revenue
        monthly.commissionable_revenue,
        monthly.cse_commissionable_revenue,
        monthly.gmv_commissionable_revenue - COALESCE(ahp.baseline_net_interchange_revenue, 0) AS incremental_net_interchange_revenue,
        monthly.saas_commissionable_revenue AS incremental_saas_revenue,
        
        -- Revenue streams
        monthly.fx_card_commissionable_revenue AS fx_card_revenue,
        CASE 
            WHEN cw.country_code = 'US' THEN monthly.fx_cash_commissionable_revenue
            ELSE 0
        END AS fx_cash_revenue_us_only,
        monthly.deposits_commissionable_revenue AS deposits_revenue,
        
        -- Domestic GMV metrics
        monthly.domestic_cleared_gmv_amount AS domestic_cleared_gmv,
        monthly.domestic_interchange_rate AS avg_domestic_interchange,
        monthly.domestic_rewards_rate AS avg_domestic_rewards_rate,
        
        -- International GMV metrics
        monthly.intl_cleared_gmv_amount AS international_cleared_gmv,
        monthly.intl_interchange_rate AS avg_international_interchange_rate,
        monthly.intl_rewards_rate AS avg_international_rewards_rate,
        
        -- Overall GMV metrics
        monthly.cleared_gmv_amount AS cleared_gmv,
        monthly.cleared_gmv_amount - COALESCE(ahp.baseline_gmv, 0) AS incremental_cleared_gmv
        
    FROM salesforce.public.ae_cse_account_holding_periods AS ahp
    
    LEFT JOIN salesforce.public.account_holding_periods_monthly_gmv_and_revenue AS monthly
        ON ahp.account_holding_period_id = monthly.account_holding_period_id
    
    LEFT JOIN COREDATA.CUSTOMER.CUSTOMER_WIDE AS cw
        ON ahp.customer_account_id = cw.customer_account_id
    
    LEFT JOIN COREDATA.SALESFORCE.OPPORTUNITIES AS opp
        ON ahp.opportunity_id_determining_account_holding = opp.opportunity_id
    
    LEFT JOIN workday_employees AS we
        ON LOWER(monthly.rep_receiving_comm_rev_credit) = LOWER(we.email)
    
    WHERE 
        -- Exclude specific test opportunity
        (ahp.opportunity_id_determining_account_holding <> '0066Q00002FooL5QAJ' 
         OR ahp.opportunity_id_determining_account_holding IS NULL)
        
        -- Filter for active account holding periods or accrual periods
        AND (
            CURRENT_DATE() BETWEEN 
                DATEADD(MONTH, 1, DATE_TRUNC(MONTH, ahp.account_holding_period_start_date)) 
                AND ahp.account_holding_period_end_date
            OR 
            CURRENT_DATE() BETWEEN 
                ahp.non_saas_commissionable_revenue_accrual_start_date 
                AND ahp.non_saas_commissionable_revenue_accrual_end_date
        )
        
        -- Date range filter
        AND monthly.calendar_month >= '2025-02-01'
        AND monthly.calendar_month <= CURRENT_DATE()
)

SELECT 
    rep_name,
    opportunity_owner_name,
    customer_name,
    opportunity_name,
    revenue_month,
    
    -- Commissionable metrics
    SUM(commissionable_revenue) AS commissionable_revenue,
    SUM(cse_commissionable_revenue) AS cse_commissionable_revenue,
    SUM(incremental_net_interchange_revenue) AS incremental_net_interchange_revenue,
    SUM(incremental_saas_revenue) AS incremental_saas_revenue,
    
    -- Revenue streams
    SUM(fx_card_revenue) AS fx_card_revenue,
    SUM(fx_cash_revenue_us_only) AS fx_cash_revenue_us_only,
    SUM(deposits_revenue) AS deposits_revenue,
    
    -- Domestic GMV metrics
    SUM(domestic_cleared_gmv) AS domestic_cleared_gmv,
    AVG(avg_domestic_interchange) AS avg_domestic_interchange,
    AVG(avg_domestic_rewards_rate) AS avg_domestic_rewards_rate,
    
    -- International GMV metrics
    SUM(international_cleared_gmv) AS international_cleared_gmv,
    AVG(avg_international_interchange_rate) AS avg_international_interchange_rate,
    AVG(avg_international_rewards_rate) AS avg_international_rewards_rate,
    
    -- Overall GMV metrics
    SUM(cleared_gmv) AS cleared_gmv,
    SUM(incremental_cleared_gmv) AS incremental_cleared_gmv

FROM base_data

GROUP BY 
    rep_name,
    opportunity_owner_name,
    customer_name,
    opportunity_name,
    revenue_month

ORDER BY 
    rep_name,
    customer_name,
    revenue_month DESC;












