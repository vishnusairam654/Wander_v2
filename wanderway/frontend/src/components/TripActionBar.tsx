"use client";

import React, { useState } from 'react';
import { 
  Paper, 
  IconButton, 
  Tooltip, 
  Snackbar, 
} from '@mui/material';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ShareIcon from '@mui/icons-material/Share';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import { motion, AnimatePresence } from 'framer-motion';

export interface TripActionBarProps {
  isVisible: boolean;
  saveTrip?: () => void | Promise<void>;
  downloadTripPDF?: () => void | Promise<void>;
  reset?: () => void;
  tripUrl?: string;
}

export const TripActionBar: React.FC<TripActionBarProps> = ({
  isVisible,
  saveTrip,
  downloadTripPDF,
  reset,
  tripUrl,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSave = async () => {
    if (!isSaved && !isSaving) {
      setIsSaving(true);
      try {
        if (saveTrip) {
          await saveTrip();
        }
        setIsSaved(true);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const shareNative = async () => {
    if (isSharing) return;
    setIsSharing(true);
    const urlToShare = tripUrl || (typeof window !== 'undefined' ? window.location.href : '');
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: 'My WanderWay Trip',
            text: 'Check out my awesome trip itinerary!',
            url: urlToShare,
          });
        } catch (err) {
          console.error('Share failed:', err);
        }
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(urlToShare)
          .then(() => setSnackbarOpen(true))
          .catch((err) => console.error('Clipboard write failed:', err));
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleReset = () => {
    if (reset) {
      reset();
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1300,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none', // Allow clicking through to underlying content
            }}
          >
            <Paper
              elevation={8}
              sx={{
                pointerEvents: 'auto', // Re-enable for the bar itself
                display: 'flex',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                width: '100%',
                maxWidth: '600px',
                p: 1.5,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderTop: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Tooltip title={isSaved ? "Saved" : "Save Trip"} placement="top">
                <IconButton 
                  onClick={handleSave} 
                  color={isSaved ? "primary" : "default"}
                  size="large"
                  disabled={isSaving}
                  aria-label={isSaved ? "Saved" : "Save Trip"}
                >
                  {isSaved ? <BookmarkIcon /> : <BookmarkAddIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Share" placement="top">
                <IconButton onClick={shareNative} size="large" disabled={isSharing} aria-label="Share">
                  <ShareIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Download PDF" placement="top">
                <IconButton onClick={downloadTripPDF} size="large" aria-label="Download PDF">
                  <PictureAsPdfIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="New Trip" placement="top">
                <IconButton onClick={handleReset} size="large" aria-label="New Trip">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Link copied!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: { xs: 8, sm: 10 } }} // Position above the action bar
      />
    </>
  );
};

export default TripActionBar;
