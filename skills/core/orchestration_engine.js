/**
 * Skill Orchestration Engine
 *
 * Coordinates multiple skills to complete complex business workflows.
 * Supports conditional flows, data passing between skills, and error handling.
 */

const fs = require('fs').promises;
const path = require('path');
const { SkillRegistry } = require('./skill_registry');

class SkillOrchestrationEngine {
    constructor() {
        this.registry = new SkillRegistry();
        this.workflows = new Map();
        this.executionHistory = [];
    }

    /**
     * Register a business workflow that chains multiple skills
     * @param {string} workflowName - Unique workflow identifier
     * @param {Object} workflowDefinition - Workflow configuration
     */
    registerWorkflow(workflowName, workflowDefinition) {
        this.workflows.set(workflowName, {
            name: workflowName,
            description: workflowDefinition.description,
            steps: workflowDefinition.steps,
            inputs: workflowDefinition.inputs || [],
            outputs: workflowDefinition.outputs || [],
            errorHandling: workflowDefinition.errorHandling || 'fail_fast'
        });
    }

    /**
     * Execute a registered workflow
     * @param {string} workflowName - Workflow to execute
     * @param {Object} inputs - Initial workflow inputs
     * @param {Object} options - Execution options
     */
    async executeWorkflow(workflowName, inputs = {}, options = {}) {
        const workflow = this.workflows.get(workflowName);
        if (!workflow) {
            throw new Error(`Workflow '${workflowName}' not found`);
        }

        const executionId = `${workflowName}_${Date.now()}`;
        const execution = {
            id: executionId,
            workflow: workflowName,
            startTime: new Date(),
            status: 'running',
            inputs,
            outputs: {},
            steps: [],
            errors: []
        };

        this.executionHistory.push(execution);

        try {
            console.log(`🚀 Starting workflow: ${workflowName}`);

            let workflowData = { ...inputs };

            for (let i = 0; i < workflow.steps.length; i++) {
                const step = workflow.steps[i];
                const stepExecution = await this._executeStep(step, workflowData, execution, options);

                execution.steps.push(stepExecution);

                if (stepExecution.status === 'failed') {
                    if (workflow.errorHandling === 'fail_fast') {
                        throw new Error(`Step ${step.name} failed: ${stepExecution.error}`);
                    } else if (workflow.errorHandling === 'continue') {
                        console.warn(`⚠️ Step ${step.name} failed but continuing: ${stepExecution.error}`);
                        continue;
                    }
                }

                // Merge step outputs into workflow data
                if (stepExecution.outputs) {
                    workflowData = { ...workflowData, ...stepExecution.outputs };
                }
            }

            execution.status = 'completed';
            execution.endTime = new Date();
            execution.outputs = workflowData;

            console.log(`✅ Workflow completed: ${workflowName}`);
            return execution;

        } catch (error) {
            execution.status = 'failed';
            execution.endTime = new Date();
            execution.errors.push(error.message);

            console.error(`❌ Workflow failed: ${workflowName}`, error);
            throw error;
        }
    }

    /**
     * Execute a single workflow step
     * @private
     */
    async _executeStep(step, workflowData, execution, options) {
        const stepExecution = {
            name: step.name,
            skillName: step.skill,
            startTime: new Date(),
            status: 'running',
            inputs: {},
            outputs: {},
            error: null
        };

        try {
            console.log(`🔧 Executing step: ${step.name} (${step.skill})`);

            // Prepare step inputs
            const stepInputs = this._prepareStepInputs(step, workflowData);
            stepExecution.inputs = stepInputs;

            // Get the skill
            const skill = this.registry.getSkill(step.skill);
            if (!skill) {
                throw new Error(`Skill '${step.skill}' not found in registry`);
            }

            // Execute the skill method
            const methodName = step.method || 'execute';
            if (typeof skill[methodName] !== 'function') {
                throw new Error(`Method '${methodName}' not found on skill '${step.skill}'`);
            }

            const result = await skill[methodName](stepInputs, options);

            stepExecution.outputs = result;
            stepExecution.status = 'completed';
            stepExecution.endTime = new Date();

            // Apply step transformations if defined
            if (step.transformOutput) {
                stepExecution.outputs = step.transformOutput(result, workflowData);
            }

            return stepExecution;

        } catch (error) {
            stepExecution.status = 'failed';
            stepExecution.error = error.message;
            stepExecution.endTime = new Date();
            return stepExecution;
        }
    }

