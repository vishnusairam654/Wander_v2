// app/page.tsx
// BUG-05 FIX: Added CustomEvent listener so TripHistoryModal (rendered inside NavBar)
//             can trigger a trip load into the page-level state.
// BUG-25 FIX: Wrapped all major sections in ErrorBoundary components so a single
//             component crash (e.g. TripMap, TripResults) doesn't blank the whole page.

"use client";

import React, { useState, useRef, useEffect } from "react";
import NavBar from "@/components/NavBar";
import ModernTripPlanner from "@/components/planning/ModernTripPlanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { TripData, Waypoint } from "@/types/trip";

export default function Page() {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [pendingMessage, setPendingMessage] = useState<string>("");

  const handleTripUpdate = (data: TripData) => {
    setTripData(data);
    setWaypoints(data.waypoints);
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
    <main className="flex flex-col min-h-screen">
      <ErrorBoundary label="Modern Trip Planner">
        <ModernTripPlanner
          onTripPlanned={handleTripUpdate}
          waypoints={waypoints}
          tripData={tripData}
          pendingMessage={pendingMessage}
          onPendingMessageConsumed={() => setPendingMessage("")}
        />
      </ErrorBoundary>
    </main>
  );
}