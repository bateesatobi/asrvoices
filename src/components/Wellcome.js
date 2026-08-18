import React, { useState } from 'react';
import { Box, Typography, Button, Alert, Container } from '@mui/material';
import { GraphicEq } from '@mui/icons-material';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { provisionUserAccount, clearStaleAuthSession } from '../utils/provisionUser';
import { getFriendlyErrorMessage } from '../utils/errors';
import {
  M_AC, M_GRADIENT, M_BLACK, M_BORDER, M_SURFACE, M_TEXT_MUTED, mBtnSecondary,
} from './marketing/marketingTokens';

const Welcome = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await clearStaleAuthSession();
      const result = await signInWithPopup(auth, provider);
      await provisionUserAccount(result.user, { notify: true });
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Sign-in failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 6, md: 10 },
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            bgcolor: M_SURFACE,
            border: `1px solid ${M_BORDER}`,
            borderRadius: '20px',
            p: { xs: 4, md: 5 },
            boxShadow: '0 16px 48px rgba(17, 17, 17, 0.06)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: '12px', background: M_GRADIENT,
              display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
            }}>
              <GraphicEq sx={{ color: M_BLACK, fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: M_BLACK, letterSpacing: '-0.02em' }}>
              Sign in to A·VOICES
            </Typography>
            <Typography sx={{ color: M_TEXT_MUTED, fontSize: '0.9rem', mt: 0.75, textAlign: 'center' }}>
              Your voice AI workspace — transcribe, translate, and build.
            </Typography>
            <Typography sx={{ color: M_AC, fontSize: '0.82rem', mt: 1, fontWeight: 600, textAlign: 'center' }}>
              New accounts receive 100 free starter credits — no card required.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '10px', fontSize: '0.85rem' }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            startIcon={!isLoading && (
              <Box component="svg" viewBox="0 0 24 24" sx={{ width: 18, height: 18 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </Box>
            )}
            sx={{
              bgcolor: 'rgba(17, 17, 17, 0.03)',
              border: `1px solid ${M_BORDER}`,
              color: M_BLACK,
              fontWeight: 600,
              py: 1.5,
              borderRadius: '12px',
              mb: 2,
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(17, 17, 17, 0.05)', borderColor: 'rgba(232, 160, 32, 0.25)' },
            }}
          >
            {isLoading ? 'Signing in…' : 'Continue with Google'}
          </Button>

          <Button fullWidth component={Link} to="/" variant="outlined" sx={{ ...mBtnSecondary, py: 1.35 }}>
            Explore without signing in
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, flexWrap: 'wrap' }}>
            {['Secure sign-in', '50+ languages', '100 starter credits'].map(text => (
              <Typography key={text} sx={{ color: M_TEXT_MUTED, fontSize: '0.72rem', fontWeight: 600 }}>
                {text}
              </Typography>
            ))}
          </Box>

          <Typography sx={{ color: M_TEXT_MUTED, fontSize: '0.72rem', textAlign: 'center', mt: 3, lineHeight: 1.6 }}>
            By continuing you agree to our Terms and Privacy Policy.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Welcome;
