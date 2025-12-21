/**
 * PDF Extraction Skill
 *
 * Extracts text and structured data from PDF files using multiple approaches:
 * - Python-based extraction using PyPDF2/pdfplumber
 * - Claude API for visual PDF processing
 * - Text chunking and structured extraction
 */

const { BaseSkill } = require('../core/base_skill');
const fs = require('fs').promises;
const path = require('path');

class PDFExtractionSkill extends BaseSkill {
    constructor() {
        super('PDFExtractionSkill', {
            description: 'Extract text and structured data from PDF documents',
            capabilities: [
                'pdf_text_extraction',
                'pdf_structure_analysis',
                'document_chunking',
                'metadata_extraction',
                'daci_template_processing',
                'business_document_analysis'
            ],
            inputFormats: ['json'],
            outputFormats: ['json', 'text', 'markdown'],
            requiresAuth: false
        });

        this.supportedFormats = ['.pdf'];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB limit
    }

    /**
     * Extract text from PDF using multiple methods
     */
    async execute(inputs = {}) {
        const {
            filePath,
            method = 'auto', // 'python', 'api', 'auto'
            extractImages = false,
            structuredExtraction = false,
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
            const validation = await this.validatePDFFile(filePath);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error
                };
            }

            // Choose extraction method
            let extractionMethod = method;
            if (method === 'auto') {
                extractionMethod = await this.selectBestMethod(filePath, validation.stats);
            }

            // Extract content
            let result;
            switch (extractionMethod) {
                case 'python':
                    result = await this.extractWithPython(filePath, inputs);
                    break;
                case 'api':
                    result = await this.extractWithAPI(filePath, inputs);
                    break;
                default:
                    result = await this.extractWithPython(filePath, inputs);
                    break;
            }

