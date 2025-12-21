/**
 * Hex Dashboard Analysis Skill
 *
 * Analyzes existing Hex dashboards to:
 * - Extract best practices and patterns
 * - Understand visualization choices and data storytelling
 * - Learn business metrics and KPIs used
 * - Extract SQL patterns and data modeling approaches
 * - Document dashboard structure for replication
 */

const { BaseSkill } = require('../core/base_skill');

class HexDashboardAnalysisSkill extends BaseSkill {
    constructor() {
        super(
            'hex-dashboard-analysis',
            'Analyze Hex dashboards to extract best practices, patterns, and business insights',
            ['dashboard_analysis', 'best_practices_extraction', 'visualization_patterns', 'kpi_discovery', 'sql_pattern_analysis']
        );

        this.hexClient = null; // Will be initialized with Hex MCP
        this.analysisCache = new Map(); // Cache analysis results
    }

    async validateParams(params) {
        await super.validateParams(params);

        if (!params.dashboardId && !params.projectId) {
            throw new Error('Either dashboardId or projectId must be provided');
        }

        if (params.analysisType && !['best_practices', 'kpi_extraction', 'sql_patterns', 'visualization_structure', 'full_analysis'].includes(params.analysisType)) {
            throw new Error('Invalid analysis type. Supported: best_practices, kpi_extraction, sql_patterns, visualization_structure, full_analysis');
        }
    }

    async performSkill(params, context) {
        const {
            dashboardId,
            projectId,
            analysisType = 'full_analysis',
            includeSQL = true,
            extractPatterns = true,
            cacheResults = true
        } = params;

        // Check cache first
        const cacheKey = `${dashboardId || projectId}_${analysisType}`;
        if (cacheResults && this.analysisCache.has(cacheKey)) {
            this.logger.info(`Using cached analysis for ${cacheKey}`);
            return this.analysisCache.get(cacheKey);
        }

        let analysis;

        if (dashboardId) {
            analysis = await this.analyzeSingleDashboard(dashboardId, analysisType, includeSQL, extractPatterns);
        } else if (projectId) {
            analysis = await this.analyzeProject(projectId, analysisType, includeSQL, extractPatterns);
        }

        // Cache results if requested
        if (cacheResults) {
            this.analysisCache.set(cacheKey, analysis);
        }

        return analysis;
    }

    /**
     * Analyze a single Hex dashboard
     */
    async analyzeSingleDashboard(dashboardId, analysisType, includeSQL, extractPatterns) {
        // Get dashboard details via Hex MCP
        const dashboardData = await this.getDashboardData(dashboardId);

        const analysis = {
            dashboardId: dashboardId,
            dashboardName: dashboardData.name,
            analysisType: analysisType,
            analyzedAt: new Date().toISOString(),
            insights: {}
        };

        switch (analysisType) {
            case 'best_practices':
                analysis.insights = await this.extractBestPractices(dashboardData);
                break;

            case 'kpi_extraction':
                analysis.insights = await this.extractKPIs(dashboardData);
                break;

            case 'sql_patterns':
                if (includeSQL) {
                    analysis.insights = await this.analyzeSQLPatterns(dashboardData);
                }
                break;

            case 'visualization_structure':
                analysis.insights = await this.analyzeVisualizationStructure(dashboardData);
                break;

            case 'full_analysis':
                analysis.insights = {
                    bestPractices: await this.extractBestPractices(dashboardData),
                    kpis: await this.extractKPIs(dashboardData),
                    sqlPatterns: includeSQL ? await this.analyzeSQLPatterns(dashboardData) : null,
                    visualizationStructure: await this.analyzeVisualizationStructure(dashboardData),
                    patterns: extractPatterns ? await this.extractPatterns(dashboardData) : null
                };
                break;
        }

        return analysis;
    }

    /**
     * Analyze a Hex project (multiple dashboards)
     */
    async analyzeProject(projectId, analysisType, includeSQL, extractPatterns) {
        const projectData = await this.getProjectData(projectId);
        const dashboards = projectData.dashboards || [];

        const analysis = {
            projectId: projectId,
            projectName: projectData.name,
            dashboardCount: dashboards.length,
            analysisType: analysisType,
            analyzedAt: new Date().toISOString(),
            insights: {}
        };

        // Analyze each dashboard in the project
        const dashboardAnalyses = await Promise.all(
            dashboards.map(async (dashboard) => {
                return await this.analyzeSingleDashboard(dashboard.id, analysisType, includeSQL, extractPatterns);
            })
        );

        // Aggregate insights across dashboards
        analysis.insights = this.aggregateProjectInsights(dashboardAnalyses, analysisType);

        return analysis;
    }

