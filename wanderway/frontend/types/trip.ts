// types/trip.ts — Shared trip data types across all components

export interface Waypoint {
    name: string;
    latitude: number;
    longitude: number;
    day: number;
    category?: string;
}

export interface WeatherDay {
    date: string;
    condition: string;
    maxTemp: number;
    minTemp: number;
    precipitation: number;
    windSpeed?: number;
    packingTip?: string;
}

export interface HotelOption {
    name: string;
    stars: number;
    pricePerNight: number;
    totalPrice: number;
    amenities: string[];
    bookingLink: string;
    recommended: boolean;
    style: string;
    address?: string;
}

export interface TravelOption {
    mode: string;
    carrier: string;
    duration: string;
    pricePerPerson: number;
    totalPrice: number;
    departure: string;
    arrival: string;
    bookingLink: string;
    pros: string[];
    cons: string[];
    recommended: boolean;
}

export interface Attraction {
    name: string;
    description: string;
    category: string;
    rating: number;
    lat?: number;
    lon?: number;
    address?: string;
    photos?: string;
    priceLevel?: string;
    reviews?: number;
    source?: string;
}

export interface ItineraryDay {
    day: number;
    title: string;
    morning: string;
    afternoon: string;
    evening: string;
    tips: string;
}

export interface BudgetBreakdown {
    transport: number;
    accommodation: number;
    food: number;
    sightseeing: number;
    localTransport: number;
    miscellaneous: number;
}

export interface LocalTransportOption {
    type: string;
    costPerTrip?: string;
    costPerDay?: string;
    dailyEst?: string;
    pros: string;
    cons: string;
    recommended: boolean;
}

export interface TripData {
    destination: string;
    duration: number;        // days
    travelers: number;
    plan: string;            // full AI markdown response
    waypoints: Waypoint[];
    budgetBreakdown?: BudgetBreakdown;
    totalBudget?: number;
    perPersonBudget?: number;
    weatherData?: {
        forecast: WeatherDay[];
        avgMax: number;
        avgMin: number;
        rainyDays: number;
        summary: string;
        city: string;
    };
    hotels?: HotelOption[];
    travelOptions?: TravelOption[];
    attractions?: Attraction[];
    itinerary?: ItineraryDay[];
    localTransport?: {
        destination: string;
        options: LocalTransportOption[];
        summary: string;
    };
    toolsUsed: string[];
    generatedAt: string;
}