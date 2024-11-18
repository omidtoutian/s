import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Tab,
  Tabs,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Search, TrendingUp, Tag } from '@mui/icons-material';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Tweet from '../Feed/Tweet';
import PageHeader from '../Layout/PageHeader';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Explore: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [trending, setTrending] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trendingTweets, setTrendingTweets] = useState<any[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<any[]>([]);

  useEffect(() => {
    fetchTrending();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchTrending = async () => {
    try {
      // Fetch trending tweets (most liked/retweeted)
      const tweetsQuery = query(
        collection(db, 'tweets'),
        orderBy('likes', 'desc'),
        limit(5)
      );
      const tweetsDocs = await getDocs(tweetsQuery);
      const tweetsData = tweetsDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTrendingTweets(tweetsData);

      // Mock trending hashtags for now
      setTrendingHashtags([
        { tag: 'JavaScript', count: 1234 },
        { tag: 'React', count: 987 },
        { tag: 'TypeScript', count: 856 },
        { tag: 'WebDev', count: 743 },
        { tag: 'Coding', count: 652 },
      ]);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      // Search tweets
      const tweetsQuery = query(
        collection(db, 'tweets'),
        where('text', '>=', searchQuery),
        where('text', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );
      const tweetsDocs = await getDocs(tweetsQuery);
      const tweetsData = tweetsDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Search users
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '>=', searchQuery),
        where('username', '<=', searchQuery + '\uf8ff'),
        limit(5)
      );
      const usersDocs = await getDocs(usersQuery);
      const usersData = usersDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSearchResults([...tweetsData, ...usersData]);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Explore" />
      <Container maxWidth="md">
        <Box sx={{ width: '100%', typography: 'body1' }}>
          <Paper sx={{ mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search Twitter"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ p: 2 }}
            />
          </Paper>

          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              variant="fullWidth"
            >
              <Tab icon={<TrendingUp />} label="Trending" />
              <Tab icon={<Tag />} label="Hashtags" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {searchQuery ? (
                <Box>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    searchResults.map((result) => (
                      result.text ? (
                        <Tweet key={result.id} tweet={result} />
                      ) : (
                        <ListItem key={result.id} button>
                          <ListItemAvatar>
                            <Avatar src={result.photoURL} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={result.displayName}
                            secondary={`@${result.username}`}
                          />
                        </ListItem>
                      )
                    ))
                  )}
                </Box>
              ) : (
                <List>
                  {trendingTweets.map((tweet) => (
                    <Tweet key={tweet.id} tweet={tweet} />
                  ))}
                </List>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <List>
                {trendingHashtags.map((hashtag, index) => (
                  <ListItem key={index} button>
                    <ListItemText
                      primary={`#${hashtag.tag}`}
                      secondary={`${hashtag.count.toLocaleString()} tweets`}
                    />
                  </ListItem>
                ))}
              </List>
            </TabPanel>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Explore;
