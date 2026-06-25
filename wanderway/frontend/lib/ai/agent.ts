// lib/ai/agent.ts
// Agentic loop powered by Groq (llama-3.3-70b-versatile with tool use)
// Captures ALL tool results for structured display in TripResults.

import { Groq } from "groq-sdk";
import { TRAVEL_TOOLS } from "./tools";
import { executeTool } from "./tool-executor";
import type { Waypoint, HotelOption, TravelOption, Attraction, ItineraryDay, BudgetBreakdown, LocalTransportOption } from "@/types/trip";

const groqApiKey = process.env.GROQ_API_KEY ?? process.env.GROQ_API;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

const SYSTEM_PROMPT = `You are WanderWay AI, an expert autonomous travel planner for Indian destinations.

When a user asks you to plan a trip, you MUST call tools in this order:
1. get_places_live — find tourist attractions (category: "tourist_attractions")
2. get_places_live — find restaurants (category: "restaurants")
3. get_weather_forecast — check the weather (use realistic lat/lon for the destination)
4. search_travel_options — find ALL travel modes: flights, trains, buses, road trips, cabs (NOT just flights)
5. search_hotels — find accommodation
6. estimate_trip_budget — calculate costs
7. get_local_transport — find local transport
8. create_itinerary — build the final day-by-day plan LAST

Call ALL relevant tools before giving a final answer. Never give a trip plan without using tools first.
IMPORTANT: For travel, use search_travel_options (not search_flights) to show all modes including trains, buses, road trips.

After all tools complete, write a warm, structured response with:
- ✈️ Travel options (show all modes — flights, trains, buses)
- 🏨 Hotel recommendation
- 🌤️ Weather summary
- 📍 Day-by-day itinerary highlights
- 💰 Budget breakdown
- 🚗 Local transport tips

For general travel questions (not trip planning), answer helpfully from your knowledge.
Keep responses friendly, detailed, and enthusiastic about travel.`;

