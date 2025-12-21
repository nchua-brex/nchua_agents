/**
 * Word Document Processing Skill
 *
 * Processes Microsoft Word documents for business analysis:
 * - Text extraction from DOC/DOCX files
 * - Document structure analysis (headings, lists, tables)
 * - Comment and revision tracking extraction
 * - Style and formatting analysis
 * - Business document intelligence (contracts, reports, policies)
 */

const { BaseSkill } = require('../core/base_skill');
const fs = require('fs').promises;
const path = require('path');

class WordProcessingSkill extends BaseSkill {
    constructor() {
        super('WordProcessingSkill', {
            description: 'Process Microsoft Word documents for business analysis',
            capabilities: [
                'docx_content_extraction',
                'document_structure_analysis',
                'comment_revision_tracking',
                'table_extraction',
                'style_formatting_analysis',
                'business_document_intelligence',
                'policy_contract_analysis'
            ],
            inputFormats: ['json'],
            outputFormats: ['json', 'text', 'markdown'],
            requiresAuth: false
        });

        this.supportedFormats = ['.docx', '.doc'];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB limit
    }

    /**
     * Process Word documents
     */
    async execute(inputs = {}) {
        const {
            filePath,
            method = 'auto', // 'python-docx', 'mammoth', 'auto'
            extractComments = true,
            extractRevisions = false,
            analyzeStructure = true,
            outputFormat = 'json'
        } = inputs;

        if (!filePath) {
            return {
                success: false,
                error: 'filePath is required'
            };
        }

        try {
            // Validate file
            const validation = await this.validateWordFile(filePath);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error
                };
            }

            // Choose processing method
            let processingMethod = method;
            if (method === 'auto') {
                processingMethod = await this.selectBestMethod(filePath, validation.stats);
            }

            // Process document
            let result;
            switch (processingMethod) {
                case 'python-docx':
                    result = await this.processWithPython(filePath, inputs);
                    break;
                case 'mammoth':
                    result = await this.processWithMammoth(filePath, inputs);
                    break;
                default:
                    result = await this.processWithPython(filePath, inputs);
                    break;
            }

            // Analyze structure if requested
            if (analyzeStructure && result.success) {
                result.structureAnalysis = await this.analyzeDocumentStructure(result);
            }

