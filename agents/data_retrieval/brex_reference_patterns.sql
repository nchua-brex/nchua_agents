-- Brex Data Team Validated SQL Patterns
-- These patterns are proven and optimized for Brex Snowflake analysis

-- =============================================================================
-- EMPLOYEE COUNT COMPARISON PATTERN (CORRECTED FIELD)
-- Use: Compare Brex internal vs Salesforce employee counts for data quality
-- Field: brex_ee_count_number_c (CORRECT FIELD, not brex_ee_count_c)
-- Coverage: brex_ee_count_number_c has good data coverage
-- =============================================================================

SELECT
    cw.customer_account_id AS Cuacc,
    cw.employee_count AS cw_employee_count,
    sf.brex_ee_count_number_c AS salesforce_ee_count,      -- CORRECT FIELD
    cw.dba_name,
    cw.empower_edition,
    cw.one_brex_segment,
    CASE
        WHEN sf.brex_ee_count_number_c IS NULL THEN 'Missing'
        WHEN ABS(sf.brex_ee_count_number_c - cw.employee_count) > 50 THEN 'Large Gap'
        WHEN ABS(sf.brex_ee_count_number_c - cw.employee_count) > 10 THEN 'Moderate Gap'
        ELSE 'Aligned'
    END as ee_count_quality
FROM coredata.customer.customer_wide cw
LEFT JOIN coredata.salesforce.accounts acc
    ON cw.customer_account_id = acc.customer_account_id
    AND acc.is_primary_salesforce_account_for_cuacc = TRUE
LEFT JOIN fivetran.salesforce.account sf
    ON acc.salesforce_account_id = sf.id
    AND sf.is_deleted = FALSE
WHERE cw.internal_account_type = 'customer_account'
    AND cw.status = 'active';

-- =============================================================================
-- CUSTOMER EDITION ANALYSIS (SaaS vs Non-SaaS)
-- Source: Data Team validated pattern
-- Use: Revenue analysis by customer type
-- =============================================================================

WITH customers AS (
    SELECT
        cw.customer_account_id,
        CASE
            WHEN cw.empower_edition LIKE '%Essentials%' THEN 'Essentials Edition'
            ELSE cw.empower_edition
        END AS actual_edition,
        cw.employee_count,
        cw.one_brex_segment,
        AVG(nrr.cleared_gmv_amount) AS avg_l3m_cleared_gmv,
        AVG(nrr.empower_revenue) AS avg_l3m_saas_revenue,
        AVG(nrr.net_revenue) AS avg_l3m_net_revenue,
        SUM(nrr.cleared_gmv_amount) AS cleared_gmv_amount,
        SUM(nrr.empower_revenue) AS empower_revenue,
        SUM(nrr.net_revenue) AS net_revenue
    FROM coredata.customer.customer_wide cw
    LEFT JOIN coredata.customer.customers_monthly__net_revenue nrr
        ON cw.customer_account_id = nrr.customer_account_id
        AND nrr.report_month_date >= DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE))
        AND nrr.report_month_date < DATE_TRUNC('month', CURRENT_DATE)
    WHERE cw.internal_account_type = 'customer_account'
        AND cw.status = 'active'
        AND actual_edition IS NOT NULL
    GROUP BY 1, 2, 3, 4
)

SELECT
    actual_edition,
    COUNT(DISTINCT customer_account_id) AS num_customers,
    SUM(cleared_gmv_amount) AS cleared_gmv,
    SUM(empower_revenue) AS saas_revenue,
    SUM(net_revenue) AS net_revenue,
    AVG(avg_l3m_cleared_gmv) AS avg_l3m_cleared_gmv_per_cust,
    AVG(avg_l3m_saas_revenue) AS avg_l3m_saas_revenue_per_cust,
    AVG(avg_l3m_net_revenue) AS avg_l3m_net_revenue_per_cust,
    AVG(employee_count) AS avg_employee_count,
    MEDIAN(employee_count) AS median_employee_count
FROM customers
GROUP BY actual_edition
ORDER BY saas_revenue DESC;

-- =============================================================================
-- CROSS-SELL VS UPSELL ANALYSIS PATTERN
-- Use: Determine if deals are to existing SaaS customers or net new
-- =============================================================================

