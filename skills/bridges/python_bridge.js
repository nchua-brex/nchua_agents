/**
 * Python-to-Node.js Bridge
 *
 * Allows Node.js skills to execute Python agents and integrate their results
 * into the skill-based workflow system.
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

class PythonAgentBridge {
    constructor(options = {}) {
        this.pythonPath = options.pythonPath || 'python';
        this.baseDir = options.baseDir || process.cwd();
        this.tempDir = options.tempDir || os.tmpdir();
        this.timeout = options.timeout || 300000; // 5 minutes default
        this.agents = new Map();
    }

    /**
     * Register a Python agent for use in Node.js skills
     * @param {string} agentName - Unique identifier for the agent
     * @param {Object} agentConfig - Agent configuration
     */
    registerAgent(agentName, agentConfig) {
        this.agents.set(agentName, {
            name: agentName,
            scriptPath: agentConfig.scriptPath,
            workingDir: agentConfig.workingDir || this.baseDir,
            environmentVars: agentConfig.environmentVars || {},
            requiresAuth: agentConfig.requiresAuth || false,
            inputFormat: agentConfig.inputFormat || 'json', // json, args, stdin
            outputFormat: agentConfig.outputFormat || 'json', // json, stdout, file
            ...agentConfig
        });
    }

    /**
     * Execute a registered Python agent
     * @param {string} agentName - Name of the registered agent
     * @param {Object} inputs - Inputs to pass to the Python agent
     * @param {Object} options - Execution options
     */
    async executeAgent(agentName, inputs = {}, options = {}) {
        const agent = this.agents.get(agentName);
        if (!agent) {
            throw new Error(`Python agent '${agentName}' not registered`);
        }

        const executionId = `${agentName}_${Date.now()}`;
        console.log(`🐍 Executing Python agent: ${agentName}`);

        try {
            // Prepare execution environment
            const env = {
                ...process.env,
                ...agent.environmentVars,
                PYTHON_BRIDGE_EXECUTION_ID: executionId
            };

            // Prepare inputs based on agent's expected format
            const preparedInputs = await this._prepareInputs(agent, inputs, executionId);

            // Execute the Python agent
            const result = await this._runPythonScript(
                agent.scriptPath,
                preparedInputs,
                {
                    cwd: agent.workingDir,
                    env,
                    timeout: options.timeout || this.timeout,
                    inputFormat: agent.inputFormat,
                    outputFormat: agent.outputFormat
                }
            );

            // Process the output based on agent's output format
            const processedResult = await this._processOutput(agent, result, executionId);

            console.log(`✅ Python agent completed: ${agentName}`);
            return processedResult;

        } catch (error) {
            console.error(`❌ Python agent failed: ${agentName}`, error.message);
            throw new Error(`Python agent '${agentName}' execution failed: ${error.message}`);
        }
    }

    /**
     * Prepare inputs for the Python agent based on its expected format
     * @private
     */
    async _prepareInputs(agent, inputs, executionId) {
        switch (agent.inputFormat) {
            case 'json':
                // Create a temporary JSON file with inputs
                const inputFile = path.join(this.tempDir, `${executionId}_input.json`);
                await fs.writeFile(inputFile, JSON.stringify(inputs, null, 2));
                return { inputFile };

            case 'args':
                // Convert inputs to command line arguments
                const args = [];
                for (const [key, value] of Object.entries(inputs)) {
                    args.push(`--${key}`);
                    if (value !== true) {
                        args.push(String(value));
                    }
                }
                return { args };

            case 'stdin':
                // Pass inputs via stdin
                return { stdin: JSON.stringify(inputs) };

            default:
                return inputs;
        }
    }

    /**
     * Execute the Python script with prepared inputs
     * @private
     */
    async _runPythonScript(scriptPath, preparedInputs, options) {
        return new Promise((resolve, reject) => {
            let command;
            let args = [];

            // Build command based on input format
            if (options.inputFormat === 'args') {
                command = this.pythonPath;
                args = [scriptPath, ...(preparedInputs.args || [])];
            } else if (options.inputFormat === 'json') {
                command = this.pythonPath;
                args = [scriptPath, '--input-file', preparedInputs.inputFile];
            } else {
                command = this.pythonPath;
                args = [scriptPath];
            }

            const child = spawn(command, args, {
                cwd: options.cwd,
                env: options.env,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Handle stdin input if needed
            if (options.inputFormat === 'stdin' && preparedInputs.stdin) {
                child.stdin.write(preparedInputs.stdin);
                child.stdin.end();
            }

            // Set timeout
            const timeout = setTimeout(() => {
                child.kill('SIGTERM');
                reject(new Error(`Python agent timed out after ${options.timeout}ms`));
            }, options.timeout);

            child.on('close', (code) => {
                clearTimeout(timeout);

                if (code === 0) {
                    resolve({ stdout, stderr, code });
                } else {
                    reject(new Error(`Python agent exited with code ${code}: ${stderr}`));
                }
            });

            child.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    /**
     * Process the output from the Python agent
     * @private
     */
    async _processOutput(agent, result, executionId) {
        switch (agent.outputFormat) {
            case 'json':
                try {
                    return JSON.parse(result.stdout);
                } catch (error) {
                    throw new Error(`Failed to parse JSON output: ${error.message}\nOutput: ${result.stdout}`);
                }

            case 'file':
                // Look for output file
                const outputFile = path.join(this.tempDir, `${executionId}_output.json`);
                try {
                    const content = await fs.readFile(outputFile, 'utf8');
                    return JSON.parse(content);
                } catch (error) {
                    throw new Error(`Failed to read output file: ${error.message}`);
                }

            case 'stdout':
            default:
                return {
                    stdout: result.stdout,
                    stderr: result.stderr,
                    success: result.code === 0
                };
        }
    }

    /**
     * Check if a Python agent is available and properly configured
     */
    async validateAgent(agentName) {
        const agent = this.agents.get(agentName);
        if (!agent) {
            return { valid: false, error: 'Agent not registered' };
        }

        try {
            // Check if script file exists
            const scriptPath = path.resolve(agent.workingDir, agent.scriptPath);
            await fs.access(scriptPath);

            // Try a simple test execution if the agent supports it
            if (agent.testCommand) {
                const result = await this._runPythonScript(
                    agent.scriptPath,
                    { args: agent.testCommand.split(' ').slice(1) },
                    {
                        cwd: agent.workingDir,
                        env: { ...process.env, ...agent.environmentVars },
                        timeout: 30000,
                        inputFormat: 'args',
                        outputFormat: agent.outputFormat
                    }
                );

                return { valid: true, testResult: result };
            }

            return { valid: true };

        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Get status of all registered agents
     */
    async getAgentStatus() {
        const status = {};

        for (const [name, agent] of this.agents.entries()) {
            status[name] = await this.validateAgent(name);
        }

        return status;
    }

    /**
     * Clean up temporary files
     */
    async cleanup() {
        try {
            // Remove temporary files created during execution
            const tempFiles = await fs.readdir(this.tempDir);
            const bridgeFiles = tempFiles.filter(f => f.includes('_input.json') || f.includes('_output.json'));

            for (const file of bridgeFiles) {
                try {
                    await fs.unlink(path.join(this.tempDir, file));
                } catch (error) {
                    // Ignore cleanup errors
                }
            }
        } catch (error) {
            console.warn('Warning: Could not clean up temporary files:', error.message);
        }
    }
}

// Configuration for your existing agents
const ExistingAgentConfigs = {
    DataRetrievalAgent: {
        scriptPath: '../agents/data_retrieval/main.py',
        workingDir: process.cwd(),
        inputFormat: 'args',
        outputFormat: 'json',
        testCommand: 'python main.py test',
        environmentVars: {
            PYTHONPATH: process.cwd()
        },
        requiresAuth: true
    },

    GranolaAgent: {
        scriptPath: 'agent.py',
        workingDir: process.cwd(),
        inputFormat: 'args',
        outputFormat: 'json',
        environmentVars: {
            PYTHONPATH: process.cwd()
        },
        requiresAuth: true
    }
};

module.exports = {
    PythonAgentBridge,
    ExistingAgentConfigs
};