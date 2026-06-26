"""Pydantic models for trip planning requests and responses."""
from datetime import date
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

class Activity(BaseModel):
    time: str = "Anytime"
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=600)
    location: Optional[str] = None
    estimated_cost: Optional[float] = Field(default=None, ge=0)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    category: Optional[str] = None

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
    day_number: int = Field(ge=1, le=30)
    date: Optional[str] = None
    theme: Optional[str] = None
    activities: List[Activity] = Field(min_length=1)

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
    destination: str = Field(min_length=2, max_length=100)
    start_date: date
    end_date: date
    budget: Literal["budget", "moderate", "luxury"] = "moderate"
    interests: List[str] = Field(default_factory=lambda: ["sightseeing"], min_length=1, max_length=10)
    origin: Optional[str] = Field(default=None, min_length=2, max_length=100)
    number_of_people: int = Field(default=1, ge=1, le=50)
    total_budget: Optional[float] = Field(default=None, ge=0)
    special_requirements: Optional[str] = Field(default=None, max_length=500)

    @field_validator("destination", "origin", "special_requirements")
    @classmethod
    def strip_text(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if value else value

    @field_validator("interests")
    @classmethod
    def normalize_interests(cls, values: List[str]) -> List[str]:
        normalized = [value.strip() for value in values if value.strip()]
        if not normalized:
            raise ValueError("At least one interest is required")
        return list(dict.fromkeys(normalized))

    @model_validator(mode="after")
    def validate_dates(self) -> "TripRequest":
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        if self.days > 30:
            raise ValueError("Trip duration cannot exceed 30 days")
        return self

    @property
    def days(self) -> int:
        return (self.end_date - self.start_date).days

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "destination": "Paris, France",
                    "start_date": "2026-07-01",
                    "end_date": "2026-07-04",
                    "budget": "moderate",
                    "interests": ["art", "food", "history"],
                    "number_of_people": 2
                }
            ]
        }
    }

class TripResponse(BaseModel):
    id: Optional[str] = None
    destination: str = Field(min_length=1)
    start_date: str
    end_date: str
    itinerary: List[DayItinerary] = Field(min_length=1)

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
