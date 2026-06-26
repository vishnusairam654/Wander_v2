import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton,
  Chip,
  Popover,
  Stack,
  Divider,
  Badge
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaidIcon from '@mui/icons-material/Paid';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { motion } from 'framer-motion';
import { DayItinerary, Activity } from '../lib/api';

const BRAND_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#F4A261'  // Orange
];

interface DayItineraryCardProps {
  day: DayItinerary;
  index?: number;
}

const categorizeActivities = (activities: Activity[]) => {
  const sections = {
    Morning: [] as Activity[],
    Afternoon: [] as Activity[],
    Evening: [] as Activity[]
  };

  activities.forEach(act => {
    const time = (act.time || '').toLowerCase();
    if (time.includes('morning')) {
      sections.Morning.push(act);
    } else if (time.includes('afternoon')) {
      sections.Afternoon.push(act);
    } else if (time.includes('evening') || time.includes('night')) {
      sections.Evening.push(act);
    } else if (time.includes('am')) {
      sections.Morning.push(act);
    } else if (time.includes('pm')) {
      const match = time.match(/(\d+)/);
      if (match) {
        const hour = parseInt(match[1], 10);
        if (hour === 12 || (hour >= 1 && hour < 5)) sections.Afternoon.push(act);
        else sections.Evening.push(act);
      } else {
        sections.Afternoon.push(act);
      }
    } else {
      const match = time.match(/(\d{1,2}):\d{2}/);
      if (match) {
        const hour = parseInt(match[1], 10);
        if (hour < 12) sections.Morning.push(act);
        else if (hour < 17) sections.Afternoon.push(act);
        else sections.Evening.push(act);
      } else {
        console.warn(`Unrecognized time string: "${time}". Falling back to Morning.`);
        sections.Morning.push(act); // Default fallback
      }
    }
  });

  return sections;
};

export default function DayItineraryCard({ day, index = 0 }: DayItineraryCardProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const handleChipClick = (event: React.MouseEvent<HTMLElement>, activity: Activity) => {
    setAnchorEl(event.currentTarget);
    setSelectedActivity(activity);
    event.stopPropagation();
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setSelectedActivity(null);
  };

  const sections = categorizeActivities(day.activities);
  const totalCost = day.activities.reduce((sum, act) => sum + (act.estimated_cost || 0), 0);
  const borderColor = BRAND_COLORS[(day.day_number - 1) % BRAND_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Accordion
        elevation={2}
        sx={{
          mb: 2,
          borderRadius: 2,
          overflow: 'hidden',
          borderLeft: `6px solid ${borderColor}`,
          '&:before': { display: 'none' } // Hide default top border
        }}
        defaultExpanded={day.day_number === 1}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center' } }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              Day {day.day_number} &mdash; {day.theme || 'Exploration'}
            </Typography>
            {day.date && (
              <Typography variant="caption" color="text.secondary">
                {new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </Typography>
            )}
          </Box>
          <IconButton 
            size="small" 
            onClick={(e) => { e.stopPropagation(); console.log(`Save Day ${day.day_number} activities`); }} 
            sx={{ mr: 2 }}
            color="primary"
            aria-label={`Save Day ${day.day_number} activities`}
          >
            <BookmarkAddIcon />
          </IconButton>
        </AccordionSummary>

        <AccordionDetails sx={{ pt: 0, pb: 2, px: 3 }}>
          <Stack spacing={3}>
            {/* Sections */}
            {Object.entries(sections).map(([sectionName, acts]) => {
              if (acts.length === 0) return null;
              
              const iconMap: Record<string, string> = {
                Morning: '🌅',
                Afternoon: '☀️',
                Evening: '🌙'
              };

              return (
                <Box key={sectionName}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {iconMap[sectionName]} {sectionName}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {acts.map((act, i) => (
                      <Chip
                        key={act.title || i}
                        label={act.title}
                        onClick={(e) => handleChipClick(e, act)}
                        variant="outlined"
                        color="primary"
                        sx={{
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}

            {/* Footer */}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1.5 }}>
                Est. Daily Cost:
              </Typography>
              <Badge badgeContent={`₹${totalCost}`} color="secondary" showZero sx={{ '& .MuiBadge-badge': { fontSize: '0.85rem', height: 24, minWidth: 24, px: 1 } }}>
                <PaidIcon color="action" />
              </Badge>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Activity Details Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        slotProps={{
          paper: {
            sx: { p: 2, maxWidth: 300, borderRadius: 2, mt: 1 }
          }
        }}
      >
        {selectedActivity && (
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              {selectedActivity.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.secondary' }}>
              <AccessTimeIcon fontSize="small" />
              <Typography variant="body2">{selectedActivity.time}</Typography>
            </Box>

            {selectedActivity.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.secondary' }}>
                <LocationOnIcon fontSize="small" />
                <Typography variant="body2">{selectedActivity.location}</Typography>
              </Box>
            )}

            {selectedActivity.estimated_cost !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'text.secondary' }}>
                <PaidIcon fontSize="small" />
                <Typography variant="body2">₹{selectedActivity.estimated_cost}</Typography>
              </Box>
            )}

            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <InfoIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
              <Typography variant="body2">
                {selectedActivity.description}
              </Typography>
            </Box>
          </Box>
        )}
      </Popover>
    </motion.div>
  );
}
