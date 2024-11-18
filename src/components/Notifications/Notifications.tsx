import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Paper,
  IconButton,
  Badge,
  Divider,
} from '@mui/material';
import {
  Favorite,
  Repeat,
  PersonAdd,
  Comment,
  NotificationsNone,
} from '@mui/icons-material';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'like' | 'retweet' | 'follow' | 'reply';
  fromUser: {
    id: string;
    username: string;
    displayName: string;
    photoURL: string;
  };
  tweetId?: string;
  timestamp: any;
  read: boolean;
}

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'like':
      return <Favorite sx={{ color: 'error.main' }} />;
    case 'retweet':
      return <Repeat sx={{ color: 'success.main' }} />;
    case 'follow':
      return <PersonAdd sx={{ color: 'primary.main' }} />;
    case 'reply':
      return <Comment sx={{ color: 'info.main' }} />;
    default:
      return <NotificationsNone />;
  }
};

const getNotificationText = (type: string, username: string) => {
  switch (type) {
    case 'like':
      return `${username} liked your Tweet`;
    case 'retweet':
      return `${username} Retweeted your Tweet`;
    case 'follow':
      return `${username} followed you`;
    case 'reply':
      return `${username} replied to your Tweet`;
    default:
      return '';
  }
};

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('toUserId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'follow') {
      navigate(`/profile/${notification.fromUser.id}`);
    } else if (notification.tweetId) {
      navigate(`/tweet/${notification.tweetId}`);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Notifications
          </Typography>
          <Badge badgeContent={unreadCount} color="primary">
            <NotificationsNone />
          </Badge>
        </Box>
        <Divider />
        <List>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={notification.fromUser.photoURL}>
                      <NotificationIcon type={notification.type} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={getNotificationText(
                      notification.type,
                      notification.fromUser.username
                    )}
                    secondary={moment(notification.timestamp?.toDate()).fromNow()}
                  />
                  <IconButton size="small">
                    <NotificationIcon type={notification.type} />
                  </IconButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsNone sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                When someone interacts with you or your Tweets, you'll see it here
              </Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Container>
  );
};

export default Notifications;
