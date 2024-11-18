import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Fab,
} from '@mui/material';
import {
  Home,
  Search,
  NotificationsNone,
  MailOutline,
  Add as AddIcon,
} from '@mui/icons-material';

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = React.useState(0);

  // Map paths to navigation indices
  const pathToIndex: { [key: string]: number } = {
    '/': 0,
    '/explore': 1,
    '/notifications': 2,
    '/messages': 3,
  };

  React.useEffect(() => {
    // Update the selected value based on current path
    setValue(pathToIndex[location.pathname] || 0);
  }, [location]);

  return (
    <Box sx={{ pb: 7 }}>
      {/* Floating Action Button for new tweet */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 75,
          right: 16,
          zIndex: 1000,
        }}
        onClick={() => navigate('/compose/tweet')}
      >
        <AddIcon />
      </Fab>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
        elevation={3}
      >
        <BottomNavigation
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
            switch (newValue) {
              case 0:
                navigate('/');
                break;
              case 1:
                navigate('/explore');
                break;
              case 2:
                navigate('/notifications');
                break;
              case 3:
                navigate('/messages');
                break;
              default:
                break;
            }
          }}
          showLabels
        >
          <BottomNavigationAction label="Home" icon={<Home />} />
          <BottomNavigationAction label="Explore" icon={<Search />} />
          <BottomNavigationAction
            label="Notifications"
            icon={<NotificationsNone />}
          />
          <BottomNavigationAction label="Messages" icon={<MailOutline />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default MobileNav;
