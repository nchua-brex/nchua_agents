# Brex Data Hierarchy and Source Priority Guide

## Overview
Brex uses a sophisticated "Source of Truth" (SoT) rollup system for data governance. This guide explains the hierarchy, priorities, and implications for SQL queries.

## 🏗️ Architecture Pattern

### Core Components
1. **SoT Fields**: `Brex_[Field]__c` - Formula fields, locked, not editable
2. **Override Fields**: `SFDC_Override_[Field]__c` - Manual corrections by admins/managers
3. **Source Fields**: Multiple data sources with priority ordering (0=highest)

### Governance Principle
**Manual overrides trump all automated sources**
- Escalation: File #frontline ticket or report to manager for corrections

## 🎯 Employee Count Hierarchy (CONFIRMED)

### Source of Truth
```sql
-- CORRECT FIELD - Use this for analysis
Brex_EE_Count_number__c  -- SoT, not editable
```

### Full Hierarchy (Order 0-8)
```
0. Brex_EE_Count_number__c (SoT - Formula rollup)
   ├── Retool_Override_EE_Count__c (Admin only)
   ├── 1. SFDC_Override_Employee_Count__c (Admin/Manager)
   ├── 2. OBS_EE_Count__c
   ├── 3. ZoomInfo_EE_Count__c (Excludes part-time/contract)
   ├── 4. Harmonic_EE_Count__c
   ├── 5. LinkedIn_EE_Count__c
   ├── 6. Clay_EE_Count__c (Contact: summer_lindman@brex.com)
   ├── 7. Signup_Employee_Count_Range__c (Range-based: 21_to_50 → 50)
   └── 8. NumberOfEmployees (DEPRECATED - DO NOT USE)
```

## 📊 Other Key Hierarchies

### Website Hierarchy
```sql
Brex_Website_url__c (SoT)
├── SFDC_Override_Website__c
├── KYC_URL__c (Verified after manual review)
├── Signup_Company_URL__c (Product)
├── LLM_website__c (AI-determined)
├── ZoomInfo_Website__c
├── Harmonic_Website__c
├── LinkedIn_Website__c
├── Clay_Website__c
└── Website (Standard - new account creation)
```

### Industry Hierarchy
```sql
Brex_Industry__c (SoT)
├── SFDC_Override_Industry__c
├── ZoomInfo_Industry__c
├── Harmonic_Industry__c
├── LinkedIn_Industry__c
├── Signup_Company_Industry__c
└── Clay_Industry__c
```

### Revenue Hierarchy
```sql
Brex_Revenue_currency__c (SoT)
├── SFDC_Override_Revenue__c
├── ZoomInfo_raw_revenue_data__c (Millions USD)
├── Clay_Revenue__c
└── LinkedIn_Revenue__c
```

## 🗺️ Address Fields Pattern
All address components follow the same hierarchy:
- `Brex_Street_text__c`, `Brex_City_text__c`, `Brex_State_text__c`, `Brex_Country_text__c`, `Brex_Zip_text__c`

### Company Size Logic
```sql
-- Address source priority depends on company size
IF ZoomInfo_EE_Count > 50:
    ZoomInfo is secondary source (Order 2)
    BrAD Product data is Order 3
ELSE:
    BrAD Product data is Order 2
    ZoomInfo is Order 3
```

## 🔍 Special Business Logic Fields

### E-commerce Detection
```sql
Brex_Is_Ecommerce__c (SoT)
├── SFDC_Override_Is_Ecommerce__c
├── LLM_Is_Ecommerce__c (AI web scraper)
├── Clay_Is_Ecommerce__c
└── Is_Ecommerce_2__c (Legacy calculation)
```

### PE-Backing Analysis
```sql
Brex_Is_PE_Backed__c (SoT)
├── SFDC_Override_Is_PE_Backed__c (Editable by all)
├── Snowflake_Is_PE_Backed__c (Calculated in Snowflake)
└── Harmonic_Is_PE_Backed__c (From funding type)

-- Investors field concatenates sources
Brex_PE_Investors__c = SFDC_Override_PE_Investors__c + Snowflake_PE_Investors
```

## 🎯 Data Source Characteristics

### Manual Overrides (Highest Authority)
- **Authority**: Trumps all automated sources
- **Editability**: Admin/Manager only (except PE fields)
- **Process**: File #frontline ticket or contact manager

