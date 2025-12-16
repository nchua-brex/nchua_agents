"""
Data Retrieval Agent

A specialized subagent for executing Snowflake queries and retrieving business data.
Integrates with Snowflake MCP for secure, efficient data access.
"""

from .main import DataRetrievalAgent

__version__ = "1.0.0"
__all__ = ["DataRetrievalAgent"]