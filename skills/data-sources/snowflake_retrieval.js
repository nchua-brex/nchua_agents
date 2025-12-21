/**
 * Snowflake Data Retrieval Skill
 *
 * Uses Brex Data Team validated SQL patterns with:
 * - Template-based query system with your reference queries
 * - Business rules extracted from validated patterns
 * - Data quality validation and checks
 * - Multiple output formats with metadata
 */

const { BaseSkill } = require('../core/base_skill');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class SnowflakeRetrievalSkill extends BaseSkill {
    constructor() {
        super('SnowflakeRetrievalSkill', {
            description: 'Brex Data Team validated Snowflake analysis with reference patterns',
            capabilities: [
                'customer_edition_analysis',
                'customer_obs_analysis',
                'cross_sell_upsell_analysis',
                'sc_commission_analysis',
                'customer_revenue_data',
                'territory_performance',
                'segmentation_analysis'
            ],
            inputFormats: ['json'],
            outputFormats: ['json', 'csv', 'dataframe'],
            requiresAuth: true
        });

        // Configuration paths
        this.basePath = path.join(__dirname, 'templates');
        this.knowledgeBasePath = path.join(__dirname, 'knowledge_base');

        // Loaded knowledge base
        this.businessRules = null;
        this.tableDefinitions = null;
        this.validationPatterns = null;

        // MCP client - will be initialized when needed
        this.mcpClient = null;

        // Initialize knowledge base
        this.initializeKnowledgeBase();
    }

    /**
     * Load business rules and validation patterns
     */
    async initializeKnowledgeBase() {
        try {
            // Load business rules
            const businessRulesPath = path.join(this.knowledgeBasePath, 'business_rules.yaml');
            const businessRulesContent = await fs.readFile(businessRulesPath, 'utf8');
            this.businessRules = yaml.load(businessRulesContent);

            // Load table definitions
            const tableDefsPath = path.join(this.knowledgeBasePath, 'table_definitions.yaml');
            const tableDefsContent = await fs.readFile(tableDefsPath, 'utf8');
            this.tableDefinitions = yaml.load(tableDefsContent);

            // Load validation patterns
            const validationPath = path.join(this.knowledgeBasePath, 'validation_patterns.yaml');
            const validationContent = await fs.readFile(validationPath, 'utf8');
            this.validationPatterns = yaml.load(validationContent);

            console.log('✅ Snowflake knowledge base loaded successfully');
        } catch (error) {
            console.warn('⚠️ Could not load knowledge base:', error.message);
            // Initialize with basic rules if files don't exist
            this.businessRules = { core_filters: {} };
            this.tableDefinitions = { primary_tables: {} };
            this.validationPatterns = { general_validation: {} };
        }
    }

    async validateParams(params) {
        await super.validateParams(params);

        // Specific validation for Snowflake queries
        if (params.query && typeof params.query !== 'string') {
            throw new Error('Query parameter must be a string');
        }

        if (params.outputFormat && !['dataframe', 'dict', 'csv', 'json'].includes(params.outputFormat)) {
            throw new Error('Invalid output format. Supported: dataframe, dict, csv, json');
        }

        if (params.templateName && typeof params.templateName !== 'string') {
            throw new Error('Template name must be a string');
        }
    }

    async performSkill(params, context) {
        const {
            query,
            templateName,
            parameters = {},
            outputFormat = 'json',
            applyBusinessRules = true
        } = params;

        let finalQuery = query;

        // If template specified, load and use template
        if (templateName) {
            finalQuery = await this.loadQueryTemplate(templateName);
        }

        if (!finalQuery) {
            throw new Error('No query provided and no template specified');
        }

        // Apply business rules
        if (applyBusinessRules) {
            finalQuery = await this.applyBusinessRules(finalQuery, parameters);
        }

        // Substitute parameters
        finalQuery = this.substituteParameters(finalQuery, parameters);

        // Execute query via MCP
        const queryResult = await this.executeViaMCP(finalQuery);

        // Format output
        return await this.formatOutput(queryResult, outputFormat);
    }

    /**
     * Load SQL query template from file
     */
    async loadQueryTemplate(templateName) {
        const templatePath = path.join(this.basePath, `${templateName}.sql`);

        try {
            return await fs.readFile(templatePath, 'utf8');
        } catch (error) {
            throw new Error(`Query template '${templateName}' not found: ${error.message}`);
        }
    }

    /**
     * Apply business rules to the query
     */
    async applyBusinessRules(query, parameters = {}) {
        let processedQuery = query;

        // Apply business rules from knowledge base
        if (this.businessRules && this.businessRules.core_filters) {
            const coreFilters = this.businessRules.core_filters;

            // Apply core filters that should always be included
            Object.values(coreFilters).forEach(filter => {
                if (filter.always_apply && filter.rule) {
                    // For template queries, these rules are already built in
                    // This is where we could add additional runtime filters
                }
            });
        }

        // Apply custom filters from parameters
        if (parameters.customFilters) {
            for (const filter of parameters.customFilters) {
                processedQuery = this.addWhereClause(processedQuery, filter);
            }
        }

        // Add default date filters if none exist (for performance)
        if (!processedQuery.toLowerCase().includes('date') && !parameters.skipDateFilters) {
            processedQuery = this.addWhereClause(processedQuery, "date >= CURRENT_DATE - INTERVAL '2 years'");
        }

        return processedQuery;
    }

    /**
     * Helper method to add WHERE clauses to queries
     */
    addWhereClause(query, condition) {
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes(' where ')) {
            // Already has WHERE clause, add AND condition
            return query.replace(/(\s+where\s+)/i, `$1(${condition}) AND `);
        } else {
            // No WHERE clause, add one before ORDER BY, GROUP BY, or LIMIT
            const insertPoints = [' order by ', ' group by ', ' limit ', ';'];

            for (const point of insertPoints) {
                if (lowerQuery.includes(point)) {
                    return query.replace(new RegExp(point, 'i'), ` WHERE ${condition}${point}`);
                }
            }

            // If no insert point found, add at the end
            return query.trim() + ` WHERE ${condition}`;
        }
    }

    /**
     * Substitute parameters in query
     */
    substituteParameters(query, parameters) {
        let processedQuery = query;

        // Replace named parameters (e.g., {{start_date}})
        for (const [key, value] of Object.entries(parameters)) {
            const placeholder = `{{${key}}}`;
            if (processedQuery.includes(placeholder)) {
                // Escape SQL values appropriately
                const escapedValue = this.escapeSQLValue(value);
                processedQuery = processedQuery.replace(new RegExp(placeholder, 'g'), escapedValue);
            }
        }

        return processedQuery;
    }

    /**
     * Escape SQL values for safe parameter substitution
     */
    escapeSQLValue(value) {
        if (value === null || value === undefined) {
            return 'NULL';
        }

        if (typeof value === 'string') {
            return `'${value.replace(/'/g, "''")}'`;
        }

        if (typeof value === 'number') {
            return value.toString();
        }

        if (typeof value === 'boolean') {
            return value ? 'TRUE' : 'FALSE';
        }

        if (value instanceof Date) {
            return `'${value.toISOString().split('T')[0]}'`;
        }

        // For arrays, create IN clause
        if (Array.isArray(value)) {
            const escapedValues = value.map(v => this.escapeSQLValue(v));
            return `(${escapedValues.join(', ')})`;
        }

        return `'${String(value)}'`;
    }

    /**
     * Execute query via MCP client
     */
    async executeViaMCP(query) {
        // TODO: Integrate with Claude Code's Snowflake MCP
        // For now, return mock data structure matching Python agent pattern

        this.logger.info(`Executing Snowflake query via MCP: ${query.substring(0, 100)}...`);

        // Mock MCP response - replace with actual MCP integration
        return {
            data: [
                { id: 1, customer: 'Acme Corp', revenue: 50000, territory: 'West' },
                { id: 2, customer: 'Beta Inc', revenue: 75000, territory: 'East' },
                { id: 3, customer: 'Gamma LLC', revenue: 100000, territory: 'Central' }
            ],
            metadata: {
                queryExecuted: query,
                executionTime: '0.45s',
                rowCount: 3,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Format output in requested format
     */
    async formatOutput(queryResult, outputFormat) {
        const { data, metadata } = queryResult;

        switch (outputFormat.toLowerCase()) {
            case 'json':
                return {
                    data: data,
                    metadata: metadata
                };

            case 'dict':
                return {
                    records: data,
                    info: metadata
                };

            case 'csv':
                return this.convertToCSV(data, metadata);

            case 'dataframe':
                // Return structure similar to pandas DataFrame
                return {
                    values: data,
                    columns: data.length > 0 ? Object.keys(data[0]) : [],
                    index: data.map((_, i) => i),
                    metadata: metadata
                };

            default:
                throw new Error(`Unsupported output format: ${outputFormat}`);
        }
    }

    /**
     * Convert data to CSV format
     */
    convertToCSV(data, metadata) {
        if (!data || data.length === 0) {
            return '';
        }

        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');

        const csvRows = data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Escape CSV values
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        );

        return [csvHeaders, ...csvRows].join('\n');
    }

    /**
     * Brex Data Team Validated Analysis Methods
     */

    async getCustomerEditionAnalysis(inputs = {}) {
        const {
            startDate = null,
            endDate = null,
            editionFilter = null,
            outputFormat = 'json'
        } = inputs;

        return await this.executeValidatedQuery('customer_edition_analysis', {
            start_date: startDate,
            end_date: endDate,
            edition_filter: editionFilter
        }, outputFormat);
    }

    async getCustomerOBSAnalysis(inputs = {}) {
        const {
            startDate = null,
            endDate = null,
            editionFilter = null,
            obsFilter = null,
            outputFormat = 'json'
        } = inputs;

        return await this.executeValidatedQuery('customer_obs_analysis', {
            start_date: startDate,
            end_date: endDate,
            edition_filter: editionFilter,
            obs_filter: obsFilter
        }, outputFormat);
    }

    async getCrossSellUpsellAnalysis(inputs = {}) {
        const {
            startDate = null,
            endDate = null,
            segmentFilter = null,
            scFilter = null,
            outputFormat = 'json'
        } = inputs;

        return await this.executeValidatedQuery('cross_sell_upsell_analysis', {
            start_date: startDate,
            end_date: endDate,
            segment_filter: segmentFilter,
            sc_filter: scFilter
        }, outputFormat);
    }

    async getSCCommissionAnalysis(inputs = {}) {
        const {
            startDate = null,
            repFilter = null,
            segmentFilter = null,
            outputFormat = 'json'
        } = inputs;

        return await this.executeValidatedQuery('sc_commission_analysis', {
            start_date: startDate,
            rep_filter: repFilter,
            segment_filter: segmentFilter
        }, outputFormat);
    }

    /**
     * Execute a validated query template with business rules and validation
     */
    async executeValidatedQuery(templateName, parameters = {}, outputFormat = 'json') {
        try {
            // Load the template
            const query = await this.loadQueryTemplate(templateName);

            // Apply business rules
            const processedQuery = await this.applyBusinessRules(query, parameters);

            // Substitute parameters
            const finalQuery = this.substituteParameters(processedQuery, parameters);

            // Execute via MCP
            const result = await this.executeViaMCP(finalQuery);

            // Validate results
            const validationResults = await this.validateQueryResults(templateName, result);

            // Format output with validation metadata
            const formattedResult = await this.formatOutput(result, outputFormat);

            return {
                ...formattedResult,
                queryMetadata: {
                    templateUsed: templateName,
                    parametersApplied: parameters,
                    businessRulesApplied: this.getAppliedRules(templateName),
                    validationResults: validationResults,
                    executedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                templateName,
                parameters,
                suggestion: this.getSuggestionForError(error.message)
            };
        }
    }

    /**
     * Validate query results against expected patterns
     */
    async validateQueryResults(templateName, results) {
        if (!this.validationPatterns || !this.validationPatterns[templateName]) {
            return { validated: false, reason: 'No validation patterns defined' };
        }

        const patterns = this.validationPatterns[templateName];
        const validationResults = {
            passed: [],
            failed: [],
            warnings: []
        };

        // Run data quality checks
        if (patterns.data_quality_checks) {
            for (const check of patterns.data_quality_checks) {
                try {
                    const passed = this.evaluateValidationRule(check, results);
                    if (passed) {
                        validationResults.passed.push(check.name);
                    } else {
                        validationResults.failed.push({
                            check: check.name,
                            message: check.message
                        });
                    }
                } catch (error) {
                    validationResults.warnings.push({
                        check: check.name,
                        warning: `Could not evaluate: ${error.message}`
                    });
                }
            }
        }

        return {
            validated: validationResults.failed.length === 0,
            results: validationResults,
            score: validationResults.passed.length / (validationResults.passed.length + validationResults.failed.length)
        };
    }

    /**
     * Get business rules that apply to a specific template
     */
    getAppliedRules(templateName) {
        if (!this.businessRules) return [];

        const appliedRules = [];

        // Core filters that apply to all queries
        if (this.businessRules.core_filters) {
            Object.keys(this.businessRules.core_filters).forEach(rule => {
                if (this.businessRules.core_filters[rule].always_apply) {
                    appliedRules.push(rule);
                }
            });
        }

        // Template-specific rules
        if (this.businessRules.edition_rules) {
            Object.keys(this.businessRules.edition_rules).forEach(rule => {
                const ruleConfig = this.businessRules.edition_rules[rule];
                if (ruleConfig.applies_to && ruleConfig.applies_to.includes(templateName)) {
                    appliedRules.push(rule);
                }
            });
        }

        return appliedRules;
    }

    /**
     * Provide helpful suggestions for common errors
     */
    getSuggestionForError(errorMessage) {
        if (errorMessage.includes('template') && errorMessage.includes('not found')) {
            return 'Check available templates: customer_edition_analysis, customer_obs_analysis, cross_sell_upsell_analysis, sc_commission_analysis';
        }

        if (errorMessage.includes('parameter')) {
            return 'Check parameter format. Use YYYY-MM-DD for dates, exact strings for filters';
        }

        if (errorMessage.includes('MCP')) {
            return 'Check Snowflake MCP connection and credentials';
        }

        return 'Check the error details and query parameters';
    }

    /**
     * Get available analysis templates
     */
    async getAvailableTemplates() {
        try {
            const files = await fs.readdir(this.basePath);

            // Get descriptions for each template
            const templates = [];
            for (const file of files) {
                if (file.endsWith('.sql')) {
                    templates.push({
                        name: path.basename(file, '.sql'),
                        description: await this.getTemplateDescription(file)
                    });
                }
            }

            return {
                success: true,
                templates: templates,
                knowledgeBase: {
                    businessRulesLoaded: !!this.businessRules,
                    tableDefinitionsLoaded: !!this.tableDefinitions,
                    validationPatternsLoaded: !!this.validationPatterns
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get template description from SQL comments
     */
    async getTemplateDescription(filename) {
        try {
            const templatePath = path.join(this.basePath, filename);
            const content = await fs.readFile(templatePath, 'utf8');

            // Extract description from SQL comments
            const lines = content.split('\n').slice(0, 5);
            const descriptionLine = lines.find(line => line.includes('Purpose:'));

            if (descriptionLine) {
                return descriptionLine.replace(/^--\s*Purpose:\s*/, '').trim();
            }

            return 'Brex Data Team validated analysis pattern';
        } catch (error) {
                return 'Template description unavailable';
        }
    }

    /**
     * Evaluate a validation rule against query results
     */
    evaluateValidationRule(check, results) {
        // Basic validation rule evaluation
        // In a full implementation, this would parse and evaluate the rule
        // For now, return true for basic data structure checks

        if (!results || !results.data) {
            return false;
        }

        if (check.name === 'total_customers_positive') {
            return Array.isArray(results.data) && results.data.length > 0;
        }

        if (check.name === 'revenue_positive') {
            return results.data.some(row =>
                (row.saas_revenue && row.saas_revenue > 0) ||
                (row.net_revenue && row.net_revenue > 0)
            );
        }

        // Default to true for now - in production, implement full rule parsing
        return true;
    }
}

module.exports = { SnowflakeRetrievalSkill };