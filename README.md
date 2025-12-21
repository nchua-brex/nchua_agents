# nchua_agents 🤖

A hybrid multi-agent system combining Python agents with a modern Node.js skill-based architecture for intelligent business data analysis and automation.

## 🎯 Overview

The `nchua_agents` system provides two complementary approaches for business intelligence automation:

### 🐍 **Python Agents** (Legacy/Specialized)
- **Granola Meeting Notes Agent**: Extracts action items and syncs to Google Docs
- **Snowflake Data Retrieval Agent**: Direct Snowflake data analysis with MCP integration
- **Solution Consultants Analysis**: Business intelligence for sales performance

### 🚀 **Node.js Skills Architecture** (Modern/Unified)
- **Unified Interface**: All business operations through standardized skill API
- **Workflow Orchestration**: Chain multiple skills for complex business processes
- **Python Integration**: Bridge existing Python agents into Node.js workflows
- **Extensible Framework**: Easy to add new skills following established patterns

### Current Skills & Agents

| Component | Type | Purpose | Capabilities |
|-----------|------|---------|--------------|
| 🗄️ **SnowflakeRetrievalSkill** | Node.js Skill | Business data queries | Customer revenue, territory performance, templated queries |
| 🔗 **PythonDataRetrievalSkill** | Bridge Skill | Python agent wrapper | Existing Snowflake agent integration |
| 📊 **HexDashboardAnalysisSkill** | Node.js Skill | Dashboard analysis | Pattern extraction, KPI analysis, SQL optimization |
| 📋 **GoogleDriveSpreadsheetSkill** | Node.js Skill | Spreadsheet intelligence | Business knowledge extraction, calculation patterns |
| 🤖 **Granola Meeting Agent** | Python Agent | Meeting notes processing | Action item extraction, Google Docs sync |

### Architecture Components
- 🎯 **SkillRegistry**: Central skill discovery and management
- 🔄 **OrchestrationEngine**: Multi-skill workflow coordination
- 🌉 **PythonAgentBridge**: Seamless Python-to-Node.js integration
- ⚙️ **BaseSkill**: Standardized skill foundation class

## 🏗️ System Architecture

### Node.js Skills Architecture (Primary)
```
skills/                              # Modern skill-based system
├── 🎯 core/                        # Core framework
│   ├── base_skill.js               # Foundation class for all skills
│   ├── skill_registry.js           # Central skill management
│   └── orchestration_engine.js     # Workflow coordination
├── 🌉 bridges/                     # Integration layer
│   └── python_bridge.js            # Python agent integration
├── 📊 data-sources/                # Data access skills
│   ├── snowflake_retrieval.js      # Native Snowflake operations
│   ├── google_drive_spreadsheet.js # Spreadsheet analysis
│   └── python_data_retrieval_skill.js # Python agent wrapper
├── 🔍 analysis/                    # Analysis skills
│   └── hex_dashboard_analysis.js   # Dashboard pattern analysis
├── 📋 workflows/                   # Business workflow definitions
├── 🧪 test_python_bridge.js       # Integration testing
└── 📦 package.json                # Node.js dependencies
```

### Python Agents (Legacy/Specialized)
```
nchua_agents/
├── 🤖 agent.py                    # Granola meeting notes agent
├── 🏢 agents/                     # Python agents
│   └── data_retrieval/            # Snowflake MCP agent
│       ├── main.py                # Data retrieval agent
│       └── brex_reference_patterns.sql
├── 📊 Solution Consultants Attainment/ # Business analysis agent
├── 📚 Documentation & Reference
│   ├── SNOWFLAKE_SCHEMA.md        # Database schema
│   └── SNOWFLAKE_MCP_TROUBLESHOOTING.md
└── 📋 Configuration
    ├── requirements.txt            # Python dependencies
    └── setup.py                   # Installation script
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/nchua-brex/nchua_agents.git
cd nchua_agents

# Install Python dependencies (for existing agents)
pip install -r requirements.txt

# Install Node.js dependencies (for skills system)
cd skills/
npm install
```

