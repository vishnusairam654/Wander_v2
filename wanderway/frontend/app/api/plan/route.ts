import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json(
        { detail: "Not Implemented. Planning logic migrated to FastAPI backend." },
        { status: 501 }
    );
}
