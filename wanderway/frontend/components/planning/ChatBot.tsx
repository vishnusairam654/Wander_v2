"use client";
// components/planning/ChatBot.tsx
// BUG-04 FIX: pendingMessage was consumed (onPendingMessageConsumed called) BEFORE
//             the message was sent, causing silent message loss on errors.
//             Now consumed only after handleSendMessage is called.
// BUG-09 FIX: handleSendMessage useCallback had `input` in dependency array even
//             though the fn takes messageText as parameter and never reads `input`.
//             Removed `input` from deps — was causing unnecessary re-creation on keystrokes.
// BUG-27 FIX: VoiceButton and VoiceBanner are imported and wired into the ChatBot header.

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  Send, Bot, User, Loader2, Sparkles, Map, Wrench,
  Plane, Hotel, Cloud, List, Wallet, Car, Zap, Train, Bus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getThreadId } from "@/lib/utils";
import { VoiceButton, VoiceBanner } from "@/components/voice/VoiceButton";
import type { TripData, Waypoint } from "@/types/trip";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  waypoints?: Waypoint[];
  isPlanning?: boolean;
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  search_flights: <Plane size={10} />,
  search_travel_options: <Train size={10} />,
  search_hotels: <Hotel size={10} />,
  get_weather_forecast: <Cloud size={10} />,
  get_attractions: <Map size={10} />,
  get_places_live: <Map size={10} />,
  estimate_trip_budget: <Wallet size={10} />,
  create_itinerary: <List size={10} />,
  get_local_transport: <Car size={10} />,
  edit_trip: <Sparkles size={10} />,
};

const TOOL_LABELS: Record<string, string> = {
  search_flights: "Flights",
  search_travel_options: "Travel Options",
  search_hotels: "Hotels",
  get_weather_forecast: "Weather",
  get_attractions: "Attractions",
  get_places_live: "Places",
  estimate_trip_budget: "Budget",
  create_itinerary: "Itinerary",
  get_local_transport: "Transport",
  edit_trip: "Editing Trip",
};

const PLANNING_KEYWORDS = [
  "plan", "trip", "travel", "visit", "go to", "explore", "holiday",
  "vacation", "tour", "days in", "weekend in", "itinerary", "replace",
  "add", "remove", "change", "update", "edit", "swap", "suggest",
];

function isPlanningRequest(message: string): boolean {
  const lower = message.toLowerCase();
  return PLANNING_KEYWORDS.some(k => lower.includes(k));
}

