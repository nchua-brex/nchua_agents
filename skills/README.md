# Multi-Agent Skills Architecture

A comprehensive skill-based architecture for multi-agent business workflows, supporting data analysis, document processing, and business intelligence operations.

## Architecture Overview

This skills framework provides modular, reusable capabilities that can be orchestrated across different agents and workflows. Each skill is self-contained with standardized interfaces, error handling, and integration patterns.

## Skill Categories

### 📊 Data Sources (`data-sources/`)
Skills for retrieving and analyzing business data from various sources.

**SnowflakeRetrievalSkill** - Brex Data Team validated Snowflake analysis
- Template-based query system using validated SQL patterns
- Business rules extraction and validation
- Multiple analysis types: customer edition, cross-sell/upsell, SC commission analysis
- Data quality validation and scoring

### 📄 Document Processing (`document-processing/`)
Skills for processing various business document formats.

**PDFExtractionSkill** - Extract and analyze PDF documents
- Multi-method PDF processing (PyPDF2, pdfplumber)
- DACI template recognition and structured analysis
- Table extraction and document classification
- Multiple output formats (JSON, text, markdown)

**Planned**: PowerPoint, Excel, Word document processing skills

### 🔗 Bridges (`bridges/`)
Integration layers for connecting Node.js skills with Python agents and external systems.

**PythonBridge** - Execute Python agents from Node.js skills
- Subprocess management and communication
- Error handling and output parsing
- Cross-language workflow orchestration

### 🎨 Content (`branding/`)
Skills for generating and validating brand-compliant content.

**BrandingSkill** - Generate content that adheres to Brex brand voice and style guidelines
- Applies Brex brand voice principles (Real, Gritty, Relentless, Ambitious, Direct)
- Enforces Metal Design System content guidelines
- Validates character limits and accessibility requirements
- Supports multiple content types (button, form, data_display, feedback)
- Provides brand compliance analysis and scoring

### 🔧 Core (`core/`)
Foundational classes and utilities for skill development.

**BaseSkill** - Abstract base class for all skills
- Standardized lifecycle methods
- Configuration management
- Error handling patterns

**SkillRegistry** - Skill discovery and management
- Dynamic skill loading
- Health checking
- Capability discovery

### 📈 Analysis (`analysis/`)
Advanced analysis and reporting capabilities.

### 🔄 Workflows (`workflows/`)
Pre-built workflow orchestrations combining multiple skills.

## Usage Patterns

### Individual Skill Usage
```javascript
const { SnowflakeRetrievalSkill } = require('./data-sources/snowflake_retrieval');
const skill = new SnowflakeRetrievalSkill();

const result = await skill.getCustomerEditionAnalysis({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    outputFormat: 'json'
});
```

#### Brand-Compliant Content Generation
```javascript
const { BrandingSkill } = require('./branding/branding_skill');
const brandingSkill = new BrandingSkill();

const result = await brandingSkill.execute({
    content: 'Learn more about our product',
    contentType: 'button',
    context: 'marketing',
    audience: 'founders',
    tone: 'professional',
    outputFormat: 'json'
});

// Result includes:
// - Branded content with Brex voice applied
// - Brand compliance analysis and scoring
// - Design system validation
// - Character limit validation
```

### Multi-Skill Workflows
```javascript
const { PDFExtractionSkill } = require('./document-processing/pdf_extraction_skill');
const { SnowflakeRetrievalSkill } = require('./data-sources/snowflake_retrieval');

// Extract data from PDF
const pdfSkill = new PDFExtractionSkill();
const documentData = await pdfSkill.extractDACIStructure('/path/to/daci.pdf');

// Use extracted data to query Snowflake
const dataSkill = new SnowflakeRetrievalSkill();
const analysisResult = await dataSkill.getCrossSellUpsellAnalysis({
    segmentFilter: documentData.extracted_segment
});
```

### Skill Registry
```javascript
const { SkillRegistry } = require('./core/skill_registry');
const registry = new SkillRegistry();

await registry.loadSkillsFromDirectory('./');
const availableSkills = registry.getAvailableSkills();
const healthStatus = await registry.healthCheckAllSkills();
```

## Development Scripts

### Testing
```bash
npm test                    # Run all tests
npm run test-bridge        # Test Python bridge functionality  
npm run test-workflow      # Test workflow orchestration
```

### Skill Management
```bash
npm run list-skills        # List all available skills
npm run health-check       # Check health of all skills
```

## Integration with Multi-Agent Architecture

### MCP Server Integration
- Skills are designed to work with Claude Code MCP servers
- Snowflake MCP for data retrieval operations
- GitHub MCP for workflow coordination
- Hex MCP for advanced analytics

### Agent Communication
- Skills provide standardized interfaces for agent-to-agent communication
- Support for both synchronous and asynchronous operations
- Error propagation and handling across agent boundaries

### Business Context
- All skills are designed with Brex business context in mind
- Pre-configured with business rules and validation patterns
- Support for common business document types (DACI, financial reports, etc.)

## Architecture Principles

### Modularity
- Each skill is self-contained with minimal dependencies
- Clear separation of concerns between skill categories
- Plug-and-play architecture for easy extension

### Standardization
- Consistent interfaces across all skills
- Standardized error handling and logging
- Common configuration patterns

### Business Alignment
- Skills are designed around actual business workflows
- Integration with existing business tools and processes
- Support for common business document formats and data sources

### Scalability
- Skills can be deployed independently or as part of larger workflows
- Support for batch processing and concurrent operations
- Resource management and cleanup

## Future Roadmap

### Document Processing Expansion
- PowerPoint extraction and analysis
- Excel workbook processing with formula evaluation
- Word document analysis with revision tracking
- Universal document processor with auto-format detection

### Data Source Integration
- Salesforce data integration skills
- Google Workspace document processing
- External API integration patterns
- Real-time data stream processing

### Advanced Analytics
- Machine learning model integration
- Advanced business intelligence workflows
- Predictive analytics capabilities
- Custom reporting and visualization

### Workflow Orchestration
- Visual workflow designer
- Conditional logic and branching
- Scheduled and triggered workflows
- Cross-agent coordination patterns

This architecture provides a solid foundation for building sophisticated multi-agent business intelligence and automation systems while maintaining flexibility for future expansion.