export interface TripPlanResult {
  plan: string;
  toolCallsMade: string[];
  waypoints: Waypoint[];
  budgetBreakdown?: BudgetBreakdown;
  totalBudget?: number;
  perPersonBudget?: number;
  weatherData?: {
    forecast: Array<{ date: string; maxTemp: number; minTemp: number; precipitation: number; condition: string }>;
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
  destination?: string;
  duration?: number;
  travelers?: number;
}

export async function planTrip({
  userMessage,
  conversationHistory = [],
}: {
  userMessage: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<TripPlanResult> {
  if (!groq) {
    return {
      plan: "Groq is not configured. Set GROQ_API_KEY or GROQ_API to enable trip planning.",
      toolCallsMade: [],
      waypoints: [],
    };
  }

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const toolCallsMade: string[] = [];
  let waypoints: Waypoint[] = [];
  let budgetBreakdown: BudgetBreakdown | undefined;
  let totalBudget: number | undefined;
  let perPersonBudget: number | undefined;
  let weatherData: TripPlanResult["weatherData"];
  let hotels: HotelOption[] | undefined;
  let travelOptions: TravelOption[] | undefined;
  let attractions: Attraction[] = [];
  let itinerary: ItineraryDay[] | undefined;
  let localTransport: TripPlanResult["localTransport"];
  let destination: string | undefined;
  let duration: number | undefined;
  let travelers: number | undefined;

  const MAX_ITERATIONS = 20;
  let iteration = 0;

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      tools: TRAVEL_TOOLS,
      tool_choice: "auto",
      temperature: 0.6,
      max_tokens: 4096,
    });

    const choice = response.choices[0];
    const assistantMessage = choice.message;

    messages.push({
      role: "assistant",
      content: assistantMessage.content || "",
      ...(assistantMessage.tool_calls ? { tool_calls: assistantMessage.tool_calls } : {}),
    } as Groq.Chat.ChatCompletionMessageParam);

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return {
        plan: assistantMessage.content || "I could not generate a trip plan. Please try again.",
        toolCallsMade,
        waypoints,
        budgetBreakdown,
        totalBudget,
        perPersonBudget,
        weatherData,
        hotels,
        travelOptions,
        attractions: attractions.length > 0 ? attractions : undefined,
        itinerary,
        localTransport,
        destination,
        duration,
        travelers,
      };
    }

    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      toolCallsMade.push(toolName);

      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        args = {};
      }

      const result = await executeTool(toolName, args);

      // ── Capture structured data from each tool ────────────────────────
      try {
        const parsed = JSON.parse(result);

        switch (toolName) {
          case "search_travel_options":
          case "search_flights":
            if (parsed.travelOptions) {
              travelOptions = parsed.travelOptions;
            }
            break;

          case "search_hotels":
            if (parsed.hotels) {
              hotels = parsed.hotels;
            }
            break;

          case "get_places_live":
          case "get_attractions":
            if (parsed.places && parsed.places.length > 0) {
              // Separate restaurants from attractions
              const cat = (args.category as string) || parsed.category || "";
              if (cat === "restaurants") {
                // store restaurants as attractions with category marker
                const restaurants = parsed.places.map((p: Attraction) => ({
                  ...p,
                  category: "restaurants",
                }));
                attractions = [...attractions, ...restaurants];
              } else {
                attractions = [
                  ...attractions,
                  ...parsed.places.filter(
                    (p: Attraction) => p.category !== "restaurants"
                  ),
                ];
              }
            }
            break;

          case "get_weather_forecast":
            if (parsed.forecast || parsed.avgMax !== undefined) {
              weatherData = {
                forecast: parsed.forecast || [],
                avgMax: parsed.avgMax || 30,
                avgMin: parsed.avgMin || 22,
                rainyDays: parsed.rainyDays || 0,
                summary: parsed.summary || "",
                city: parsed.city || (args.city as string) || "",
              };
            }
            break;

          case "estimate_trip_budget":
            if (parsed.breakdown) {
              budgetBreakdown = parsed.breakdown;
              totalBudget = parsed.totalINR;
              perPersonBudget = parsed.perPersonINR;
              if (!travelers && args.travelers) travelers = Number(args.travelers);
              if (!duration && args.days) duration = Number(args.days);
              if (!destination && args.destination) destination = args.destination as string;
            }
            break;

          case "get_local_transport":
            if (parsed.options) {
              localTransport = {
                destination: parsed.destination || (args.destination as string) || "",
                options: parsed.options,
                summary: parsed.summary || "",
              };
            }
            break;

          case "create_itinerary":
            if (parsed.waypoints) waypoints = parsed.waypoints;
            if (parsed.itinerary) itinerary = parsed.itinerary;
            if (parsed.destination) destination = parsed.destination;
            if (parsed.duration) {
              const match = String(parsed.duration).match(/\d+/);
              if (match) duration = parseInt(match[0]);
            }
            if (parsed.travelers) travelers = Number(parsed.travelers);
            break;

          case "edit_trip":
            // If edit returned new attractions or alternatives, update
            if (parsed.alternatives) {
              // Add to existing, don't wipe
              const newAtts = parsed.alternatives.map((a: Attraction) => ({
                ...a,
                category: a.category || "tourist_attractions",
              }));
              attractions = [...attractions, ...newAtts];
            }
            break;
        }
      } catch {
        // Non-JSON result, ignore parsing
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      } as Groq.Chat.ChatCompletionMessageParam);
    }
  }

  return {
    plan: "Trip planning took too long. Please try a simpler request.",
    toolCallsMade,
    waypoints,
    budgetBreakdown,
    totalBudget,
    perPersonBudget,
    weatherData,
    hotels,
    travelOptions,
    attractions: attractions.length > 0 ? attractions : undefined,
    itinerary,
    localTransport,
    destination,
    duration,
    travelers,
  };
}

export async function chatWithAssistant({
  userMessage,
  conversationHistory = [],
  tripContext = "",
}: {
  userMessage: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  tripContext?: string;
}): Promise<string> {
  const systemPrompt = `You are WanderWay AI, a friendly travel companion helping users with their trip.
${tripContext ? `Current trip context: ${tripContext}` : ""}

Answer travel questions helpfully. For transport/rental questions, give practical advice.
You can also use tools to search for updated information if needed.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: userMessage },
    ],
    tools: TRAVEL_TOOLS,
    tool_choice: "auto",
    temperature: 0.7,
    max_tokens: 1024,
  });

  const choice = response.choices[0];
  const msg = choice.message;

  if (msg.tool_calls && msg.tool_calls.length > 0) {
    const toolMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: userMessage },
      { role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls } as Groq.Chat.ChatCompletionMessageParam,
    ];

    for (const toolCall of msg.tool_calls) {
      let args: Record<string, unknown> = {};
      try { args = JSON.parse(toolCall.function.arguments); } catch { /* ignore */ }
      const result = await executeTool(toolCall.function.name, args);
      toolMessages.push({ role: "tool", tool_call_id: toolCall.id, content: result } as Groq.Chat.ChatCompletionMessageParam);
    }

    const finalResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: toolMessages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    return finalResponse.choices[0].message.content || "Could not get a response. Please try again.";
  }

  return msg.content || "Could not get a response. Please try again.";
}