    /**
     * Get dashboard data via Hex MCP
     */
    async getDashboardData(dashboardId) {
        // TODO: Replace with actual Hex MCP integration
        // For now, return mock structure
        return {
            id: dashboardId,
            name: 'Territory Performance Dashboard',
            cells: [
                {
                    type: 'sql',
                    query: `
                        SELECT
                            territory,
                            SUM(revenue) as total_revenue,
                            COUNT(DISTINCT customer_id) as customer_count,
                            AVG(deal_size) as avg_deal_size
                        FROM coredata.customer.customers_monthly__net_revenue
                        WHERE date >= '2024-01-01'
                        GROUP BY territory
                        ORDER BY total_revenue DESC
                    `,
                    outputs: ['chart', 'table']
                },
                {
                    type: 'chart',
                    chartType: 'bar',
                    title: 'Revenue by Territory',
                    xAxis: 'territory',
                    yAxis: 'total_revenue',
                    insights: ['West territory leads in revenue', 'Clear performance gaps between territories']
                },
                {
                    type: 'kpi',
                    metrics: [
                        { name: 'Total Revenue', value: '$2.5M', change: '+15%' },
                        { name: 'Avg Deal Size', value: '$45K', change: '+8%' },
                        { name: 'Customer Count', value: '156', change: '+12%' }
                    ]
                }
            ],
            metadata: {
                createdBy: 'data-team@company.com',
                lastUpdated: '2024-12-15',
                tags: ['territory', 'performance', 'revenue']
            }
        };
    }

    /**
     * Get project data via Hex MCP
     */
    async getProjectData(projectId) {
        // TODO: Replace with actual Hex MCP integration
        return {
            id: projectId,
            name: 'Sales Analytics Project',
            dashboards: [
                { id: 'dashboard_1', name: 'Territory Performance' },
                { id: 'dashboard_2', name: 'Customer Segmentation' }
            ]
        };
    }

    /**
     * Extract best practices from dashboard structure
     */
    async extractBestPractices(dashboardData) {
        const bestPractices = {
            dataVisualization: [],
            queryOptimization: [],
            dashboardDesign: [],
            businessLogic: []
        };

        // Analyze cells for best practices
        for (const cell of dashboardData.cells) {
            if (cell.type === 'sql') {
                // SQL best practices
                if (cell.query.includes('WHERE date >=')) {
                    bestPractices.queryOptimization.push('Uses date filtering for performance optimization');
                }

                if (cell.query.includes('GROUP BY')) {
                    bestPractices.queryOptimization.push('Properly aggregates data at appropriate grain');
                }

                if (cell.query.includes('ORDER BY')) {
                    bestPractices.dataVisualization.push('Orders results for better presentation');
                }
            }

            if (cell.type === 'chart') {
                // Visualization best practices
                if (cell.title) {
                    bestPractices.dataVisualization.push('Uses descriptive chart titles');
                }

                if (cell.insights) {
                    bestPractices.dashboardDesign.push('Includes contextual insights with visualizations');
                }
            }

            if (cell.type === 'kpi') {
                // KPI best practices
                if (cell.metrics.every(m => m.change)) {
                    bestPractices.businessLogic.push('Shows trend indicators for KPI metrics');
                }

                if (cell.metrics.length <= 4) {
                    bestPractices.dashboardDesign.push('Limits KPI count for focused attention');
                }
            }
        }

        return bestPractices;
    }

    /**
     * Extract KPIs and business metrics
     */
    async extractKPIs(dashboardData) {
        const kpis = {
            primaryMetrics: [],
            derivedMetrics: [],
            businessContext: []
        };

        for (const cell of dashboardData.cells) {
            if (cell.type === 'kpi') {
                kpis.primaryMetrics.push(...cell.metrics.map(m => ({
                    name: m.name,
                    format: this.inferMetricFormat(m.value),
                    hasChange: !!m.change,
                    category: this.categorizeMetric(m.name)
                })));
            }

            if (cell.type === 'sql') {
                // Extract metrics from SQL
                const sqlMetrics = this.extractMetricsFromSQL(cell.query);
                kpis.derivedMetrics.push(...sqlMetrics);
            }
        }

        // Extract business context from dashboard metadata
        if (dashboardData.metadata && dashboardData.metadata.tags) {
            kpis.businessContext = dashboardData.metadata.tags;
        }

        return kpis;
    }

