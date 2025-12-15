import pandas as pd
import re

def parse_range(range_str):
    """Parse range strings like '0-7k', '118k-163k', '>552k' into numeric values."""
    range_str = range_str.strip()
    
    if range_str.startswith('>'):
        # For >552k, return (552000, float('inf'))
        val = range_str[1:]
        val = val.replace('k', '000')
        return (float(val), float('inf'))
    
    # For ranges like 0-7k or 118k-163k
    parts = range_str.split('-')
    if len(parts) == 2:
        lower = parts[0].replace('k', '000')
        upper = parts[1].replace('k', '000')
        return (float(lower), float(upper))
    
    return None

def parse_ee_range(range_str):
    """Parse EE ranges like '0-25', '25-50', '>1000'."""
    range_str = range_str.strip()
    
    if range_str.startswith('>'):
        val = range_str[1:]
        return (float(val), float('inf'))
    
    parts = range_str.split('-')
    if len(parts) == 2:
        return (float(parts[0]), float(parts[1]))
    
    return None

# Get the EE column and GMV columns
ee_values_original = segmentation_matrix['EE'].tolist()
gmv_columns_original = [col for col in segmentation_matrix.columns if col != 'EE']

# Create display versions with > replaced by range format
ee_values = [val.replace('>', '').strip() + '-inf' if val.startswith('>') else val 
             for val in ee_values_original]
gmv_columns = [col.replace('>', '').strip() + '-inf' if col.startswith('>') else col 
               for col in gmv_columns_original]

# Parse ranges using original values
ee_ranges = [(val_display, parse_ee_range(val_orig)) 
             for val_display, val_orig in zip(ee_values, ee_values_original)]
gmv_ranges = [(col_display, parse_range(col_orig)) 
              for col_display, col_orig in zip(gmv_columns, gmv_columns_original)]

# Create a mapping structure
mapping = []
for gmv_col, gmv_range in gmv_ranges:
    if gmv_range is None:
        continue
    
    for idx, (ee_val, ee_range) in enumerate(ee_ranges):
        if ee_range is None:
            continue
            
        segment = segmentation_matrix.loc[idx, gmv_columns_original[gmv_ranges.index((gmv_col, gmv_range))]]
        
        mapping.append({
            'gmv_min': gmv_range[0],
            'gmv_max': gmv_range[1],
            'ee_min': ee_range[0],
            'ee_max': ee_range[1],
            'segment': segment,
            'gmv_col': gmv_col,
            'ee_val': ee_val
        })

# Convert to DataFrame for easier manipulation
segment_mapping_df = pd.DataFrame(mapping)
segment_mapping_df


