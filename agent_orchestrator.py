#!/usr/bin/env python3
"""
Agent Orchestrator for nchua_agents

This is the main entry point for the nchua_agents system. It coordinates
multiple specialized agents to perform complex analysis tasks that require
data extraction, processing, and insights generation.

Usage:
    python agent_orchestrator.py --task customer-analysis --months 6
    python agent_orchestrator.py --task territory-performance --sc-names "John Smith,Jane Doe"
    python agent_orchestrator.py --list-agents
    python agent_orchestrator.py --list-capabilities
"""

import argparse
import sys
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from shared.utils.base_agent import BaseAgent, AgentTask, AgentResult, agent_registry
from agents.snowflake_agent.snowflake_data_agent import SnowflakeDataAgent


class AgentOrchestrator:
    """
    Main orchestrator for coordinating multiple agents to complete complex tasks
    """

    def __init__(self):
        self.setup_agents()

    def setup_agents(self):
        """Initialize and register all available agents"""
        # Register Snowflake Data Agent
        snowflake_agent = SnowflakeDataAgent()
        agent_registry.register_agent(snowflake_agent)

        print("🤖 Agent Orchestrator initialized")
        print(f"📊 Registered agents: {', '.join(agent_registry.list_agents())}")

    def execute_complex_task(self, task_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a complex task that may involve multiple agents

        Args:
            task_name: Name of the complex task to execute
            parameters: Parameters for the task

        Returns:
            Dictionary containing results from all involved agents
        """
        if task_name == "customer-analysis":
            return self._execute_customer_analysis(parameters)
        elif task_name == "territory-performance":
            return self._execute_territory_performance(parameters)
        elif task_name == "comprehensive-revenue-analysis":
            return self._execute_comprehensive_revenue_analysis(parameters)
        else:
            raise ValueError(f"Unknown task: {task_name}")

    def _execute_customer_analysis(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute comprehensive customer analysis using multiple data sources

        This task demonstrates agent coordination by:
        1. Extracting customer revenue data
        2. Performing segmentation analysis
        3. Running cohort analysis
        4. Combining results into comprehensive report
        """
        print("🎯 Starting Customer Analysis...")

        results = {}
        months = params.get('months', 3)

        # Task 1: Customer Revenue by Edition
        print("  📊 Extracting customer revenue by edition...")
        revenue_task = AgentTask(
            id="customer_revenue_analysis",
            agent_type="snowflake_agent",
            action="extract_customer_revenue_by_edition",
            parameters={"months_back": months}
        )
        results['revenue_by_edition'] = agent_registry.execute_task('snowflake_agent', revenue_task)

        # Task 2: Customer Revenue by OBS
        print("  🏢 Extracting customer revenue by OBS...")
        obs_task = AgentTask(
            id="customer_obs_analysis",
            agent_type="snowflake_agent",
            action="extract_customer_revenue_by_obs",
            parameters={"months_back": months}
        )
        results['revenue_by_obs'] = agent_registry.execute_task('snowflake_agent', obs_task)

        # Task 3: Cohort Analysis
        print("  📅 Running cohort analysis...")
        cohort_task = AgentTask(
            id="cohort_analysis",
            agent_type="snowflake_agent",
            action="extract_cohort_analysis",
            parameters={"months_back": months, "cohort_period": "year"}
        )
        results['cohort_analysis'] = agent_registry.execute_task('snowflake_agent', cohort_task)

        print("✅ Customer Analysis completed")
        return results

    def _execute_territory_performance(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute Solutions Consultant territory performance analysis
        """
        print("🎯 Starting Territory Performance Analysis...")

        results = {}
        months = params.get('months', 3)
        sc_names = params.get('sc_names', [])

        # Task 1: Territory Analysis
        print("  👥 Analyzing SC territories...")
        territory_task = AgentTask(
            id="territory_analysis",
            agent_type="snowflake_agent",
            action="generate_solutions_consultant_analysis",
            parameters={"sc_territories": sc_names, "months_back": months}
        )
        results['territory_analysis'] = agent_registry.execute_task('snowflake_agent', territory_task)

        # Task 2: Customer Revenue for Territory Context
        print("  📊 Getting customer revenue context...")
        revenue_task = AgentTask(
            id="revenue_context",
            agent_type="snowflake_agent",
            action="extract_customer_revenue_by_edition",
            parameters={"months_back": months}
        )
        results['revenue_context'] = agent_registry.execute_task('snowflake_agent', revenue_task)

        print("✅ Territory Performance Analysis completed")
        return results

    def _execute_comprehensive_revenue_analysis(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute comprehensive revenue analysis across all dimensions
        """
        print("🎯 Starting Comprehensive Revenue Analysis...")

        results = {}
        months = params.get('months', 6)

        # Multiple coordinated analyses
        analyses = [
            ("revenue_by_edition", "extract_customer_revenue_by_edition"),
            ("revenue_by_obs", "extract_customer_revenue_by_obs"),
            ("cohort_yearly", "extract_cohort_analysis"),
            ("territory_performance", "generate_solutions_consultant_analysis")
        ]

        for analysis_name, action in analyses:
            print(f"  📈 Running {analysis_name}...")
            task = AgentTask(
                id=analysis_name,
                agent_type="snowflake_agent",
                action=action,
                parameters={"months_back": months}
            )
            results[analysis_name] = agent_registry.execute_task('snowflake_agent', task)

        print("✅ Comprehensive Revenue Analysis completed")
        return results

    def export_results(self, results: Dict[str, Any], task_name: str) -> List[str]:
        """
        Export all results from a complex task

        Args:
            results: Results dictionary from complex task execution
            task_name: Name of the task for file naming

        Returns:
            List of paths to exported files
        """
        exported_files = []
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # Get Snowflake agent for export functionality
        snowflake_agent = agent_registry.get_agent('snowflake_agent')

        for analysis_name, result in results.items():
            if isinstance(result, AgentResult) and result.success and hasattr(result, 'data'):
                filename = f"{task_name}_{analysis_name}_{timestamp}.csv"
                try:
                    # Create a mock DataExtractionResult for export
                    from agents.snowflake_agent.snowflake_data_agent import DataExtractionResult
                    export_result = DataExtractionResult(
                        data=result.data,
                        query_used="Complex orchestrated task",
                        execution_time=result.execution_time,
                        timestamp=result.timestamp,
                        metadata=result.metadata
                    )
                    file_path = snowflake_agent.export_to_csv(export_result, filename)
                    exported_files.append(file_path)
                    print(f"  📁 Exported {analysis_name} to {file_path}")
                except Exception as e:
                    print(f"  ⚠️  Failed to export {analysis_name}: {e}")

        return exported_files

    def list_available_tasks(self) -> List[str]:
        """List all available complex tasks"""
        return [
            "customer-analysis",
            "territory-performance",
            "comprehensive-revenue-analysis"
        ]

    def get_task_description(self, task_name: str) -> str:
        """Get description of a specific task"""
        descriptions = {
            "customer-analysis": "Comprehensive customer analysis including revenue by edition, OBS segmentation, and cohort analysis",
            "territory-performance": "Solutions Consultant territory performance analysis with customer revenue context",
            "comprehensive-revenue-analysis": "Full revenue analysis across all dimensions and time periods"
        }
        return descriptions.get(task_name, "No description available")


def main():
    parser = argparse.ArgumentParser(
        description="Agent Orchestrator for nchua_agents - Coordinate multiple agents for complex analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --task customer-analysis --months 6 --export
  %(prog)s --task territory-performance --sc-names "John Smith,Jane Doe" --months 3
  %(prog)s --task comprehensive-revenue-analysis --months 12 --export
  %(prog)s --list-agents
  %(prog)s --list-tasks
        """
    )

    # Main operation modes
    parser.add_argument('--task', type=str, help='Complex task to execute')
    parser.add_argument('--list-agents', action='store_true', help='List all registered agents')
    parser.add_argument('--list-tasks', action='store_true', help='List all available complex tasks')
    parser.add_argument('--list-capabilities', action='store_true', help='List capabilities of all agents')

    # Task parameters
    parser.add_argument('--months', type=int, default=3, help='Number of months to analyze (default: 3)')
    parser.add_argument('--sc-names', type=str, help='Comma-separated list of Solutions Consultant names')
    parser.add_argument('--export', action='store_true', help='Export results to CSV files')

    args = parser.parse_args()

    try:
        orchestrator = AgentOrchestrator()

        if args.list_agents:
            print("\n🤖 Registered Agents:")
            print("-" * 40)
            for agent_name in agent_registry.list_agents():
                agent = agent_registry.get_agent(agent_name)
                print(f"  📊 {agent_name}")
                print(f"     Capabilities: {', '.join(agent.get_capabilities())}")

        elif args.list_tasks:
            print("\n🎯 Available Complex Tasks:")
            print("-" * 50)
            for task in orchestrator.list_available_tasks():
                print(f"  📋 {task}")
                print(f"     {orchestrator.get_task_description(task)}")

        elif args.list_capabilities:
            print("\n⚡ Agent Capabilities:")
            print("-" * 40)
            capabilities = agent_registry.get_agent_capabilities()
            for agent_name, caps in capabilities.items():
                print(f"  🤖 {agent_name}:")
                for cap in caps:
                    print(f"    • {cap}")

        elif args.task:
            # Parse SC names if provided
            sc_names = []
            if args.sc_names:
                sc_names = [name.strip() for name in args.sc_names.split(',')]

            # Prepare parameters
            parameters = {
                'months': args.months,
                'sc_names': sc_names
            }

            print(f"\n🚀 Executing task: {args.task}")
            print(f"📅 Analyzing last {args.months} months")
            if sc_names:
                print(f"👥 SC Territories: {', '.join(sc_names)}")

            # Execute the complex task
            results = orchestrator.execute_complex_task(args.task, parameters)

            # Print summary
            print(f"\n📋 Task Summary:")
            print(f"  Task: {args.task}")
            print(f"  Analyses completed: {len(results)}")

            for name, result in results.items():
                if isinstance(result, AgentResult):
                    status = "✅ Success" if result.success else "❌ Failed"
                    print(f"    {name}: {status}")
                    if hasattr(result, 'data') and result.data is not None:
                        print(f"      Rows: {len(result.data)}")

            # Export if requested
            if args.export:
                print(f"\n📤 Exporting results...")
                exported_files = orchestrator.export_results(results, args.task)
                print(f"✅ Exported {len(exported_files)} files")

        else:
            parser.print_help()

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())