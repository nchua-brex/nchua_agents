"""
Base Agent Class for nchua_agents

This module provides the foundation for all specialized agents in the nchua_agents system.
Each agent inherits from BaseAgent and implements specific functionality while maintaining
consistent interfaces for orchestration and communication.
"""

import os
import json
import logging
import yaml
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict


@dataclass
class AgentTask:
    """Represents a task that can be executed by an agent"""
    id: str
    agent_type: str
    action: str
    parameters: Dict[str, Any]
    priority: int = 1
    created_at: str = None
    status: str = "pending"  # pending, running, completed, failed
    result: Any = None
    error_message: str = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()


@dataclass
class AgentResult:
    """Standard result format for agent operations"""
    success: bool
    data: Any = None
    metadata: Dict[str, Any] = None
    error_message: str = None
    execution_time: float = 0.0
    timestamp: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()
        if self.metadata is None:
            self.metadata = {}


class BaseAgent(ABC):
    """
    Base class for all agents in the nchua_agents system.

    Provides common functionality for:
    - Configuration management
    - Logging
    - Task execution
    - Result formatting
    - Inter-agent communication
    """

    def __init__(self, agent_name: str, config_path: Optional[str] = None):
        """
        Initialize the base agent

        Args:
            agent_name: Unique name for this agent
            config_path: Optional path to agent-specific config file
        """
        self.agent_name = agent_name
        self.config_path = config_path
        self.agent_id = f"{agent_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Set up logging
        self.logger = self._setup_logging()

        # Load configuration
        self.config = self._load_config()

        # Initialize agent
        self.logger.info(f"Agent {self.agent_name} initialized with ID: {self.agent_id}")

    def _setup_logging(self) -> logging.Logger:
        """Set up logging for this agent"""
        logger = logging.getLogger(f"nchua_agents.{self.agent_name}")

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                f'%(asctime)s - {self.agent_name} - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)

        return logger

    def _load_config(self) -> Dict[str, Any]:
        """Load agent configuration"""
        default_config = {
            "max_retries": 3,
            "timeout": 300,
            "output_directory": "./outputs",
            "log_level": "INFO"
        }

        if self.config_path and os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r') as f:
                    if self.config_path.endswith('.yaml') or self.config_path.endswith('.yml'):
                        user_config = yaml.safe_load(f) or {}
                    else:
                        user_config = json.load(f)
                    default_config.update(user_config)
            except Exception as e:
                self.logger.warning(f"Failed to load config from {self.config_path}: {e}")

        return default_config

    @abstractmethod
    def get_capabilities(self) -> List[str]:
        """
        Return list of capabilities this agent provides

        Returns:
            List of capability names
        """
        pass

    @abstractmethod
    def execute_task(self, task: AgentTask) -> AgentResult:
        """
        Execute a task assigned to this agent

        Args:
            task: The task to execute

        Returns:
            AgentResult containing execution results
        """
        pass

    def validate_task(self, task: AgentTask) -> bool:
        """
        Validate if this agent can handle the given task

        Args:
            task: Task to validate

        Returns:
            True if agent can handle task, False otherwise
        """
        return task.action in self.get_capabilities()

    def get_status(self) -> Dict[str, Any]:
        """
        Get current agent status

        Returns:
            Dictionary containing agent status information
        """
        return {
            "agent_name": self.agent_name,
            "agent_id": self.agent_id,
            "capabilities": self.get_capabilities(),
            "config": self.config,
            "timestamp": datetime.now().isoformat()
        }

    def save_result(self, result: AgentResult, filename: Optional[str] = None) -> str:
        """
        Save agent result to file

        Args:
            result: Result to save
            filename: Optional filename (auto-generated if not provided)

        Returns:
            Path to saved file
        """
        # Ensure output directory exists
        output_dir = Path(self.config.get("output_directory", "./outputs"))
        output_dir.mkdir(parents=True, exist_ok=True)

        # Generate filename if not provided
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{self.agent_name}_result_{timestamp}.json"

        file_path = output_dir / filename

        # Convert result to JSON-serializable format
        result_dict = {
            "agent_name": self.agent_name,
            "agent_id": self.agent_id,
            "result": asdict(result),
            "saved_at": datetime.now().isoformat()
        }

        with open(file_path, 'w') as f:
            json.dump(result_dict, f, indent=2, default=str)

        self.logger.info(f"Result saved to: {file_path}")
        return str(file_path)

    def communicate_with_agent(self, target_agent: 'BaseAgent', task: AgentTask) -> AgentResult:
        """
        Send a task to another agent

        Args:
            target_agent: The agent to communicate with
            task: Task to send

        Returns:
            Result from the target agent
        """
        self.logger.info(f"Communicating with {target_agent.agent_name} for task: {task.action}")

        if not target_agent.validate_task(task):
            return AgentResult(
                success=False,
                error_message=f"Target agent {target_agent.agent_name} cannot handle task: {task.action}"
            )

        return target_agent.execute_task(task)


class AgentRegistry:
    """
    Registry for managing multiple agents in the system
    """

    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.logger = logging.getLogger("nchua_agents.registry")

    def register_agent(self, agent: BaseAgent) -> bool:
        """
        Register an agent in the system

        Args:
            agent: Agent to register

        Returns:
            True if registered successfully, False otherwise
        """
        try:
            self.agents[agent.agent_name] = agent
            self.logger.info(f"Registered agent: {agent.agent_name}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to register agent {agent.agent_name}: {e}")
            return False

    def get_agent(self, agent_name: str) -> Optional[BaseAgent]:
        """Get agent by name"""
        return self.agents.get(agent_name)

    def list_agents(self) -> List[str]:
        """Get list of registered agent names"""
        return list(self.agents.keys())

    def get_agent_capabilities(self) -> Dict[str, List[str]]:
        """Get capabilities of all registered agents"""
        return {
            name: agent.get_capabilities()
            for name, agent in self.agents.items()
        }

    def find_agents_for_capability(self, capability: str) -> List[str]:
        """
        Find agents that have a specific capability

        Args:
            capability: Capability to search for

        Returns:
            List of agent names that have the capability
        """
        return [
            name for name, agent in self.agents.items()
            if capability in agent.get_capabilities()
        ]

    def execute_task(self, agent_name: str, task: AgentTask) -> AgentResult:
        """
        Execute a task on a specific agent

        Args:
            agent_name: Name of agent to execute task on
            task: Task to execute

        Returns:
            Result from agent execution
        """
        agent = self.get_agent(agent_name)
        if not agent:
            return AgentResult(
                success=False,
                error_message=f"Agent {agent_name} not found"
            )

        return agent.execute_task(task)


# Global registry instance
agent_registry = AgentRegistry()