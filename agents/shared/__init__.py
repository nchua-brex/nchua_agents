"""
Shared utilities for multi-agent system

Common functionality used across different specialized agents.
"""

from .mcp_clients import MCPClientManager
from .config_manager import ConfigManager
from .testing_framework import AgentTestFramework

__version__ = "1.0.0"
__all__ = ["MCPClientManager", "ConfigManager", "AgentTestFramework"]