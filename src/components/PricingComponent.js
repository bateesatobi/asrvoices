import React from 'react';
import {
  Box, Typography, Grid, Container, Button, Chip,
  Accordion, AccordionSummary, AccordionDetails, Divider,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { keyframes } from '@mui/material/styles';
import {
  CheckCircle, Close, ExpandMore, ArrowForward,
  Diamond, Workspaces, WorkspacePremium, Lock,
  VerifiedUser, Bolt, ShieldOutlined,
} from '@mui/icons-material';
import { PLANS, PLAN_COLORS } from '../constants/plans';
import MarketingPageHeader from './marketing/MarketingPageHeader';
import {
  M_AC, M_AC_DARK, M_GRADIENT, M_BLACK, M_BORDER, M_SURFACE, M_TEXT_MUTED,
  mBtnPrimary, mCard,
} from './marketing/marketingTokens';
import { useAuth } from './AuthContext';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const G = M_GRADIENT;
const GOLD = M_AC;

const PLAN_ICONS = {
  'Starter':         <Lock sx={{ fontSize: 22 }} />,
  'Studio':          <WorkspacePremium sx={{ fontSize: 22 }} />,
  'Pro':             <Diamond sx={{ fontSize: 22 }} />,
  'Enterprise Plus': <Workspaces sx={{ fontSize: 22 }} />,
};

// ── Pricing card ─────────────────────────────────────────────────────────────
function PricingCard({ plan, isAnnual, index }) {
  const color = PLAN_COLORS[plan.title] || M_AC;
  const isCustom = plan.monthly === 'Custom';
  const isFree = plan.monthlyRaw === 0;
  const price = isAnnual ? plan.annual : plan.monthly;
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (plan.ctaPath?.startsWith('mailto:')) {
      window.open(plan.ctaPath, '_blank');
    } else if (plan.ctaPath) {
      // For paid plans, check if user is authenticated
      if (!isFree && !isAuthenticated) {
        // Redirect to get-started for non-logged-in users
        navigate('/get-started');
      } else {
        // For logged-in users or free plan, use React Router navigation
        navigate(plan.ctaPath);
      }
    }
  };

  return (
    <Box sx={{
      position: 'relative',
      bgcolor: M_SURFACE,
      border: plan.popular
        ? '1.5px solid rgba(232, 160, 32, 0.35)'
        : `1px solid ${M_BORDER}`,
      borderRadius: '16px',
      p: { xs: 3, md: 3.5 },
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      animation: `${fadeUp} 0.55s ease ${index * 0.09}s both`,
      boxShadow: plan.popular ? `0 0 0 1px ${color}25, 0 24px 64px ${color}18` : 'none',
      '&:hover': {
        transform: 'translateY(-6px)',
        borderColor: `${color}50`,
        boxShadow: `0 0 0 1px ${color}30, 0 32px 72px ${color}20`,
      },
    }}>
      {/* Popular badge */}
      {plan.popular && (
        <Box sx={{
          position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
          background: G, borderRadius: '50px', px: 2, py: 0.5,
          boxShadow: `0 4px 16px ${color}50`,
        }}>
          <Typography sx={{ color: '#111111', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            ⚡ Most Popular
          </Typography>
        </Box>
      )}

      {/* Header */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '14px',
            background: `${color}15`, border: `1px solid ${color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            {PLAN_ICONS[plan.title] || <Diamond sx={{ fontSize: 22 }} />}
          </Box>
          {/* Annual savings */}
          {isAnnual && plan.monthlyRaw > 0 && plan.annualRaw && (
            <Chip
              label={`Save ${Math.round((1 - plan.annualRaw / plan.monthlyRaw) * 100)}%`}
              size="small"
              sx={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 700, fontSize: '0.7rem', borderRadius: '50px' }}
            />
          )}
        </Box>

        <Typography sx={{ color, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.75 }}>
          {plan.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, mb: 1 }}>
          {isCustom ? (
            <Typography sx={{ color: GOLD, fontWeight: 800, fontSize: '2rem', lineHeight: 1 }}>Custom</Typography>
          ) : (
            <>
              <Typography sx={{ color: '#111111', fontWeight: 900, fontSize: '3rem', lineHeight: 1, letterSpacing: '-0.04em' }}>{price}</Typography>
              {!isFree && <Typography sx={{ color: '#475569', fontSize: '0.9rem', mb: 0.5 }}>one-time</Typography>}
            </>
          )}
        </Box>

        <Typography sx={{ color: '#64748b', fontSize: '0.87rem', lineHeight: 1.6 }}>
          {plan.description}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(17, 17, 17,0.06)', mb: 2.5 }} />

      {/* Features */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3.5 }}>
        {plan.features.map(({ label, included }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ flexShrink: 0 }}>
              {included
                ? <CheckCircle sx={{ fontSize: 16, color }} />
                : <Close sx={{ fontSize: 16, color: '#222222' }} />
              }
            </Box>
            <Typography sx={{ color: included ? M_TEXT_MUTED : 'rgba(17,17,17,0.25)', fontSize: '0.88rem', fontWeight: included ? 500 : 400 }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* CTA */}
      <Button
        fullWidth
        onClick={handleClick}
        component={!plan.ctaPath?.startsWith('mailto:') && plan.ctaPath ? Link : 'button'}
        to={!plan.ctaPath?.startsWith('mailto:') ? plan.ctaPath : undefined}
        variant={plan.popular ? 'contained' : 'outlined'}
        endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
        sx={{
          py: 1.5, borderRadius: '50px', fontWeight: 700, fontSize: '0.93rem', textTransform: 'none',
          ...(plan.popular ? {
            background: G, color: '#111111',
            boxShadow: `0 6px 24px ${color}40`,
            '&:hover': { transform: 'translateY(-1px)', boxShadow: `0 8px 32px ${color}55` },
          } : isCustom ? {
            background: `${GOLD}12`, color: GOLD, border: `1.5px solid ${GOLD}40`,
            '&:hover': { background: `${GOLD}22`, borderColor: GOLD },
          } : {
            background: `${color}10`, color, border: `1.5px solid ${color}35`,
            '&:hover': { background: `${color}20`, borderColor: color },
          }),
        }}
      >
        {plan.cta}
      </Button>
    </Box>
  );
}

// ── FAQ data ─────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Do credits expire?',
    a: 'No. Credit packs are one-time purchases. Unused credits stay in your wallet until you use them, and failed jobs are refunded automatically.',
  },
  {
    q: 'What languages are included?',
    a: 'Every pack includes the full library of 50+ languages including Luganda, Swahili, Amharic, Yoruba, English, French and more. Billing is by credits, not by language.',
  },
  {
    q: 'How do API keys work?',
    a: 'Create a metered key (av_live_…) in Studio to debit your wallet, or ask an admin for an unlimited key (av_unlim_…) for dedicated systems. Send it as X-API-Key or Authorization: Bearer.',
  },
  {
    q: 'How does Enterprise Plus pricing work?',
    a: 'Enterprise Plus is invoice-billed with custom credit volume, volume rates, and a dedicated wallet. Contact sales and we will quote for your organisation.',
  },
];

// ── Main export ───────────────────────────────────────────────────────────────
export default function PricingComponent() {
  return (
    <Box sx={{ bgcolor: 'transparent', pb: { xs: 5, md: 7 } }}>
      <MarketingPageHeader
        chip="Pricing"
        title="Start free."
        titleAccent="Pay as you go."
        subtitle="Pay as you go. Credits never expire. No monthly lock-in."
        pt={{ xs: 8, md: 9 }}
        pb={2.5}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={2.5} justifyContent="center" alignItems="stretch" sx={{ mb: 8 }}>
          {PLANS.map((plan, i) => (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <PricingCard plan={plan} isAnnual={false} index={i} />
            </Grid>
          ))}
        </Grid>

        {/* ── Trust strip ─────────────────────────────── */}
        <Box sx={{
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
          gap: { xs: 3, md: 6 }, mb: 8,
          py: 3.5, borderTop: `1px solid ${M_BORDER}`, borderBottom: `1px solid ${M_BORDER}`,
          animation: `${fadeUp} 0.5s ease 0.4s both`,
        }}>
          {[
            { icon: <ShieldOutlined sx={{ fontSize: 18, color: '#10b981' }} />, text: 'Secure Pesapal payments' },
            { icon: <VerifiedUser sx={{ fontSize: 18, color: M_AC }} />, text: 'SOC 2 compliant' },
            { icon: <Bolt sx={{ fontSize: 18, color: M_AC_DARK }} />, text: 'Credits added on payment' },
            { icon: <Lock sx={{ fontSize: 18, color: GOLD }} />, text: 'Credits never expire' },
          ].map(({ icon, text }) => (
            <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              {icon}
              <Typography sx={{ color: M_TEXT_MUTED, fontSize: '0.88rem', fontWeight: 600 }}>{text}</Typography>
            </Box>
          ))}
        </Box>

        {/* ── Enterprise callout ───────────────────────── */}
        <Box sx={{
          mb: 8, p: { xs: 4, md: 5 },
          bgcolor: M_SURFACE,
          border: `1px solid ${M_BORDER}`,
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3,
          animation: `${fadeUp} 0.5s ease 0.45s both`,
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Workspaces sx={{ color: GOLD, fontSize: 20 }} />
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Enterprise Plus</Typography>
            </Box>
            <Typography sx={{ color: '#111111', fontWeight: 700, fontSize: { xs: '1.2rem', md: '1.4rem' }, mb: 0.5 }}>
              Need unlimited scale for your team?
            </Typography>
            <Typography sx={{ color: M_TEXT_MUTED, fontSize: '0.92rem' }}>
              Custom models, dedicated infrastructure, SLA guarantees and 24/7 support.
            </Typography>
          </Box>
          <Button
            onClick={() => window.open('mailto:phosaico@gmail.com?subject=Enterprise%20Plus%20Inquiry', '_blank')}
            variant="outlined"
            endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
            sx={{
              borderColor: `${GOLD}40`, color: GOLD, fontWeight: 700, px: 3.5, py: 1.4,
              borderRadius: '50px', whiteSpace: 'nowrap', textTransform: 'none',
              '&:hover': { borderColor: GOLD, background: `${GOLD}10` },
            }}
          >
            Talk to Sales
          </Button>
        </Box>

        {/* ── FAQ ─────────────────────────────────────── */}
        <Box sx={{ maxWidth: 680, mx: 'auto', animation: `${fadeUp} 0.5s ease 0.5s both` }}>
          <Typography sx={{ color: '#111111', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.025em', textAlign: 'center', mb: 4 }}>
            Frequently asked questions
          </Typography>
          {FAQS.map(({ q, a }) => (
            <Accordion key={q} elevation={0} sx={{
              bgcolor: M_SURFACE, border: `1px solid ${M_BORDER}`,
              borderRadius: '12px !important', mb: 1.5, overflow: 'hidden',
              '&:before': { display: 'none' },
              '&.Mui-expanded': { border: '1px solid rgba(232, 160, 32, 0.25)', bgcolor: 'rgba(232, 160, 32, 0.03)' },
            }}>
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#64748b' }} />} sx={{ px: 3, py: 0.5 }}>
                <Typography sx={{ color: '#111111', fontWeight: 600, fontSize: '0.97rem' }}>{q}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 2.5 }}>
                <Typography sx={{ color: M_TEXT_MUTED, fontSize: '0.9rem', lineHeight: 1.75 }}>{a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
