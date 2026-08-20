import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Container, Grid, Stack, Chip } from '@mui/material';
import { Link } from 'react-router-dom';
import { keyframes } from '@mui/material/styles';
import { ArrowForward, PlayArrow } from '@mui/icons-material';
import {
  M_AC, M_BLACK, M_GRADIENT, M_BORDER, M_SURFACE, M_TEXT_MUTED,
  mBtnPrimary, mBtnSecondary,
} from './marketing/marketingTokens';
import { HOME_STORIES } from '../data/studioVisuals';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const waveBar = keyframes`
  0%,100% { transform: scaleY(0.35); }
  50%      { transform: scaleY(1); }
`;

function useCounter(target, duration = 1400) {
  const [count, setCount] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let v = 0;
        const step = parseFloat(target) / (duration / 16);
        const t = setInterval(() => {
          v += step;
          if (v >= parseFloat(target)) { setCount(parseFloat(target)); clearInterval(t); }
          else setCount(v);
        }, 16);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return [count, ref];
}

function Stat({ value, suffix, label, float }) {
  const [count, ref] = useCounter(parseFloat(value));
  const display = float ? count.toFixed(1) : Math.round(count).toLocaleString('en');
  return (
    <Box ref={ref} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: M_BLACK, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {display}{suffix}
      </Typography>
      <Typography sx={{ fontSize: '0.72rem', color: M_TEXT_MUTED, fontWeight: 600, mt: 0.5 }}>
        {label}
      </Typography>
    </Box>
  );
}

function WaveBars() {
  const bars = [0.4, 0.65, 1, 0.5, 0.85, 0.55, 0.9, 0.7];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px', height: 28 }}>
      {bars.map((h, i) => (
        <Box
          key={i}
          sx={{
            width: 3, borderRadius: 2, height: `${h * 24}px`,
            background: M_GRADIENT,
            animation: `${waveBar} ${0.7 + i * 0.07}s ease-in-out infinite`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </Box>
  );
}

function HeroProductCard() {
  return (
    <Box
      sx={{
        bgcolor: M_SURFACE,
        border: `1px solid ${M_BORDER}`,
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(17, 17, 17, 0.08)',
      }}
    >
      <Box sx={{ position: 'relative', height: 160, bgcolor: '#111' }}>
        <Box
          component="video"
          src={HOME_STORIES[2].video}
          poster={HOME_STORIES[0].image}
          muted
          loop
          playsInline
          autoPlay
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.45))' }} />
      </Box>
      <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${M_BORDER}`, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.6 }}>
          {['#E8A020', 'rgba(17,17,17,0.15)', 'rgba(17,17,17,0.15)'].map((c, i) => (
            <Box key={i} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c }} />
          ))}
        </Box>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: M_TEXT_MUTED, ml: 1 }}>
          Transcribe · Luganda
        </Typography>
        <Chip label="Live" size="small" sx={{ ml: 'auto', height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(16,185,129,0.1)', color: '#059669' }} />
      </Box>
      <Box sx={{ p: 3 }}>
        <WaveBars />
        <Box sx={{ mt: 3, p: 2, borderRadius: '12px', bgcolor: 'rgba(248, 246, 240, 0.8)', border: `1px solid ${M_BORDER}` }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: M_AC, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
            Transcript
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: M_BLACK, fontWeight: 500, lineHeight: 1.6 }}>
            "Oli otya?" → <Box component="span" sx={{ color: M_AC, fontWeight: 700 }}>How are you?</Box>
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {['Translate', 'Synthesize', 'Summarize'].map(t => (
            <Chip key={t} label={t} size="small" sx={{ fontWeight: 600, fontSize: '0.68rem', bgcolor: 'rgba(17,17,17,0.04)' }} />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

export default function EnhancedHeroSection() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        pt: { xs: 10, md: 11 },
        pb: { xs: 5, md: 7 },
        overflow: 'hidden',
      }}
    >
      <Box
        className="marketing-dot-grid"
        sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5 }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <Chip
              label="Voice AI platform"
              size="small"
              sx={{
                mb: 3,
                fontWeight: 700,
                fontSize: '0.72rem',
                bgcolor: 'rgba(232, 160, 32, 0.08)',
                color: M_AC,
                border: '1px solid rgba(232, 160, 32, 0.2)',
                borderRadius: '999px',
                animation: `${fadeUp} 0.5s ease both`,
              }}
            />

            <Typography
              component="h1"
              sx={{
                color: M_BLACK,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                fontSize: { xs: '2.5rem', sm: '3.25rem', md: '3.75rem' },
                mb: 2.5,
                animation: `${fadeUp} 0.55s ease 0.05s both`,
              }}
            >
              The most realistic voice AI for{' '}
              <Box
                component="span"
                sx={{
                  background: M_GRADIENT,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Africa & beyond
              </Box>
            </Typography>

            <Typography
              sx={{
                color: M_TEXT_MUTED,
                fontSize: { xs: '1.05rem', md: '1.125rem' },
                lineHeight: 1.75,
                maxWidth: 480,
                mb: 4,
                animation: `${fadeUp} 0.55s ease 0.1s both`,
              }}
            >
              Transcribe, translate, synthesize, and summarize in 50+ languages — including Luganda, Swahili, Amharic, and Yoruba.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ mb: 5, animation: `${fadeUp} 0.55s ease 0.15s both` }}
            >
              <Button
                component={Link}
                to="/get-started"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{ ...mBtnPrimary, px: 3.5, py: 1.35, fontSize: '0.95rem' }}
              >
                Start free
              </Button>
              <Button
                component={Link}
                to="/documentation"
                variant="outlined"
                size="large"
                startIcon={<PlayArrow sx={{ fontSize: 18 }} />}
                sx={{ ...mBtnSecondary, px: 3.5, py: 1.35, fontSize: '0.95rem' }}
              >
                View API docs
              </Button>
            </Stack>

            <Stack
              direction="row"
              spacing={{ xs: 3, md: 5 }}
              flexWrap="wrap"
              sx={{
                pt: 4,
                borderTop: `1px solid ${M_BORDER}`,
                animation: `${fadeUp} 0.55s ease 0.2s both`,
              }}
            >
              <Stat value={50} suffix="+" label="Languages" />
              <Stat value={99.5} suffix="%" label="Uptime" float />
              <Stat value={30} suffix="+" label="Countries" />
            </Stack>
          </Grid>

          <Grid item xs={12} md={6} sx={{ animation: `${fadeUp} 0.6s ease 0.12s both` }}>
            <HeroProductCard />
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 8, md: 10 }, textAlign: 'center', animation: `${fadeUp} 0.55s ease 0.25s both` }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: M_TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', mb: 2.5 }}>
            Trusted by teams across Africa
          </Typography>
          <Stack direction="row" justifyContent="center" alignItems="center" gap={{ xs: 2.5, md: 4 }} flexWrap="wrap">
            {['Safaricom', 'MTN', 'Airtel', 'UNHCR', 'Google', 'Microsoft'].map(n => (
              <Typography key={n} sx={{ color: 'rgba(17, 17, 17, 0.35)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '-0.01em' }}>
                {n}
              </Typography>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
