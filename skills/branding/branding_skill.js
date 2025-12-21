/**
 * Branding Skill
 *
 * Generates content that adheres to Brex's brand voice and style guidelines:
 * - Applies Brex brand voice principles (Real, Gritty, Relentless, Ambitious, Direct)
 * - Enforces Metal Design System content guidelines
 * - Ensures proper tone adaptation for different contexts
 * - Validates against character limits and accessibility requirements
 * - Incorporates Brex-specific terminology and naming conventions
 */

const { BaseSkill } = require('../core/base_skill');

class BrandingSkill extends BaseSkill {
    constructor() {
        super(
            'BrandingSkill',
            'Generate content that adheres to Brex brand voice, style, color, and visual guidelines',
            [
                'brex_brand_voice_application',
                'metal_design_system_compliance',
                'tone_adaptation',
                'character_limit_validation',
                'accessibility_guidelines',
                'brex_terminology_enforcement',
                'content_validation',
                'color_palette_validation',
                'typography_guidance',
                'dark_light_mode_recommendations',
                'gradient_usage_validation',
                'brand_color_combinations',
                'space_mono_validation',
                'font_weight_validation',
                'visual_system_restrictions',
                'graphic_shapes_guidance',
                'visual_elements_compliance'
            ]
        );

        // Additional configuration
        this.inputFormats = ['json'];
        this.outputFormats = ['json', 'text', 'markdown'];
        this.requiresAuth = false;

        // Expose description as public property for testing
        this.description = 'Generate content that adheres to Brex brand voice and style guidelines';

        // Brex Brand Voice Principles
        this.brandTraits = {
            real: {
                description: "Focus on outcomes, not promises. Help customers win.",
                guidelines: [
                    "Speak to real, measurable customer benefits",
                    "Don't take sole credit or make false promises",
                    "Link features to customer impact"
                ],
                examples: {
                    good: "Automate 70% of expense tasks with Brex — and get back to building.",
                    bad: "Thanks to Brex, you'll never have to do any manual finance tasks ever again."
                }
            },
            gritty: {
                description: "Prioritize grit over glamour. Lean into the grind and reality of hard work.",
                guidelines: [
                    "Acknowledge the determination required to build and scale",
                    "Position Brex as the partner that makes their grind more effective",
                    "Don't oversimplify the challenges"
                ],
                examples: {
                    good: "Building is hard. Banking doesn't have to be.",
                    bad: "Automate accounting so you can take the day off."
                }
            },
            relentless: {
                description: "Be precise and reliable. Focus on accuracy, consistency, and excellence.",
                guidelines: [
                    "Emphasize precision and reliability",
                    "Use specific metrics and outcomes",
                    "Avoid vague statements"
                ],
                examples: {
                    good: "Every transaction syncs to your ERP — no manual data entry, no reconciliation errors.",
                    bad: "Set it and forget with Brex."
                }
            },
            ambitious: {
                description: "Be aspirational, but grounded in reality. Meet people where they are.",
                guidelines: [
                    "Inspire without relying on fantasy",
                    "Acknowledge challenges while providing tools to overcome them",
                    "Ground aspirations in realistic outcomes"
                ],
                examples: {
                    good: "Fuel your growth with 20x higher card limits and high-yield banking.",
                    bad: "Achieve exponential growth without breaking a sweat."
                }
            },
            direct: {
                description: "Maintain high standards and clarity of purpose.",
                guidelines: [
                    "Be confident and direct",
                    "Set clear standards for who you serve",
                    "Avoid generic statements"
                ],
                examples: {
                    good: "Brex is for finance leaders who refuse to compromise between speed and control.",
                    bad: "Perfect for any organization looking to improve their financial operations."
                }
            }
        };

        // Voice Avoid List
        this.voiceAvoidList = [
            "Safe or overly polished",
            "Whimsical or naive",
            "Overly formal or stiff",
            "Narcissistic or chest-beaty",
            "Vague or fluffy"
        ];

        // Metal Design System Limits
        this.characterLimits = {
            button: 25,
            confirmationDialogTitle: 50,
            confirmationDialogMessage: 150,
            confirmationAction: 20,
            fieldLabel: 50,
            errorMessage: 200,
            listItemLeftTitle: 40,
            listItemLeftSubtitle: 80,
            listItemRightTitle: 20,
            listItemRightSubtitle: 30,
            toastTitle: 50,
            toastBody: 100
        };

        // Brex Product Naming Conventions
        this.brexProductNames = {
            company: "Brex",
            products: {
                "brex_business_account": "Brex business account",
                "brex_corporate_card": "Brex corporate card",
                "brex_card": "Brex card",
                "brex_travel": "Brex travel",
                "brex_bill_pay": "Brex bill pay",
                "brex_expense_management": "Brex expense management",
                "brex_rewards": "Brex rewards"
            },
            exceptions: {
                "brex_ai": "Brex AI",
                "brex_assistant": "Brex Assistant",
                "brex_embedded": "Brex Embedded",
                "brexpay_for_navan": "BrexPay for Navan",
                "brex_support": "Brex Support",
                "help_center": "Help Center"
            }
        };

        // Forbidden Phrases for CTAs
        this.forbiddenCTAs = [
            "Learn more",
            "Click here",
            "Read more",
            "More info",
            "Submit",
            "Save" // without object
        ];

        // Brex Color and Visual Guidelines
        this.colorGuidelines = {
            core: {
                ink: {
                    hex: "#212121",
                    rgb: "72 66 65 73",
                    cmyk: "426 C / Black 6 U",
                    usage: "Logos, text, background",
                    note: "Background for print only"
                },
                black: {
                    hex: "#111111",
                    usage: "Backgrounds",
                    note: "In digital applications only"
                },
                gray: {
                    hex: "#F4F4F4",
                    rgb: "4 8 5 0",
                    cmyk: "7632 C / 9345 U",
                    usage: "Text, backgrounds"
                },
                white: {
                    hex: "#FFFFFF",
                    rgb: "0 0 0 0",
                    usage: "Text, backgrounds"
                },
                orange: {
                    hex: "#FF7028",
                    rgb: "0 56 84 0",
                    cmyk: "165 C / 021 U",
                    usage: "Logos, text, details",
                    limit: "On text and details in small amounts per layout. On Call-to-Actions"
                }
            },
            gradients: {
                futureLight: {
                    direction: "Diagonal (135°)",
                    colors: ["#FFBC96", "#91ECEA"],
                    usage: "Logos, text, details",
                    limit: "On text and details in small amounts per layout. On dark backgrounds only"
                },
                futureDark: {
                    direction: "Diagonal (135°)",
                    colors: ["#4BB4B1", "#E8905E"],
                    usage: "Logos, text, details",
                    limit: "On text and details in small amounts per layout. On light backgrounds only"
                }
            },
            secondary: {
                blue: {
                    direction: "Diagonal",
                    colors: ["#1F374F", "#0F1619"],
                    usage: "Backgrounds",
                    limit: "To help the UI or other elements pop",
                    note: "1st color is placed in the middle of the gradient, if gradient slider is available"
                },
                softOrange: {
                    direction: "Diagonal",
                    colors: ["#F3EEEB", "#F7D4C0"],
                    usage: "Backgrounds",
                    note: "1st color is placed in the middle of the gradient, if gradient slider is available"
                }
            },
            accent: {
                ratios: {
                    ink: "10% — 90%",
                    deepInk: "0% — 90%",
                    gray: "0% — 75%",
                    white: "10% — 90%",
                    future: "0% — 10%",
                    orange: "0% — 5%"
                },
                usage: {
                    ink: "Used on text or foreground shapes",
                    black: "Used as a background color",
                    gray: "Used to separate content, or as a background. Use in fun, but utilitarian brand touch points. Use over white in printed materials",
                    white: "Used as the main color throughout. Ideal for long-form content, reports, presentations, and workspaces",
                    futureLight: "Can be used on icon strokes or icon fill. When using it on elements, only use on fine details like thin lines",
                    futureDark: "Can be used on icon strokes or icon fill. When using it on elements, only use on fine details like thin lines",
                    orange: "Used in small amounts to highlight text or call-to-action elements"
                }
            },
            secondaryRatios: {
                blue: "0% — 90%",
                softOrange: "0% — 90%",
                empower: "0% — 10%"
            },
            restrictions: {
                gradients: "Blue and Soft Orange can only be used as backgrounds",
                futureLight: "On dark backgrounds only",
                futureDark: "On light backgrounds only",
                orange: "Don't overuse Orange",
                figmaNote: "Due to the lack of gradient controls in Figma, recreating the gradients can lead to undesired results. Either copy the gradient from the swatch shapes on the right, or try to mimic the gradient tones using the hex provided and match them to the swatches to the right."
            }
        };

        // Typography Guidelines
        this.typography = {
            primary: {
                name: "Inter",
                description: "Our main typeface, and should be used throughout all channels of Brex. Inter is available on Google Fonts, or from our Bynder library.",
                variants: {
                    interTight: "Used in Brand materials - primary choice for brand documents",
                    interV: "Used across our Product interfaces"
                },
                sources: [
                    "Bynder fonts library",
                    "Download from Google"
                ],
                brandDefault: "Inter Tight"
            },
            secondary: {
                flecha: {
                    name: "Flecha S",
                    usage: "Only used for quotes or testimonials. We only use one weight of Flecha S.",
                    weight: "Regular"
                },
                spaceMono: {
                    name: "Space Mono",
                    description: "This is a typeface specifically reserved for labeling and categorizing information. It's reserved for Brand use only, never in Product.",
                    usage: "Only used in capital case and only in small font sizes",
                    weight: "Regular",
                    tracking: "0/None",
                    lineSpacing: "80% — 100%, depending on the amount of text",
                    applications: "Labels",
                    restrictions: [
                        "Only in limited amount of words per use (e.g., as a label for a person's name, but not using it to describe more details relating to that person, aside from their title)",
                        "Limit the amount of spaces used between words; too many spaces can make it hard to read"
                    ]
                }
            },
            casing: {
                rule: "All copy used at Brex should be used in sentence case, except when using Space Mono.",
                exceptions: ["Space Mono usage - always capital case"],
                spaceMono: "Space Mono must always be used in capital case"
            },
            weights: {
                interTightBold: "The largest type makes it the first read, and makes brand statements impactful when used this way",
                interTightSemiBold: "Used together with Inter Tight Bold, the contrast of light vs. dark creates a modern and impactful look, and is a common way we use Inter Tight at Brex",
                interTightMedium: "This weight can be used to provide more legibility for other instances such as CTAs",
                interBold: "Bold is used for titles and never in subtitles",
                interMedium: "Mediums can be used when Regular appears too light in weight",
                interRegular: "Standard body text weight"
            }
        };

        // Dark Mode vs Light Mode Guidelines
        this.modeGuidelines = {
            darkMode: {
                when: "Use dark mode with the following communication objectives:",
                objectives: [
                    "Challenge the status quo & provoke our audience with a new perspective",
                    "Communicate a big idea, concept, or philosophy",
                    "Launch a product that brings about a new and better way"
                ],
                ratios: {
                    hype: {
                        darkLight: "15% — 85%",
                        description: "More dramatic, high-contrast approach"
                    }
                }
            },
            lightMode: {
                when: "Use light mode with the following communication objectives:",
                objectives: [
                    "Educate and engage our audience on a concept or product",
                    "Highlight the differentiated details of our offerings",
                    "Answer and address customer needs and pain points"
                ],
                ratios: {
                    hype: {
                        darkLight: "90% — 10%",
                        description: "More approachable, educational approach"
                    },
                    evergreen: {
                        description: "More balanced light approach for consistent, ongoing communications"
                    }
                }
            },
            ratioGuidance: "The amount of dark and light ratio is directly related to the intention of the communication. Use the ratio guidance below as a starting point. Percentages indicate amount used in a layout. See the examples to the right for a better idea."
        };

        // Visual System Don'ts - Typography
        this.typographyRestrictions = [
            {
                rule: "Don't change Inter Tight's tracking to loose; it should be 0 or default",
                severity: "high",
                category: "typography"
            },
            {
                rule: "Don't set Inter Tight's tracking to too tight; it should be 0 or default",
                severity: "high",
                category: "typography"
            },
            {
                rule: "Don't set line spacing too loose; follow the line spacing guidance",
                severity: "medium",
                category: "typography"
            },
            {
                rule: "Don't use Semi Bold or Bold for body copy",
                severity: "high",
                category: "typography"
            },
            {
                rule: "Don't use weights other than Semi Bold or Bold for headlines",
                severity: "high",
                category: "typography"
            },
            {
                rule: "Don't use Flecha Broche M, as it has been removed from our visual system",
                severity: "critical",
                category: "typography"
            },
            {
                rule: "Don't use Flecha S except for quotes",
                severity: "high",
                category: "typography"
            },
            {
                rule: "Don't use all capital letters or title case",
                severity: "high",
                category: "typography"
            }
        ];

        // Color Usage Don'ts
        this.colorRestrictions = [
            {
                rule: "Don't use gradients not labeled for background use on backgrounds",
                severity: "critical"
            },
            {
                rule: "Don't make ink work too thick or apply gradients on thick lines",
                severity: "high"
            },
            {
                rule: "Don't use Orange text on top of dark background",
                severity: "critical"
            },
            {
                rule: "Don't overuse Orange",
                severity: "high"
            },
            {
                rule: "Don't use Deep Ink (#111111) on a Ink (#212121) filled background",
                severity: "critical"
            },
            {
                rule: "Don't use Blue in complex layouts with body, and don't use Blue on Ink",
                severity: "high"
            },
            {
                rule: "Don't use colors in ways that are not adhering to the specifications",
                severity: "critical"
            },
            {
                rule: "Don't use Future Light on top of light backgrounds. Use Future Dark on text on light background",
                severity: "critical"
            }
        ];

        // Visual Elements Guidelines
        this.visualElements = {
            graphicShapes: {
                purpose: "Shapes should always be used purposefully, and never as a decoration",
                usage: [
                    "They can be used to separate content by filling it with a color, cropping an image, or use it to subtract a layout shape",
                    "They provide interest to a layout, and help signal the eye to a particular area in the design"
                ],
                types: {
                    hourglass: {
                        name: "Single shape - Hourglass",
                        usage: "Can be used as a large brand element in a way that's not distracting to the content"
                    },
                    valley: {
                        name: "Single shape - Valley",
                        usage: "Can be used to separate content, filled with core colors or gradients, or flipped horizontally"
                    },
                    reverseValley: {
                        name: "Single shape - Reverse Valley",
                        usage: "Can be used to separate content using Gray, as a subtle background element"
                    },
                    cornerFlag: {
                        name: "Single shape - Corner Flag",
                        usage: "Can be used as a large brand element in a way that's not distracting to the content"
                    }
                }
            }
        };

        // Content validation rules
        this.validationRules = {
            critical: [
                'character_limit_violations',
                'missing_accessibility_labels',
                'forbidden_phrases_usage',
                'security_privacy_violations'
            ],
            high: [
                'brand_voice_violations',
                'poor_cta_construction',
                'readability_problems',
                'mobile_truncation_risks'
            ],
            medium: [
                'localization_concerns',
                'style_guide_deviations',
                'minor_wording_improvements'
            ]
        };
    }

