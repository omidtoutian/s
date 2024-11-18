import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Avatar,
  TextField,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  ArrowBack,
} from '@mui/icons-material';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';

const ComposeTweet = () => {
  const navigate = useNavigate();
  const [tweetText, setTweetText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;

  const handleTweet = async () => {
    if (!user || !tweetText.trim()) return;
    if (tweetText.length > 280) {
      setError('Tweet cannot exceed 280 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const tweetData = {
        text: tweetText.trim(),
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        userAvatar: user.photoURL || '',
        timestamp: serverTimestamp(),
        likes: [],
        retweets: [],
        replies: [],
      };

      await addDoc(collection(db, 'tweets'), tweetData);
      navigate('/');
    } catch (error: any) {
      console.error('Error posting tweet:', error);
      setError(error.message || 'Error posting tweet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          backgroundColor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            color="primary"
            disabled={!tweetText.trim() || loading}
            onClick={handleTweet}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              px: { xs: 2, sm: 3 },
              py: { xs: 0.5, sm: 1 },
              minWidth: { xs: '60px', sm: '80px' }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Tweet'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Compose Area */}
      <Box sx={{ p: 2, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Avatar 
            src={user?.photoURL || ''} 
            sx={{ 
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 }
            }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="What's happening?"
              value={tweetText}
              onChange={(e) => setTweetText(e.target.value)}
              variant="standard"
              sx={{ 
                mb: 2,
                '& .MuiInputBase-root': {
                  fontSize: { xs: '1.2rem', sm: '1.3rem' }
                }
              }}
              autoFocus
            />
            {tweetText.length > 0 && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  color: tweetText.length > 280 ? 'error.main' : 'text.secondary'
                }}
              >
                {tweetText.length}/280
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ComposeTweet;
