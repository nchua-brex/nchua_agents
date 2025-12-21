/**
 * Test suite for Brex Color and Visual Guidelines in BrandingSkill
 */

const { BrandingSkill } = require('./branding_skill');

function testColorGuidelines() {
    console.log('🎨 Testing Brex Color and Visual Guidelines...\n');

    const skill = new BrandingSkill();
    let tests = 0;
    let passed = 0;

    function test(description, testFn) {
        tests++;
        try {
            const result = testFn();
            if (result) {
                console.log(`✅ ${description}`);
                passed++;
            } else {
                console.log(`❌ ${description} - Test failed`);
            }
        } catch (error) {
            console.log(`❌ ${description} - Error: ${error.message}`);
        }
    }

    // Test color palette validation
    console.log('🎯 Testing Color Palette Validation...');

    test('Approved Brex colors are recognized', () => {
        const validColors = [
            { hex: '#212121', usage: 'text' }, // Ink
            { hex: '#FF7028', usage: 'cta' },  // Orange
            { hex: '#FFFFFF', usage: 'background' }, // White
            { hex: '#F4F4F4', usage: 'background' }  // Gray
        ];

        const validation = skill.validateColorUsage(validColors);
        return validation.valid === true && validation.critical.length === 0;
    });

    test('Invalid colors are rejected', () => {
        const invalidColors = [
            { hex: '#FF0000', usage: 'text' }, // Red (not in palette)
            { hex: '#00FF00', usage: 'background' } // Green (not in palette)
        ];

        const validation = skill.validateColorUsage(invalidColors);
        return validation.valid === false && validation.critical.length === 2;
    });

    test('Orange text on dark background is prevented', () => {
        const problematicColors = [
            {
                hex: '#FF7028',
                usage: 'text',
                background: { hex: '#212121' } // Orange text on Ink background
            }
        ];

        const validation = skill.validateColorUsage(problematicColors);
        return validation.valid === false &&
               validation.critical.some(c => c.message.includes("Orange text on top of dark background"));
    });

    test('Deep Ink on Ink background is prevented', () => {
        const problematicColors = [
            {
                hex: '#111111',
                usage: 'text',
                background: { hex: '#212121' } // Deep Ink on Ink
            }
        ];

        const validation = skill.validateColorUsage(problematicColors);
        return validation.valid === false &&
               validation.critical.some(c => c.message.includes("Deep Ink"));
    });

    // Test gradient validations
    console.log('\n🌈 Testing Gradient Guidelines...');

    test('Future Light gradient colors are loaded', () => {
        return skill.colorGuidelines.gradients.futureLight.colors.length === 2 &&
               skill.colorGuidelines.gradients.futureLight.colors.includes('#FFBC96') &&
               skill.colorGuidelines.gradients.futureLight.colors.includes('#91ECEA');
    });

    test('Future Dark gradient colors are loaded', () => {
        return skill.colorGuidelines.gradients.futureDark.colors.length === 2 &&
               skill.colorGuidelines.gradients.futureDark.colors.includes('#4BB4B1') &&
               skill.colorGuidelines.gradients.futureDark.colors.includes('#E8905E');
    });

    test('Secondary gradient colors are loaded', () => {
        return skill.colorGuidelines.secondary.blue.colors.includes('#1F374F') &&
               skill.colorGuidelines.secondary.blue.colors.includes('#0F1619') &&
               skill.colorGuidelines.secondary.softOrange.colors.includes('#F3EEEB') &&
               skill.colorGuidelines.secondary.softOrange.colors.includes('#F7D4C0');
    });

    // Test typography guidelines
    console.log('\n📝 Testing Typography Guidelines...');

    test('Primary font Inter is configured', () => {
        return skill.typography.primary.name === 'Inter' &&
               skill.typography.primary.variants.interTight === 'Used in Brand' &&
               skill.typography.primary.variants.interV === 'Used across our Product';
    });

    test('Secondary fonts are configured', () => {
        return skill.typography.secondary.flecha.name === 'Flecha S' &&
               skill.typography.secondary.spaceMono.name === 'Space Mono';
    });

    test('Typography guidance provides comprehensive recommendations', () => {
        const guidance = skill.getTypographyGuidance('product');
        return guidance.primary &&
               guidance.usage &&
               guidance.casing &&
               guidance.accessibility;
    });

    // Test mode guidelines
    console.log('\n🌓 Testing Dark/Light Mode Guidelines...');

    test('Dark mode objectives are defined', () => {
        return skill.modeGuidelines.darkMode.objectives.length === 3 &&
               skill.modeGuidelines.darkMode.objectives.includes('Challenge the status quo & provoke our audience with a new perspective');
    });

    test('Light mode objectives are defined', () => {
        return skill.modeGuidelines.lightMode.objectives.length === 3 &&
               skill.modeGuidelines.lightMode.objectives.includes('Educate and engage our audience on a concept or product');
    });

    test('Mode guidance recommends dark mode for product launches', () => {
        const guidance = skill.getModeGuidance('launch a product that brings about a new way');
        return guidance.when && guidance.objectives &&
               guidance.objectives.includes('Launch a product that brings about a new and better way');
    });

    test('Mode guidance recommends light mode for educational content', () => {
        const guidance = skill.getModeGuidance('educate customers about our features');
        return guidance.when && guidance.objectives &&
               guidance.objectives.includes('Educate and engage our audience on a concept or product');
    });

    // Test color recommendations
    console.log('\n🎯 Testing Color Recommendations...');

    test('Marketing context provides appropriate color recommendations', () => {
        const recommendations = skill.getColorRecommendations('marketing');
        return recommendations.length > 0 &&
               recommendations[0].type === 'palette_suggestion' &&
               recommendations[0].colors.some(c => c.color === '#212121'); // Ink for headlines
    });

    test('Product context provides accessibility-focused recommendations', () => {
        const recommendations = skill.getColorRecommendations('product');
        return recommendations.length > 0 &&
               recommendations[0].message.includes('accessibility');
    });

    test('Presentation context provides mode selection guidance', () => {
        const recommendations = skill.getColorRecommendations('presentation');
        return recommendations.length > 0 &&
               recommendations[0].type === 'mode_suggestion';
    });

    // Test color restrictions
    console.log('\n🚫 Testing Color Restrictions...');

    test('Color restrictions are properly loaded', () => {
        return skill.colorRestrictions.length === 8 &&
               skill.colorRestrictions.some(r => r.rule.includes('Orange text on top of dark background'));
    });

    test('Orange usage limits are enforced', () => {
        const testColors = [{ hex: '#FF7028', usage: 'body_text', context: 'general' }];
        const validation = skill.validateColorUsage(testColors);
        return validation.warnings.some(w => w.message.includes('Orange should be used sparingly'));
    });

    // Test integration with existing functionality
    console.log('\n🔗 Testing Integration with Existing Features...');

    test('Enhanced branding skill maintains existing capabilities', () => {
        return skill.capabilities.includes('brex_brand_voice_application') &&
               skill.capabilities.includes('color_palette_validation') &&
               skill.capabilities.includes('typography_guidance') &&
               skill.capabilities.includes('dark_light_mode_recommendations');
    });

    test('Color validation integrates with full skill execution', () => {
        const testInput = {
            content: 'Create budget',
            contentType: 'button',
            context: 'marketing',
            colors: [{ hex: '#FF7028', usage: 'cta' }]
        };

        return skill.execute(testInput).then(result => {
            return result.success &&
                   result.branded.colorValidation &&
                   result.branded.colorValidation.valid;
        });
    });

    // Results
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`Total Tests: ${tests}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${tests - passed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / tests) * 100)}%`);

    if (passed === tests) {
        console.log('\n🎉 All color and visual guideline tests passed!');
        console.log('🎨 Brex brand color system is fully integrated and functional.');
    } else {
        console.log(`\n⚠️ ${tests - passed} test(s) failed. Please review implementation.`);
    }

    return { total: tests, passed };
}

// Run the tests if this file is executed directly
if (require.main === module) {
    testColorGuidelines();
}

module.exports = { testColorGuidelines };