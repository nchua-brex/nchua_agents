#!/usr/bin/env python3
"""
Snowflake Analysis Runner

A user-friendly CLI interface for the Snowflake Data Agent.
Provides easy-to-use commands for common analysis tasks.

Usage Examples:
    python run_analysis.py customer-revenue --export
    python run_analysis.py sc-territories "John Smith" "Jane Doe" --months 6
    python run_analysis.py learn-query --name "custom_analysis" --file "my_query.sql"
    python run_analysis.py cohorts --period quarter --export cohort_q4_analysis
"""

import argparse
import sys
from pathlib import Path
from datetime import datetime
import json

# Import our agent
from snowflake_data_agent import SnowflakeDataAgent, logger


def main():
    parser = argparse.ArgumentParser(
        description="Snowflake Analysis Runner for Solutions Consultant Attainment",
        epilog="""
Examples:
  %(prog)s customer-revenue --export
  %(prog)s sc-territories "John Smith" "Jane Doe" --months 6
  %(prog)s cohorts --period quarter --export cohort_analysis
  %(prog)s learn-query --name "pipeline_analysis" --file "pipeline.sql"
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Customer Revenue Analysis
    revenue_parser = subparsers.add_parser('customer-revenue', help='Analyze customer revenue by edition')
    revenue_parser.add_argument('--months', type=int, default=3, help='Months to analyze (default: 3)')
    revenue_parser.add_argument('--export', nargs='?', const='auto', help='Export to CSV (optional filename)')
    revenue_parser.add_argument('--include-obs', action='store_true', help='Include One Brex Segment analysis')

    # Solutions Consultant Territory Analysis
    sc_parser = subparsers.add_parser('sc-territories', help='Analyze Solutions Consultant territories')
    sc_parser.add_argument('territories', nargs='*', help='Specific SC territories to analyze')
    sc_parser.add_argument('--months', type=int, default=3, help='Months to analyze (default: 3)')
    sc_parser.add_argument('--export', nargs='?', const='auto', help='Export to CSV (optional filename)')

    # Cohort Analysis
    cohort_parser = subparsers.add_parser('cohorts', help='Run cohort analysis')
    cohort_parser.add_argument('--period', choices=['year', 'quarter', 'month'], default='year',
                              help='Cohort grouping period (default: year)')
    cohort_parser.add_argument('--months', type=int, default=3, help='Months to analyze (default: 3)')
    cohort_parser.add_argument('--export', nargs='?', const='auto', help='Export to CSV (optional filename)')

    # Custom Query
    custom_parser = subparsers.add_parser('custom', help='Execute custom SQL query')
    custom_parser.add_argument('--query', type=str, help='SQL query to execute')
    custom_parser.add_argument('--file', type=str, help='File containing SQL query')
    custom_parser.add_argument('--export', nargs='?', const='auto', help='Export to CSV (optional filename)')
    custom_parser.add_argument('--description', type=str, default='Custom Query', help='Query description')

    # Learn Query
    learn_parser = subparsers.add_parser('learn-query', help='Learn a new query pattern')
    learn_parser.add_argument('--name', type=str, required=True, help='Pattern name')
    learn_parser.add_argument('--description', type=str, required=True, help='Pattern description')
    learn_parser.add_argument('--query', type=str, help='SQL query')
    learn_parser.add_argument('--file', type=str, help='File containing SQL query')
    learn_parser.add_argument('--category', type=str, default='custom_analysis', help='Pattern category')
    learn_parser.add_argument('--parameters', nargs='*', help='Query parameters')

    # List Patterns
    list_parser = subparsers.add_parser('list-patterns', help='List available query patterns')
    list_parser.add_argument('--category', type=str, help='Filter by category')

    # Show Schema
    schema_parser = subparsers.add_parser('schema', help='Show Snowflake schema information')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    try:
        # Initialize the agent
        agent = SnowflakeDataAgent()

        if args.command == 'customer-revenue':
            print(f"Analyzing customer revenue by edition (last {args.months} months)...")

            if args.include_obs:
                result = agent.extract_customer_revenue_by_obs(args.months)
                analysis_type = "Customer Revenue by Edition and OBS"
            else:
                result = agent.extract_customer_revenue_by_edition(args.months)
                analysis_type = "Customer Revenue by Edition"

            print_result_summary(result, analysis_type)

            if args.export:
                filename = args.export if args.export != 'auto' else None
                if not filename:
                    filename = f"customer_revenue_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                export_path = agent.export_to_csv(result, filename)
                print(f"\n✓ Results exported to: {export_path}")

        elif args.command == 'sc-territories':
            territories = args.territories if args.territories else None
            print(f"Analyzing Solutions Consultant territories...")
            if territories:
                print(f"Territories: {', '.join(territories)}")

            result = agent.generate_solutions_consultant_analysis(territories)
            print_result_summary(result, "Solutions Consultant Territory Analysis")

            if args.export:
                filename = args.export if args.export != 'auto' else None
                if not filename:
                    filename = f"sc_territories_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                export_path = agent.export_to_csv(result, filename)
                print(f"\n✓ Results exported to: {export_path}")

        elif args.command == 'cohorts':
            print(f"Running cohort analysis ({args.period}ly cohorts, last {args.months} months)...")

            result = agent.extract_cohort_analysis(args.months, args.period)
            print_result_summary(result, f"Cohort Analysis ({args.period}ly)")

            if args.export:
                filename = args.export if args.export != 'auto' else None
                if not filename:
                    filename = f"cohort_analysis_{args.period}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                export_path = agent.export_to_csv(result, filename)
                print(f"\n✓ Results exported to: {export_path}")

        elif args.command == 'custom':
            # Get the SQL query
            if args.query:
                sql = args.query
            elif args.file:
                with open(args.file, 'r') as f:
                    sql = f.read()
            else:
                print("Error: Must provide either --query or --file")
                return 1

            print(f"Executing custom query: {args.description}")

            result = agent.execute_custom_query(sql, args.description)
            print_result_summary(result, args.description)

            if args.export:
                filename = args.export if args.export != 'auto' else None
                if not filename:
                    filename = f"custom_query_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                export_path = agent.export_to_csv(result, filename)
                print(f"\n✓ Results exported to: {export_path}")

        elif args.command == 'learn-query':
            # Get the SQL query
            if args.query:
                sql = args.query
            elif args.file:
                with open(args.file, 'r') as f:
                    sql = f.read()
            else:
                print("Error: Must provide either --query or --file")
                return 1

            success = agent.learn_new_query(
                name=args.name,
                description=args.description,
                sql=sql,
                category=args.category,
                parameters=args.parameters or []
            )

            if success:
                print(f"✓ Successfully learned new query pattern: {args.name}")
                print(f"  Category: {args.category}")
                print(f"  Description: {args.description}")
                if args.parameters:
                    print(f"  Parameters: {', '.join(args.parameters)}")
            else:
                print(f"✗ Failed to learn query pattern: {args.name}")
                return 1

        elif args.command == 'list-patterns':
            patterns = agent.get_available_patterns()

            if args.category:
                patterns = [p for p in patterns if p['category'] == args.category]

            print("\n📋 Available Query Patterns:")
            print("=" * 80)

            if not patterns:
                print("No patterns found.")
                return 0

            current_category = None
            for pattern in patterns:
                if pattern['category'] != current_category:
                    current_category = pattern['category']
                    print(f"\n📂 Category: {current_category.title().replace('_', ' ')}")
                    print("-" * 40)

                print(f"  📊 {pattern['name']}")
                print(f"     {pattern['description']}")
                print(f"     Used {pattern['usage_count']} times | Success: {pattern['success_rate']:.1%} | Last: {pattern['last_used'] or 'Never'}")

        elif args.command == 'schema':
            print("\n🏗️  Snowflake Schema Information")
            print("=" * 80)

            schema_info = {
                "Database": "COREDATA",
                "Key Tables": [
                    "customer.customer_wide - Master customer table",
                    "customer.customers_monthly__net_revenue - Monthly revenue by customer",
                    "salesforce.accounts - Salesforce account data",
                    "salesforce.opportunities - Salesforce opportunities/pipeline",
                    "cash.cash_customer__wide - Cash/deposits customer data"
                ],
                "Common Filters": [
                    "internal_account_type = 'customer_account' (actual customers)",
                    "status = 'active' (active customers)",
                    "empower_edition IN ('Premium Edition', 'Enterprise Edition') (SaaS customers)",
                    "empower_edition LIKE '%Essentials%' (Non-SaaS customers)"
                ]
            }

            for key, value in schema_info.items():
                print(f"\n📋 {key}:")
                if isinstance(value, list):
                    for item in value:
                        print(f"  • {item}")
                else:
                    print(f"  {value}")

            print(f"\n📖 For detailed schema information, see: SNOWFLAKE_SCHEMA.md")
            print(f"📖 For validated query patterns, see: reference_queries.sql")

        return 0

    except Exception as e:
        logger.error(f"Error executing command {args.command}: {e}")
        print(f"\n❌ Error: {e}")
        return 1


def print_result_summary(result, analysis_type):
    """Print a formatted summary of the analysis results"""
    print(f"\n📊 {analysis_type}")
    print("=" * 60)
    print(f"✓ Query executed successfully")
    print(f"  Rows returned: {len(result.data):,}")
    print(f"  Columns: {len(result.data.columns)}")
    print(f"  Execution time: {result.execution_time:.2f} seconds")
    print(f"  Timestamp: {result.timestamp}")

    if len(result.data) > 0:
        print(f"\n📈 Sample Results (first 5 rows):")
        print("-" * 60)
        # Display first 5 rows in a readable format
        sample_data = result.data.head()

        # Convert to string and truncate long values for display
        for idx, row in sample_data.iterrows():
            print(f"Row {idx + 1}:")
            for col, val in row.items():
                if pd.isna(val):
                    display_val = "NULL"
                elif isinstance(val, (int, float)):
                    if isinstance(val, float) and val > 1000:
                        display_val = f"{val:,.2f}"
                    else:
                        display_val = f"{val:,}" if isinstance(val, int) else f"{val:.4f}"
                else:
                    display_val = str(val)
                    if len(display_val) > 50:
                        display_val = display_val[:47] + "..."

                print(f"  {col}: {display_val}")
            print()
    else:
        print("\n⚠️  No data returned by query")


if __name__ == "__main__":
    try:
        import pandas as pd
        exit_code = main()
        sys.exit(exit_code)
    except ImportError as e:
        print("Error: Required dependencies not installed.")
        print("Please install required packages: pip install pandas pyyaml")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Analysis interrupted by user")
        sys.exit(1)