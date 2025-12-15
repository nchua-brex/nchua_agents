# Solutions Consultant Attainment Analysis 📊

An intelligent Snowflake data extraction and analysis system for Solutions Consultant performance and customer revenue analysis.

## 🎯 Overview

This project provides a comprehensive toolkit for analyzing Solutions Consultant attainment and customer performance using Brex's Snowflake data warehouse. The system includes an intelligent agent that learns from your SQL patterns and optimizes data extraction for recurring analysis tasks.

### Key Features

- **🤖 Intelligent Data Agent**: Learns from your SQL queries and improves methodology
- **📈 Customer Revenue Analysis**: SaaS vs Non-SaaS segmentation and performance metrics
- **🎯 Territory Analysis**: Solutions Consultant performance and territory insights
- **📅 Cohort Analysis**: Customer lifecycle and retention patterns
- **🔄 Query Pattern Learning**: Automatically learns and optimizes from successful queries
- **📤 Automated Exports**: CSV exports with metadata and audit trails
- **⚡ Performance Optimization**: Built-in query optimization for Snowflake best practices

## 📁 Project Structure

```
Solutions Consultant Attainment/
├── 📖 Documentation
│   ├── CLAUDE.md                           # Project context for Claude
│   ├── SNOWFLAKE_SCHEMA.md                 # Comprehensive schema documentation
│   ├── SNOWFLAKE_MCP_TROUBLESHOOTING.md   # Snowflake MCP setup guide
│   └── README.md                           # This file
├── 🔍 Reference Materials
│   ├── reference_queries.sql               # Validated SQL patterns from data team
│   └── customer_base_raw_data.sql          # Raw customer data queries
├── 🤖 Agent System
│   ├── snowflake_data_agent.py             # Core intelligent data agent
│   ├── run_analysis.py                     # User-friendly CLI interface
│   ├── snowflake_agent_config.yaml        # Agent configuration
│   └── requirements.txt                    # Python dependencies
├── 📊 Analysis Scripts
│   ├── create_segment_mapping.py           # Customer segmentation utilities
│   ├── run_segment_analysis.py             # Segment analysis automation
│   └── pure_segmentation_check_OLD.sql    # Legacy segmentation queries
├── 📈 Data Exports
│   ├── results.csv                         # Analysis results
│   ├── saas_tam_matrix.csv                # SaaS TAM analysis
│   ├── saas_tam_summary.csv               # SaaS TAM summary
│   └── data_extracts/                      # Generated exports directory
└── 📋 Reports
    └── SAAS_TAM_ANALYSIS.pdf               # TAM analysis report
```

## 🚀 Quick Start

### 1. Prerequisites

