// lib/redis/client.ts
// Upstash Redis for persisting chat history (7-day TTL)
// Stores full conversation as one key to minimize command count.

import { Redis } from "@upstash/redis";

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CHAT_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export async function getChatHistory(threadId: string): Promise<ChatMessage[]> {
    try {
        const history = await redis.get<ChatMessage[]>(`chat:${threadId}`);
        return history || [];
    } catch {
        return [];
    }
}

export async function saveChatHistory(threadId: string, messages: ChatMessage[]): Promise<void> {
    try {
        // Keep last 30 messages to avoid context window overflow
        const trimmed = messages.slice(-30);
        await redis.set(`chat:${threadId}`, trimmed, { ex: CHAT_TTL });
    } catch {
        // Redis failure is non-fatal — chat continues without persistence
        console.error("Redis save failed");
    }
}

export async function clearChatHistory(threadId: string): Promise<void> {
    try {
        await redis.del(`chat:${threadId}`);
    } catch {
        console.error("Redis delete failed");
    }
}