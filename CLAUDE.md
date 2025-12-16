# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **multi-agent repository** designed to house various specialized agents and subagents. The repository is organized to support multiple independent projects that can share common patterns, utilities, and development practices.

## Current Agents

### 1. Granola Meeting Notes Agent (Root Directory)
- **Language**: Python
- **Purpose**: Extracts `#next_steps` from meeting notes and syncs to Google Docs
- **Key Files**: `agent.py`, `parser.py`, `google_docs_client.py`, `setup.py`

### 2. Solution Consultants Data Analysis Agent
- **Location**: `Solution Consultants Attainment/`
- **Purpose**: Snowflake data analysis and business intelligence
- **Technologies**: Python, Snowflake SQL, data visualization
- **Key Tables**: `coredata.customer.customers_monthly__net_revenue`, `coredata.salesforce.*`

## Multi-Agent System (New Architecture)

### Core Agents Directory: `agents/`

#### 1. Data Retrieval Agent (`agents/data_retrieval/`)
- **Purpose**: Specialized Snowflake MCP integration for business data queries
- **Capabilities**: SQL query execution, templated queries, business analytics
- **Key Features**:
  - MCP-based Snowflake connectivity
  - Pre-built query templates for common business scenarios
  - Multiple output formats (CSV, JSON, DataFrame)
  - Built-in business rules and filtering
- **Usage**: `python agents/data_retrieval/main.py test`

#### 2. Shared Utilities (`agents/shared/`)
- **MCP Client Manager**: Centralized MCP connection handling
- **Configuration Manager**: Shared config patterns across agents
- **Testing Framework**: Standardized testing utilities for all agents

## Development Commands

### Granola Agent (Root Directory)
```bash
# Setup and installation
make setup              # Interactive setup wizard
make install           # Install dependencies
make test              # Run integration tests
make run               # Test with example note
make clean             # Clean generated files

# Usage
python agent.py --notes-dir ~/Documents/Granola/
python agent.py --note-file meeting.md
python parser.py example_note.md
```

### Solution Consultants Agent
```bash
# Navigate to agent directory
cd "Solution Consultants Attainment/"

# Snowflake operations (requires snow CLI)
snow sql -q "SELECT * FROM coredata.customer.customers_monthly__net_revenue LIMIT 10"

# Analysis scripts
python run_segment_analysis.py
python create_segment_mapping.py
```

### Multi-Agent System Commands
```bash
# INITIAL SETUP - Run once to install all dependencies globally
python setup_agents.py                      # Install all global dependencies and validate setup

# Agent Orchestrator - Central coordination
python agents_orchestrator.py list          # List all registered agents
python agents_orchestrator.py health        # Check agent health status
python agents_orchestrator.py test          # Run basic orchestrator test

# Data Retrieval Agent - Direct usage
cd agents/data_retrieval/
python main.py test                          # Test agent functionality
python main.py territory                    # Test territory analysis
python -m pytest tests/                     # Run agent tests

# Validation and diagnostics
python validate_agents.py                   # Validate multi-agent structure
python -c "import pandas, yaml, snowflake.connector; print('✅ Dependencies OK')"

# Global dependency management
pip install -r requirements.txt             # Install/update global dependencies
```

## Repository Architecture Patterns

### Agent Structure Template
Each agent should follow this recommended structure:
```
agent_name/
├── README.md              # Agent-specific documentation
├── CLAUDE.md             # Claude-specific guidance (if complex)
├── requirements.txt      # Dependencies
├── setup.py or Makefile  # Setup automation
├── main_script.py        # Primary entry point
├── config/               # Configuration files
├── tests/                # Test suite
└── utils/                # Shared utilities
```

### Common Technologies
- **Python**: Primary language for most agents (3.8+ required)
- **Global Dependencies**: Shared libraries installed once for all agents
- **MCP Integration**: Claude Code MCP servers (Snowflake, Hex, GitHub)
- **OAuth 2.0**: Standard authentication pattern
- **YAML Configuration**: Standardized config format across agents
- **Integration tests**: Validate end-to-end functionality

### Shared Patterns
- Interactive setup wizards for first-time configuration
- Command-line interfaces with consistent argument patterns
- Error handling for API integrations and authentication
- File tracking to prevent duplicate processing
- Modular architecture for easy extension

## Development Guidelines

### Adding New Agents
1. Create dedicated directory or use root for simple agents
2. Include comprehensive README.md with usage examples
3. Implement setup automation (setup.py or Makefile)
4. Follow authentication patterns (OAuth, API keys, etc.)
5. Add integration tests
6. Update this CLAUDE.md with new agent information

### Configuration Management
- Use `.env` files for environment-specific settings
- Provide `.env.example` templates
- Store sensitive credentials locally (never commit)
- Support command-line overrides for flexibility

### Testing Strategy
- Integration tests that validate real API interactions
- Example data/files for testing parsing logic
- Make targets for easy test execution
- Error condition testing (missing credentials, network issues)

## Multi-Agent Coordination

### Potential Agent Categories
- **Data Processing**: Granola notes, Snowflake analysis, document parsing
- **API Integration**: Google services, Salesforce, external APIs
- **Automation**: Workflow orchestration, scheduled tasks, monitoring
- **Analysis**: Business intelligence, reporting, data visualization

### Shared Infrastructure Opportunities
- Common authentication utilities
- Shared configuration patterns
- Cross-agent data exchange formats
- Unified logging and error handling
- Shared testing frameworks

## Future Expansion Plans

This repository is designed to scale with additional agents and subagents. Consider these organizational principles:

- **Modularity**: Each agent should be independently deployable
- **Consistency**: Maintain common patterns across agents
- **Documentation**: Each agent needs clear setup and usage docs
- **Integration**: Agents should be able to work together when beneficial
- **Automation**: Standardize setup, testing, and deployment processes

When adding new agents, update this CLAUDE.md to include:
- Agent purpose and key technologies
- Development commands and usage patterns
- Configuration requirements
- Integration points with existing agents