#!/usr/bin/env python3
"""
Generate SaaS TAM Analysis PDF Report
"""

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
except ImportError:
    print("reportlab not installed. Installing...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "reportlab"])
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT

def create_pdf():
    doc = SimpleDocTemplate("SAAS_TAM_ANALYSIS.pdf", pagesize=letter,
                           rightMargin=50, leftMargin=50,
                           topMargin=50, bottomMargin=50)
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=12,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#666666'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2c5aa0'),
        spaceBefore=20,
        spaceAfter=10
    )
    
    # Title
    story.append(Paragraph("SaaS TAM Analysis - FY26", title_style))
    story.append(Paragraph("Date: December 10, 2025 | Total Active Customers: 35,181 | Current SaaS Penetration: 5.3%", subtitle_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Market Overview
    story.append(Paragraph("📊 Market Overview", heading_style))
    overview_data = [
        ['TOTAL ADDRESSABLE MARKET'],
        [''],
        ['35,181 Total Customers'],
        ['├─ 1,870 (5.3%) → Using SaaS Today'],
        ['└─ 33,311 (94.7%) → TAM OPPORTUNITY 🎯'],
    ]
    overview_table = Table(overview_data, colWidths=[6*inch])
    overview_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1a1a1a')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOX', (0, 0), (-1, -1), 1, colors.grey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Segment Performance Summary
    story.append(Paragraph("🎯 Segment Performance Summary", heading_style))
    segment_data = [
        ['Segment', 'Total', 'SaaS', 'TAM Opp', 'Penetration', 'Avg EE', 'Avg GMV'],
        ['Enterprise', '611', '277', '334', '45.3% 🟢', '2,752', '$1.32M'],
        ['Mid-Market', '1,425', '467', '958', '32.8% 🟡', '168', '$275K'],
        ['Growth', '598', '116', '482', '19.4% 🟡', '66', '$141K'],
        ['BSC', '5,569', '510', '5,059', '9.2% 🔴', '67', '$47K'],
        ['Unassigned', '25,711', '442', '25,269', '1.7% 🔴', '149', '$3K'],
    ]
    segment_table = Table(segment_data, colWidths=[1.2*inch, 0.7*inch, 0.7*inch, 0.8*inch, 1*inch, 0.7*inch, 0.8*inch])
    segment_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
    ]))
    story.append(segment_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Strategic Priorities
    story.append(Paragraph("💡 Strategic Priorities", heading_style))
    
    priorities_data = [
        ['🥇 PRIORITY 1: Mid-Market Expansion'],
        ['TAM Opportunity: 958 customers'],
        ['Current Penetration: 33% (proven fit)'],
        ['Avg GMV: $275K/month'],
        ['Action: Launch targeted conversion campaigns'],
    ]
    priorities_table = Table(priorities_data, colWidths=[6*inch])
    priorities_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8f4f8')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1a1a1a')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOX', (0, 0), (-1, -1), 1, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(priorities_table)
    story.append(Spacer(1, 0.15*inch))
    
    priorities_data2 = [
        ['🥈 PRIORITY 2: Enterprise Completion'],
        ['TAM Opportunity: 334 customers'],
        ['Current Penetration: 45% (best-in-class)'],
        ['Avg GMV: $1.32M/month'],
        ['Action: White-glove sales program'],
    ]
    priorities_table2 = Table(priorities_data2, colWidths=[6*inch])
    priorities_table2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8f4f8')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1a1a1a')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOX', (0, 0), (-1, -1), 1, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(priorities_table2)
    story.append(Spacer(1, 0.15*inch))
    
    priorities_data3 = [
        ['🥉 PRIORITY 3: Growth Activation'],
        ['TAM Opportunity: 482 customers'],
        ['Current Penetration: 19% (underserved)'],
        ['Avg GMV: $141K/month'],
        ['Action: Growth-focused marketing plays'],
    ]
    priorities_table3 = Table(priorities_data3, colWidths=[6*inch])
    priorities_table3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8f4f8')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1a1a1a')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOX', (0, 0), (-1, -1), 1, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(priorities_table3)
    story.append(Spacer(1, 0.3*inch))
    
    # High-Value Conversion Targets
    story.append(Paragraph("🔍 High-Value Conversion Targets (>50% SaaS Penetration)", heading_style))
    conversion_data = [
        ['EE Range', 'GMV Range', 'Segment', 'Penetration', 'Available'],
        ['251-500', '$100-120K', 'Growth', '64.7%', '6'],
        ['>1,000', '$120-200K', 'Enterprise', '60.0%', '12'],
        ['>1,000', '$200-600K', 'Enterprise', '59.4%', '28'],
        ['251-500', '>$600K', 'Enterprise', '59.2%', '20'],
        ['501-1000', '>$600K', 'Enterprise', '58.5%', '17'],
        ['251-500', '$200-600K', 'Mid-Market', '55.4%', '50'],
    ]
    conversion_table = Table(conversion_data, colWidths=[1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1*inch])
    conversion_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
    ]))
    story.append(conversion_table)
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("<i>Key Insight: Customers with 250+ employees + $100K+ GMV = ideal conversion profile</i>", 
                          ParagraphStyle('Insight', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#666666'))))
    story.append(Spacer(1, 0.3*inch))
    
    # Recommended Actions
    story.append(Paragraph("🚀 Recommended Actions", heading_style))
    actions_data = [
        ['Timeline', 'Action', 'Target', 'Expected Impact'],
        ['Q1', 'Launch Mid-Market conversion campaign', '958 customers', 'High ROI, proven fit'],
        ['Q1', 'Enterprise white-glove program', '334 customers', 'Highest ARPU'],
        ['Q2', 'Growth segment activation', '482 customers', 'Strong upside'],
        ['Q2-Q3', 'Research BSC barriers', '5,059 customers', 'Largest TAM'],
        ['Q3-Q4', 'Develop simplified SaaS tier for BSC', '5,059 customers', 'Unlock volume'],
    ]
    actions_table = Table(actions_data, colWidths=[0.8*inch, 2.2*inch, 1.2*inch, 1.6*inch])
    actions_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(actions_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Key Questions
    story.append(Paragraph("📋 Key Questions to Answer", heading_style))
    questions = [
        "1. Why is BSC penetration only 9%? (5,059 customer opportunity)<br/>   - Price sensitivity? Feature mismatch? Self-service needs?",
        "2. What drives 45% Enterprise adoption?<br/>   - Use as playbook for other segments",
        "3. How can we accelerate Mid-Market?<br/>   - 958 qualified customers, 33% already converted"
    ]
    for q in questions:
        story.append(Paragraph(q, ParagraphStyle('Question', parent=styles['Normal'], fontSize=9, leftIndent=10, spaceAfter=8)))
    
    # Build PDF
    doc.build(story)
    print("✅ PDF generated successfully: SAAS_TAM_ANALYSIS.pdf")

if __name__ == "__main__":
    create_pdf()

