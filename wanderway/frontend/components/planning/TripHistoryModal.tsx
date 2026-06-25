"use client";

import React, { useEffect, useState } from "react";
import { X, MapPin, Calendar, Users, Wallet, Clock, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import type { TripData } from "@/types/trip";

interface SavedTrip {
    id: string;
    userId: string;
    destination: string;
    duration: number;
    travelers: number;
    totalBudget?: number;
    generatedAt: string;
    tripData: TripData;
}

interface TripHistoryModalProps {
    onClose: () => void;
    onLoadTrip?: (trip: TripData) => void;
}

export default function TripHistoryModal({ onClose, onLoadTrip }: TripHistoryModalProps) {
    const { user } = useUser();
    const [trips, setTrips] = useState<SavedTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetchTrips();
    }, []);

    async function fetchTrips() {
        try {
            const res = await fetch("/api/trips");
            if (res.ok) {
                const data = await res.json();
                setTrips(data.trips || []);
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }

    async function deleteTrip(id: string) {
        setDeleting(id);
        try {
            const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            setTrips(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error("Failed to delete trip:", err);
            alert("Failed to delete trip. Please try again.");
        }
        setDeleting(null);
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-background rounded-3xl border border-border/60 shadow-2xl shadow-primary/10 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
                    <div>
                        <h2 className="font-eagle text-2xl font-bold text-foreground">My Trips</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {user?.firstName ? `${user.firstName}'s saved adventures` : "Your saved trip plans"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={32} className="animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Loading your trips...</p>
                            </div>
                        </div>
                    ) : trips.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center text-4xl mb-4">🗺️</div>
                            <h3 className="font-eagle text-xl font-bold text-foreground">No trips saved yet</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Plan your first trip and click "Save" to keep it here for future reference.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {trips.map((trip) => (
                                <div
                                    key={trip.id}
                                    className="group bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MapPin size={15} className="text-primary shrink-0" />
                                                <h3 className="font-eagle font-bold text-lg text-foreground truncate">
                                                    {trip.destination}
                                                </h3>
                                            </div>

                                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={11} />
                                                    {trip.duration} day{trip.duration !== 1 ? "s" : ""}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users size={11} />
                                                    {trip.travelers} traveler{trip.travelers !== 1 ? "s" : ""}
                                                </span>
                                                {trip.totalBudget && (
                                                    <span className="flex items-center gap-1">
                                                        <Wallet size={11} />
                                                        ₹{trip.totalBudget.toLocaleString("en-IN")}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1 ml-auto">
                                                    <Clock size={11} />
                                                    {new Date(trip.generatedAt).toLocaleDateString("en-IN", {
                                                        day: "numeric", month: "short", year: "numeric"
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {onLoadTrip && (
                                                <button
                                                    onClick={() => {
                                                        onLoadTrip(trip.tripData);
                                                        onClose();
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                                                >
                                                    <ExternalLink size={11} />
                                                    Load
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteTrip(trip.id)}
                                                disabled={deleting === trip.id}
                                                className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            >
                                                {deleting === trip.id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Waypoints preview */}
                                    {trip.tripData.waypoints && trip.tripData.waypoints.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-1.5">
                                            {trip.tripData.waypoints.slice(0, 4).map((wp, i) => (
                                                <span
                                                    key={i}
                                                    className="text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full border border-border/30"
                                                >
                                                    📍 {wp.name}
                                                </span>
                                            ))}
                                            {trip.tripData.waypoints.length > 4 && (
                                                <span className="text-[10px] text-muted-foreground px-2 py-0.5">
                                                    +{trip.tripData.waypoints.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}