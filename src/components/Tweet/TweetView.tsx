import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Divider,
  CircularProgress,
  TextField,
  Button,
  IconButton,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import Tweet from '../Feed/Tweet';

interface Reply {
  id: string;
  text: string;
  userId: string;
  username: string;
  userAvatar: string;
  timestamp: any;
  likes: string[];
  retweets: string[];
  replies: string[];
  parentTweetId: string;
}

const TweetView: React.FC = () => {
  const { tweetId } = useParams<{ tweetId: string }>();
  const navigate = useNavigate();
  const [tweet, setTweet] = useState<any>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!tweetId) return;

    // Fetch the main tweet
    const fetchTweet = async () => {
      try {
        const tweetDoc = await getDoc(doc(db, 'tweets', tweetId));
        if (tweetDoc.exists()) {
          setTweet({ id: tweetDoc.id, ...tweetDoc.data() });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tweet:', error);
        setLoading(false);
      }
    };

    // Subscribe to replies
    const repliesQuery = query(
      collection(db, 'tweets'),
      where('parentTweetId', '==', tweetId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(repliesQuery, (snapshot) => {
      const repliesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reply[];
      setReplies(repliesData);
    });

    fetchTweet();
    return () => unsubscribe();
  }, [tweetId]);

  const handleReply = async () => {
    if (!user || !replyText.trim()) return;

    try {
      const replyData = {
        text: replyText,
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        userAvatar: user.photoURL || '',
        timestamp: serverTimestamp(),
        likes: [],
        retweets: [],
        replies: [],
        parentTweetId: tweetId
      };

      await addDoc(collection(db, 'tweets'), replyData);
      setReplyText('');
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tweet) {
    return (
      <Container>
        <Typography variant="h6">Tweet not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2 }}>
            Tweet
          </Typography>
        </Box>

        <Tweet tweet={tweet} />
        
        {user && (
          <Box sx={{ py: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Tweet your reply"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              inputProps={{ maxLength: 280 }}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {replyText.length}/280
              </Typography>
              <Button
                variant="contained"
                disabled={!replyText.trim() || replyText.length > 280}
                onClick={handleReply}
              >
                Reply
              </Button>
            </Box>
          </Box>
        )}

        {replies.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Replies
            </Typography>
            {replies.map((reply) => (
              <Tweet key={reply.id} tweet={reply} />
            ))}
          </>
        )}
      </Box>
    </Container>
  );
};

export default TweetView;