### 2. Skills System Usage (Recommended)

#### Basic Skills Testing
```bash
# Test the skill system integration
cd skills/
node test_python_bridge.js

# Test Python agent bridge specifically
node test_python_bridge.js bridge

# Test workflow orchestration
node test_python_bridge.js workflow
```

#### Using Skills Programmatically
```javascript
// Load and use skills
const { SkillRegistry } = require('./core/skill_registry');
const { SnowflakeRetrievalSkill } = require('./data-sources/snowflake_retrieval');

const registry = new SkillRegistry();
const snowflakeSkill = new SnowflakeRetrievalSkill();
registry.register(snowflakeSkill, 'data-sources');

// Execute business analysis
const result = await snowflakeSkill.getCustomerRevenue({
    territory: 'West Coast',
    dateRange: '2024-Q4',
    outputFormat: 'json'
});
```

#### Workflow Orchestration
```javascript
// Chain multiple skills together
const { SkillOrchestrationEngine } = require('./core/orchestration_engine');

const orchestrator = new SkillOrchestrationEngine();
orchestrator.registerWorkflow('quarterly_review', {
    description: 'Comprehensive quarterly business analysis',
    steps: [
        { name: 'fetch_data', skill: 'SnowflakeRetrievalSkill', method: 'getCustomerRevenue' },
        { name: 'analyze_hex', skill: 'HexDashboardAnalysisSkill', method: 'analyzeDashboard' }
    ]
});

await orchestrator.executeWorkflow('quarterly_review', { quarter: '2024-Q4' });
```

### 3. Python Agents Usage (Legacy)

#### Individual Python Agents
```bash
# Granola Meeting Notes Agent
python agent.py --notes-dir ~/Documents/Granola/

# Data Retrieval Agent
python agents/data_retrieval/main.py test
python agents/data_retrieval/main.py territory

# Solution Consultants Analysis
cd "Solution Consultants Attainment/"
python run_segment_analysis.py
```

## 🤖 Skills System Features

### Skill-Based Architecture

The modern Node.js system provides unified business intelligence through skills:

```javascript
// Example: Quarterly Business Review workflow
1. Extract customer revenue data (SnowflakeRetrievalSkill)
2. Analyze Hex dashboard patterns (HexDashboardAnalysisSkill)
3. Extract spreadsheet business knowledge (GoogleDriveSpreadsheetSkill)
4. Generate comprehensive insights (Future: AnalysisSkill)
5. Create automated reports (Future: ReportingSkill)
```

### Unified Skill Interface

All skills follow the same standardized interface:

```javascript
// Every skill inherits from BaseSkill
class MyBusinessSkill extends BaseSkill {
    constructor() {
        super('MyBusinessSkill', {
            description: 'Custom business analysis',
            capabilities: ['analysis', 'reporting'],
            inputFormats: ['json'],
            outputFormats: ['json', 'csv']
        });
    }

    async execute(inputs) {
        // Standardized skill execution
        return { success: true, data: results };
    }
}
```

### Python Agent Integration

Seamlessly integrate existing Python agents:

```javascript
// Bridge Python agents into Node.js workflows
const pythonSkill = new PythonDataRetrievalSkill();
const result = await pythonSkill.analyzeTerritory({
    territory: 'West Coast',
    metrics: ['revenue', 'customer_count']
});
```

### Business Workflow Orchestration

Chain multiple skills for complex business processes:

```javascript
// Register a comprehensive business workflow
orchestrator.registerWorkflow('customer_analysis_pipeline', {
    description: 'Complete customer analysis with insights',
    steps: [
        {
            name: 'fetch_customer_data',
            skill: 'SnowflakeRetrievalSkill',
            method: 'getCustomerRevenue'
        },
        {
            name: 'analyze_spreadsheet_patterns',
            skill: 'GoogleDriveSpreadsheetSkill',
            method: 'analyzeSpreadsheet'
        },
        {
            name: 'extract_hex_insights',
            skill: 'HexDashboardAnalysisSkill',
            method: 'analyzeDashboard'
        }
    ]
});

// Execute the complete workflow
const insights = await orchestrator.executeWorkflow('customer_analysis_pipeline', {
    territory: 'Enterprise',
    quarter: '2024-Q4'
});
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

## 🔄 Adding New Skills

### 1. Create Skill Structure

```bash
# Create new skill file
touch skills/data-sources/my_new_skill.js

