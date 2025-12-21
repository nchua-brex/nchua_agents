/**
 * Example usage of the enhanced BrandingSkill with Brex Color Guidelines
 *
 * This demonstrates how to use the branding skill for various content types
 * while validating color choices and receiving design recommendations.
 */

const { BrandingSkill } = require('./branding_skill');

async function demonstrateColorUsage() {
    console.log('🎨 Brex Color Guidelines Integration Demo\n');

    const skill = new BrandingSkill();

    // Example 1: Marketing Campaign with Color Validation
    console.log('📊 Example 1: Marketing Campaign Button');
    console.log('=' .repeat(50));

    const marketingExample = await skill.execute({
        content: 'Start your free trial today',
        contentType: 'button',
        context: 'marketing',
        audience: 'founders',
        tone: 'professional',
        colors: [
            {
                hex: '#FF7028',
                usage: 'cta',
                context: 'marketing',
                background: { hex: '#FFFFFF' }
            }
        ]
    });

    console.log('Original:', marketingExample.original);
    console.log('Branded Content:', marketingExample.branded.content);
    console.log('Color Validation:', marketingExample.branded.colorValidation.valid ? '✅ Valid' : '❌ Invalid');

    if (marketingExample.branded.colorValidation.recommendations?.length > 0) {
        console.log('Recommendations:', marketingExample.branded.colorValidation.recommendations[0].message);
    }

    // Example 2: Product Interface with Invalid Color Combination
    console.log('\n🚀 Example 2: Product Interface Error Message');
    console.log('=' .repeat(50));

    const productExample = await skill.execute({
        content: 'Unable to process payment',
        contentType: 'feedback',
        context: 'product',
        audience: 'commercial',
        tone: 'urgent',
        colors: [
            {
                hex: '#FF7028',
                usage: 'text',
                context: 'product',
                background: { hex: '#212121' } // This should fail - Orange on dark background
            }
        ]
    });

    console.log('Original:', productExample.original);
    console.log('Branded Content:', productExample.branded.content);
    console.log('Color Validation:', productExample.branded.colorValidation.valid ? '✅ Valid' : '❌ Invalid');

    if (productExample.branded.colorValidation.critical?.length > 0) {
        console.log('Critical Issue:', productExample.branded.colorValidation.critical[0].message);
    }

    // Example 3: Typography Guidance
    console.log('\n📝 Example 3: Typography Recommendations');
    console.log('=' .repeat(50));

    const typographyGuidance = skill.getTypographyGuidance('presentation');
    console.log('Primary Font:', typographyGuidance.primary.name);
    console.log('Brand Usage:', typographyGuidance.usage.headlines);
    console.log('Casing Rule:', typographyGuidance.casing.rule);

    // Example 4: Mode Selection Guidance
    console.log('\n🌓 Example 4: Dark vs Light Mode Selection');
    console.log('=' .repeat(50));

    const darkModeGuidance = skill.getModeGuidance('launch a revolutionary new product');
    console.log('Recommended Mode: Dark Mode');
    console.log('Reason:', darkModeGuidance.objectives[2]); // Launch product objective

    const lightModeGuidance = skill.getModeGuidance('educate customers about expense management features');
    console.log('\nRecommended Mode: Light Mode');
    console.log('Reason:', lightModeGuidance.objectives[0]); // Educational objective

    // Example 5: Color Palette Recommendations by Context
    console.log('\n🎯 Example 5: Context-Based Color Recommendations');
    console.log('=' .repeat(50));

    const marketingColors = skill.getColorRecommendations('marketing');
    console.log('Marketing Context:');
    console.log('- Message:', marketingColors[0].message);
    console.log('- Recommended colors:');
    marketingColors[0].colors.forEach(color => {
        if (color.color) {
            console.log(`  • ${color.color} - ${color.usage}`);
        } else if (color.gradient) {
            console.log(`  • Gradient (${color.gradient.colors.join(' → ')}) - ${color.usage}`);
        }
    });

    const productColors = skill.getColorRecommendations('product');
    console.log('\nProduct Context:');
    console.log('- Focus:', productColors[0].message);

    // Example 6: Comprehensive Brand Analysis
    console.log('\n📊 Example 6: Complete Brand Analysis');
    console.log('=' .repeat(50));

    const comprehensiveExample = await skill.execute({
        content: 'Learn more about our solutions',
        contentType: 'button',
        context: 'marketing',
        audience: 'enterprise',
        tone: 'professional',
        outputFormat: 'markdown'
    });

    console.log('Analysis Output:');
    console.log(comprehensiveExample.content);

    // Example 7: Available Brand Capabilities
    console.log('\n🔧 Example 7: Available Brand Capabilities');
    console.log('=' .repeat(50));

    console.log('The enhanced branding skill now supports:');
    skill.capabilities.forEach((capability, index) => {
        console.log(`${index + 1}. ${capability.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    });

    console.log('\n🎉 Demo completed! The branding skill now provides comprehensive');
    console.log('   guidance for Brex brand voice, colors, typography, and visual design.');
}

// Run the demonstration
demonstrateColorUsage().catch(console.error);