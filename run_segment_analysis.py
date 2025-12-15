#!/usr/bin/env python3
"""
Run the segment distribution analysis query and save results to CSV
"""

import snowflake.connector
import pandas as pd
from datetime import datetime

# Read the SQL query
with open('segment_distribution_analysis.sql', 'r') as f:
    query = f.read()

# Snowflake connection parameters
conn_params = {
    'account': 'hb85882-jx53120',
    'user': 'nchua@brex.com',
    'authenticator': 'externalbrowser',  # Uses SSO browser authentication
    'warehouse': 'COMPUTE_XSMALL_WH',
    'role': 'BREX_NCHUA',
}

print("Connecting to Snowflake...")
print("A browser window will open for authentication.")

try:
    # Connect to Snowflake
    conn = snowflake.connector.connect(**conn_params)
    cursor = conn.cursor()
    
    print("Connected successfully!")
    print("Running segment distribution analysis...")
    
    # Execute the query
    cursor.execute(query)
    
    # Fetch results
    results = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    
    # Create DataFrame
    df = pd.DataFrame(results, columns=columns)
    
    # Save to CSV with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f'segment_distribution_results_{timestamp}.csv'
    df.to_csv(output_file, index=False)
    
    print(f"\n✅ Results saved to: {output_file}")
    print(f"   Total rows: {len(df)}")
    
    # Display summary
    print("\n" + "="*80)
    print("RESULTS PREVIEW")
    print("="*80)
    print(df.to_string())
    
    # Close connection
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()


