-- Solutions Consultant Commission Analysis
-- Source: Existing solution_consultants_attainment.sql
-- Purpose: SC performance and revenue attribution
-- Template parameters: {{start_date}}, {{rep_filter}}, {{segment_filter}}

WITH base_sc_data AS (
    SELECT
        -- Rep and Customer identifiers
        monthly.rep_receiving_comm_rev_credit,
        we.first_name || ' ' || we.last_name AS rep_name,
        opp.owner_name AS opportunity_owner_name,
        monthly.rep_manager_receiving_comm_rev_credit AS rep_manager,
        ahp.customer_account_id,
        cw.dba_name AS customer_name,
        opp.name AS opportunity_name,
        ahp.owner_segment_territory_role AS segment,

        -- Monthly metrics
        DATE_TRUNC('month', monthly.calendar_month) AS revenue_month,
        monthly.commissionable_revenue,
        monthly.cse_commissionable_revenue,
        monthly.saas_commissionable_revenue AS incremental_saas_revenue,
        monthly.cleared_gmv_amount AS cleared_gmv

    FROM salesforce.public.ae_cse_account_holding_periods AS ahp
    LEFT JOIN salesforce.public.account_holding_periods_monthly_gmv_and_revenue AS monthly
        ON ahp.account_holding_period_id = monthly.account_holding_period_id
    LEFT JOIN coredata.customer.customer_wide AS cw
        ON ahp.customer_account_id = cw.customer_account_id
    LEFT JOIN coredata.salesforce.opportunities AS opp
        ON ahp.opportunity_id_determining_account_holding = opp.opportunity_id
    LEFT JOIN workday.workday.employees AS we
        ON LOWER(monthly.rep_receiving_comm_rev_credit) = LOWER(we.email)
    WHERE
        -- Filter for active periods
        (CURRENT_DATE() BETWEEN
            DATEADD(MONTH, 1, DATE_TRUNC(MONTH, ahp.account_holding_period_start_date))
            AND ahp.account_holding_period_end_date
        OR CURRENT_DATE() BETWEEN
            ahp.non_saas_commissionable_revenue_accrual_start_date
            AND ahp.non_saas_commissionable_revenue_accrual_end_date)
        AND monthly.calendar_month >= COALESCE('{{start_date}}', '2025-02-01')
        {{#if rep_filter}}
        AND LOWER(we.first_name || ' ' || we.last_name) LIKE LOWER('%{{rep_filter}}%')
        {{/if}}
        {{#if segment_filter}}
        AND ahp.owner_segment_territory_role = '{{segment_filter}}'
        {{/if}}
)

SELECT
    rep_name,
    revenue_month,
    SUM(commissionable_revenue) AS commissionable_revenue,
    SUM(cse_commissionable_revenue) AS cse_commissionable_revenue,
    SUM(incremental_saas_revenue) AS incremental_saas_revenue,
    SUM(cleared_gmv) AS cleared_gmv,
    COUNT(DISTINCT customer_account_id) AS unique_customers
FROM base_sc_data
GROUP BY rep_name, revenue_month
ORDER BY rep_name, revenue_month DESC;