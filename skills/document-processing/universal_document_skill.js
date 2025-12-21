/**
 * Universal Document Processing Skill
 *
 * Auto-detects and processes multiple document formats:
 * - Automatic format detection and routing
 * - Unified interface for all document types
 * - Batch processing capabilities
 * - Cross-format analysis and comparison
 * - Business intelligence across document types
 */

const { BaseSkill } = require('../core/base_skill');
const fs = require('fs').promises;
const path = require('path');

// Import specific processors
const { PDFExtractionSkill } = require('./pdf_extraction_skill');
const { ExcelProcessingSkill } = require('./excel_processing_skill');
const { PowerPointExtractionSkill } = require('./powerpoint_extraction_skill');
const { WordProcessingSkill } = require('./word_processing_skill');

class UniversalDocumentSkill extends BaseSkill {
    constructor() {
        super('UniversalDocumentSkill', {
            description: 'Process any business document format with automatic detection and routing',
            capabilities: [
                'auto_format_detection',
                'multi_format_processing',
                'batch_document_processing',
                'cross_format_analysis',
                'unified_document_interface',
                'business_intelligence_aggregation',
                'document_comparison'
            ],
            inputFormats: ['json'],
            outputFormats: ['json', 'text', 'markdown'],
            requiresAuth: false
        });

        // Initialize specialized processors
        this.processors = {
            pdf: new PDFExtractionSkill(),
            excel: new ExcelProcessingSkill(),
            powerpoint: new PowerPointExtractionSkill(),
            word: new WordProcessingSkill()
        };

        // Supported format mappings
        this.formatMappings = {
            '.pdf': 'pdf',
            '.xlsx': 'excel',
            '.xls': 'excel',
            '.csv': 'excel',
            '.tsv': 'excel',
            '.pptx': 'powerpoint',
            '.ppt': 'powerpoint',
            '.docx': 'word',
            '.doc': 'word'
        };

        this.maxFileSize = 100 * 1024 * 1024; // 100MB limit
    }

    /**
     * Process any document format
     */
    async execute(inputs = {}) {
        const {
            filePath,
            fileList = null, // For batch processing
            outputFormat = 'json',
            includeAnalysis = true,
            aggregateResults = false
        } = inputs;

        try {
            // Handle batch processing
            if (fileList && Array.isArray(fileList)) {
                return await this.processBatch(fileList, inputs);
            }

            // Handle single file
            if (!filePath) {
                return {
                    success: false,
                    error: 'Either filePath or fileList is required'
                };
            }

            return await this.processSingleDocument(filePath, inputs);

        } catch (error) {
            return {
                success: false,
                error: error.message,
                suggestion: this.getSuggestionForError(error.message)
            };
        }
    }

    /**
     * Process a single document
     */
    async processSingleDocument(filePath, inputs = {}) {
        // Detect format
        const formatDetection = await this.detectDocumentFormat(filePath);
        if (!formatDetection.success) {
            return formatDetection;
        }

        const { format, processor } = formatDetection;

        // Process with appropriate processor
        const processingResult = await processor.execute({
            filePath,
            outputFormat: inputs.outputFormat || 'json',
            ...inputs
        });

        if (!processingResult.success) {
            return processingResult;
        }

        // Add universal metadata
        const universalResult = {
            ...processingResult,
            universalMetadata: {
                detectedFormat: format,
                processorUsed: processor.constructor.name,
                processedAt: new Date().toISOString(),
                filePath: filePath,
                fileName: path.basename(filePath),
                fileSize: (await fs.stat(filePath)).size
            }
        };

        // Add cross-format analysis if requested
        if (inputs.includeAnalysis) {
            universalResult.businessAnalysis = await this.performBusinessAnalysis(universalResult, format);
        }

        return universalResult;
    }

