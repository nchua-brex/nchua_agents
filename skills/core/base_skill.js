/**
 * Base Skill Class
 *
 * Foundation for all skills in the multi-agent system.
 * Provides common functionality, error handling, and skill lifecycle management.
 */

class BaseSkill {
    constructor(name, description, capabilities = []) {
        this.name = name;
        this.description = description;
        this.capabilities = capabilities;
        this.metadata = {
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            lastUsed: null,
            usageCount: 0
        };

        // Logging setup
        this.logger = console; // Will be replaced with proper logger
    }

    /**
     * Execute the skill with given parameters
     * @param {Object} params - Skill-specific parameters
     * @param {Object} context - Execution context from agent
     * @returns {Promise<Object>} Skill execution result
     */
    async execute(params = {}, context = {}) {
        this.logger.info(`Executing skill: ${this.name}`);

        try {
            // Update usage metrics
            this.metadata.lastUsed = new Date().toISOString();
            this.metadata.usageCount++;

            // Validate parameters
            await this.validateParams(params);

            // Execute skill-specific logic
            const result = await this.performSkill(params, context);

            // Post-process result
            return await this.postProcess(result, params, context);

        } catch (error) {
            this.logger.error(`Skill ${this.name} execution failed:`, error);
            throw new SkillExecutionError(this.name, error.message);
        }
    }

    /**
     * Validate input parameters
     * Override in child classes for specific validation
     */
    async validateParams(params) {
        // Base validation - override in child classes
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters: must be an object');
        }
    }

    /**
     * Core skill execution logic
     * Must be implemented by child classes
     */
    async performSkill(params, context) {
        throw new Error(`performSkill method not implemented for skill: ${this.name}`);
    }

    /**
     * Post-process skill results
     * Can be overridden for specific post-processing needs
     */
    async postProcess(result, params, context) {
        return {
            skillName: this.name,
            executedAt: new Date().toISOString(),
            result: result,
            metadata: {
                processingTime: context.processingTime,
                parameters: params
            }
        };
    }

    /**
     * Get skill information
     */
    getInfo() {
        return {
            name: this.name,
            description: this.description,
            capabilities: this.capabilities,
            metadata: this.metadata
        };
    }

    /**
     * Check if skill can handle a specific capability
     */
    canHandle(capability) {
        return this.capabilities.includes(capability);
    }
}

/**
 * Custom error class for skill execution failures
 */
class SkillExecutionError extends Error {
    constructor(skillName, message) {
        super(`Skill '${skillName}' failed: ${message}`);
        this.name = 'SkillExecutionError';
        this.skillName = skillName;
    }
}

module.exports = { BaseSkill, SkillExecutionError };