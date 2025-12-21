/**
 * Create Architecture Overview PDF
 * Converts the markdown architecture overview to a professional PDF
 */

const fs = require('fs').promises;
const { spawn } = require('child_process');
const path = require('path');

async function createArchitecturePDF() {
    console.log('📄 Creating Architecture Overview PDF...');
    
    // Create enhanced HTML from markdown for better PDF conversion
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Multi-Agent & Skills Architecture Overview</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            margin: -20px -20px 30px -20px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .subtitle {
            margin-top: 10px;
            opacity: 0.9;
            font-size: 1.1em;
        }
        
        .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        h2 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            font-size: 1.8em;
            margin-top: 30px;
        }
        
        h3 {
            color: #34495e;
            margin-top: 25px;
            font-size: 1.3em;
        }
        
        h4 {
            color: #7f8c8d;
            margin-top: 20px;
        }
        
        .architecture-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        
        .component-box {
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            background: #f8f9fa;
        }
        
        .component-box h4 {
            margin-top: 0;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
            padding-bottom: 8px;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .skill-card {
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 15px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .skill-card h5 {
            margin: 0 0 10px 0;
            color: #2c3e50;
            font-size: 1.1em;
        }
        
        .capability {
            background: #e3f2fd;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            display: inline-block;
            margin: 2px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 0.9em;
        }
        
        th, td {
            border: 1px solid #dee2e6;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background-color: #f1f3f4;
            font-weight: 600;
            color: #2c3e50;
        }
        
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .workflow-box {
            background: linear-gradient(135deg, #667eea22 0%, #764ba244 100%);
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .workflow-step {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .workflow-step::before {
            content: "→";
            color: #667eea;
            font-weight: bold;
            margin-right: 10px;
            margin-left: -20px;
        }
        
        .data-source {
            background: #e8f5e8;
            border: 1px solid #c8e6c8;
            border-radius: 6px;
            padding: 15px;
            margin: 10px 0;
        }
        
        .tech-badge {
            background: #2c3e50;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            display: inline-block;
            margin: 2px;
        }
        
        code {
            background: #f1f3f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .highlight-box h4 {
            margin-top: 0;
            color: #8b4513;
        }
        
        @media print {
            body { font-size: 11pt; }
            .section { page-break-inside: avoid; }
            .header { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Multi-Agent & Skills Architecture</h1>
        <div class="subtitle">Comprehensive Business Intelligence Platform</div>
        <div class="subtitle">Brex • nchua_agents Repository</div>
    </div>

    <div class="section">
        <div class="highlight-box">
            <h4>🎯 Executive Summary</h4>
            <p>The <strong>nchua_agents</strong> repository provides a comprehensive multi-agent system with specialized skills for business intelligence, document processing, and data analysis. This architecture enables automated workflows across diverse data sources and document formats, specifically designed for Brex business operations.</p>
        </div>
    </div>

    <div class="section">
        <h2>🏗️ Architecture Components</h2>
        
        <div class="architecture-grid">
            <div class="component-box">
                <h4>🤖 Multi-Agent System</h4>
                <ul>
                    <li><strong>Granola Meeting Notes Agent</strong><br>Python • Extract #next_steps → Google Docs</li>
                    <li><strong>Solution Consultants Analysis</strong><br>Python • Snowflake data & BI</li>
                    <li><strong>Data Retrieval Agent</strong><br>Snowflake MCP integration</li>
                </ul>
            </div>
            
            <div class="component-box">
                <h4>🔧 Skills System (6 Skills)</h4>
                <ul>
                    <li><strong>Document Processing (5)</strong><br>PDF, Excel, PowerPoint, Word, Universal</li>
                    <li><strong>Data Sources (2)</strong><br>Snowflake, Python Bridge</li>
                    <li><strong>Core Framework</strong><br>Registry, BaseSkill, Integration</li>
                </ul>
            </div>
        </div>

        <h3>📄 Document Processing Skills</h3>
        <div class="skills-grid">
            <div class="skill-card">
                <h5>PDFExtractionSkill</h5>
                <p>DACI templates, structured analysis, table extraction</p>
                <div class="capability">DACI Recognition</div>
                <div class="capability">Multi-Method</div>
            </div>
            <div class="skill-card">
                <h5>ExcelProcessingSkill</h5>
                <p>Multi-sheet analysis, financial validation, CSV processing</p>
                <div class="capability">Financial Intelligence</div>
                <div class="capability">Data Validation</div>
            </div>
            <div class="skill-card">
                <h5>PowerPointExtractionSkill</h5>
                <p>Slide analysis, presentation intelligence, structure analysis</p>
                <div class="capability">Business Intelligence</div>
                <div class="capability">Content Analysis</div>
            </div>
            <div class="skill-card">
                <h5>WordProcessingSkill</h5>
                <p>Contract analysis, document structure, metadata extraction</p>
                <div class="capability">Policy Analysis</div>
                <div class="capability">Structure Detection</div>
            </div>
            <div class="skill-card">
                <h5>UniversalDocumentSkill</h5>
                <p>Auto-detection, batch processing, cross-format analysis</p>
                <div class="capability">9 Formats</div>
                <div class="capability">Batch Processing</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📊 Data Sources Available</h2>
        
        <h3>🏦 Primary Data Sources</h3>
        
        <div class="data-source">
            <h4>Snowflake Data Warehouse</h4>
            <ul>
                <li><strong>Connection:</strong> MCP Server integration with Claude Code</li>
                <li><strong>Authentication:</strong> External browser authentication</li>
                <li><strong>Key Tables:</strong></li>
                <ul>
                    <li><code>coredata.customer.customers_monthly__net_revenue</code></li>
                    <li><code>coredata.salesforce.*</code> (CRM integration)</li>
                    <li><code>coredata.financial.*</code> (Financial metrics)</li>
                    <li><code>coredata.product.*</code> (Product usage data)</li>
                </ul>
            </ul>
        </div>
        
        <div class="data-source">
            <h4>Validated SQL Query Templates</h4>
            <ul>
                <li><strong>Customer Edition Analysis:</strong> SaaS vs Non-SaaS customer analysis</li>
                <li><strong>Customer OBS Analysis:</strong> Analysis by One Brex Segment</li>
                <li><strong>Cross-Sell/Upsell Analysis:</strong> Deal classification and performance</li>
                <li><strong>SC Commission Analysis:</strong> Solutions Consultant performance metrics</li>
            </ul>
        </div>

        <h3>🔗 MCP Server Integrations</h3>
        <table>
            <tr>
                <th>Service</th>
                <th>Purpose</th>
                <th>Integration Type</th>
            </tr>
            <tr>
                <td><strong>Snowflake</strong></td>
                <td>Brex data warehouse access</td>
                <td>MCP Server</td>
            </tr>
            <tr>
                <td><strong>GitHub</strong></td>
                <td>Repository management & workflows</td>
                <td>MCP Server</td>
            </tr>
            <tr>
                <td><strong>Hex</strong></td>
                <td>Advanced analytics platform</td>
                <td>MCP Server</td>
            </tr>
            <tr>
                <td><strong>Filesystem</strong></td>
                <td>Local file system access</td>
                <td>MCP Server</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>🔄 Workflow Possibilities</h2>
        
        <div class="workflow-box">
            <h4>Workflow 1: DACI Decision Analysis</h4>
            <div class="workflow-step">Extract DACI PDF → PDFExtractionSkill</div>
            <div class="workflow-step">Identify decision impact → Business Intelligence</div>
            <div class="workflow-step">Query relevant Snowflake data → SnowflakeRetrievalSkill</div>
            <div class="workflow-step">Generate impact analysis → Multi-format reporting</div>
        </div>
        
        <div class="workflow-box">
            <h4>Workflow 2: Financial Data Validation</h4>
            <div class="workflow-step">Process Excel budget files → ExcelProcessingSkill</div>
            <div class="workflow-step">Extract financial metrics → Business Intelligence</div>
            <div class="workflow-step">Validate against Snowflake → Data correlation</div>
            <div class="workflow-step">Generate variance report → Executive dashboard</div>
        </div>
        
        <div class="workflow-box">
            <h4>Workflow 3: Multi-Format Business Intelligence</h4>
            <div class="workflow-step">Batch process documents → UniversalDocumentSkill</div>
            <div class="workflow-step">Cross-format analysis → Business correlation</div>
            <div class="workflow-step">Strategic data extraction → Snowflake integration</div>
            <div class="workflow-step">Automated insights → Business recommendations</div>
        </div>
    </div>

    <div class="section">
        <h2>🛠 Technology Stack</h2>
        
        <h3>Core Technologies</h3>
        <div>
            <span class="tech-badge">Python 3.8+</span>
            <span class="tech-badge">Node.js 14.0+</span>
            <span class="tech-badge">Snowflake</span>
            <span class="tech-badge">Claude Code MCP</span>
        </div>
        
        <h3>Document Processing</h3>
        <div>
            <span class="tech-badge">PyPDF2</span>
            <span class="tech-badge">pdfplumber</span>
            <span class="tech-badge">python-docx</span>
            <span class="tech-badge">python-pptx</span>
            <span class="tech-badge">pandas</span>
            <span class="tech-badge">openpyxl</span>
        </div>
        
        <h3>Integration & Orchestration</h3>
        <div>
            <span class="tech-badge">MCP Servers</span>
            <span class="tech-badge">Skills Registry</span>
            <span class="tech-badge">Python-Node.js Bridge</span>
            <span class="tech-badge">Business Intelligence Engine</span>
        </div>
    </div>

    <div class="section">
        <h2>📈 Capabilities Matrix</h2>
        
        <table>
            <tr>
                <th>Format</th>
                <th>Skill</th>
                <th>Key Features</th>
                <th>Business Use Cases</th>
            </tr>
            <tr>
                <td><strong>PDF</strong></td>
                <td>PDFExtractionSkill</td>
                <td>DACI recognition, table extraction, metadata</td>
                <td>Decision analysis, report processing</td>
            </tr>
            <tr>
                <td><strong>Excel</strong></td>
                <td>ExcelProcessingSkill</td>
                <td>Multi-sheet analysis, financial validation</td>
                <td>Budget analysis, data validation</td>
            </tr>
            <tr>
                <td><strong>PowerPoint</strong></td>
                <td>PowerPointExtractionSkill</td>
                <td>Slide analysis, presentation intelligence</td>
                <td>Strategic review, content analysis</td>
            </tr>
            <tr>
                <td><strong>Word</strong></td>
                <td>WordProcessingSkill</td>
                <td>Structure analysis, contract intelligence</td>
                <td>Policy review, legal documents</td>
            </tr>
            <tr>
                <td><strong>Universal</strong></td>
                <td>UniversalDocumentSkill</td>
                <td>Auto-detection, batch processing</td>
                <td>Multi-format workflows</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>📊 Management & Monitoring</h2>
        
        <h3>Skills Management Commands</h3>
        <ul>
            <li><code>npm run list-skills</code> - View all available skills by category</li>
            <li><code>npm run health-check</code> - Monitor skill health and availability</li>
            <li><code>npm test</code> - Run integration test suite</li>
        </ul>
        
        <h3>Agent Orchestration Commands</h3>
        <ul>
            <li><code>python agents_orchestrator.py health</code> - Agent health monitoring</li>
            <li><code>python validate_agents.py</code> - Multi-agent validation</li>
            <li><code>python setup_agents.py</code> - Global dependency setup</li>
        </ul>

        <h3>Business Metrics Available</h3>
        <ul>
            <li><strong>Data Analysis:</strong> Customer revenue, SC performance, cross-sell analysis</li>
            <li><strong>Document Intelligence:</strong> Processing success rates, classification accuracy</li>
            <li><strong>Workflow Automation:</strong> Completion rates, performance metrics</li>
        </ul>
    </div>

    <div class="section">
        <div class="highlight-box">
            <h4>🚀 Future Expansion Opportunities</h4>
            <ul>
                <li><strong>Additional Skills:</strong> Email processing, video transcription, advanced OCR</li>
                <li><strong>Enhanced Integrations:</strong> Salesforce deep sync, ML models, workflow automation</li>
                <li><strong>Enterprise Features:</strong> SSO, audit logging, compliance frameworks</li>
            </ul>
        </div>
    </div>

    <footer style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e9ecef; text-align: center; color: #6c757d;">
        <p><strong>Multi-Agent & Skills Architecture</strong> • Generated $(new Date().toLocaleDateString()) • Brex nchua_agents Repository</p>
    </footer>
</body>
</html>`;

    // Write HTML file
    const htmlPath = path.join(__dirname, 'architecture_overview.html');
    await fs.writeFile(htmlPath, htmlContent);
    console.log('✅ HTML file created');

    // Convert to PDF using system tools (if available)
    try {
        console.log('📄 Converting HTML to PDF...');
        
        const pdfPath = path.join(__dirname, 'Multi-Agent_Skills_Architecture_Overview.pdf');
        
        // Try different PDF conversion methods
        const conversionMethods = [
            // Method 1: wkhtmltopdf (if installed)
            {
                command: 'wkhtmltopdf',
                args: [
                    '--page-size', 'A4',
                    '--margin-top', '0.75in',
                    '--margin-right', '0.75in',
                    '--margin-bottom', '0.75in',
                    '--margin-left', '0.75in',
                    '--encoding', 'UTF-8',
                    '--enable-local-file-access',
                    htmlPath,
                    pdfPath
                ]
            },
            // Method 2: Headless Chrome (if available)
            {
                command: 'google-chrome',
                args: [
                    '--headless',
                    '--disable-gpu',
                    '--print-to-pdf=' + pdfPath,
                    '--print-to-pdf-no-header',
                    'file://' + htmlPath
                ]
            }
        ];

        let pdfCreated = false;
        
        for (const method of conversionMethods) {
            try {
                await new Promise((resolve, reject) => {
                    const process = spawn(method.command, method.args);
                    
                    process.on('close', (code) => {
                        if (code === 0) {
                            resolve();
                        } else {
                            reject(new Error(`${method.command} failed with code ${code}`));
                        }
                    });
                    
                    process.on('error', reject);
                });
                
                console.log(`✅ PDF created using ${method.command}: ${pdfPath}`);
                pdfCreated = true;
                break;
                
            } catch (error) {
                console.log(`⚠️ ${method.command} not available: ${error.message}`);
            }
        }
        
        if (!pdfCreated) {
            console.log('⚠️ No PDF conversion tools available. HTML file created instead.');
            console.log('📄 To convert to PDF manually:');
            console.log('   1. Open architecture_overview.html in your browser');
            console.log('   2. Print to PDF using browser print function');
            console.log('   3. Or install wkhtmltopdf: brew install wkhtmltopdf');
        }
        
    } catch (error) {
        console.log('⚠️ PDF conversion failed:', error.message);
        console.log('📄 HTML file created at:', htmlPath);
    }

    // Clean up temporary HTML file if PDF was created successfully
    try {
        const pdfPath = path.join(__dirname, 'Multi-Agent_Skills_Architecture_Overview.pdf');
        const pdfExists = await fs.access(pdfPath).then(() => true).catch(() => false);
        
        if (pdfExists) {
            console.log('🎉 Architecture PDF created successfully!');
            console.log(`📄 Location: ${pdfPath}`);
        }
    } catch (error) {
        // Keep HTML file if PDF creation failed
    }
}

// Run the PDF creation
createArchitecturePDF().catch(console.error);