    /**
     * Process multiple documents in batch
     */
    async processBatch(fileList, inputs = {}) {
        const results = {
            success: true,
            batchResults: [],
            summary: {
                totalFiles: fileList.length,
                successfulProcessing: 0,
                failedProcessing: 0,
                formatCounts: {},
                totalProcessingTime: 0
            },
            aggregatedAnalysis: null
        };

        const startTime = Date.now();

        // Process each file
        for (const filePath of fileList) {
            try {
                const fileResult = await this.processSingleDocument(filePath, {
                    ...inputs,
                    includeAnalysis: true
                });

                results.batchResults.push({
                    filePath,
                    result: fileResult
                });

                if (fileResult.success) {
                    results.summary.successfulProcessing++;
                    const format = fileResult.universalMetadata?.detectedFormat || 'unknown';
                    results.summary.formatCounts[format] = (results.summary.formatCounts[format] || 0) + 1;
                } else {
                    results.summary.failedProcessing++;
                }

            } catch (error) {
                results.batchResults.push({
                    filePath,
                    result: {
                        success: false,
                        error: error.message
                    }
                });
                results.summary.failedProcessing++;
            }
        }

        results.summary.totalProcessingTime = Date.now() - startTime;

        // Generate aggregated analysis if requested
        if (inputs.aggregateResults) {
            results.aggregatedAnalysis = await this.aggregateBusinessIntelligence(results.batchResults);
        }

        return results;
    }

    /**
     * Detect document format and select appropriate processor
     */
    async detectDocumentFormat(filePath) {
        try {
            // Check if file exists
            const stats = await fs.stat(filePath);
            if (!stats.isFile()) {
                return { success: false, error: 'Path is not a file' };
            }

            // Check file size
            if (stats.size > this.maxFileSize) {
                return { 
                    success: false, 
                    error: `File too large (${Math.round(stats.size / 1024 / 1024)}MB). Maximum size is ${this.maxFileSize / 1024 / 1024}MB` 
                };
            }

            // Detect by extension
            const ext = path.extname(filePath).toLowerCase();
            const format = this.formatMappings[ext];

            if (!format) {
                return {
                    success: false,
                    error: `Unsupported format: ${ext}. Supported: ${Object.keys(this.formatMappings).join(', ')}`
                };
            }

            const processor = this.processors[format];
            if (!processor) {
                return {
                    success: false,
                    error: `No processor available for format: ${format}`
                };
            }

            return {
                success: true,
                format,
                processor,
                fileExtension: ext,
                fileSize: stats.size
            };

        } catch (error) {
            return {
                success: false,
                error: `Cannot access file: ${error.message}`
            };
        }
    }

    /**
     * Perform business-focused analysis across document types
     */
    async performBusinessAnalysis(processingResult, format) {
        const analysis = {
            documentType: format,
            businessContext: 'unknown',
            keyMetrics: {},
            actionableInsights: [],
            crossReferenceOpportunities: []
        };

        try {
            // Extract content for analysis
            let textContent = '';
            
            switch (format) {
                case 'pdf':
                    textContent = processingResult.text || '';
                    if (processingResult.structured?.document_type === 'DACI') {
                        analysis.businessContext = 'decision_document';
                        analysis.actionableInsights.push('DACI document detected - contains decision framework');
                    }
                    break;

                case 'excel':
                    if (processingResult.sheets) {
                        const sheetNames = Object.keys(processingResult.sheets);
                        analysis.keyMetrics.sheetCount = sheetNames.length;
                        analysis.keyMetrics.totalRows = processingResult.summary?.totalRows || 0;
                        
                        // Look for financial data
                        const hasFinancialKeywords = sheetNames.some(name => 
                            name.toLowerCase().includes('revenue') || 
                            name.toLowerCase().includes('financial') ||
                            name.toLowerCase().includes('budget')
                        );
                        
                        if (hasFinancialKeywords) {
                            analysis.businessContext = 'financial_data';
                            analysis.crossReferenceOpportunities.push('Consider analyzing with Snowflake data for validation');
                        }
                    }
                    break;

                case 'powerpoint':
                    if (processingResult.slides) {
                        analysis.keyMetrics.slideCount = processingResult.slides.length;
                        analysis.keyMetrics.hasImages = processingResult.metadata?.hasImages || false;
                        
                        // Check presentation type
                        if (processingResult.structureAnalysis?.presentationType) {
                            analysis.businessContext = processingResult.structureAnalysis.presentationType;
                        }
                    }
                    break;

                case 'word':
                    if (processingResult.document) {
                        analysis.keyMetrics.wordCount = processingResult.statistics?.wordCount || 0;
                        analysis.keyMetrics.hasStructure = processingResult.structureAnalysis?.structureScore > 50;
                        
                        if (processingResult.structureAnalysis?.documentType) {
                            analysis.businessContext = processingResult.structureAnalysis.documentType;
                        }
                    }
                    break;
            }

            // Add common business intelligence
            if (textContent) {
                const businessKeywords = {
                    'financial': ['revenue', 'budget', 'cost', 'profit', 'financial'],
                    'strategy': ['strategy', 'strategic', 'roadmap', 'vision', 'goals'],
                    'operational': ['process', 'workflow', 'operational', 'procedure'],
                    'hr': ['employee', 'hr', 'human resources', 'hiring', 'performance'],
                    'marketing': ['marketing', 'campaign', 'brand', 'customer', 'market']
                };

                const detectedCategories = [];
                for (const [category, keywords] of Object.entries(businessKeywords)) {
                    if (keywords.some(keyword => textContent.toLowerCase().includes(keyword))) {
                        detectedCategories.push(category);
                    }
                }

                if (detectedCategories.length > 0) {
                    analysis.businessCategories = detectedCategories;
                    analysis.actionableInsights.push(`Document relates to: ${detectedCategories.join(', ')}`);
                }
            }

        } catch (error) {
            analysis.analysisError = error.message;
        }

        return analysis;
    }