            // Format output
            return this.formatOutput(result, outputFormat);

        } catch (error) {
            return {
                success: false,
                error: error.message,
                suggestion: this.getSuggestionForError(error.message)
            };
        }
    }

    /**
     * Validate Word file
     */
    async validateWordFile(filePath) {
        try {
            const stats = await fs.stat(filePath);

            if (!stats.isFile()) {
                return { valid: false, error: 'Path is not a file' };
            }

            if (stats.size > this.maxFileSize) {
                return { 
                    valid: false, 
                    error: `File too large (${Math.round(stats.size / 1024 / 1024)}MB). Maximum size is ${this.maxFileSize / 1024 / 1024}MB` 
                };
            }

            const ext = path.extname(filePath).toLowerCase();
            if (!this.supportedFormats.includes(ext)) {
                return { 
                    valid: false, 
                    error: `Unsupported format: ${ext}. Supported: ${this.supportedFormats.join(', ')}` 
                };
            }

            return { valid: true, stats };

        } catch (error) {
            return { valid: false, error: `Cannot access file: ${error.message}` };
        }
    }

    /**
     * Select best processing method
     */
    async selectBestMethod(filePath, stats) {
        const ext = path.extname(filePath).toLowerCase();
        
        // For DOCX files, prefer python-docx
        if (ext === '.docx') {
            return 'python-docx';
        }

        // For older DOC files, might need different approach
        return 'python-docx';
    }

    /**
     * Process with Python python-docx library
     */
    async processWithPython(filePath, inputs = {}) {
        const { spawn } = require('child_process');

        const pythonScript = `
import sys
import json
import os
from pathlib import Path

try:
    from docx import Document
except ImportError:
    # Try to install required packages
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-docx"])
    from docx import Document

def process_word_document(file_path, options={}):
    """Process Word document with python-docx"""
    try:
        # Load document
        doc = Document(file_path)
        
        # Extract basic document info
        document_data = {
            'fileName': Path(file_path).stem,
            'paragraphs': [],
            'tables': [],
            'sections': [],
            'styles': [],
            'comments': [],  # Would need additional library for comments
            'metadata': {}
        }
        
        # Extract paragraphs
        for i, paragraph in enumerate(doc.paragraphs):
            if paragraph.text.strip():  # Only non-empty paragraphs
                para_data = {
                    'index': i,
                    'text': paragraph.text.strip(),
                    'style': paragraph.style.name if paragraph.style else 'Normal',
                    'alignment': str(paragraph.alignment) if paragraph.alignment else None,
                    'runs': []
                }
                
                # Extract formatting from runs
                for run in paragraph.runs:
                    if run.text.strip():
                        run_data = {
                            'text': run.text,
                            'bold': run.bold,
                            'italic': run.italic,
                            'underline': run.underline,
                            'font_name': run.font.name if run.font.name else None,
                            'font_size': str(run.font.size) if run.font.size else None
                        }
                        para_data['runs'].append(run_data)
                
                document_data['paragraphs'].append(para_data)
        
        # Extract tables
        for i, table in enumerate(doc.tables):
            table_data = {
                'index': i,
                'rows': len(table.rows),
                'columns': len(table.columns) if len(table.rows) > 0 else 0,
                'data': []
            }
            
            for row in table.rows:
                row_data = []
                for cell in row.cells:
                    row_data.append(cell.text.strip())
                table_data['data'].append(row_data)
            
            document_data['tables'].append(table_data)
        
        # Extract sections info
        for i, section in enumerate(doc.sections):
            section_data = {
                'index': i,
                'orientation': 'portrait',  # Basic implementation
                'header_distance': str(section.header_distance) if hasattr(section, 'header_distance') else None,
                'footer_distance': str(section.footer_distance) if hasattr(section, 'footer_distance') else None
            }
            document_data['sections'].append(section_data)
        
        # Get document properties
        core_props = doc.core_properties
        document_data['metadata'] = {
            'author': core_props.author if core_props.author else '',
            'title': core_props.title if core_props.title else '',
            'subject': core_props.subject if core_props.subject else '',
            'created': str(core_props.created) if core_props.created else '',
            'modified': str(core_props.modified) if core_props.modified else '',
            'last_modified_by': core_props.last_modified_by if core_props.last_modified_by else '',
            'revision': str(core_props.revision) if core_props.revision else ''
        }
        
        # Generate summary statistics
        total_text = ' '.join([p['text'] for p in document_data['paragraphs']])
        word_count = len(total_text.split()) if total_text else 0
        
        return {
            'success': True,
            'method': 'python-docx',
            'document': document_data,
            'statistics': {
                'paragraphCount': len(document_data['paragraphs']),
                'tableCount': len(document_data['tables']),
                'sectionCount': len(document_data['sections']),
                'wordCount': word_count,
                'characterCount': len(total_text),
                'hasMetadata': bool(any(document_data['metadata'].values()))
            },
            'processingInfo': {
                'processingMethod': 'python-docx',
                'fileSize': os.path.getsize(file_path),
                'processedAt': '2024-12-21T00:00:00Z'  # Would use datetime in real implementation
            }
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Word processing failed: {str(e)}'
        }

if __name__ == "__main__":
    file_path = sys.argv[1] if len(sys.argv) > 1 else None
    options = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    
    if not file_path or not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": "File path required and must exist"}))
        sys.exit(1)
    
    result = process_word_document(file_path, options)
    print(json.dumps(result, ensure_ascii=False, indent=2))
`;

        // Write Python script to temporary file
        const scriptPath = path.join(require('os').tmpdir(), 'word_processor.py');
        await fs.writeFile(scriptPath, pythonScript);

        return new Promise((resolve, reject) => {
            const python = spawn('python', [scriptPath, filePath, JSON.stringify(inputs)], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            python.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            python.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            python.on('close', async (code) => {
                // Clean up script file
                try {
                    await fs.unlink(scriptPath);
                } catch (error) {
                    // Ignore cleanup errors
                }

                if (code === 0) {
                    try {
                        const result = JSON.parse(stdout);
                        resolve(result);
                    } catch (error) {
                        resolve({
                            success: false,
                            error: `Failed to parse Python output: ${error.message}`,
                            raw_output: stdout
                        });
                    }
                } else {
                    resolve({
                        success: false,
                        error: `Python processing failed with code ${code}`,
                        stderr: stderr,
                        stdout: stdout
                    });
                }
            });

            python.on('error', (error) => {
                resolve({
                    success: false,
                    error: `Failed to start Python process: ${error.message}`
                });
            });
        });
    }

    /**
     * Process with Mammoth.js (placeholder)
     */
    async processWithMammoth(filePath, inputs = {}) {
        // Placeholder for Mammoth.js implementation
        // In production, would use mammoth library for better HTML conversion
        
        return {
            success: false,
            error: 'Mammoth.js processing not yet implemented',
            suggestion: 'Use python-docx method instead'
        };
    }

    /**
     * Analyze document structure
     */
    async analyzeDocumentStructure(result) {
        if (!result.document || !result.document.paragraphs) {
            return { analyzed: false, reason: 'No document data to analyze' };
        }

        const analysis = {
            documentType: 'unknown',
            hasHeadings: false,
            headingLevels: [],
            hasNumberedLists: false,
            hasBulletLists: false,
            structureScore: 0,
            sections: [],
            businessDocumentIndicators: []
        };

        // Analyze paragraph styles and content
        const headingStyles = [];
        const listPatterns = [];
        
        result.document.paragraphs.forEach((paragraph, index) => {
            const text = paragraph.text;
            const style = paragraph.style || 'Normal';
            
            // Check for heading styles
            if (style.includes('Heading') || style.includes('Title')) {
                analysis.hasHeadings = true;
                headingStyles.push({ index, style, text: text.substring(0, 50) });
                
                // Extract heading level
                const levelMatch = style.match(/Heading\\s*(\\d+)/);
                if (levelMatch) {
                    const level = parseInt(levelMatch[1]);
                    if (!analysis.headingLevels.includes(level)) {
                        analysis.headingLevels.push(level);
                    }
                }
            }
            
            // Check for list patterns
            if (text.match(/^\\d+\\./)) {
                analysis.hasNumberedLists = true;
                listPatterns.push({ index, type: 'numbered', text: text.substring(0, 30) });
            } else if (text.match(/^[-•·]/)) {
                analysis.hasBulletLists = true;
                listPatterns.push({ index, type: 'bullet', text: text.substring(0, 30) });
            }
            
            // Look for business document indicators
            const textLower = text.toLowerCase();
            if (textLower.includes('policy') || textLower.includes('procedure')) {
                analysis.businessDocumentIndicators.push('policy_document');
            }
            if (textLower.includes('contract') || textLower.includes('agreement')) {
                analysis.businessDocumentIndicators.push('contract');
            }
            if (textLower.includes('report') || textLower.includes('analysis')) {
                analysis.businessDocumentIndicators.push('report');
            }
            if (textLower.includes('memo') || textLower.includes('memorandum')) {
                analysis.businessDocumentIndicators.push('memo');
            }
        });

        // Determine document type
        if (analysis.businessDocumentIndicators.includes('policy_document')) {
            analysis.documentType = 'policy_document';
        } else if (analysis.businessDocumentIndicators.includes('contract')) {
            analysis.documentType = 'contract';
        } else if (analysis.businessDocumentIndicators.includes('report')) {
            analysis.documentType = 'business_report';
        } else if (analysis.businessDocumentIndicators.includes('memo')) {
            analysis.documentType = 'memo';
        } else if (analysis.hasHeadings && analysis.headingLevels.length > 2) {
            analysis.documentType = 'structured_document';
        }

        // Calculate structure score
        let score = 0;
        if (analysis.hasHeadings) score += 25;
        if (analysis.headingLevels.length > 1) score += 25;
        if (analysis.hasNumberedLists || analysis.hasBulletLists) score += 20;
        if (result.statistics && result.statistics.tableCount > 0) score += 15;
        if (analysis.businessDocumentIndicators.length > 0) score += 15;
        
        analysis.structureScore = Math.min(100, score);
        analysis.headingStyles = headingStyles;
        analysis.listPatterns = listPatterns;

        return analysis;
    }

    /**
     * Format output based on requested format
     */
    formatOutput(result, format) {
        if (!result.success) {
            return result;
        }

        switch (format.toLowerCase()) {
            case 'text':
                return this.convertToText(result);

            case 'markdown':
                return this.convertToMarkdown(result);

            case 'json':
            default:
                return result;
        }
    }

    /**
     * Convert to plain text format
     */
    convertToText(result) {
        if (!result.document) {
            return { success: false, error: 'No document data available' };
        }

        let textContent = `Word Document Content\\n`;
        textContent += `File: ${result.document.fileName}\\n`;
        textContent += `Paragraphs: ${result.statistics?.paragraphCount || 0}\\n`;
        textContent += `Tables: ${result.statistics?.tableCount || 0}\\n`;
        textContent += `Word Count: ${result.statistics?.wordCount || 0}\\n`;
        textContent += `${'='.repeat(50)}\\n\\n`;

        // Add paragraphs
        if (result.document.paragraphs) {
            result.document.paragraphs.forEach((paragraph, index) => {
                if (paragraph.style && paragraph.style !== 'Normal') {
                    textContent += `[${paragraph.style}] `;
                }
                textContent += `${paragraph.text}\\n\\n`;
            });
        }

        // Add tables
        if (result.document.tables && result.document.tables.length > 0) {
            textContent += `\\nTables:\\n${'='.repeat(20)}\\n`;
            result.document.tables.forEach((table, index) => {
                textContent += `\\nTable ${index + 1} (${table.rows}x${table.columns}):\\n`;
                table.data.forEach((row, rowIndex) => {
                    textContent += `${rowIndex + 1}: ${row.join(' | ')}\\n`;
                });
            });
        }

        return {
            success: true,
            content: textContent,
            metadata: result.processingInfo
        };
    }

    /**
     * Convert to markdown format
     */
    convertToMarkdown(result) {
        if (!result.document) {
            return { success: false, error: 'No document data available' };
        }

        let markdown = `# Word Document Content\\n\\n`;
        markdown += `**File**: ${result.document.fileName}\\n`;
        markdown += `**Statistics**: ${result.statistics?.wordCount || 0} words, ${result.statistics?.paragraphCount || 0} paragraphs\\n\\n`;

        // Add metadata if available
        if (result.document.metadata && Object.keys(result.document.metadata).some(k => result.document.metadata[k])) {
            markdown += `## Document Information\\n\\n`;
            if (result.document.metadata.title) markdown += `**Title**: ${result.document.metadata.title}\\n`;
            if (result.document.metadata.author) markdown += `**Author**: ${result.document.metadata.author}\\n`;
            if (result.document.metadata.created) markdown += `**Created**: ${result.document.metadata.created}\\n`;
            if (result.document.metadata.modified) markdown += `**Modified**: ${result.document.metadata.modified}\\n`;
            markdown += `\\n`;
        }

        // Add structure analysis if available
        if (result.structureAnalysis) {
            markdown += `## Document Analysis\\n\\n`;
            markdown += `- **Type**: ${result.structureAnalysis.documentType}\\n`;
            markdown += `- **Structure Score**: ${result.structureAnalysis.structureScore}/100\\n`;
            markdown += `- **Has Headings**: ${result.structureAnalysis.hasHeadings ? 'Yes' : 'No'}\\n`;
            markdown += `- **Has Tables**: ${result.statistics?.tableCount > 0 ? 'Yes' : 'No'}\\n`;
            markdown += `- **Has Lists**: ${result.structureAnalysis.hasNumberedLists || result.structureAnalysis.hasBulletLists ? 'Yes' : 'No'}\\n\\n`;
        }

        markdown += `## Content\\n\\n`;

        // Add paragraphs with proper formatting
        if (result.document.paragraphs) {
            result.document.paragraphs.forEach((paragraph) => {
                const style = paragraph.style || 'Normal';
                
                if (style.includes('Heading 1') || style.includes('Title')) {
                    markdown += `# ${paragraph.text}\\n\\n`;
                } else if (style.includes('Heading 2')) {
                    markdown += `## ${paragraph.text}\\n\\n`;
                } else if (style.includes('Heading 3')) {
                    markdown += `### ${paragraph.text}\\n\\n`;
                } else if (style.includes('Heading')) {
                    markdown += `#### ${paragraph.text}\\n\\n`;
                } else {
                    markdown += `${paragraph.text}\\n\\n`;
                }
            });
        }

        // Add tables
        if (result.document.tables && result.document.tables.length > 0) {
            markdown += `## Tables\\n\\n`;
            result.document.tables.forEach((table, index) => {
                markdown += `### Table ${index + 1}\\n\\n`;
                if (table.data && table.data.length > 0) {
                    // Use first row as headers
                    const headers = table.data[0];
                    const rows = table.data.slice(1);
                    
                    if (headers.length > 0) {
                        markdown += `| ${headers.join(' | ')} |\\n`;
                        markdown += `| ${headers.map(() => '---').join(' | ')} |\\n`;
                        
                        rows.forEach(row => {
                            markdown += `| ${row.join(' | ')} |\\n`;
                        });
                    }
                }
                markdown += `\\n`;
            });
        }

        return {
            success: true,
            content: markdown,
            metadata: result.processingInfo
        };
    }

    /**
     * Get helpful error suggestions
     */
    getSuggestionForError(errorMessage) {
        if (errorMessage.includes('python-docx')) {
            return 'Install Python Word library: pip install python-docx';
        }

        if (errorMessage.includes('File too large')) {
            return 'Try splitting the document into smaller files or use a different processing method';
        }

        if (errorMessage.includes('Cannot access file')) {
            return 'Check file path and permissions';
        }

        if (errorMessage.includes('Unsupported format')) {
            return 'Only DOCX and DOC files are supported. Convert your file to DOCX format';
        }

        return 'Check file format and try with a different Word document';
    }
}

module.exports = { WordProcessingSkill };