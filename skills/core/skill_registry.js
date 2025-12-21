/**
 * Skill Registry
 *
 * Central registry for all skills in the multi-agent system.
 * Handles skill registration, discovery, and orchestration.
 */

class SkillRegistry {
    constructor() {
        this.skills = new Map();
        this.skillCategories = new Map();
        this.logger = console; // Will be replaced with proper logger
    }

    /**
     * Register a skill in the registry
     * @param {BaseSkill} skill - Skill instance to register
     * @param {string} category - Skill category (e.g., 'data-sources', 'analysis', 'output')
     */
    register(skill, category = 'general') {
        if (!skill || !skill.name) {
            throw new Error('Invalid skill: must have a name property');
        }

        // Check for duplicate skill names
        if (this.skills.has(skill.name)) {
            throw new Error(`Skill '${skill.name}' is already registered`);
        }

        // Register skill
        this.skills.set(skill.name, skill);

        // Add to category
        if (!this.skillCategories.has(category)) {
            this.skillCategories.set(category, new Set());
        }
        this.skillCategories.get(category).add(skill.name);

        this.logger.info(`Registered skill: ${skill.name} in category: ${category}`);
    }

    /**
     * Get a skill by name
     * @param {string} skillName - Name of the skill to retrieve
     * @returns {BaseSkill} Skill instance
     */
    getSkill(skillName) {
        const skill = this.skills.get(skillName);
        if (!skill) {
            throw new Error(`Skill '${skillName}' not found in registry`);
        }
        return skill;
    }

    /**
     * Find skills by capability
     * @param {string} capability - Capability to search for
     * @returns {Array<BaseSkill>} Array of skills that can handle the capability
     */
    findSkillsByCapability(capability) {
        const matchingSkills = [];

        for (const skill of this.skills.values()) {
            if (skill.canHandle(capability)) {
                matchingSkills.push(skill);
            }
        }

        return matchingSkills;
    }

    /**
     * Get skills by category
     * @param {string} category - Category name
     * @returns {Array<BaseSkill>} Array of skills in the category
     */
    getSkillsByCategory(category) {
        const skillNames = this.skillCategories.get(category);
        if (!skillNames) {
            return [];
        }

        return Array.from(skillNames).map(name => this.skills.get(name));
    }

    /**
     * List all registered skills
     * @returns {Array<Object>} Array of skill information objects
     */
    listSkills() {
        return Array.from(this.skills.values()).map(skill => skill.getInfo());
    }

    /**
     * List all categories
     * @returns {Array<string>} Array of category names
     */
    listCategories() {
        return Array.from(this.skillCategories.keys());
    }

    /**
     * Execute a skill by name
     * @param {string} skillName - Name of skill to execute
     * @param {Object} params - Parameters for skill execution
     * @param {Object} context - Execution context
     * @returns {Promise<Object>} Skill execution result
     */
    async executeSkill(skillName, params = {}, context = {}) {
        const skill = this.getSkill(skillName);

        // Add registry context
        const enhancedContext = {
            ...context,
            registry: this,
            executedAt: new Date().toISOString(),
            skillRegistry: {
                availableSkills: this.listSkills().map(s => s.name),
                category: this.getCategoryForSkill(skillName)
            }
        };

        return await skill.execute(params, enhancedContext);
    }

    /**
     * Get category for a specific skill
     * @param {string} skillName - Name of the skill
     * @returns {string|null} Category name or null if not found
     */
    getCategoryForSkill(skillName) {
        for (const [category, skillNames] of this.skillCategories) {
            if (skillNames.has(skillName)) {
                return category;
            }
        }
        return null;
    }

    /**
     * Health check - verify all skills are operational
     * @returns {Object} Health status of all skills
     */
    async healthCheck() {
        const healthStatus = {
            overall: 'healthy',
            skills: {},
            timestamp: new Date().toISOString()
        };

        for (const [skillName, skill] of this.skills) {
            try {
                // Basic health check - verify skill has required methods
                if (typeof skill.execute === 'function' &&
                    typeof skill.performSkill === 'function') {
                    healthStatus.skills[skillName] = 'healthy';
                } else {
                    healthStatus.skills[skillName] = 'unhealthy - missing required methods';
                    healthStatus.overall = 'degraded';
                }
            } catch (error) {
                healthStatus.skills[skillName] = `unhealthy - ${error.message}`;
                healthStatus.overall = 'degraded';
            }
        }

        return healthStatus;
    }

    /**
     * Unregister a skill
     * @param {string} skillName - Name of skill to unregister
     */
    unregister(skillName) {
        if (!this.skills.has(skillName)) {
            throw new Error(`Skill '${skillName}' is not registered`);
        }

        // Remove from skills
        this.skills.delete(skillName);

        // Remove from categories
        for (const skillNames of this.skillCategories.values()) {
            skillNames.delete(skillName);
        }

        this.logger.info(`Unregistered skill: ${skillName}`);
    }
}

// Global registry instance
const globalRegistry = new SkillRegistry();

module.exports = { SkillRegistry, globalRegistry };