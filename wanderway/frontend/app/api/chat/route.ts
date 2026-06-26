// app/api/chat/route.ts
// Ongoing chat endpoint — used for general travel questions after planning.
// Uses Redis history + Groq with tool support.

import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { chatWithAssistant } from "@/lib/ai/agent";
import { getChatHistory, saveChatHistory } from "@/lib/redis/client";

export async function POST(req: Request) {
  try {
    const { messages, threadId, tripContext } = await req.json();

    // Support both old format (messages array) and new format (threadId + single message)
    if (threadId) {
      const lastMessage = messages?.[messages.length - 1]?.content || "";
      const history = await getChatHistory(threadId);

      const reply = await chatWithAssistant({
        userMessage: lastMessage,
        conversationHistory: history,
        tripContext: tripContext || "",
      });

      const updatedHistory = [
        ...history,
        { role: "user" as const, content: lastMessage },
        { role: "assistant" as const, content: reply },
      ];
      await saveChatHistory(threadId, updatedHistory);

      return NextResponse.json({ message: reply });
    }

    // Legacy format — direct messages array (used by original ChatBot.tsx)
    const groqApiKey = process.env.GROQ_API_KEY ?? process.env.GROQ_API;
    if (!groqApiKey) {
      return NextResponse.json(
        { detail: "Groq is not configured. Set GROQ_API_KEY or GROQ_API." },
        { status: 500 }
      );
    }
    const groq = new Groq({ apiKey: groqApiKey });

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are WanderWay AI, a premium travel assistant. Your goal is to help users plan amazing trips with a focus on nature, adventure, and immersive experiences. Be helpful, enthusiastic, and provide detailed travel advice. Keep your tone professional yet adventurous.",
        },
        ...(messages || []),
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    return NextResponse.json({
      message:
        response.choices[0]?.message?.content ||
        "I'm sorry, I couldn't process that request.",
    });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    );
  }
}