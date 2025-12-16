#!/usr/bin/env python3
"""
Multi-Agent Orchestrator

Central orchestrator for managing and coordinating multiple specialized agents.
Handles agent lifecycle, task routing, and inter-agent communication.
"""

import sys
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import json

# Add agents directory to Python path
agents_dir = Path(__file__).parent / "agents"
sys.path.append(str(agents_dir))

class AgentOrchestrator:
    """
    Central orchestrator for multi-agent system.
    
    Manages agent instances, routes tasks to appropriate agents,
    and handles coordination between different specialized agents.
    """
    
    def __init__(self):
        """Initialize the agent orchestrator."""
        self.logger = logging.getLogger("AgentOrchestrator")
        self.agents = {}
        self.agent_registry = {
            "data_retrieval": {
                "module": "data_retrieval.main",
                "class": "DataRetrievalAgent",
                "description": "Handles Snowflake data queries and retrieval",
                "capabilities": ["sql_query", "data_export", "business_analytics"]
            }
            # Future agents will be registered here
        }
    
    def register_agent(self, agent_name: str, agent_info: Dict[str, Any]):
        """Register a new agent type."""
        self.agent_registry[agent_name] = agent_info
        self.logger.info(f"Registered agent: {agent_name}")
    
    def get_agent(self, agent_name: str, **kwargs):
        """Get or create agent instance."""
        if agent_name not in self.agents:
            if agent_name not in self.agent_registry:
                raise ValueError(f"Unknown agent type: {agent_name}")
            
            self.agents[agent_name] = self._create_agent(agent_name, **kwargs)
        
        return self.agents[agent_name]
    
    def _create_agent(self, agent_name: str, **kwargs):
        """Create new agent instance."""
        agent_info = self.agent_registry[agent_name]
        
        try:
            # Dynamic import of agent module
            module_path = agent_info["module"]
            class_name = agent_info["class"]
            
            module = __import__(module_path, fromlist=[class_name])
            agent_class = getattr(module, class_name)
            
            # Create agent instance
            agent = agent_class(**kwargs)
            
            self.logger.info(f"Created agent: {agent_name}")
            return agent
            
        except Exception as e:
            self.logger.error(f"Failed to create agent {agent_name}: {e}")
            raise
    
    def route_task(self, task_type: str, **params) -> Any:
        """Route task to appropriate agent based on task type."""
        # Map task types to agents
        task_routing = {
            "data_query": "data_retrieval",
            "customer_analysis": "data_retrieval", 
            "territory_analysis": "data_retrieval",
            "segmentation_analysis": "data_retrieval"
        }
        
        if task_type not in task_routing:
            raise ValueError(f"Unknown task type: {task_type}")
        
        agent_name = task_routing[task_type]
        agent = self.get_agent(agent_name)
        
        # Execute task based on type
        if task_type == "data_query":
            return agent.execute_query(**params)
        elif task_type == "customer_analysis":
            return agent.get_customer_revenue_data(**params)
        elif task_type == "territory_analysis":
            return agent.get_territory_performance(**params)
        elif task_type == "segmentation_analysis":
            return agent.get_segmentation_analysis(**params)
    
    def list_agents(self) -> Dict[str, Dict[str, Any]]:
        """List all registered agents and their capabilities."""
        return self.agent_registry.copy()
    
    def health_check(self) -> Dict[str, bool]:
        """Check health of all active agents."""
        health_status = {}
        
        for agent_name, agent in self.agents.items():
            try:
                # Basic health check - verify agent is responsive
                if hasattr(agent, 'config') and agent.config is not None:
                    health_status[agent_name] = True
                else:
                    health_status[agent_name] = False
            except Exception as e:
                health_status[agent_name] = False
                self.logger.error(f"Health check failed for {agent_name}: {e}")
        
        return health_status
    
    def shutdown_agents(self):
        """Shutdown all active agents."""
        for agent_name, agent in self.agents.items():
            try:
                if hasattr(agent, 'close'):
                    agent.close()
                self.logger.info(f"Shutdown agent: {agent_name}")
            except Exception as e:
                self.logger.error(f"Error shutting down {agent_name}: {e}")
        
        self.agents.clear()

# CLI Interface
def main():
    """CLI interface for agent orchestrator."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Multi-Agent Orchestrator")
    parser.add_argument("command", choices=["list", "health", "query", "test"],
                       help="Command to execute")
    parser.add_argument("--agent", help="Specific agent name")
    parser.add_argument("--task", help="Task type for routing")
    parser.add_argument("--params", help="JSON parameters for task")
    
    args = parser.parse_args()
    
    orchestrator = AgentOrchestrator()
    
    if args.command == "list":
        agents = orchestrator.list_agents()
        print("Registered Agents:")
        for name, info in agents.items():
            print(f"  {name}: {info['description']}")
            print(f"    capabilities: {', '.join(info['capabilities'])}")
    
    elif args.command == "health":
        health = orchestrator.health_check()
        print("Agent Health Status:")
        for agent, status in health.items():
            status_str = "✓ Healthy" if status else "✗ Unhealthy"
            print(f"  {agent}: {status_str}")
    
    elif args.command == "query":
        if not args.task:
            print("Error: --task required for query command")
            return
        
        params = {}
        if args.params:
            try:
                params = json.loads(args.params)
            except json.JSONDecodeError as e:
                print(f"Error parsing params JSON: {e}")
                return
        
        try:
            result = orchestrator.route_task(args.task, **params)
            print(f"Task Result: {result}")
        except Exception as e:
            print(f"Task execution failed: {e}")
    
    elif args.command == "test":
        print("Running basic orchestrator test...")
        
        try:
            # Test agent creation
            agent = orchestrator.get_agent("data_retrieval")
            print("✓ Data retrieval agent created successfully")
            
            # Test health check
            health = orchestrator.health_check()
            print(f"✓ Health check completed: {health}")
            
            print("✓ All tests passed")
            
        except Exception as e:
            print(f"✗ Test failed: {e}")

if __name__ == "__main__":
    main()