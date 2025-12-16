#!/usr/bin/env python3
"""
Agent Testing Framework

Shared testing utilities and framework for all agents in the system.
Provides standardized testing patterns, mocking, and validation.
"""

import pytest
import logging
import tempfile
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
import pandas as pd

class AgentTestFramework:
    """
    Standardized testing framework for all agents.
    
    Provides common testing utilities, mock data generation,
    and validation methods for consistent agent testing.
    """
    
    def __init__(self, agent_name: str):
        """Initialize testing framework for specific agent."""
        self.agent_name = agent_name
        self.logger = logging.getLogger(f"TestFramework-{agent_name}")
        self.temp_dir = None
        self.mock_data = {}
    
    def setup_test_environment(self) -> Path:
        """Set up temporary test environment."""
        self.temp_dir = tempfile.mkdtemp(prefix=f"agent_test_{self.agent_name}_")
        self.logger.info(f"Test environment created: {self.temp_dir}")
        return Path(self.temp_dir)
    
    def cleanup_test_environment(self):
        """Clean up temporary test environment."""
        if self.temp_dir:
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)
            self.logger.info("Test environment cleaned up")
    
    def create_mock_config(self, config_data: Dict[str, Any]) -> Path:
        """Create mock configuration file for testing."""
        if not self.temp_dir:
            self.setup_test_environment()
        
        config_path = Path(self.temp_dir) / "test_config.yaml"
        
        import yaml
        with open(config_path, 'w') as f:
            yaml.dump(config_data, f)
        
        return config_path
    
    def generate_mock_data(self, data_type: str, count: int = 10) -> pd.DataFrame:
        """Generate mock data for testing."""
        if data_type == "customer_revenue":
            return self._generate_customer_revenue_data(count)
        elif data_type == "territory_performance":
            return self._generate_territory_performance_data(count)
        elif data_type == "segmentation_data":
            return self._generate_segmentation_data(count)
        else:
            raise ValueError(f"Unsupported mock data type: {data_type}")
    
    def _generate_customer_revenue_data(self, count: int) -> pd.DataFrame:
        """Generate mock customer revenue data."""
        import random
        from datetime import timedelta
        
        base_date = datetime(2024, 1, 1)
        customers = [f"customer_{i:04d}" for i in range(1, count + 1)]
        segments = ["enterprise", "mid-market", "small-business"]
        
        data = []
        for i, customer in enumerate(customers):
            for month_offset in range(12):  # 12 months of data
                revenue_month = base_date + timedelta(days=month_offset * 30)
                data.append({
                    "customer_id": customer,
                    "customer_name": f"Customer {i+1}",
                    "segment": random.choice(segments),
                    "edition": random.choice(["startup", "scale", "enterprise"]),
                    "revenue_month": revenue_month.strftime("%Y-%m-%d"),
                    "net_revenue": random.randint(1000, 50000),
                    "gross_revenue": random.randint(1200, 60000),
                    "churned_revenue": random.randint(0, 500),
                    "expansion_revenue": random.randint(0, 5000),
                    "contraction_revenue": random.randint(0, 1000)
                })
        
        return pd.DataFrame(data)
    
    def _generate_territory_performance_data(self, count: int) -> pd.DataFrame:
        """Generate mock territory performance data."""
        import random
        
        data = []
        for i in range(count):
            data.append({
                "sc_owner": f"sc{i+1}@brex.com",
                "owner_name": f"SC Owner {i+1}",
                "total_customers": random.randint(10, 100),
                "total_revenue": random.randint(50000, 500000),
                "closed_won_count": random.randint(1, 20),
                "closed_won_revenue": random.randint(25000, 300000),
                "new_opps_90d": random.randint(5, 50),
                "avg_revenue_per_customer": random.randint(1000, 10000),
                "win_rate_90d": round(random.uniform(0.1, 0.8), 2)
            })
        
        return pd.DataFrame(data)
    
    def _generate_segmentation_data(self, count: int) -> pd.DataFrame:
        """Generate mock segmentation data."""
        import random
        
        segments = ["enterprise", "mid-market", "small-business", "startup"]
        data = []
        
        for segment in segments:
            data.append({
                "current_segment": segment,
                "customer_count": random.randint(50, 500),
                "total_revenue": random.randint(100000, 2000000),
                "avg_revenue": random.randint(2000, 15000),
                "min_revenue": random.randint(500, 2000),
                "max_revenue": random.randint(50000, 200000),
                "pct_of_customers": round(random.uniform(10, 40), 2),
                "pct_of_revenue": round(random.uniform(15, 45), 2)
            })
        
        return pd.DataFrame(data)
    
    def validate_dataframe(self, df: pd.DataFrame, expected_columns: List[str]) -> bool:
        """Validate DataFrame structure and content."""
        # Check if DataFrame exists and is not empty
        if df is None or df.empty:
            self.logger.error("DataFrame is None or empty")
            return False
        
        # Check required columns
        missing_columns = set(expected_columns) - set(df.columns)
        if missing_columns:
            self.logger.error(f"Missing required columns: {missing_columns}")
            return False
        
        # Check for null values in critical columns
        critical_nulls = df[expected_columns].isnull().sum()
        if critical_nulls.any():
            self.logger.warning(f"Null values found in critical columns: {critical_nulls}")
        
        self.logger.info(f"DataFrame validation passed: {len(df)} rows, {len(df.columns)} columns")
        return True
    
    def validate_query_result(self, result: Any, expected_type: type) -> bool:
        """Validate query result format and type."""
        if not isinstance(result, expected_type):
            self.logger.error(f"Expected {expected_type}, got {type(result)}")
            return False
        
        if expected_type == pd.DataFrame:
            return self.validate_dataframe(result, [])
        elif expected_type == dict:
            return len(result) > 0
        elif expected_type == str:
            return len(result) > 0
        
        return True
    
    def measure_performance(self, operation: Callable, *args, **kwargs) -> tuple:
        """Measure operation performance."""
        import time
        
        start_time = time.time()
        start_memory = self._get_memory_usage()
        
        try:
            result = operation(*args, **kwargs)
            success = True
        except Exception as e:
            result = e
            success = False
        
        end_time = time.time()
        end_memory = self._get_memory_usage()
        
        performance_metrics = {
            "execution_time": end_time - start_time,
            "memory_delta": end_memory - start_memory,
            "success": success,
            "timestamp": datetime.now().isoformat()
        }
        
        return result, performance_metrics
    
    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB."""
        try:
            import psutil
            process = psutil.Process()
            return process.memory_info().rss / 1024 / 1024  # Convert to MB
        except ImportError:
            # psutil not available, return 0
            return 0.0
    
    def create_test_report(self, test_results: Dict[str, Any]) -> str:
        """Create formatted test report."""
        report_lines = [
            f"# Agent Test Report: {self.agent_name}",
            f"Generated: {datetime.now().isoformat()}",
            "",
            "## Test Summary"
        ]
        
        total_tests = len(test_results)
        passed_tests = sum(1 for result in test_results.values() if result.get('success', False))
        
        report_lines.extend([
            f"- Total Tests: {total_tests}",
            f"- Passed: {passed_tests}",
            f"- Failed: {total_tests - passed_tests}",
            f"- Success Rate: {(passed_tests/total_tests*100):.1f}%",
            "",
            "## Detailed Results"
        ])
        
        for test_name, result in test_results.items():
            status = "✓ PASS" if result.get('success', False) else "✗ FAIL"
            report_lines.append(f"- **{test_name}**: {status}")
            
            if 'execution_time' in result:
                report_lines.append(f"  - Execution Time: {result['execution_time']:.3f}s")
            
            if 'error' in result:
                report_lines.append(f"  - Error: {result['error']}")
        
        return "\n".join(report_lines)

# Utility functions for common test scenarios
def run_agent_integration_test(agent_class, config_data: Dict[str, Any]) -> Dict[str, Any]:
    """Run standardized integration test for any agent."""
    framework = AgentTestFramework(agent_class.__name__)
    framework.setup_test_environment()
    
    try:
        # Create test config
        config_path = framework.create_mock_config(config_data)
        
        # Initialize agent
        agent = agent_class(config_path=str(config_path))
        
        # Run basic tests
        test_results = {}
        
        # Test 1: Agent initialization
        test_results['initialization'] = {'success': agent is not None}
        
        # Test 2: Configuration loading
        test_results['config_loading'] = {'success': agent.config is not None}
        
        # Test 3: Basic functionality (if agent has execute_query method)
        if hasattr(agent, 'execute_query'):
            try:
                result = agent.execute_query("SELECT 1 as test", output_format="dict")
                test_results['basic_query'] = {'success': result is not None}
            except Exception as e:
                test_results['basic_query'] = {'success': False, 'error': str(e)}
        
        return test_results
        
    finally:
        framework.cleanup_test_environment()

# Export key classes and functions
__all__ = ["AgentTestFramework", "run_agent_integration_test"]