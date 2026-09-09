import React from 'react';
import { Box, Typography, Grid, Container, Button, Chip } from '@mui/material';
import { Link } from 'react-router-dom';
import { keyframes } from '@mui/material/styles';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {
  Translate, Mic, RecordVoiceOver, GraphicEq,
  ArrowForward, CheckCircle, Code, Terminal,
} from '@mui/icons-material';

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const pulseGlow = keyframes`
  0%,100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
`;

const G = 'linear-gradient(135deg, #f59e0b, #d97706)';
const GOLD = '#f59e0b';

// ── Kente pattern ─────────────────────────────────────────────────────────────
function KentePattern() {
  return (
    <Box component="svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
      sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.045, pointerEvents: 'none' }}
    >
      <defs>
        <pattern id="kente-a" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#f59e0b" strokeWidth="1.2" />
          <polygon points="20,9 31,20 20,31 9,20" fill="none" stroke="#f59e0b" strokeWidth="0.7" />
          <line x1="0" y1="20" x2="40" y2="20" stroke="#d97706" strokeWidth="0.4" />
          <line x1="20" y1="0" x2="20" y2="40" stroke="#d97706" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#kente-a)" />
    </Box>
  );
}

// ── Code snippet ──────────────────────────────────────────────────────────────
const CODE_SNIPPET = `import avoices from '@avoices/sdk';

const client = new avoices.Client({
  apiKey: process.env.AVOICES_API_KEY,
});

// Transcribe audio in Luganda
const result = await client.transcribe({
  audioUrl: 'https://example.com/speech.mp3',
  language: 'lg',          // Luganda
  targetLanguage: 'en',    // translate to English
  diarize: true,           // speaker detection
});

console.log(result.transcript);
// "Oli otya?" → "How are you?"
console.log(result.confidence);  // 0.994`;

// ── API feature cards ─────────────────────────────────────────────────────────
const API_FEATURES = [
  {
    icon: <Mic sx={{ fontSize: 28 }} />,
    title: 'Speech Recognition',
    endpoint: 'POST /v1/transcribe',
    desc: 'Convert audio to text in 50+ languages. Supports file upload, URL, or real-time streaming.',
    color: '#f59e0b',
    tags: ['REST', 'WebSocket', 'Batch'],
  },
  {
    icon: <Translate sx={{ fontSize: 28 }} />,
    title: 'Translation',
    endpoint: 'POST /v1/translate',
    desc: 'Translate text between any supported language pair — with cultural context preservation.',
    color: '#d97706',
    tags: ['REST', 'Streaming'],
  },
  {
    icon: <RecordVoiceOver sx={{ fontSize: 28 }} />,
    title: 'Text to Speech (Stream)',
    endpoint: 'POST /v1/audio/speech/stream',
    desc: 'Convert text to natural speech with African voice models. Ultra-low latency streaming.',
    color: '#10b981',
    tags: ['REST', 'MP3', 'WAV', 'Streaming'],
  },
  {
    icon: <GraphicEq sx={{ fontSize: 28 }} />,
    title: 'Voice to Voice',
    endpoint: 'POST /v1/voice-translate',
    desc: 'Translate spoken audio to another language while preserving the speaker\'s voice characteristics.',
    color: GOLD,
    tags: ['REST', 'Real-time'],
  },
];

// ── Pricing tiers ─────────────────────────────────────────────────────────────
const API_PLANS = [
  {
    title: 'Starter credits',
    price: '$5',
    desc: '100 credits for API and studio jobs.',
    features: ['100 credits (~$0.05 each)', 'Metered API keys (av_live_)', 'Credits never expire', 'Refunds on failed jobs'],
    popular: false,
    cta: 'Buy credits',
  },
  {
    title: 'Studio credits',
    price: '$15',
    desc: 'Best for weekly production volume.',
    features: ['350 credits (bonus pack)', 'All endpoints', 'Metered or unlimited keys', '50+ languages'],
    popular: true,
    cta: 'Buy credits',
  },
  {
    title: 'Enterprise',
    price: 'Custom',
    desc: 'Invoice billing and dedicated wallets.',
    features: ['Custom credit volume', 'Unlimited API keys', 'SLA & volume rates', 'Dedicated support'],
    popular: false,
    cta: 'Contact Sales',
  },
];

