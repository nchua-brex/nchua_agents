/**
 * Snowflake Data Retrieval Skill
 *
 * Extracted from the Python DataRetrievalAgent, this skill handles:
 * - Snowflake MCP integration
 * - Template-based query system
 * - Business logic application
 * - Multiple output formats
 */

const { BaseSkill } = require('../core/base_skill');

class SnowflakeRetrievalSkill extends BaseSkill {
    constructor() {
        super(
            'snowflake-retrieval',
            'Retrieve data from Snowflake using MCP integration with template-based queries',
            ['sql_query', 'data_export', 'business_analytics', 'customer_revenue', 'territory_analysis', 'segmentation']
        );

        // Configuration - will be loaded from config file
        this.config = {
            templates: {
                basePath: './skills/data-sources/templates'
            },
            businessRules: {
                // Default business rules applied to all queries
                excludeTestData: true,
                includeDateFilters: true,
                applySecurityFilters: true
            }
        };

        // MCP client - will be initialized when needed
        this.mcpClient = null;
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
        const fs = require('fs').promises;
        const path = require('path');

        const templatePath = path.join(this.config.templates.basePath, `${templateName}.sql`);

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

        // Apply default business rules from config
        const rules = this.config.businessRules;

        // Example business rule implementations
        if (rules.excludeTestData) {
            // Add filter to exclude test/demo data
            processedQuery = this.addWhereClause(processedQuery, "customer_type != 'test'");
        }

        if (rules.includeDateFilters && !parameters.skipDateFilters) {
            // Ensure queries have reasonable date bounds
            if (!processedQuery.toLowerCase().includes('date')) {
                // Add default date filter for performance
                processedQuery = this.addWhereClause(processedQuery, "date >= CURRENT_DATE - INTERVAL '2 years'");
            }
        }

        // Apply custom filters from parameters
        if (parameters.customFilters) {
            for (const filter of parameters.customFilters) {
                processedQuery = this.addWhereClause(processedQuery, filter);
            }
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
     * Pre-built query methods extracted from Python agent
     */

    async getCustomerRevenueData(startDate, endDate, segment = null, outputFormat = 'json') {
        return await this.execute({
            templateName: 'customer_revenue',
            parameters: {
                start_date: startDate,
                end_date: endDate,
                segment: segment
            },
            outputFormat: outputFormat
        });
    }

    async getTerritoryPerformance(scOwner = null, period = 'current_quarter', outputFormat = 'json') {
        return await this.execute({
            templateName: 'territory_performance',
            parameters: {
                sc_owner: scOwner,
                period: period
            },
            outputFormat: outputFormat
        });
    }

    async getSegmentationAnalysis(analysisType = 'current', outputFormat = 'json') {
        return await this.execute({
            templateName: 'segmentation_analysis',
            parameters: {
                analysis_type: analysisType
            },
            outputFormat: outputFormat
        });
    }
}

module.exports = SnowflakeRetrievalSkill;