WITH fy26_empower_deals AS (
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
    WHERE opp.close_date >= '2025-02-01'
        AND opp.close_date < '2026-02-01'  -- FY'26
        AND opp.record_type_name = 'Empower'
        AND opp.is_won = true
        AND opp.closed_owner_second_level_team IN ('Client Sales','ENT','MM')
        AND opp.stage_name NOT IN ('DQ: Duplicate')
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
    FROM fy26_empower_deals deals
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

-- =============================================================================
-- SOLUTIONS CONSULTANT COMMISSION ANALYSIS
-- Source: Existing solution_consultants_attainment.sql
-- Use: SC performance and revenue attribution
-- =============================================================================

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
        AND monthly.calendar_month >= '2025-02-01'
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

-- =============================================================================
-- SEGMENT PERFORMANCE ANALYSIS
-- Use: Compare CSE vs MM vs ENT performance
-- =============================================================================

WITH segmented_opportunities AS (
    SELECT
        opp.opportunity_id,
        opp.close_date,
        opp.arr_deal_size,
        CASE
            WHEN opp.closed_owner_second_level_team = 'Client Sales' THEN 'CSE'
            WHEN opp.closed_owner_second_level_team = 'MM' THEN 'Mid-Market'
            WHEN opp.closed_owner_second_level_team = 'ENT' THEN 'Enterprise'
            ELSE 'Other'
        END AS segment,
        CASE
            WHEN opp.close_date <= '2025-07-02' AND opp.sc_name IS NOT NULL AND opp.is_sc_actively_working = true THEN true
            WHEN opp.close_date > '2025-07-02' AND opp.sc_name IS NOT NULL THEN true
            ELSE FALSE
        END AS has_solutions_consultant,
        DATE_TRUNC('month', opp.close_date) AS close_month
    FROM coredata.salesforce.opportunities opp
    WHERE opp.close_date >= '2025-02-01'
        AND opp.record_type_name = 'Empower'
        AND opp.is_won = true
        AND opp.closed_owner_second_level_team IN ('Client Sales','ENT','MM')
        AND opp.stage_name NOT IN ('DQ: Duplicate')
)

SELECT
    segment,
    close_month,
    COUNT(*) AS deal_count,
    SUM(arr_deal_size) AS total_arr,
    AVG(arr_deal_size) AS avg_deal_size,
    COUNT(CASE WHEN has_solutions_consultant THEN 1 END) AS deals_with_sc,
    COUNT(CASE WHEN has_solutions_consultant THEN 1 END) / COUNT(*)::FLOAT AS sc_attach_rate
FROM segmented_opportunities
GROUP BY segment, close_month
ORDER BY segment, close_month DESC;

-- =============================================================================
-- CUSTOMER JOURNEY ANALYSIS
-- Use: Track customer progression and revenue growth
-- =============================================================================

WITH customer_timeline AS (
    SELECT
        cw.customer_account_id,
        cw.dba_name,
        cw.empower_edition,
        cw.one_brex_segment,
        cw.cohort_start_date,
        -- First Empower revenue month
        MIN(CASE WHEN nrr.empower_revenue > 0 THEN nrr.report_month_date END) AS first_saas_month,
        -- Recent metrics
        MAX(nrr.report_month_date) AS latest_month,
        SUM(CASE WHEN nrr.report_month_date >= DATEADD('month', -3, CURRENT_DATE())
                THEN nrr.empower_revenue END) AS l3m_saas_revenue,
        SUM(CASE WHEN nrr.report_month_date >= DATEADD('month', -12, CURRENT_DATE())
                THEN nrr.empower_revenue END) AS l12m_saas_revenue
    FROM coredata.customer.customer_wide cw
    LEFT JOIN coredata.customer.customers_monthly__net_revenue nrr
        ON cw.customer_account_id = nrr.customer_account_id
    WHERE cw.internal_account_type = 'customer_account'
        AND cw.status = 'active'
        AND cw.empower_edition IN ('Premium Edition', 'Enterprise Edition')
    GROUP BY 1, 2, 3, 4, 5
)

SELECT
    empower_edition,
    one_brex_segment,
    COUNT(*) AS customers,
    AVG(DATEDIFF('day', cohort_start_date, first_saas_month)) AS avg_days_to_saas,
    AVG(l3m_saas_revenue) AS avg_l3m_saas_revenue,
    MEDIAN(l3m_saas_revenue) AS median_l3m_saas_revenue,
    SUM(l12m_saas_revenue) AS total_l12m_saas_revenue
FROM customer_timeline
WHERE first_saas_month IS NOT NULL
GROUP BY empower_edition, one_brex_segment
ORDER BY total_l12m_saas_revenue DESC;