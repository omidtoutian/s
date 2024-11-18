import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  IconButton,
} from '@mui/material';
import {
  Home,
  Tag,
  NotificationsNone,
  MailOutline,
  BookmarkBorder,
  ListAlt,
  PermIdentity,
  MoreHoriz,
  Add,
} from '@mui/icons-material';

const Sidebar = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const sidebarItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Explore', icon: <Tag />, path: '/explore' },
    { text: 'Notifications', icon: <NotificationsNone />, path: '/notifications' },
    { text: 'Messages', icon: <MailOutline />, path: '/messages' },
    { text: 'Bookmarks', icon: <BookmarkBorder />, path: '/bookmarks' },
    { text: 'Lists', icon: <ListAlt />, path: '/lists' },
    { text: 'Profile', icon: <PermIdentity />, path: `/profile/${user?.uid}` },
    { text: 'More', icon: <MoreHoriz />, path: '/more' },
  ];

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box sx={{ height: '100%', borderRight: 1, borderColor: 'divider' }}>
      {/* Logo */}
      <Box sx={{ p: 2 }}>
        <IconButton color="primary" size="large">
          <svg
            viewBox="0 0 24 24"
            width="30"
            height="30"
            fill="currentColor"
          >
            <g>
              <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path>
            </g>
          </svg>
        </IconButton>
      </Box>

      {/* Navigation Items */}
      <List>
        {sidebarItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 'full',
              '&:hover': {
                backgroundColor: 'rgba(29, 161, 242, 0.1)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>

      {/* Tweet Button */}
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<Add />}
          sx={{
            borderRadius: '9999px',
            textTransform: 'none',
            py: 1.5,
          }}
          onClick={() => navigate('/compose/tweet')}
        >
          Tweet
        </Button>
      </Box>

      {/* Sign Out */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={handleSignOut}
          sx={{
            borderRadius: '9999px',
            textTransform: 'none',
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;
