import React from 'react';
import { Box, Container, Grid, useTheme, useMediaQuery } from '@mui/material';
import { useLocation } from 'react-router-dom';
import Sidebar from '../Layout/Sidebar';
import Feed from '../Feed/Feed';
import Widgets from '../Widgets/Widgets';
import MobileNav from '../Layout/MobileNav';
import Messages from '../Messages/Messages';

const Home = () => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMessagesRoute = location.pathname === '/messages';

  return (
    <Box 
      sx={{ 
        flexGrow: 1, 
        height: '100vh', 
        overflow: 'hidden',
        bgcolor: 'background.default',
        color: 'text.primary'
      }}
    >
      <Container 
        maxWidth="lg" 
        sx={{ 
          height: '100%',
          p: isMobile ? 0 : 2,
          overflow: 'hidden'
        }}
      >
        <Grid 
          container 
          spacing={2}
          sx={{ 
            height: '100%',
            position: 'relative',
            pt: isMobile ? 0 : undefined
          }}
        >
          {/* Sidebar - Hidden on mobile */}
          <Grid 
            item 
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              position: { sm: 'sticky' },
              top: 0,
              height: '100vh',
              overflowY: 'auto',
              bgcolor: 'background.paper'
            }} 
            sm={3}
          >
            <Sidebar />
          </Grid>

          {/* Main Content Area */}
          <Grid 
            item 
            xs={12} 
            sm={isMessagesRoute ? 9 : 6}
            sx={{
              height: '100vh',
              overflowY: 'auto',
              pb: isMobile ? 7 : 0, // Space for mobile navigation
              borderLeft: { sm: 1 },
              borderRight: { sm: 1 },
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            {isMessagesRoute ? <Messages /> : <Feed />}
          </Grid>

          {/* Widgets - Hidden on mobile and messages route */}
          {!isMessagesRoute && (
            <Grid 
              item 
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                position: { sm: 'sticky' },
                top: 0,
                height: '100vh',
                overflowY: 'auto',
                bgcolor: 'background.paper'
              }} 
              sm={3}
            >
              <Widgets />
            </Grid>
          )}
        </Grid>
      </Container>

      {/* Mobile Navigation */}
      {isMobile && (
        <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, bgcolor: 'background.paper' }}>
          <MobileNav />
        </Box>
      )}
    </Box>
  );
};

export default Home;
