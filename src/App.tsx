import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import components
const Home = React.lazy(() => import('./components/Home/Home'));
const Auth = React.lazy(() => import('./components/Auth/Auth'));
const Profile = React.lazy(() => import('./components/Profile/Profile'));
const Explore = React.lazy(() => import('./components/Explore/Explore'));
const Messages = React.lazy(() => import('./components/Messages/Messages'));
const ComposeTweet = React.lazy(() => import('./components/Tweet/ComposeTweet'));
const TweetView = React.lazy(() => import('./components/Tweet/TweetView'));

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1DA1F2',
    },
    background: {
      default: '#000000',
      paper: '#15202B',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#000000',
          overscrollBehavior: 'none',
        },
      },
    },
  },
});

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <React.Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <Home /> : <Navigate to="/auth" />} />
            <Route path="/compose/tweet" element={user ? <ComposeTweet /> : <Navigate to="/auth" />} />
            <Route path="/profile/:id" element={user ? <Profile /> : <Navigate to="/auth" />} />
            <Route path="/explore" element={user ? <Explore /> : <Navigate to="/auth" />} />
            <Route path="/messages" element={user ? <Messages /> : <Navigate to="/auth" />} />
            <Route path="/compose" element={user ? <ComposeTweet /> : <Navigate to="/auth" />} />
            <Route path="/tweet/:tweetId" element={user ? <TweetView /> : <Navigate to="/auth" />} />
            <Route path="/profile/:userId" element={user ? <Profile /> : <Navigate to="/auth" />} />
          </Routes>
        </React.Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
