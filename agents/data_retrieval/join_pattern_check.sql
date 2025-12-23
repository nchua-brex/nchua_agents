-- Verify the join pattern between fivetran.salesforce.account and coredata tables
SELECT 
    sf.id as salesforce_account_id,
    sf.name as account_name,
    sf.brex_ee_count_c,
    sf.brex_entity_id_c,
    cw.customer_account_id,
    cw.dba_name,
    cw.empower_edition
FROM fivetran.salesforce.account sf
LEFT JOIN coredata.salesforce.accounts cs
    ON sf.id = cs.salesforce_account_id
LEFT JOIN coredata.customer.customer_wide cw
    ON cs.customer_account_id = cw.customer_account_id
WHERE sf.brex_ee_count_c IS NOT NULL
    AND cw.internal_account_type = 'customer_account'
    AND cw.status = 'active'
LIMIT 20;
