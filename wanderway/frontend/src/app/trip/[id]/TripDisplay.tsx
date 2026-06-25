"use client";

import React from "react";
import { TripResponse } from "../../../lib/api";
import { useSavedTrips } from "../../../hooks/useSavedTrips";
import { useShareTrip } from "../../../hooks/useShareTrip";

interface TripDisplayProps {
  trip: TripResponse;
}

export function TripDisplay({ trip }: TripDisplayProps) {
  const { saveTrip, deleteTrip, isSaved } = useSavedTrips();
  const { shareNative, isCopied } = useShareTrip();

  const saved = isSaved(trip.id);

  const handleSaveToggle = () => {
    if (saved) {
      deleteTrip(trip.id);
    } else {
      saveTrip(trip);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Trip to {trip.destination}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            {trip.start_date} - {trip.end_date}
          </p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={handleSaveToggle}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-medium transition-all ${
              saved
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            }`}
          >
            {saved ? "✓ Saved" : "Save Trip"}
          </button>

          <button
            onClick={() => shareNative(trip)}
            className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
          >
            {isCopied ? "Link Copied!" : "Share Trip"}
          </button>
        </div>
      </header>

      <div className="space-y-8">
        {trip.itinerary.map((day) => (
          <section
            key={day.day_number}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <h2 className="text-2xl font-bold mb-6 text-indigo-950 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md text-lg">
                Day {day.day_number}
              </span>
              {day.date && (
                <span className="text-gray-500 text-lg font-medium">
                  {day.date}
                </span>
              )}
              {day.theme && (
                <span className="text-gray-700 text-lg">- {day.theme}</span>
              )}
            </h2>

            <div className="space-y-6">
              {day.activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-4 border-l-4 border-indigo-300 pl-4 py-2 hover:bg-gray-50 transition rounded-r-lg pr-4"
                >
                  <div className="font-semibold text-indigo-700 min-w-[100px]">
                    {activity.time}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {activity.title}
                    </h3>
                    {activity.location && (
                      <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
                        📍 {activity.location}
                      </p>
                    )}
                    <p className="text-gray-700 leading-relaxed">
                      {activity.description}
                    </p>

                    {activity.estimated_cost !== undefined && (
                      <div className="mt-2 text-sm text-green-700 font-medium">
                        Estimated cost: ${activity.estimated_cost}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
