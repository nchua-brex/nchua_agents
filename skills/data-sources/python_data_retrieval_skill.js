/**
 * Python Data Retrieval Skill
 *
 * Wraps the existing Python DataRetrievalAgent to make it available
 * as a Node.js skill in the new architecture.
 */

const { BaseSkill } = require('../core/base_skill');
const { PythonAgentBridge, ExistingAgentConfigs } = require('../bridges/python_bridge');

class PythonDataRetrievalSkill extends BaseSkill {
    constructor() {
        super('PythonDataRetrievalSkill', {
            description: 'Bridge to existing Python Data Retrieval Agent for Snowflake operations',
            capabilities: [
                'snowflake_query_execution',
                'customer_revenue_analysis',
                'territory_performance_metrics',
                'segment_analysis',
                'templated_business_queries'
            ],
            inputFormats: ['json'],
            outputFormats: ['json', 'csv', 'dataframe'],
            requiresAuth: true
        });

        this.bridge = new PythonAgentBridge();
        this.bridge.registerAgent('DataRetrievalAgent', ExistingAgentConfigs.DataRetrievalAgent);
    }

    /**
     * Test the Python agent connection and configuration
     */
    async test() {
        try {
            const result = await this.bridge.executeAgent('DataRetrievalAgent', {}, { timeout: 30000 });
            return {
                success: true,
                message: 'Python Data Retrieval Agent is working correctly',
                agentResult: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                suggestion: 'Check that the Python agent is properly set up and credentials are configured'
            };
        }
    }

    /**
     * Execute a territory analysis using the Python agent
     */
    async analyzeTerritory(inputs = {}) {
        const {
            territory = null,
            dateRange = null,
            metrics = ['revenue', 'customer_count'],
            outputFormat = 'json'
        } = inputs;

        try {
            const agentInputs = {
                command: 'territory',
                territory,
                'date-range': dateRange,
                metrics: metrics.join(','),
                'output-format': outputFormat
            };

            const result = await this.bridge.executeAgent('DataRetrievalAgent', agentInputs);

            return {
                success: true,
                data: result,
                metadata: {
                    territory,
                    dateRange,
                    metrics,
                    outputFormat,
                    executedBy: 'PythonDataRetrievalAgent'
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                inputs
            };
        }
    }

    /**
     * Get customer revenue data using the Python agent
     */
    async getCustomerRevenue(inputs = {}) {
        const {
            customerId = null,
            territory = null,
            dateRange = null,
            includeBreakdown = false,
            outputFormat = 'json'
        } = inputs;

        try {
            const agentInputs = {
                command: 'customer-revenue',
                'customer-id': customerId,
                territory,
                'date-range': dateRange,
                'include-breakdown': includeBreakdown,
                'output-format': outputFormat
            };

            const result = await this.bridge.executeAgent('DataRetrievalAgent', agentInputs);

            return {
                success: true,
                data: result,
                metadata: {
                    customerId,
                    territory,
                    dateRange,
                    includeBreakdown,
                    outputFormat,
                    executedBy: 'PythonDataRetrievalAgent'
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                inputs
            };
        }
    }

    /**
     * Execute a custom Snowflake query using the Python agent
     */
    async executeCustomQuery(inputs = {}) {
        const {
            query,
            parameters = {},
            outputFormat = 'json',
            limit = null
        } = inputs;

        if (!query) {
            return {
                success: false,
                error: 'Query is required for custom query execution'
            };
        }

        try {
            const agentInputs = {
                command: 'custom-query',
                query,
                parameters: JSON.stringify(parameters),
                'output-format': outputFormat,
                limit
            };

            const result = await this.bridge.executeAgent('DataRetrievalAgent', agentInputs);

            return {
                success: true,
                data: result,
                metadata: {
                    query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
                    parameters,
                    outputFormat,
                    limit,
                    executedBy: 'PythonDataRetrievalAgent'
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                inputs
            };
        }
    }

    /**
     * Get available query templates from the Python agent
     */
    async getAvailableTemplates() {
        try {
            const agentInputs = {
                command: 'list-templates'
            };

            const result = await this.bridge.executeAgent('DataRetrievalAgent', agentInputs);

            return {
                success: true,
                templates: result,
                metadata: {
                    executedBy: 'PythonDataRetrievalAgent'
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
     * Execute a pre-built query template
     */
    async executeTemplate(inputs = {}) {
        const {
            templateName,
            parameters = {},
            outputFormat = 'json'
        } = inputs;

        if (!templateName) {
            return {
                success: false,
                error: 'Template name is required'
            };
        }

        try {
            const agentInputs = {
                command: 'execute-template',
                template: templateName,
                parameters: JSON.stringify(parameters),
                'output-format': outputFormat
            };

            const result = await this.bridge.executeAgent('DataRetrievalAgent', agentInputs);

            return {
                success: true,
                data: result,
                metadata: {
                    templateName,
                    parameters,
                    outputFormat,
                    executedBy: 'PythonDataRetrievalAgent'
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                inputs
            };
        }
    }

    /**
     * Check the health and configuration of the Python agent
     */
    async healthCheck() {
        try {
            const agentStatus = await this.bridge.validateAgent('DataRetrievalAgent');

            return {
                success: agentStatus.valid,
                status: agentStatus.valid ? 'healthy' : 'unhealthy',
                details: agentStatus,
                metadata: {
                    bridgeType: 'PythonAgentBridge',
                    agentPath: 'agents/data_retrieval/main.py'
                }
            };

        } catch (error) {
            return {
                success: false,
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Clean up any temporary files or connections
     */
    async cleanup() {
        try {
            await this.bridge.cleanup();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = { PythonDataRetrievalSkill };