# Or create new category
mkdir skills/my-category/
touch skills/my-category/my_skill.js
```

### 2. Implement Skill Class

```javascript
// skills/data-sources/my_new_skill.js
const { BaseSkill } = require('../core/base_skill');

class MyNewSkill extends BaseSkill {
    constructor() {
        super('MyNewSkill', {
            description: 'Custom business intelligence skill',
            capabilities: ['data_analysis', 'reporting'],
            inputFormats: ['json'],
            outputFormats: ['json', 'csv'],
            requiresAuth: true
        });
    }

    async execute(inputs = {}) {
        // Implement business logic
        return {
            success: true,
            data: processedResults,
            metadata: {
                executedAt: new Date(),
                inputs: inputs
            }
        };
    }

    async customMethod(inputs = {}) {
        // Add custom business methods
        return await this.execute(inputs);
    }
}

module.exports = { MyNewSkill };
```

### 3. Register and Test Skill

```javascript
// Register skill with registry
const { SkillRegistry } = require('./core/skill_registry');
const { MyNewSkill } = require('./data-sources/my_new_skill');

const registry = new SkillRegistry();
const mySkill = new MyNewSkill();
registry.register(mySkill, 'data-sources');

// Test the skill
const result = await mySkill.execute({ param1: 'value1' });
console.log(result);
```

### 4. Add to Workflows

```javascript
// Include in business workflows
orchestrator.registerWorkflow('my_business_process', {
    description: 'Custom business process using new skill',
    steps: [
        {
            name: 'execute_custom_logic',
            skill: 'MyNewSkill',
            method: 'customMethod',
            inputs: { source: 'workflow_data' }
        }
    ]
});
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

### Phase 2: Advanced Business Skills
- **DACITemplateSkill**: Automated DACI document generation and analysis
- **CompetitiveAnalysisSkill**: Market research and competitive intelligence
- **FinancialReportingSkill**: Automated financial analysis and reporting
- **SalesPerformanceSkill**: Advanced sales analytics and forecasting

### Phase 3: Intelligence & Automation
- **MLInsightsSkill**: Machine learning-powered business insights
- **PredictiveAnalysisSkill**: Forecasting and trend analysis
- **AlertingSkill**: Automated monitoring and notification system
- **ComplianceSkill**: Automated compliance checking and reporting

### Phase 4: Integration & Deployment
- **Web API Gateway**: RESTful API for skill system access
- **Workflow Scheduler**: Cron-like scheduling for business workflows
- **Dashboard Interface**: Web UI for skill management and execution
- **Enterprise Integration**: SSO, audit logs, and enterprise features

## 🤝 Contributing

### Adding New Skills (Recommended)
1. Follow the skill template structure (`skills/data-sources/` or similar)
2. Inherit from `BaseSkill` class
3. Implement required methods (`execute` and custom business methods)
4. Add comprehensive testing in test files
5. Register with SkillRegistry and update documentation

### Adding Python Agents (Legacy)
1. Follow existing Python agent patterns
2. Use MCP integration where applicable
3. Add bridge wrapper in `skills/bridges/` for Node.js integration
4. Include setup automation (setup.py or Makefile)

### Best Practices
- **Skills**: Use JavaScript/Node.js for new business intelligence capabilities
- **Python**: Keep existing agents for specialized/legacy functionality
- **Integration**: Bridge Python agents through the Node.js skill system
- **Testing**: Include both unit tests and integration tests
- **Documentation**: Update README and include usage examples

## 📝 License

This project is internal to Brex and follows company data governance policies.

---

**🚀 Ready to build intelligent business automation? Start with the Node.js skills system for unified workflows, or extend existing Python agents for specialized functionality!**