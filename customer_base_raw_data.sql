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

cash as (
    select customer_account_id,
        round(eod_balance_cents / 100,2) as total_aum,
        money_market_fund_amount_cents / 100 as money_market_fund_amount,
        cash_amount_cents / 100 as cash_amount,
        dda_amount_cents / 100 as dda_amount
    from coredata.cash.cash_customer__wide
),

external_balance as (
    select
    financials_accounts_details.customer_account_id,
    round(sum(case when not financials_accounts_details.institution_name ilike '%brex%' then financial_balances.ending_balance / 100 end), 2) as external_deposits_balance,
    listagg(distinct case 
                when not financials_accounts_details.is_deleted 
                and not financials_accounts_details.institution_name ilike '%brex%' 
                and financials_accounts_details.status = 'active' 
                then financials_accounts_details.institution_name end, ', ') as external_deposits_accounts
    from financials_aggregates.public.financials_accounts_details
    left join financials_aggregates.public.financial_balances
        on financials_accounts_details.id = financial_balances.account_id
    where financial_balances.balance_date = dateadd(day, -1, current_date())
    group by 1
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

-----------------------------------
--------- OWERNSHIP FIELDS --------
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
    where calendar_month = {{reference_date}}
),

csm as (
    SELECT customer_account_id,
        calendar_month,
        rep_receiving_credit AS csm_owner,
        rep_manager_receiving_credit AS csm_owner_manager,
        sub_team as csm_segment
    FROM salesforce.public.csm_account_holding_periods_monthly
    where calendar_month = {{reference_date}}
        --and sub_team <> 'Brex Success Center' and rep_receiving_credit <> 'Brex Success Center'
),

tmc_ae as (
    select customer_account_id,
        max(case 
                when {{reference_date}} between non_saas_commissionable_revenue_accrual_start_date and non_saas_commissionable_revenue_accrual_end_date
                or {{reference_date}} between account_holding_period_start_date and account_holding_period_end_date then 1 else 0 end
        ) as is_active_tmc_hp
    from salesforce.public.ae_cse_account_holding_periods
    where owner_segment_territory_role ilike '%TMC%'
    group by 1
),

bd_ae as (
    select customer_account_id,
        max(case 
                when {{reference_date}} between holding_period_start_date and holding_period_end_date
                or {{reference_date}} between commissionable_revenue_accrual_start_date and commissionable_revenue_accrual_end_date then 1 else 0 end
        ) as is_active_bd_ae
    from salesforce.public.embedded_finance_ae_holding_periods
    where is_embedded_finance_ae_deal or is_embedded_finance_ae_supported_deal
    group by 1
),

banking_spec as (
    select customer_account_id,
        max(case 
                when report_month between comm_rev_accrual_start_date and comm_rev_accrual_end_date and not is_customer_rm_owned_or_in_startup_active_holding_period then 1 else 0 end
        ) as is_active_banking_specialist_hp
    from salesforce.public.banking_specialist_holding_periods hp
    left join salesforce.public.banking_specialist_holding_periods_monthly hpm on hp.opportunity_id = hpm.opportunity_id and hpm.report_month = {{reference_date}}
    group by 1
),

-----------------------------------
------- BOOK QUALITY FIELDS ------
-----------------------------------

traffic_light as (
    select customer_account_id,
        traffic_light
    from underwriting_monitoring.public.credit_core_segments
    where report_date = (select max(report_date) from underwriting_monitoring.public.credit_core_segments)
),

churn_score as (
    select customer_account_id,
        ROUND(score_calibrated_v1_1, 2) as churn_score,
        CHURN_RISK_SCORE_GROUP_V1_1 as churn_score_group,
    from data_science_analytics.crm.crm_customer_churn_score_v1_1_daily_final_output
    where report_date = (select max(report_date) from data_science_analytics.crm.crm_customer_churn_score_v1_1_daily_final_output)
),

churn_lifecycle as (
    select customer_account_id,
        card_unit_churn_lifecycle_phase
    from coredata.customer.customers_monthly__card_churn_profile
    where report_month_date = dateadd(month, -1, {{reference_date}})
),

