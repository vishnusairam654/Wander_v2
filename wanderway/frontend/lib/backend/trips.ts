import type { TripData } from "@/types/trip";

const isMock = process.env.NEXT_PUBLIC_MOCK_APIS === "true";

export type BudgetTier = "budget" | "moderate" | "luxury";

export interface BackendTripRequest {
  destination: string;
  start_date: string;
  end_date: string;
  budget: BudgetTier;
  interests: string[];
  origin?: string;
  number_of_people: number;
  total_budget?: number;
  special_requirements?: string;
}

interface BackendActivity {
  time: string;
  title: string;
  description: string;
  location?: string | null;
  estimated_cost?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
}

interface BackendDay {
  day_number: number;
  date?: string | null;
  theme?: string | null;
  activities: BackendActivity[];
}

interface BackendTripResponse {
  destination: string;
  start_date: string;
  end_date: string;
  itinerary: BackendDay[];
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

async function mockPlanTrip(request: BackendTripRequest): Promise<TripData> {
  const days = Math.max(1, Math.round(
    (new Date(request.end_date).getTime() - new Date(request.start_date).getTime()) / 86400000,
  ));

  const itinerary: BackendDay[] = [];
  const categories = request.interests.length ? request.interests : ["sightseeing", "local food"];

  for (let day = 1; day <= days; day++) {
    const dayCategories = categories.slice((day - 1) % categories.length, (day - 1) % categories.length + 2);
    const activities: BackendActivity[] = [
      {
        time: "09:00",
        title: `Morning ${dayCategories[0] || "exploration"}`,
        description: `Enjoy ${dayCategories[0] || "local sights"} in ${request.destination}`,
        location: request.destination,
        estimated_cost: 500,
        latitude: 15.2993,
        longitude: 74.124,
        category: dayCategories[0],
      },
      {
        time: "13:00",
        title: "Lunch at local restaurant",
        description: "Authentic regional cuisine",
        location: request.destination,
        estimated_cost: 800,
        latitude: 15.2993,
        longitude: 74.124,
        category: "food",
      },
      {
        time: "16:00",
        title: `Afternoon ${dayCategories[1] || "activity"}`,
        description: `${dayCategories[1] || "Relaxing"} experience in ${request.destination}`,
        location: request.destination,
        estimated_cost: 600,
        latitude: 15.2993,
        longitude: 74.124,
        category: dayCategories[1],
      },
    ];
    itinerary.push({ day_number: day, date: request.start_date, theme: `Day ${day} in ${request.destination}`, activities });
  }

  return toTripData({ destination: request.destination, start_date: request.start_date, end_date: request.end_date, itinerary }, request.number_of_people);
}

export async function planTrip(request: BackendTripRequest): Promise<TripData> {
  if (isMock) {
    return mockPlanTrip(request);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/trips/plan`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let message = `Trip planning failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      // Keep the status-based fallback for non-JSON responses.
    }
    throw new Error(message);
  }

  return toTripData((await response.json()) as BackendTripResponse, request.number_of_people);
}

export function budgetTier(
  totalBudget: number | undefined,
  travelers: number,
  days: number,
): BudgetTier {
  if (!totalBudget || totalBudget <= 0) return "moderate";
  const perPersonPerDay = totalBudget / Math.max(travelers, 1) / Math.max(days, 1);
  if (perPersonPerDay < 4000) return "budget";
  if (perPersonPerDay > 12000) return "luxury";
  return "moderate";
}

