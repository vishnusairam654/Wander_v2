"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Wallet,
  ArrowRight,
  Globe2,
  Map,
  Clock,
  Coffee,
  Camera,
  Navigation,
  Loader2,
} from "lucide-react";
import TripMap from "./TripMap";
import ChatBot from "./ChatBot";
import { budgetTier, planTrip, requestFromPlanningMessage } from "@/lib/backend/trips";
import type { TripData, Waypoint } from "@/types/trip";

interface ModernTripPlannerProps {
  onTripPlanned?: (data: TripData) => void;
  waypoints: Waypoint[];
  tripData: TripData | null;
  pendingMessage?: string;
  onPendingMessageConsumed?: () => void;
}

export default function ModernTripPlanner({
  onTripPlanned,
  waypoints,
  tripData,
  pendingMessage,
  onPendingMessageConsumed,
}: ModernTripPlannerProps) {
  const [prompt, setPrompt] = useState("");
  const [activeBudget, setActiveBudget] = useState("Moderate");
  const [activeStyle, setActiveStyle] = useState("Couple");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [destinationInput, setDestinationInput] = useState("");
  const [travelers, setTravelers] = useState("2");
  const [budgetInput, setBudgetInput] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if ((!prompt || !prompt.trim()) && !showItinerary) return;
    setIsGenerating(true);

    try {
      const tripData = await planTrip(requestFromPlanningMessage(prompt || `Plan a trip to ${destinationInput || "Goa"} for ${travelers} people with ${activeBudget.toLowerCase()} budget`));
      onTripPlanned?.(tripData);
      setShowItinerary(true);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error) {
      console.error("Trip planning failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickStyleSubmit = async () => {
    const promptText = `Plan a ${activeStyle.toLowerCase()} trip to ${destinationInput || "Goa"} with ${activeBudget.toLowerCase()} budget for ${travelers} people`;
    setPrompt(promptText);
    setIsGenerating(true);
    try {
      const tripData = await planTrip(requestFromPlanningMessage(promptText));
      onTripPlanned?.(tripData);
      setShowItinerary(true);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error) {
      console.error("Trip planning failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Main Content */}
      <main className="pt-20 pb-20 px-4 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-8 animate-fade-in-up">
          <Sparkles size={14} />
          <span>WanderWay AI 2.0 is now live</span>
        </div>

        {/* Hero */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
          Dream it. <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">
            Wander it.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mb-12">
          Tell our AI where you want to go, what you love, and who you're taking. We'll craft the perfect, personalized itinerary in seconds.
        </p>

        {/* AI Prompt Input */}
        <div className="w-full max-w-3xl relative group z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
          <div className="relative bg-white border border-gray-200 rounded-full shadow-xl flex items-center p-2 pl-6 transition-transform group-hover:scale-[1.01] duration-300">
            <Sparkles className="text-indigo-500 mr-3" size={24} />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="e.g. A 5-day romantic getaway to Kyoto with a moderate budget..."
              className="flex-grow bg-transparent outline-none text-lg text-gray-800 placeholder:text-gray-400 py-4"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="bg-indigo-600 text-white p-4 rounded-full hover:bg-indigo-700 transition-colors shadow-md ml-2 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <ArrowRight size={24} />}
            </button>
          </div>
        </div>

        {/* Step-by-Step Configuration */}
        <div className="mt-24 w-full max-w-5xl text-left">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            Or build it step-by-step
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Style Selection */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4 text-gray-800 font-semibold">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></div>
                Travel Style
              </div>
              <div className="flex flex-wrap gap-2">
                {["Solo", "Couple", "Family", "Friends"].map((style) => (
                  <button
                    key={style}
                    onClick={() => setActiveStyle(style)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeStyle === style
                        ? "bg-gray-900 text-white shadow-md scale-105"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Selection */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4 text-gray-800 font-semibold">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet size={20} /></div>
                Budget Tier
              </div>
              <div className="flex flex-wrap gap-2">
                {["Backpacker", "Moderate", "Luxury"].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setActiveBudget(tier)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeBudget === tier
                        ? "bg-emerald-600 text-white shadow-md scale-105"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination Input */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2 text-gray-800 font-semibold">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><MapPin size={20} /></div>
                Destination
              </div>
              <div className="relative mt-2">
                <input
                  type="text"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  placeholder="Where to?"
                  className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-shadow"
                />
              </div>
              <button
                onClick={handleQuickStyleSubmit}
                className="mt-3 w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-md"
              >
                Generate Trip
              </button>
            </div>
          </div>
        </div>

        {/* Generated Itinerary Section */}
        {showItinerary && tripData && (
          <div ref={resultsRef} className="mt-20 w-full max-w-6xl animate-fade-in-up text-left border-t border-gray-200 pt-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                  {tripData.destination} Itinerary
                </h2>
                <p className="text-gray-500 mt-2 flex items-center gap-2 font-medium">
                  <Calendar size={16} className="text-indigo-500" /> {tripData.duration} Days •
                  <Wallet size={16} className="text-emerald-500" /> {activeBudget} •
                  <Users size={16} className="text-blue-500" /> {tripData.travelers} {tripData.travelers === 1 ? "Traveler" : "Travelers"}
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm">
                  Share
                </button>
                <button className="flex-1 md:flex-none px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 hover:-translate-y-0.5 transition shadow-md">
                  Save to Profile
                </button>
              </div>
            </div>

            {/* Plan + Map Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative">
              {/* Left Side - ChatBot for itinerary editing */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <span className="bg-indigo-50 text-indigo-600 w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-inner">AI</span>
                    Refine Your Trip
                  </h3>
                  <div className="h-[500px]">
                    <ChatBot
                      onTripDataUpdate={onTripPlanned}
                      pendingMessage={pendingMessage}
                      onPendingMessageConsumed={onPendingMessageConsumed}
                    />
                  </div>
                </div>
              </div>

              {/* Right Side - Map */}
              <div className="lg:col-span-5 relative">
                <div className="sticky top-28 w-full h-[600px] bg-gray-50 rounded-[2rem] border border-gray-200 overflow-hidden shadow-inner">
                  <TripMap waypoints={waypoints} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}