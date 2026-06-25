"""Service for generating or parsing PDFs."""
from io import BytesIO
from datetime import datetime
from fastapi import HTTPException
import logging

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.models.trip import TripResponse

logger = logging.getLogger(__name__)

def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 9)
    page_num = canvas.getPageNumber()
    text = f"Page {page_num}"
    canvas.setFillColor(colors.HexColor("#6C63FF"))
    canvas.drawRightString(7.5 * inch, 0.5 * inch, text)
    canvas.restoreState()

class PDFService:
    @staticmethod
    def generate_trip_pdf(trip: TripResponse) -> bytes:
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter,
            rightMargin=72, leftMargin=72,
            topMargin=72, bottomMargin=72
        )
        
        styles = getSampleStyleSheet()
        accent_color = colors.HexColor("#6C63FF")
        
        title_style = ParagraphStyle(
            'TitleStyle', 
            parent=styles['Heading1'], 
            fontName='Helvetica-Bold', 
            fontSize=28, 
            textColor=accent_color,
            alignment=1,
            spaceAfter=20
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Heading2'],
            fontName='Helvetica',
            fontSize=18,
            alignment=1,
            spaceAfter=30
        )
        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=16,
            textColor=accent_color,
            spaceBefore=15,
            spaceAfter=10
        )
        subheader_style = ParagraphStyle(
            'SubHeaderStyle',
            parent=styles['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=colors.darkgrey,
            spaceBefore=10,
            spaceAfter=10
        )
        normal_style = styles['Normal']
            
        elements = []
        
        # Cover
        elements.append(Paragraph("WanderWay", title_style))
        elements.append(Spacer(1, 1*inch))
        
        dest = trip.destination or "Your Trip"
        
        elements.append(Paragraph(f"Trip to {dest}", title_style))
        if trip.start_date and trip.end_date:
            elements.append(Paragraph(f"{trip.start_date} to {trip.end_date}", subtitle_style))
            
        date_str = datetime.now().strftime("%B %d, %Y")
        elements.append(Paragraph(f"Generated on {date_str}", ParagraphStyle(
            'DateStyle', parent=styles['Normal'], alignment=1, textColor=colors.grey
        )))
        
        elements.append(PageBreak())
        
        # Daily Itinerary
        for day_info in trip.itinerary:
            day_num = day_info.day_number
            theme = day_info.theme or ""
            
            day_title = f"Day {day_num}"
            if theme:
                day_title += f": {theme}"
                
            elements.append(Paragraph(day_title, header_style))
            
            # Group activities by time string natively or just list them
            for act in day_info.activities:
                time_str = act.time or "Anytime"
                elements.append(Paragraph(time_str.capitalize(), subheader_style))
                
                name = act.title or "Activity"
                desc = act.description or ""
                cost = f"${act.estimated_cost}" if act.estimated_cost is not None else "Free"
                
                card_data = [
                    [Paragraph(f"<b>{name}</b>", normal_style), Paragraph(f"<i>Cost: {cost}</i>", ParagraphStyle('RightAlign', parent=normal_style, alignment=2))],
                    [Paragraph(desc, normal_style), ""]
                ]
                
                t = Table(card_data, colWidths=[4*inch, 1.5*inch])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.whitesmoke),
                    ('BOX', (0,0), (-1,-1), 1, accent_color),
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('SPAN', (0,1), (1,1)), 
                    ('TOPPADDING', (0,0), (-1,-1), 8),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                    ('LEFTPADDING', (0,0), (-1,-1), 10),
                    ('RIGHTPADDING', (0,0), (-1,-1), 10),
                ]))
                elements.append(KeepTogether([t, Spacer(1, 0.2*inch)]))
                        
            elements.append(PageBreak())
            
        try:
            doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)
        except Exception as e:
            logger.error(f"PDF generation failed: {e}")
            raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
            
        return buffer.getvalue()
