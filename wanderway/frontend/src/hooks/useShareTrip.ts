import { useCallback, useState } from 'react';
import { TripResponse } from '../lib/api';

export function useShareTrip() {
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateShareUrl = useCallback((tripId: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/trip/${tripId}`;
    }
    return `/trip/${tripId}`;
  }, []);

  const copyToClipboard = useCallback(async (url: string) => {
    try {
      setError(null);
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('Fallback copy failed');
        }
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message || 'Failed to copy to clipboard');
      console.error('Copy to clipboard failed', error);
    }
  }, []);

  const shareNative = useCallback(async (trip: TripResponse) => {
    const url = generateShareUrl(trip.id);
    
    try {
      setError(null);
      if (navigator.share) {
        await navigator.share({
          title: `My Trip to ${trip.destination}`,
          text: `Check out my itinerary for ${trip.destination} on WanderWay!`,
          url: url,
        });
      } else {
        // Fallback to clipboard if Web Share API is not supported
        await copyToClipboard(url);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // AbortError is thrown when the user cancels the native share sheet
      if (!(error instanceof Error && error.name === 'AbortError')) {
        setError(message || 'Failed to share natively');
        console.error('Native share failed', error);
        // Fallback
        await copyToClipboard(url);
      }
    }
  }, [generateShareUrl, copyToClipboard]);

  return {
    generateShareUrl,
    copyToClipboard,
    shareNative,
    isCopied,
    error,
  };
}
