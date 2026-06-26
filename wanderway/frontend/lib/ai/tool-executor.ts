// lib/ai/tool-executor.ts

// ─── Route database ───────────────────────────────────────────────────────────
interface RouteInfo {
  distanceKm: number; roadHours: number;
  trainAvailable: boolean; trainHours?: number; trainPrice?: number; trainName?: string;
  busAvailable: boolean; busHours?: number; busPrice?: number;
  flightAvailable: boolean; flightMinutes?: number;
}

const ROUTES: Record<string, RouteInfo> = {
  "bangalore-goa": { distanceKm: 560, roadHours: 9, trainAvailable: true, trainHours: 10, trainPrice: 600, trainName: "Vasco Express", busAvailable: true, busHours: 9, busPrice: 800, flightAvailable: true, flightMinutes: 55 },
  "bangalore-manali": { distanceKm: 2050, roadHours: 36, trainAvailable: false, busAvailable: true, busHours: 40, busPrice: 1200, flightAvailable: true, flightMinutes: 120 },
  "bangalore-jaipur": { distanceKm: 1840, roadHours: 28, trainAvailable: true, trainHours: 30, trainPrice: 1200, trainName: "YPR-JP Exp", busAvailable: false, flightAvailable: true, flightMinutes: 135 },
  "bangalore-mumbai": { distanceKm: 980, roadHours: 16, trainAvailable: true, trainHours: 18, trainPrice: 900, trainName: "UBL-CSTM Exp", busAvailable: true, busHours: 17, busPrice: 1400, flightAvailable: true, flightMinutes: 85 },
  "bangalore-ooty": { distanceKm: 260, roadHours: 5, trainAvailable: true, trainHours: 6, trainPrice: 250, trainName: "Nilgiri Express", busAvailable: true, busHours: 5, busPrice: 300, flightAvailable: false },
  "bangalore-coorg": { distanceKm: 250, roadHours: 4, trainAvailable: false, busAvailable: true, busHours: 5, busPrice: 350, flightAvailable: false },
  "bangalore-mysuru": { distanceKm: 145, roadHours: 3, trainAvailable: true, trainHours: 2, trainPrice: 150, trainName: "Shatabdi", busAvailable: true, busHours: 3, busPrice: 200, flightAvailable: false },
  "bangalore-pondicherry": { distanceKm: 310, roadHours: 5, trainAvailable: true, trainHours: 5, trainPrice: 300, trainName: "Puducherry Exp", busAvailable: true, busHours: 5, busPrice: 350, flightAvailable: false },
  "delhi-manali": { distanceKm: 530, roadHours: 12, trainAvailable: false, busAvailable: true, busHours: 14, busPrice: 900, flightAvailable: true, flightMinutes: 60 },
  "delhi-jaipur": { distanceKm: 280, roadHours: 5, trainAvailable: true, trainHours: 4, trainPrice: 400, trainName: "Shatabdi", busAvailable: true, busHours: 5, busPrice: 350, flightAvailable: true, flightMinutes: 45 },
  "delhi-shimla": { distanceKm: 340, roadHours: 7, trainAvailable: true, trainHours: 8, trainPrice: 450, trainName: "Himalayan Queen", busAvailable: true, busHours: 7, busPrice: 500, flightAvailable: false },
  "delhi-agra": { distanceKm: 230, roadHours: 3, trainAvailable: true, trainHours: 2, trainPrice: 300, trainName: "Gatimaan Express", busAvailable: true, busHours: 4, busPrice: 300, flightAvailable: false },
  "delhi-varanasi": { distanceKm: 820, roadHours: 12, trainAvailable: true, trainHours: 9, trainPrice: 700, trainName: "Vande Bharat", busAvailable: false, flightAvailable: true, flightMinutes: 75 },
  "mumbai-goa": { distanceKm: 590, roadHours: 10, trainAvailable: true, trainHours: 9, trainPrice: 700, trainName: "Mandovi Express", busAvailable: true, busHours: 10, busPrice: 900, flightAvailable: true, flightMinutes: 55 },
  "mumbai-pune": { distanceKm: 150, roadHours: 3, trainAvailable: true, trainHours: 2, trainPrice: 200, trainName: "Deccan Queen", busAvailable: true, busHours: 3, busPrice: 250, flightAvailable: false },
};

function getRoute(origin: string, dest: string): RouteInfo {
  const k1 = `${origin.toLowerCase().trim()}-${dest.toLowerCase().trim()}`;
  const k2 = `${dest.toLowerCase().trim()}-${origin.toLowerCase().trim()}`;
  return ROUTES[k1] || ROUTES[k2] || {
    distanceKm: 800, roadHours: 14, trainAvailable: true, trainHours: 16, trainPrice: 800, trainName: "Express Train",
    busAvailable: true, busHours: 15, busPrice: 700, flightAvailable: true, flightMinutes: 90,
  };
}

