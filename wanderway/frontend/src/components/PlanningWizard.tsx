import React, { useState, useMemo } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Autocomplete,
  TextField,
  Slider,
  ButtonGroup,
  Chip,
  Card,
  CardContent,
  Stack,
  useTheme,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import GroupsIcon from '@mui/icons-material/Groups';
import { motion, AnimatePresence } from 'framer-motion';

import { useStreamingTrip } from '../hooks/useStreamingTrip';
import { TripRequest } from '../lib/api';
import StreamingTripDisplay from './StreamingTripDisplay';

// Fallback Mapbox options in case the hook isn't fully implemented yet
const MOCK_DESTINATIONS = ['Paris, France', 'Tokyo, Japan', 'New York City, USA', 'Rome, Italy', 'Bali, Indonesia'];

const INTERESTS_PRESETS = [
  'Food', 'Culture', 'Adventure', 'Nature', 
  'Nightlife', 'Shopping', 'History', 'Art', 
  'Wellness', 'Sports', 'Photography', 'Local Experiences'
];

const STEPS = ['Destination & Duration', 'Travel Style & Budget', 'Interests', 'Review & Generate'];

export default function PlanningWizard() {
  const theme = useTheme();
  
  // Step State
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for back
  
  // Form State
  const [destination, setDestination] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(7);
  
  const [travelStyle, setTravelStyle] = useState<'Solo' | 'Couple' | 'Family' | 'Group' | null>(null);
  const [budget, setBudget] = useState<'Budget' | 'Mid-Range' | 'Luxury' | null>(null);
  
  const [interests, setInterests] = useState<string[]>([]);
  
  const { startStream, status, rawChunks, parsedTrip, error, reset } = useStreamingTrip();

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) {
      setDirection(1);
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setDirection(-1);
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleGenerate = () => {
    if (!destination || !budget) return;
    
    // Map budget to api requirements
    const budgetMap = {
      'Budget': 'budget',
      'Mid-Range': 'moderate',
      'Luxury': 'luxury'
    } as const;
    
    const apiBudget = budgetMap[budget];
    
    // Approximate start/end dates based on duration
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + duration);

    // Map travel style to number of people and requirements
    const peopleMap = { 'Solo': 1, 'Couple': 2, 'Family': 4, 'Group': 6 };
    const numPeople = travelStyle ? peopleMap[travelStyle] : 1;
    
    const req: TripRequest = {
      destination,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      budget: apiBudget,
      interests,
      number_of_people: numPeople,
      special_requirements: `Travel style: ${travelStyle}`
    };
    
    startStream(req);
  };

  // Validation for each step
  const isStepValid = useMemo(() => {
    switch (activeStep) {
      case 0:
        return !!destination && destination.trim() !== '';
      case 1:
        return !!travelStyle && !!budget;
      case 2:
        return interests.length >= 1 && interests.length <= 5;
      case 3:
        return true;
      default:
        return false;
    }
  }, [activeStep, destination, travelStyle, budget, interests]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      if (prev.length < 5) {
        return [...prev, interest];
      }
      return prev;
    });
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  const travelStyleButtons = [
    { label: 'Solo', icon: <PersonIcon /> },
    { label: 'Couple', icon: <FavoriteIcon /> },
    { label: 'Family', icon: <FamilyRestroomIcon /> },
    { label: 'Group', icon: <GroupsIcon /> },
  ];

  const budgetButtons = [
    { label: 'Budget', emoji: '💰' },
    { label: 'Mid-Range', emoji: '💳' },
    { label: 'Luxury', emoji: '💎' },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', p: 3 }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ position: 'relative', minHeight: 400, overflow: 'hidden' }}>
        <AnimatePresence initial={false} custom={direction}>
          {status === 'idle' && (
            <motion.div
              key={activeStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              style={{
                position: 'absolute',
                width: '100%',
                top: 0,
                left: 0,
              }}
            >
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: 4, minHeight: 350 }}>
                  {activeStep === 0 && (
                    <Stack spacing={4}>
                      <Typography variant="h5" fontWeight="bold">Where are you heading?</Typography>
                      
                      <Autocomplete
                        freeSolo
                        options={MOCK_DESTINATIONS}
                        value={destination}
                        onChange={(_, newValue) => setDestination(newValue)}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            label="Search destination" 
                            variant="outlined" 
                            placeholder="e.g. Paris, Tokyo..."
                          />
                        )}
                      />

                      <Box>
                        <Typography gutterBottom>Duration: {duration} day{duration > 1 ? 's' : ''}</Typography>
                        <Slider
                          value={duration}
                          onChange={(_, newValue) => setDuration(newValue as number)}
                          min={1}
                          max={14}
                          marks={[
                            { value: 1, label: '1 day' },
                            { value: 7, label: '7 days' },
                            { value: 14, label: '14 days' },
                          ]}
                          valueLabelDisplay="auto"
                        />
                      </Box>
                    </Stack>
                  )}

                  {activeStep === 1 && (
                    <Stack spacing={4}>
                      <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>Who is traveling?</Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap', gap: 2 }}>
                          {travelStyleButtons.map((btn) => (
                            <Button
                              key={btn.label}
                              variant={travelStyle === btn.label ? 'contained' : 'outlined'}
                              onClick={() => setTravelStyle(btn.label as 'Solo' | 'Couple' | 'Family' | 'Group')}
                              startIcon={btn.icon}
                              size="large"
                              sx={{ flexGrow: 1, textTransform: 'none', minWidth: 140 }}
                            >
                              {btn.label}
                            </Button>
                          ))}
                        </Stack>
                      </Box>

                      <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>What is your budget?</Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap', gap: 2 }}>
                          {budgetButtons.map((btn) => (
                            <Button
                              key={btn.label}
                              variant={budget === btn.label ? 'contained' : 'outlined'}
                              onClick={() => setBudget(btn.label as 'Budget' | 'Mid-Range' | 'Luxury')}
                              size="large"
                              sx={{ flexGrow: 1, textTransform: 'none', minWidth: 140 }}
                            >
                              {btn.emoji} {btn.label}
                            </Button>
                          ))}
                        </Stack>
                      </Box>
                    </Stack>
                  )}

                  {activeStep === 2 && (
                    <Stack spacing={3}>
                      <Typography variant="h5" fontWeight="bold">What are your interests?</Typography>
                      <Typography color="text.secondary">Select between 1 and 5 interests to help us personalize your itinerary.</Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                        {INTERESTS_PRESETS.map((interest) => {
                          const isSelected = interests.includes(interest);
                          return (
                            <Chip
                              key={interest}
                              label={interest}
                              clickable
                              color={isSelected ? 'primary' : 'default'}
                              variant={isSelected ? 'filled' : 'outlined'}
                              onClick={() => toggleInterest(interest)}
                              sx={{ fontSize: '1rem', py: 2, px: 1 }}
                            />
                          );
                        })}
                      </Box>
                      <Typography variant="caption" color={interests.length > 5 ? 'error' : 'text.secondary'}>
                        Selected: {interests.length} / 5
                      </Typography>
                    </Stack>
                  )}

                  {activeStep === 3 && (
                    <Stack spacing={4} alignItems="center">
                      <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
                        Ready to Explore?
                      </Typography>
                      
                      <Card variant="outlined" sx={{ width: '100%', maxWidth: 500, bgcolor: 'background.default' }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            <strong>Destination:</strong> {destination}
                          </Typography>
                          <Typography variant="subtitle1" gutterBottom>
                            <strong>Duration:</strong> {duration} days
                          </Typography>
                          <Typography variant="subtitle1" gutterBottom>
                            <strong>Travel Style:</strong> {travelStyle}
                          </Typography>
                          <Typography variant="subtitle1" gutterBottom>
                            <strong>Budget:</strong> {budget}
                          </Typography>
                          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <strong>Interests:</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                            {interests.map(i => <Chip key={i} label={i} size="small" color="primary" />)}
                          </Box>
                        </CardContent>
                      </Card>

                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          variant="contained" 
                          size="large" 
                          color="primary"
                          onClick={handleGenerate}
                          sx={{ 
                            py: 2, 
                            px: 6, 
                            fontSize: '1.2rem', 
                            fontWeight: 'bold',
                            borderRadius: 8,
                            textTransform: 'none',
                            boxShadow: theme.shadows[8]
                          }}
                        >
                          ✨ Generate My Trip ✨
                        </Button>
                      </motion.div>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {status === 'idle' && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            size="large"
          >
            Back
          </Button>
          {activeStep < STEPS.length - 1 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid}
              size="large"
            >
              Next
            </Button>
          )}
        </Box>
      )}

      {status !== 'idle' && (
        <StreamingTripDisplay
          status={status}
          rawChunks={rawChunks}
          parsedTrip={parsedTrip}
          error={error}
          onRetry={() => {
            reset();
            // Automatically retry with previous selections
            handleGenerate();
          }}
        />
      )}
    </Box>
  );
}
