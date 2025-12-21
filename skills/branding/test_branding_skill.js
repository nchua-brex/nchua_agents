/**
 * BrandingSkill Test Suite
 *
 * Comprehensive tests for the BrandingSkill to ensure proper functionality
 * of brand voice application, design system validation, and content generation.
 */

const { BrandingSkill } = require('./branding_skill');

class BrandingSkillTester {
    constructor() {
        this.brandingSkill = new BrandingSkill();
        this.testResults = [];
        this.passedTests = 0;
        this.failedTests = 0;
    }

    /**
     * Log test result
     */
    logTest(testName, passed, details = '') {
        const status = passed ? '✅' : '❌';
        const result = { testName, passed, details, status };
        this.testResults.push(result);

        if (passed) {
            this.passedTests++;
        } else {
            this.failedTests++;
        }

        console.log(`${status} ${testName}${details ? ' - ' + details : ''}`);
    }

    /**
     * Test basic skill initialization and properties
     */
    testInitialization() {
        console.log('\n🔧 Testing Skill Initialization...');

        try {
            this.logTest('Skill instance creation',
                this.brandingSkill instanceof BrandingSkill);

            this.logTest('Skill name property',
                this.brandingSkill.name === 'BrandingSkill');

            this.logTest('Skill description exists',
                typeof this.brandingSkill.description === 'string' && this.brandingSkill.description.length > 0);

            this.logTest('Brand traits loaded',
                Object.keys(this.brandingSkill.brandTraits).length === 5);

            this.logTest('Character limits loaded',
                Object.keys(this.brandingSkill.characterLimits).length > 0);

            this.logTest('Brex product names loaded',
                this.brandingSkill.brexProductNames && this.brandingSkill.brexProductNames.company === 'Brex');

        } catch (error) {
            this.logTest('Initialization', false, error.message);
        }
    }

    /**
     * Test brand trait scoring
     */
    testBrandTraitScoring() {
        console.log('\n🎯 Testing Brand Trait Scoring...');

        const testCases = [
            {
                content: 'Automate 70% of expense tasks with Brex — and get back to building.',
                trait: 'real',
                expectedMinScore: 3,
                description: 'Real trait with specific metrics'
            },
            {
                content: 'Building is hard. Banking doesn\'t have to be.',
                trait: 'gritty',
                expectedMinScore: 3,
                description: 'Gritty trait acknowledging challenges'
            },
            {
                content: 'Every transaction syncs to your ERP — no manual data entry, no reconciliation errors.',
                trait: 'relentless',
                expectedMinScore: 3,
                description: 'Relentless trait with precision'
            },
            {
                content: 'Thanks to Brex, you\'ll never have to do any manual finance tasks ever again.',
                trait: 'real',
                expectedMaxScore: 2,
                description: 'Real trait violation with absolutes'
            }
        ];

        testCases.forEach((testCase, index) => {
            try {
                const traitDefinition = this.brandingSkill.brandTraits[testCase.trait];
                const score = this.brandingSkill.scoreBrandTrait(testCase.content, testCase.trait, traitDefinition);

                if (testCase.expectedMinScore) {
                    this.logTest(`Brand trait scoring ${index + 1}`,
                        score.score >= testCase.expectedMinScore,
                        `${testCase.description} (score: ${score.score})`);
                } else if (testCase.expectedMaxScore) {
                    this.logTest(`Brand trait scoring ${index + 1}`,
                        score.score <= testCase.expectedMaxScore,
                        `${testCase.description} (score: ${score.score})`);
                }
            } catch (error) {
                this.logTest(`Brand trait scoring ${index + 1}`, false, error.message);
            }
        });
    }

    /**
     * Test forbidden phrase detection
     */
    testForbiddenPhrases() {
        console.log('\n🚫 Testing Forbidden Phrase Detection...');

        const testCases = [
            {
                content: 'Learn more about our product',
                shouldDetect: true,
                description: 'Forbidden CTA "Learn more"'
            },
            {
                content: 'Click here to get started',
                shouldDetect: true,
                description: 'Forbidden CTA "Click here"'
            },
            {
                content: 'Create budget',
                shouldDetect: false,
                description: 'Good CTA with verb + noun'
            },
            {
                content: 'This will be processed automatically',
                shouldDetect: true,
                description: 'Passive voice detection'
            }
        ];

        testCases.forEach((testCase, index) => {
            try {
                const result = this.brandingSkill.checkForbiddenPatterns(testCase.content);
                const hasViolations = result.violations.length > 0;

                this.logTest(`Forbidden phrase detection ${index + 1}`,
                    hasViolations === testCase.shouldDetect,
                    `${testCase.description} (violations: ${result.violations.length})`);
            } catch (error) {
                this.logTest(`Forbidden phrase detection ${index + 1}`, false, error.message);
            }
        });
    }

