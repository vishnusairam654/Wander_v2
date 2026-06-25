// app/api/plan/route.ts
// Main planning endpoint. Returns full structured TripData for UI rendering.

import { NextResponse } from "next/server";
import { planTrip } from "@/lib/ai/agent";
import { getChatHistory, saveChatHistory, redis } from "@/lib/redis/client";
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
});

export async function POST(req: Request) {
    try {
        const { message, threadId } = await req.json();

        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await ratelimit.limit(ip);
        if (!success) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        if (!message || !threadId) {
            return NextResponse.json({ error: "message and threadId are required" }, { status: 400 });
        }

        const history = await getChatHistory(threadId);

        const result = await planTrip({
            userMessage: message,
            conversationHistory: history,
        });

        const updatedHistory = [
            ...history,
            { role: "user" as const, content: message },
            { role: "assistant" as const, content: result.plan },
        ];
        await saveChatHistory(threadId, updatedHistory);

        // Attempt Supabase save (non-fatal)
        if (result.waypoints.length > 0) {
            try {
                const { createClient } = await import("@/lib/supabase/server");
                const supabase = await createClient();
                await supabase.from("trips").upsert(
                    {
                        thread_id: threadId,
                        destination: result.destination || extractDestination(message),
                        plan_data: {
                            plan: result.plan,
                            toolsUsed: result.toolCallsMade,
                            budgetBreakdown: result.budgetBreakdown,
                            weatherData: result.weatherData,
                        },
                        map_waypoints: result.waypoints,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "thread_id" }
                );
            } catch {
                console.warn("Supabase save skipped");
            }
        }

        return NextResponse.json({
            // Core
            message: result.plan,
            toolsUsed: result.toolCallsMade,
            waypoints: result.waypoints,
            // Structured data for TripResults
            destination: result.destination || extractDestination(message),
            duration: result.duration || extractDuration(message),
            travelers: result.travelers || extractTravelers(message),
            budgetBreakdown: result.budgetBreakdown || null,
            totalBudget: result.totalBudget || null,
            perPersonBudget: result.perPersonBudget || null,
            weatherData: result.weatherData || null,
            hotels: result.hotels || null,
            travelOptions: result.travelOptions || null,
            attractions: result.attractions || null,
            itinerary: result.itinerary || null,
            localTransport: result.localTransport || null,
        });
    } catch (error: unknown) {
        console.error("Plan API error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: "Planning failed", details: message }, { status: 500 });
    }
}

function extractDestination(message: string): string {
    const patterns = [
        /(?:to|in|visit|explore)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
        /trip\s+to\s+([A-Z][a-z]+)/i,
    ];
    for (const p of patterns) {
        const m = message.match(p);
        if (m) return m[1];
    }
    const words = message.split(" ");
    const toIndex = words.findIndex(w => w.toLowerCase() === "to");
    if (toIndex !== -1 && words[toIndex + 1]) {
        return words[toIndex + 1].replace(/[^a-zA-Z]/g, "");
    }
    return "Unknown";
}

function extractDuration(message: string): number {
    const m = message.match(/(\d+)\s*(?:day|night)/i);
    return m ? parseInt(m[1]) : 3;
}

function extractTravelers(message: string): number {
    const m = message.match(/(\d+)\s*(?:person|people|traveler|adult|pax)/i);
    if (m) return parseInt(m[1]);
    const w = message.match(/for\s+(\d+)/i);
    return w ? parseInt(w[1]) : 2;
}