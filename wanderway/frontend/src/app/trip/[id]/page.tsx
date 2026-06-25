import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTrip } from "../../../lib/api";
import { TripDisplay } from "../../../app/trip/[id]/TripDisplay";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;

  try {
    const trip = await getTrip(resolvedParams.id);
    return {
      title: `Trip to ${trip.destination} | WanderWay`,
      description: `A custom itinerary for ${trip.destination} from ${trip.start_date} to ${trip.end_date}.`,
      openGraph: {
        title: `Trip to ${trip.destination} | WanderWay`,
        description: `A custom itinerary for ${trip.destination}. Check out my plan!`,
        images: [
          // Basic Unsplash placeholder, can be swapped for a real OG Image API later
          `https://source.unsplash.com/1200x630/?${encodeURIComponent(trip.destination)}`,
        ],
      },
    };
  } catch (error) {
    return {
      title: "Trip Not Found | WanderWay",
    };
  }
}

export default async function TripPage({ params }: Props) {
  const resolvedParams = await params;

  try {
    const trip = await getTrip(resolvedParams.id);

    return (
      <main className="min-h-screen bg-gray-50">
        <TripDisplay trip={trip} />
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if ((error as any)?.status === 404 || (error as any)?.status === 422) {
      notFound();
    }
    throw error; // Let the nearest error.tsx boundary handle it
  }
}