nrr AS (
    select report_month_date,
        customer_account_id,
        --Num of days
        num_days_in_report_month,
        num_spend_days_in_report_month,
        num_days_in_report_month_prior,
        num_spend_days_in_report_month_prior,
        --Current revenue
        net_interchange_revenue*(num_spend_days_in_report_month_prior/num_spend_days_in_report_month) + net_fx_card_revenue*(num_spend_days_in_report_month_prior/num_spend_days_in_report_month) + fx_cash_revenue + deposits_revenue + empower_revenue AS realized_revenue_days_adjusted,
        net_interchange_revenue*(num_spend_days_in_report_month_prior/num_spend_days_in_report_month) + net_fx_card_revenue*(num_spend_days_in_report_month_prior/num_spend_days_in_report_month) + fx_cash_revenue + empower_revenue AS realized_revenue_ex_deposits_days_adjusted,
        --Prior revenue
        net_interchange_revenue_prior + net_fx_revenue_prior + empower_revenue_prior + deposits_revenue_prior  AS realized_revenue_prior,
        net_interchange_revenue_prior + net_fx_revenue_prior + empower_revenue_prior AS realized_revenue_ex_deposits_prior,
    from coredata.customer.customers_monthly__net_revenue
    where report_month_date BETWEEN DATEADD(month, -3, {{reference_date}}) and DATEADD(month, -1, {{reference_date}}) --L3M prior to reference date
    group by ALL
    order by 1 desc
),

starting_nrr as (
    select customer_account_id,
        sum(realized_revenue_days_adjusted) as _realized_revenue_days_adjusted,
        sum(realized_revenue_ex_deposits_days_adjusted) as _realized_revenue_ex_deposits_days_adjusted,
        sum(realized_revenue_prior) as _realized_revenue_prior,
        sum(realized_revenue_ex_deposits_prior) as _realized_revenue_ex_deposits_prior,
        div0(_realized_revenue_ex_deposits_days_adjusted, _realized_revenue_ex_deposits_prior) as l3m_nrr_ex_deposits,
        div0(_realized_revenue_days_adjusted, _realized_revenue_prior) as l3m_nrr
    from nrr 
    group by 1
),

-----------------------------------
---- REVENUE OPPORTUNITY FIELDS ---
-----------------------------------

churn as (
    select customer_account_id,
        report_month_date,
        max(case when is_churn then 1 else 0 end) over(partition by customer_account_id order by report_month_date rows between 2 preceding and current row) as is_churn_l3m
    from coredata.customer.customers_monthly__churn 
    where report_month_date >= '2025-01-01' --just to make input data smaller
),

contraction as (
    select customer_account_id,
        greatest(max(case when report_month_date = {{reference_date}} then l3m_avg_net_revenue end),0) as l3m_avg_net_rev_sept_25,
        greatest(max(case when report_month_date = {{reference_date}} then l3m_avg_net_revenue end),0) as l3m_avg_net_rev_sept_24,
        case when l3m_avg_net_rev_sept_25 < l3m_avg_net_rev_sept_24 then 1 else 0 end as is_contraction,
        case when is_contraction = 1 then l3m_avg_net_rev_sept_24 -  l3m_avg_net_rev_sept_25  end as contraction_severity,
        case when is_contraction = 1 then div0(l3m_avg_net_rev_sept_24 -  l3m_avg_net_rev_sept_25, l3m_avg_net_rev_sept_24) end as contraction_severity_pct,
    from financials
    group by 1
),

upsell as (
    select acc.customer_account_id,
        co.opportunity_id,
        co.close_date,
        1 as has_upsell_l12m,
        financials.l3m_avg_net_revenue as baseline_net_revenue,
        financials.n3m_avg_net_revenue as post_upsell_net_revenue,
        greatest(div0(post_upsell_net_revenue - baseline_net_revenue, baseline_net_revenue),0) as upsell_revenue_lift
    from coredata.salesforce.opportunities co
    left join coredata.salesforce.accounts acc on co.salesforce_account_id = acc.salesforce_account_id
    left join financials
        on acc.customer_account_id = financials.customer_account_id
        and date_trunc(month, co.close_date) = financials.report_month_date
    where close_date >= DATEADD(month, -12, {{reference_date}})
        and is_won
        and is_closed
        and owner_segment_territory_role ilike '%cse%'
    qualify row_number() over(partition by acc.customer_account_id order by co.close_date desc) = 1 --most recent upsell, if multiple for same cuacc
)

