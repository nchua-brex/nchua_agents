-- Apply new segmentation using mapping table approach
-- This query joins the customer base data to a segment mapping matrix
-- based on GMV and employee count ranges
-- 
-- Segments: Enterprise, Mid-Market, Growth, BSC, Unassigned
-- GMV Ranges: 0-7k, 7k-20k, 20k-100k, 100k-150k, 150k-300k, 300k-700k, >700k
-- EE Ranges: 0-25, 26-50, 51-100, 101-250, 251-500, 501-1000, >1001

SELECT cb.*,
    coalesce(map.segment, 'Unassigned') as new_segment
FROM customer_base_raw cb
LEFT JOIN segment_mapping_df map
    ON  map.gmv_min <= cb.gmv_segmentation_field
    AND map.gmv_max > cb.gmv_segmentation_field
    AND map.ee_min <= cb.employee_count
    AND map.ee_max >= cb.employee_count