    /**
     * Main execution method for branding content
     */
    async execute(inputs = {}) {
        const {
            contentType = 'general', // button, form, data_display, feedback
            context = 'general', // marketing, product, support, error
            content = '',
            audience = 'general', // founders, commercial, enterprise
            tone = 'professional', // professional, helpful, urgent
            outputFormat = 'json'
        } = inputs;

        if (!content) {
            return {
                success: false,
                error: 'Content is required for branding analysis'
            };
        }

        try {
            // Validate and apply brand voice
            const brandAnalysis = await this.analyzeBrandCompliance(content, contentType, context);

            // Generate branded content
            const brandedContent = await this.generateBrandedContent(content, {
                contentType,
                context,
                audience,
                tone
            });

            // Validate against design system
            const designSystemValidation = await this.validateDesignSystem(brandedContent, contentType);

            // Compile results
            const result = {
                success: true,
                original: content,
                branded: brandedContent,
                analysis: brandAnalysis,
                validation: designSystemValidation,
                metadata: {
                    contentType,
                    context,
                    audience,
                    tone,
                    processedAt: new Date().toISOString()
                }
            };

            return this.formatOutput(result, outputFormat);

        } catch (error) {
            return {
                success: false,
                error: error.message,
                suggestion: this.getSuggestionForError(error.message)
            };
        }
    }

