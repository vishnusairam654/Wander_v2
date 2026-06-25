import { useState, useEffect, useCallback } from 'react';
import { TripResponse } from '../lib/api';

const STORAGE_KEY = 'wanderway_trips';

export function useSavedTrips() {
  const [savedTrips, setSavedTrips] = useState<TripResponse[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedTrips(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse saved trips from local storage', e);
    }
  }, []);

  const saveTrip = useCallback((trip: TripResponse) => {
    setSavedTrips((prevTrips) => {
      const existingIndex = prevTrips.findIndex((t) => t.id === trip.id);
      let newTrips;
      
      if (existingIndex >= 0) {
        // Deduplicate: replace the existing trip
        newTrips = [...prevTrips];
        newTrips[existingIndex] = trip;
      } else {
        // Append new trip
        newTrips = [...prevTrips, trip];
      }
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTrips));
      } catch (e) {
        console.error('Failed to save trips to local storage', e);
      }
      
      return newTrips;
    });
  }, []);

  const deleteTrip = useCallback((tripId: string) => {
    setSavedTrips((prevTrips) => {
      const newTrips = prevTrips.filter((t) => t.id !== tripId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTrips));
      } catch (e) {
        console.error('Failed to update local storage', e);
      }
      return newTrips;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSavedTrips([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear local storage', e);
    }
  }, []);

  const isSaved = useCallback((tripId: string) => {
    return savedTrips.some((t) => t.id === tripId);
  }, [savedTrips]);

  return {
    savedTrips,
    saveTrip,
    deleteTrip,
    clearAll,
    isSaved
  };
}
