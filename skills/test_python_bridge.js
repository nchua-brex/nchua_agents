#!/usr/bin/env node

/**
 * Test Script for Python Bridge Integration
 *
 * Tests the connection between Node.js skills and existing Python agents.
 */

const { PythonDataRetrievalSkill } = require('./data-sources/python_data_retrieval_skill');
const { SkillRegistry } = require('./core/skill_registry');

async function testPythonBridge() {
    console.log('🧪 Testing Python Bridge Integration\n');

    try {
        // Initialize the skill
        const dataSkill = new PythonDataRetrievalSkill();
        const registry = new SkillRegistry();

        // Register the skill
        registry.register(dataSkill, 'data-sources');
        console.log('✅ Python Data Retrieval Skill registered\n');

        // Test 1: Health Check
        console.log('🔍 Test 1: Health Check');
        const healthResult = await dataSkill.healthCheck();
        console.log('Health Check Result:', JSON.stringify(healthResult, null, 2));

        if (!healthResult.success) {
            console.log('⚠️  Health check failed - Python agent may not be properly configured');
            console.log('💡 Make sure you have run: python agents/data_retrieval/main.py test');
        }

        // Test 2: Basic Test
        console.log('\n🔍 Test 2: Basic Agent Test');
        const testResult = await dataSkill.test();
        console.log('Test Result:', JSON.stringify(testResult, null, 2));

        // Test 3: Get Available Templates (if agent supports it)
        console.log('\n🔍 Test 3: Get Available Templates');
        try {
            const templatesResult = await dataSkill.getAvailableTemplates();
            console.log('Templates Result:', JSON.stringify(templatesResult, null, 2));
        } catch (error) {
            console.log('Templates test skipped:', error.message);
        }

        // Test 4: Territory Analysis (if working)
        if (healthResult.success) {
            console.log('\n🔍 Test 4: Territory Analysis');
            const territoryResult = await dataSkill.analyzeTerritory({
                territory: 'test',
                metrics: ['revenue'],
                outputFormat: 'json'
            });
            console.log('Territory Result:', JSON.stringify(territoryResult, null, 2));
        }

        // Cleanup
        await dataSkill.cleanup();
        console.log('\n✅ All tests completed');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Test workflow orchestration with Python skills
async function testWorkflowIntegration() {
    console.log('\n🔗 Testing Workflow Integration\n');

    try {
        const { SkillOrchestrationEngine } = require('./core/orchestration_engine');
        const orchestrator = new SkillOrchestrationEngine();

        // Register skills
        const dataSkill = new PythonDataRetrievalSkill();
        orchestrator.registry.register(dataSkill, 'data-sources');

        // Define a simple workflow
        orchestrator.registerWorkflow('test_data_pipeline', {
            description: 'Test workflow using Python data agent',
            steps: [
                {
                    name: 'health_check',
                    skill: 'PythonDataRetrievalSkill',
                    method: 'healthCheck'
                },
                {
                    name: 'get_templates',
                    skill: 'PythonDataRetrievalSkill',
                    method: 'getAvailableTemplates'
                }
            ]
        });

        // Execute the workflow
        console.log('🚀 Executing test workflow...');
        const workflowResult = await orchestrator.executeWorkflow('test_data_pipeline');

        console.log('Workflow Result:', JSON.stringify(workflowResult, null, 2));

    } catch (error) {
        console.error('❌ Workflow test failed:', error.message);
    }
}

// Run tests
async function runAllTests() {
    await testPythonBridge();
    await testWorkflowIntegration();
}

// Command line interface
if (require.main === module) {
    const command = process.argv[2] || 'all';

    switch (command) {
        case 'bridge':
            testPythonBridge();
            break;
        case 'workflow':
            testWorkflowIntegration();
            break;
        case 'all':
        default:
            runAllTests();
            break;
    }
}

module.exports = {
    testPythonBridge,
    testWorkflowIntegration
};