    /**
     * Test character limit validation
     */
    testCharacterLimits() {
        console.log('\n📏 Testing Character Limit Validation...');

        const testCases = [
            {
                content: 'Save',
                contentType: 'button',
                shouldPass: true,
                description: 'Button within limit (4/25 chars)'
            },
            {
                content: 'This button text is way too long for the design system',
                contentType: 'button',
                shouldPass: false,
                description: 'Button exceeds limit (55/25 chars)'
            },
            {
                content: 'Invalid input',
                contentType: 'fieldLabel',
                shouldPass: true,
                description: 'Field label within limit'
            },
            {
                content: 'This is a very long field label that exceeds the maximum character limit defined in the Metal Design System',
                contentType: 'fieldLabel',
                shouldPass: false,
                description: 'Field label exceeds limit'
            }
        ];

        testCases.forEach((testCase, index) => {
            try {
                const result = this.brandingSkill.validateCharacterLimits(testCase.content, testCase.contentType);

                this.logTest(`Character limit validation ${index + 1}`,
                    result.valid === testCase.shouldPass,
                    `${testCase.description} (${result.current}/${result.limit || 'N/A'} chars)`);
            } catch (error) {
                this.logTest(`Character limit validation ${index + 1}`, false, error.message);
            }
        });
    }

    /**
     * Test naming convention application
     */
    testNamingConventions() {
        console.log('\n🏷️ Testing Naming Convention Application...');

        const testCases = [
            {
                content: 'Use brex corporate card for expenses',
                expected: 'Use Brex corporate card for expenses',
                description: 'Corporate card naming'
            },
            {
                content: 'Contact brex support for help',
                expected: 'Contact Brex Support for help',
                description: 'Support naming exception'
            },
            {
                content: 'Try brex AI assistant',
                expected: 'Try Brex AI assistant',
                description: 'AI naming exception'
            }
        ];

        testCases.forEach((testCase, index) => {
            try {
                const result = this.brandingSkill.applyNamingConventions(testCase.content);

                this.logTest(`Naming convention ${index + 1}`,
                    result === testCase.expected,
                    `${testCase.description} ("${result}")`);
            } catch (error) {
                this.logTest(`Naming convention ${index + 1}`, false, error.message);
            }
        });
    }

