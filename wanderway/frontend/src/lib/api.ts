export class ApiError extends Error {
  public status: number;
  public detail: any;

  constructor(status: number, message: string, detail?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Activity {
  time: string;
  title: string;
  description: string;
  location?: string;
  estimated_cost?: number;
}

export interface DayItinerary {
  day_number: number;
  date?: string;
  theme?: string;
  activities: Activity[];
}

export interface TripRequest {
  destination: string;
  start_date: string;
  end_date: string;
  budget?: 'budget' | 'moderate' | 'luxury';
  interests?: string[];
  origin?: string;
  number_of_people?: number;
  total_budget?: number;
  special_requirements?: string;
}

export interface TripResponse {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  itinerary: DayItinerary[];
  created_at?: string;
}

async function fetchWithHandler(url: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      signal: controller.signal,
    });
    
    if (!response.ok) {
      let detail = null;
      let message = 'An API error occurred';
      try {
        const errorData = await response.json();
        detail = errorData.detail;
        message = typeof detail === 'string' ? detail : errorData.message || response.statusText;
      } catch (e) {
        message = response.statusText;
      }
      throw new ApiError(response.status, message, detail);
    }
    
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function planTrip(req: TripRequest): Promise<TripResponse> {
  const response = await fetchWithHandler('/api/v1/trips/plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  });
  
  return response.json();
}

export async function getTrip(tripId: string): Promise<TripResponse> {
  const response = await fetchWithHandler(`/api/v1/trips/${tripId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  
  return response.json();
}

export async function downloadTripPDF(tripId: string): Promise<Blob> {
  const response = await fetchWithHandler(`/api/v1/trips/${tripId}/pdf`, {
    method: 'GET',
  });
  
  return response.blob();
}
