-- Comprehensive Validation Query for brex_ee_count_c Schema
-- This query validates the table structure, join patterns, and data quality

-- ============================================================================
-- PART 1: Verify brex_ee_count_c exists and has data
-- ============================================================================
SELECT
    'Schema Check' AS test_name,
    COUNT(*) AS total_accounts,
    COUNT(brex_ee_count_c) AS accounts_with_ee_count,
    ROUND(COUNT(brex_ee_count_c) * 100.0 / COUNT(*), 1) AS pct_populated,
    MIN(brex_ee_count_c) AS min_ee_count,
    MAX(brex_ee_count_c) AS max_ee_count,
    AVG(brex_ee_count_c) AS avg_ee_count,
    MEDIAN(brex_ee_count_c) AS median_ee_count
FROM fivetran.salesforce.account
WHERE is_deleted = FALSE;

-- ============================================================================
-- PART 2: Validate join pattern to coredata.salesforce.accounts
-- ============================================================================
SELECT
    'Join Pattern Check' AS test_name,
    COUNT(DISTINCT sf.id) AS fivetran_accounts,
    COUNT(DISTINCT cs.salesforce_account_id) AS coredata_matched,
    COUNT(DISTINCT cs.customer_account_id) AS unique_customers,
    COUNT(DISTINCT CASE WHEN sf.brex_ee_count_c IS NOT NULL THEN sf.id END) AS with_ee_count,
    ROUND(COUNT(DISTINCT CASE WHEN sf.brex_ee_count_c IS NOT NULL THEN sf.id END) * 100.0 /
          COUNT(DISTINCT sf.id), 1) AS pct_with_ee_count
FROM fivetran.salesforce.account sf
INNER JOIN coredata.salesforce.accounts cs
    ON sf.id = cs.salesforce_account_id
    AND cs.is_primary_salesforce_account_for_cuacc = TRUE
WHERE sf.is_deleted = FALSE;

-- ============================================================================
-- PART 3: Validate full join to customer_wide
-- ============================================================================
SELECT
    'Full Join Check' AS test_name,
    COUNT(*) AS total_customers,
    COUNT(sf.brex_ee_count_c) AS with_salesforce_ee_count,
    COUNT(cw.employee_count) AS with_brex_employee_count,
    COUNT(CASE WHEN sf.brex_ee_count_c IS NOT NULL AND cw.employee_count IS NOT NULL THEN 1 END) AS with_both,
    ROUND(COUNT(sf.brex_ee_count_c) * 100.0 / COUNT(*), 1) AS pct_sf_ee_count,
    ROUND(COUNT(cw.employee_count) * 100.0 / COUNT(*), 1) AS pct_brex_employee_count
FROM coredata.customer.customer_wide cw
INNER JOIN coredata.salesforce.accounts cs
    ON cw.customer_account_id = cs.customer_account_id
    AND cs.is_primary_salesforce_account_for_cuacc = TRUE
LEFT JOIN fivetran.salesforce.account sf
    ON cs.salesforce_account_id = sf.id
    AND sf.is_deleted = FALSE
WHERE cw.internal_account_type = 'customer_account'
    AND cw.status = 'active';

-- ============================================================================
-- PART 4: Data quality comparison between brex_ee_count_c and employee_count
-- ============================================================================
WITH comparison AS (
    SELECT
        sf.id as salesforce_account_id,
        sf.name as account_name,
        sf.brex_ee_count_c,
        cw.employee_count as brex_employee_count,
        cw.one_brex_segment,
        cw.empower_edition,
        ABS(COALESCE(sf.brex_ee_count_c, 0) - COALESCE(cw.employee_count, 0)) as difference,
        CASE
            WHEN sf.brex_ee_count_c IS NULL THEN 'Missing in Salesforce'
            WHEN cw.employee_count IS NULL THEN 'Missing in Brex'
            WHEN ABS(sf.brex_ee_count_c - cw.employee_count) > 100 THEN 'Large Discrepancy (>100)'
            WHEN ABS(sf.brex_ee_count_c - cw.employee_count) > 50 THEN 'Moderate Discrepancy (50-100)'
            WHEN ABS(sf.brex_ee_count_c - cw.employee_count) > 10 THEN 'Small Discrepancy (10-50)'
            ELSE 'Aligned (<=10)'
        END as quality_flag
    FROM fivetran.salesforce.account sf
    INNER JOIN coredata.salesforce.accounts cs
        ON sf.id = cs.salesforce_account_id
        AND cs.is_primary_salesforce_account_for_cuacc = TRUE
    INNER JOIN coredata.customer.customer_wide cw
        ON cs.customer_account_id = cw.customer_account_id
    WHERE cw.internal_account_type = 'customer_account'
        AND cw.status = 'active'
        AND sf.is_deleted = FALSE
)
SELECT
    quality_flag,
    COUNT(*) as account_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as pct_of_total,
    AVG(CASE WHEN brex_ee_count_c IS NOT NULL THEN brex_ee_count_c END) as avg_sf_ee_count,
    AVG(CASE WHEN brex_employee_count IS NOT NULL THEN brex_employee_count END) as avg_brex_employee_count,
    AVG(difference) as avg_difference