-----------------------------------
-------------- FINAL --------------
-----------------------------------

select cb.customer_account_id,
    cb.customer_name,
    cb.sales_motion,
    cb.one_brex_segment,
    cb.zoominfo_industry,
    cb.cohort_start_date,
    cb.employee_count,
    cb.tenure_months,
    cb.tenure_group,
    tl.traffic_light,
    case
        when tl.traffic_light = 'Red' then 1
        when tl.traffic_light = 'Yellow' then 2
        when tl.traffic_light = 'Green' then 3
        else 0
    end as traffic_light_int,
    case when csm.customer_account_id is not null then true else false end as has_csm,
    csm.csm_owner,
    csm.csm_segment,
    case when cse.customer_account_id is not null then true else false end as has_cse,
    cse.cse_owner,
    cse.cse_segment,
    churn_lifecycle.card_unit_churn_lifecycle_phase,
    churn_score.churn_score_raw,
    case
        when churn_score.churn_score is null and churn_lifecycle.card_unit_churn_lifecycle_phase = 'baseline_establishment' then 0
        when churn_score.churn_score is null and churn_lifecycle.card_unit_churn_lifecycle_phase is null and cb.tenure_group = '<=M12' then 0
        when churn_score.churn_score is null and (churn_lifecycle.card_unit_churn_lifecycle_phase <> 'baseline_establishment' or churn_lifecycle.card_unit_churn_lifecycle_phase is null) then 1
        else churn_score.churn_score
    end as churn_score,
    coalesce(seats.contracted_booked_users_count,0) as booked_seats,
    coalesce(nrr._realized_revenue_days_adjusted,0) as l3m_realized_revenue_days_adjusted,
    coalesce(nrr._realized_revenue_prior,0) as l3m_realized_revenue_prior,
    nrr.l3m_nrr,
    coalesce(nrr._realized_revenue_ex_deposits_days_adjusted,0) as l3m_realized_revenue_ex_deposits_days_adjusted,
    coalesce(nrr._realized_revenue_ex_deposits_prior,0) as l3m_realized_revenue_ex_deposits_prior,
    nrr.l3m_nrr_ex_deposits,    
    greatest(coalesce(fin.l6m_avg_net_revenue_ex_deposits,0),0) as l6m_avg_net_revenue_ex_deposits, --floored at 0
    greatest(coalesce(fin.l6m_avg_cleared_gmv,0),0) as l6m_avg_cleared_gmv, --floored at 0
    coalesce(cash.total_aum,0) as internal_deposits_balance,
    coalesce(round(eb.external_deposits_balance,2),0) as external_deposits_balance,
    case
        when tenure_group = '<=M12' then greatest(coalesce(cw.committed_monthly_gmv,0), greatest(coalesce(fin.l3m_avg_cleared_gmv,0),0))
        else greatest(coalesce(fin.l6m_avg_cleared_gmv,0),0)
    end as gmv_segmentation_field
from customer_base cb
left join seats
    on cb.customer_account_id = seats.customer_account_id
left join financials fin
    on cb.customer_account_id = fin.customer_account_id 
    and fin.report_month_date = {{reference_date}}
left join cash
    on cb.customer_account_id = cash.customer_account_id
left join external_balance eb
    on cb.customer_account_id = eb.customer_account_id
left join traffic_light tl
    on cb.customer_account_id = tl.customer_account_id
left join churn_score
    on cb.customer_account_id = churn_score.customer_account_id
left join churn_lifecycle
    on cb.customer_account_id = churn_lifecycle.customer_account_id
left join starting_nrr nrr
    on cb.customer_account_id = nrr.customer_account_id
left join csm
    on cb.customer_account_id = csm.customer_account_id
left join cse
    on cb.customer_account_id = cse.customer_account_id
left join tmc_ae 
    on cb.customer_account_id = tmc_ae.customer_account_id
left join bd_ae 
    on cb.customer_account_id = bd_ae.customer_account_id
left join banking_spec bs
    on cb.customer_account_id = bs.customer_account_id
left join latest_closed_won cw
    on cb.customer_account_id = cw.customer_account_id
where cb.cohort_start_date is not null --filtering out for now since these will not have SM nor Tenure
    and cb.one_brex_segment is not null


