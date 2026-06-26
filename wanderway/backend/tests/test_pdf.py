import pytest
from app.services.pdf import PDFService
from app.models.trip import TripResponse, DayItinerary, Activity

def test_generate_pdf():
    trip = TripResponse(
        destination="Goa",
        start_date="2024-01-01",
        end_date="2024-01-03",
        itinerary=[
            DayItinerary(
                day_number=1,
                theme="Beach",
                activities=[
                    Activity(
                        time="09:00",
                        title="Baga Beach",
                        description="Relax by the sea.",
                        estimated_cost=100,
                    )
                ]
            )
        ]
    )
    
    pdf_bytes = PDFService.generate_trip_pdf(trip)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    # Check magic number for PDF
    assert pdf_bytes.startswith(b"%PDF-")