    /**
     * Test full skill execution
     */
    async testSkillExecution() {
        console.log('\n🚀 Testing Full Skill Execution...');

        const testCases = [
            {
                inputs: {
                    content: 'Learn more',
                    contentType: 'button',
                    context: 'marketing',
                    audience: 'founders',
                    tone: 'professional',
                    outputFormat: 'json'
                },
                description: 'Marketing button for founders'
            },
            {
                inputs: {
                    content: 'Building is challenging but banking doesn\'t have to be',
                    contentType: 'general',
                    context: 'product',
                    audience: 'commercial',
                    tone: 'helpful',
                    outputFormat: 'markdown'
                },
                description: 'Product messaging for commercial audience'
            },
            {
                inputs: {
                    content: '',
                    contentType: 'button'
                },
                shouldFail: true,
                description: 'Empty content should fail'
            }
        ];

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            try {
                const result = await this.brandingSkill.execute(testCase.inputs);

                if (testCase.shouldFail) {
                    this.logTest(`Skill execution ${i + 1}`,
                        !result.success,
                        `${testCase.description} - Should fail but got success`);
                } else {
                    this.logTest(`Skill execution ${i + 1}`,
                        result.success === true,
                        `${testCase.description} - ${result.success ? 'Success' : result.error}`);

                    if (result.success) {
                        // Test result structure
                        this.logTest(`Result structure ${i + 1}`,
                            result.original && result.branded && result.analysis && result.validation,
                            'Has all required result properties');
                    }
                }
            } catch (error) {
                if (testCase.shouldFail) {
                    this.logTest(`Skill execution ${i + 1}`, true,
                        `${testCase.description} - Correctly failed with: ${error.message}`);
                } else {
                    this.logTest(`Skill execution ${i + 1}`, false,
                        `${testCase.description} - Unexpected error: ${error.message}`);
                }
            }
        }
    }

    /**
     * Test output formatting
     */
    async testOutputFormats() {
        console.log('\n📄 Testing Output Formats...');

        const baseInputs = {
            content: 'Automate 70% of expense tasks with Brex — and get back to building.',
            contentType: 'general',
            context: 'marketing',
            audience: 'founders'
        };

        const formats = ['json', 'text', 'markdown'];

        for (const format of formats) {
            try {
                const result = await this.brandingSkill.execute({
                    ...baseInputs,
                    outputFormat: format
                });

                this.logTest(`Output format ${format}`,
                    result.success === true,
                    `Successfully generated ${format} output`);

                // Verify format-specific properties
                if (format === 'text' && result.success) {
                    this.logTest(`Text format content`,
                        typeof result.content === 'string',
                        'Text format returns string content');
                } else if (format === 'markdown' && result.success) {
                    this.logTest(`Markdown format content`,
                        typeof result.content === 'string' && result.content.includes('#'),
                        'Markdown format returns formatted content');
                }

            } catch (error) {
                this.logTest(`Output format ${format}`, false, error.message);
            }
        }
    }

    /**
     * Test audience-specific voice guidance
     */
    testAudienceVoiceGuidance() {
        console.log('\n👥 Testing Audience Voice Guidance...');

        const audiences = ['founders', 'commercial', 'enterprise', 'general'];

        audiences.forEach(audience => {
            try {
                const guidance = this.brandingSkill.getAudienceVoiceGuidance(audience);

                this.logTest(`Voice guidance for ${audience}`,
                    guidance && guidance.emphasis && guidance.focus && guidance.language,
                    `Has all required guidance properties`);
            } catch (error) {
                this.logTest(`Voice guidance for ${audience}`, false, error.message);
            }
        });
    }

    /**
     * Test context tone guidance
     */
    testContextToneGuidance() {
        console.log('\n🎭 Testing Context Tone Guidance...');

        const contexts = [
            { context: 'marketing', tone: 'professional' },
            { context: 'product', tone: 'helpful' },
            { context: 'support', tone: 'urgent' },
            { context: 'error', tone: 'professional' }
        ];

        contexts.forEach(({ context, tone }) => {
            try {
                const guidance = this.brandingSkill.getContextToneGuidance(context, tone);

                this.logTest(`Tone guidance for ${context}/${tone}`,
                    typeof guidance === 'string' && guidance.length > 0,
                    `Returns meaningful guidance`);
            } catch (error) {
                this.logTest(`Tone guidance for ${context}/${tone}`, false, error.message);
            }
        });
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting BrandingSkill Test Suite...\n');

        const startTime = Date.now();

        // Run all test categories
        this.testInitialization();
        this.testBrandTraitScoring();
        this.testForbiddenPhrases();
        this.testCharacterLimits();
        this.testNamingConventions();
        await this.testSkillExecution();
        await this.testOutputFormats();
        this.testAudienceVoiceGuidance();
        this.testContextToneGuidance();

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Print summary
        console.log('\n📊 Test Results Summary');
        console.log('========================');
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`⏱️ Duration: ${duration}ms`);
        console.log(`📈 Success Rate: ${((this.passedTests / this.testResults.length) * 100).toFixed(1)}%`);

        // Show failed tests if any
        if (this.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(result => !result.passed)
                .forEach(result => {
                    console.log(`   - ${result.testName}: ${result.details}`);
                });
        }

        console.log('\n🎉 Test suite completed!');

        return {
            totalTests: this.testResults.length,
            passed: this.passedTests,
            failed: this.failedTests,
            duration,
            successRate: ((this.passedTests / this.testResults.length) * 100).toFixed(1),
            results: this.testResults
        };
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    (async () => {
        const tester = new BrandingSkillTester();
        await tester.runAllTests();
    })();
}

module.exports = { BrandingSkillTester };