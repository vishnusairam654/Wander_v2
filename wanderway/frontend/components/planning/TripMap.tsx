"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import type { Waypoint } from "@/types/trip";

interface TripMapProps {
  waypoints?: Waypoint[];
  tripId?: string;
}

const DAY_COLORS = ["#1A6B4A", "#FBBF24", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#84CC16"];

export default function TripMap({ waypoints: externalWaypoints = [], tripId }: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>(externalWaypoints);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        console.error("NEXT_PUBLIC_MAPBOX_TOKEN is not set");
        return;
    }
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: process.env.NEXT_PUBLIC_MAPBOX_STYLE || "mapbox://styles/mapbox/outdoors-v12",
      center: [77.5946, 12.9716], // Bengaluru default
      zoom: 5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update waypoints from external prop
  useEffect(() => {
    if (externalWaypoints.length > 0) {
      setWaypoints(externalWaypoints);
    }
  }, [externalWaypoints]);

  // Subscribe to Supabase Realtime for live waypoint updates
  useEffect(() => {
    if (!tripId) return;

    let channel: ReturnType<typeof import("@/lib/supabase/client").supabase.channel> | null = null;

    async function subscribe() {
      const { supabase } = await import("@/lib/supabase/client");
      channel = supabase
        .channel(`trip-waypoints-${tripId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "trips",
            filter: `id=eq.${tripId}`,
          },
          (payload) => {
            const newWaypoints = payload.new?.map_waypoints;
            if (newWaypoints) {
              setWaypoints(newWaypoints);
            }
          }
        )
        .subscribe();
    }

    subscribe().catch(err => console.error("Supabase subscribe error:", err));

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [tripId]);

  // Render markers when waypoints change
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    if (waypoints.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    waypoints.forEach((wp, i) => {
      if (!wp.latitude || !wp.longitude) return;

      const color = DAY_COLORS[(wp.day - 1) % DAY_COLORS.length];

      // Custom marker element
      const el = document.createElement("div");
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      const inner = document.createElement("span");
      inner.style.cssText = `
        transform: rotate(45deg);
        color: white;
        font-size: 11px;
        font-weight: bold;
      `;
      inner.textContent = String(wp.day);
      el.appendChild(inner);

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="padding: 8px; font-family: sans-serif;">
            <p style="font-weight: bold; margin: 0 0 4px; font-size: 13px;">${wp.name}</p>
            <p style="margin: 0; color: #666; font-size: 11px;">Day ${wp.day}</p>
          </div>
        `);

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([wp.longitude, wp.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
      bounds.extend([wp.longitude, wp.latitude]);
    });

    // Fit map to show all waypoints
    if (waypoints.length > 1) {
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 12, duration: 1500 });
    } else if (waypoints.length === 1) {
      map.current.flyTo({
        center: [waypoints[0].longitude, waypoints[0].latitude],
        zoom: 11,
        duration: 1500,
      });
    }

    // Draw route line between waypoints
    if (waypoints.length > 1 && map.current.isStyleLoaded()) {
      drawRoute(waypoints);
    } else if (waypoints.length > 1) {
      map.current.on("load", () => drawRoute(waypoints));
    }
  }, [waypoints]);

  function drawRoute(wps: Waypoint[]) {
    if (!map.current) return;

    // Remove existing route
    if (map.current.getSource("route")) {
      map.current.removeLayer("route-line");
      map.current.removeSource("route");
    }

    const coordinates = wps
      .filter(wp => wp.latitude && wp.longitude)
      .sort((a, b) => a.day - b.day)
      .map(wp => [wp.longitude, wp.latitude]);

    if (coordinates.length < 2) return;

    map.current.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      },
    });

    map.current.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#1A6B4A",
        "line-width": 2,
        "line-dasharray": [2, 2],
        "line-opacity": 0.6,
      },
    });
  }

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div
        ref={mapContainer}
        className="w-full h-full rounded-3xl overflow-hidden shadow-lg border border-border/60 shadow-primary/5"
      />

      {/* Waypoint legend */}
      {waypoints.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-md rounded-2xl border border-border/50 p-3 shadow-lg max-w-[200px]">
          <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-primary rounded-full" />
            {waypoints.length} stops planned
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {waypoints.slice(0, 5).map((wp, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold"
                  style={{ background: DAY_COLORS[(wp.day - 1) % DAY_COLORS.length] }}
                >
                  {wp.day}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">{wp.name}</span>
              </div>
            ))}
            {waypoints.length > 5 && (
              <p className="text-[10px] text-muted-foreground">+{waypoints.length - 5} more</p>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {waypoints.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-border/50">
            <p className="text-sm font-medium text-foreground">Plan a trip to see waypoints</p>
            <p className="text-xs text-muted-foreground mt-1">AI will pin your itinerary here</p>
          </div>
        </div>
      )}
    </div>
  );
}