    /**
     * Prepare inputs for a workflow step
     * @private
     */
    _prepareStepInputs(step, workflowData) {
        const inputs = {};

        if (step.inputs) {
            for (const [inputKey, inputConfig] of Object.entries(step.inputs)) {
                if (typeof inputConfig === 'string') {
                    // Simple mapping: input from workflow data
                    inputs[inputKey] = workflowData[inputConfig];
                } else if (typeof inputConfig === 'object') {
                    // Complex mapping with transformations
                    if (inputConfig.source) {
                        inputs[inputKey] = workflowData[inputConfig.source];
                    } else if (inputConfig.value) {
                        inputs[inputKey] = inputConfig.value;
                    }

                    // Apply transformations
                    if (inputConfig.transform && typeof inputConfig.transform === 'function') {
                        inputs[inputKey] = inputConfig.transform(inputs[inputKey], workflowData);
                    }
                }
            }
        }

        return inputs;
    }

    /**
     * Load workflows from configuration files
     */
    async loadWorkflowsFromDirectory(workflowDir) {
        try {
            const files = await fs.readdir(workflowDir);
            const workflowFiles = files.filter(f => f.endsWith('.json') || f.endsWith('.js'));

            for (const file of workflowFiles) {
                const filePath = path.join(workflowDir, file);

                try {
                    let workflowConfig;
                    if (file.endsWith('.json')) {
                        const content = await fs.readFile(filePath, 'utf8');
                        workflowConfig = JSON.parse(content);
                    } else {
                        // JavaScript workflow file
                        workflowConfig = require(filePath);
                    }

                    if (workflowConfig.workflows) {
                        // Multiple workflows in one file
                        for (const [name, definition] of Object.entries(workflowConfig.workflows)) {
                            this.registerWorkflow(name, definition);
                        }
                    } else {
                        // Single workflow
                        const name = workflowConfig.name || path.basename(file, path.extname(file));
                        this.registerWorkflow(name, workflowConfig);
                    }

                    console.log(`📋 Loaded workflow(s) from: ${file}`);
                } catch (error) {
                    console.warn(`⚠️ Failed to load workflow from ${file}:`, error.message);
                }
            }
        } catch (error) {
            console.warn(`⚠️ Could not read workflow directory ${workflowDir}:`, error.message);
        }
    }

    /**
     * Get available workflows
     */
    getAvailableWorkflows() {
        return Array.from(this.workflows.entries()).map(([name, workflow]) => ({
            name,
            description: workflow.description,
            inputs: workflow.inputs,
            outputs: workflow.outputs,
            steps: workflow.steps.length
        }));
    }

    /**
     * Get execution history
     */
    getExecutionHistory(limit = 10) {
        return this.executionHistory.slice(-limit);
    }

    /**
     * Clear execution history
     */
    clearHistory() {
        this.executionHistory = [];
    }
}

// Pre-defined business workflow templates
const BusinessWorkflows = {
    // Customer Analysis Pipeline
    customer_revenue_analysis: {
        description: "Complete customer revenue analysis with territory insights",
        inputs: ['territory_filter', 'date_range'],
        outputs: ['revenue_summary', 'territory_performance', 'recommendations'],
        steps: [
            {
                name: 'fetch_customer_data',
                skill: 'SnowflakeRetrievalSkill',
                method: 'getCustomerRevenue',
                inputs: {
                    territory: 'territory_filter',
                    dateRange: 'date_range'
                }
            },
            {
                name: 'analyze_hex_dashboards',
                skill: 'HexDashboardAnalysisSkill',
                method: 'analyzeDashboard',
                inputs: {
                    dashboardType: { value: 'revenue' }
                }
            },
            {
                name: 'generate_insights',
                skill: 'SnowflakeRetrievalSkill',
                method: 'getTerritoryPerformance',
                inputs: {
                    customerData: 'customer_data'
                }
            }
        ]
    },

    // Spreadsheet Analysis Pipeline
    spreadsheet_knowledge_extraction: {
        description: "Extract business knowledge from Google Drive spreadsheets",
        inputs: ['spreadsheet_urls'],
        outputs: ['extracted_knowledge', 'calculation_patterns', 'workflows'],
        steps: [
            {
                name: 'analyze_spreadsheets',
                skill: 'GoogleDriveSpreadsheetSkill',
                method: 'analyzeSpreadsheet',
                inputs: {
                    urls: 'spreadsheet_urls'
                }
            },
            {
                name: 'cross_reference_hex',
                skill: 'HexDashboardAnalysisSkill',
                method: 'findSimilarPatterns',
                inputs: {
                    patterns: 'calculation_patterns'
                }
            }
        ]
    }
};

module.exports = {
    SkillOrchestrationEngine,
    BusinessWorkflows
};