    /**
     * Aggregate business intelligence across multiple documents
     */
    async aggregateBusinessIntelligence(batchResults) {
        const aggregation = {
            documentSummary: {
                totalDocuments: batchResults.length,
                formatBreakdown: {},
                businessContextBreakdown: {},
                keywordFrequency: {}
            },
            crossDocumentInsights: [],
            recommendedActions: []
        };

        const successfulResults = batchResults.filter(r => r.result.success);

        // Aggregate by format
        successfulResults.forEach(({ result }) => {
            const format = result.universalMetadata?.detectedFormat;
            if (format) {
                aggregation.documentSummary.formatBreakdown[format] = 
                    (aggregation.documentSummary.formatBreakdown[format] || 0) + 1;
            }

            // Aggregate business contexts
            const context = result.businessAnalysis?.businessContext;
            if (context && context !== 'unknown') {
                aggregation.documentSummary.businessContextBreakdown[context] = 
                    (aggregation.documentSummary.businessContextBreakdown[context] || 0) + 1;
            }
        });

        // Generate cross-document insights
        const formatCount = Object.keys(aggregation.documentSummary.formatBreakdown).length;
        if (formatCount > 2) {
            aggregation.crossDocumentInsights.push(
                `Multi-format document set detected (${formatCount} formats) - suitable for comprehensive analysis`
            );
        }

        // Look for related documents
        const daciDocuments = successfulResults.filter(r => 
            r.result.businessAnalysis?.businessContext === 'decision_document'
        );
        const financialDocuments = successfulResults.filter(r => 
            r.result.businessAnalysis?.businessContext === 'financial_data'
        );

        if (daciDocuments.length > 0 && financialDocuments.length > 0) {
            aggregation.crossDocumentInsights.push(
                'Decision documents (DACI) and financial data detected - potential for decision impact analysis'
            );
            aggregation.recommendedActions.push(
                'Consider cross-referencing DACI decisions with financial performance metrics'
            );
        }

        if (financialDocuments.length > 0) {
            aggregation.recommendedActions.push(
                'Financial data detected - recommend validation against Snowflake data sources'
            );
        }

        return aggregation;
    }

    /**
     * Get available processors and their capabilities
     */
    getAvailableProcessors() {
        const processors = {};
        
        for (const [format, processor] of Object.entries(this.processors)) {
            processors[format] = {
                name: processor.constructor.name,
                capabilities: processor.capabilities || [],
                supportedFormats: this.getSupportedFormatsForProcessor(format)
            };
        }

        return {
            universal: {
                name: 'UniversalDocumentSkill',
                supportedFormats: Object.keys(this.formatMappings),
                processors: processors
            }
        };
    }

    /**
     * Get supported formats for a specific processor
     */
    getSupportedFormatsForProcessor(format) {
        return Object.keys(this.formatMappings).filter(ext => 
            this.formatMappings[ext] === format
        );
    }

    /**
     * Get helpful error suggestions
     */
    getSuggestionForError(errorMessage) {
        if (errorMessage.includes('Unsupported format')) {
            return `Supported formats: ${Object.keys(this.formatMappings).join(', ')}`;
        }

        if (errorMessage.includes('File too large')) {
            return 'Consider processing files individually or increasing the file size limit';
        }

        if (errorMessage.includes('No processor available')) {
            return 'Check that all required document processors are properly initialized';
        }

        if (errorMessage.includes('Cannot access file')) {
            return 'Check file paths and permissions for all documents';
        }

        return 'Check file formats and ensure all documents are accessible';
    }
}

module.exports = { UniversalDocumentSkill };