// lib/ai/tools.ts
// 8 tools. search_travel_options covers ALL modes: flight, train, bus, road trip, cab.
// get_places_live fetches real attraction data via SerpAPI (or mock if key absent).

export const TRAVEL_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_travel_options",
      description:
        "Search ALL available travel options between two cities — flights, trains, buses, road trips, and cabs. Always call this. Never assume only flights. Returns every realistic mode with duration, price, and booking links.",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string", description: "Origin city name, e.g. Bangalore" },
          destination: { type: "string", description: "Destination city name, e.g. Goa" },
          originIATA: { type: "string", description: "IATA airport code of origin if flying, e.g. BLR" },
          destinationIATA: { type: "string", description: "IATA airport code of destination if flying, e.g. GOI" },
          departureDate: { type: "string", description: "Date in YYYY-MM-DD format" },
          returnDate: { type: "string", description: "Return date YYYY-MM-DD (optional)" },
          travelers: { type: "number", description: "Number of travelers" },
        },
        required: ["origin", "destination", "departureDate", "travelers"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_places_live",
      description:
        "Fetch real, current tourist attractions, restaurants, and activities at the destination using live search. Returns names, ratings, descriptions, coordinates, and categories.",
      parameters: {
        type: "object",
        properties: {
          destination: { type: "string", description: "City or region, e.g. Goa, Manali" },
          category: { type: "string", enum: ["tourist_attractions", "restaurants", "adventure", "nature", "shopping", "nightlife"], description: "Type of places to search" },
          days: { type: "number", description: "Number of trip days" },
        },
        required: ["destination", "category", "days"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_hotels",
      description: "Search for hotels at the destination. Returns budget, mid-range, and luxury options with live pricing where available.",
      parameters: {
        type: "object",
        properties: {
          cityName: { type: "string", description: "City name, e.g. Goa" },
          cityCode: { type: "string", description: "IATA city code if known, e.g. GOI" },
          checkIn: { type: "string", description: "Check-in date YYYY-MM-DD" },
          checkOut: { type: "string", description: "Check-out date YYYY-MM-DD" },
          adults: { type: "number" },
          priceRange: { type: "string", enum: ["budget", "mid-range", "luxury"] },
        },
        required: ["cityName", "checkIn", "checkOut", "adults"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_weather_forecast",
      description: "Get live weather forecast from Open-Meteo (no key required). Returns temperature, rain, and conditions per day.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string" },
          latitude: { type: "number" },
          longitude: { type: "number" },
          startDate: { type: "string", description: "YYYY-MM-DD" },
          endDate: { type: "string", description: "YYYY-MM-DD" },
        },
        required: ["city", "startDate", "endDate"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "estimate_trip_budget",
      description: "Calculate itemised budget breakdown: transport, hotel, food, sightseeing, local travel.",
      parameters: {
        type: "object",
        properties: {
          destination: { type: "string" },
          days: { type: "number" },
          travelers: { type: "number" },
          transportCostTotal: { type: "number", description: "Round-trip transport cost INR for all travelers" },
          hotelCostPerNight: { type: "number", description: "Hotel per night INR" },
          style: { type: "string", enum: ["budget", "mid-range", "luxury"] },
        },
        required: ["destination", "days", "travelers"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_local_transport",
      description: "Get local transport options within the destination: auto, taxi, Ola/Uber, bike rental, metro.",
      parameters: {
        type: "object",
        properties: {
          destination: { type: "string" },
          duration: { type: "number", description: "Days" },
          groupSize: { type: "number" },
        },
        required: ["destination", "duration"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_itinerary",
      description: "Build the final structured day-by-day itinerary. Call this LAST after all other tools. Returns days array and map waypoints.",
      parameters: {
        type: "object",
        properties: {
          destination: { type: "string" },
          days: { type: "number" },
          travelers: { type: "number" },
          attractions: { type: "array", items: { type: "object", properties: { name: { type: "string" }, lat: { type: "number" }, lon: { type: "number" }, category: { type: "string" } }, required: ["name"] } },
          travelInfo: { type: "string" },
          hotelInfo: { type: "string" },
          weatherSummary: { type: "string" },
          budget: { type: "string" },
        },
        required: ["destination", "days", "travelers", "attractions"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "edit_trip",
      description: "Edit the current trip plan: add a place, remove a place, swap a hotel, change transport mode, or update the budget. Call when the user asks to modify the plan.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["add_place", "remove_place", "recommend_alternatives", "change_hotel", "change_transport", "update_budget"], description: "What to do" },
          target: { type: "string", description: "Name of place/hotel/transport to add, remove, or replace" },
          dayNumber: { type: "number", description: "Day number to modify (optional)" },
          replacement: { type: "string", description: "Replacement name if swapping (optional)" },
          destination: { type: "string", description: "Trip destination city" },
          category: { type: "string", description: "Category filter for alternatives, e.g. beach, culture, food" },
        },
        required: ["action", "destination"],
      },
    },
  },
];