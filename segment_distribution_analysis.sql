-- Segment Distribution Analysis: Compare Current vs New Segmentation
-- This query calculates customer counts across segments using the new matrix-based approach

with

-----------------------------------
------ CUSTOMER BASE DETAILS ------
-----------------------------------

customer_base as (
    select cw.customer_account_id,
        cw.dba_name as customer_name,
        cw.sales_motion,
        cw.one_brex_segment,
        acc.zoominfo_industry,
        cw.employee_count,
        cw.cohort_start_date,
        datediff('month', cw.cohort_start_date, CURRENT_DATE()) as tenure_months,
        case
            when datediff('month', cw.cohort_start_date, CURRENT_DATE()) <= 12 then '<=M12'
            when datediff('month', cw.cohort_start_date, CURRENT_DATE()) > 24 then 'M24+'
            else 'M13-M24'
        end as tenure_group,
        acc.customer_success_manager,
        acc.client_sales_executive,
        acc.relationship_manager
    from coredata.customer.customer_wide cw
    left join coredata.salesforce.accounts acc on cw.customer_account_id = acc.customer_account_id and acc.is_primary_salesforce_account_for_cuacc
    where cw.internal_account_type = 'customer_account'
        and cw.status = 'active'
),

seats as (
    select 
        salesforce_accounts.customer_account_id,
        salesforce_accounts.salesforce_account_id,
        max(
            coalesce(
                nullifzero(salesforce_quotes.user_order_quantity), 
                nullifzero(zeroifnull(salesforce_opps.international_booked_users_count) + zeroifnull(salesforce_opps.domestic_booked_users_count)),
                nullifzero(zeroifnull(fivetran_opps.contract_empower_seats_dom_c) + zeroifnull(fivetran_opps.contract_empower_seats_intl_c)),
                0)
        ) as contracted_booked_users_count
    from coredata.salesforce.accounts as salesforce_accounts
    left join coredata.salesforce.opportunities as salesforce_opps
        on salesforce_accounts.salesforce_account_id = salesforce_opps.salesforce_account_id
        and is_won
    left join fivetran.salesforce.opportunity as fivetran_opps
        on fivetran_opps.id = salesforce_opps.opportunity_id
    left join salesforce.public.sales_reward_proposals as salesforce_quotes
        on salesforce_opps.opportunity_id = salesforce_quotes.opportunity_id
        and salesforce_quotes.primary_quote
    where salesforce_accounts.is_primary_salesforce_account_for_cuacc
    group by all
),

financials as (
    select customer_account_id,
        report_month_date,
        --gmv
        cleared_gmv_amount,
        round(avg(cleared_gmv_amount) over(partition by customer_account_id order by report_month_date rows between 3 preceding and 1 preceding),2) as l3m_avg_cleared_gmv,
        round(avg(cleared_gmv_amount) over(partition by customer_account_id order by report_month_date rows between 6 preceding and 1 preceding),2) as l6m_avg_cleared_gmv,
        --net revenue
        net_revenue,
        round(avg(net_revenue) over(partition by customer_account_id order by report_month_date rows between 6 preceding and 1 preceding),2) as l6m_avg_net_revenue,
        round(avg(net_revenue_excluding_deposits) over(partition by customer_account_id order by report_month_date rows between 6 preceding and 1 preceding),2) as l6m_avg_net_revenue_ex_deposits,
        round(avg(net_revenue_excluding_deposits) over(partition by customer_account_id order by report_month_date rows between 3 preceding and 1 preceding),2) as l3m_avg_net_revenue,
        round(avg(net_revenue_excluding_deposits) over(partition by customer_account_id order by report_month_date rows between 1 following and 3 following),2) as n3m_avg_net_revenue,
    from coredata.customer.customers_monthly__net_revenue nr
    where report_month_date >= '2024-01-01' --just to make input data smaller
),

latest_closed_won as (
    select opp.opportunity_id,
        acc.salesforce_account_id,
        acc.customer_account_id,
        opp.close_date,
        srp.total_committed_monthly_gmv as committed_monthly_gmv
    from coredata.salesforce.opportunities opp
    left join coredata.salesforce.accounts acc on opp.salesforce_account_id = acc.salesforce_account_id
    left join salesforce.public.sales_reward_proposals srp on opp.opportunity_id = srp.opportunity_id and srp.primary_quote
    where opp.is_closed
        and opp.is_won
        and opp.record_type_name in ('Empower', 'Renewal', 'Venture Backed - Channel', 'Self Serve')
    qualify row_number() over(partition by acc.customer_account_id order by opp.close_date desc) = 1
),

