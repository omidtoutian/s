import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ArrowBack, CalendarToday, LocationOn } from '@mui/icons-material';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import Tweet from '../Feed/Tweet';
import moment from 'moment';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!userId) return;

    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setProfile({ id: userDoc.id, ...userDoc.data() });
          setIsFollowing(userDoc.data().followers?.includes(currentUser?.uid));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
      setLoading(false);
    };

    // Subscribe to user's tweets
    const tweetsQuery = query(
      collection(db, 'tweets'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(tweetsQuery, (snapshot) => {
      const tweetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTweets(tweetsData);
    });

    fetchProfile();
    return () => unsubscribe();
  }, [userId, currentUser?.uid]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;

    try {
      const userRef = doc(db, 'users', userId);
      const currentUserRef = doc(db, 'users', currentUser.uid);

      if (isFollowing) {
        await updateDoc(userRef, {
          followers: arrayRemove(currentUser.uid)
        });
        await updateDoc(currentUserRef, {
          following: arrayRemove(userId)
        });
      } else {
        await updateDoc(userRef, {
          followers: arrayUnion(currentUser.uid)
        });
        await updateDoc(currentUserRef, {
          following: arrayUnion(userId)
        });
      }

      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Container>
        <Typography variant="h6">User not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ pb: 4 }}>
        <Box sx={{ position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
            <IconButton onClick={() => navigate(-1)}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ ml: 2 }}>
              <Typography variant="h6">{profile.displayName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {tweets.length} Tweets
              </Typography>
            </Box>
          </Box>
        </Box>

        <Paper elevation={0}>
          <Box sx={{ height: 200, bgcolor: 'grey.200' }}>
            {profile.headerImage && (
              <img
                src={profile.headerImage}
                alt="Profile header"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </Box>

          <Box sx={{ px: 2, pb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: -5 }}>
              <Avatar
                src={profile.photoURL}
                sx={{
                  width: 120,
                  height: 120,
                  border: 4,
                  borderColor: 'background.paper'
                }}
              />
              {currentUser?.uid !== userId && (
                <Button
                  variant={isFollowing ? 'outlined' : 'contained'}
                  onClick={handleFollow}
                  sx={{ mt: 2 }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">{profile.displayName}</Typography>
              <Typography variant="body2" color="text.secondary">
                @{profile.username}
              </Typography>
              
              {profile.bio && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {profile.bio}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 2, color: 'text.secondary' }}>
                {profile.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn fontSize="small" />
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      {profile.location}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarToday fontSize="small" />
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    Joined {moment(profile.createdAt?.toDate()).format('MMMM YYYY')}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                <Typography variant="body2">
                  <strong>{profile.following?.length || 0}</strong>
                  {' '}
                  <Typography component="span" color="text.secondary">Following</Typography>
                </Typography>
                <Typography variant="body2">
                  <strong>{profile.followers?.length || 0}</strong>
                  {' '}
                  <Typography component="span" color="text.secondary">Followers</Typography>
                </Typography>
              </Box>
            </Box>
          </Box>

          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="fullWidth"
          >
            <Tab label="Tweets" />
            <Tab label="Tweets & Replies" />
            <Tab label="Media" />
            <Tab label="Likes" />
          </Tabs>
        </Paper>

        <TabPanel value={tabValue} index={0}>
          {tweets.map((tweet) => (
            <Tweet key={tweet.id} tweet={tweet} />
          ))}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* TODO: Implement Tweets & Replies tab */}
          <Typography color="text.secondary">Coming soon...</Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* TODO: Implement Media tab */}
          <Typography color="text.secondary">Coming soon...</Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* TODO: Implement Likes tab */}
          <Typography color="text.secondary">Coming soon...</Typography>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default Profile;
