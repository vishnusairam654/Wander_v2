// app/api/trips/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/redis/client";

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const existing = await redis.get<Array<{ id: string }>>(`trips:${userId}`) || [];
        const updated = existing.filter((t) => t.id !== id);
        await redis.set(`trips:${userId}`, updated, { ex: 60 * 60 * 24 * 90 });

        return NextResponse.json({ message: "Trip deleted" });
    } catch (error) {
        console.error("DELETE /api/trips/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}