FROM comparison
GROUP BY quality_flag
ORDER BY account_count DESC;

-- ============================================================================
-- PART 5: Sample records with brex_ee_count_c
-- ============================================================================
SELECT
    'Sample Records' AS test_name,
    sf.id as salesforce_account_id,
    sf.name as account_name,
    sf.brex_ee_count_c as sf_ee_count,
    cw.employee_count as brex_employee_count,
    cw.dba_name,
    cw.one_brex_segment,
    cw.empower_edition,
    ABS(COALESCE(sf.brex_ee_count_c, 0) - COALESCE(cw.employee_count, 0)) as difference
FROM fivetran.salesforce.account sf
INNER JOIN coredata.salesforce.accounts cs
    ON sf.id = cs.salesforce_account_id
    AND cs.is_primary_salesforce_account_for_cuacc = TRUE
INNER JOIN coredata.customer.customer_wide cw
    ON cs.customer_account_id = cw.customer_account_id
WHERE cw.internal_account_type = 'customer_account'
    AND cw.status = 'active'
    AND sf.is_deleted = FALSE
    AND sf.brex_ee_count_c IS NOT NULL
ORDER BY sf.brex_ee_count_c DESC
LIMIT 20;

-- ============================================================================
-- PART 6: Validate with FY26 opportunities
-- ============================================================================
WITH fy26_opportunities AS (
    SELECT
        opp.opportunity_id,
        opp.name as opportunity_name,
        opp.close_date,
        opp.arr_deal_size,
        opp.salesforce_account_id,
        cs.customer_account_id
    FROM coredata.salesforce.opportunities opp
    LEFT JOIN coredata.salesforce.accounts cs
        ON opp.salesforce_account_id = cs.salesforce_account_id
        AND cs.is_primary_salesforce_account_for_cuacc = TRUE
    WHERE opp.close_date >= '2025-02-01'
        AND opp.close_date < '2026-02-01'
        AND opp.record_type_name = 'Empower'
        AND opp.is_won = true
)
SELECT
    'FY26 Opportunities EE Count Check' AS test_name,
    COUNT(*) as total_opportunities,
    COUNT(sf.brex_ee_count_c) as opps_with_ee_count,
    ROUND(COUNT(sf.brex_ee_count_c) * 100.0 / COUNT(*), 1) as pct_with_ee_count,
    COUNT(cw.employee_count) as opps_with_brex_employee_count,
    ROUND(COUNT(cw.employee_count) * 100.0 / COUNT(*), 1) as pct_with_brex_employee_count
FROM fy26_opportunities op
LEFT JOIN fivetran.salesforce.account sf
    ON op.salesforce_account_id = sf.id
    AND sf.is_deleted = FALSE
LEFT JOIN coredata.customer.customer_wide cw
    ON op.customer_account_id = cw.customer_account_id;

-- ============================================================================
-- PART 7: Segmentation breakdown with brex_ee_count_c
-- ============================================================================
WITH segmented_accounts AS (
    SELECT
        cw.one_brex_segment,
        cw.empower_edition,
        sf.brex_ee_count_c,
        cw.employee_count as brex_employee_count,
        CASE
            WHEN sf.brex_ee_count_c IS NOT NULL AND cw.employee_count IS NOT NULL
                AND ABS(sf.brex_ee_count_c - cw.employee_count) <= 10
            THEN 1 ELSE 0
        END as is_aligned
    FROM fivetran.salesforce.account sf
    INNER JOIN coredata.salesforce.accounts cs
        ON sf.id = cs.salesforce_account_id
        AND cs.is_primary_salesforce_account_for_cuacc = TRUE
    INNER JOIN coredata.customer.customer_wide cw
        ON cs.customer_account_id = cw.customer_account_id
    WHERE cw.internal_account_type = 'customer_account'
        AND cw.status = 'active'
        AND sf.is_deleted = FALSE
)
SELECT
    one_brex_segment,
    COUNT(*) as account_count,
    COUNT(brex_ee_count_c) as with_sf_ee_count,
    ROUND(COUNT(brex_ee_count_c) * 100.0 / COUNT(*), 1) as pct_with_sf_ee_count,
    COUNT(brex_employee_count) as with_brex_employee_count,
    ROUND(COUNT(brex_employee_count) * 100.0 / COUNT(*), 1) as pct_with_brex_employee_count,
    SUM(is_aligned) as aligned_count,
    ROUND(SUM(is_aligned) * 100.0 / COUNT(*), 1) as pct_aligned,
    AVG(CASE WHEN brex_ee_count_c IS NOT NULL THEN brex_ee_count_c END) as avg_sf_ee_count,
    AVG(CASE WHEN brex_employee_count IS NOT NULL THEN brex_employee_count END) as avg_brex_employee_count
FROM segmented_accounts
GROUP BY one_brex_segment
ORDER BY account_count DESC;
