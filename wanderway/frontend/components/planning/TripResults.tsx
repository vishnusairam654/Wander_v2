"use client";

import React, { useState } from "react";
import {
  MapPin, Utensils, Car, Wallet, Clock, Star, ChevronRight,
  Cloud, Sun, CloudRain, Hotel, Train, Bus, Plane, Bike,
  Thermometer, Droplets, Wind, RefreshCw, Plus, X, Check,
  Share2, Download, RotateCcw, Sparkles, Map, Info,
  ChevronDown, ChevronUp, Users, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripData, Attraction, HotelOption, TravelOption, ItineraryDay } from "@/types/trip";

// ── Category config ────────────────────────────────────────────────────────────
const CAT_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  nature: { color: "text-green-700", bg: "bg-green-50 border-green-200", icon: <span>🌿</span>, label: "Nature" },
  adventure: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: <span>🧗</span>, label: "Adventure" },
  culture: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: <span>🏛</span>, label: "Culture" },
  food: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: <span>🍽</span>, label: "Food" },
  shopping: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: <span>🛍</span>, label: "Shopping" },
  nightlife: { color: "text-pink-700", bg: "bg-pink-50 border-pink-200", icon: <span>✨</span>, label: "Nightlife" },
  tourist_attractions: { color: "text-primary", bg: "bg-accent border-border", icon: <span>📍</span>, label: "Attraction" },
  restaurants: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: <span>🍴</span>, label: "Restaurant" },
};

const DAY_PALETTE = [
  "bg-primary text-primary-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-blue-500 text-white",
  "bg-purple-500 text-white",
  "bg-rose-500 text-white",
  "bg-teal-500 text-white",
  "bg-orange-500 text-white",
];

// ── Weather icon helper ───────────────────────────────────────────────────────
function WeatherIcon({ condition, size = 16 }: { condition: string; size?: number }) {
  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower"))
    return <CloudRain size={size} className="text-blue-400" />;
  if (c.includes("cloud") || c.includes("overcast") || c.includes("fog"))
    return <Cloud size={size} className="text-muted-foreground" />;
  return <Sun size={size} className="text-secondary" />;
}

// ── Star rating display ───────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={10}
            className={cn(i <= Math.round(rating) ? "text-secondary fill-secondary" : "text-muted-foreground")}
          />
        ))}
      </div>
      <span className="text-[10px] font-bold">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── Image URL helper (picsum with category seed) ──────────────────────────────
function getAttractionImage(attraction: Attraction): string {
  if (attraction.photos && attraction.photos.startsWith("http")) return attraction.photos;
  // Deterministic seed from name
  const seed = encodeURIComponent(attraction.name.toLowerCase().replace(/\s+/g, "-"));
  return `https://picsum.photos/seed/${seed}/400/260`;
}

