import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import {
  Box,
  Paper,
  Avatar,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import Tweet from './Tweet';

const Feed = () => {
  const [tweets, setTweets] = useState<any[]>([]);
  const [tweetText, setTweetText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'tweets'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTweets(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, [user]);

  const handleTweet = async () => {
    if (!user || !tweetText.trim() || tweetText.length > 280) return;

    setLoading(true);
    setError(null);
    try {
      await addDoc(collection(db, 'tweets'), {
        text: tweetText,
        userId: user.uid,
        username: user.displayName,
        userAvatar: user.photoURL,
        timestamp: serverTimestamp(),
        likes: [],
        retweets: [],
        replies: [],
      });

      setTweetText('');
    } catch (error: any) {
      console.error('Error posting tweet:', error);
      setError(error.message || 'Error posting tweet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Feed Header */}
      <Paper 
        sx={{ 
          p: 2, 
          position: 'sticky',
          top: 0,
          zIndex: 1,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Home</Box>
      </Paper>

      {/* Tweet Composer */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
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
              rows={2}
              placeholder="What's happening?"
              value={tweetText}
              onChange={(e) => setTweetText(e.target.value)}
              variant="standard"
              sx={{ 
                mb: 2,
                '& .MuiInputBase-root': {
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }
              }}
            />
            {tweetText.length > 0 && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  color: tweetText.length > 280 ? 'error.main' : 'text.secondary',
                  mb: 2
                }}
              >
                {tweetText.length}/280
              </Box>
            )}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center'
              }}
            >
              <Button
                variant="contained"
                color="primary"
                disabled={!tweetText.trim() || loading || tweetText.length > 280}
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
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Tweets Feed */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {tweets.map((tweet) => (
          <Tweet key={tweet.id} tweet={tweet} />
        ))}
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

export default Feed;
