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

## Skills System Architecture

### Core Skills Directory: `skills/`

The skills system provides modular, reusable capabilities for document processing, data analysis, and business intelligence workflows. Each skill is self-contained with standardized interfaces and integration patterns.

#### 1. Document Processing Skills (`skills/document-processing/`)
- **Purpose**: Comprehensive business document format processing and analysis
- **Capabilities**: PDF, Excel, PowerPoint, Word, and universal document processing
- **Key Features**:
  - Multi-format automatic detection and processing
  - Business document intelligence (DACI, financial, contracts)
  - Batch processing and cross-format analysis
  - Integration with data analysis workflows
  - Python and Node.js hybrid processing methods

**Available Skills**:
- `PDFExtractionSkill`: DACI templates, structured analysis, table extraction
- `ExcelProcessingSkill`: Multi-sheet workbooks, financial analysis, CSV processing
- `PowerPointExtractionSkill`: Slide analysis, presentation intelligence
- `WordProcessingSkill`: Document structure, contract analysis, metadata extraction
- `UniversalDocumentSkill`: Auto-detection, batch processing, business intelligence

#### 2. Data Sources Skills (`skills/data-sources/`)
- **Purpose**: Brex Data Team validated Snowflake analysis with reference patterns
- **Capabilities**: Template-based queries, business rules, data validation
- **Key Features**:
  - Validated SQL patterns from Brex Data Team
  - Business rules extraction and application
  - Multiple output formats with metadata tracking
  - Integration with MCP Snowflake servers

**Available Skills**:
- `SnowflakeRetrievalSkill`: Customer analysis, cross-sell/upsell, SC commission analysis
- `PythonDataRetrievalSkill`: Bridge to existing Python data agents

#### 3. Core Framework (`skills/core/`)
- **BaseSkill**: Abstract base class with lifecycle management
- **SkillRegistry**: Automatic skill discovery and health monitoring
- **Integration Patterns**: Standardized error handling and output formatting

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

### Skills System Commands
```bash
# SKILLS MANAGEMENT - Document processing and data analysis skills
cd skills/

# Skill discovery and health monitoring
npm run list-skills                         # List all available skills by category
npm run health-check                        # Check health status of all skills

# Testing framework
npm test                                     # Run skill integration tests
npm run test-bridge                         # Test Python-Node.js bridge functionality
npm run test-workflow                       # Test multi-skill workflow orchestration

# Document processing examples
node -e "
const { UniversalDocumentSkill } = require('./document-processing/universal_document_skill');
const processor = new UniversalDocumentSkill();

// Process any document format
processor.execute({
    filePath: '/path/to/document.pdf',
    includeAnalysis: true,
    outputFormat: 'json'
}).then(console.log);
"

# Excel financial analysis
node -e "
const { ExcelProcessingSkill } = require('./document-processing/excel_processing_skill');
const skill = new ExcelProcessingSkill();

skill.analyzeFinancialData('/path/to/budget.xlsx')
    .then(result => console.log(JSON.stringify(result, null, 2)));
"

# Batch document processing
node -e "
const { UniversalDocumentSkill } = require('./document-processing/universal_document_skill');
const processor = new UniversalDocumentSkill();

processor.execute({
    fileList: ['/path/to/doc1.pdf', '/path/to/doc2.xlsx', '/path/to/doc3.pptx'],
    aggregateResults: true,
    includeAnalysis: true
}).then(console.log);
"

# Snowflake data analysis with validated patterns
node -e "
const { SnowflakeRetrievalSkill } = require('./data-sources/snowflake_retrieval');
const skill = new SnowflakeRetrievalSkill();

skill.getCustomerEditionAnalysis({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    outputFormat: 'json'
}).then(console.log);
"
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
- **Node.js**: Skills system and document processing (14.0+ required)
- **Global Dependencies**: Shared libraries installed once for all agents
- **MCP Integration**: Claude Code MCP servers (Snowflake, Hex, GitHub)
- **OAuth 2.0**: Standard authentication pattern
- **YAML Configuration**: Standardized config format across agents and skills
- **Integration tests**: Validate end-to-end functionality

### Skills System Technologies
- **Document Processing**: PyPDF2, pdfplumber, python-docx, python-pptx, pandas
- **Multi-Format Support**: PDF, Excel (XLSX/XLS/CSV), PowerPoint (PPTX/PPT), Word (DOCX/DOC)
- **Business Intelligence**: Automatic document classification, cross-format analysis
- **Python-Node.js Bridge**: Subprocess management with error handling and cleanup
- **Unified Interfaces**: Consistent APIs across all document processors

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

### Adding New Skills
1. Extend from `BaseSkill` class in `skills/core/base_skill.js`
2. Choose appropriate category: `document-processing`, `data-sources`, `analysis`, `workflows`
3. Follow naming convention: `*_skill.js`
4. Implement required methods: `execute()`, `performSkill()`, `validateParams()`
5. Support multiple output formats: JSON, text, markdown
6. Include business intelligence and error handling patterns
7. Add comprehensive documentation and usage examples
8. Test with `npm run health-check` and `npm run list-skills`

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

### Skills Integration Categories
- **Document Intelligence**: Multi-format processing, business document analysis
- **Data Analysis**: Snowflake integration, validated query patterns, financial analysis
- **Business Intelligence**: Cross-format correlation, automated insights generation
- **Workflow Orchestration**: Multi-skill coordination, batch processing pipelines

### Shared Infrastructure Opportunities
- Common authentication utilities
- Shared configuration patterns
- Cross-agent data exchange formats
- Unified logging and error handling
- Shared testing frameworks

### Agent-Skills Integration Patterns
- **Document Processing → Data Analysis**: Extract data from documents, validate with Snowflake
- **DACI Analysis → Business Intelligence**: Decision documents feed strategic analysis
- **Financial Documents → Revenue Analysis**: Excel/PDF financial data validates business metrics
- **Multi-Format Workflows**: Agents orchestrate skills across document types
- **Business Intelligence Pipelines**: Skills feed processed data to agent analysis workflows

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