    /**
     * Analyze SQL patterns for reuse
     */
    async analyzeSQLPatterns(dashboardData) {
        const patterns = {
            commonTables: new Set(),
            commonFilters: [],
            aggregationPatterns: [],
            joinPatterns: [],
            datePatterns: []
        };

        for (const cell of dashboardData.cells) {
            if (cell.type === 'sql' && cell.query) {
                const query = cell.query.toLowerCase();

                // Extract table names
                const tableMatches = query.match(/from\s+([a-z_\.]+)/g);
                if (tableMatches) {
                    tableMatches.forEach(match => {
                        const table = match.replace('from ', '').trim();
                        patterns.commonTables.add(table);
                    });
                }

                // Extract common filter patterns
                if (query.includes("where date >=")) {
                    patterns.datePatterns.push('Relative date filtering');
                }

                if (query.includes("group by")) {
                    const groupByMatch = query.match(/group by\s+([^order\s]+)/);
                    if (groupByMatch) {
                        patterns.aggregationPatterns.push(groupByMatch[1].trim());
                    }
                }

                // Extract aggregation functions
                const aggFunctions = query.match(/\b(sum|count|avg|min|max)\s*\(/g);
                if (aggFunctions) {
                    patterns.aggregationPatterns.push(...aggFunctions.map(f => f.replace('(', '')));
                }
            }
        }

        return {
            commonTables: Array.from(patterns.commonTables),
            commonFilters: patterns.commonFilters,
            aggregationPatterns: patterns.aggregationPatterns,
            joinPatterns: patterns.joinPatterns,
            datePatterns: patterns.datePatterns
        };
    }

    /**
     * Analyze visualization structure
     */
    async analyzeVisualizationStructure(dashboardData) {
        const structure = {
            cellTypes: {},
            layoutPatterns: [],
            chartTypes: {},
            interactivity: []
        };

        // Count cell types
        dashboardData.cells.forEach(cell => {
            structure.cellTypes[cell.type] = (structure.cellTypes[cell.type] || 0) + 1;

            if (cell.type === 'chart') {
                structure.chartTypes[cell.chartType] = (structure.chartTypes[cell.chartType] || 0) + 1;
            }
        });

        // Analyze layout patterns
        const sqlCells = dashboardData.cells.filter(c => c.type === 'sql').length;
        const chartCells = dashboardData.cells.filter(c => c.type === 'chart').length;
        const kpiCells = dashboardData.cells.filter(c => c.type === 'kpi').length;

        if (kpiCells > 0 && chartCells > 0) {
            structure.layoutPatterns.push('KPI-first with supporting visualizations');
        }

        if (sqlCells === chartCells) {
            structure.layoutPatterns.push('One query per visualization pattern');
        }

        return structure;
    }

    /**
     * Extract reusable patterns across all analysis types
     */
    async extractPatterns(dashboardData) {
        return {
            namingConventions: this.analyzeNamingConventions(dashboardData),
            structuralPatterns: this.analyzeStructuralPatterns(dashboardData),
            businessPatterns: this.analyzeBusinessPatterns(dashboardData)
        };
    }

    /**
     * Helper methods
     */

    inferMetricFormat(value) {
        if (value.includes('$')) return 'currency';
        if (value.includes('%')) return 'percentage';
        if (value.match(/^\d+$/)) return 'integer';
        if (value.match(/^\d+\.\d+$/)) return 'decimal';
        return 'text';
    }

    categorizeMetric(name) {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('revenue') || lowerName.includes('sales')) return 'financial';
        if (lowerName.includes('customer') || lowerName.includes('user')) return 'customer';
        if (lowerName.includes('deal') || lowerName.includes('opportunity')) return 'sales';
        return 'operational';
    }

    extractMetricsFromSQL(query) {
        const metrics = [];
        const selectMatches = query.match(/select\s+(.*?)\s+from/is);

        if (selectMatches) {
            const selectClause = selectMatches[1];
            const fields = selectClause.split(',').map(f => f.trim());

            fields.forEach(field => {
                if (field.includes(' as ')) {
                    const alias = field.split(' as ')[1].trim();
                    metrics.push({
                        name: alias,
                        expression: field.split(' as ')[0].trim(),
                        type: 'calculated'
                    });
                }
            });
        }

        return metrics;
    }

    analyzeNamingConventions(dashboardData) {
        // Analyze how tables, columns, and metrics are named
        return {
            tableNamingPattern: 'schema.table.subtable pattern detected',
            metricNamingPattern: 'descriptive_snake_case pattern detected'
        };
    }

    analyzeStructuralPatterns(dashboardData) {
        return {
            cellOrder: 'KPIs -> Charts -> Tables pattern',
            queryStructure: 'Filter -> Aggregate -> Order pattern'
        };
    }

    analyzeBusinessPatterns(dashboardData) {
        return {
            timeFrames: ['current_quarter', 'ytd', 'last_12_months'],
            businessRules: ['exclude test data', 'focus on active customers']
        };
    }

    /**
     * Aggregate insights from multiple dashboard analyses
     */
    aggregateProjectInsights(analyses, analysisType) {
        // Combine insights from multiple dashboards
        // This would implement logic to find common patterns across dashboards
        return {
            summary: `Analyzed ${analyses.length} dashboards in project`,
            commonPatterns: this.findCommonPatterns(analyses),
            recommendations: this.generateRecommendations(analyses)
        };
    }

    findCommonPatterns(analyses) {
        // Find patterns that appear across multiple dashboards
        return ['Date filtering is consistently used', 'Territory grouping is common pattern'];
    }

    generateRecommendations(analyses) {
        // Generate recommendations based on analysis
        return ['Standardize date filter patterns', 'Create reusable territory analysis template'];
    }
}

module.exports = HexDashboardAnalysisSkill;