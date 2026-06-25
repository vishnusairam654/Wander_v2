// proxy.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/api/plan(.*)", "/api/chat(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        const { userId } = await auth();
        if (!userId) {
            return new Response(JSON.stringify({ error: "Unauthorized. Please sign in." }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }
        await auth.protect();
    }
});