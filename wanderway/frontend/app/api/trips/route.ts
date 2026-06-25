// app/api/trips/route.ts
// Save and retrieve trips for authenticated users (Clerk)

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/redis/client";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const trips = await redis.get<unknown[]>(`trips:${userId}`) || [];
        return NextResponse.json({ trips });
    } catch (error) {
        console.error("GET /api/trips error:", error);
        return NextResponse.json({ trips: [] });
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tripData } = await req.json();
        if (!tripData) {
            return NextResponse.json({ error: "tripData is required" }, { status: 400 });
        }

        // Get existing trips
        const existing = await redis.get<unknown[]>(`trips:${userId}`) || [];

        const newTrip = {
            id: `trip-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            userId,
            destination: tripData.destination || "Unknown",
            duration: tripData.duration || 0,
            travelers: tripData.travelers || 1,
            totalBudget: tripData.totalBudget,
            generatedAt: tripData.generatedAt || new Date().toISOString(),
            tripData,
        };

        // Prepend new trip, keep max 20
        const updated = [newTrip, ...existing].slice(0, 20);
        await redis.set(`trips:${userId}`, updated, { ex: 60 * 60 * 24 * 90 }); // 90 days

        return NextResponse.json({ trip: newTrip, message: "Trip saved!" });
    } catch (error) {
        console.error("POST /api/trips error:", error);
        return NextResponse.json({ error: "Failed to save trip" }, { status: 500 });
    }
}