// ── Travel mode icon ──────────────────────────────────────────────────────────
function TravelModeIcon({ mode }: { mode: string }) {
  const m = mode.toLowerCase();
  if (m.includes("flight") || m.includes("✈")) return <Plane size={18} className="text-blue-500" />;
  if (m.includes("train") || m.includes("🚂")) return <Train size={18} className="text-green-600" />;
  if (m.includes("bus") || m.includes("🚌")) return <Bus size={18} className="text-orange-500" />;
  if (m.includes("bike") || m.includes("🏍")) return <Bike size={18} className="text-purple-500" />;
  return <Car size={18} className="text-muted-foreground" />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATTRACTION CARD
// ═══════════════════════════════════════════════════════════════════════════════
function AttractionCard({
  attraction,
  day,
  timeSlot,
  onReplace,
  onRemove,
}: {
  attraction: Attraction;
  day: number;
  timeSlot?: string;
  onReplace?: (name: string, day: number) => void;
  onRemove?: (name: string) => void;
}) {
  const cat = CAT_CONFIG[attraction.category] || CAT_CONFIG["tourist_attractions"];
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group relative bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-0.5 transition-all duration-300">
      {/* Day + time badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm", DAY_PALETTE[(day - 1) % DAY_PALETTE.length])}>
          Day {day}
        </span>
        {timeSlot && (
          <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
            {timeSlot}
          </span>
        )}
      </div>

      {/* Edit buttons */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onReplace && (
          <button
            onClick={() => onReplace(attraction.name, day)}
            className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shadow-sm"
            title="Replace with alternative"
          >
            <RefreshCw size={11} />
          </button>
        )}
        {onRemove && (
          <button
            onClick={() => onRemove(attraction.name)}
            className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shadow-sm"
            title="Remove from itinerary"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Image */}
      <div className="relative h-44 bg-accent overflow-hidden">
        {!imgError ? (
          <img
            src={getAttractionImage(attraction)}
            alt={attraction.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={cn("w-full h-full flex flex-col items-center justify-center gap-2", cat.bg)}>
            <span className="text-4xl">{cat.icon}</span>
            <span className={cn("text-xs font-bold", cat.color)}>{cat.label}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-sm text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {attraction.name}
          </h3>
          <span className={cn("shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border", cat.bg, cat.color)}>
            {cat.label}
          </span>
        </div>

        <StarRating rating={attraction.rating || 4.2} />

        <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
          {attraction.description}
        </p>

        {attraction.address && (
          <p className="text-[10px] text-muted-foreground mt-2 flex items-start gap-1">
            <MapPin size={9} className="mt-0.5 shrink-0" />
            <span className="line-clamp-1">{attraction.address}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOTEL CARD
// ═══════════════════════════════════════════════════════════════════════════════
function HotelCard({ hotel, nights }: { hotel: HotelOption; nights: number }) {
  return (
    <div className={cn(
      "p-5 rounded-2xl border transition-all",
      hotel.recommended ? "bg-primary/5 border-primary/20 ring-1 ring-primary/20" : "bg-card border-border/50"
    )}>
      {hotel.recommended && (
        <div className="flex items-center gap-1.5 mb-3">
          <Check size={12} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Recommended</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-foreground">{hotel.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            {hotel.stars > 0 && Array.from({ length: hotel.stars }).map((_, i) => (
              <Star key={i} size={10} className="text-secondary fill-secondary" />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">{hotel.style}</span>
          </div>
          {hotel.address && (
            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1">
              <MapPin size={8} className="mt-0.5 shrink-0" />
              <span className="line-clamp-2">{hotel.address}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {hotel.amenities.slice(0, 4).map((a, i) => (
              <span key={i} className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{a}</span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-black text-lg text-primary">₹{hotel.pricePerNight.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-muted-foreground">/night</p>
          {nights > 0 && (
            <p className="text-[10px] font-bold text-foreground mt-1">
              ₹{hotel.totalPrice.toLocaleString("en-IN")} total
            </p>
          )}
          <a
            href={hotel.bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-[10px] font-bold text-primary hover:underline"
          >
            Book now →
          </a>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRAVEL OPTION CARD
// ═══════════════════════════════════════════════════════════════════════════════
function TravelCard({ option, travelers }: { option: TravelOption; travelers: number }) {
  return (
    <div className={cn(
      "shrink-0 w-52 p-4 rounded-2xl border transition-all relative overflow-hidden",
      option.recommended
        ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
        : "bg-card border-border/50 hover:border-primary/20"
    )}>
      {option.recommended && (
        <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-lg tracking-widest">
          Best
        </span>
      )}
      <div className="flex items-center gap-2 mb-3">
        <TravelModeIcon mode={option.mode} />
        <div>
          <p className="font-bold text-xs">{option.mode.replace(/[✈🚂🚌🚗🚕🏍]/gu, "").trim()}</p>
          <p className="text-[10px] text-muted-foreground">{option.carrier}</p>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={10} /> {option.duration}
          </p>
          {travelers > 1 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              ₹{option.pricePerPerson.toLocaleString("en-IN")}/person
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-black text-base text-primary">₹{option.totalPrice.toLocaleString("en-IN")}</p>
          {travelers > 1 && <p className="text-[10px] text-muted-foreground">total</p>}
        </div>
      </div>
      <div className="mt-3 space-y-1">
        {option.pros.slice(0, 2).map((p, i) => (
          <p key={i} className="text-[10px] text-green-700 flex items-start gap-1">
            <Check size={8} className="mt-0.5 shrink-0" /> {p}
          </p>
        ))}
      </div>
      <a
        href={option.bookingLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block w-full text-center text-[10px] font-bold text-primary border border-primary/30 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
      >
        Book
      </a>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════════
function EmptyState() {
  return (
    <div className="w-full py-20 flex flex-col items-center gap-4 text-center">
      <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-4xl">🗺</div>
      <div>
        <h3 className="font-eagle text-2xl font-bold text-foreground">Your trip plan will appear here</h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm leading-relaxed">
          Fill in the form above or chat with WanderWay AI to generate a personalized travel plan with hotels, restaurants, attractions, weather, budget, and a full itinerary.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {["✈️ All travel modes", "🏨 Hotel picks", "🍽 Restaurant guide", "📅 Day-by-day plan", "💰 Budget forecast", "🌤 Live weather"].map(f => (
          <span key={f} className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full border border-border/50">{f}</span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TRIP RESULTS
// ═══════════════════════════════════════════════════════════════════════════════
interface TripResultsProps {
  tripData: TripData | null;
  onEditRequest?: (message: string) => void;
}

export default function TripResults({ tripData, onEditRequest }: TripResultsProps) {
  const [activeDay, setActiveDay] = useState(0); // 0 = overview
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [showAllHotels, setShowAllHotels] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!tripData || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripData }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Error saving trip:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!tripData) return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="h-8 w-1.5 bg-accent-foreground/20 rounded-full" />
        <h2 className="text-3xl font-eagle font-bold text-foreground">Trip Results</h2>
      </div>
      <EmptyState />
    </div>
  );

  const {
    destination, duration, travelers, plan,
    budgetBreakdown, totalBudget, perPersonBudget,
    weatherData, hotels, travelOptions, attractions,
    itinerary, localTransport, toolsUsed, generatedAt,
  } = tripData;

  // Separate tourist attractions from restaurants
  const tourAttractions = (attractions || []).filter(a => a.category !== "restaurants");
  const restaurants = (attractions || []).filter(a => a.category === "restaurants");
  const recommendedHotel = hotels?.find(h => h.recommended) || hotels?.[0];
  const nights = Math.max(1, duration - 1);

  // Group attractions by day using waypoints or sequential assignment
  const attractionsByDay: Record<number, Attraction[]> = {};
  if (duration > 0) {
    const perDay = Math.ceil(tourAttractions.length / duration);
    tourAttractions.forEach((att, i) => {
      const day = Math.min(Math.floor(i / Math.max(1, perDay)) + 1, duration);
      if (!attractionsByDay[day]) attractionsByDay[day] = [];
      attractionsByDay[day].push(att);
    });
  }

  // Group restaurants by day
  const restaurantsByDay: Record<number, Attraction[]> = {};
  if (duration > 0) {
    const perDay = 3; // breakfast, lunch, dinner
    restaurants.forEach((r, i) => {
      const day = Math.min(Math.floor(i / perDay) + 1, duration);
      if (!restaurantsByDay[day]) restaurantsByDay[day] = [];
      restaurantsByDay[day].push(r);
    });
  }

  const mealLabels = ["🌅 Breakfast", "☀️ Lunch", "🌙 Dinner"];
  const timeSlots = ["9:30 AM", "1:00 PM", "3:30 PM", "5:00 PM"];

  const handleReplace = (attractionName: string, day: number) => {
    onEditRequest?.(`Replace "${attractionName}" on Day ${day} with a different place in ${destination}`);
  };

  const handleRemove = (attractionName: string) => {
    onEditRequest?.(`Remove "${attractionName}" from my trip itinerary in ${destination}`);
  };

  const handleAddPlace = (day: number) => {
    onEditRequest?.(`Add another interesting place to visit on Day ${day} in ${destination}`);
  };

  const toggleDay = (day: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  };

  // Budget bars
  const budgetItems = budgetBreakdown
    ? [
      { label: "Transport", amount: budgetBreakdown.transport, color: "bg-blue-500" },
      { label: "Accommodation", amount: budgetBreakdown.accommodation, color: "bg-primary" },
      { label: "Food", amount: budgetBreakdown.food, color: "bg-secondary" },
      { label: "Sightseeing", amount: budgetBreakdown.sightseeing, color: "bg-purple-500" },
      { label: "Local Travel", amount: budgetBreakdown.localTransport, color: "bg-teal-500" },
      { label: "Misc", amount: budgetBreakdown.miscellaneous, color: "bg-muted-foreground" },
    ].filter(i => i.amount > 0)
    : [];
  const maxBudget = budgetItems.length > 0 ? Math.max(...budgetItems.map(i => i.amount)) : 1;

  const days = Array.from({ length: duration }, (_, i) => i + 1);

  return (
    <div className="w-full space-y-10">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-1.5 bg-secondary rounded-full" />
        <h2 className="text-3xl font-eagle font-bold text-foreground">Your Trip Plan</h2>
        <span className="ml-auto text-xs text-muted-foreground font-milkywalky">
          Generated • {new Date(generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </span>
      </div>

      {/* ── HERO CARD ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-8 md:p-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary rounded-full blur-3xl translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary rounded-full blur-2xl -translate-x-10 translate-y-10" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Sparkles size={14} />
                <span className="text-xs uppercase tracking-widest font-bold">AI Generated</span>
              </div>
              <h1 className="font-eagle text-4xl md:text-5xl font-bold mb-2">
                {destination}
              </h1>
              <p className="opacity-80 max-w-lg leading-relaxed text-sm">
                {weatherData?.summary || `Your personalized ${duration}-day adventure awaits.`}
              </p>
            </div>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-primary-foreground/10">
                <Calendar size={16} className="mx-auto mb-1 opacity-70" />
                <p className="font-black text-xl">{duration}</p>
                <p className="text-[10px] opacity-70 uppercase tracking-wide">Days</p>
              </div>
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-primary-foreground/10">
                <Users size={16} className="mx-auto mb-1 opacity-70" />
                <p className="font-black text-xl">{travelers}</p>
                <p className="text-[10px] opacity-70 uppercase tracking-wide">People</p>
              </div>
              {totalBudget && (
                <div className="bg-secondary/20 backdrop-blur-sm rounded-2xl p-3 text-center border border-secondary/30">
                  <Wallet size={16} className="mx-auto mb-1 text-secondary" />
                  <p className="font-black text-xl text-secondary">
                    ₹{Math.round(totalBudget / 1000)}k
                  </p>
                  <p className="text-[10px] opacity-70 uppercase tracking-wide">Total</p>
                </div>
              )}
            </div>
          </div>

          {/* Tools used chips */}
          {toolsUsed.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-primary-foreground/10">
              <span className="text-[10px] opacity-60 mr-1 self-center">Powered by:</span>
              {[...new Set(toolsUsed)].map((t, i) => (
                <span key={i} className="text-[10px] bg-primary-foreground/10 px-2.5 py-1 rounded-full border border-primary-foreground/10 font-medium">
                  {t.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Left column: Hotel + Budget + Weather + Transport */}
        <div className="xl:col-span-1 space-y-6">

          {/* HOTEL */}
          {hotels && hotels.length > 0 && (
            <div className="bg-card rounded-3xl border border-border/50 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-2 bg-amber-50 rounded-xl"><Hotel size={18} className="text-amber-600" /></div>
                <h3 className="font-eagle font-bold text-lg">Where to Stay</h3>
              </div>
              {recommendedHotel && <HotelCard hotel={recommendedHotel} nights={nights} />}
              {hotels.length > 1 && (
                <>
                  {showAllHotels && hotels.filter(h => !h.recommended).map((h, i) => (
                    <HotelCard key={i} hotel={h} nights={nights} />
                  ))}
                  <button
                    onClick={() => setShowAllHotels(!showAllHotels)}
                    className="w-full text-xs text-primary font-bold flex items-center justify-center gap-1 py-2 hover:bg-accent rounded-xl transition-colors"
                  >
                    {showAllHotels ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showAllHotels ? "Show less" : `${hotels.length - 1} more option${hotels.length > 2 ? "s" : ""}`}
                  </button>
                </>
              )}
            </div>
          )}

          {/* BUDGET */}
          {budgetBreakdown && totalBudget && (
            <div className="bg-primary rounded-3xl p-5 shadow-xl shadow-primary/10 text-primary-foreground space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary-foreground/10 rounded-xl"><Wallet size={18} /></div>
                <h3 className="font-eagle font-bold text-lg">Budget Forecast</h3>
              </div>

              <div className="flex gap-4">
                <div>
                  <p className="text-2xl font-black">₹{totalBudget.toLocaleString("en-IN")}</p>
                  <p className="text-[11px] opacity-70">Total ({duration} days)</p>
                </div>
                {perPersonBudget && travelers > 1 && (
                  <div className="border-l border-primary-foreground/20 pl-4">
                    <p className="text-lg font-black text-secondary">₹{perPersonBudget.toLocaleString("en-IN")}</p>
                    <p className="text-[11px] opacity-70">Per person</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {budgetItems.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-medium mb-1 opacity-90">
                      <span>{item.label}</span>
                      <span>₹{item.amount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="h-1.5 bg-primary-foreground/10 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000", item.color)}
                        style={{ width: `${(item.amount / maxBudget) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WEATHER */}
          {weatherData && weatherData.forecast.length > 0 && (
            <div className="bg-card rounded-3xl border border-border/50 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-xl"><Cloud size={18} className="text-blue-500" /></div>
                <h3 className="font-eagle font-bold text-lg">Weather</h3>
                <span className="text-xs text-muted-foreground ml-auto">{destination}</span>
              </div>

              {/* Today featured */}
              {weatherData.forecast[0] && (
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-2xl text-foreground">
                        {weatherData.forecast[0].maxTemp}°
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          / {weatherData.forecast[0].minTemp}°
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{weatherData.forecast[0].condition}</p>
                    </div>
                    <WeatherIcon condition={weatherData.forecast[0].condition} size={36} />
                  </div>
                  <div className="flex gap-3 mt-3 pt-3 border-t border-blue-100">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Droplets size={9} /> {weatherData.forecast[0].precipitation}mm
                    </span>
                    {weatherData.forecast[0].windSpeed && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Wind size={9} /> {weatherData.forecast[0].windSpeed} km/h
                      </span>
                    )}
                    {weatherData.rainyDays > 0 && (
                      <span className="text-[10px] text-blue-600 font-medium">
                        🌂 {weatherData.rainyDays} rainy day{weatherData.rainyDays > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Forecast strip */}
              <div className="space-y-1.5">
                {weatherData.forecast.slice(1, Math.min(duration + 1, 6)).map((day, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-xs font-medium w-20 text-foreground">
                      {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <WeatherIcon condition={day.condition} size={13} />
                      <span className="text-[10px] text-muted-foreground hidden sm:block">{day.condition}</span>
                    </div>
                    <span className="text-xs font-bold">
                      {day.maxTemp}° <span className="text-muted-foreground font-normal">{day.minTemp}°</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOCAL TRANSPORT */}
          {localTransport && (
            <div className="bg-card rounded-3xl border border-border/50 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-accent rounded-xl"><Car size={18} className="text-accent-foreground" /></div>
                <h3 className="font-eagle font-bold text-lg">Getting Around</h3>
              </div>
              <div className="space-y-2">
                {localTransport.options.map((opt, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-2xl border text-xs",
                      opt.recommended
                        ? "bg-primary/5 border-primary/20"
                        : "bg-background border-border/50"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-foreground">{opt.type}</p>
                      {opt.recommended && (
                        <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">Best</span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5">
                      {opt.costPerTrip || opt.costPerDay || opt.dailyEst}
                    </p>
                    <p className="text-green-700 mt-1">{opt.pros}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Travel options + Day-by-day plan */}
        <div className="xl:col-span-2 space-y-8">

          {/* TRAVEL OPTIONS */}
          {travelOptions && travelOptions.length > 0 && (
            <div className="bg-card rounded-3xl border border-border/50 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-xl"><Train size={18} className="text-blue-600" /></div>
                <h3 className="font-eagle font-bold text-lg">How to Get There</h3>
                <span className="text-xs text-muted-foreground ml-auto">{travelOptions.length} options</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {travelOptions.map((opt, i) => (
                  <TravelCard key={i} option={opt} travelers={travelers} />
                ))}
              </div>
            </div>
          )}

          {/* DAY NAVIGATION (tabs for multi-day) */}
          {duration > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveDay(0)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all",
                  activeDay === 0
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                All Days
              </button>
              {days.map(day => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={cn(
                    "shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all",
                    activeDay === day
                      ? cn("shadow-sm text-white", DAY_PALETTE[(day - 1) % DAY_PALETTE.length])
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  Day {day}
                </button>
              ))}
            </div>
          )}

          {/* DAY CONTENT */}
          {days
            .filter(day => activeDay === 0 || activeDay === day)
            .map(day => {
              const dayAtts = attractionsByDay[day] || [];
              const dayRests = restaurantsByDay[day] || [];
              const dayItinerary = itinerary?.find(it => it.day === day);
              const isExpanded = duration <= 3 || expandedDays.has(day);

              return (
                <div key={day} className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
                  {/* Day header */}
                  <button
                    onClick={() => toggleDay(day)}
                    className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-sm", DAY_PALETTE[(day - 1) % DAY_PALETTE.length])}>
                        {day}
                      </span>
                      <div className="text-left">
                        <h3 className="font-eagle font-bold text-base">
                          {dayItinerary?.title || `Day ${day}`}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {dayAtts.length} attraction{dayAtts.length !== 1 ? "s" : ""}
                          {dayRests.length > 0 && ` · ${dayRests.length} restaurant${dayRests.length !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>
                    {duration > 3 && (
                      isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />
                    )}
                  </button>

                  {/* Day content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-6">
                      {/* Itinerary schedule */}
                      {dayItinerary && (
                        <div className="bg-muted/30 rounded-2xl p-4 text-xs space-y-2.5 border border-border/30">
                          <p className="font-bold text-foreground flex items-center gap-1.5"><Clock size={11} /> Schedule</p>
                          <div className="space-y-2">
                            <div className="flex gap-3">
                              <span className="text-muted-foreground shrink-0 w-16">Morning</span>
                              <span className="text-foreground">{dayItinerary.morning}</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-muted-foreground shrink-0 w-16">Afternoon</span>
                              <span className="text-foreground">{dayItinerary.afternoon}</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-muted-foreground shrink-0 w-16">Evening</span>
                              <span className="text-foreground">{dayItinerary.evening}</span>
                            </div>
                          </div>
                          {dayItinerary.tips && (
                            <div className="flex gap-2 pt-2 border-t border-border/30">
                              <Info size={10} className="text-primary shrink-0 mt-0.5" />
                              <p className="text-muted-foreground italic">{dayItinerary.tips}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Attractions grid */}
                      {dayAtts.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-bold text-sm flex items-center gap-1.5">
                              <MapPin size={14} className="text-primary" /> Things To Do
                            </p>
                            <button
                              onClick={() => handleAddPlace(day)}
                              className="text-[10px] text-primary font-bold flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded-full transition-colors"
                            >
                              <Plus size={10} /> Add place
                            </button>
                          </div>
                          <div className={cn(
                            "grid gap-4",
                            dayAtts.length === 1 ? "grid-cols-1 max-w-xs" :
                              dayAtts.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
                                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                          )}>
                            {dayAtts.map((att, i) => (
                              <AttractionCard
                                key={i}
                                attraction={att}
                                day={day}
                                timeSlot={timeSlots[i % timeSlots.length]}
                                onReplace={handleReplace}
                                onRemove={handleRemove}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Restaurants */}
                      {dayRests.length > 0 && (
                        <div>
                          <p className="font-bold text-sm flex items-center gap-1.5 mb-3">
                            <Utensils size={14} className="text-orange-500" /> Where to Eat
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {dayRests.slice(0, 3).map((rest, i) => (
                              <div
                                key={i}
                                className="bg-background rounded-2xl border border-border/50 p-3 hover:border-orange-200 transition-colors group"
                              >
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="text-sm">{["🌅", "☀️", "🌙"][i]}</span>
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase">{mealLabels[i]?.split(" ")[1]}</span>
                                </div>
                                <h4 className="font-bold text-xs text-foreground group-hover:text-orange-600 transition-colors line-clamp-2">
                                  {rest.name}
                                </h4>
                                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{rest.description}</p>
                                <StarRating rating={rest.rating || 4.1} />
                                {rest.address && (
                                  <p className="text-[9px] text-muted-foreground mt-1 flex items-start gap-1">
                                    <MapPin size={7} className="mt-0.5 shrink-0" />
                                    <span className="line-clamp-1">{rest.address}</span>
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empty day prompt */}
                      {dayAtts.length === 0 && dayRests.length === 0 && (
                        <div className="text-center py-6">
                          <p className="text-sm text-muted-foreground">No activities planned for this day yet.</p>
                          <button
                            onClick={() => handleAddPlace(day)}
                            className="mt-2 text-xs text-primary font-bold hover:underline flex items-center gap-1 mx-auto"
                          >
                            <Plus size={12} /> Ask AI to suggest places
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {/* ── ACTION BAR ──────────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 items-center pt-2">
            <button
              onClick={() => onEditRequest?.(`Suggest more hidden gems and local secrets in ${destination} that tourists usually miss`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-full text-sm font-bold hover:scale-105 hover:shadow-lg hover:shadow-secondary/20 transition-all"
            >
              <Sparkles size={14} /> Local Secrets
            </button>
            <button
              onClick={() => onEditRequest?.(`Give me restaurant recommendations for every day of my ${duration}-day trip in ${destination}`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-full text-sm font-bold hover:bg-accent transition-all border border-border/50"
            >
              <Utensils size={14} /> More Food Options
            </button>
            <button
              onClick={() => onEditRequest?.(`Suggest budget-friendly alternatives for my ${duration}-day trip in ${destination} for ${travelers} people`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-full text-sm font-bold hover:bg-accent transition-all border border-border/50"
            >
              <Wallet size={14} /> Budget Options
            </button>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => {
                  try {
                    navigator.share?.({ title: `${destination} Trip Plan`, text: plan });
                  } catch { /* ignore */ }
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-full text-xs font-bold hover:bg-accent transition-all border border-border/50"
              >
                <Share2 size={12} /> Share
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || saved}
                className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-full text-xs font-bold hover:bg-accent transition-all border border-border/50 disabled:opacity-50"
              >
                {saved ? <Check size={12} className="text-green-500" /> : <Download size={12} />}
                {saved ? "Saved!" : isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}