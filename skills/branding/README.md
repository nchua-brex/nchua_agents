# Brex Branding Skill

The Brex Branding Skill provides comprehensive brand compliance validation and content generation based on Brex's brand voice, color guidelines, typography standards, and visual design system.

## Features

### Brand Voice & Content
- ✅ Brex brand voice application (Real, Gritty, Relentless, Ambitious, Direct)
- ✅ Metal Design System compliance
- ✅ Character limit validation
- ✅ Accessibility guidelines enforcement
- ✅ Brex terminology standardization
- ✅ Forbidden phrase detection

### Color & Visual Guidelines
- 🎨 **Color Palette Validation** - Validates against approved Brex colors
- 🌈 **Gradient Usage Validation** - Ensures proper gradient application
- 🚫 **Color Combination Restrictions** - Prevents problematic color pairings
- 📊 **Context-Based Color Recommendations** - Suggests appropriate colors by use case

### Typography & Visual Design
- 📝 **Typography Guidance** - Inter Tight/Inter V font family usage recommendations
- 🔤 **Space Mono Validation** - Proper usage of Space Mono for labels only
- ⚖️ **Font Weight Validation** - Ensures appropriate weight usage (Bold/Semi-Bold for headlines)
- 📐 **Typography Restrictions** - 8 visual system don'ts for typography
- 🌓 **Dark/Light Mode Selection** - Communication objective-based mode recommendations
- 🎯 **Brand Color Combinations** - Validated color palette combinations

### Visual Elements & Shapes
- 🔷 **Graphic Shapes Guidance** - 4 approved shapes (Hourglass, Valley, Reverse Valley, Corner Flag)
- 🎨 **Visual Elements Compliance** - Ensures shapes are used purposefully, not decoratively
- 📏 **Visual System Restrictions** - Comprehensive typography and visual don'ts

## Usage

### Basic Content Analysis

```javascript
const { BrandingSkill } = require('./branding_skill');
const skill = new BrandingSkill();

const result = await skill.execute({
    content: 'Create budget',
    contentType: 'button',
    context: 'product',
    audience: 'founders',
    tone: 'professional',
    outputFormat: 'json'
});

console.log(result.branded.content); // Improved content
console.log(result.analysis); // Brand voice analysis
console.log(result.validation); // Design system validation
```

### Color Validation

```javascript
const result = await skill.execute({
    content: 'Start your free trial',
    contentType: 'button',
    context: 'marketing',
    colors: [
        {
            hex: '#FF7028', // Brex Orange
            usage: 'cta',
            background: { hex: '#FFFFFF' } // White background
        }
    ]
});

console.log(result.branded.colorValidation); // Color compliance results
```

### Typography Recommendations

```javascript
const typography = skill.getTypographyGuidance('product');
console.log(typography.primary.name); // "Inter"
console.log(typography.usage.headlines); // "Inter Tight for brand materials, Inter V for product"

// Space Mono specific guidance
const spaceMonoGuidance = skill.getSpaceMonoGuidance();
console.log(spaceMonoGuidance.usage); // "Labels only - reserved for Brand use, never in Product"

// Typography validation
const typographyResult = await skill.execute({
    content: 'METRICS',
    typography: {
        font: 'Space Mono',
        usage: 'labels',
        casing: 'uppercase'
    }
});
console.log(typographyResult.branded.typographyValidation); // Validation results
```

### Dark/Light Mode Selection

```javascript
// Recommends dark mode for product launches
const darkMode = skill.getModeGuidance('launch a revolutionary new product');

// Recommends light mode for educational content
const lightMode = skill.getModeGuidance('educate customers about features');
```

## Brex Color Palette

### Core Colors
- **Ink**: `#212121` - Primary text, backgrounds (print only)
- **Black**: `#111111` - Digital backgrounds only
- **Gray**: `#F4F4F4` - Secondary text, separators
- **White**: `#FFFFFF` - Primary backgrounds, text
- **Orange**: `#FF7028` - CTAs, accents (use sparingly)

### Gradients
- **Future Light**: `#FFBC96` → `#91ECEA` (dark backgrounds only)
- **Future Dark**: `#4BB4B1` → `#E8905E` (light backgrounds only)
- **Blue**: `#1F374F` → `#0F1619` (backgrounds only)
- **Soft Orange**: `#F3EEEB` → `#F7D4C0` (backgrounds only)

### Color Usage Rules
- Use 90-10 rule: 90% core colors, 10% accent colors
- Orange text forbidden on dark backgrounds
- Deep Ink (#111111) forbidden on Ink (#212121) backgrounds
- Future Light only on dark backgrounds
- Future Dark only on light backgrounds

## Typography Guidelines

### Primary Font: Inter
- **Inter Tight**: Brand materials
- **Inter V**: Product interfaces
- **Sentence case**: All copy except Space Mono

### Secondary Fonts
- **Flecha S**: Quotes and testimonials only (Regular weight)
- **Space Mono**: Labels only - Brand use only, never in Product
  - Always uppercase/capital case
  - Small font sizes only
  - Regular weight, 0 tracking
  - Limited words per use
  - Line spacing: 80%-100%

## Dark vs Light Mode

### Dark Mode
Use for:
- Challenging status quo & new perspectives
- Big ideas, concepts, philosophy
- Product launches & innovative solutions

### Light Mode
Use for:
- Educational & engagement content
- Highlighting product details
- Addressing customer needs & pain points

## Visual Elements & Graphic Shapes

### Approved Graphic Shapes
The visual system includes 4 approved graphic shapes for purposeful use:

1. **Hourglass** - Large brand element, non-distracting to content
2. **Valley** - Content separation, filled with core colors/gradients, can be flipped
3. **Reverse Valley** - Content separation using Gray as subtle background
4. **Corner Flag** - Large brand element, non-distracting to content

### Visual Elements Guidelines
```javascript
// Get visual elements guidance
const visualGuidance = skill.getVisualElementsGuidance();
console.log(visualGuidance.purpose); // "Shapes should always be used purposefully, and never as decoration"

// Validate visual elements usage
const result = await skill.execute({
    content: 'Content here',
    visualElements: [
        { type: 'valley', purpose: 'separate content', usage: 'background' }
    ]
});
console.log(result.branded.visualElementsValidation);
```

### Visual System Don'ts
The skill enforces 8 key typography restrictions:
- Don't change Inter Tight tracking (keep at 0/default)
- Don't use Semi Bold/Bold for body copy
- Don't use weights other than Semi Bold/Bold for headlines
- Don't use Flecha Broche M (removed from system)
- Don't use Flecha S except for quotes
- Don't use all caps or title case (except Space Mono)
- Don't set line spacing too loose
- Don't set tracking too tight or too loose

## Content Types Supported

- `button` - CTA buttons with Verb + Noun pattern
- `form` - Form fields and labels
- `data_display` - Data visualization elements
- `feedback` - Toast messages and notifications

## Testing

```bash
# Run branding skill tests
node test_branding_skill.js

# Run color guidelines tests
node test_color_guidelines.js

# Run usage examples
node example_color_usage.js
```

## Validation Results

The skill provides comprehensive validation across:
- **Critical Issues**: Must be fixed (color violations, character limits)
- **Warnings**: Should be addressed (usage recommendations)
- **Recommendations**: Best practices (context-specific guidance)

## Integration

The BrandingSkill integrates with the broader skills system and can be used by document processing workflows, content generation agents, and design validation pipelines.

For complete implementation details, see the source code and test files.