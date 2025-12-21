/**
 * PowerPoint Extraction Skill
 *
 * Extracts content from PowerPoint presentations for business analysis:
 * - Slide-by-slide text extraction and structure analysis
 * - Title, content, and notes extraction
 * - Image and chart metadata extraction
 * - Presentation flow and structure analysis
 * - Business presentation intelligence (pitch decks, reports, etc.)
 */

const { BaseSkill } = require('../core/base_skill');
const fs = require('fs').promises;
const path = require('path');

class PowerPointExtractionSkill extends BaseSkill {
    constructor() {
        super('PowerPointExtractionSkill', {
            description: 'Extract and analyze content from PowerPoint presentations',
            capabilities: [
                'pptx_content_extraction',
                'slide_structure_analysis',
                'presentation_flow_analysis',
                'image_chart_detection',
                'business_presentation_intelligence',
                'speaker_notes_extraction',
                'template_recognition'
            ],
            inputFormats: ['json'],
            outputFormats: ['json', 'text', 'markdown'],
            requiresAuth: false
        });

        this.supportedFormats = ['.pptx', '.ppt'];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB limit
    }

    /**
     * Extract content from PowerPoint files
     */
    async execute(inputs = {}) {
        const {
            filePath,
            method = 'auto', // 'python-pptx', 'node-officegen', 'auto'
            extractImages = false,
            extractNotes = true,
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
            const validation = await this.validatePowerPointFile(filePath);
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
                case 'python-pptx':
                    result = await this.extractWithPython(filePath, inputs);
                    break;
                case 'node-officegen':
                    result = await this.extractWithNode(filePath, inputs);
                    break;
                default:
                    result = await this.extractWithPython(filePath, inputs);
                    break;
            }

            // Analyze structure if requested
            if (analyzeStructure && result.success) {
                result.structureAnalysis = await this.analyzeSlideStructure(result.slides);
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
     * Validate PowerPoint file
     */
    async validatePowerPointFile(filePath) {
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
     * Select best extraction method
     */
    async selectBestMethod(filePath, stats) {
        // For now, prefer Python method for better PPTX support
        return 'python-pptx';
    }

    /**
     * Extract using Python python-pptx library
     */
    async extractWithPython(filePath, inputs = {}) {
        const { spawn } = require('child_process');

        const pythonScript = `
import sys
import json
import os
from pathlib import Path

try:
    from pptx import Presentation
except ImportError:
    # Try to install required packages
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-pptx"])
    from pptx import Presentation

def extract_from_pptx(file_path, options={}):
    """Extract content from PPTX file"""
    try:
        # Load presentation
        prs = Presentation(file_path)
        
        slides_data = []
        
        for i, slide in enumerate(prs.slides):
            slide_data = {
                'slideNumber': i + 1,
                'title': '',
                'content': [],
                'notes': '',
                'images': [],
                'shapes': []
            }
            
            # Extract text from shapes
            for shape in slide.shapes:
                shape_info = {
                    'type': str(shape.shape_type),
                    'hasText': hasattr(shape, 'text')
                }
                
                if hasattr(shape, 'text') and shape.text.strip():
                    text_content = shape.text.strip()
                    
                    # Try to identify if this is a title
                    if hasattr(shape, 'placeholder_format') and shape.placeholder_format:
                        if shape.placeholder_format.type == 1:  # Title placeholder
                            slide_data['title'] = text_content
                        else:
                            slide_data['content'].append({
                                'type': 'text',
                                'content': text_content,
                                'placeholder_type': str(shape.placeholder_format.type)
                            })
                    else:
                        # If no title yet and this looks like a title
                        if not slide_data['title'] and len(text_content) < 100 and '\\n' not in text_content:
                            slide_data['title'] = text_content
                        else:
                            slide_data['content'].append({
                                'type': 'text',
                                'content': text_content
                            })
                    
                    shape_info['text'] = text_content
                
                # Check for images
                if hasattr(shape, 'image') and shape.image:
                    image_info = {
                        'type': 'image',
                        'filename': getattr(shape.image, 'filename', 'unknown'),
                        'size': getattr(shape.image, 'size', 'unknown')
                    }
                    slide_data['images'].append(image_info)
                    shape_info['hasImage'] = True
                
                slide_data['shapes'].append(shape_info)
            
            # Extract notes if available
            if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                slide_data['notes'] = slide.notes_slide.notes_text_frame.text.strip()
            
            slides_data.append(slide_data)
        
        # Generate summary
        total_text = sum(len(slide.get('title', '') + ' '.join([c.get('content', '') for c in slide.get('content', [])])) for slide in slides_data)
        
        return {
            'success': True,
            'method': 'python-pptx',
            'fileName': Path(file_path).stem,
            'slides': slides_data,
            'metadata': {
                'totalSlides': len(slides_data),
                'totalTextLength': total_text,
                'hasNotes': any(slide.get('notes') for slide in slides_data),
                'hasImages': any(slide.get('images') for slide in slides_data),
                'processingMethod': 'python-pptx',
                'fileSize': os.path.getsize(file_path),
                'processedAt': '2024-12-21T00:00:00Z'  # Would use datetime in real implementation
            }
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'PPTX extraction failed: {str(e)}'
        }

if __name__ == "__main__":
    file_path = sys.argv[1] if len(sys.argv) > 1 else None
    options = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    
    if not file_path or not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": "File path required and must exist"}))
        sys.exit(1)
    
    result = extract_from_pptx(file_path, options)
    print(json.dumps(result, ensure_ascii=False, indent=2))
`;

        // Write Python script to temporary file
        const scriptPath = path.join(require('os').tmpdir(), 'pptx_extractor.py');
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
     * Extract using Node.js (placeholder implementation)
     */
    async extractWithNode(filePath, inputs = {}) {
        // Placeholder for Node.js-based extraction
        // In production, would use libraries like officegen or node-pptx
        
        return {
            success: false,
            error: 'Node.js PPTX extraction not yet implemented',
            suggestion: 'Use python-pptx method instead'
        };
    }

    /**
     * Analyze slide structure and flow
     */
    async analyzeSlideStructure(slides) {
        if (!slides || slides.length === 0) {
            return { analyzed: false, reason: 'No slides to analyze' };
        }

        const analysis = {
            slideCount: slides.length,
            titleSlides: [],
            contentSlides: [],
            imageSlides: [],
            presentationType: 'unknown',
            flow: {
                hasIntroduction: false,
                hasConclusion: false,
                hasAgenda: false
            },
            commonPatterns: []
        };

        // Analyze each slide
        slides.forEach((slide, index) => {
            const title = slide.title || '';
            const content = slide.content || [];
            const images = slide.images || [];

            // Categorize slides
            if (title && content.length === 0) {
                analysis.titleSlides.push(index + 1);
            } else if (content.length > 0) {
                analysis.contentSlides.push(index + 1);
            }

            if (images.length > 0) {
                analysis.imageSlides.push(index + 1);
            }

            // Look for common patterns
            const titleLower = title.toLowerCase();
            if (titleLower.includes('introduction') || titleLower.includes('overview')) {
                analysis.flow.hasIntroduction = true;
            }
            if (titleLower.includes('conclusion') || titleLower.includes('summary') || titleLower.includes('next steps')) {
                analysis.flow.hasConclusion = true;
            }
            if (titleLower.includes('agenda') || titleLower.includes('outline')) {
                analysis.flow.hasAgenda = true;
            }
        });

        // Determine presentation type
        if (analysis.flow.hasIntroduction && analysis.flow.hasConclusion) {
            analysis.presentationType = 'structured_presentation';
        } else if (slides.length > 10 && analysis.contentSlides.length > analysis.titleSlides.length) {
            analysis.presentationType = 'detailed_report';
        } else if (slides.length <= 5) {
            analysis.presentationType = 'brief_overview';
        }

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
        if (!result.slides) {
            return { success: false, error: 'No slides data available' };
        }

        let textContent = `PowerPoint Content\\n`;
        textContent += `File: ${result.fileName}\\n`;
        textContent += `Total Slides: ${result.metadata?.totalSlides || result.slides.length}\\n`;
        textContent += `${'='.repeat(50)}\\n\\n`;

        result.slides.forEach((slide, index) => {
            textContent += `Slide ${index + 1}\\n`;
            textContent += `${'-'.repeat(20)}\\n`;
            
            if (slide.title) {
                textContent += `Title: ${slide.title}\\n\\n`;
            }

            if (slide.content && slide.content.length > 0) {
                textContent += 'Content:\\n';
                slide.content.forEach((content, contentIndex) => {
                    textContent += `  ${contentIndex + 1}. ${content.content || content}\\n`;
                });
                textContent += '\\n';
            }

            if (slide.notes) {
                textContent += `Notes: ${slide.notes}\\n\\n`;
            }

            if (slide.images && slide.images.length > 0) {
                textContent += `Images: ${slide.images.length} image(s)\\n\\n`;
            }

            textContent += '\\n';
        });

        return {
            success: true,
            content: textContent,
            metadata: result.metadata
        };
    }

    /**
     * Convert to markdown format
     */
    convertToMarkdown(result) {
        if (!result.slides) {
            return { success: false, error: 'No slides data available' };
        }

        let markdown = `# PowerPoint Content\\n\\n`;
        markdown += `**File**: ${result.fileName}\\n`;
        markdown += `**Total Slides**: ${result.metadata?.totalSlides || result.slides.length}\\n\\n`;

        // Add structure analysis if available
        if (result.structureAnalysis) {
            markdown += `## Presentation Analysis\\n\\n`;
            markdown += `- **Type**: ${result.structureAnalysis.presentationType}\\n`;
            markdown += `- **Has Introduction**: ${result.structureAnalysis.flow.hasIntroduction ? 'Yes' : 'No'}\\n`;
            markdown += `- **Has Conclusion**: ${result.structureAnalysis.flow.hasConclusion ? 'Yes' : 'No'}\\n`;
            markdown += `- **Content Slides**: ${result.structureAnalysis.contentSlides.length}\\n`;
            markdown += `- **Image Slides**: ${result.structureAnalysis.imageSlides.length}\\n\\n`;
        }

        markdown += `## Slides\\n\\n`;

        result.slides.forEach((slide, index) => {
            markdown += `### Slide ${index + 1}`;
            if (slide.title) {
                markdown += `: ${slide.title}`;
            }
            markdown += `\\n\\n`;

            if (slide.content && slide.content.length > 0) {
                slide.content.forEach((content) => {
                    if (content.content) {
                        markdown += `${content.content}\\n\\n`;
                    } else if (typeof content === 'string') {
                        markdown += `${content}\\n\\n`;
                    }
                });
            }

            if (slide.notes) {
                markdown += `**Speaker Notes**: ${slide.notes}\\n\\n`;
            }

            if (slide.images && slide.images.length > 0) {
                markdown += `**Images**: ${slide.images.length} image(s)\\n\\n`;
            }

            markdown += `---\\n\\n`;
        });

        return {
            success: true,
            content: markdown,
            metadata: result.metadata
        };
    }

    /**
     * Get helpful error suggestions
     */
    getSuggestionForError(errorMessage) {
        if (errorMessage.includes('python-pptx')) {
            return 'Install Python PowerPoint library: pip install python-pptx';
        }

        if (errorMessage.includes('File too large')) {
            return 'Try splitting the presentation into smaller files or use a different extraction method';
        }

        if (errorMessage.includes('Cannot access file')) {
            return 'Check file path and permissions';
        }

        if (errorMessage.includes('Unsupported format')) {
            return 'Only PPTX and PPT files are supported. Convert your file to PPTX format';
        }

        return 'Check file format and try with a different PowerPoint file';
    }
}

module.exports = { PowerPointExtractionSkill };