export default function ApiComponent() {
  return (
    <Box sx={{ background: 'transparent', minHeight: '100vh' }}>

      {/* ── Hero ──────────────────────────────────────── */}
      <Box sx={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(17, 17, 17, 0.05)' }}>
        <KentePattern />
        <Box sx={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(245,158,11,0.1) 0%, transparent 70%)', animation: `${pulseGlow} 7s ease-in-out infinite`, pointerEvents: 'none' }} />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: { xs: 12, md: 18 }, textAlign: 'center' }}>
          <Box sx={{ animation: `${slideUp} 0.6s ease both` }}>
            <Chip label="Developer API" size="small" sx={{
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              color: '#f59e0b', fontWeight: 700, borderRadius: '50px', mb: 3,
              '& .MuiChip-label': { px: 2 },
            }} />
            <Typography sx={{
              color: '#111111', fontWeight: 800, fontSize: { xs: '2.8rem', md: '4.2rem' },
              letterSpacing: '-0.03em', lineHeight: 1.1, mb: 2.5, maxWidth: 800, mx: 'auto',
            }}>
              Build with{' '}
              <Box component="span" sx={{ background: G, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                A-Voices API
              </Box>
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: { xs: '1.05rem', md: '1.25rem' }, mb: 5, maxWidth: 600, mx: 'auto', lineHeight: 1.7 }}>
              One API. Every African language. Production-ready in under an hour.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button component={Link} to="/dashboard/api-keys" variant="contained" endIcon={<ArrowForward />}
                sx={{ background: G, color: '#111111', fontWeight: 700, px: 3.5, py: 1.5, borderRadius: '50px', boxShadow: '0 6px 28px rgba(245,158,11,0.45)', fontSize: '1rem', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 36px rgba(245,158,11,0.6)' } }}>
                Get API Key
              </Button>
              <Button component={Link} to="/documentation" variant="outlined"
                sx={{ borderColor: 'rgba(17, 17, 17,0.15)', color: 'rgba(17, 17, 17, 0.8)', fontWeight: 700, px: 3.5, py: 1.5, borderRadius: '50px', fontSize: '1rem', '&:hover': { borderColor: '#f59e0b', color: '#fbbf24', background: 'rgba(245,158,11,0.08)' } }}>
                Read the Docs
              </Button>
            </Box>
          </Box>

          {/* Floating badges */}
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap', mt: 5, animation: `${slideUp} 0.6s ease 0.15s both` }}>
            {['99.9% uptime SLA', 'Global CDN', 'GDPR compliant', '< 300ms latency'].map(t => (
              <Chip key={t} label={t} size="small" sx={{
                background: 'rgba(17, 17, 17,0.04)', border: '1px solid rgba(17, 17, 17, 0.08)',
                color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem', borderRadius: '50px',
                '& .MuiChip-label': { px: 2 },
              }} />
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Code example ─────────────────────────────── */}
      <Box sx={{ py: { xs: 10, md: 14 }, borderBottom: '1px solid rgba(17, 17, 17, 0.05)' }}>
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 6, md: 10 }} alignItems="center">
            <Grid item xs={12} md={5} sx={{ animation: `${slideUp} 0.6s ease 0.1s both` }}>
              <Chip label="Quick Start" size="small" sx={{ background: `rgba(245,158,11,0.12)`, border: `1px solid rgba(245,158,11,0.3)`, color: GOLD, fontWeight: 700, borderRadius: '50px', mb: 2.5, '& .MuiChip-label': { px: 2 } }} />
              <Typography sx={{ color: '#111111', fontWeight: 800, fontSize: { xs: '2rem', md: '2.6rem' }, letterSpacing: '-0.02em', lineHeight: 1.15, mb: 2.5 }}>
                Integrate in{' '}
                <Box component="span" sx={{ background: G, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  minutes
                </Box>
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.75, mb: 4 }}>
                Our SDK handles authentication, retries, and streaming — so you ship faster.
                Available for JavaScript, Python, Go, and Ruby.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {['Simple REST endpoints', 'Official SDKs for JS & Python', 'Real-time WebSocket support', 'Interactive API explorer'].map(t => (
                  <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircle sx={{ fontSize: 18, color: '#f59e0b', flexShrink: 0 }} />
                    <Typography sx={{ color: '#cbd5e1', fontSize: '0.95rem', fontWeight: 500 }}>{t}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={7} sx={{ animation: `${slideUp} 0.6s ease 0.2s both` }}>
              <Box sx={{
                borderRadius: '20px', overflow: 'hidden',
                border: '1px solid rgba(17, 17, 17, 0.08)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              }}>
                {/* title bar */}
                <Box sx={{ background: 'transparent', px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid rgba(17, 17, 17,0.06)' }}>
                  <Box sx={{ display: 'flex', gap: 0.75 }}>
                    {['#ef4444', '#f59e0b', '#10b981'].map(c => <Box key={c} sx={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Terminal sx={{ fontSize: 14, color: '#475569' }} />
                    <Typography sx={{ color: '#475569', fontSize: '0.78rem', fontWeight: 600 }}>transcribe.js</Typography>
                  </Box>
                </Box>
                <Box sx={{ fontSize: '0.85rem', '& pre': { margin: '0 !important', padding: '24px !important', background: '#0d0d1f !important', borderRadius: '0 !important' } }}>
                  <SyntaxHighlighter language="javascript" style={atomOneDark} customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.85rem' }}>
                    {CODE_SNIPPET}
                  </SyntaxHighlighter>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── API endpoints ─────────────────────────────── */}
      <Box sx={{ py: { xs: 10, md: 14 }, borderBottom: '1px solid rgba(17, 17, 17, 0.05)' }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 8, animation: `${slideUp} 0.6s ease both` }}>
            <Typography sx={{ color: '#111111', fontWeight: 800, fontSize: { xs: '2rem', md: '2.8rem' }, letterSpacing: '-0.02em', mb: 2 }}>
              Powerful endpoints
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '1.05rem', maxWidth: 520, mx: 'auto' }}>
              Everything you need to build world-class voice applications for African and global markets.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {API_FEATURES.map((f, i) => (
              <Grid item xs={12} sm={6} key={f.title}>
                <Box sx={{
                  background: 'rgba(17, 17, 17,0.03)', border: '1px solid rgba(17, 17, 17,0.07)',
                  borderRadius: '20px', p: 3.5,
                  transition: 'all 0.3s ease',
                  animation: `${slideUp} 0.6s ease ${i * 0.1 + 0.1}s both`,
                  '&:hover': { background: `rgba(${f.color === '#f59e0b' ? '245,158,11' : f.color === '#d97706' ? '217,119,6' : f.color === '#10b981' ? '16,185,129' : '245,158,11'},0.05)`, border: `1px solid ${f.color}25`, transform: 'translateY(-3px)' },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '13px', background: `${f.color}18`, border: `1px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color }}>
                      {f.icon}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {f.tags.map(t => (
                        <Chip key={t} label={t} size="small" sx={{ background: 'rgba(17, 17, 17, 0.05)', color: '#64748b', fontSize: '0.68rem', fontWeight: 600, borderRadius: '4px', '& .MuiChip-label': { px: 1 } }} />
                      ))}
                    </Box>
                  </Box>
                  <Typography sx={{ color: '#111111', fontWeight: 700, fontSize: '1.05rem', mb: 0.75 }}>{f.title}</Typography>
                  <Box sx={{ display: 'inline-block', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '6px', px: 1.5, py: 0.4, mb: 1.5 }}>
                    <Typography sx={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>{f.endpoint}</Typography>
                  </Box>
                  <Typography sx={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.65 }}>{f.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── API Pricing ───────────────────────────────── */}
      <Box sx={{ py: { xs: 10, md: 14 }, borderBottom: '1px solid rgba(17, 17, 17, 0.05)' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8, animation: `${slideUp} 0.6s ease both` }}>
            <Typography sx={{ color: '#111111', fontWeight: 800, fontSize: { xs: '2rem', md: '2.6rem' }, letterSpacing: '-0.02em', mb: 2 }}>
              API Pricing
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '1rem', maxWidth: 480, mx: 'auto' }}>
              Transparent, usage-based pricing. Pay only for what you use.
            </Typography>
          </Box>
          <Grid container spacing={3} justifyContent="center" alignItems="stretch">
            {API_PLANS.map((plan, i) => (
              <Grid item xs={12} sm={10} md={4} key={plan.title}>
                <Box sx={{
                  background: plan.popular ? 'rgba(245,158,11,0.08)' : 'rgba(17, 17, 17,0.03)',
                  border: plan.popular ? '1.5px solid rgba(245,158,11,0.45)' : '1px solid rgba(17, 17, 17,0.07)',
                  borderRadius: '24px', p: 4, height: '100%', display: 'flex', flexDirection: 'column',
                  position: 'relative',
                  boxShadow: plan.popular ? '0 24px 60px rgba(245,158,11,0.18)' : 'none',
                  animation: `${slideUp} 0.6s ease ${i * 0.1 + 0.15}s both`,
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}>
                  {plan.popular && (
                    <Chip label="Most Popular" size="small" sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: G, color: '#111111', fontWeight: 700, fontSize: '0.76rem', borderRadius: '50px', '& .MuiChip-label': { px: 2 } }} />
                  )}
                  <Typography sx={{ color: plan.popular ? '#fbbf24' : '#f59e0b', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>{plan.title}</Typography>
                  <Typography sx={{ color: '#111111', fontWeight: 800, fontSize: '2.6rem', letterSpacing: '-0.03em', lineHeight: 1, mb: 1 }}>{plan.price}</Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.9rem', mb: 3, lineHeight: 1.6 }}>{plan.desc}</Typography>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.2, mb: 3 }}>
                    {plan.features.map(f => (
                      <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CheckCircle sx={{ fontSize: 15, color: plan.popular ? '#fbbf24' : '#f59e0b', flexShrink: 0 }} />
                        <Typography sx={{ color: '#cbd5e1', fontSize: '0.88rem', fontWeight: 500 }}>{f}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Button
                    fullWidth
                    component={plan.cta === 'Contact Sales' ? 'a' : Link}
                    href={plan.cta === 'Contact Sales' ? 'mailto:phosaico@gmail.com?subject=Enterprise%20credits' : undefined}
                    to={plan.cta === 'Contact Sales' ? undefined : '/dashboard/subscription'}
                    variant={plan.popular ? 'contained' : 'outlined'}
                    endIcon={<ArrowForward />}
                    sx={{
                      py: 1.4, borderRadius: '50px', fontWeight: 700, fontSize: '0.9rem',
                      ...(plan.popular
                        ? { background: G, color: '#111111', boxShadow: '0 4px 20px rgba(245,158,11,0.3)', '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 8px 28px rgba(245,158,11,0.45)' } }
                        : { borderColor: 'rgba(17, 17, 17, 0.1)', color: 'rgba(17, 17, 17, 0.7)', '&:hover': { borderColor: '#f59e0b', color: '#fbbf24', background: 'rgba(245,158,11,0.06)' } }
                      ),
                    }}
                  >
                    {plan.cta}
                  </Button>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Final CTA ─────────────────────────────────── */}
      <Box sx={{ py: { xs: 10, md: 14 } }}>
        <Container maxWidth="md">
          <Box sx={{
            textAlign: 'center', position: 'relative', overflow: 'hidden',
            background: 'rgba(17, 17, 17,0.02)', border: '1px solid rgba(17, 17, 17,0.06)',
            borderRadius: '28px', p: { xs: 6, md: 8 },
          }}>
            <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <Box sx={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}60, transparent)` }} />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
                🌍 Ready to build?
              </Typography>
              <Typography sx={{ color: '#111111', fontWeight: 800, fontSize: { xs: '2rem', md: '2.8rem' }, letterSpacing: '-0.02em', mb: 2 }}>
                Start with a free API key
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '1.05rem', mb: 5, maxWidth: 460, mx: 'auto' }}>
                1,000 free API calls per month. No credit card. No time limit. Just build.
              </Typography>
              <Button component={Link} to="/get-started" variant="contained" size="large" endIcon={<ArrowForward />}
                sx={{ background: G, color: '#111111', fontWeight: 700, px: 4, py: 1.6, borderRadius: '50px', fontSize: '1rem', boxShadow: '0 8px 32px rgba(245,158,11,0.4)', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(245,158,11,0.55)' } }}>
                Get Your Free API Key
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
