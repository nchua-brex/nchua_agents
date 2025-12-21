-- Cross-sell vs Upsell Analysis Pattern
-- Source: Brex Data Team validated pattern
-- Purpose: Determine if deals are to existing SaaS customers or net new
-- Template parameters: {{start_date}}, {{end_date}}, {{segment_filter}}, {{sc_filter}}

WITH fy_empower_deals AS (
    -- Base opportunity filtering
    SELECT
        opp.opportunity_id,
        opp.name AS opportunity_name,
        opp.owner_name AS opportunity_owner,
        opp.closed_owner_second_level_team AS owner_segment,
        opp.close_date,
        opp.arr_deal_size,
        opp.sc_name,
        acc.customer_account_id,
        -- Fiscal period logic
        DATE_TRUNC('month', opp.close_date) AS close_month,
        CASE
            WHEN MONTH(opp.close_date) IN (2, 3, 4) THEN 'Q1'
            WHEN MONTH(opp.close_date) IN (5, 6, 7) THEN 'Q2'
            WHEN MONTH(opp.close_date) IN (8, 9, 10) THEN 'Q3'
            WHEN MONTH(opp.close_date) IN (11, 12, 1) THEN 'Q4'
        END AS fiscal_quarter,
        CASE
            WHEN MONTH(opp.close_date) = 1 THEN YEAR(opp.close_date) - 1
            ELSE YEAR(opp.close_date)
        END AS fiscal_year,
        -- Solutions Consultant logic
        CASE
            WHEN opp.close_date <= '2025-07-02' AND opp.sc_name IS NOT NULL AND opp.is_sc_actively_working = true THEN true
            WHEN opp.close_date > '2025-07-02' AND opp.sc_name IS NOT NULL THEN true
            ELSE FALSE
        END AS has_solutions_consultant
    FROM coredata.salesforce.opportunities AS opp
    LEFT JOIN coredata.salesforce.accounts AS acc
        ON opp.salesforce_account_id = acc.salesforce_account_id
        AND acc.is_primary_salesforce_account_for_cuacc = TRUE
    WHERE opp.close_date >= COALESCE('{{start_date}}', '2025-02-01')
        AND opp.close_date < COALESCE('{{end_date}}', '2026-02-01')
        AND opp.record_type_name = 'Empower'
        AND opp.is_won = true
        AND opp.closed_owner_second_level_team IN ('Client Sales','ENT','MM')
        AND opp.stage_name NOT IN ('DQ: Duplicate')
        {{#if segment_filter}}
        AND opp.closed_owner_second_level_team = '{{segment_filter}}'
        {{/if}}
        {{#if sc_filter}}
        AND opp.sc_name = '{{sc_filter}}'
        {{/if}}
),

prior_revenue_check AS (
    -- Check for prior Empower revenue
    SELECT
        deals.*,
        MAX(CASE
            WHEN rev.empower_revenue > 0
                AND rev.report_month_date < deals.close_date
            THEN 1 ELSE 0
        END) AS had_prior_saas_revenue,
        COUNT(CASE
            WHEN rev.empower_revenue > 0
                AND rev.report_month_date < deals.close_date
            THEN 1
        END) AS months_with_prior_revenue,
        SUM(CASE
            WHEN rev.report_month_date < deals.close_date
            THEN COALESCE(rev.empower_revenue, 0)
        END) AS total_prior_empower_revenue
    FROM fy_empower_deals deals
    LEFT JOIN coredata.customer.customers_monthly__net_revenue AS rev
        ON deals.customer_account_id = rev.customer_account_id
    GROUP BY deals.opportunity_id, deals.opportunity_name, deals.opportunity_owner,
             deals.owner_segment, deals.close_date, deals.arr_deal_size,
             deals.sc_name, deals.customer_account_id, deals.close_month,
             deals.fiscal_quarter, deals.fiscal_year, deals.has_solutions_consultant
)

SELECT
    opportunity_id,
    opportunity_name,
    owner_segment,
    close_date,
    close_month,
    fiscal_quarter,
    fiscal_year,
    arr_deal_size,
    has_solutions_consultant,
    months_with_prior_revenue,
    total_prior_empower_revenue,
    CASE
        WHEN had_prior_saas_revenue = 1 THEN 'Cross-sell'
        ELSE 'Upsell'
    END AS deal_type
FROM prior_revenue_check
ORDER BY close_date DESC;