- **Snowflake CLI**: Install from [Snowflake Documentation](https://docs.snowflake.com/en/developer-guide/snowflake-cli/installation/installation)
- **Python 3.8+**: With pip package manager
- **Snowflake MCP**: Configured in Claude Code (see troubleshooting guide)

### 2. Installation

```bash
# Install Python dependencies
pip install -r requirements.txt

# Make scripts executable
chmod +x snowflake_data_agent.py
chmod +x run_analysis.py
```

### 3. Configuration

The agent uses `snowflake_agent_config.yaml` for configuration. Default settings should work out of the box, but you can customize:

```yaml
# Key settings
default_warehouse: "COMPUTE_XSMALL_WH"
default_role: "BREX_NCHUA"
output_directory: "./data_extracts"
default_date_range_months: 3
```

## 💻 Usage Examples

### Basic Customer Revenue Analysis

```bash
# Analyze customer revenue by edition (SaaS vs Non-SaaS)
python run_analysis.py customer-revenue --export

# Include One Brex Segment analysis
python run_analysis.py customer-revenue --include-obs --months 6 --export
```

### Solutions Consultant Territory Analysis

```bash
# Analyze all SC territories
python run_analysis.py sc-territories --export

# Analyze specific territories
python run_analysis.py sc-territories "John Smith" "Jane Doe" --months 6 --export
```

### Cohort Analysis

```bash
# Year-over-year cohort analysis
python run_analysis.py cohorts --period year --export

# Quarterly cohort analysis
python run_analysis.py cohorts --period quarter --months 12 --export
```

### Custom Query Execution

```bash
# Execute a custom query
python run_analysis.py custom --query "SELECT * FROM coredata.customer.customer_wide LIMIT 10" --export

# Execute query from file
python run_analysis.py custom --file my_analysis.sql --description "Pipeline Analysis" --export
```

### Query Pattern Learning

```bash
# Learn a new query pattern for reuse
python run_analysis.py learn-query \
  --name "pipeline_revenue_analysis" \
  --description "Analyze pipeline vs current customer revenue" \
  --file pipeline_analysis.sql \
  --category "revenue_analysis" \
  --parameters "months_back" "territory"
```

### Pattern Management

```bash
# List all available query patterns
python run_analysis.py list-patterns

# List patterns by category
python run_analysis.py list-patterns --category customer_segmentation

# Show schema information
python run_analysis.py schema
```

## 🧠 Intelligent Agent Features

### 1. Query Pattern Learning

The agent automatically learns from successful queries and stores them for reuse:

```python
# The agent learns patterns like this
agent = SnowflakeDataAgent()

# Execute and learn from custom queries
result = agent.execute_custom_query(your_sql, "Custom Analysis")

# Explicitly teach new patterns
agent.learn_new_query(
    name="territory_pipeline_analysis",
    description="Analyze SC territory pipeline performance",
    sql=complex_pipeline_query,
    category="territory_analysis",
    parameters=["territory_owner", "months_back"]
)
```

### 2. Performance Optimization

The agent automatically optimizes queries using Snowflake best practices:

- Adds proper customer filters (`internal_account_type = 'customer_account'`)
- Optimizes date range filtering
- Suggests query improvements
- Tracks performance metrics

### 3. Methodology Improvement

The system tracks query success rates and suggests improvements:

```python
# View pattern performance
patterns = agent.get_available_patterns()
for pattern in patterns:
    print(f"{pattern['name']}: {pattern['success_rate']:.1%} success rate")
```

## 📊 Key Analysis Types

### Customer Revenue Analysis

Analyzes revenue metrics by customer edition:

- **SaaS Customers**: Premium Edition, Enterprise Edition
- **Non-SaaS Customers**: Essentials Edition variants
- **Metrics**: Net revenue, SaaS revenue, GMV, customer counts
- **Segmentation**: By OBS (One Brex Segment) and employee count

### Territory Analysis

Solutions Consultant performance metrics:

- Customer counts by territory
- Revenue attribution (L3M, L6M, L12M)
- SaaS vs Non-SaaS customer mix
- Territory coverage and segment distribution

### Cohort Analysis

Customer lifecycle and retention analysis:

- Acquisition cohort performance
- Revenue evolution by vintage
- Customer retention patterns
- Product adoption trends

## 📋 Data Schema Reference

### Key Tables

| Table | Purpose | Join Key |
|-------|---------|----------|
| `coredata.customer.customer_wide` | Master customer data | `customer_account_id` |
| `coredata.customer.customers_monthly__net_revenue` | Monthly revenue by customer | `customer_account_id` |
| `coredata.salesforce.accounts` | Salesforce account data | `customer_account_id` |
| `coredata.salesforce.opportunities` | Sales pipeline | `salesforce_account_id` |
| `coredata.cash.cash_customer__wide` | Cash/deposits data | `customer_account_id` |

### Essential Filters

```sql
-- Active customers only
WHERE internal_account_type = 'customer_account'
  AND status = 'active'

-- SaaS customers
AND empower_edition IN ('Premium Edition', 'Enterprise Edition')

-- Non-SaaS customers
AND empower_edition LIKE '%Essentials%'

-- Last 3 months revenue
AND report_month_date >= DATEADD('month', -3, DATE_TRUNC('month', CURRENT_DATE))
AND report_month_date < DATE_TRUNC('month', CURRENT_DATE)
```

## 🔧 Advanced Usage

### Python API

```python
from snowflake_data_agent import SnowflakeDataAgent

# Initialize agent
agent = SnowflakeDataAgent()

# Run specific analyses
revenue_data = agent.extract_customer_revenue_by_edition(months_back=6)
territory_data = agent.generate_solutions_consultant_analysis(['John Smith'])
cohort_data = agent.extract_cohort_analysis(months_back=12, cohort_period='quarter')

# Export results
agent.export_to_csv(revenue_data, 'q4_revenue_analysis.csv')

# Learn from new queries
agent.learn_new_query(
    name="custom_metric",
    sql=your_sql,
    category="metrics"
)
```

### Configuration Customization

Edit `snowflake_agent_config.yaml`:

```yaml
# Custom output directory
output_directory: "/path/to/your/exports"

# Query optimization settings
performance:
  use_query_caching: true
  optimize_joins: true
  parallel_execution: true

# Learning settings
methodology_improvement:
  auto_learn_successful_queries: true
  min_success_rate_threshold: 0.9
```

## 🐛 Troubleshooting

### Snowflake Connection Issues

1. **MCP Configuration**: See `SNOWFLAKE_MCP_TROUBLESHOOTING.md` for detailed setup guide
2. **Authentication**: Ensure browser SSO is configured correctly
3. **Permissions**: Verify access to `COREDATA` database and required schemas

### Query Execution Issues

```bash
# Check agent logs
tail -f snowflake_agent.log

# Test basic connectivity
python run_analysis.py custom --query "SELECT CURRENT_USER(), CURRENT_ROLE(), CURRENT_WAREHOUSE()"

# Verify schema access
python run_analysis.py schema
```

### Common Error Solutions

| Error | Solution |
|-------|----------|
| `snow: command not found` | Install Snowflake CLI |
| `Authentication failed` | Check MCP browser SSO setup |
| `Permission denied` | Verify database/schema access |
| `Query timeout` | Increase timeout in config file |

## 📈 Performance Tips

1. **Use Date Filters**: Always limit query scope with date ranges
2. **Filter Early**: Apply customer filters (`internal_account_type`, `status`) early
3. **Optimize Joins**: Use appropriate join types and keys
4. **Warehouse Size**: Use larger warehouses for complex queries
5. **Query Caching**: Enable caching for repeated analyses

## 🤝 Contributing

### Adding New Analysis Patterns

1. Create SQL query following existing patterns
2. Use the learning system: `python run_analysis.py learn-query`
3. Test with various parameters
4. Document in appropriate category

### Best Practices

- Always include standard customer filters
- Use consistent naming conventions
- Add comprehensive descriptions
- Test with different date ranges
- Validate results against known metrics

## 📚 Additional Resources

- **Schema Documentation**: `SNOWFLAKE_SCHEMA.md`
- **Reference Queries**: `reference_queries.sql`
- **MCP Setup Guide**: `SNOWFLAKE_MCP_TROUBLESHOOTING.md`
- **Snowflake Best Practices**: [Snowflake Documentation](https://docs.snowflake.com/en/user-guide/queries-best-practices)

## 📝 License

This project is internal to Brex and follows company data governance policies.

---

**Need Help?** Check the troubleshooting guide or contact the data team for Snowflake access issues.