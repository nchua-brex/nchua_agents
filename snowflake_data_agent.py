#!/usr/bin/env python3
"""
Snowflake Data Extraction Agent for Solutions Consultant Attainment Analysis

This agent provides intelligent data extraction from Snowflake for customer revenue
analysis, segmentation, and Solutions Consultant performance metrics. It uses
validated query patterns from the data team and learns from additional SQL queries.

Features:
- Customer revenue analysis (SaaS vs Non-SaaS)
- Customer segmentation by edition, OBS, and cohorts
- Solutions Consultant territory analysis
- Methodology improvement through query learning
- Automated data formatting and export

Usage:
    agent = SnowflakeDataAgent()
    data = agent.extract_customer_revenue_by_edition()
    agent.export_to_csv(data, "customer_revenue_analysis.csv")
"""

import os
import json
import logging
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
import yaml
import sqlite3
from dataclasses import dataclass, asdict
import subprocess

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('snowflake_agent.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class QueryPattern:
    """Represents a learned SQL query pattern"""
    name: str
    description: str
    sql_template: str
    parameters: List[str]
    category: str
    created_date: str
    usage_count: int = 0
    success_rate: float = 1.0


@dataclass
class DataExtractionResult:
    """Container for data extraction results"""
    data: pd.DataFrame
    query_used: str
    execution_time: float
    timestamp: str
    metadata: Dict[str, Any]


class SnowflakeDataAgent:
    """
    Intelligent Snowflake data extraction agent for Solutions Consultant analysis.

    This agent encapsulates the business logic for extracting and analyzing customer
    data using validated patterns from the Brex data team, with the ability to learn
    and improve from new SQL queries.
    """

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the Snowflake Data Agent

        Args:
            config_path: Path to agent configuration file
        """
        self.config_path = config_path or "snowflake_agent_config.yaml"
        self.patterns_db_path = "query_patterns.db"
        self.project_root = Path(__file__).parent

        # Load configuration
        self.config = self._load_config()

        # Initialize pattern database
        self._init_patterns_db()

        # Load reference patterns from existing queries
        self._load_reference_patterns()

        logger.info("SnowflakeDataAgent initialized successfully")

    def _load_config(self) -> Dict[str, Any]:
        """Load agent configuration"""
        default_config = {
            "default_warehouse": "COMPUTE_XSMALL_WH",
            "default_role": "BREX_NCHUA",
            "output_directory": "./data_extracts",
            "max_query_timeout": 300,
            "auto_optimize_queries": True,
            "common_filters": {
                "active_customers_only": True,
                "exclude_test_accounts": True,
                "default_date_range_months": 3
            }
        }

        if os.path.exists(self.config_path):
            with open(self.config_path, 'r') as f:
                user_config = yaml.safe_load(f) or {}
                default_config.update(user_config)

        return default_config

    def _init_patterns_db(self):
        """Initialize SQLite database for storing query patterns"""
        conn = sqlite3.connect(self.patterns_db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS query_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                sql_template TEXT NOT NULL,
                parameters TEXT,  -- JSON array of parameter names
                category TEXT,
                created_date TEXT,
                usage_count INTEGER DEFAULT 0,
                success_rate REAL DEFAULT 1.0,
                last_used TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS query_executions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern_name TEXT,
                execution_date TEXT,
                success BOOLEAN,
                execution_time REAL,
                row_count INTEGER,
                error_message TEXT,
                FOREIGN KEY (pattern_name) REFERENCES query_patterns (name)
            )
        ''')

        conn.commit()
        conn.close()

    def _load_reference_patterns(self):
        """Load validated query patterns from reference_queries.sql"""
        reference_file = self.project_root / "reference_queries.sql"

        if not reference_file.exists():
            logger.warning("reference_queries.sql not found")
            return

        with open(reference_file, 'r') as f:
            content = f.read()

        # Parse the reference queries and store as patterns
        patterns = self._parse_reference_queries(content)

        for pattern in patterns:
            self._store_query_pattern(pattern)

    def _parse_reference_queries(self, content: str) -> List[QueryPattern]:
        """Parse reference queries file into QueryPattern objects"""
        patterns = []

        # Customer Edition Analysis
        patterns.append(QueryPattern(
            name="customer_revenue_by_edition",
            description="Analyze customer revenue metrics by edition (SaaS vs Non-SaaS) for last 3 months",
            sql_template=self._extract_query_from_content(content, "Customer Edition Analysis"),
            parameters=["months_back"],
            category="customer_analysis",
            created_date=datetime.now().isoformat()
        ))

        # Customer Edition Analysis by OBS
        patterns.append(QueryPattern(
            name="customer_revenue_by_edition_and_obs",
            description="Analyze customer revenue by edition and One Brex Segment (Finance segmentation)",
            sql_template=self._extract_query_from_content(content, "Customer Edition Analysis by One Brex Segment"),
            parameters=["months_back"],
            category="customer_segmentation",
            created_date=datetime.now().isoformat()
        ))

        # Cohort Analysis
        patterns.append(QueryPattern(
            name="cohort_analysis_by_edition",
            description="Analyze customer evolution over time by acquisition cohort and edition",
            sql_template=self._extract_query_from_content(content, "Cohort Analysis by Customer Edition"),
            parameters=["months_back", "cohort_period"],
            category="cohort_analysis",
            created_date=datetime.now().isoformat()
        ))

        return patterns

    def _extract_query_from_content(self, content: str, section_name: str) -> str:
        """Extract SQL query from a specific section in the reference file"""
        lines = content.split('\n')
        start_idx = None
        end_idx = None

        for i, line in enumerate(lines):
            if section_name in line and line.strip().startswith('--'):
                start_idx = i
            elif start_idx is not None and line.strip().startswith('-- ======'):
                end_idx = i
                break

        if start_idx is not None:
            end_idx = end_idx or len(lines)
            query_lines = []
            in_query = False

            for line in lines[start_idx:end_idx]:
                if line.strip() and not line.strip().startswith('--'):
                    in_query = True
                    query_lines.append(line)
                elif in_query and line.strip().startswith('--'):
                    break
                elif in_query:
                    query_lines.append(line)

            return '\n'.join(query_lines).strip()

        return ""

    def _store_query_pattern(self, pattern: QueryPattern):
        """Store a query pattern in the database"""
        conn = sqlite3.connect(self.patterns_db_path)
        cursor = conn.cursor()

        try:
            cursor.execute('''
                INSERT OR REPLACE INTO query_patterns
                (name, description, sql_template, parameters, category, created_date, usage_count, success_rate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                pattern.name,
                pattern.description,
                pattern.sql_template,
                json.dumps(pattern.parameters),
                pattern.category,
                pattern.created_date,
                pattern.usage_count,
                pattern.success_rate
            ))
            conn.commit()
            logger.info(f"Stored query pattern: {pattern.name}")
        except Exception as e:
            logger.error(f"Failed to store pattern {pattern.name}: {e}")
        finally:
            conn.close()

    def execute_snowflake_query(self, query: str, description: str = "") -> DataExtractionResult:
        """
        Execute a Snowflake query using the snow CLI

        Args:
            query: SQL query to execute
            description: Description of the query for logging

        Returns:
            DataExtractionResult with query results and metadata
        """
        start_time = datetime.now()

        try:
            logger.info(f"Executing query: {description}")

            # Create temporary SQL file
            temp_sql_file = f"temp_query_{int(start_time.timestamp())}.sql"
            with open(temp_sql_file, 'w') as f:
                f.write(query)

            # Execute using snow CLI with CSV output
            cmd = [
                "snow", "sql",
                "-f", temp_sql_file,
                "--format", "csv"
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.config["max_query_timeout"]
            )

            # Clean up temp file
            os.remove(temp_sql_file)

            if result.returncode != 0:
                raise Exception(f"Snowflake query failed: {result.stderr}")

            # Parse CSV output into DataFrame
            from io import StringIO
            df = pd.read_csv(StringIO(result.stdout))

            execution_time = (datetime.now() - start_time).total_seconds()

            return DataExtractionResult(
                data=df,
                query_used=query,
                execution_time=execution_time,
                timestamp=start_time.isoformat(),
                metadata={
                    "description": description,
                    "row_count": len(df),
                    "column_count": len(df.columns)
                }
            )

        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            raise

    def extract_customer_revenue_by_edition(self, months_back: int = 3) -> DataExtractionResult:
        """
        Extract customer revenue analysis by edition (SaaS vs Non-SaaS)

        Args:
            months_back: Number of months to look back for analysis

        Returns:
            DataExtractionResult containing the analysis
        """
        pattern = self._get_query_pattern("customer_revenue_by_edition")
        if not pattern:
            raise ValueError("Customer revenue by edition pattern not found")

        # Substitute parameters in the SQL template
        query = pattern.sql_template.replace(
            "DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE))",
            f"DATEADD('month', -{months_back}, DATE_TRUNC('month', CURRENT_DATE))"
        )

        result = self.execute_snowflake_query(
            query,
            f"Customer Revenue by Edition Analysis (L{months_back}M)"
        )

        self._record_query_execution("customer_revenue_by_edition", True, result.execution_time, len(result.data))

        return result

    def extract_customer_revenue_by_obs(self, months_back: int = 3) -> DataExtractionResult:
        """
        Extract customer revenue analysis by edition and One Brex Segment

        Args:
            months_back: Number of months to look back for analysis

        Returns:
            DataExtractionResult containing the analysis
        """
        pattern = self._get_query_pattern("customer_revenue_by_edition_and_obs")
        if not pattern:
            raise ValueError("Customer revenue by OBS pattern not found")

        query = pattern.sql_template.replace(
            "DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE))",
            f"DATEADD('month', -{months_back}, DATE_TRUNC('month', CURRENT_DATE))"
        )

        result = self.execute_snowflake_query(
            query,
            f"Customer Revenue by Edition and OBS Analysis (L{months_back}M)"
        )

        self._record_query_execution("customer_revenue_by_edition_and_obs", True, result.execution_time, len(result.data))

        return result

    def extract_cohort_analysis(self, months_back: int = 3, cohort_period: str = "year") -> DataExtractionResult:
        """
        Extract cohort analysis by customer edition

        Args:
            months_back: Number of months to look back for analysis
            cohort_period: Cohort grouping period ('year', 'quarter', 'month')

        Returns:
            DataExtractionResult containing the cohort analysis
        """
        pattern = self._get_query_pattern("cohort_analysis_by_edition")
        if not pattern:
            raise ValueError("Cohort analysis pattern not found")

        query = pattern.sql_template.replace(
            "DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE))",
            f"DATEADD('month', -{months_back}, DATE_TRUNC('month', CURRENT_DATE))"
        ).replace(
            "DATE_TRUNC('year', cohort_start_date)",
            f"DATE_TRUNC('{cohort_period}', cohort_start_date)"
        )

        result = self.execute_snowflake_query(
            query,
            f"Cohort Analysis by Edition (L{months_back}M, {cohort_period}ly cohorts)"
        )

        self._record_query_execution("cohort_analysis_by_edition", True, result.execution_time, len(result.data))

        return result

    def learn_new_query(self, name: str, description: str, sql: str, category: str, parameters: List[str] = None) -> bool:
        """
        Learn a new SQL query pattern for future use

        Args:
            name: Unique name for the pattern
            description: Description of what the query does
            sql: SQL query template
            category: Category for organization
            parameters: List of parameter names that can be substituted

        Returns:
            True if successfully stored, False otherwise
        """
        try:
            pattern = QueryPattern(
                name=name,
                description=description,
                sql_template=sql,
                parameters=parameters or [],
                category=category,
                created_date=datetime.now().isoformat()
            )

            self._store_query_pattern(pattern)
            logger.info(f"Learned new query pattern: {name}")
            return True
        except Exception as e:
            logger.error(f"Failed to learn new query pattern {name}: {e}")
            return False

    def _get_query_pattern(self, name: str) -> Optional[QueryPattern]:
        """Retrieve a query pattern by name"""
        conn = sqlite3.connect(self.patterns_db_path)
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM query_patterns WHERE name = ?",
            (name,)
        )

        row = cursor.fetchone()
        conn.close()

        if row:
            return QueryPattern(
                name=row[1],
                description=row[2],
                sql_template=row[3],
                parameters=json.loads(row[4]) if row[4] else [],
                category=row[5],
                created_date=row[6],
                usage_count=row[7],
                success_rate=row[8]
            )

        return None

    def _record_query_execution(self, pattern_name: str, success: bool, execution_time: float, row_count: int, error_msg: str = None):
        """Record query execution statistics"""
        conn = sqlite3.connect(self.patterns_db_path)
        cursor = conn.cursor()

        # Record execution
        cursor.execute('''
            INSERT INTO query_executions
            (pattern_name, execution_date, success, execution_time, row_count, error_message)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            pattern_name,
            datetime.now().isoformat(),
            success,
            execution_time,
            row_count,
            error_msg
        ))

        # Update pattern statistics
        cursor.execute('''
            UPDATE query_patterns
            SET usage_count = usage_count + 1,
                last_used = ?,
                success_rate = (
                    SELECT AVG(CAST(success AS FLOAT))
                    FROM query_executions
                    WHERE pattern_name = ?
                )
            WHERE name = ?
        ''', (
            datetime.now().isoformat(),
            pattern_name,
            pattern_name
        ))

        conn.commit()
        conn.close()

    def export_to_csv(self, result: DataExtractionResult, filename: str) -> str:
        """
        Export DataExtractionResult to CSV file

        Args:
            result: Data extraction result to export
            filename: Output filename

        Returns:
            Full path to the exported file
        """
        # Ensure output directory exists
        output_dir = Path(self.config["output_directory"])
        output_dir.mkdir(exist_ok=True)

        # Create full path
        full_path = output_dir / filename

        # Export DataFrame to CSV
        result.data.to_csv(full_path, index=False)

        # Create metadata file
        metadata_path = full_path.with_suffix('.metadata.json')
        metadata = {
            "export_timestamp": datetime.now().isoformat(),
            "query_execution_time": result.execution_time,
            "original_timestamp": result.timestamp,
            "row_count": len(result.data),
            "column_count": len(result.data.columns),
            "columns": list(result.data.columns),
            "query_used": result.query_used,
            "metadata": result.metadata
        }

        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        logger.info(f"Exported data to {full_path} ({len(result.data)} rows)")
        return str(full_path)

    def get_available_patterns(self) -> List[Dict[str, Any]]:
        """Get list of available query patterns"""
        conn = sqlite3.connect(self.patterns_db_path)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT name, description, category, usage_count, success_rate, last_used
            FROM query_patterns
            ORDER BY category, usage_count DESC
        ''')

        patterns = []
        for row in cursor.fetchall():
            patterns.append({
                "name": row[0],
                "description": row[1],
                "category": row[2],
                "usage_count": row[3],
                "success_rate": row[4],
                "last_used": row[5]
            })

        conn.close()
        return patterns

    def execute_custom_query(self, sql: str, description: str = "Custom Query") -> DataExtractionResult:
        """
        Execute a custom SQL query and optionally learn from it

        Args:
            sql: SQL query to execute
            description: Description of the query

        Returns:
            DataExtractionResult containing the results
        """
        result = self.execute_snowflake_query(sql, description)

        # Log the successful execution for potential learning
        logger.info(f"Custom query executed successfully: {description}")

        return result

    def optimize_query_for_performance(self, sql: str) -> str:
        """
        Apply performance optimization patterns to a SQL query

        Args:
            sql: SQL query to optimize

        Returns:
            Optimized SQL query
        """
        optimized = sql

        # Apply common optimizations based on Snowflake best practices
        optimizations = [
            # Ensure proper filtering early
            (
                "FROM coredata.customer.customer_wide",
                "FROM coredata.customer.customer_wide\nWHERE internal_account_type = 'customer_account'\n  AND status = 'active'"
            ),
            # Add date filtering hints
            (
                "JOIN coredata.customer.customers_monthly__net_revenue",
                "JOIN coredata.customer.customers_monthly__net_revenue"
            )
        ]

        for old, new in optimizations:
            if old in sql and "WHERE internal_account_type = 'customer_account'" not in sql:
                optimized = optimized.replace(old, new)

        return optimized

    def generate_solutions_consultant_analysis(self, sc_territories: List[str] = None) -> DataExtractionResult:
        """
        Generate Solutions Consultant territory analysis

        Args:
            sc_territories: List of SC territory names to analyze

        Returns:
            DataExtractionResult with SC territory analysis
        """
        # Build custom query for SC analysis
        territory_filter = ""
        if sc_territories:
            territory_list = "', '".join(sc_territories)
            territory_filter = f"AND a.owner_name IN ('{territory_list}')"

        sc_analysis_query = f"""
        WITH sc_customers AS (
            SELECT
                a.owner_name as solutions_consultant,
                a.customer_account_id,
                a.name as account_name,
                cw.empower_edition,
                CASE
                    WHEN cw.empower_edition LIKE '%Essentials%' THEN 'Essentials Edition'
                    ELSE cw.empower_edition
                END AS actual_edition,
                cw.one_brex_segment,
                cw.employee_count,
                AVG(nrr.net_revenue) as avg_l3m_net_revenue,
                AVG(nrr.empower_revenue) as avg_l3m_saas_revenue,
                SUM(nrr.net_revenue) as total_l3m_net_revenue,
                SUM(nrr.empower_revenue) as total_l3m_saas_revenue
            FROM coredata.salesforce.accounts a
            INNER JOIN coredata.customer.customer_wide cw
                ON a.customer_account_id = cw.customer_account_id
            LEFT JOIN coredata.customer.customers_monthly__net_revenue nrr
                ON cw.customer_account_id = nrr.customer_account_id
                AND nrr.report_month_date >= DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE))
                AND nrr.report_month_date < DATE_TRUNC('month', CURRENT_DATE)
            WHERE cw.internal_account_type = 'customer_account'
                AND cw.status = 'active'
                AND a.owner_name IS NOT NULL
                {territory_filter}
            GROUP BY 1, 2, 3, 4, 5, 6, 7
        )

        SELECT
            solutions_consultant,
            COUNT(DISTINCT customer_account_id) as customer_count,
            COUNT(DISTINCT CASE WHEN actual_edition IN ('Premium Edition', 'Enterprise Edition')
                  THEN customer_account_id END) as saas_customers,
            COUNT(DISTINCT CASE WHEN actual_edition LIKE '%Essentials%'
                  THEN customer_account_id END) as non_saas_customers,
            SUM(total_l3m_net_revenue) as total_revenue_l3m,
            SUM(total_l3m_saas_revenue) as total_saas_revenue_l3m,
            AVG(avg_l3m_net_revenue) as avg_revenue_per_customer,
            AVG(employee_count) as avg_customer_size,
            COUNT(DISTINCT one_brex_segment) as obs_segments_covered
        FROM sc_customers
        GROUP BY 1
        ORDER BY total_revenue_l3m DESC
        """

        result = self.execute_snowflake_query(
            sc_analysis_query,
            "Solutions Consultant Territory Analysis"
        )

        return result


# Usage example and CLI interface
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Snowflake Data Agent for Solutions Consultant Analysis")
    parser.add_argument("--action", choices=[
        "customer-revenue", "obs-analysis", "cohort-analysis",
        "sc-analysis", "custom-query", "list-patterns"
    ], required=True, help="Action to perform")
    parser.add_argument("--months", type=int, default=3, help="Number of months to analyze")
    parser.add_argument("--output", type=str, help="Output filename")
    parser.add_argument("--query", type=str, help="Custom SQL query to execute")
    parser.add_argument("--sc-territories", nargs='+', help="Solutions Consultant territories to analyze")

    args = parser.parse_args()

    # Initialize agent
    agent = SnowflakeDataAgent()

    try:
        if args.action == "customer-revenue":
            result = agent.extract_customer_revenue_by_edition(args.months)
            output_file = args.output or f"customer_revenue_by_edition_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        elif args.action == "obs-analysis":
            result = agent.extract_customer_revenue_by_obs(args.months)
            output_file = args.output or f"customer_revenue_by_obs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        elif args.action == "cohort-analysis":
            result = agent.extract_cohort_analysis(args.months)
            output_file = args.output or f"cohort_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        elif args.action == "sc-analysis":
            result = agent.generate_solutions_consultant_analysis(args.sc_territories)
            output_file = args.output or f"sc_territory_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        elif args.action == "custom-query":
            if not args.query:
                print("Error: --query parameter required for custom-query action")
                exit(1)
            result = agent.execute_custom_query(args.query, "Custom CLI Query")
            output_file = args.output or f"custom_query_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        elif args.action == "list-patterns":
            patterns = agent.get_available_patterns()
            print("\nAvailable Query Patterns:")
            print("-" * 80)
            for pattern in patterns:
                print(f"Name: {pattern['name']}")
                print(f"Description: {pattern['description']}")
                print(f"Category: {pattern['category']}")
                print(f"Usage Count: {pattern['usage_count']}")
                print(f"Success Rate: {pattern['success_rate']:.2%}")
                print(f"Last Used: {pattern['last_used'] or 'Never'}")
                print("-" * 80)
            exit(0)

        # Export results if we have them
        if 'result' in locals():
            file_path = agent.export_to_csv(result, output_file)
            print(f"Results exported to: {file_path}")
            print(f"Rows extracted: {len(result.data)}")
            print(f"Execution time: {result.execution_time:.2f} seconds")

    except Exception as e:
        logger.error(f"Error executing action {args.action}: {e}")
        print(f"Error: {e}")
        exit(1)