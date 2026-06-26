"use client";

import { useState, useCallback, useRef } from "react";
import type { TripData } from "@/types/trip";

interface UseStreamingTripResult {
  isStreaming: boolean;
  progress: string;
  streamedChunks: string[];
  startStream: (requestBody: object) => Promise<TripData>;
  reset: () => void;
}

export function useStreamingTrip(): UseStreamingTripResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState("Generating your itinerary...");
  const [streamedChunks, setStreamedChunks] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (requestBody: object): Promise<TripData> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsStreaming(true);
    setProgress("Planning your trip...");
    setStreamedChunks([]);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const url = `${API_BASE}/api/v1/stream/plan`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Stream request failed (${response.status})`);
      }

      if (!response.body) {
        throw new Error("No response body for stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      const statuses = [
        "Understanding your travel preferences...",
        "Building a geographically sensible route...",
        "Balancing activities and downtime...",
        "Finalizing your itinerary...",
      ];
      let statusIdx = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const dataLine = event.startsWith("data: ") ? event.slice(6) : event;

          if (dataLine === "[DONE]") break;

          if (dataLine) {
            accumulated += dataLine;
            setStreamedChunks((prev) => [...prev, dataLine]);

            if (statusIdx < statuses.length) {
              setProgress(statuses[statusIdx++]);
            }

            // Try to parse as JSON for validation
            try {
              JSON.parse(accumulated);
            } catch {
              // Still accumulating, keep going
            }
          }
        }

        setProgress(
          statusIdx < statuses.length
            ? statuses[statusIdx]
            : "Almost there..."
        );
      }

      // Parse complete accumulated JSON
      if (accumulated) {
        const parsed = JSON.parse(accumulated);
        setIsStreaming(false);
        setProgress("");
        return parsed as TripData;
      }

      throw new Error("No data received from stream");
    } catch (error) {
      if ((error as Error).name === "AbortError") return {} as TripData;
      setIsStreaming(false);
      setProgress("");
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setProgress("");
    setStreamedChunks([]);
  }, []);

  return { isStreaming, progress, streamedChunks, startStream, reset };
}