    /**
     * Analyze content for brand voice compliance
     */
    async analyzeBrandCompliance(content, contentType, context) {
        const analysis = {
            brandTraitScores: {},
            issues: [],
            strengths: [],
            recommendations: []
        };

        // Score against each brand trait
        for (const [trait, definition] of Object.entries(this.brandTraits)) {
            const score = this.scoreBrandTrait(content, trait, definition);
            analysis.brandTraitScores[trait] = score;

            if (score.score < 3) {
                analysis.issues.push({
                    trait,
                    issue: score.issue,
                    suggestion: score.suggestion
                });
            } else if (score.score >= 4) {
                analysis.strengths.push({
                    trait,
                    strength: score.strength
                });
            }
        }

        // Check for forbidden patterns
        const forbiddenCheck = this.checkForbiddenPatterns(content);
        if (forbiddenCheck.violations.length > 0) {
            analysis.issues.push(...forbiddenCheck.violations);
        }

        return analysis;
    }

    /**
     * Score content against a specific brand trait
     */
    scoreBrandTrait(content, trait, definition) {
        const contentLower = content.toLowerCase();
        let score = 3; // neutral
        let issue = null;
        let suggestion = null;
        let strength = null;

        switch (trait) {
            case 'real':
                if (contentLower.includes('never') || contentLower.includes('always') || contentLower.includes('completely')) {
                    score = 2;
                    issue = "Contains absolute promises";
                    suggestion = "Focus on specific, measurable benefits instead of absolutes";
                }
                if (contentLower.includes('% ') || contentLower.includes('measurable') || contentLower.includes('hours saved')) {
                    score = 4;
                    strength = "Contains specific, measurable benefits";
                }
                break;

            case 'gritty':
                if (contentLower.includes('easy') || contentLower.includes('simple') || contentLower.includes('effortless')) {
                    score = 2;
                    issue = "Oversimplifies challenges";
                    suggestion = "Acknowledge the real work required while showing how Brex helps";
                }
                if (contentLower.includes('building') || contentLower.includes('grind') || contentLower.includes('scale')) {
                    score = 4;
                    strength = "Acknowledges the reality of building and scaling";
                }
                break;

            case 'relentless':
                if (contentLower.includes('approximately') || contentLower.includes('might') || contentLower.includes('could')) {
                    score = 2;
                    issue = "Uses imprecise language";
                    suggestion = "Use specific metrics and definitive statements";
                }
                if (contentLower.includes('every') || contentLower.includes('no errors') || contentLower.includes('100%')) {
                    score = 4;
                    strength = "Emphasizes precision and reliability";
                }
                break;

            case 'ambitious':
                if (contentLower.includes('without effort') || contentLower.includes('automatically')) {
                    score = 2;
                    issue = "Suggests unrealistic ease";
                    suggestion = "Frame growth as achievable with the right tools";
                }
                if (contentLower.includes('fuel your growth') || contentLower.includes('achieve') || contentLower.includes('enable')) {
                    score = 4;
                    strength = "Frames challenges as opportunities";
                }
                break;

            case 'direct':
                if (contentLower.includes('perfect for everyone') || contentLower.includes('anyone can')) {
                    score = 2;
                    issue = "Too generic or broad";
                    suggestion = "Be specific about who this serves and why";
                }
                if (contentLower.includes('for') && (contentLower.includes('leaders') || contentLower.includes('who refuse'))) {
                    score = 4;
                    strength = "Clearly defines target audience and standards";
                }
                break;
        }

        return { score, issue, suggestion, strength };
    }