export function requestFromPlanningMessage(message: string): BackendTripRequest {
  const destination =
    message.match(
      /(?:to|in|visit|explore)\s+([A-Za-z][A-Za-z .'-]{1,60}?)(?=\s+(?:for|from|with|on|under|budget)|[,.!?]|$)/i,
    )?.[1]?.trim() || "Goa";
  const days = clamp(Number(message.match(/(\d+)\s*(?:day|night)/i)?.[1] || 3), 1, 30);
  const travelers = clamp(
    Number(message.match(/(\d+)\s*(?:people|persons?|travelers?|adults?|pax)/i)?.[1] || 2),
    1,
    20,
  );
  const totalBudget = parseBudget(message);
  const start = new Date();
  const end = new Date(start);
  end.setDate(start.getDate() + days);
  const interests = [
    "food", "culture", "history", "nature", "adventure",
    "shopping", "nightlife", "art", "wellness",
  ].filter((interest) => message.toLowerCase().includes(interest));

  return {
    destination,
    start_date: toDateInput(start),
    end_date: toDateInput(end),
    budget: budgetTier(totalBudget, travelers, days),
    interests: interests.length ? interests : ["sightseeing", "local food"],
    number_of_people: travelers,
    total_budget: totalBudget,
    special_requirements: message,
  };
}

function toTripData(trip: BackendTripResponse, travelers: number): TripData {
  const duration = Math.max(
    1,
    Math.round(
      (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000,
    ),
  );
  const activities = trip.itinerary.flatMap((day) =>
    day.activities.map((activity) => ({ day: day.day_number, activity })),
  );
  const estimatedTotal = activities.reduce(
    (total, item) => total + (item.activity.estimated_cost || 0),
    0,
  );
  const plan = trip.itinerary
    .map((day) => {
      const heading = `## Day ${day.day_number}${day.theme ? `: ${day.theme}` : ""}`;
      const items = day.activities
        .map(
          (activity) =>
            `- **${activity.time || "Anytime"} — ${activity.title}**: ${activity.description}`,
        )
        .join("\n");
      return `${heading}\n${items}`;
    })
    .join("\n\n");

  return {
    destination: trip.destination,
    duration,
    travelers,
    plan,
    waypoints: activities
      .filter(
        ({ activity }) =>
          typeof activity.latitude === "number" && typeof activity.longitude === "number",
      )
      .map(({ day, activity }) => ({
        name: activity.title,
        latitude: activity.latitude as number,
        longitude: activity.longitude as number,
        day,
        category: activity.category || undefined,
      })),
    attractions: activities.map(({ activity }) => ({
      name: activity.title,
      description: activity.description,
      category: activity.category || "tourist_attractions",
      rating: 4.2,
      lat: activity.latitude ?? undefined,
      lon: activity.longitude ?? undefined,
      address: activity.location || undefined,
    })),
    itinerary: trip.itinerary.map((day) => {
      const [morning, afternoon, evening] = splitDay(day.activities);
      return {
        day: day.day_number,
        title: day.theme || `Explore ${trip.destination}`,
        morning,
        afternoon,
        evening,
        tips: "Times and costs are estimates; confirm availability before booking.",
      };
    }),
    totalBudget: estimatedTotal || undefined,
    perPersonBudget: estimatedTotal ? estimatedTotal / Math.max(travelers, 1) : undefined,
    toolsUsed: ["gemini_itinerary"],
    generatedAt: new Date().toISOString(),
  };
}

function splitDay(activities: BackendActivity[]): [string, string, string] {
  const descriptions = activities.map(
    (activity) => `${activity.time || "Anytime"} — ${activity.title}: ${activity.description}`,
  );
  if (descriptions.length === 1) return [descriptions[0], "Free time", "Free time"];
  if (descriptions.length === 2) return [descriptions[0], descriptions[1], "Free time"];
  return [
    descriptions[0],
    descriptions.slice(1, -1).join(" • "),
    descriptions[descriptions.length - 1],
  ];
}

function parseBudget(message: string): number | undefined {
  const match = message.match(/(?:₹|rs\.?|inr)\s*([\d,.]+)\s*(k|thousand|lakh|lac)?/i);
  if (!match) return undefined;
  let amount = Number(match[1].replace(/,/g, ""));
  const suffix = match[2]?.toLowerCase();
  if (suffix === "k" || suffix === "thousand") amount *= 1000;
  if (suffix === "lakh" || suffix === "lac") amount *= 100000;
  return Number.isFinite(amount) ? amount : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toDateInput(date: Date): string {
  return date.toISOString().split("T")[0];
}
