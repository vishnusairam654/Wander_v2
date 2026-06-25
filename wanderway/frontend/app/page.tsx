// app/page.tsx
// BUG-05 FIX: Added CustomEvent listener so TripHistoryModal (rendered inside NavBar)
//             can trigger a trip load into the page-level state.
// BUG-25 FIX: Wrapped all major sections in ErrorBoundary components so a single
//             component crash (e.g. TripMap, TripResults) doesn't blank the whole page.

"use client";

import React, { useState, useRef, useEffect } from "react";
import NavBar from "@/components/NavBar";
import TripForm from "@/components/planning/TripForm";
import TripMap from "@/components/planning/TripMap";
import ChatBot from "@/components/planning/ChatBot";
import TripResults from "@/components/planning/TripResults";
import WeatherWidget from "@/components/planning/WeatherWidget";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { TripData, Waypoint } from "@/types/trip";

export default function Page() {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [pendingMessage, setPendingMessage] = useState<string>("");
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleTripUpdate = (data: TripData) => {
    setTripData(data);
    setWaypoints(data.waypoints);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 400);
  };

  const handleEditRequest = (message: string) => {
    setPendingMessage(message);
  };

  // BUG-05 FIX: Listen for the 'wandr:load-trip' custom event dispatched by
  // TripHistoryModal (via NavBar). This decouples NavBar from page-level state
  // without requiring prop drilling through the layout.
  useEffect(() => {
    const handler = (e: Event) => {
      const tripData = (e as CustomEvent<TripData>).detail;
      if (tripData) handleTripUpdate(tripData);
    };
    window.addEventListener("wandr:load-trip", handler);
    return () => window.removeEventListener("wandr:load-trip", handler);
  }, []);

  return (
    <main className="flex flex-col min-h-screen bg-background">
      <NavBar />

      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8 space-y-16">

        {/* ── Row 1: TripForm (left) + ChatBot (right) ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1.5 bg-secondary rounded-full" />
            <h2 className="text-3xl font-eagle font-bold text-foreground">
              Plan Your Journey
            </h2>
          </div>
          <div className="flex flex-col lg:flex-row w-full gap-8">
            <div className="w-full lg:w-1/3">
              <ErrorBoundary label="Trip Form">
                <TripForm onTripPlanned={handleTripUpdate} />
              </ErrorBoundary>
            </div>
            <div className="w-full lg:w-2/3">
              <ErrorBoundary label="Chat Assistant">
                <ChatBot
                  onTripDataUpdate={handleTripUpdate}
                  pendingMessage={pendingMessage}
                  onPendingMessageConsumed={() => setPendingMessage("")}
                />
              </ErrorBoundary>
            </div>
          </div>
        </section>

        {/* ── Row 2: TripMap (left) + WeatherWidget (right) ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1.5 bg-primary rounded-full" />
            <h2 className="text-3xl font-eagle font-bold text-foreground">
              Trip Map
            </h2>
          </div>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 h-[480px] lg:h-[520px]">
              <ErrorBoundary label="Trip Map">
                <TripMap waypoints={waypoints} />
              </ErrorBoundary>
            </div>
            <div className="w-full lg:w-72 shrink-0">
              <ErrorBoundary label="Weather Widget">
                <WeatherWidget
                  city={tripData?.destination || "Goa"}
                  days={5}
                  className="h-full"
                />
              </ErrorBoundary>
            </div>
          </div>
        </section>

        {/* ── Row 3: Trip Results ── */}
        <section ref={resultsRef} className="w-full pb-24">
          <ErrorBoundary label="Trip Results">
            <TripResults
              tripData={tripData}
              onEditRequest={handleEditRequest}
            />
          </ErrorBoundary>
        </section>

      </div>
    </main>
  );
}