    /**
     * Check for forbidden patterns and phrases
     */
    checkForbiddenPatterns(content) {
        const violations = [];
        const contentLower = content.toLowerCase();

        // Check forbidden CTAs
        for (const phrase of this.forbiddenCTAs) {
            if (contentLower.includes(phrase.toLowerCase())) {
                violations.push({
                    type: 'forbidden_phrase',
                    severity: 'critical',
                    phrase,
                    suggestion: `Replace "${phrase}" with a specific verb + noun combination`
                });
            }
        }

        // Check for passive voice patterns
        const passivePatterns = ['will be', 'can be', 'is being', 'are being'];
        for (const pattern of passivePatterns) {
            if (contentLower.includes(pattern)) {
                violations.push({
                    type: 'passive_voice',
                    severity: 'high',
                    pattern,
                    suggestion: 'Convert to active voice for more direct communication'
                });
            }
        }

        // Check for vague language
        const vagueTerms = ['things', 'stuff', 'something', 'various', 'etc'];
        for (const term of vagueTerms) {
            if (contentLower.includes(term)) {
                violations.push({
                    type: 'vague_language',
                    severity: 'medium',
                    term,
                    suggestion: 'Replace with specific terminology'
                });
            }
        }

        return { violations };
    }

    /**
     * Generate branded content based on inputs
     */
    async generateBrandedContent(content, options) {
        const { contentType, context, audience, tone } = options;

        // Apply audience-specific voice adaptation
        let voiceGuidance = this.getAudienceVoiceGuidance(audience);

        // Apply context-specific tone
        let toneGuidance = this.getContextToneGuidance(context, tone);

        // Apply content type specific requirements
        let contentRequirements = this.getContentTypeRequirements(contentType);

        // Generate improved content
        let improvedContent = content;

        // Apply brand trait principles
        improvedContent = this.applyBrandTraits(improvedContent, voiceGuidance, toneGuidance);

        // Apply naming conventions
        improvedContent = this.applyNamingConventions(improvedContent);

        // Validate character limits
        const limitValidation = this.validateCharacterLimits(improvedContent, contentType);

        // Validate colors if color specifications are provided
        const colorValidation = this.validateColorUsage(options.colors || []);

        // Validate typography if typography specifications are provided
        const typographyValidation = this.validateTypographyUsage(options.typography || {});

        // Validate visual elements if specified
        const visualElementsValidation = this.validateVisualElements(options.visualElements || []);

        return {
            content: improvedContent,
            requirements: contentRequirements,
            voiceGuidance,
            toneGuidance,
            limitValidation,
            colorValidation,
            typographyValidation,
            visualElementsValidation
        };
    }

    /**
     * Get voice guidance based on audience
     */
    getAudienceVoiceGuidance(audience) {
        const audienceGuidance = {
            founders: {
                emphasis: ['gritty', 'ambitious'],
                focus: 'Simplicity to focus on building, finance working in the background',
                language: 'Direct, acknowledging the challenges of scaling'
            },
            commercial: {
                emphasis: ['relentless', 'real'],
                focus: 'Efficiency to work faster and smarter, leveraging automation',
                language: 'Specific benefits and measurable outcomes'
            },
            enterprise: {
                emphasis: ['direct', 'relentless'],
                focus: 'Elevated controls and rigor to optimize spend with precision',
                language: 'Professional, precise, emphasizing control and accuracy'
            },
            general: {
                emphasis: ['real', 'direct'],
                focus: 'High-performance finance as a growth catalyst',
                language: 'Clear, confident, outcome-focused'
            }
        };

        return audienceGuidance[audience] || audienceGuidance.general;
    }

