import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Box,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
} from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  Repeat,
  ChatBubbleOutline,
  Share,
  MoreHoriz,
} from '@mui/icons-material';
import moment from 'moment';
import { auth, db } from '../../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';

interface TweetProps {
  tweet: {
    id: string;
    text: string;
    username: string;
    userAvatar: string;
    timestamp: any;
    likes: string[];
    retweets: string[];
    replies: any[];
    userId: string;
  };
  onDelete?: () => void;
}

const Tweet: React.FC<TweetProps> = ({ tweet, onDelete }) => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const isLiked = user ? tweet.likes.includes(user.uid) : false;
  const isRetweeted = user ? tweet.retweets.includes(user.uid) : false;

  const handleLike = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const tweetRef = doc(db, 'tweets', tweet.id);
      await updateDoc(tweetRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      setSnackbarMessage('Error updating like');
      setSnackbarOpen(true);
    }
  };

  const handleRetweet = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const tweetRef = doc(db, 'tweets', tweet.id);
      await updateDoc(tweetRef, {
        retweets: isRetweeted ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      setSnackbarMessage('Error updating retweet');
      setSnackbarOpen(true);
    }
  };

  const handleReply = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(`/tweet/${tweet.id}`);
  };

  const handleShare = async () => {
    try {
      const tweetUrl = `${window.location.origin}/tweet/${tweet.id}`;
      await navigator.clipboard.writeText(tweetUrl);
      setSnackbarMessage('Tweet URL copied to clipboard');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Error copying to clipboard');
      setSnackbarOpen(true);
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile/${tweet.userId}`);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteTweet = async () => {
    if (!user || user.uid !== tweet.userId) return;

    try {
      await deleteDoc(doc(db, 'tweets', tweet.id));
      setSnackbarMessage('Tweet deleted successfully');
      setSnackbarOpen(true);
      onDelete?.();
    } catch (error) {
      setSnackbarMessage('Error deleting tweet');
      setSnackbarOpen(true);
    }
    handleMenuClose();
  };

  const handleReport = () => {
    setSnackbarMessage('Tweet reported');
    setSnackbarOpen(true);
    handleMenuClose();
  };

  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 2, 
        borderBottom: 1,
        borderColor: 'divider',
        borderRadius: 0,
        backgroundColor: 'background.paper',
        '&:hover': {
          backgroundColor: 'action.hover',
        }
      }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Avatar 
          src={tweet.userAvatar} 
          sx={{ 
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            cursor: 'pointer'
          }}
          onClick={handleProfileClick}
        />
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography 
                component="span" 
                sx={{ 
                  fontWeight: 'bold',
                  mr: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
                onClick={handleProfileClick}
              >
                {tweet.username}
              </Typography>
              <Typography 
                component="span" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/tweet/${tweet.id}`)}
              >
                · {moment(tweet.timestamp?.toDate()).fromNow()}
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreHoriz />
            </IconButton>
          </Box>
          
          <Typography 
            sx={{ 
              mb: 2,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
            onClick={() => navigate(`/tweet/${tweet.id}`)}
          >
            {tweet.text}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', maxWidth: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size="small" onClick={handleReply}>
                <ChatBubbleOutline fontSize="small" />
              </IconButton>
              {tweet.replies.length > 0 && (
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {tweet.replies.length}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                size="small" 
                onClick={handleRetweet}
                sx={{ 
                  color: isRetweeted ? 'success.main' : 'text.secondary',
                  '&:hover': {
                    color: 'success.main'
                  }
                }}
              >
                <Repeat fontSize="small" />
              </IconButton>
              {tweet.retweets.length > 0 && (
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {tweet.retweets.length}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                size="small" 
                onClick={handleLike}
                sx={{ 
                  color: isLiked ? 'error.main' : 'text.secondary',
                  '&:hover': {
                    color: 'error.main'
                  }
                }}
              >
                {isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
              </IconButton>
              {tweet.likes.length > 0 && (
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {tweet.likes.length}
                </Typography>
              )}
            </Box>

            <IconButton 
              size="small" 
              onClick={handleShare}
              sx={{ color: 'text.secondary' }}
            >
              <Share fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {user?.uid === tweet.userId ? (
          <MenuItem onClick={handleDeleteTweet}>Delete Tweet</MenuItem>
        ) : (
          <MenuItem onClick={handleReport}>Report Tweet</MenuItem>
        )}
      </Menu>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Paper>
  );
};

export default Tweet;
