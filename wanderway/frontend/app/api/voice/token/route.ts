// app/api/voice/token/route.ts
// Issues LiveKit JWT tokens for voice rooms.
// Room name is based on threadId so friends in the same trip share one room.

import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(req: Request) {
    try {
        const { roomName, username } = await req.json();

        if (!roomName || !username) {
            return NextResponse.json(
                { error: "roomName and username are required" },
                { status: 400 }
            );
        }

        if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
            return NextResponse.json(
                { error: "LiveKit not configured" },
                { status: 503 }
            );
        }

        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            {
                identity: username,
                name: username,
                ttl: "4h",
            }
        );

        at.addGrant({
            roomJoin: true,
            room: `wandr-${roomName}`,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        const token = await at.toJwt();

        return NextResponse.json({
            token,
            url: process.env.LIVEKIT_URL,
            roomName: `wandr-${roomName}`,
        });
    } catch (error: unknown) {
        console.error("Voice token error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to generate voice token", details: message },
            { status: 500 }
        );
    }
}