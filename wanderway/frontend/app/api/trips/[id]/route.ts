import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json(
        { detail: "Not Implemented. Trip retrieval migrated to FastAPI backend." },
        { status: 501 }
    );
}