// ─── City coordinates ─────────────────────────────────────────────────────────
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  goa: { lat: 15.2993, lon: 74.124 }, mumbai: { lat: 19.076, lon: 72.8777 },
  delhi: { lat: 28.6139, lon: 77.209 }, bangalore: { lat: 12.9716, lon: 77.5946 },
  bengaluru: { lat: 12.9716, lon: 77.5946 }, jaipur: { lat: 26.9124, lon: 75.7873 },
  manali: { lat: 32.2432, lon: 77.1892 }, shimla: { lat: 31.1048, lon: 77.1734 },
  ooty: { lat: 11.4102, lon: 76.695 }, coorg: { lat: 12.3375, lon: 75.8069 },
  mysuru: { lat: 12.2958, lon: 76.6394 }, agra: { lat: 27.1767, lon: 78.0081 },
  varanasi: { lat: 25.3176, lon: 82.9739 }, rishikesh: { lat: 30.0869, lon: 78.2676 },
  pune: { lat: 18.5204, lon: 73.8567 }, pondicherry: { lat: 11.9416, lon: 79.8083 },
  kerala: { lat: 10.8505, lon: 76.2711 }, kolkata: { lat: 22.5726, lon: 88.3639 },
};

function getCityCoords(city: string): { lat: number; lon: number } {
  const k = city.toLowerCase().split(",")[0].trim();
  return CITY_COORDS[k] || { lat: 20.5937, lon: 78.9629 };
}