    /**
     * Get tone guidance based on context
     */
    getContextToneGuidance(context, tone) {
        const contextToneMap = {
            marketing: {
                professional: 'Dial up ambitious and gritty components. Opportunity for smart wit.',
                helpful: 'Keep it real. Focus on proven outcomes.',
                urgent: 'Be direct and relentless. Emphasize precision.'
            },
            product: {
                professional: 'Be direct, clear, simple, and professional.',
                helpful: 'Focus on next steps and actionable outcomes.',
                urgent: 'Provide immediate clarity on what happened and what to do.'
            },
            support: {
                professional: 'Be precise and helpful. Acknowledge complexity honestly.',
                helpful: 'Focus on solutions and clear next steps.',
                urgent: 'Be direct about issues while providing immediate help.'
            },
            error: {
                professional: 'Be direct about the problem and solution.',
                helpful: 'Explain what happened and how to fix it.',
                urgent: 'Provide immediate actionable steps.'
            }
        };

        return contextToneMap[context]?.[tone] || 'Be direct, real, and helpful.';
    }

    /**
     * Get content type specific requirements
     */
    getContentTypeRequirements(contentType) {
        const requirements = {
            button: {
                pattern: 'Verb + Noun',
                limit: this.characterLimits.button,
                accessibility: 'Must clearly describe the action outcome',
                examples: ['Create budget', 'Delete expense', 'Export report']
            },
            form: {
                labelFormat: 'Noun phrase or brief question',
                limit: this.characterLimits.fieldLabel,
                accessibility: 'Must work without visual context',
                errorFormat: 'Problem statement + Solution'
            },
            data_display: {
                hierarchy: 'Most important info first',
                limits: {
                    leftTitle: this.characterLimits.listItemLeftTitle,
                    rightTitle: this.characterLimits.listItemRightTitle
                },
                formatting: 'Consistent data formats across items'
            },
            feedback: {
                titleLimit: this.characterLimits.toastTitle,
                bodyLimit: this.characterLimits.toastBody,
                requirements: ['Clear status indication', 'Relate to user action', 'Provide next steps']
            }
        };

        return requirements[contentType] || requirements.button;
    }

    /**
     * Apply brand traits to content
     */
    applyBrandTraits(content, voiceGuidance, toneGuidance) {
        // This would contain logic to improve content based on brand traits
        // For now, return content with guidance applied
        return content;
    }

    /**
     * Apply Brex naming conventions
     */
    applyNamingConventions(content) {
        let updatedContent = content;

        // Replace generic terms with proper Brex product names
        for (const [key, name] of Object.entries(this.brexProductNames.products)) {
            const regex = new RegExp(`\\b${key.replace(/_/g, '\\s*')}\\b`, 'gi');
            updatedContent = updatedContent.replace(regex, name);
        }

        // Apply exceptions (branded terms)
        for (const [key, name] of Object.entries(this.brexProductNames.exceptions)) {
            const regex = new RegExp(`\\b${key.replace(/_/g, '\\s*')}\\b`, 'gi');
            updatedContent = updatedContent.replace(regex, name);
        }

        return updatedContent;
    }

    /**
     * Validate content against Design System character limits
     */
    validateCharacterLimits(content, contentType) {
        const limit = this.characterLimits[contentType];
        if (!limit) {
            return { valid: true, message: 'No specific limit for this content type' };
        }

        const isValid = content.length <= limit;
        return {
            valid: isValid,
            limit,
            current: content.length,
            message: isValid ?
                'Within character limit' :
                `Exceeds limit by ${content.length - limit} characters`,
            severity: isValid ? 'pass' : 'critical'
        };
    }

    /**
     * Validate against Metal Design System guidelines
     */
    async validateDesignSystem(brandedContent, contentType) {
        const validation = {
            passed: [],
            critical: [],
            high: [],
            medium: []
        };

        const content = brandedContent.content;

        // Character limit validation
        const limitCheck = brandedContent.limitValidation;
        if (!limitCheck.valid) {
            validation.critical.push({
                rule: 'Character Limit',
                issue: limitCheck.message,
                fix: 'Reduce content length or front-load important words'
            });
        } else {
            validation.passed.push('Character limit compliance');
        }

        // CTA validation for button content
        if (contentType === 'button') {
            const verbNounPattern = /^[A-Z][a-z]*\s+[a-z]+/;
            if (!verbNounPattern.test(content)) {
                validation.high.push({
                    rule: 'Button Pattern',
                    issue: 'Does not follow Verb + Noun pattern',
                    fix: 'Use format like "Create budget" or "Delete expense"'
                });
            } else {
                validation.passed.push('Verb + Noun pattern compliance');
            }
        }

        // Accessibility validation
        if (contentType === 'button' || contentType === 'form') {
            if (content.toLowerCase().includes('click here') || content.toLowerCase().includes('this')) {
                validation.critical.push({
                    rule: 'Accessibility',
                    issue: 'Content relies on visual context',
                    fix: 'Provide complete context without visual dependence'
                });
            } else {
                validation.passed.push('Accessibility compliance');
            }
        }

        return validation;
    }

    /**
     * Format output based on requested format
     */
    formatOutput(result, format) {
        switch (format.toLowerCase()) {
            case 'text':
                return this.convertToText(result);
            case 'markdown':
                return this.convertToMarkdown(result);
            case 'json':
            default:
                return result;
        }
    }

