# nchua_agents 🤖

A modular multi-agent system for intelligent data analysis and automation. This system provides specialized agents that can work independently or collaboratively to perform complex analysis tasks.

## 🎯 Overview

The `nchua_agents` system is designed to be a scalable platform for deploying specialized AI agents that can:

- **Work Independently**: Each agent has specific capabilities and can operate standalone
- **Collaborate Seamlessly**: Agents can communicate and coordinate through the orchestrator
- **Learn and Improve**: Agents can learn from successful patterns and optimize over time
- **Scale Horizontally**: Easy to add new specialized agents as needs grow

### Current Agents

| Agent | Purpose | Capabilities |
|-------|---------|--------------|
| 🗄️ **Snowflake Agent** | Data extraction and analysis from Snowflake | Customer revenue analysis, territory performance, cohort analysis, query pattern learning |

### Coming Soon
- 📊 **Analysis Agent**: Advanced statistical analysis and insights generation
- 📈 **Visualization Agent**: Automated chart and dashboard creation
- 📧 **Reporting Agent**: Automated report generation and distribution
- 🔍 **Research Agent**: Web research and competitive intelligence

## 🏗️ System Architecture

```
nchua_agents/
├── 🤖 agent_orchestrator.py          # Main coordination system
├── 🔧 shared/                        # Shared utilities and base classes
│   └── utils/
│       ├── base_agent.py             # Base agent class and interfaces
│       └── __init__.py
├── 🏢 agents/                        # Individual agent implementations
│   ├── snowflake_agent/              # Snowflake data extraction agent
│   │   ├── snowflake_data_agent.py   # Main agent implementation
│   │   ├── snowflake_agent_config.yaml # Agent configuration
│   │   ├── run_analysis.py           # Standalone CLI interface
│   │   └── __init__.py
│   └── __init__.py
├── 📚 Documentation & Reference
│   ├── README.md                     # This file
│   ├── SNOWFLAKE_SCHEMA.md          # Snowflake database schema
│   ├── reference_queries.sql        # Validated SQL patterns
│   └── SNOWFLAKE_MCP_TROUBLESHOOTING.md
├── 📊 Analysis & Data
│   ├── *.csv                        # Analysis results
│   ├── *.sql                        # Custom queries
│   └── data_extracts/               # Generated exports
└── 📋 Project Files
    ├── requirements.txt
    └── .gitignore
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/nchua-brex/nchua_agents.git
cd nchua_agents

# Install dependencies
pip install -r requirements.txt

# Make executables
chmod +x agent_orchestrator.py
chmod +x agents/snowflake_agent/run_analysis.py
```

### 2. Basic Usage

#### Using the Orchestrator (Recommended)

```bash
# Run comprehensive customer analysis
python agent_orchestrator.py --task customer-analysis --months 6 --export

# Analyze specific SC territories
python agent_orchestrator.py --task territory-performance --sc-names "John Smith,Jane Doe" --export

# Run complete revenue analysis across all dimensions
python agent_orchestrator.py --task comprehensive-revenue-analysis --months 12 --export

# List available agents and capabilities
python agent_orchestrator.py --list-agents
python agent_orchestrator.py --list-capabilities
```

#### Using Individual Agents

```bash
# Snowflake Agent - Customer revenue analysis
python agents/snowflake_agent/run_analysis.py customer-revenue --months 6 --export

# Snowflake Agent - Territory analysis
python agents/snowflake_agent/run_analysis.py sc-territories "John Smith" --export

# Snowflake Agent - Learn new query pattern
python agents/snowflake_agent/run_analysis.py learn-query \
  --name "pipeline_analysis" \
  --description "Analyze sales pipeline performance" \
  --file pipeline_query.sql \
  --category "sales_analysis"
```

## 🤖 Agent System Features

### Multi-Agent Orchestration

The orchestrator coordinates multiple agents to complete complex tasks:

```python
# Example: Customer Analysis involves multiple coordinated steps
1. Extract customer revenue data (Snowflake Agent)
2. Perform segmentation analysis (Snowflake Agent)
3. Run cohort analysis (Snowflake Agent)
4. Generate insights (Future: Analysis Agent)
5. Create visualizations (Future: Visualization Agent)
6. Compile report (Future: Reporting Agent)
```

### Intelligent Task Routing

```python
# The orchestrator automatically routes tasks to appropriate agents
task = AgentTask(
    action="extract_customer_revenue_by_edition",
    agent_type="snowflake_agent",
    parameters={"months_back": 6}
)

# Orchestrator finds and executes on the right agent
result = orchestrator.execute_task("snowflake_agent", task)
```

### Pattern Learning and Optimization

Agents learn from successful operations:

```python
# Agents automatically track query performance
agent.learn_new_query(
    name="custom_territory_analysis",
    sql=your_successful_query,
    category="territory_analysis"
)

# Future executions can reuse learned patterns
patterns = agent.get_available_patterns()
```

## 📊 Available Analysis Types

### 1. Customer Analysis
- **Revenue by Edition**: SaaS vs Non-SaaS customer analysis
- **OBS Segmentation**: Analysis by One Brex Segment (Finance)
- **Cohort Analysis**: Customer lifecycle and retention patterns

### 2. Territory Performance
- **SC Performance**: Solutions Consultant territory analysis
- **Customer Attribution**: Revenue attribution to territories
- **Territory Coverage**: Geographic and segment coverage analysis

