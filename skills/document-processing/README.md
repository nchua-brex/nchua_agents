# Document Processing Skills

This section contains skills for processing various business document formats including PDFs, PowerPoint presentations, Excel spreadsheets, Word documents, and other file types commonly used in business workflows.

## Current Skills

### PDFExtractionSkill (`pdf_extraction_skill.js`)
**Purpose**: Extract text, metadata, and structured data from PDF documents

**Capabilities**:
- Multi-method PDF processing (PyPDF2, pdfplumber)
- DACI template recognition and structured analysis
- Table extraction and document classification
- Multiple output formats (JSON, text, markdown)
- Business document intelligence

**Usage**:
```javascript
const { PDFExtractionSkill } = require('./pdf_extraction_skill');
const skill = new PDFExtractionSkill();

const result = await skill.execute({
    filePath: '/path/to/document.pdf',
    method: 'python',
    structuredExtraction: true,
    outputFormat: 'json'
});
```

**DACI-Specific Analysis**:
```javascript
const daciResult = await skill.extractDACIStructure('/path/to/daci.pdf');
```

### ExcelProcessingSkill (`excel_processing_skill.js`)
**Purpose**: Process Excel workbooks and CSV files for business data analysis

**Capabilities**:
- Multi-sheet Excel workbook processing
- CSV/TSV file analysis with delimiter detection
- Financial data extraction and validation
- Formula evaluation and data type detection
- Integration-ready for Snowflake workflows

**Usage**:
```javascript
const { ExcelProcessingSkill } = require('./excel_processing_skill');
const skill = new ExcelProcessingSkill();

const result = await skill.execute({
    filePath: '/path/to/workbook.xlsx',
    method: 'python',
    analyzeFormulas: true,
    outputFormat: 'json'
});

// Financial analysis
const financialAnalysis = await skill.analyzeFinancialData('/path/to/budget.xlsx');
```

### PowerPointExtractionSkill (`powerpoint_extraction_skill.js`)
**Purpose**: Extract and analyze content from PowerPoint presentations

**Capabilities**:
- Slide-by-slide content extraction
- Presentation structure and flow analysis
- Speaker notes and image detection
- Business presentation intelligence
- Template and format recognition

**Usage**:
```javascript
const { PowerPointExtractionSkill } = require('./powerpoint_extraction_skill');
const skill = new PowerPointExtractionSkill();

const result = await skill.execute({
    filePath: '/path/to/presentation.pptx',
    extractNotes: true,
    analyzeStructure: true,
    outputFormat: 'markdown'
});
```

### WordProcessingSkill (`word_processing_skill.js`)
**Purpose**: Process Microsoft Word documents for business analysis

**Capabilities**:
- Document structure analysis (headings, lists, tables)
- Comment and revision tracking extraction
- Style and formatting analysis
- Business document intelligence (contracts, policies)
- Metadata and properties extraction

**Usage**:
```javascript
const { WordProcessingSkill } = require('./word_processing_skill');
const skill = new WordProcessingSkill();

const result = await skill.execute({
    filePath: '/path/to/document.docx',
    extractComments: true,
    analyzeStructure: true,
    outputFormat: 'json'
});
```

### UniversalDocumentSkill (`universal_document_skill.js`)
**Purpose**: Process any business document format with automatic detection and routing

**Capabilities**:
- Automatic format detection and processor selection
- Unified interface for all document types
- Batch processing capabilities
- Cross-format analysis and business intelligence
- Document comparison and aggregation

**Usage**:
```javascript
const { UniversalDocumentSkill } = require('./universal_document_skill');
const skill = new UniversalDocumentSkill();

// Single document processing
const result = await skill.execute({
    filePath: '/path/to/any-document.pdf',
    includeAnalysis: true,
    outputFormat: 'json'
});

// Batch processing
const batchResult = await skill.execute({
    fileList: ['/path/to/doc1.pdf', '/path/to/doc2.xlsx', '/path/to/doc3.pptx'],
    aggregateResults: true,
    includeAnalysis: true
});
```

## Architecture Patterns

### Base Integration
All document processing skills inherit from the `BaseSkill` class and follow these patterns:

- **File Validation**: Size limits, format verification, accessibility checks
- **Multi-Method Processing**: Primary and fallback extraction methods
- **Structured Output**: Consistent metadata and content structure
- **Error Handling**: Comprehensive error messages with actionable suggestions
- **Business Context**: Domain-specific analysis for business documents

### Output Standardization
All skills support consistent output formats:
- `json`: Full structured data with metadata
- `text`: Plain text extraction
- `markdown`: Formatted content with proper structure

### Integration Points
- **MCP Compatibility**: Ready for integration with Claude Code MCP servers
- **Data Pipeline Integration**: Compatible with existing data analysis workflows
- **Multi-Agent Coordination**: Designed for use in multi-agent business workflows

## Usage in Multi-Agent Workflows

Document processing skills are designed to work seamlessly with:

1. **Data Analysis Agents**: Process documents → extract data → feed to Snowflake analysis
2. **Business Intelligence Workflows**: Document ingestion → structured analysis → reporting
3. **Automation Pipelines**: Batch document processing → data extraction → downstream systems

## Development Guidelines

When adding new document processing skills:

1. **Follow Base Architecture**: Inherit from `BaseSkill` and implement required methods
2. **Support Multiple Formats**: Provide JSON, text, and markdown output options
3. **Include Business Logic**: Add domain-specific analysis for business document types
4. **Comprehensive Testing**: Test with real business documents and edge cases
5. **Error Resilience**: Handle malformed documents, large files, and missing dependencies

## File Organization

```
document-processing/
├── README.md                    # This documentation
├── pdf_extraction_skill.js      # PDF processing skill
├── powerpoint_skill.js          # Future: PPT/PPTX processing
├── excel_skill.js               # Future: Excel/CSV processing
├── word_skill.js                # Future: Word document processing
├── universal_document_skill.js  # Future: Multi-format processor
└── tests/                       # Test files and validation scripts
    ├── test_pdf_extraction.js
    └── sample_documents/        # Test documents for validation
```

This organization supports the evolution from individual document processors to a unified document intelligence platform for business workflows.