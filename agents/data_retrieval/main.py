#!/usr/bin/env python3
"""
Data Retrieval Agent

Main implementation of the data retrieval agent that uses Snowflake MCP
for secure data access and provides templated queries for business objectives.
"""

import os
import yaml
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Union, Any
import pandas as pd

class DataRetrievalAgent:
    """
    Specialized agent for retrieving business data from Snowflake via MCP.
    
    Features:
    - Template-based query system
    - Business logic integration
    - Multiple output formats
    - Error handling and retries
    - Performance optimization
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize the Data Retrieval Agent."""
        self.config_path = config_path or Path(__file__).parent / "config.yaml"
        self.config = self._load_config()
        self.logger = self._setup_logging()
        
        # Will be initialized when needed
        self._mcp_client = None
        
    def _load_config(self) -> Dict[str, Any]:
        """Load agent configuration from YAML file."""
        try:
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)
            return config
        except FileNotFoundError:
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML configuration: {e}")
    
    def _setup_logging(self) -> logging.Logger:
        """Set up logging for the agent."""
        logger = logging.getLogger("DataRetrievalAgent")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            
        return logger
    
    def _get_mcp_client(self):
        """Get or create MCP client connection."""
        if self._mcp_client is None:
            # TODO: Initialize MCP client when available
            # For now, this would integrate with Claude Code's Snowflake MCP
            self.logger.info("MCP client connection would be initialized here")
            pass
        return self._mcp_client
    
    def _load_query_template(self, template_name: str) -> str:
        """Load SQL query template from file."""
        template_path = Path(self.config['templates']['base_path']) / f"{template_name}.sql"
        
        if not template_path.exists():
            raise FileNotFoundError(f"Query template not found: {template_path}")
            
        with open(template_path, 'r') as f:
            return f.read()
    
    def _apply_business_rules(self, query: str, filters: Dict[str, Any] = None) -> str:
        """Apply business rules and filters to SQL query."""
        # Apply default business rules from config
        business_rules = self.config.get('business_rules', {})
        
        # Apply custom filters
        if filters:
            # TODO: Implement dynamic filter injection
            pass
            
        return query
    
    def execute_query(self, 
                     query: str, 
                     parameters: Dict[str, Any] = None,
                     output_format: str = "dataframe") -> Union[pd.DataFrame, dict, str]:
        """
        Execute a SQL query using Snowflake MCP.
        
        Args:
            query: SQL query string
            parameters: Query parameters for substitution
            output_format: "dataframe", "dict", "csv"
            
        Returns:
            Query results in specified format
        """
        try:
            self.logger.info(f"Executing query with format: {output_format}")
            
            # Apply business rules
            processed_query = self._apply_business_rules(query, parameters)
            
            # TODO: Execute via MCP client
            # For now, return mock data structure
            mock_data = {
                "query_executed": processed_query[:100] + "...",
                "parameters": parameters,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            
            if output_format == "dataframe":
                return pd.DataFrame([mock_data])
            elif output_format == "dict":
                return mock_data
            elif output_format == "csv":
                return pd.DataFrame([mock_data]).to_csv(index=False)
            else:
                raise ValueError(f"Unsupported output format: {output_format}")
                
        except Exception as e:
            self.logger.error(f"Query execution failed: {e}")
            raise
    
    def get_customer_revenue_data(self, 
                                 start_date: str,
                                 end_date: str,
                                 segment: Optional[str] = None,
                                 output_format: str = "dataframe") -> Union[pd.DataFrame, dict, str]:
        """
        Get customer revenue data for specified time period.
        
        Args:
            start_date: Start date (YYYY-MM-DD format)
            end_date: End date (YYYY-MM-DD format)  
            segment: Customer segment filter (optional)
            output_format: Output format
            
        Returns:
            Customer revenue data
        """
        template = self._load_query_template("customer_revenue")
        
        parameters = {
            "start_date": start_date,
            "end_date": end_date,
            "segment": segment
        }
        
        return self.execute_query(template, parameters, output_format)
    
    def get_territory_performance(self,
                                sc_owner: Optional[str] = None,
                                period: str = "current_quarter",
                                output_format: str = "dataframe") -> Union[pd.DataFrame, dict, str]:
        """
        Get Solutions Consultant territory performance data.
        
        Args:
            sc_owner: SC owner email (optional, gets all if None)
            period: Time period ("current_quarter", "last_quarter", "ytd")
            output_format: Output format
            
        Returns:
            Territory performance data
        """
        template = self._load_query_template("territory_performance")
        
        parameters = {
            "sc_owner": sc_owner,
            "period": period
        }
        
        return self.execute_query(template, parameters, output_format)
    
    def get_segmentation_analysis(self,
                                analysis_type: str = "current",
                                output_format: str = "dataframe") -> Union[pd.DataFrame, dict, str]:
        """
        Get customer segmentation analysis data.
        
        Args:
            analysis_type: "current", "historical", "changes"
            output_format: Output format
            
        Returns:
            Segmentation analysis data
        """
        template = self._load_query_template("segmentation_analysis")
        
        parameters = {
            "analysis_type": analysis_type
        }
        
        return self.execute_query(template, parameters, output_format)

# CLI interface for testing
if __name__ == "__main__":
    import sys
    
    agent = DataRetrievalAgent()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "test":
            print("Testing Data Retrieval Agent...")
            result = agent.get_customer_revenue_data("2024-01-01", "2024-12-31")
            print(f"Test result: {result}")
            
        elif command == "territory":
            result = agent.get_territory_performance()
            print(f"Territory performance: {result}")
            
        else:
            print(f"Unknown command: {command}")
            print("Available commands: test, territory")
    else:
        print("Data Retrieval Agent initialized successfully!")
        print("Usage: python main.py [test|territory]")