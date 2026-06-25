"use client";

import React, { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Thermometer, Droplets, Wind, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayForecast {
    date: string;
    maxTemp: number;
    minTemp: number;
    precipitation: number;
    condition: string;
}

interface WeatherWidgetProps {
    city?: string;
    latitude?: number;
    longitude?: number;
    days?: number;
    className?: string;
}

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
    Goa: { lat: 15.2993, lon: 74.124 },
    Mumbai: { lat: 19.076, lon: 72.8777 },
    Delhi: { lat: 28.6139, lon: 77.209 },
    Bangalore: { lat: 12.9716, lon: 77.5946 },
    Jaipur: { lat: 26.9124, lon: 75.7873 },
    Manali: { lat: 32.2432, lon: 77.1892 },
    Kerala: { lat: 10.8505, lon: 76.2711 },
    Ooty: { lat: 11.4102, lon: 76.695 },
};

function getWeatherIcon(condition: string, size = 20) {
    const c = condition.toLowerCase();
    if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) {
        return <CloudRain size={size} className="text-blue-400" />;
    }
    if (c.includes("snow") || c.includes("blizzard")) {
        return <CloudSnow size={size} className="text-blue-200" />;
    }
    if (c.includes("cloud") || c.includes("overcast") || c.includes("fog")) {
        return <Cloud size={size} className="text-muted-foreground" />;
    }
    return <Sun size={size} className="text-secondary" />;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
    city = "Goa",
    latitude,
    longitude,
    days = 5,
    className,
}) => {
    const [forecast, setForecast] = useState<DayForecast[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchWeather() {
            setLoading(true);
            setError(null);

            try {
                const coords = CITY_COORDS[city] || { lat: latitude || 15.2993, lon: longitude || 74.124 };
                const lat = latitude || coords.lat;
                const lon = longitude || coords.lon;

                const today = new Date();
                const startDate = today.toISOString().split("T")[0];
                const endDate = new Date(today.getTime() + days * 86400000).toISOString().split("T")[0];

                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&start_date=${startDate}&end_date=${endDate}&timezone=Asia%2FKolkata`;

                const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
                const data = await res.json();

                if (!data.daily) throw new Error("No weather data");

                const weatherCodes: Record<number, string> = {
                    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
                    45: "Foggy", 51: "Light drizzle", 61: "Light rain", 63: "Moderate rain",
                    80: "Rain showers", 95: "Thunderstorm",
                };

                const parsed: DayForecast[] = data.daily.time.map((date: string, i: number) => ({
                    date,
                    maxTemp: Math.round(data.daily.temperature_2m_max[i]),
                    minTemp: Math.round(data.daily.temperature_2m_min[i]),
                    precipitation: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
                    condition: weatherCodes[data.daily.weathercode[i]] || "Mixed",
                }));

                setForecast(parsed);
            } catch (err) {
                console.error("Weather fetch failed:", err);
                setError("Could not load weather data");
            } finally {
                setLoading(false);
            }
        }

        fetchWeather();
    }, [city, latitude, longitude, days]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return {
            day: d.toLocaleDateString("en-IN", { weekday: "short" }),
            date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        };
    };

    const today = forecast[0];

    return (
        <div className={cn("bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm", className)}>
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
                <div className="flex items-center gap-2 mb-4 opacity-80">
                    <MapPin size={14} />
                    <span className="text-sm font-medium">{city}</span>
                </div>

                {loading ? (
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-foreground/20 rounded-full animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-20 h-6 bg-primary-foreground/20 rounded animate-pulse" />
                            <div className="w-32 h-4 bg-primary-foreground/20 rounded animate-pulse" />
                        </div>
                    </div>
                ) : error ? (
                    <p className="text-sm opacity-70">{error}</p>
                ) : today ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-bold">{today.maxTemp}°</span>
                                <span className="text-xl opacity-70 mb-1">{today.minTemp}°</span>
                            </div>
                            <p className="text-sm opacity-80 mt-1">{today.condition}</p>
                        </div>
                        <div className="opacity-90">
                            {getWeatherIcon(today.condition, 48)}
                        </div>
                    </div>
                ) : null}

                {/* Stats row */}
                {today && !loading && !error && (
                    <div className="flex gap-4 mt-4 pt-4 border-t border-primary-foreground/20">
                        <div className="flex items-center gap-1.5 text-xs opacity-80">
                            <Droplets size={12} />
                            <span>{today.precipitation}mm rain</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs opacity-80">
                            <Thermometer size={12} />
                            <span>Feels like {today.maxTemp - 2}°C</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 5-day forecast */}
            {!loading && !error && forecast.length > 1 && (
                <div className="p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        {days}-Day Forecast
                    </p>
                    <div className="space-y-2">
                        {forecast.slice(1).map((day, i) => {
                            const { day: dayName, date } = formatDate(day.date);
                            return (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                                    <div className="w-16">
                                        <p className="text-xs font-bold text-foreground">{dayName}</p>
                                        <p className="text-[10px] text-muted-foreground">{date}</p>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center">
                                        {getWeatherIcon(day.condition, 16)}
                                        <span className="text-xs text-muted-foreground ml-1.5 hidden sm:block">{day.condition}</span>
                                    </div>
                                    <div className="flex items-center gap-2 w-20 justify-end">
                                        <span className="text-xs font-bold text-foreground">{day.maxTemp}°</span>
                                        <span className="text-xs text-muted-foreground">{day.minTemp}°</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeatherWidget;