import { useState, useCallback, useRef } from 'react';
import { TripRequest, TripResponse } from '../lib/api';

type StreamStatus = 'idle' | 'streaming' | 'done' | 'error';

export function useStreamingTrip() {
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [rawChunks, setRawChunks] = useState<string[]>([]);
  const [parsedTrip, setParsedTrip] = useState<TripResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStatus('idle');
    setRawChunks([]);
    setParsedTrip(null);
    setError(null);
  }, []);

  const startStream = useCallback(async (req: TripRequest) => {
    reset();
    setStatus('streaming');
    abortControllerRef.current = new AbortController();
    
    const STREAM_TIMEOUT_MS = 120_000; // 2 minutes
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
      setStatus('error');
      setError('Stream timed out after 2 minutes');
    }, STREAM_TIMEOUT_MS);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${baseUrl}/api/v1/stream/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(req),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let accumulatedText = '';
      let lastParseTime = Date.now();
      let isDone = false;

      while (!isDone) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Split on "data: " as requested
        const parts = chunk.split('data: ');

        for (let part of parts) {
          // Remove typical SSE trailing newlines but preserve internal spacing
          part = part.replace(/\r?\n+$/, '');
          
          if (!part) continue;

          // Check for completion marker
          if (part.trim() === '[DONE]') {
            isDone = true;
            setStatus('done');
            try {
              setParsedTrip(JSON.parse(accumulatedText));
            } catch (e) {
              console.error('Final JSON parse failed', e);
            }
            break;
          }

          // Accumulate raw text
          accumulatedText += part;
          setRawChunks((prev) => [...prev, part]);

          // Attempt partial JSON renders every 500ms
          const now = Date.now();
          if (now - lastParseTime > 500) {
            lastParseTime = now;
            try {
              setParsedTrip(JSON.parse(accumulatedText));
            } catch (e) {
              // Ignore partial parse errors (JSON is likely incomplete)
            }
          }
        }
      }

      // Handle standard stream end if [DONE] was missing
      if (!isDone) {
         setStatus('done');
         try {
           if (accumulatedText) {
             setParsedTrip(JSON.parse(accumulatedText));
           }
         } catch (e) {
           console.error('Stream ended without [DONE], final parse failed:', e);
         }
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'An error occurred while streaming');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }, [reset]);

  return {
    status,
    rawChunks,
    parsedTrip,
    error,
    startStream,
    reset,
  };
}