    /**
     * Convert to plain text format
     */
    convertToText(result) {
        let textOutput = `Brex Brand Analysis\n`;
        textOutput += `${'='.repeat(20)}\n\n`;

        textOutput += `Original: ${result.original}\n`;
        textOutput += `Branded: ${result.branded.content}\n\n`;

        textOutput += `Brand Trait Scores:\n`;
        for (const [trait, score] of Object.entries(result.analysis.brandTraitScores)) {
            textOutput += `- ${trait}: ${score.score}/5\n`;
        }

        if (result.analysis.issues.length > 0) {
            textOutput += `\nIssues:\n`;
            result.analysis.issues.forEach((issue, index) => {
                textOutput += `${index + 1}. ${issue.trait}: ${issue.issue}\n`;
            });
        }

        return {
            success: true,
            content: textOutput,
            metadata: result.metadata
        };
    }

    /**
     * Convert to markdown format
     */
    convertToMarkdown(result) {
        let markdown = `# Brex Brand Analysis\n\n`;

        markdown += `**Original Content:** ${result.original}\n\n`;
        markdown += `**Branded Content:** ${result.branded.content}\n\n`;

        markdown += `## Brand Voice Analysis\n\n`;
        markdown += `### Trait Scores\n\n`;
        for (const [trait, score] of Object.entries(result.analysis.brandTraitScores)) {
            const stars = '★'.repeat(score.score) + '☆'.repeat(5 - score.score);
            markdown += `- **${trait.charAt(0).toUpperCase() + trait.slice(1)}**: ${stars} (${score.score}/5)\n`;
        }

        if (result.analysis.issues.length > 0) {
            markdown += `\n### Issues to Address\n\n`;
            result.analysis.issues.forEach((issue, index) => {
                markdown += `${index + 1}. **${issue.trait}**: ${issue.issue}\n   - *Suggestion*: ${issue.suggestion}\n\n`;
            });
        }

        if (result.analysis.strengths.length > 0) {
            markdown += `\n### Strengths\n\n`;
            result.analysis.strengths.forEach((strength, index) => {
                markdown += `${index + 1}. **${strength.trait}**: ${strength.strength}\n\n`;
            });
        }

        markdown += `\n## Design System Validation\n\n`;
        if (result.validation.critical.length > 0) {
            markdown += `### Critical Issues\n\n`;
            result.validation.critical.forEach((issue, index) => {
                markdown += `${index + 1}. **${issue.rule}**: ${issue.issue}\n   - *Fix*: ${issue.fix}\n\n`;
            });
        }

        return {
            success: true,
            content: markdown,
            metadata: result.metadata
        };
    }

    /**
     * Validate color usage against Brex brand guidelines
     */
    validateColorUsage(colors = []) {
        const validation = {
            valid: true,
            critical: [],
            warnings: [],
            recommendations: []
        };

        if (colors.length === 0) {
            return {
                valid: true,
                message: 'No colors specified for validation',
                recommendations: this.getColorRecommendations('general')
            };
        }

        for (const color of colors) {
            const colorCheck = this.checkColorCompliance(color);

            if (colorCheck.violations.length > 0) {
                validation.critical.push(...colorCheck.violations);
                validation.valid = false;
            }

            if (colorCheck.warnings.length > 0) {
                validation.warnings.push(...colorCheck.warnings);
            }

            if (colorCheck.recommendations.length > 0) {
                validation.recommendations.push(...colorCheck.recommendations);
            }
        }

        return validation;
    }

    /**
     * Check individual color compliance
     */
    checkColorCompliance(colorSpec) {
        const { hex, usage, background, context = 'general' } = colorSpec;
        const violations = [];
        const warnings = [];
        const recommendations = [];

        // Check if color is in approved palette
        const isApprovedColor = this.isApprovedBrexColor(hex);
        if (!isApprovedColor) {
            violations.push({
                type: 'unapproved_color',
                color: hex,
                message: `Color ${hex} is not in the approved Brex color palette`,
                severity: 'critical'
            });
        }

        // Check color combination restrictions
        if (background) {
            const combinationCheck = this.validateColorCombination(hex, background.hex, usage);
            if (!combinationCheck.valid) {
                violations.push({
                    type: 'invalid_combination',
                    foreground: hex,
                    background: background.hex,
                    message: combinationCheck.message,
                    severity: combinationCheck.severity
                });
            }
        }

        // Check usage restrictions
        const usageCheck = this.validateColorUsageContext(hex, usage, context);
        if (!usageCheck.valid) {
            warnings.push({
                type: 'usage_warning',
                color: hex,
                message: usageCheck.message,
                suggestion: usageCheck.suggestion
            });
        }

        // Provide recommendations
        recommendations.push(...this.getColorRecommendations(context, usage));

        return { violations, warnings, recommendations };
    }

    /**
     * Check if color is in approved Brex palette
     */
    isApprovedBrexColor(hex) {
        const approvedColors = [
            this.colorGuidelines.core.ink.hex,
            this.colorGuidelines.core.black.hex,
            this.colorGuidelines.core.gray.hex,
            this.colorGuidelines.core.white.hex,
            this.colorGuidelines.core.orange.hex,
            ...this.colorGuidelines.gradients.futureLight.colors,
            ...this.colorGuidelines.gradients.futureDark.colors,
            ...this.colorGuidelines.secondary.blue.colors,
            ...this.colorGuidelines.secondary.softOrange.colors
        ];

        return approvedColors.some(color =>
            color.toLowerCase() === hex.toLowerCase()
        );
    }

