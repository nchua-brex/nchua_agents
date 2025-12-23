-- Check for Brex EE count field and show sample data
SELECT 
    id,
    name,
    brex_ee_count_c,
    brex_entity_id_c
FROM fivetran.salesforce.account
WHERE brex_ee_count_c IS NOT NULL
LIMIT 10;
