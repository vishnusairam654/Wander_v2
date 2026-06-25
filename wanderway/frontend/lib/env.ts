// lib/env.ts
// BUG-18 FIX: All env clients previously used ! non-null assertions with no
// runtime validation. Missing vars caused cryptic errors deep in library code.
// This module validates required env vars at startup and throws clear errors.

const SERVER_VARS = [
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GROQ_API",
] as const;

const PUBLIC_VARS = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_MAPBOX_TOKEN",
] as const;

export function validateEnv() {
    const missing: string[] = [];

    for (const key of SERVER_VARS) {
        if (!process.env[key]) missing.push(key);
    }
    for (const key of PUBLIC_VARS) {
        if (!process.env[key]) missing.push(key);
    }

    if (missing.length > 0) {
        const msg = `Missing required environment variables:\n${missing.map(k => `  • ${k}`).join("\n")}\n\nCheck your .env.local file.`;
        const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
        // During `next build`, warn so the app can compile without secrets.
        // At runtime in production, keep the hard failure.
        if (process.env.NODE_ENV === "production" && !isBuildPhase) {
            throw new Error(msg);
        } else {
            console.warn(`[WanderWay] ⚠️  ${msg}`);
        }
    }
}

// Safe env accessors with explicit error messages
export const env = {
    groqApi: () => {
        const v = process.env.GROQ_API;
        if (!v) throw new Error("GROQ_API env var is not set");
        return v;
    },
    upstashUrl: () => {
        const v = process.env.UPSTASH_REDIS_REST_URL;
        if (!v) throw new Error("UPSTASH_REDIS_REST_URL env var is not set");
        return v;
    },
    upstashToken: () => {
        const v = process.env.UPSTASH_REDIS_REST_TOKEN;
        if (!v) throw new Error("UPSTASH_REDIS_REST_TOKEN env var is not set");
        return v;
    },
    supabaseUrl: () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    supabaseServiceKey: () => {
        const v = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!v) throw new Error("SUPABASE_SERVICE_ROLE_KEY env var is not set");
        return v;
    },
    mapboxToken: () => process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
};