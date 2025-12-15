# New Segmentation Workflow

## Overview
This workflow replaces hardcoded CASE WHEN segmentation logic with a flexible, maintainable matrix-based approach.

## Components

### 1. Customer Base Raw Data Query
**File:** `customer_base_raw_data.sql`

Pulls comprehensive customer data including:
- Customer details (name, segment, industry, employee count)
- Financial metrics (GMV, revenue, NRR)
- Cash balances (internal AUM, external deposits)
- Ownership fields (CSM, CSE assignments)
- Book quality indicators (traffic light, churn score)
- Calculated field: `gmv_segmentation_field` (tenure-based GMV logic)

**Key Parameter:** `{{reference_date}}` - Point-in-time analysis date

### 2. Segment Mapping Creation (Python)
**File:** `create_segment_mapping.py`

Converts a 2D segmentation matrix into a flat lookup table:

**Input:** Segmentation matrix with:
- Rows: Employee count ranges (e.g., "0-25", "25-50", ">1000")
- Columns: GMV ranges (e.g., "0-7k", "118k-163k", ">552k")
- Cells: Segment names (e.g., "Core", "Select", "SMB", "MM", "ENT")

**Output:** `segment_mapping_df` DataFrame with columns:
```
gmv_min      | gmv_max      | ee_min | ee_max | segment
-------------|--------------|--------|--------|----------
0            | 7000         | 0      | 25     | Core
7000         | 118000       | 0      | 25     | Select
...
```

**Functions:**
- `parse_range()`: Converts GMV strings like "118k-163k" → (118000, 163000)
- `parse_ee_range()`: Converts EE strings like "25-50" → (25, 50)
- Handles open-ended ranges like ">552k" → (552000, inf)

### 3. Apply Segmentation (SQL)
**File:** `apply_new_segmentation.sql`

Joins customer data to segment mapping using range matching:

```sql
SELECT cb.*,
    map.segment as new_segment
FROM customer_base_raw cb
LEFT JOIN segment_mapping_df map
    ON  map.gmv_min <= cb.gmv_segmentation_field
    AND map.gmv_max > cb.gmv_segmentation_field
    AND map.ee_min <= cb.employee_count
    AND map.ee_max >= cb.employee_count
```

**Logic:**
- Each customer's `gmv_segmentation_field` and `employee_count` determine their segment
- Range matching ensures exactly one segment per customer
- LEFT JOIN ensures all customers are included (NULL segment if no match)

## Workflow Steps

1. **Run customer base query** with desired `{{reference_date}}`
   - Creates `customer_base_raw` table/view

2. **Load segmentation matrix** (Excel/CSV) into Python
   - Parse matrix into `segment_mapping_df`
   - Upload to Snowflake as table

3. **Apply segmentation query**
   - Joins customer data to mapping table
   - Assigns `new_segment` to each customer

## Advantages Over CASE WHEN Approach

✅ **Maintainable**: Update segments by changing matrix data, not SQL code  
✅ **Flexible**: Easy to add segments or adjust thresholds  
✅ **Auditable**: Segment definitions are data in a table  
✅ **Reusable**: Same mapping across multiple analyses  
✅ **Non-technical friendly**: Business users can update Excel matrix  
✅ **Version controlled**: Track segment changes over time in mapping table

## Actual Segmentation Matrix

| EE        | 0-7k       | 7k-20k  | 20k-100k | 100k-150k | 150k-300k | 300k-700k | >700k      |
|-----------|------------|---------|----------|-----------|-----------|-----------|------------|
| 0-25      | Unassigned | BSC     | BSC      | Growth    | Growth    | Mid-Market| Enterprise |
| 26-50     | Unassigned | BSC     | BSC      | Growth    | Growth    | Mid-Market| Enterprise |
| 51-100    | Unassigned | BSC     | Growth   | Growth    | Growth    | Mid-Market| Enterprise |
| 101-250   | Unassigned | BSC     | Growth   | Growth    | Mid-Market| Mid-Market| Enterprise |
| 251-500   | Unassigned | BSC     | Mid-Market| Mid-Market| Mid-Market| Mid-Market| Enterprise |
| 501-1000  | Unassigned | BSC     | Mid-Market| Mid-Market| Mid-Market| Mid-Market| Enterprise |
| >1001     | BSC        | Enterprise| Enterprise| Enterprise| Enterprise| Enterprise| Enterprise |

**Segment Definitions:**
- **Enterprise**: Premium customers with high GMV (>700k) or very high headcount (>1001 EE with >7k GMV)
- **Mid-Market**: Strong customers with 300k-700k GMV or lower GMV with significant employee counts
- **Growth**: Emerging customers with 100k-300k GMV (smaller/mid-size companies) or 20k-100k GMV with 51+ employees
- **BSC (Brex Success Center)**: Early-stage customers with 7k-100k GMV requiring scaled support, or very large companies (>1001 EE) with low GMV
- **Unassigned**: Very low activity customers (<7k GMV)

