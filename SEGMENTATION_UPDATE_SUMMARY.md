# Segmentation Matrix Update Summary

## Date: December 10, 2025

## Changes Made

### New GMV Ranges
**OLD:** 0-10k, 10k-20k, 20k-100k, 100k-120k, 120k-200k, 200k-600k, >600k

**NEW:** 0-7k, 7k-20k, 20k-100k, 100k-150k, 150k-300k, 300k-700k, >700k

### EE Ranges (Unchanged)
0-25, 26-50, 51-100, 101-250, 251-500, 501-1000, >1001

### Updated Segmentation Matrix

| EE        | 0-7k       | 7k-20k  | 20k-100k | 100k-150k | 150k-300k | 300k-700k | >700k      |
|-----------|------------|---------|----------|-----------|-----------|-----------|------------|
| 0-25      | Unassigned | BSC     | BSC      | Growth    | Growth    | Mid-Market| Enterprise |
| 26-50     | Unassigned | BSC     | BSC      | Growth    | Growth    | Mid-Market| Enterprise |
| 51-100    | Unassigned | BSC     | Growth   | Growth    | Growth    | Mid-Market| Enterprise |
| 101-250   | Unassigned | BSC     | Growth   | Growth    | Mid-Market| Mid-Market| Enterprise |
| 251-500   | Unassigned | BSC     | Mid-Market| Mid-Market| Mid-Market| Mid-Market| Enterprise |
| 501-1000  | Unassigned | BSC     | Mid-Market| Mid-Market| Mid-Market| Mid-Market| Enterprise |
| >1001     | BSC        | Enterprise| Enterprise| Enterprise| Enterprise| Enterprise| Enterprise |

## Files Updated

### ✅ COMPLETED
1. **segment_distribution_analysis.sql**
   - Updated `segment_mapping` CTE with new ranges
   - 49 rows of GMV × EE combinations

2. **SEGMENTATION_WORKFLOW.md**
   - Updated matrix table
   - Updated segment definitions

3. **apply_new_segmentation.sql**
   - Updated comments with new ranges

4. **pure_segmentation_check.sql**
   - Complete rewrite with new CASE WHEN logic
   - All 49 GMV × EE combinations updated
   - Old file backed up as pure_segmentation_check_OLD.sql

### ⚠️  NEEDS MANUAL UPDATE
The following files contain old segmentation logic and should be updated if still in use:

5. **saas_tam_segmentation_matrix.sql**
   - Contains old GMV bucket definitions (lines 70-77, 82-90)
   - Contains old CASE WHEN logic (lines 93-158)
   - Update needed: Replace all occurrences of:
     - 10000 → 7000 (first threshold)
     - 120000 → 150000 (third threshold  
     - 200000 → 300000 (fourth threshold)
     - 600000 → 700000 (fifth threshold)
   - GMV bucket labels need updating in bucket creation logic

6. **saas_tam_segmentation_analysis.sql**
   - If this file exists and uses the old matrix, it needs similar updates

7. **create_segment_mapping.py**
   - Python script may need updates if segmentation_matrix input CSV changes

## Key Differences in New Matrix

### Lowered Entry Threshold
- **OLD:** Unassigned up to 10k GMV
- **NEW:** Unassigned up to 7k GMV
- **Impact:** More customers will fall into BSC from Unassigned

### Expanded Growth Band
- **OLD:** Growth was 120k-200k (single band)
- **NEW:** Growth is 100k-300k (two bands: 100k-150k, 150k-300k)
- **Impact:** Customers in 100k-120k and 200k-300k ranges will shift to Growth

### Adjusted Mid-Market Threshold
- **OLD:** Mid-Market started at 200k
- **NEW:** Mid-Market starts at 150k (for some EE ranges) or 300k (for lower EE ranges)
- **Impact:** Some Mid-Market customers may shift between segments

### Higher Enterprise Threshold
- **OLD:** Enterprise at >600k GMV
- **NEW:** Enterprise at >700k GMV
- **Impact:** Customers in 600k-700k range will shift to Mid-Market

## Testing Recommendations

1. **Run Comparison Query**
   - Execute `segment_distribution_analysis.sql`
   - Compare customer counts between segments
   - Identify largest migrations

2. **Validate Edge Cases**
   - Test customers near threshold boundaries
   - Example: 149k GMV, 50 EE (was BSC/Growth, now Growth)
   - Example: 650k GMV, 100 EE (was Enterprise, now Mid-Market)

3. **Check SaaS TAM Analysis**
   - If using old SaaS TAM files, update them before running
   - Or use the new segment_distribution_analysis.sql as source of truth

## Migration Impact Estimates

Based on new thresholds:
- **Unassigned → BSC**: Customers with 7k-10k GMV
- **BSC → Growth**: Customers with 100k-120k GMV (some EE ranges)
- **Growth → Mid-Market**: Some customers with 200k-300k GMV (lower EE ranges)
- **Mid-Market → Growth**: Some customers with 200k-300k GMV (higher EE ranges)
- **Enterprise → Mid-Market**: Customers with 600k-700k GMV

## Next Steps

1. ✅ Run updated `segment_distribution_analysis.sql` in Snowflake
2. ⏸️  Review output and validate segment assignments
3. ⏸️  Update saas_tam files if needed for TAM analysis
4. ⏸️  Communicate changes to stakeholders
5. ⏸️  Update downstream reports/dashboards

## Rollback Plan

If needed to revert:
1. Restore old files from _OLD backups
2. Or update segment_mapping CTE back to old ranges:
   - 0-10k, 10k-20k, 20k-100k, 100k-120k, 120k-200k, 200k-600k, >600k






