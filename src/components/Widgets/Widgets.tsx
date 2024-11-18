import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  limit,
  getDocs,
  where,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search, TrendingUp } from '@mui/icons-material';

const Widgets = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    fetchTrendingTopics();
    fetchSuggestedUsers();
  }, []);

  const fetchTrendingTopics = async () => {
    // In a real app, you would implement trending topics algorithm
    // For now, we'll use dummy data
    setTrendingTopics([
      { id: 1, tag: '#JavaScript', tweetCount: '125K' },
      { id: 2, tag: '#React', tweetCount: '98K' },
      { id: 3, tag: '#TypeScript', tweetCount: '45K' },
      { id: 4, tag: '#Firebase', tweetCount: '23K' },
      { id: 5, tag: '#WebDev', tweetCount: '12K' },
    ]);
  };

  const fetchSuggestedUsers = async () => {
    if (!currentUser) return;

    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('userId', '!=', currentUser.uid),
        limit(5)
      );
      const snapshot = await getDocs(q);
      setSuggestedUsers(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const targetUserRef = doc(db, 'users', userId);

      // Check if already following
      const isFollowing = suggestedUsers.find(
        (user) => user.id === userId
      )?.followers?.includes(currentUser.uid);

      if (isFollowing) {
        await updateDoc(userRef, {
          following: arrayRemove(userId),
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUser.uid),
        });
      } else {
        await updateDoc(userRef, {
          following: arrayUnion(userId),
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUser.uid),
        });
      }

      // Refresh suggested users
      fetchSuggestedUsers();
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  return (
    <Box>
      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search Twitter"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {/* Trending Topics */}
      <Paper sx={{ mb: 2, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Trends for you
        </Typography>
        <List>
          {trendingTopics.map((topic) => (
            <ListItem
              key={topic.id}
              sx={{
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.01)' },
              }}
              onClick={() => navigate(`/search?q=${topic.tag}`)}
            >
              <ListItemText
                primary={topic.tag}
                secondary={`${topic.tweetCount} Tweets`}
              />
              <TrendingUp color="primary" />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Who to follow */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Who to follow
        </Typography>
        <List>
          {suggestedUsers.map((user) => (
            <ListItem
              key={user.id}
              secondaryAction={
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleFollow(user.id)}
                  sx={{ borderRadius: '9999px' }}
                >
                  {user.followers?.includes(currentUser?.uid)
                    ? 'Following'
                    : 'Follow'}
                </Button>
              }
            >
              <ListItemAvatar>
                <Avatar src={user.profilePicture} />
              </ListItemAvatar>
              <ListItemText
                primary={user.username}
                secondary={user.bio}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
                onClick={() => navigate(`/profile/${user.id}`)}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Widgets;
