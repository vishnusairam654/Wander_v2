"use client";
// components/planning/TripForm.tsx
// BUG-10 FIX: getThreadId now imported from lib/utils instead of defined locally.
// BUG-11 FIX: Added validation that returnDate must be after departureDate.
//             Previously a negative duration was silently sent to the AI.

import React, { useState } from "react";
import { ArrowRight, MapPin, Calendar, Users, Wallet, Loader2 } from "lucide-react";
import { budgetTier, planTrip } from "@/lib/backend/trips";
import type { TripData } from "@/types/trip";

interface TripFormProps {
  onTripPlanned?: (data: TripData) => void;
}

const TripForm: React.FC<TripFormProps> = ({ onTripPlanned }) => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [travelers, setTravelers] = useState("2");
  const [budget, setBudget] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const getDuration = (): number | null => {
    if (!departureDate || !returnDate) return null;
    const diff =
      (new Date(returnDate).getTime() - new Date(departureDate).getTime()) / 86400000;
    return diff > 0 ? Math.round(diff) : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!destination.trim()) {
      setError("Please enter a destination.");
      return;
    }

    if (departureDate && returnDate && new Date(returnDate) <= new Date(departureDate)) {
      setError("Return date must be after the departure date.");
      return;
    }

    setIsLoading(true);

    try {
      const start = departureDate ? new Date(`${departureDate}T00:00:00`) : new Date();
      const end = returnDate ? new Date(`${returnDate}T00:00:00`) : new Date(start);
      if (!returnDate) end.setDate(start.getDate() + 3);
      const tripDays = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / 86400000),
      );
      const travelerCount = Number.parseInt(travelers, 10);
      const totalBudget = budget ? Number(budget) : undefined;

      const tripData = await planTrip({
        origin: origin.trim() || undefined,
        destination: destination.trim(),
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        number_of_people: travelerCount,
        total_budget: totalBudget,
        budget: budgetTier(totalBudget, travelerCount, tripDays),
        interests: ["sightseeing", "local food", "culture"],
        special_requirements:
          "Include practical transport guidance and a balanced day-by-day itinerary.",
      });

      onTripPlanned?.(tripData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const duration = getDuration();

  return (
    <div className="w-full flex flex-col h-full px-2 py-4 bg-background">
      <div className="mb-4">
        <h1 className="font-mamenchisa text-3xl md:text-4xl text-foreground leading-tight">
          Craft your <br />
          <span className="text-primary italic">Perfect Journey</span>
        </h1>
        {duration && (
          <p className="mt-2 text-sm text-muted-foreground font-milkywalky">
            {duration} day{duration > 1 ? "s" : ""} · {travelers} traveler
            {parseInt(travelers) > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 font-milkywalky bg-card p-5 rounded-3xl border border-border/60 shadow-lg shadow-primary/5"
      >
        {/* Origin */}
        <div className="relative group">
          <label className="block text-xs font-bold text-foreground mb-1.5 ml-1">From</label>
          <div className="relative">
            <MapPin
              size={16}
              className="absolute inset-y-0 left-3 my-auto text-muted-foreground group-focus-within:text-primary transition-colors"
            />
            <input
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-background border-2 border-border/80 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="e.g., Bengaluru"
            />
          </div>
        </div>

        {/* Destination */}
        <div className="relative group">
          <label className="block text-xs font-bold text-foreground mb-1.5 ml-1">
            To <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <MapPin
              size={16}
              className="absolute inset-y-0 left-3 my-auto text-muted-foreground group-focus-within:text-secondary transition-colors"
            />
            <input
              suppressHydrationWarning
              value={destination}
              onChange={e => setDestination(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-3 bg-background border-2 border-border/80 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/20 transition-all"
              placeholder="Where do you want to go?"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative group">
            <label className="block text-xs font-bold text-foreground mb-1.5 ml-1">
              Departure
            </label>
            <div className="relative">
              <Calendar
                size={14}
                className="absolute inset-y-0 left-3 my-auto text-muted-foreground"
              />
              <input
                suppressHydrationWarning
                type="date"
                value={departureDate}
                onChange={e => setDepartureDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full pl-8 pr-2 py-3 text-xs bg-background border-2 border-border/80 rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>
          <div className="relative group">
            <label className="block text-xs font-bold text-foreground mb-1.5 ml-1">
              Return
            </label>
            <div className="relative">
              <Calendar
                size={14}
                className="absolute inset-y-0 left-3 my-auto text-muted-foreground"
              />
              <input
                suppressHydrationWarning
                type="date"
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                min={departureDate || new Date().toISOString().split("T")[0]}
                className="w-full pl-8 pr-2 py-3 text-xs bg-background border-2 border-border/80 rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Travelers + Budget */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative group">
            <label className="block text-xs font-bold text-foreground mb-1.5 ml-1">
              Travelers
            </label>
            <div className="relative">
              <Users
                size={14}
                className="absolute inset-y-0 left-3 my-auto text-muted-foreground"
              />
              <select
                suppressHydrationWarning
                value={travelers}
                onChange={e => setTravelers(e.target.value)}
                className="w-full pl-8 pr-2 py-3 text-xs bg-background border-2 border-border/80 rounded-2xl text-foreground appearance-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "Person" : "People"}
                  </option>
                ))}
                <option value="10">Group (9+)</option>
              </select>
            </div>
          </div>
          <div className="relative group">
            <label className="block text-xs font-bold text-foreground mb-1.5 ml-1">
              Budget (₹)
            </label>
            <div className="relative">
              <Wallet
                size={14}
                className="absolute inset-y-0 left-3 my-auto text-muted-foreground"
              />
              <input
                suppressHydrationWarning
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                min={0}
                className="w-full pl-8 pr-2 py-3 text-xs bg-background border-2 border-border/80 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Total budget"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}

        <button
          suppressHydrationWarning
          type="submit"
          disabled={isLoading || !destination.trim()}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-primary text-primary-foreground font-bold text-sm rounded-2xl hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Planning your trip...
            </>
          ) : (
            <>
              Start Planning <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TripForm;