            // Post-process if needed
            if (structuredExtraction) {
                result.structured = await this.extractStructuredData(result.text);
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
     * Validate PDF file
     */
    async validatePDFFile(filePath) {
        try {
            const stats = await fs.stat(filePath);

            if (!stats.isFile()) {
                return { valid: false, error: 'Path is not a file' };
            }

            if (stats.size > this.maxFileSize) {
                return { valid: false, error: `File too large (${Math.round(stats.size / 1024 / 1024)}MB). Maximum size is ${this.maxFileSize / 1024 / 1024}MB` };
            }

            const ext = path.extname(filePath).toLowerCase();
            if (!this.supportedFormats.includes(ext)) {
                return { valid: false, error: `Unsupported format: ${ext}. Supported: ${this.supportedFormats.join(', ')}` };
            }

            return { valid: true, stats };

        } catch (error) {
            return { valid: false, error: `Cannot access file: ${error.message}` };
        }
    }

    /**
     * Select best extraction method based on file characteristics
     */
    async selectBestMethod(filePath, stats) {
        // For now, prefer Python method for reliability
        // Could add logic to detect image-heavy PDFs and use API method
        return 'python';
    }

    /**
     * Extract using Python-based tools
     */
    async extractWithPython(filePath, inputs = {}) {
        const { spawn } = require('child_process');

        // Create a Python script for PDF extraction
        const pythonScript = `
import sys
import json
import os

try:
    import PyPDF2
    import pdfplumber
except ImportError:
    # Try to install required packages
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2", "pdfplumber"])
    import PyPDF2
    import pdfplumber

def extract_with_pypdf2(file_path):
    """Basic text extraction with PyPDF2"""
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            metadata = {
                "num_pages": len(reader.pages),
                "title": reader.metadata.get('/Title', '') if reader.metadata else '',
                "author": reader.metadata.get('/Author', '') if reader.metadata else '',
                "subject": reader.metadata.get('/Subject', '') if reader.metadata else ''
            }

            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                text += f"\\n--- Page {page_num + 1} ---\\n{page_text}\\n"

            return {
                "method": "PyPDF2",
                "text": text.strip(),
                "metadata": metadata,
                "success": True
            }
    except Exception as e:
        return {"success": False, "error": f"PyPDF2 extraction failed: {str(e)}"}

def extract_with_pdfplumber(file_path):
    """Enhanced extraction with pdfplumber"""
    try:
        with pdfplumber.open(file_path) as pdf:
            text = ""
            tables = []
            metadata = pdf.metadata or {}

            for page_num, page in enumerate(pdf.pages):
                page_text = page.extract_text() or ""
                text += f"\\n--- Page {page_num + 1} ---\\n{page_text}\\n"

                # Extract tables if present
                page_tables = page.extract_tables()
                if page_tables:
                    for table_num, table in enumerate(page_tables):
                        tables.append({
                            "page": page_num + 1,
                            "table_number": table_num + 1,
                            "data": table
                        })

            return {
                "method": "pdfplumber",
                "text": text.strip(),
                "tables": tables,
                "metadata": {
                    "num_pages": len(pdf.pages),
                    "title": metadata.get('Title', ''),
                    "author": metadata.get('Author', ''),
                    "subject": metadata.get('Subject', ''),
                    "creator": metadata.get('Creator', ''),
                    "producer": metadata.get('Producer', '')
                },
                "success": True
            }
    except Exception as e:
        return {"success": False, "error": f"pdfplumber extraction failed: {str(e)}"}

if __name__ == "__main__":
    file_path = sys.argv[1] if len(sys.argv) > 1 else None

    if not file_path or not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": "File path required and must exist"}))
        sys.exit(1)

    # Try pdfplumber first (more features), fallback to PyPDF2
    result = extract_with_pdfplumber(file_path)
    if not result["success"]:
        result = extract_with_pypdf2(file_path)

    print(json.dumps(result, ensure_ascii=False, indent=2))
`;

        // Write Python script to temporary file
        const scriptPath = path.join(require('os').tmpdir(), 'pdf_extractor.py');
        await fs.writeFile(scriptPath, pythonScript);

        return new Promise((resolve, reject) => {
            const python = spawn('python', [scriptPath, filePath], {
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
                        error: `Python extraction failed with code ${code}`,
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
     * Extract using Claude API (for image-heavy PDFs)
     */
    async extractWithAPI(filePath, inputs = {}) {
        // This would use Claude API with the PDF file
        // For now, return placeholder
        return {
            success: false,
            error: 'API extraction not yet implemented',
            suggestion: 'Use python method instead'
        };
    }

    /**
     * Extract structured data from text
     */
    async extractStructuredData(text) {
        // Basic structure detection for business documents
        const structure = {
            sections: [],
            headings: [],
            tables_detected: false,
            bullet_points: [],
            document_type: 'unknown'
        };

        const lines = text.split('\n');

        // Detect headings (lines that are shorter and might be titles)
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed) {
                // Simple heuristic for headings
                if (trimmed.length < 100 &&
                    (trimmed.includes('DACI') ||
                     trimmed.match(/^[A-Z][A-Za-z\s]+:?$/) ||
                     trimmed.match(/^\d+\.\s/))) {
                    structure.headings.push({
                        text: trimmed,
                        line_number: index + 1
                    });
                }

                // Detect bullet points
                if (trimmed.match(/^[-•·]\s/) || trimmed.match(/^\d+\.\s/)) {
                    structure.bullet_points.push({
                        text: trimmed,
                        line_number: index + 1
                    });
                }
            }
        });

        // Detect document type
        if (text.includes('DACI') || text.includes('Driver') || text.includes('Approver')) {
            structure.document_type = 'DACI';
        }

        return structure;
    }

    /**
     * Format output based on requested format
     */
    formatOutput(result, format) {
        switch (format.toLowerCase()) {
            case 'text':
                return {
                    success: result.success,
                    content: result.text || result.error,
                    metadata: result.metadata
                };

            case 'markdown':
                const markdown = this.convertToMarkdown(result);
                return {
                    success: result.success,
                    content: markdown,
                    metadata: result.metadata
                };

            case 'json':
            default:
                return result;
        }
    }

    /**
     * Convert extracted content to Markdown
     */
    convertToMarkdown(result) {
        if (!result.success) {
            return `# PDF Extraction Failed\n\n${result.error}`;
        }

        let markdown = `# PDF Content\n\n`;

        if (result.metadata) {
            markdown += `## Document Information\n`;
            markdown += `- **Title**: ${result.metadata.title || 'N/A'}\n`;
            markdown += `- **Author**: ${result.metadata.author || 'N/A'}\n`;
            markdown += `- **Pages**: ${result.metadata.num_pages || 'N/A'}\n`;
            markdown += `- **Extraction Method**: ${result.method}\n\n`;
        }

        markdown += `## Extracted Text\n\n`;
        markdown += result.text || 'No text extracted';

        if (result.tables && result.tables.length > 0) {
            markdown += `\n\n## Tables\n\n`;
            result.tables.forEach((table, index) => {
                markdown += `### Table ${index + 1} (Page ${table.page})\n\n`;
                if (table.data && table.data.length > 0) {
                    // Convert table to markdown
                    const headers = table.data[0] || [];
                    const rows = table.data.slice(1) || [];

                    if (headers.length > 0) {
                        markdown += `| ${headers.join(' | ')} |\n`;
                        markdown += `| ${headers.map(() => '---').join(' | ')} |\n`;

                        rows.forEach(row => {
                            markdown += `| ${row.join(' | ')} |\n`;
                        });
                    }
                }
                markdown += '\n';
            });
        }

        return markdown;
    }

    /**
     * Process DACI documents specifically
     */
    async extractDACIStructure(filePath) {
        const result = await this.execute({
            filePath,
            structuredExtraction: true,
            outputFormat: 'json'
        });

        if (!result.success) {
            return result;
        }

        // DACI-specific parsing
        const daciStructure = {
            title: '',
            driver: '',
            approver: '',
            contributors: [],
            informed: [],
            sections: {
                problem: '',
                solution: '',
                alternatives: [],
                decision: '',
                next_steps: []
            }
        };

        // Extract DACI components from text
        const text = result.text || '';

        // This is a basic implementation - could be enhanced with NLP
        if (text.includes('Driver:')) {
            const driverMatch = text.match(/Driver:\s*([^\n]+)/i);
            if (driverMatch) daciStructure.driver = driverMatch[1].trim();
        }

        if (text.includes('Approver:')) {
            const approverMatch = text.match(/Approver:\s*([^\n]+)/i);
            if (approverMatch) daciStructure.approver = approverMatch[1].trim();
        }

        return {
            ...result,
            daci_structure: daciStructure
        };
    }

    /**
     * Get helpful error suggestions
     */
    getSuggestionForError(errorMessage) {
        if (errorMessage.includes('PyPDF2') || errorMessage.includes('pdfplumber')) {
            return 'Install Python PDF libraries: pip install PyPDF2 pdfplumber';
        }

        if (errorMessage.includes('File too large')) {
            return 'Try splitting the PDF into smaller files or use a different extraction method';
        }

        if (errorMessage.includes('Cannot access file')) {
            return 'Check file path and permissions';
        }

        return 'Check file format and try with a different PDF';
    }
}

module.exports = { PDFExtractionSkill };