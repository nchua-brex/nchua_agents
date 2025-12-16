# Data Retrieval Agent

A specialized subagent for executing Snowflake queries and retrieving business data using MCP integration.

## Purpose

This agent handles all data retrieval tasks from Snowflake, providing:
- Templated SQL queries for common business objectives
- Dynamic parameter injection for flexible queries  
- Structured data output in multiple formats
- Error handling and retry logic
- Query performance optimization

## Key Features

- **MCP Integration**: Uses Snowflake MCP for secure connections
- **Query Templates**: Pre-built queries for common business scenarios
- **Flexible Output**: CSV, JSON, DataFrame formats
- **Business Logic**: Built-in understanding of Brex data schema
- **Testing Framework**: Comprehensive testing for reliability

## Usage

```python
from agents.data_retrieval import DataRetrievalAgent

# Initialize agent
agent = DataRetrievalAgent()

# Execute business query
result = agent.get_customer_revenue_data(
    start_date="2024-01-01",
    end_date="2024-12-31",
    segment="enterprise"
)

# Get territory performance
territory_data = agent.get_territory_performance(
    sc_owner="john.doe@brex.com",
    period="Q4"
)
```

## Configuration

See `config.yaml` for Snowflake connection settings and query templates.

## Testing

```bash
cd agents/data_retrieval
python -m pytest tests/
```

## Dependencies

- snowflake-connector-python
- pandas
- pyyaml
- pytest (for testing)