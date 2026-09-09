import React, { useState } from 'react';
import { Button, Typography, Box, CircularProgress, Alert, Container, CssBaseline, Snackbar } from '@mui/material';
import { BASE_URL, getCurrentUser } from '../services/api';
import axios from 'axios';

const PesapalCheckoutForm = ({ amount, tier, tierId, userId, onClose }) => {
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const paymentServerUrl = `${BASE_URL}/create-checkout-session`;

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setErrorMessage(null);

    try {
      const current = getCurrentUser();
      const resolvedUserId = userId || current.userId || current.uid;
      if (!resolvedUserId) {
        throw new Error('Please sign in to buy credits.');
      }
      const formData = new FormData();
      formData.append('tier_id', tierId);
      formData.append('price', amount);
      formData.append('tier', tier);
      formData.append('user_id', resolvedUserId);

      const headers = { 'Content-Type': 'multipart/form-data', 'user-id': resolvedUserId };
      const token = localStorage.getItem('idToken') || localStorage.getItem('token');
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await axios.post(paymentServerUrl, formData, { headers });

      if (response.status !== 200) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const { redirect_url } = response.data;

      if (!redirect_url) {
        throw new Error('No redirect URL received from the server');
      }

      // Redirect the user to the Pesapal Checkout Page
      window.location.href = redirect_url;
      
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      setSnackbarMessage('Payment initialization failed. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingBottom: 4
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          Complete Your Payment
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          You will be securely redirected to Pesapal to complete your payment using Mobile Money or Card.
        </Typography>
        
        <Typography variant="h6" sx={{ mb: 3 }}>
          Amount: ${amount}
        </Typography>
        
        <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: 1 }}>
          <Box sx={{ position: 'relative', mt: 2 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ padding: '12px', fontSize: '1.1rem' }}
            >
              {loading ? 'Initializing...' : 'Proceed to Pesapal'}
            </Button>
            {loading && (
              <CircularProgress
                size={24}
                sx={{
                  color: 'primary.main',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            )}
          </Box>
          {errorMessage && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          )}
        </form>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default PesapalCheckoutForm;
