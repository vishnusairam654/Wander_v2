import React, { useEffect, useRef } from 'react';
import { Box, Typography, LinearProgress, Skeleton, Card, CardContent, Button, Stack, Alert, Paper } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { TripResponse } from '../lib/api';
import DayItineraryCard from './DayItineraryCard';
import RefreshIcon from '@mui/icons-material/Refresh';

interface StreamingTripDisplayProps {
  status: 'idle' | 'streaming' | 'done' | 'error';
  rawChunks: string[];
  parsedTrip: TripResponse | null;
  error: string | null;
  onRetry: () => void;
}

export default function StreamingTripDisplay({ status, rawChunks, parsedTrip, error, onRetry }: StreamingTripDisplayProps) {
  const liveTextContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the live text area to the bottom as new chunks arrive
  useEffect(() => {
    if (liveTextContainerRef.current && status === 'streaming') {
      liveTextContainerRef.current.scrollTop = liveTextContainerRef.current.scrollHeight;
    }
  }, [rawChunks, status]);

  if (status === 'idle') {
    return null;
  }

  const estimatedTotalChunks = 100;
  const progress = Math.min((rawChunks.length / estimatedTotalChunks) * 100, 100);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    },
    exit: {
      opacity: 0,
      transition: { staggerChildren: 0.05, staggerDirection: -1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      {status === 'error' && (
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={onRetry} startIcon={<RefreshIcon />}>
              Retry
            </Button>
          }
        >
          {error || 'Failed to generate your trip. Please try again.'}
        </Alert>
      )}

      {(status === 'streaming' || status === 'done') && (
        <Stack spacing={4}>
          <AnimatePresence mode="wait">
            {status === 'streaming' && (
              <motion.div
                key="streaming-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.5 }}
              >
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h6" gutterBottom color="primary">
                      Generating Your Itinerary...
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(progress)}%
                      </Typography>
                    </Box>
                  </Box>

                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#1e1e1e', 
                      color: '#a0a0a0',
                      fontFamily: 'monospace',
                      height: 150,
                      overflowY: 'auto',
                      position: 'relative'
                    }}
                    ref={liveTextContainerRef}
                    aria-live="polite"
                  >
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', m: 0 }}>
                      {rawChunks.join('')}
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        style={{ display: 'inline-block', width: '8px', height: '14px', backgroundColor: '#a0a0a0', marginLeft: '4px', verticalAlign: 'middle' }}
                      />
                    </Typography>
                  </Paper>

                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    role="status"
                    aria-busy="true"
                    aria-label="Generating your trip itinerary"
                  >
                    {[1, 2, 3].map((i) => (
                      <motion.div key={`skeleton-${i}`} variants={itemVariants}>
                        <Card sx={{ mb: 2 }}>
                          <CardContent>
                            <Skeleton variant="text" width="40%" height={32} animation="wave" />
                            <Skeleton variant="text" width="20%" height={24} animation="wave" sx={{ mb: 2 }} />
                            
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                              <Skeleton variant="circular" width={24} height={24} animation="wave" />
                              <Skeleton variant="text" width="80%" animation="wave" />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Skeleton variant="circular" width={24} height={24} animation="wave" />
                              <Skeleton variant="text" width="60%" animation="wave" />
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </Stack>
              </motion.div>
            )}

            {status === 'done' && parsedTrip && (
              <motion.div
                key="done-state"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Your Trip to {parsedTrip.destination}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {new Date(parsedTrip.start_date).toLocaleDateString()} - {new Date(parsedTrip.end_date).toLocaleDateString()}
                  </Typography>
                </Box>

                {parsedTrip.itinerary.map((day) => (
                  <motion.div key={day.day_number} variants={itemVariants}>
                    <DayItineraryCard day={day} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Stack>
      )}
    </Box>
  );
}