cash as (
    select customer_account_id,
        round(eod_balance_cents / 100,2) as total_aum,
        money_market_fund_amount_cents / 100 as money_market_fund_amount,
        cash_amount_cents / 100 as cash_amount,
        dda_amount_cents / 100 as dda_amount
    from coredata.cash.cash_customer__wide
),

-----------------------------------
--------- OWNERSHIP FIELDS --------
-----------------------------------

cse as (
    SELECT customer_account_id,
        calendar_month,
        rep_receiving_nrr_credit AS cse_owner,
        rep_manager_receiving_nrr_credit AS cse_owner_manager,
        case 
            when cse_segment = 'MM' then 'Mid-Market' 
            when cse_segment = 'ENT' then 'Enterprise'
            when cse_segment = 'GRW' then 'Growth'
        end as cse_segment
    from salesforce.public.cse_nrr_account_holding_periods_monthly
    where calendar_month = dateadd('month', -1, date_trunc('month', current_date()))
),

csm as (
    SELECT customer_account_id,
        calendar_month,
        rep_receiving_credit AS csm_owner,
        rep_manager_receiving_credit AS csm_owner_manager,
        sub_team as csm_segment
    FROM salesforce.public.csm_account_holding_periods_monthly
    where calendar_month = dateadd('month', -1, date_trunc('month', current_date()))
),

-----------------------------------
------ SEGMENT MAPPING TABLE -----
-----------------------------------

segment_mapping as (
    -- This creates the segment mapping inline based on the matrix
    -- GMV ranges: 0-7k, 7k-20k, 20k-100k, 100k-150k, 150k-300k, 300k-700k, >700k
    -- EE ranges: 0-25, 26-50, 51-100, 101-250, 251-500, 501-1000, >1001
    -- Segments: Unassigned, BSC, Growth, Mid-Market, Enterprise
    
    select gmv_min, gmv_max, ee_min, ee_max, segment from (
        -- EE: 0-25
        select 0 as gmv_min, 7000 as gmv_max, 0 as ee_min, 25 as ee_max, 'Unassigned' as segment union all
        select 7000, 20000, 0, 25, 'BSC' union all
        select 20000, 100000, 0, 25, 'BSC' union all
        select 100000, 150000, 0, 25, 'Growth' union all
        select 150000, 300000, 0, 25, 'Growth' union all
        select 300000, 700000, 0, 25, 'Mid-Market' union all
        select 700000, 999999999, 0, 25, 'Enterprise' union all
        
        -- EE: 26-50
        select 0, 7000, 26, 50, 'Unassigned' union all
        select 7000, 20000, 26, 50, 'BSC' union all
        select 20000, 100000, 26, 50, 'BSC' union all
        select 100000, 150000, 26, 50, 'Growth' union all
        select 150000, 300000, 26, 50, 'Growth' union all
        select 300000, 700000, 26, 50, 'Mid-Market' union all
        select 700000, 999999999, 26, 50, 'Enterprise' union all
        
        -- EE: 51-100
        select 0, 7000, 51, 100, 'Unassigned' union all
        select 7000, 20000, 51, 100, 'BSC' union all
        select 20000, 100000, 51, 100, 'Growth' union all
        select 100000, 150000, 51, 100, 'Growth' union all
        select 150000, 300000, 51, 100, 'Growth' union all
        select 300000, 700000, 51, 100, 'Mid-Market' union all
        select 700000, 999999999, 51, 100, 'Enterprise' union all
        
        -- EE: 101-250
        select 0, 7000, 101, 250, 'Unassigned' union all
        select 7000, 20000, 101, 250, 'BSC' union all
        select 20000, 100000, 101, 250, 'Growth' union all
        select 100000, 150000, 101, 250, 'Growth' union all
        select 150000, 300000, 101, 250, 'Mid-Market' union all
        select 300000, 700000, 101, 250, 'Mid-Market' union all
        select 700000, 999999999, 101, 250, 'Enterprise' union all
        
        -- EE: 251-500
        select 0, 7000, 251, 500, 'Unassigned' union all
        select 7000, 20000, 251, 500, 'BSC' union all
        select 20000, 100000, 251, 500, 'Mid-Market' union all
        select 100000, 150000, 251, 500, 'Mid-Market' union all
        select 150000, 300000, 251, 500, 'Mid-Market' union all
        select 300000, 700000, 251, 500, 'Mid-Market' union all
        select 700000, 999999999, 251, 500, 'Enterprise' union all
        
        -- EE: 501-1000
        select 0, 7000, 501, 1000, 'Unassigned' union all
        select 7000, 20000, 501, 1000, 'BSC' union all
        select 20000, 100000, 501, 1000, 'Mid-Market' union all
        select 100000, 150000, 501, 1000, 'Mid-Market' union all
        select 150000, 300000, 501, 1000, 'Mid-Market' union all
        select 300000, 700000, 501, 1000, 'Mid-Market' union all
        select 700000, 999999999, 501, 1000, 'Enterprise' union all
        
        -- EE: >1001
        select 0, 7000, 1001, 999999, 'BSC' union all
        select 7000, 20000, 1001, 999999, 'Enterprise' union all
        select 20000, 100000, 1001, 999999, 'Enterprise' union all
        select 100000, 150000, 1001, 999999, 'Enterprise' union all
        select 150000, 300000, 1001, 999999, 'Enterprise' union all
        select 300000, 700000, 1001, 999999, 'Enterprise' union all
        select 700000, 999999999, 1001, 999999, 'Enterprise'
    )
),