// ─── Attractions fallback DB (used when SerpAPI unavailable) ──────────────────
const ATTRACTIONS_DB: Record<string, Array<{ name: string; description: string; category: string; rating: number; lat: number; lon: number }>> = {
  goa: [
    { name: "Baga Beach", description: "Lively beach with water sports, shacks & nightlife", category: "nature", rating: 4.4, lat: 15.5559, lon: 73.7517 },
    { name: "Fort Aguada", description: "17th-century Portuguese fort with panoramic sea views", category: "culture", rating: 4.4, lat: 15.4953, lon: 73.7731 },
    { name: "Dudhsagar Falls", description: "Towering four-tiered waterfall deep in Bhagwan Mahavir Wildlife Sanctuary", category: "nature", rating: 4.6, lat: 15.3143, lon: 74.3143 },
    { name: "Anjuna Flea Market", description: "Famous Wednesday market with handicrafts, clothes & souvenirs", category: "shopping", rating: 4.1, lat: 15.5734, lon: 73.7403 },
    { name: "Basilica of Bom Jesus", description: "UNESCO World Heritage Site — 16th-century baroque church", category: "culture", rating: 4.6, lat: 15.5009, lon: 73.9116 },
    { name: "Palolem Beach", description: "Serene crescent-shaped beach with calm waters & beach huts", category: "nature", rating: 4.5, lat: 15.0101, lon: 74.023 },
    { name: "Spice Plantation", description: "Guided tour of a working spice farm with traditional Goan lunch", category: "food", rating: 4.3, lat: 15.4089, lon: 74.0123 },
  ],
  manali: [
    { name: "Solang Valley", description: "Snow sports, skiing, zorbing & paragliding year-round", category: "adventure", rating: 4.5, lat: 32.3202, lon: 77.1513 },
    { name: "Rohtang Pass", description: "High-altitude mountain pass at 3,978m with glaciers & scenic beauty", category: "adventure", rating: 4.4, lat: 32.3717, lon: 77.2434 },
    { name: "Hadimba Devi Temple", description: "Unique wooden pagoda-style temple nestled in cedar forest", category: "culture", rating: 4.5, lat: 32.2387, lon: 77.1793 },
    { name: "Old Manali", description: "Bohemian village with cafes, art galleries & riverside walks", category: "culture", rating: 4.3, lat: 32.2578, lon: 77.1811 },
    { name: "Beas River Rafting", description: "Exhilarating white-water rafting on the Beas River", category: "adventure", rating: 4.4, lat: 32.2432, lon: 77.1892 },
    { name: "Jogini Waterfall", description: "Beautiful multi-tiered waterfall reached via forest trek", category: "nature", rating: 4.3, lat: 32.2605, lon: 77.1731 },
  ],
  jaipur: [
    { name: "Amber Fort", description: "Magnificent 16th-century Rajput fort on a hilltop overlooking Maota Lake", category: "culture", rating: 4.6, lat: 26.9855, lon: 75.8513 },
    { name: "Hawa Mahal", description: "Iconic 5-story Palace of Winds with 953 intricately carved windows", category: "culture", rating: 4.5, lat: 26.9239, lon: 75.8267 },
    { name: "City Palace", description: "Royal palace complex housing museums, galleries & royal apartments", category: "culture", rating: 4.5, lat: 26.9257, lon: 75.8234 },
    { name: "Nahargarh Fort", description: "18th-century fort offering the best sunset views over Jaipur", category: "culture", rating: 4.4, lat: 26.9395, lon: 75.8121 },
    { name: "Johari Bazaar", description: "Famous jewellery market — gems, bangles & traditional Rajasthani crafts", category: "shopping", rating: 4.3, lat: 26.9219, lon: 75.8242 },
    { name: "Chokhi Dhani", description: "Authentic Rajasthani cultural village with folk music, dance & cuisine", category: "food", rating: 4.3, lat: 26.7925, lon: 75.8376 },
  ],
  ooty: [
    { name: "Ooty Lake", description: "Scenic boating lake surrounded by eucalyptus trees & gardens", category: "nature", rating: 4.0, lat: 11.4102, lon: 76.695 },
    { name: "Nilgiri Mountain Railway", description: "UNESCO heritage toy train winding through spectacular misty hills", category: "culture", rating: 4.5, lat: 11.4060, lon: 76.6898 },
    { name: "Doddabetta Peak", description: "Highest peak in Nilgiris at 2,637m with telescopes & panoramic views", category: "nature", rating: 4.1, lat: 11.4033, lon: 76.7418 },
    { name: "Government Rose Garden", "description": "India's largest rose garden with 20,000+ varieties in terraced gardens", category: "nature", rating: 4.2, lat: 11.4193, lon: 76.7062 },
    { name: "Tea Factory & Museum", description: "Learn Nilgiri tea production & taste freshly brewed varieties", category: "food", rating: 4.2, lat: 11.3942, lon: 76.7215 },
  ],
  coorg: [
    { name: "Abbey Falls", description: "Picturesque waterfall surrounded by coffee & spice plantations", category: "nature", rating: 4.4, lat: 12.4167, lon: 75.7333 },
    { name: "Raja's Seat", description: "Royal viewpoint offering stunning misty valley sunsets", category: "nature", rating: 4.2, lat: 12.4195, lon: 75.7376 },
    { name: "Dubare Elephant Camp", description: "Interactive elephant experience — bathe & feed tuskers by the river", category: "adventure", rating: 4.3, lat: 12.3521, lon: 75.9112 },
    { name: "Talacauvery", description: "Sacred source of River Cauvery with hilltop temple & forest walks", category: "culture", rating: 4.3, lat: 12.3820, lon: 75.4923 },
    { name: "Coffee Plantation Walk", "description": "Walk through aromatic 100-year-old coffee estates with expert guides", category: "nature", rating: 4.5, lat: 12.3375, lon: 75.8069 },
  ],
  mysuru: [
    { name: "Mysore Palace", description: "Illuminated royal palace — one of India's most visited monuments", category: "culture", rating: 4.7, lat: 12.3052, lon: 76.6552 },
    { name: "Chamundi Hills", description: "Sacred hill temple with 1,000 ancient steps & city panoramas", category: "culture", rating: 4.5, lat: 12.2726, lon: 76.6706 },
    { name: "Brindavan Gardens", description: "Terraced gardens with musical fountains at KRS Dam", category: "nature", rating: 4.3, lat: 12.4234, lon: 76.5733 },
    { name: "Devaraja Market", description: "350-year-old bustling market with flowers, spices, incense & silk", category: "shopping", rating: 4.3, lat: 12.3104, lon: 76.6553 },
  ],
  agra: [
    { name: "Taj Mahal", description: "One of the world's greatest monuments — UNESCO World Heritage Site", category: "culture", rating: 4.8, lat: 27.1751, lon: 78.0421 },
    { name: "Agra Fort", description: "Massive 16th-century Mughal fort — UNESCO World Heritage Site", category: "culture", rating: 4.5, lat: 27.1795, lon: 78.0211 },
    { name: "Fatehpur Sikri", description: "Abandoned Mughal capital 40km from Agra — perfectly preserved", category: "culture", rating: 4.5, lat: 27.0945, lon: 77.6639 },
    { name: "Mehtab Bagh", description: "Moonlit garden — best sunset view of Taj Mahal from across the river", category: "nature", rating: 4.4, lat: 27.1790, lon: 78.0422 },
  ],
};

function getLocalAttractions(destination: string, category: string, days: number) {
  const key = destination.toLowerCase().split(",")[0].trim();
  const all = ATTRACTIONS_DB[key] || [];
  const filtered = category === "tourist_attractions" || category === "all"
    ? all
    : all.filter(a => a.category === category || a.category === category.replace("_", " "));
  return filtered.length ? filtered.slice(0, days * 2 + 2) : generateGeneric(destination);
}

