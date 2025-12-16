#!/usr/bin/env python3
"""
Test suite for Data Retrieval Agent

Tests agent initialization, configuration, query loading, and basic functionality.
"""

import pytest
import os
import tempfile
from pathlib import Path
import yaml
import pandas as pd

# Add parent directory to path for imports
import sys
sys.path.append(str(Path(__file__).parent.parent))

from main import DataRetrievalAgent

class TestDataRetrievalAgent:
    """Test suite for DataRetrievalAgent class."""
    
    def test_agent_initialization(self):
        """Test basic agent initialization."""
        agent = DataRetrievalAgent()
        assert agent is not None
        assert agent.config is not None
        assert agent.logger is not None
    
    def test_config_loading(self):
        """Test configuration file loading."""
        agent = DataRetrievalAgent()
        
        # Check required config sections
        assert 'snowflake' in agent.config
        assert 'output' in agent.config
        assert 'templates' in agent.config
        assert 'business_rules' in agent.config
        
        # Check specific settings
        assert agent.config['snowflake']['default_warehouse'] == 'COMPUTE_XSMALL_WH'
        assert agent.config['snowflake']['default_role'] == 'BREX_NCHUA'
    
    def test_invalid_config_path(self):
        """Test handling of invalid configuration path."""
        with pytest.raises(FileNotFoundError):
            DataRetrievalAgent(config_path="/nonexistent/config.yaml")
    
    def test_query_template_loading(self):
        """Test SQL query template loading."""
        agent = DataRetrievalAgent()
        
        # Test loading existing template
        try:
            template = agent._load_query_template("customer_revenue")
            assert isinstance(template, str)
            assert len(template) > 0
            assert "SELECT" in template.upper()
        except FileNotFoundError:
            pytest.skip("Query template files not found")
    
    def test_nonexistent_template(self):
        """Test handling of nonexistent query template."""
        agent = DataRetrievalAgent()
        
        with pytest.raises(FileNotFoundError):
            agent._load_query_template("nonexistent_query")
    
    def test_business_rules_application(self):
        """Test business rules application to queries."""
        agent = DataRetrievalAgent()
        
        test_query = "SELECT * FROM test_table WHERE 1=1"
        processed_query = agent._apply_business_rules(test_query)
        
        # Should return the query (even if unchanged for now)
        assert isinstance(processed_query, str)
        assert len(processed_query) > 0
    
    def test_execute_query_mock(self):
        """Test query execution with mock data."""
        agent = DataRetrievalAgent()
        
        test_query = "SELECT customer_id, revenue FROM test_table"
        
        # Test different output formats
        df_result = agent.execute_query(test_query, output_format="dataframe")
        assert isinstance(df_result, pd.DataFrame)
        
        dict_result = agent.execute_query(test_query, output_format="dict")
        assert isinstance(dict_result, dict)
        
        csv_result = agent.execute_query(test_query, output_format="csv")
        assert isinstance(csv_result, str)
    
    def test_invalid_output_format(self):
        """Test handling of invalid output format."""
        agent = DataRetrievalAgent()
        
        with pytest.raises(ValueError):
            agent.execute_query("SELECT 1", output_format="invalid_format")
    
    def test_customer_revenue_data(self):
        """Test customer revenue data retrieval."""
        agent = DataRetrievalAgent()
        
        try:
            result = agent.get_customer_revenue_data(
                start_date="2024-01-01",
                end_date="2024-12-31",
                segment="enterprise"
            )
            assert result is not None
        except FileNotFoundError:
            pytest.skip("Query template not found")
    
    def test_territory_performance(self):
        """Test territory performance data retrieval."""
        agent = DataRetrievalAgent()
        
        try:
            result = agent.get_territory_performance(
                sc_owner="test@brex.com",
                period="current_quarter"
            )
            assert result is not None
        except FileNotFoundError:
            pytest.skip("Query template not found")
    
    def test_segmentation_analysis(self):
        """Test segmentation analysis data retrieval."""
        agent = DataRetrievalAgent()
        
        try:
            result = agent.get_segmentation_analysis(analysis_type="current")
            assert result is not None
        except FileNotFoundError:
            pytest.skip("Query template not found")

class TestIntegration:
    """Integration tests for the Data Retrieval Agent."""
    
    def test_agent_cli_interface(self):
        """Test the CLI interface functionality."""
        # This would test the CLI interface when run as main module
        # For now, just verify the agent can be imported and initialized
        agent = DataRetrievalAgent()
        assert agent is not None
    
    @pytest.mark.skip(reason="Requires actual MCP connection")
    def test_mcp_integration(self):
        """Test MCP integration (requires actual Snowflake MCP)."""
        # This test would verify actual MCP connectivity
        # Skipped unless MCP is available and configured
        pass
    
    def test_query_parameter_substitution(self):
        """Test SQL parameter substitution."""
        agent = DataRetrievalAgent()
        
        # Test with mock query containing parameters
        test_query = "SELECT * FROM table WHERE date >= '{start_date}' AND segment = '{segment}'"
        
        # This would test parameter substitution when implemented
        # For now, just verify the query is processed
        processed = agent._apply_business_rules(test_query)
        assert isinstance(processed, str)

# Performance tests
class TestPerformance:
    """Performance and stress tests."""
    
    def test_agent_initialization_performance(self):
        """Test agent initialization performance."""
        import time
        
        start_time = time.time()
        agent = DataRetrievalAgent()
        init_time = time.time() - start_time
        
        # Should initialize quickly (under 1 second)
        assert init_time < 1.0
    
    def test_config_loading_performance(self):
        """Test configuration loading performance."""
        import time
        
        agent = DataRetrievalAgent()
        
        start_time = time.time()
        config = agent._load_config()
        load_time = time.time() - start_time
        
        # Config loading should be fast
        assert load_time < 0.1

if __name__ == "__main__":
    # Run tests if script is executed directly
    pytest.main([__file__, "-v"])