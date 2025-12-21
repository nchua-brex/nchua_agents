#!/usr/bin/env node

/**
 * Test Script for Updated SnowflakeRetrievalSkill
 *
 * Tests the integration with Brex Data Team reference queries and business rules.
 */

const { SnowflakeRetrievalSkill } = require('./data-sources/snowflake_retrieval');
const { SkillRegistry } = require('./core/skill_registry');

async function testReferenceQueryIntegration() {
    console.log('🧪 Testing Snowflake Skill with Reference Queries\n');

    try {
        // Initialize the updated skill
        const snowflakeSkill = new SnowflakeRetrievalSkill();
        console.log('✅ SnowflakeRetrievalSkill initialized\n');

        // Wait for knowledge base to load
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 1: Get Available Templates
        console.log('🔍 Test 1: Available Templates');
        const templatesResult = await snowflakeSkill.getAvailableTemplates();
        console.log('Templates Result:', JSON.stringify(templatesResult, null, 2));

        // Test 2: Customer Edition Analysis (using your reference query)
        console.log('\n🔍 Test 2: Customer Edition Analysis');
        const editionResult = await snowflakeSkill.getCustomerEditionAnalysis({
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            outputFormat: 'json'
        });
        console.log('Edition Analysis Result:', JSON.stringify(editionResult, null, 2));

        // Test 3: Customer OBS Analysis
        console.log('\n🔍 Test 3: Customer OBS Analysis');
        const obsResult = await snowflakeSkill.getCustomerOBSAnalysis({
            obsFilter: 'Mid-Market',
            outputFormat: 'json'
        });
        console.log('OBS Analysis Result:', JSON.stringify(obsResult, null, 2));

        // Test 4: Cross-sell vs Upsell Analysis
        console.log('\n🔍 Test 4: Cross-sell vs Upsell Analysis');
        const crossSellResult = await snowflakeSkill.getCrossSellUpsellAnalysis({
            segmentFilter: 'MM',
            outputFormat: 'json'
        });
        console.log('Cross-sell Analysis Result:', JSON.stringify(crossSellResult, null, 2));

        // Test 5: Solutions Consultant Commission Analysis
        console.log('\n🔍 Test 5: SC Commission Analysis');
        const scResult = await snowflakeSkill.getSCCommissionAnalysis({
            startDate: '2025-02-01',
            outputFormat: 'json'
        });
        console.log('SC Commission Result:', JSON.stringify(scResult, null, 2));

        console.log('\n✅ All tests completed');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Test business rules and knowledge base loading
async function testKnowledgeBase() {
    console.log('\n📚 Testing Knowledge Base Loading\n');

    try {
        const skill = new SnowflakeRetrievalSkill();

        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test knowledge base access
        console.log('Business Rules Loaded:', !!skill.businessRules);
        console.log('Table Definitions Loaded:', !!skill.tableDefinitions);
        console.log('Validation Patterns Loaded:', !!skill.validationPatterns);

        // Test rule application
        if (skill.businessRules) {
            console.log('\nCore Filters Available:');
            console.log(Object.keys(skill.businessRules.core_filters || {}));
        }

        // Test template availability
        const templatesDir = require('fs').readdirSync('./data-sources/templates/');
        console.log('\nAvailable Templates:');
        templatesDir.forEach(file => {
            if (file.endsWith('.sql')) {
                console.log(`- ${file}`);
            }
        });

    } catch (error) {
        console.error('❌ Knowledge base test failed:', error.message);
    }
}

// Test skill registration
async function testSkillRegistry() {
    console.log('\n📋 Testing Skill Registration\n');

    try {
        const registry = new SkillRegistry();
        const skill = new SnowflakeRetrievalSkill();

        // Register the updated skill
        registry.register(skill, 'data-sources');
        console.log('✅ Skill registered successfully');

        // Test skill capabilities
        const availableSkills = registry.getAvailableSkills();
        console.log('Available Skills:', availableSkills.map(s => s.name));

        // Test skill capabilities
        const snowflakeCapabilities = skill.capabilities;
        console.log('Snowflake Skill Capabilities:', snowflakeCapabilities);

    } catch (error) {
        console.error('❌ Registry test failed:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    await testKnowledgeBase();
    await testSkillRegistry();
    await testReferenceQueryIntegration();
}

// Command line interface
if (require.main === module) {
    const command = process.argv[2] || 'all';

    switch (command) {
        case 'queries':
            testReferenceQueryIntegration();
            break;
        case 'knowledge':
            testKnowledgeBase();
            break;
        case 'registry':
            testSkillRegistry();
            break;
        case 'all':
        default:
            runAllTests();
            break;
    }
}

module.exports = {
    testReferenceQueryIntegration,
    testKnowledgeBase,
    testSkillRegistry
};