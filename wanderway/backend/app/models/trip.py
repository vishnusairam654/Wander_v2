"""Pydantic models for trip data structures."""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict

class Activity(BaseModel):
    time: str
    title: str
    description: str
    location: Optional[str] = None
    estimated_cost: Optional[float] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "time": "09:00",
                    "title": "Eiffel Tower Visit",
                    "description": "Visit the iconic Eiffel Tower and enjoy the view.",
                    "location": "Paris",
                    "estimated_cost": 30.0
                }
            ]
        }
    }

class DayItinerary(BaseModel):
    day_number: int
    date: Optional[str] = None
    theme: Optional[str] = None
    activities: List[Activity]

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "day_number": 1,
                    "date": "2024-05-01",
                    "theme": "Arrival and Exploration",
                    "activities": [
                        {
                            "time": "09:00",
                            "title": "Breakfast at Cafe",
                            "description": "Enjoy a local breakfast.",
                            "location": "Paris",
                            "estimated_cost": 15.0
                        }
                    ]
                }
            ]
        }
    }

class TripRequest(BaseModel):
    destination: str
    days: int = Field(gt=0, le=30)
    budget: Literal["cheap", "moderate", "luxury"]
    interests: List[str] = Field(min_length=1)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "destination": "Paris, France",
                    "days": 3,
                    "budget": "moderate",
                    "interests": ["art", "food", "history"]
                }
            ]
        }
    }

class TripResponse(BaseModel):
    id: Optional[str] = None
    destination: str
    start_date: str
    end_date: str
    itinerary: List[DayItinerary]

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": "trip-12345",
                    "destination": "Paris",
                    "start_date": "2024-05-01",
                    "end_date": "2024-05-03",
                    "itinerary": [
                        {
                            "day_number": 1,
                            "date": "2024-05-01",
                            "theme": "Art",
                            "activities": [
                                {
                                    "time": "09:00",
                                    "title": "Louvre",
                                    "description": "Visit museum",
                                    "location": "Paris",
                                    "estimated_cost": 20
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    }