interface ChatBotProps {
  /** @deprecated use onTripDataUpdate instead */
  onWaypointsUpdate?: (waypoints: Waypoint[]) => void;
  onTripDataUpdate?: (data: TripData) => void;
  pendingMessage?: string;
  onPendingMessageConsumed?: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({
  onWaypointsUpdate,
  onTripDataUpdate,
  pendingMessage,
  onPendingMessageConsumed,
}) => {
  const clerk = useClerk();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your WanderWay AI 🌍\n\nTell me where you'd like to go and I'll plan your entire trip — **all travel modes** (flights, trains, buses), hotels, weather, restaurant picks, and a full itinerary!\n\nTry: **\"Plan a 4-day trip to Goa for 2 people\"**\n\nOr use the form on the left to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [planningStatus, setPlanningStatus] = useState<string>("");
  // BUG-27: voice active state for rendering VoiceBanner
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadId = useRef<string>("");

  useEffect(() => {
    threadId.current = getThreadId(); // BUG-10: now from shared utility
  }, []);

  // BUG-04 FIX: consume AFTER calling send, not before.
  // Removed the 100ms setTimeout — it was an arbitrary delay with no guarantee.
  useEffect(() => {
    if (pendingMessage && !isLoading) {
      const msg = pendingMessage;
      onPendingMessageConsumed?.(); // clear parent state first to prevent double-fire
      handleSendMessage(msg);       // then send immediately
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, planningStatus]);

  // BUG-09 FIX: Removed `input` from dependency array — fn takes messageText as param
  // and never reads `input` from closure. Having it caused re-creation on every keystroke.
  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = messageText.trim();
    const isPlanning = isPlanningRequest(userMessage);

    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    if (isPlanning) {
      setPlanningStatus("🔍 Searching attractions...");
    }

    try {
      const endpoint = isPlanning ? "/api/plan" : "/api/chat";
      const body = isPlanning
        ? { message: userMessage, threadId: threadId.current }
        : {
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage },
          ],
          threadId: threadId.current,
        };

      if (isPlanning) {
        const statuses = [
          "🌤️ Checking weather...",
          "🚂 Finding all travel options (trains, flights, buses)...",
          "🏨 Searching hotels...",
          "🍽️ Finding restaurants...",
          "💰 Calculating budget...",
          "📍 Building your itinerary...",
        ];
        let idx = 0;
        const interval = setInterval(() => {
          if (idx < statuses.length) setPlanningStatus(statuses[idx++]);
        }, 3000);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        clearInterval(interval);
        setPlanningStatus("");

        if (!response.ok) {
          if (response.status === 401) {
            clerk.openSignIn();
            // Rollback the optimistic UI message
            setMessages(prev => prev.slice(0, -1));
            return;
          }
          const text = await response.text();
          console.error("API Error:", text);
          throw new Error("API failed: " + text);
        }

        const data = await response.json();

        if (data.message) {
          const newMsg: Message = {
            role: "assistant",
            content: data.message,
            toolsUsed: data.toolsUsed,
            waypoints: data.waypoints,
            isPlanning: true,
          };
          setMessages(prev => [...prev, newMsg]);

          if (onTripDataUpdate) {
            const tripData: TripData = {
              destination: data.destination || "Unknown",
              duration: data.duration || 3,
              travelers: data.travelers || 2,
              plan: data.message,
              waypoints: data.waypoints || [],
              budgetBreakdown: data.budgetBreakdown || undefined,
              totalBudget: data.totalBudget || undefined,
              perPersonBudget: data.perPersonBudget || undefined,
              weatherData: data.weatherData || undefined,
              hotels: data.hotels || undefined,
              travelOptions: data.travelOptions || undefined,
              attractions: data.attractions || undefined,
              itinerary: data.itinerary || undefined,
              localTransport: data.localTransport || undefined,
              toolsUsed: data.toolsUsed || [],
              generatedAt: new Date().toISOString(),
            };
            onTripDataUpdate(tripData);
          }

          if (data.waypoints?.length > 0 && onWaypointsUpdate) {
            onWaypointsUpdate(data.waypoints);
          }
        } else {
          const errorMessage = data.details || data.error || "Planning failed";
          setMessages(prev => [
            ...prev,
            {
              role: "assistant",
              content: `I couldn't complete the trip plan right now. ${errorMessage}`,
            },
          ]);
        }
      } else {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          if (response.status === 401) {
            clerk.openSignIn();
            setMessages(prev => prev.slice(0, -1));
            return;
          }
          const text = await response.text();
          console.error("API Error:", text);
          throw new Error("API failed: " + text);
        }

        const data = await response.json();
        if (data.message) {
          setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
        } else {
          setMessages(prev => [
            ...prev,
            {
              role: "assistant",
              content: `I couldn't complete that request. ${data.details || data.error || "Something went wrong"}`,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setPlanningStatus("");
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please check your API keys are configured and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setPlanningStatus("");
    }
    // BUG-09 FIX: `input` removed from deps. Full dep list:
  }, [isLoading, messages, onTripDataUpdate, onWaypointsUpdate]);

  const handleSend = useCallback(() => {
    handleSendMessage(input);
    setInput("");
  }, [input, handleSendMessage]);

  const formatContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("# "))
        return <p key={i} className="font-bold text-base mt-3 mb-1">{line.slice(2)}</p>;
      if (line.startsWith("## "))
        return <p key={i} className="font-semibold mt-2 mb-1">{line.slice(3)}</p>;
      if (line.startsWith("- ") || line.startsWith("• "))
        return <p key={i} className="pl-3 before:content-['•'] before:mr-2 before:text-primary">{line.slice(2)}</p>;
      if (line.trim() === "") return <div key={i} className="h-1.5" />;
      const boldParts = line.split(/\*\*(.*?)\*\*/g);
      if (boldParts.length > 1) {
        return (
          <p key={i}>
            {boldParts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          </p>
        );
      }
      return <p key={i}>{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[600px] w-full bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-2xl shadow-primary/5">
      {/* Header */}
      <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary-foreground/20 p-2 rounded-xl">
            <Bot size={20} className="text-secondary" />
          </div>
          <div>
            <h3 className="font-eagle font-bold text-sm tracking-wide">WanderWay AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              <span className="text-[10px] opacity-80 uppercase tracking-widest font-medium">
                {isLoading ? "Planning..." : "Online · All Travel Modes"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 opacity-60">
            <Zap size={14} className="text-secondary" />
            <span className="text-[10px] uppercase tracking-widest">Groq · Llama 3.3</span>
          </div>
          {/* BUG-27 FIX: VoiceButton now rendered in ChatBot header */}
          <VoiceButton
            threadId={threadId.current}
            onVoiceActiveChange={setIsVoiceActive}
          />
        </div>
      </div>

      {/* BUG-27 FIX: VoiceBanner shown when voice is active */}
      {isVoiceActive && (
        <VoiceBanner
          threadId={threadId.current}
          onClose={() => setIsVoiceActive(false)}
        />
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none shadow-md shadow-primary/10"
                  : "bg-muted text-foreground rounded-tl-none border border-border/30"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5 opacity-60">
                {msg.role === "user" ? <User size={12} /> : <Bot size={12} />}
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  {msg.role === "user" ? "You" : "WanderWay AI"}
                </span>
              </div>
              <div className="space-y-0.5">
                {msg.role === "assistant" ? formatContent(msg.content) : msg.content}
              </div>
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 w-full mb-1">
                    <Wrench size={10} /> Tools used:
                  </span>
                  {[...new Set(msg.toolsUsed)].map((tool, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-medium border border-primary/20"
                    >
                      {TOOL_ICONS[tool] || <Zap size={10} />}
                      {TOOL_LABELS[tool] || tool}
                    </span>
                  ))}
                </div>
              )}
              {msg.waypoints && msg.waypoints.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-primary font-medium">
                  <Map size={10} />
                  <span>{msg.waypoints.length} locations pinned on map</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-none border border-border/30 max-w-[88%]">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span className="text-xs text-muted-foreground italic">
                  {planningStatus || "Thinking..."}
                </span>
              </div>
              {planningStatus && (
                <div className="mt-2 flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {[
            "Plan a 3-day trip to Goa for 2 people",
            "Weekend in Manali for 4",
            "5 days in Rajasthan, budget ₹15,000",
          ].map((s, i) => (
            <button
              suppressHydrationWarning
              key={i}
              onClick={() => setInput(s)}
              className="shrink-0 text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors font-medium"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-background/50 border-t border-border/30 shrink-0">
        <div className="relative flex items-center gap-2 bg-muted/50 p-1.5 rounded-2xl border border-border/50 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
          <input
            suppressHydrationWarning
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Plan a trip or ask anything..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 py-2 text-foreground placeholder:text-muted-foreground/60 font-milkywalky"
          />
          <button
            suppressHydrationWarning
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-300",
              input.trim() && !isLoading
                ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95"
                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            )}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Flights · Trains · Buses · Hotels · Restaurants · Live Weather
        </p>
      </div>
    </div>
  );
};

export default ChatBot;