    /**
     * Validate color combinations
     */
    validateColorCombination(foreground, background, usage) {
        const fg = foreground.toLowerCase();
        const bg = background.toLowerCase();

        // Check critical restrictions
        for (const restriction of this.colorRestrictions) {
            if (restriction.severity === 'critical') {
                // Orange text on dark background
                if (fg === this.colorGuidelines.core.orange.hex.toLowerCase() &&
                    (bg === this.colorGuidelines.core.black.hex.toLowerCase() ||
                     bg === this.colorGuidelines.core.ink.hex.toLowerCase())) {
                    return {
                        valid: false,
                        message: "Don't use Orange text on top of dark background",
                        severity: 'critical'
                    };
                }

                // Deep Ink on Ink background
                if (fg === this.colorGuidelines.core.black.hex.toLowerCase() &&
                    bg === this.colorGuidelines.core.ink.hex.toLowerCase()) {
                    return {
                        valid: false,
                        message: "Don't use Deep Ink (#111111) on a Ink (#212121) filled background",
                        severity: 'critical'
                    };
                }

                // Future Light on light backgrounds
                if (this.colorGuidelines.gradients.futureLight.colors.some(color =>
                        color.toLowerCase() === fg) &&
                    (bg === this.colorGuidelines.core.white.hex.toLowerCase() ||
                     bg === this.colorGuidelines.core.gray.hex.toLowerCase())) {
                    return {
                        valid: false,
                        message: "Don't use Future Light on top of light backgrounds. Use Future Dark on text on light background",
                        severity: 'critical'
                    };
                }
            }
        }

        return { valid: true };
    }

    /**
     * Validate color usage in context
     */
    validateColorUsageContext(hex, usage, context) {
        const color = hex.toLowerCase();

        // Check Orange usage limits
        if (color === this.colorGuidelines.core.orange.hex.toLowerCase()) {
            if (usage && !['cta', 'accent', 'highlight'].includes(usage.toLowerCase())) {
                return {
                    valid: false,
                    message: "Orange should be used sparingly - primarily for CTAs, accents, and highlights",
                    suggestion: "Consider using Ink or another core color for this usage"
                };
            }
        }

        // Check gradient usage
        if (this.colorGuidelines.secondary.blue.colors.some(c => c.toLowerCase() === color) ||
            this.colorGuidelines.secondary.softOrange.colors.some(c => c.toLowerCase() === color)) {
            if (usage !== 'background') {
                return {
                    valid: false,
                    message: "Blue and Soft Orange gradients can only be used as backgrounds",
                    suggestion: "Use these colors only for background elements"
                };
            }
        }

        return { valid: true };
    }

    /**
     * Get color recommendations based on context
     */
    getColorRecommendations(context, usage) {
        const recommendations = [];

        switch (context) {
            case 'marketing':
                recommendations.push({
                    type: 'palette_suggestion',
                    message: 'For marketing materials, consider using Ink for headlines, Orange for CTAs, and gradients for backgrounds',
                    colors: [
                        { color: this.colorGuidelines.core.ink.hex, usage: 'Headlines, body text' },
                        { color: this.colorGuidelines.core.orange.hex, usage: 'CTAs, accents' },
                        { gradient: this.colorGuidelines.secondary.blue, usage: 'Backgrounds' }
                    ]
                });
                break;

            case 'product':
                recommendations.push({
                    type: 'palette_suggestion',
                    message: 'For product interfaces, prioritize accessibility with high contrast combinations',
                    colors: [
                        { color: this.colorGuidelines.core.ink.hex, usage: 'Primary text' },
                        { color: this.colorGuidelines.core.gray.hex, usage: 'Secondary text, borders' },
                        { color: this.colorGuidelines.core.white.hex, usage: 'Backgrounds, cards' }
                    ]
                });
                break;

            case 'presentation':
                recommendations.push({
                    type: 'mode_suggestion',
                    message: 'Choose between light and dark modes based on your communication objective',
                    lightMode: 'Use for educational content, highlighting details, addressing customer needs',
                    darkMode: 'Use for big ideas, challenging status quo, launching new concepts'
                });
                break;

            default:
                recommendations.push({
                    type: 'general_guidance',
                    message: 'Follow the 90-10 rule: use core colors (Ink, White, Gray) for 90% of design, accent colors for 10%',
                    ratios: this.colorGuidelines.accent.ratios
                });
        }

        return recommendations;
    }

    /**
     * Get typography recommendations
     */
    getTypographyGuidance(context) {
        return {
            primary: this.typography.primary,
            usage: {
                headlines: "Inter Tight for brand materials, Inter V for product interfaces",
                body: "Inter Tight for brand documents, Inter V for product interfaces - both in sentence case",
                quotes: "Flecha S only",
                labels: "Space Mono for short descriptive text only"
            },
            casing: this.typography.casing,
            accessibility: "Ensure sufficient contrast ratios for all text-background combinations",
            recommendation: context === 'marketing' || context === 'presentation' ?
                "Use Inter Tight for brand materials and marketing content" :
                "Use Inter V for product interfaces and functional content"
        };
    }

    /**
     * Get mode selection guidance
     */
    getModeGuidance(communicationObjective) {
        if (communicationObjective.includes('challenge') ||
            communicationObjective.includes('philosophy') ||
            communicationObjective.includes('launch')) {
            return this.modeGuidelines.darkMode;
        }

        if (communicationObjective.includes('educate') ||
            communicationObjective.includes('highlight') ||
            communicationObjective.includes('address')) {
            return this.modeGuidelines.lightMode;
        }

        return {
            recommendation: 'Choose based on communication objective',
            options: {
                dark: this.modeGuidelines.darkMode,
                light: this.modeGuidelines.lightMode
            }
        };
    }

