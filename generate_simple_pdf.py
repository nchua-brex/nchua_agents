#!/usr/bin/env python3
"""
Generate Simple SaaS TAM Analysis PDF Report - Just the table
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER

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
        fontSize=18,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    # Title
    story.append(Paragraph("SaaS TAM Analysis - Segment Performance Summary", title_style))
    
    # Segment Performance Summary
    segment_data = [
        ['Segment', 'Total\nCustomers', 'SaaS\nCustomers', 'TAM\nOpportunity', 'SaaS\nPenetration', 'Avg\nEmployees', 'Avg L3M\nSaaS Revenue'],
        ['Enterprise', '611', '277', '334', '45.3%', '2,752', '$1,002'],
        ['Mid-Market', '1,425', '467', '958', '32.8%', '168', '$265'],
        ['Growth', '598', '116', '482', '19.4%', '66', '$90'],
        ['BSC', '5,569', '510', '5,059', '9.2%', '67', '$30'],
        ['Unassigned', '25,711', '442', '25,269', '1.7%', '149', '$3'],
        ['Unknown', '1,267', '58', '1,209', '4.6%', '120', '-'],
    ]
    
    segment_table = Table(segment_data, colWidths=[1.1*inch, 0.9*inch, 0.9*inch, 0.9*inch, 0.9*inch, 0.9*inch, 1*inch])
    segment_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        
        # Data rows
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
        
        # Highlight TAM Opportunity column
        ('FONTNAME', (3, 1), (3, -1), 'Helvetica-Bold'),
        
        # Padding
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    story.append(segment_table)
    
    # Build PDF
    doc.build(story)
    print("✅ PDF generated successfully: SAAS_TAM_ANALYSIS.pdf")

if __name__ == "__main__":
    create_pdf()
