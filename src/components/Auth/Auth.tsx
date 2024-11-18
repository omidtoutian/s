  import React, { useState } from 'react';
  import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
  } from 'firebase/auth';
  import { doc, setDoc } from 'firebase/firestore';
  import { auth, db } from '../../firebase';
  import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Link,
    Alert,
  } from '@mui/material';

  const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });

    const getReadableErrorMessage = (errorCode: string) => {
      switch (errorCode) {
        case 'auth/email-already-in-use':
          return 'This email is already registered. Please sign in instead.';
        case 'auth/invalid-email':
          return 'Please enter a valid email address.';
        case 'auth/operation-not-allowed':
          return 'Email/Password sign in is not enabled. Please contact support.';
        case 'auth/weak-password':
          return 'Password should be at least 6 characters long.';
        case 'auth/user-disabled':
          return 'This account has been disabled. Please contact support.';
        case 'auth/user-not-found':
          return 'No account found with this email. Please sign up instead.';
        case 'auth/wrong-password':
          return 'Incorrect password. Please try again.';
        default:
          return 'An error occurred. Please try again.';
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      try {
        if (isSignUp) {
          if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
          }

          if (formData.password.length < 6) {
            setError('Password should be at least 6 characters long');
            return;
          }

          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
          );

          await updateProfile(userCredential.user, {
            displayName: formData.username,
          });

          // Create user document in Firestore
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            username: formData.username,
            email: formData.email,
            bio: '',
            website: '',
            location: '',
            profilePicture: '',
            headerImage: '',
            followers: [],
            following: [],
            createdAt: new Date().toISOString(),
          });
        } else {
          await signInWithEmailAndPassword(auth, formData.email, formData.password);
        }
      } catch (err: any) {
        console.error('Auth error:', err);
        setError(getReadableErrorMessage(err.code));
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={3}
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 3,
          }}
        >
          <Typography component="h1" variant="h5">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {isSignUp && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="username"
                label="Username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
              />
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
            {isSignUp && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
            <Link
              component="button"
              variant="body2"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setFormData({
                  username: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                });
              }}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </Link>
          </Box>
        </Paper>
      </Container>
    );
  };

  export default Auth;