    /**
     * Validate typography usage against Brex brand guidelines
     */
    validateTypographyUsage(typographySpec = {}) {
        const validation = {
            valid: true,
            critical: [],
            warnings: [],
            recommendations: []
        };

        const { font, weight, tracking, lineSpacing, casing, usage } = typographySpec;

        // Validate font family usage
        if (font) {
            if (font === 'Space Mono' && usage !== 'labels') {
                validation.critical.push({
                    type: 'invalid_font_usage',
                    message: 'Space Mono is reserved for Brand use only, never in Product. Only use for labeling and categorizing information.',
                    severity: 'critical'
                });
                validation.valid = false;
            }

            if (font === 'Flecha Broche M') {
                validation.critical.push({
                    type: 'deprecated_font',
                    message: 'Flecha Broche M has been removed from our visual system. Use Flecha S for quotes only.',
                    severity: 'critical'
                });
                validation.valid = false;
            }

            if (font === 'Flecha S' && usage !== 'quotes') {
                validation.warnings.push({
                    type: 'font_usage_warning',
                    message: 'Flecha S should only be used for quotes or testimonials',
                    severity: 'high'
                });
            }
        }

        // Validate weight usage
        if (weight) {
            if ((weight === 'Semi Bold' || weight === 'Bold') && usage === 'body') {
                validation.warnings.push({
                    type: 'weight_usage_warning',
                    message: "Don't use Semi Bold or Bold for body copy",
                    severity: 'high'
                });
            }

            if (usage === 'headlines' && !['Semi Bold', 'Bold'].includes(weight)) {
                validation.warnings.push({
                    type: 'headline_weight_warning',
                    message: "Don't use weights other than Semi Bold or Bold for headlines",
                    severity: 'high'
                });
            }
        }

        // Validate tracking
        if (font === 'Inter Tight' && tracking && tracking !== '0' && tracking !== 'default') {
            validation.warnings.push({
                type: 'tracking_warning',
                message: "Don't change Inter Tight's tracking; it should be 0 or default",
                severity: 'high'
            });
        }

        // Validate casing
        if (casing) {
            if (font === 'Space Mono' && casing !== 'uppercase') {
                validation.warnings.push({
                    type: 'casing_warning',
                    message: 'Space Mono must always be used in capital case',
                    severity: 'medium'
                });
            }

            if (font !== 'Space Mono' && (casing === 'uppercase' || casing === 'title')) {
                validation.warnings.push({
                    type: 'casing_warning',
                    message: "Don't use all capital letters or title case (except for Space Mono)",
                    severity: 'high'
                });
            }
        }

        // Add recommendations
        if (font === 'Inter Tight') {
            validation.recommendations.push({
                type: 'weight_guidance',
                message: 'Inter Tight weight recommendations',
                weights: this.typography.weights
            });
        }

        return validation;
    }

    /**
     * Validate visual elements usage
     */
    validateVisualElements(elements = []) {
        const validation = {
            valid: true,
            critical: [],
            warnings: [],
            recommendations: []
        };

        if (elements.length === 0) {
            return {
                valid: true,
                message: 'No visual elements specified for validation',
                recommendations: [
                    {
                        type: 'visual_elements_guidance',
                        message: 'Shapes should always be used purposefully, and never as decoration',
                        availableShapes: Object.keys(this.visualElements.graphicShapes.types)
                    }
                ]
            };
        }

        for (const element of elements) {
            const { type, usage, purpose } = element;

            // Validate that shapes are used purposefully
            if (!purpose || purpose === 'decoration') {
                validation.warnings.push({
                    type: 'decorative_usage',
                    message: 'Shapes should always be used purposefully, and never as decoration',
                    element: type,
                    severity: 'medium'
                });
            }

            // Validate shape types
            if (type && !this.visualElements.graphicShapes.types[type]) {
                validation.warnings.push({
                    type: 'unknown_shape',
                    message: `Shape type '${type}' is not in the approved visual elements system`,
                    severity: 'medium',
                    availableTypes: Object.keys(this.visualElements.graphicShapes.types)
                });
            }
        }

        // Add recommendations
        validation.recommendations.push({
            type: 'visual_elements_guidance',
            message: 'Available graphic shapes for purposeful use',
            shapes: this.visualElements.graphicShapes.types
        });

        return validation;
    }

    /**
     * Get Space Mono specific guidance
     */
    getSpaceMonoGuidance() {
        return {
            font: this.typography.secondary.spaceMono,
            usage: 'Labels only - reserved for Brand use, never in Product',
            restrictions: this.typography.secondary.spaceMono.restrictions,
            requirements: [
                'Always use in capital case',
                'Only in small font sizes',
                'Limited amount of words per use',
                'Regular weight only',
                'Track at 0/None'
            ]
        };
    }

    /**
     * Get visual elements guidance
     */
    getVisualElementsGuidance() {
        return {
            purpose: this.visualElements.graphicShapes.purpose,
            usage: this.visualElements.graphicShapes.usage,
            availableShapes: this.visualElements.graphicShapes.types,
            principles: [
                'Use shapes purposefully, never as decoration',
                'Shapes can separate content, provide visual interest, and guide the eye',
                'Fill shapes with core colors or approved gradients',
                'Use shapes to crop images or subtract layout elements'
            ]
        };
    }

    /**
     * Get comprehensive typography validation
     */
    validateComprehensiveTypography(textContent, context) {
        const issues = [];

        // Check against typography restrictions
        for (const restriction of this.typographyRestrictions) {
            // This would need more sophisticated text analysis
            // For now, we provide the guidelines for manual checking
            issues.push({
                category: restriction.category,
                rule: restriction.rule,
                severity: restriction.severity
            });
        }

        return {
            content: textContent,
            context,
            typographyRestrictions: issues,
            recommendations: this.getTypographyGuidance(context)
        };
    }

    /**
     * Get helpful error suggestions
     */
    getSuggestionForError(errorMessage) {
        if (errorMessage.includes('Content is required')) {
            return 'Provide content text to analyze for brand compliance';
        }

        if (errorMessage.includes('contentType')) {
            return 'Specify contentType: button, form, data_display, or feedback';
        }

        if (errorMessage.includes('color')) {
            return 'Check color specifications against Brex brand guidelines';
        }

        if (errorMessage.includes('typography')) {
            return 'Check typography specifications against Brex font guidelines';
        }

        if (errorMessage.includes('visual')) {
            return 'Check visual elements against Brex graphic shapes guidelines';
        }

        return 'Check input parameters and try again';
    }
}

module.exports = { BrandingSkill };