function generateGeneric(destination: string) {
  return [
    { name: `${destination} Old Town`, description: "Historic centre with colonial architecture & local life", category: "culture", rating: 4.2, lat: 0, lon: 0 },
    { name: `${destination} Local Market`, description: "Bustling market with street food, spices & handicrafts", category: "shopping", rating: 4.1, lat: 0, lon: 0 },
    { name: `${destination} Nature Park`, description: "Scenic park with trails, viewpoints & picnic spots", category: "nature", rating: 4.3, lat: 0, lon: 0 },
  ];
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────
export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const mock = process.env.NEXT_PUBLIC_MOCK_APIS === "true";
  switch (name) {
    case "search_travel_options": return searchTravelOptions(args, mock);
    case "get_places_live": return getPlacesLive(args);
    case "search_hotels": return searchHotels(args, mock);
    case "get_weather_forecast": return getWeatherForecast(args);
    case "estimate_trip_budget": return estimateBudget(args);
    case "get_local_transport": return getLocalTransport(args);
    case "create_itinerary": return createItinerary(args);
    case "edit_trip": return editTrip(args);
    // backwards compat aliases
    case "search_flights": return searchTravelOptions({ ...args, origin: args.origin || "Bangalore", destination: args.destination || "Goa" }, mock);
    case "get_attractions": return getPlacesLive({ destination: args.destination, category: "tourist_attractions", days: args.days });
    default: return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ─── TOOL: search_travel_options ──────────────────────────────────────────────
async function searchTravelOptions(args: Record<string, unknown>, mock: boolean): Promise<string> {
  const origin = (args.origin as string) || "Bangalore";
  const destination = (args.destination as string) || "Goa";
  const travelers = Number(args.travelers) || 1;
  const dateStr = (args.departureDate as string) || new Date().toISOString().split("T")[0];
  const route = getRoute(origin, destination);

  const options: unknown[] = [];

  // ── FLIGHT ────────────────────────────────────────────────────────────────
  if (route.flightAvailable) {
    // Try Amadeus live if keys present and not mock
    let flightPrice: number | null = null;
    if (!mock && process.env.AMADEUS_API_KEY && args.originIATA && args.destinationIATA) {
      try {
        const token = await getAmadeusToken();
        const base = process.env.AMADEUS_ENV === "production" ? "https://api.amadeus.com" : "https://test.api.amadeus.com";
        const p = new URLSearchParams({ originLocationCode: args.originIATA as string, destinationLocationCode: args.destinationIATA as string, departureDate: dateStr, adults: String(travelers), max: "3", currencyCode: "INR" });
        const res = await fetch(`${base}/v2/shopping/flight-offers?${p}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.data?.[0]) flightPrice = parseFloat((data.data[0].price as { grandTotal: string }).grandTotal);
      } catch { /* fall through to mock */ }
    }
    const baseFlightPrice = flightPrice || (route.distanceKm < 500 ? 3500 : route.distanceKm < 1000 ? 5000 : 7500);
    const airlines = ["IndiGo", "Air India", "SpiceJet", "Akasa Air"];
    const depHour = 6 + Math.floor(Math.random() * 10);
    const arrHour = depHour + Math.round((route.flightMinutes || 90) / 60);
    options.push({
      mode: "✈️ Flight",
      carrier: airlines[Math.floor(Math.random() * airlines.length)],
      duration: `${route.flightMinutes}m`,
      pricePerPerson: baseFlightPrice,
      totalPrice: baseFlightPrice * travelers,
      departure: `${depHour}:00`,
      arrival: `${arrHour}:${String(Math.floor(Math.random() * 59)).padStart(2, "0")}`,
      bookingLink: "https://www.makemytrip.com/flights/",
      pros: ["Fastest option", "Multiple daily departures"],
      cons: ["Most expensive", "Need to reach airport early"],
      recommended: route.distanceKm > 800,
    });
  }

  // ── TRAIN ─────────────────────────────────────────────────────────────────
  if (route.trainAvailable && route.trainPrice != null) {
    const trainPrice = Math.round(route.trainPrice! * (0.9 + Math.random() * 0.2));
    options.push({
      mode: "🚂 Train",
      carrier: route.trainName || "Indian Railways",
      duration: `${route.trainHours}h`,
      pricePerPerson: trainPrice,
      totalPrice: trainPrice * travelers,
      departure: "06:30",
      arrival: `${Math.floor(6.5 + (route.trainHours || 10))}:30`,
      bookingLink: "https://www.irctc.co.in/",
      pros: ["Comfortable sleeper/AC coaches", "Scenic route", "Budget-friendly"],
      cons: ["Advance booking needed", "Can be delayed"],
      recommended: route.distanceKm >= 300 && route.distanceKm <= 1500,
    });
  }

  // ── BUS ───────────────────────────────────────────────────────────────────
  if (route.busAvailable && route.busPrice != null) {
    const busPrice = Math.round(route.busPrice! * (0.9 + Math.random() * 0.2));
    options.push({
      mode: "🚌 Bus",
      carrier: "KSRTC / RedBus Volvo",
      duration: `${route.busHours}h`,
      pricePerPerson: busPrice,
      totalPrice: busPrice * travelers,
      departure: "20:00",
      arrival: "Overnight",
      bookingLink: "https://www.redbus.in/",
      pros: ["Cheapest option", "Overnight saves hotel night", "Door-to-door routes"],
      cons: ["Least comfortable for long trips", "Fixed schedule"],
      recommended: route.distanceKm >= 200 && route.distanceKm <= 700,
    });
  }

  // ── ROAD TRIP (self-drive) ─────────────────────────────────────────────────
  if (route.distanceKm <= 1000) {
    const fuelCost = Math.round((route.distanceKm / 15) * 100 * 2); // 15kmpl, ₹100/L, return
    const tollCost = Math.round(route.distanceKm * 0.8);
    const roadTotal = fuelCost + tollCost;
    options.push({
      mode: "🚗 Road Trip",
      carrier: "Self-Drive / Rental Car",
      duration: `${route.roadHours}h drive`,
      pricePerPerson: Math.round(roadTotal / travelers),
      totalPrice: roadTotal,
      departure: "Flexible",
      arrival: "Flexible",
      bookingLink: "https://www.zoomcar.com/",
      pros: [`Full freedom to stop anywhere`, "Great for groups", "Scenic highway drives"],
      cons: ["Tiring for driver", "Tolls + fuel adds up"],
      recommended: travelers >= 3 && route.distanceKm <= 600,
    });
  }

  // ── CAB (Ola/Uber outstation) ─────────────────────────────────────────────
  if (route.distanceKm <= 600) {
    const cabPrice = Math.round(route.distanceKm * 12);
    options.push({
      mode: "🚕 Outstation Cab",
      carrier: "Ola Outstation / Uber",
      duration: `${route.roadHours}h`,
      pricePerPerson: Math.round(cabPrice / travelers),
      totalPrice: cabPrice,
      departure: "Flexible",
      arrival: "Flexible",
      bookingLink: "https://www.olacabs.com/",
      pros: ["No driving stress", "Door-to-door pickup"],
      cons: ["Expensive for solo", "Limited availability for long distances"],
      recommended: travelers <= 2 && route.distanceKm <= 400,
    });
  }

  // Sort by price
  options.sort((a: unknown, b: unknown) => (a as { totalPrice: number }).totalPrice - (b as { totalPrice: number }).totalPrice);

  return JSON.stringify({
    origin, destination, travelers,
    travelOptions: options,
    cheapest: (options[0] as { mode: string })?.mode,
    fastest: options.find((o: unknown) => (o as { mode: string }).mode.includes("Flight"))
      ? "✈️ Flight"
      : (options[0] as { mode: string })?.mode,
    summary: `Found ${options.length} travel options from ${origin} to ${destination}. Cheapest: ${(options[0] as { mode: string })?.mode} at ₹${(options[0] as { totalPrice: number })?.totalPrice?.toLocaleString("en-IN")} for ${travelers} traveler(s).`,
  });
}

// ─── Amadeus token (cached) ───────────────────────────────────────────────────
let _amToken: { token: string; exp: number } | null = null;
let _tokenPromise: Promise<string> | null = null;

async function getAmadeusToken(): Promise<string> {
  if (_amToken && Date.now() < _amToken.exp) return _amToken.token;
  if (_tokenPromise) return _tokenPromise;
  
  _tokenPromise = (async () => {
    try {
      const base = process.env.AMADEUS_ENV === "production" ? "https://api.amadeus.com" : "https://test.api.amadeus.com";
      const res = await fetch(`${base}/v1/security/oauth2/token`, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.AMADEUS_API_KEY || "", client_secret: process.env.AMADEUS_API_SECRET || "" }),
      });
      const d = await res.json();
      _amToken = { token: d.access_token, exp: Date.now() + (d.expires_in - 60) * 1000 };
      return _amToken.token;
    } finally {
      _tokenPromise = null;
    }
  })();
  return _tokenPromise;
}

// ─── TOOL: get_places_live (SerpAPI → fallback local DB) ─────────────────────
async function getPlacesLive(args: Record<string, unknown>): Promise<string> {
  const destination = (args.destination as string) || "Goa";
  const category = (args.category as string) || "tourist_attractions";
  const days = Number(args.days) || 3;
  const serpKey = process.env.SERPAPI_KEY;

  // Try SerpAPI for live data
  if (serpKey && serpKey !== "5e" && serpKey.length > 10) {
    try {
      const query = `top ${category.replace("_", " ")} in ${destination} India`;
      const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&type=search&api_key=${serpKey}&hl=en&gl=in`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();

      if (data.local_results && data.local_results.length > 0) {
        const places = data.local_results.slice(0, days * 2 + 2).map((p: Record<string, unknown>) => ({
          name: p.title,
          description: (p.description as string) || (p.type as string) || "Popular attraction",
          category,
          rating: p.rating || 4.2,
          reviews: p.reviews,
          address: p.address,
          lat: (p.gps_coordinates as Record<string, number>)?.latitude || 0,
          lon: (p.gps_coordinates as Record<string, number>)?.longitude || 0,
          photos: p.thumbnail,
          priceLevel: p.price,
          openNow: (p.operating_hours as Record<string, unknown>)?.open_now,
          source: "live",
        }));
        return JSON.stringify({ destination, category, places, source: "serpapi", summary: `Found ${places.length} live ${category} results in ${destination}` });
      }
    } catch {
      // fall through to local DB
    }
  }

  // Fallback: local curated DB
  const places = getLocalAttractions(destination, category, days);
  return JSON.stringify({
    destination, category,
    places: places.map(p => ({ ...p, source: "curated" })),
    source: "curated",
    summary: `Found ${places.length} ${category} in ${destination}`,
  });
}

// ─── TOOL: search_hotels ─────────────────────────────────────────────────────
async function searchHotels(args: Record<string, unknown>, mock: boolean): Promise<string> {
  const city = (args.cityName as string) || "Goa";
  const checkIn = (args.checkIn as string) || new Date().toISOString().split("T")[0];
  const checkOut = (args.checkOut as string) || new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];
  const adults = Number(args.adults) || 2;
  const style = (args.priceRange as string) || "mid-range";
  const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  // Try Amadeus live
  if (!mock && process.env.AMADEUS_API_KEY && args.cityCode) {
    try {
      const token = await getAmadeusToken();
      const base = process.env.AMADEUS_ENV === "production" ? "https://api.amadeus.com" : "https://test.api.amadeus.com";
      const listRes = await fetch(`${base}/v1/reference-data/locations/hotels/by-city?cityCode=${args.cityCode}&radius=5&radiusUnit=KM&hotelSource=ALL`, { headers: { Authorization: `Bearer ${token}` } });
      const listData = await listRes.json();
      const ids = (listData.data || []).slice(0, 3).map((h: Record<string, unknown>) => h.hotelId).join(",");
      if (ids) {
        const offRes = await fetch(`${base}/v3/shopping/hotel-offers?hotelIds=${ids}&adults=${adults}&checkInDate=${checkIn}&checkOutDate=${checkOut}&currencyCode=INR`, { headers: { Authorization: `Bearer ${token}` } });
        const offData = await offRes.json();
        if (offData.data?.length) {
          const hotels = offData.data.map((h: Record<string, unknown>) => {
            const offer = (h.offers as Record<string, unknown>[])?.[0];
            const price = (offer?.price as Record<string, unknown>);
            return { name: (h.hotel as Record<string, unknown>)?.name, rating: (h.hotel as Record<string, unknown>)?.rating, pricePerNight: parseFloat(String(price?.base || 0)), totalPrice: parseFloat(String(price?.total || 0)), currency: "INR", amenities: ["WiFi", "AC"], bookingLink: "https://www.booking.com/", source: "amadeus" };
          });
          return JSON.stringify({ city, hotels, nights, summary: `Found ${hotels.length} hotels in ${city}` });
        }
      }
    } catch { /* fall through */ }
  }

  // Mock / fallback
  const basePrice = style === "budget" ? 1200 : style === "luxury" ? 9000 : 3200;
  const hotels = [
    { name: `${city} Heritage Grand`, stars: 5, pricePerNight: Math.round(basePrice * 2.8), totalPrice: Math.round(basePrice * 2.8) * nights, amenities: ["Pool", "Spa", "Restaurant", "Free WiFi", "Valet"], bookingLink: "https://www.booking.com/", recommended: style === "luxury", style: "luxury" },
    { name: `The ${city} Boutique Stay`, stars: 3, pricePerNight: Math.round(basePrice * 1.0), totalPrice: Math.round(basePrice * 1.0) * nights, amenities: ["Free WiFi", "Breakfast", "AC", "Parking"], bookingLink: "https://www.makemytrip.com/hotels/", recommended: style === "mid-range", style: "mid-range" },
    { name: `${city} Budget Inn`, stars: 2, pricePerNight: Math.round(basePrice * 0.45), totalPrice: Math.round(basePrice * 0.45) * nights, amenities: ["Free WiFi", "AC", "Hot Water"], bookingLink: "https://www.hostelworld.com/", recommended: style === "budget", style: "budget" },
    { name: `OYO Rooms ${city}`, stars: 2, pricePerNight: Math.round(basePrice * 0.35), totalPrice: Math.round(basePrice * 0.35) * nights, amenities: ["Free WiFi", "AC"], bookingLink: "https://www.oyorooms.com/", recommended: false, style: "budget" },
    { name: `${city} Airbnb (Entire Home)`, stars: 0, pricePerNight: Math.round(basePrice * 0.8), totalPrice: Math.round(basePrice * 0.8) * nights, amenities: ["Full Kitchen", "Free WiFi", "Laundry", "Private"], bookingLink: "https://www.airbnb.co.in/", recommended: adults >= 4, style: "mid-range" },
  ];
  return JSON.stringify({ city, hotels, nights, summary: `Found ${hotels.length} accommodation options in ${city} for ${nights} nights` });
}

// ─── TOOL: get_weather_forecast (Open-Meteo — always live, no key) ────────────
async function getWeatherForecast(args: Record<string, unknown>): Promise<string> {
  const city = (args.city as string) || "Goa";
  const startDate = (args.startDate as string) || new Date().toISOString().split("T")[0];
  const endDate = (args.endDate as string) || new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0];
  const coords = (args.latitude && args.longitude)
    ? { lat: Number(args.latitude), lon: Number(args.longitude) }
    : getCityCoords(city);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max&start_date=${startDate}&end_date=${endDate}&timezone=Asia%2FKolkata`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    if (!data.daily) throw new Error("no data");

    const WMO: Record<number, string> = { 0: "☀️ Clear sky", 1: "🌤 Mainly clear", 2: "⛅ Partly cloudy", 3: "☁️ Overcast", 45: "🌫 Foggy", 51: "🌦 Light drizzle", 61: "🌧 Light rain", 63: "🌧 Moderate rain", 80: "🌦 Rain showers", 95: "⛈ Thunderstorm" };

    const days = data.daily.time.map((date: string, i: number) => {
      const code = data.daily.weathercode[i] as number;
      return {
        date, condition: WMO[code] || "Mixed",
        maxTemp: Math.round(data.daily.temperature_2m_max[i]),
        minTemp: Math.round(data.daily.temperature_2m_min[i]),
        precipitation: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
        windSpeed: Math.round(data.daily.windspeed_10m_max[i]),
        packingTip: code >= 60 ? "🌂 Pack a rain jacket" : code <= 1 ? "🕶 Sunscreen essential" : "👕 Light layers recommended",
      };
    });

    const avgMax = Math.round(days.reduce((s: number, d: typeof days[0]) => s + d.maxTemp, 0) / days.length);
    const avgMin = Math.round(days.reduce((s: number, d: typeof days[0]) => s + d.minTemp, 0) / days.length);
    const rainy = days.filter((d: typeof days[0]) => d.precipitation > 1).length;
    return JSON.stringify({ city, forecast: days, avgMax, avgMin, rainyDays: rainy, source: "open-meteo-live", summary: `Live weather for ${city}: avg ${avgMin}–${avgMax}°C. ${rainy > 0 ? `${rainy} rainy day(s) — carry a jacket.` : "Mostly dry — great weather!"}` });
  } catch {
    // Rough seasonal fallback
    const month = new Date(startDate).getMonth();
    const isWinter = month >= 10 || month <= 2;
    return JSON.stringify({ city, source: "estimate", avgMax: isWinter ? 28 : 33, avgMin: isWinter ? 18 : 25, rainyDays: 0, summary: `Estimated weather for ${city}: ${isWinter ? "Cool and pleasant (18–28°C). Light jacket for evenings." : "Warm and sunny (25–33°C). Stay hydrated."}` });
  }
}

// ─── TOOL: estimate_trip_budget ───────────────────────────────────────────────
function estimateBudget(args: Record<string, unknown>): string {
  const { destination, days, travelers, style = "mid-range" } = args;
  const d = Number(days); const t = Number(travelers);
  const transportTotal = Number(args.transportCostTotal) || 0;
  const hotelPerNight = Number(args.hotelCostPerNight) || (style === "budget" ? 1200 : style === "luxury" ? 9000 : 3200);
  const mult = style === "budget" ? 0.6 : style === "luxury" ? 2.2 : 1;

  const accommodation = hotelPerNight * (d - 1);
  const food = Math.round(800 * d * t * mult);
  const sightseeing = Math.round(600 * d * t * mult);
  const localTransport = Math.round(350 * d * t * mult);
  const misc = Math.round((transportTotal + accommodation + food + sightseeing + localTransport) * 0.08);
  const total = transportTotal + accommodation + food + sightseeing + localTransport + misc;

  return JSON.stringify({
    breakdown: { transport: Math.round(transportTotal), accommodation: Math.round(accommodation), food, sightseeing, localTransport, miscellaneous: misc },
    totalINR: Math.round(total), perPersonINR: Math.round(total / t), style,
    summary: `Total trip budget: ₹${Math.round(total).toLocaleString("en-IN")} for ${t} traveler(s), ${d} days in ${destination}. Per person: ₹${Math.round(total / t).toLocaleString("en-IN")}.`,
  });
}

// ─── TOOL: get_local_transport ────────────────────────────────────────────────
function getLocalTransport(args: Record<string, unknown>): string {
  const { destination, duration, groupSize = 1 } = args;
  const d = Number(duration); const g = Number(groupSize);
  return JSON.stringify({
    destination, options: [
      { type: "Auto Rickshaw", costPerTrip: "₹50–200", dailyEst: `₹300–600`, pros: "Cheap, widely available", cons: "No AC, haggling needed", recommended: g <= 2 },
      { type: "Ola/Uber", costPerTrip: "₹150–400", dailyEst: `₹700–1400`, pros: "App-based, metered, AC", cons: "Surge pricing at peak", recommended: true },
      { type: "Bike Rental", costPerDay: `₹400–700 (${d} days = ₹${400 * d}–${700 * d})`, pros: "Freedom to explore", cons: "Needs licence, risky for unfamiliar roads", recommended: g <= 2 },
      { type: "Private Car + Driver", costPerDay: `₹2,500–4,000 (${d} days = ₹${2500 * d}–${4000 * d})`, pros: "Comfortable, driver knows routes", cons: "Expensive", recommended: g >= 4 },
    ],
    summary: `Local transport in ${destination} for ${g} people. Ola/Uber easiest; bike rental best for exploring freely.`,
  });
}

// ─── TOOL: create_itinerary ───────────────────────────────────────────────────
function createItinerary(args: Record<string, unknown>): string {
  const { destination, days, travelers, travelInfo, hotelInfo, weatherSummary, budget } = args;
  const d = Number(days);
  const t = Number(travelers);
  const atts = (args.attractions as Array<{ name: string; lat?: number; lon?: number; category?: string }>) || [];
  const coords = getCityCoords(destination as string);

  const itinerary = [];
  const waypoints = [];

  for (let day = 1; day <= d; day++) {
    const dayAtts = atts.slice((day - 1) * 2, day * 2);
    const isFirst = day === 1;
    const isLast = day === d;
    itinerary.push({
      day,
      title: isFirst ? `Arrival & Orientation` : isLast ? `Departure Day` : `Day ${day} — Exploration`,
      morning: isFirst ? `Arrive in ${destination}. Check-in & freshen up. Explore the neighbourhood.` : `Visit ${dayAtts[0]?.name || `${destination} highlights`}`,
      afternoon: isLast ? `Pack up. Last-minute local market shopping. Head to departure point.` : `Explore ${dayAtts[1]?.name || "local gems"}. Enjoy lunch at a local favourite.`,
      evening: isLast ? `Depart — safe travels!` : `Dinner at a recommended local restaurant. Rest up for tomorrow.`,
      tips: isFirst ? `Download offline maps. Exchange currency if needed.` : `Book tickets 1 day ahead for popular spots to avoid queues.`,
    });

    if (dayAtts[0]) {
      const lat = dayAtts[0].lat && dayAtts[0].lat !== 0 ? dayAtts[0].lat : coords.lat + (Math.random() - 0.5) * 0.08;
      const lon = dayAtts[0].lon && dayAtts[0].lon !== 0 ? dayAtts[0].lon : coords.lon + (Math.random() - 0.5) * 0.08;
      waypoints.push({ name: dayAtts[0].name, latitude: lat, longitude: lon, day, category: dayAtts[0].category || "attraction" });
    }
    if (dayAtts[1]) {
      const lat = dayAtts[1].lat && dayAtts[1].lat !== 0 ? dayAtts[1].lat : coords.lat + (Math.random() - 0.5) * 0.08;
      const lon = dayAtts[1].lon && dayAtts[1].lon !== 0 ? dayAtts[1].lon : coords.lon + (Math.random() - 0.5) * 0.08;
      waypoints.push({ name: dayAtts[1].name, latitude: lat, longitude: lon, day, category: dayAtts[1].category || "attraction" });
    }
  }

  return JSON.stringify({ destination, duration: `${d} days`, travelers: t, itinerary, waypoints, travelInfo, hotelInfo, weatherSummary, budget, summary: `Complete ${d}-day ${destination} itinerary ready with ${waypoints.length} mapped locations!` });
}

// ─── TOOL: edit_trip ─────────────────────────────────────────────────────────
async function editTrip(args: Record<string, unknown>): Promise<string> {
  const { action, target, dayNumber, destination, category } = args;

  switch (action) {
    case "add_place": {
      // Fetch a new place to add
      const result = await getPlacesLive({ destination, category: category || "tourist_attractions", days: 1 });
      const parsed = JSON.parse(result);
      const place = parsed.places?.[0];
      return JSON.stringify({ action: "add_place", added: place, dayNumber, message: `Added "${place?.name}" to Day ${dayNumber || "your itinerary"}.` });
    }
    case "remove_place":
      return JSON.stringify({ action: "remove_place", removed: target, message: `Removed "${target}" from your itinerary.` });
    case "recommend_alternatives": {
      const result = await getPlacesLive({ destination, category: category || "tourist_attractions", days: 3 });
      const parsed = JSON.parse(result);
      const alts = parsed.places?.slice(0, 4) || [];
      return JSON.stringify({ action: "recommend_alternatives", alternatives: alts, message: `Here are ${alts.length} alternatives near ${destination}.` });
    }
    case "change_hotel":
      return JSON.stringify({ action: "change_hotel", message: `Searching for a ${target || "different"} hotel in ${destination}...`, hint: "Call search_hotels with a different priceRange to get alternatives." });
    case "change_transport":
      return JSON.stringify({ action: "change_transport", message: `Updating transport to ${target}. Call search_travel_options to see all modes again.` });
    default:
      return JSON.stringify({ action, message: "Trip updated successfully." });
  }
}