### ZoomInfo (Order 2-3)
- **Strengths**: Comprehensive B2B data, intent signals, growth metrics
- **Coverage**: High for established companies
- **Limitations**: May exclude part-time/contract employees

### Harmonic (Order 3-4)
- **Strengths**: High quality B2B data, funding information
- **PE Logic**: Private_Equity or LBO_Buyout funding types

### LinkedIn (Order 4-5)
- **Strengths**: Professional network data, verified profiles
- **Coverage**: Good for contact information and job titles

### Clay (Order 5-6)
- **Strengths**: Multi-source aggregator, flexible data providers
- **Contact**: summer_lindman@brex.com for source investigation

### Product/BrAD (Order 7)
- **Strengths**: Internal signup and customer data
- **Priority Logic**: Higher priority for smaller companies (<50 EE)

### Legacy Fields (Order 8+)
- **Status**: DEPRECATED
- **Examples**: NumberOfEmployees, BillingAddress, standard address fields
- **Replacement**: Use hierarchy system instead

## 📝 SQL Query Implications

### ✅ Best Practices
```sql
-- ALWAYS use SoT fields for analysis
SELECT
    cw.customer_account_id,
    sf.Brex_EE_Count_number__c as employee_count,    -- SoT field
    sf.Brex_Industry__c as industry,                 -- SoT field
    sf.Brex_Website_url__c as website,               -- SoT field
    sf.Brex_Revenue_currency__c as revenue          -- SoT field
FROM coredata.customer.customer_wide cw
LEFT JOIN fivetran.salesforce.account sf ON ...
```

### 🔍 Data Quality Analysis
```sql
-- Compare SoT vs source fields for data quality
SELECT
    cw.customer_account_id,
    sf.Brex_EE_Count_number__c as sot_employee_count,
    sf.ZoomInfo_EE_Count__c as zoominfo_count,
    sf.LinkedIn_EE_Count__c as linkedin_count,
    sf.SFDC_Override_Employee_Count__c as manual_override,
    CASE
        WHEN sf.SFDC_Override_Employee_Count__c IS NOT NULL THEN 'Manual Override'
        WHEN ABS(sf.Brex_EE_Count_number__c - sf.ZoomInfo_EE_Count__c) > 50 THEN 'Large Source Variance'
        ELSE 'Aligned'
    END as data_quality_flag
FROM coredata.customer.customer_wide cw
LEFT JOIN fivetran.salesforce.account sf ON ...
```

### ❌ Avoid These Fields
```sql
-- DEPRECATED - Don't use these legacy fields
sf.NumberOfEmployees              -- Use Brex_EE_Count_number__c
sf.BillingStreet                 -- Use Brex_Street_text__c
sf.BillingCity                   -- Use Brex_City_text__c
sf.BillingState                  -- Use Brex_State_text__c
sf.BillingCountry                -- Use Brex_Country_text__c
sf.BillingPostalCode             -- Use Brex_Zip_text__c
```

### 🔄 Override Monitoring
```sql
-- Monitor manual overrides for data quality insights
SELECT
    COUNT(*) as accounts_with_overrides,
    COUNT(*) FILTER (WHERE SFDC_Override_Employee_Count__c IS NOT NULL) as ee_overrides,
    COUNT(*) FILTER (WHERE SFDC_Override_Industry__c IS NOT NULL) as industry_overrides,
    COUNT(*) FILTER (WHERE SFDC_Override_Website__c IS NOT NULL) as website_overrides
FROM fivetran.salesforce.account
WHERE is_deleted = FALSE;
```

## 📞 Escalation Contacts

### Data Quality Issues
- **General**: File #frontline ticket
- **Manager escalation**: Report to direct manager
- **Clay data**: summer_lindman@brex.com
- **LLM/Snowflake**: #data-help channel

### Field-Specific Contacts
- **PE Analysis**: #data-help channel
- **E-commerce Classification**: #data-help channel
- **Clay Integration**: summer_lindman@brex.com

## 🎯 Key Takeaways for Analysis

1. **Always use SoT fields** (`Brex_[Field]__c`) for business analysis
2. **Avoid legacy fields** (NumberOfEmployees, BillingAddress, etc.)
3. **Monitor override fields** for data quality insights
4. **Understand source priorities** for data lineage analysis
5. **Use company size logic** for address field prioritization
6. **Leverage hierarchy** for comprehensive data quality reporting