-----------------------------------
------- CUSTOMER BASE RAW ---------
-----------------------------------

customer_base_raw as (
    select cb.customer_account_id,
        cb.customer_name,
        cb.sales_motion,
        cb.one_brex_segment,
        cb.zoominfo_industry,
        cb.cohort_start_date,
        cb.employee_count,
        cb.tenure_months,
        cb.tenure_group,
        case when csm.customer_account_id is not null then true else false end as has_csm,
        csm.csm_owner,
        csm.csm_segment,
        case when cse.customer_account_id is not null then true else false end as has_cse,
        cse.cse_owner,
        cse.cse_segment,
        coalesce(seats.contracted_booked_users_count,0) as booked_seats,
        greatest(coalesce(fin.l6m_avg_net_revenue_ex_deposits,0),0) as l6m_avg_net_revenue_ex_deposits,
        greatest(coalesce(fin.l6m_avg_cleared_gmv,0),0) as l6m_avg_cleared_gmv,
        coalesce(cash.total_aum,0) as internal_deposits_balance,
        case
            when tenure_group = '<=M12' then greatest(coalesce(cw.committed_monthly_gmv,0), greatest(coalesce(fin.l3m_avg_cleared_gmv,0),0))
            else greatest(coalesce(fin.l6m_avg_cleared_gmv,0),0)
        end as gmv_segmentation_field
    from customer_base cb
    left join seats
        on cb.customer_account_id = seats.customer_account_id
    left join financials fin
        on cb.customer_account_id = fin.customer_account_id 
        and fin.report_month_date = dateadd('month', -1, date_trunc('month', current_date()))
    left join cash
        on cb.customer_account_id = cash.customer_account_id
    left join csm
        on cb.customer_account_id = csm.customer_account_id
    left join cse
        on cb.customer_account_id = cse.customer_account_id
    left join latest_closed_won cw
        on cb.customer_account_id = cw.customer_account_id
    where cb.cohort_start_date is not null
        and cb.one_brex_segment is not null
),

-----------------------------------
----- APPLY NEW SEGMENTATION -----
-----------------------------------

customer_with_new_segment as (
    select cb.*,
        coalesce(map.segment, 'Unassigned') as new_segment,
        -- Current segment logic (based on CSE/CSM assignment)
        coalesce(cb.cse_segment, cb.csm_segment, 'Unassigned') as current_segment
    from customer_base_raw cb
    left join segment_mapping map
        on map.gmv_min <= cb.gmv_segmentation_field
        and map.gmv_max > cb.gmv_segmentation_field
        and map.ee_min <= cb.employee_count
        and map.ee_max >= cb.employee_count
)

-----------------------------------
----- SEGMENT DISTRIBUTION -------
-----------------------------------

select 
    new_segment as "New Segment",
    count(*) as "# Customers",
    count(*) / sum(count(*)) over() as "% Customers",
    sum(l6m_avg_cleared_gmv) as "GMV",
    sum(l6m_avg_cleared_gmv) / sum(sum(l6m_avg_cleared_gmv)) over() as "% GMV",
    sum(l6m_avg_net_revenue_ex_deposits) as "Net Revenue Ex. Deposits",    
    sum(l6m_avg_net_revenue_ex_deposits) / sum(sum(l6m_avg_net_revenue_ex_deposits)) over() as "% Net Revenue Ex. Deposits",
    sum(internal_deposits_balance) as "AUM",
    sum(internal_deposits_balance) / sum(sum(internal_deposits_balance)) over() as "% AUM"
from customer_with_new_segment
group by 1
order by 2 asc