### 3. Comprehensive Revenue Analysis
- **Multi-Dimensional**: Revenue analysis across all segments and time periods
- **Trend Analysis**: Historical patterns and growth trends
- **Comparative Analysis**: Performance comparisons across dimensions

## 🔧 Configuration

### Global Configuration

Each agent can be configured through YAML files:

```yaml
# agents/snowflake_agent/snowflake_agent_config.yaml
default_warehouse: "COMPUTE_XSMALL_WH"
output_directory: "./data_extracts"
methodology_improvement:
  auto_learn_successful_queries: true
  track_query_performance: true
```

### Agent Registration

New agents are automatically registered with the orchestrator:

```python
# agents/__init__.py - Add new agents here
from agents.new_agent.new_agent import NewAgent

def register_all_agents():
    registry = AgentRegistry()
    registry.register_agent(SnowflakeDataAgent())
    registry.register_agent(NewAgent())  # New agent
    return registry
```

## 🔄 Adding New Agents

### 1. Create Agent Structure

```bash
mkdir -p agents/my_new_agent
touch agents/my_new_agent/__init__.py
touch agents/my_new_agent/my_agent.py
touch agents/my_new_agent/config.yaml
```

### 2. Implement Agent Class

```python
# agents/my_new_agent/my_agent.py
from shared.utils.base_agent import BaseAgent, AgentTask, AgentResult

class MyNewAgent(BaseAgent):
    def __init__(self):
        super().__init__("my_new_agent", "path/to/config.yaml")

    def get_capabilities(self) -> List[str]:
        return ["capability1", "capability2"]

    def execute_task(self, task: AgentTask) -> AgentResult:
        # Implement task execution logic
        pass
```

### 3. Register with Orchestrator

```python
# agent_orchestrator.py
def setup_agents(self):
    # Register existing agents
    snowflake_agent = SnowflakeDataAgent()
    agent_registry.register_agent(snowflake_agent)

    # Register your new agent
    my_agent = MyNewAgent()
    agent_registry.register_agent(my_agent)
```

## 📈 Advanced Usage

### Custom Task Workflows

```python
from agent_orchestrator import AgentOrchestrator

orchestrator = AgentOrchestrator()

# Define complex multi-step workflow
def custom_analysis_workflow(params):
    results = {}

    # Step 1: Data extraction
    data_task = AgentTask(
        action="extract_custom_data",
        agent_type="snowflake_agent",
        parameters=params
    )
    results['data'] = orchestrator.execute_task("snowflake_agent", data_task)

    # Step 2: Analysis (future agent)
    analysis_task = AgentTask(
        action="perform_statistical_analysis",
        agent_type="analysis_agent",
        parameters={"data": results['data']}
    )
    results['analysis'] = orchestrator.execute_task("analysis_agent", analysis_task)

    return results
```

### Inter-Agent Communication

```python
# Agents can communicate with each other
class AdvancedAgent(BaseAgent):
    def execute_task(self, task: AgentTask) -> AgentResult:
        # Get data from Snowflake agent
        snowflake_agent = agent_registry.get_agent("snowflake_agent")
        data_task = AgentTask(...)
        data_result = self.communicate_with_agent(snowflake_agent, data_task)

        # Process the data
        processed_result = self.process_data(data_result.data)
        return AgentResult(success=True, data=processed_result)
```

## 📚 Documentation

### For Snowflake Agent
- **[Snowflake Schema](SNOWFLAKE_SCHEMA.md)**: Comprehensive database structure
- **[Reference Queries](reference_queries.sql)**: Validated SQL patterns from data team
- **[MCP Setup](SNOWFLAKE_MCP_TROUBLESHOOTING.md)**: Snowflake connection troubleshooting

### System Documentation
- **[Base Agent Class](shared/utils/base_agent.py)**: Agent development framework
- **[Agent Registry](shared/utils/base_agent.py)**: Multi-agent coordination system

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Agent not found | Check agent registration in orchestrator |
| Task execution fails | Verify agent capabilities and task parameters |
| Import errors | Ensure Python path includes project root |
| Snowflake connection | See MCP troubleshooting guide |

### Debug Mode

```bash
# Run with verbose logging
python agent_orchestrator.py --task customer-analysis --debug

# Check individual agent status
python agent_orchestrator.py --list-agents --verbose
```

## 🛣️ Roadmap

### Phase 2: Advanced Analytics Agents
- **Analysis Agent**: Statistical analysis, regression, forecasting
- **Visualization Agent**: Automated chart generation, dashboard creation
- **Reporting Agent**: PDF reports, email automation

### Phase 3: Intelligence Agents
- **Research Agent**: Web scraping, competitive analysis
- **Recommendation Agent**: ML-powered insights and recommendations
- **Monitoring Agent**: Automated alerting and anomaly detection

### Phase 4: Integration & Deployment
- **API Gateway**: RESTful API for agent access
- **Scheduling System**: Cron-like job scheduling for agents
- **Web Interface**: GUI for agent management and task execution

## 🤝 Contributing

### Adding New Agents
1. Follow the agent template structure
2. Inherit from `BaseAgent` class
3. Implement required methods (`get_capabilities`, `execute_task`)
4. Add comprehensive tests
5. Update documentation

### Best Practices
- Use type hints and docstrings
- Follow the existing logging patterns
- Implement proper error handling
- Add configuration through YAML files
- Include usage examples

## 📝 License

This project is internal to Brex and follows company data governance policies.

---

**🚀 Ready to build intelligent automation? Start by exploring the Snowflake agent and then add your own specialized agents to the system!**