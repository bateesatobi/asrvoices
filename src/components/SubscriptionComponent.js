import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Button, Modal, Container,
  Chip, Divider
} from '@mui/material';
import {
  CheckCircle, Close, ArrowForward, Diamond, Workspaces,
  WorkspacePremium, Lock, VerifiedUser, Bolt,
} from '@mui/icons-material';
import { keyframes } from '@mui/material/styles';
import { subscriptionAPI } from '../services/api';
import PesapalCheckoutForm from './PesapalCheckoutForm';
import { CREDIT_PACKS, PLAN_COLORS, catalogPacksToUi } from '../constants/plans';

// ── Animations ─────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const pulseGlow = keyframes`
  0%,100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.04); }
`;

const G = 'linear-gradient(135deg, #E8A020, #C47F10)';
const GOLD = '#f59e0b';

const PLAN_ICONS = {
  'Starter':         <Lock sx={{ fontSize: 22 }} />,
  'Studio':          <WorkspacePremium sx={{ fontSize: 22 }} />,
  'Pro':             <Diamond sx={{ fontSize: 22 }} />,
  'Enterprise Plus': <Workspaces sx={{ fontSize: 22 }} />,
};

// ── Kente SVG ─────────────────────────────────────────────────────────────
function KenteBg() {
  return (
    <Box component="svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
      sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03, pointerEvents: 'none' }}
    >
      <defs>
        <pattern id="kente-sub" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#f59e0b" strokeWidth="1.2" />
          <line x1="0" y1="20" x2="40" y2="20" stroke="#C47F10" strokeWidth="0.4" />
          <line x1="20" y1="0" x2="20" y2="40" stroke="#C47F10" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#kente-sub)" />
    </Box>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────
function PlanCard({ plan, onSubscribe, index }) {
  const color = PLAN_COLORS[plan.title] || '#E8A020';
  const isCustom = plan.monthly === 'Custom';
  const isFree = plan.monthlyRaw === 0;

  const handleClick = () => {
    if (plan.ctaPath?.startsWith('mailto:')) {
      window.open(plan.ctaPath, '_blank');
    } else if (isFree) {
      // already on free trial
    } else {
      onSubscribe(plan.title, plan.monthly, plan.id);
    }
  };

  return (
    <Box sx={{
      position: 'relative',
      background: plan.popular
        ? `linear-gradient(160deg, rgba(232, 160, 32,0.07) 0%, rgba(232, 160, 32,0.07) 100%)`
        : 'rgba(17, 17, 17,0.025)',
      border: plan.popular
        ? '1.5px solid rgba(232, 160, 32,0.4)'
        : '1px solid rgba(17, 17, 17,0.07)',
      borderRadius: '24px',
      p: 3.5,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      animation: `${fadeUp} 0.5s ease ${index * 0.08}s both`,
      boxShadow: plan.popular ? `0 0 0 1px ${color}25, 0 24px 60px ${color}18` : 'none',
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
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '14px',
            background: `${color}15`, border: `1px solid ${color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            {PLAN_ICONS[plan.title] || <Diamond sx={{ fontSize: 22 }} />}
          </Box>
          {!isCustom && !isFree && (
            <Chip label="One-time pack" size="small" sx={{
              background: 'rgba(17, 17, 17, 0.05)', border: '1px solid rgba(17, 17, 17, 0.08)',
              color: '#475569', fontWeight: 600, fontSize: '0.7rem', borderRadius: '50px',
            }} />
          )}
        </Box>

        <Typography sx={{ color, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.75 }}>
          {plan.title}
        </Typography>

        {/* Price */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, mb: 1 }}>
          {isCustom ? (
            <Typography sx={{ color: GOLD, fontWeight: 800, fontSize: '2rem', lineHeight: 1 }}>
              Custom
            </Typography>
          ) : (
            <>
              <Typography sx={{ color: '#111111', fontWeight: 900, fontSize: '3rem', lineHeight: 1, letterSpacing: '-0.04em' }}>
                {plan.monthly}
              </Typography>
              {!isFree && (
                <Typography sx={{ color: '#475569', fontSize: '0.9rem', mb: 0.5 }}>one-time</Typography>
              )}
            </>
          )}
        </Box>

        <Typography sx={{ color: '#64748b', fontSize: '0.87rem', lineHeight: 1.6 }}>
          {plan.description}
        </Typography>
      </Box>

      {/* Divider */}
      <Divider sx={{ borderColor: 'rgba(17, 17, 17,0.06)', mb: 2.5 }} />

      {/* Features */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3.5 }}>
        {plan.features.map(({ label, included }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ flexShrink: 0 }}>
              {included ? (
                <CheckCircle sx={{ fontSize: 16, color }} />
              ) : (
                <Close sx={{ fontSize: 16, color: '#222222' }} />
              )}
            </Box>
            <Typography sx={{
              color: included ? '#cbd5e1' : '#222222',
              fontSize: '0.88rem',
              fontWeight: included ? 500 : 400,
              lineHeight: 1.4,
            }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* CTA */}
      <Button
        fullWidth
        onClick={handleClick}
        disabled={isFree}
        variant={plan.popular ? 'contained' : 'outlined'}
        endIcon={!isFree && <ArrowForward sx={{ fontSize: 16 }} />}
        sx={{
          py: 1.5, borderRadius: '50px', fontWeight: 700, fontSize: '0.93rem',
          textTransform: 'none',
          ...(isFree ? {
            background: 'rgba(17, 17, 17,0.04)', color: '#222222',
            border: '1px solid rgba(17, 17, 17,0.07)', cursor: 'default',
          } : plan.popular ? {
            background: G, color: '#111111',
            boxShadow: `0 6px 24px ${color}40`,
            '&:hover': { transform: 'translateY(-1px)', boxShadow: `0 8px 32px ${color}55}` },
          } : isCustom ? {
            background: `${GOLD}15`, color: GOLD,
            border: `1.5px solid ${GOLD}40`,
            '&:hover': { background: `${GOLD}25`, borderColor: GOLD },
          } : {
            background: `${color}12`, color,
            border: `1.5px solid ${color}35`,
            '&:hover': { background: `${color}22`, borderColor: color },
          }),
        }}
      >
        {isFree ? 'Current plan (Free)' : plan.cta}
      </Button>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────
const SubscriptionComponent = () => {
  const [user, setUser] = useState({ username: '', userId: '' });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creditBalance, setCreditBalance] = useState(null);
  const [packs, setPacks] = useState(CREDIT_PACKS.filter((p) => p.monthlyRaw));


  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser({ ...parsed, userId: parsed.uid || parsed.userId });
    }
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = stored.uid || stored.userId;
      const [sub, catalog] = await Promise.all([
        userId ? subscriptionAPI.getSubscription(userId).catch(() => null) : Promise.resolve(null),
        subscriptionAPI.getBillingCatalog().catch(() => null),
      ]);
      if (sub && sub.credit_balance != null) setCreditBalance(Number(sub.credit_balance));
      const mapped = catalogPacksToUi(catalog);
      if (mapped.length) setPacks(mapped);
    } catch {
      setCreditBalance(null);
    }
  };

  const handleSubscribe = (title, monthly, tierId) => {
    setSelectedPlan({ title, monthly, tierId });
    setIsModalOpen(true);
  };

  const getAmountInCents = (monthly) =>
    parseInt((monthly || '0').replace(/[^0-9]/g, '')) * 100;

  return (
    <Box sx={{ background: '#ffffff', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* <KenteBg /> */}

      {/* Ambient glow */}
      <Box sx={{
        position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 400, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(232, 160, 32,0.09) 0%, transparent 70%)',
        animation: `${pulseGlow} 8s ease-in-out infinite`, pointerEvents: 'none',
      }} />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: { xs: 6, md: 8 } }}>

        {/* ── Header ─────────────────────────────────── */}
        <Box sx={{ textAlign: 'center', mb: 7, animation: `${fadeUp} 0.5s ease both` }}>
          <Chip label="Pay as you go" size="small" sx={{
            background: `rgba(245,158,11,0.12)`, border: `1px solid rgba(245,158,11,0.3)`,
            color: GOLD, fontWeight: 700, borderRadius: '50px', mb: 2.5,
            '& .MuiChip-label': { px: 2 },
          }} />
          <Typography sx={{
            color: '#111111', fontWeight: 800,
            fontSize: { xs: '2rem', md: '2.8rem' },
            letterSpacing: '-0.03em', lineHeight: 1.1, mb: 1.5,
          }}>
            Buy credits.{' '}
            <Box component="span" sx={{ background: G, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Pay as you go.
            </Box>
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '1rem', maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>
            Jobs need a credit balance to start. If a job fails, those credits are refunded automatically.
          </Typography>

          {creditBalance != null && (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mt: 2.5, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '50px', px: 2, py: 0.75 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <Typography sx={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>
                Wallet: {creditBalance.toLocaleString()} credits
              </Typography>
            </Box>
          )}
        </Box>

        {/* ── Plan cards ─────────────────────────────── */}
        <Grid container spacing={3} justifyContent="center" alignItems="stretch" sx={{ mb: 7 }}>
          {packs.map((plan, i) => (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <PlanCard plan={plan} onSubscribe={handleSubscribe} index={i} />
            </Grid>
          ))}
        </Grid>

        {/* ── Trust strip ────────────────────────────── */}
        <Box sx={{
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
          gap: { xs: 2.5, md: 5 }, animation: `${fadeUp} 0.5s ease 0.4s both`,
          py: 3, borderTop: '1px solid rgba(17, 17, 17, 0.05)',
          borderBottom: '1px solid rgba(17, 17, 17, 0.05)',
        }}>
          {[
            { icon: <VerifiedUser sx={{ fontSize: 16, color: '#10b981' }} />, text: 'Secure Pesapal payments' },
            { icon: <Bolt sx={{ fontSize: 16, color: '#E8A020' }} />, text: 'Credits added on payment' },
            { icon: <Lock sx={{ fontSize: 16, color: '#C47F10' }} />, text: 'Credits never expire' },
          ].map(({ icon, text }) => (
            <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {icon}
              <Typography sx={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>{text}</Typography>
            </Box>
          ))}
        </Box>

        {/* ── Enterprise callout ─────────────────────── */}
        <Box sx={{
          mt: 6, p: { xs: 4, md: 5 },
          background: `rgba(245,158,11,0.05)`,
          border: `1px solid rgba(245,158,11,0.15)`,
          borderRadius: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 3,
          animation: `${fadeUp} 0.5s ease 0.5s both`,
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Workspaces sx={{ color: GOLD, fontSize: 20 }} />
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Enterprise Plus</Typography>
            </Box>
            <Typography sx={{ color: '#111111', fontWeight: 700, fontSize: { xs: '1.2rem', md: '1.4rem' }, mb: 0.5 }}>
              Need unlimited scale?
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.92rem' }}>
              Custom models, dedicated infrastructure, SLA guarantees and 24/7 support.
            </Typography>
          </Box>
          <Button
            onClick={() => window.open('mailto:phosaico@gmail.com?subject=Enterprise%20Plus%20Inquiry', '_blank')}
            variant="outlined"
            endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
            sx={{
              borderColor: `${GOLD}40`, color: GOLD, fontWeight: 700, px: 3, py: 1.4,
              borderRadius: '50px', whiteSpace: 'nowrap', textTransform: 'none',
              '&:hover': { borderColor: GOLD, background: `${GOLD}10` },
            }}
          >
            Talk to Sales
          </Button>
        </Box>
      </Container>

      {/* ── Pesapal checkout modal ─────────────────────── */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          }
        }}
      >
        <Box sx={{
          width: { xs: '95%', sm: 500 }, maxHeight: '90vh', overflow: 'auto',
          background: '#ffffff', border: '1px solid rgba(17, 17, 17,0.09)',
          borderRadius: '24px', outline: 'none',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        }}>
          {/* Modal top bar */}
          <Box sx={{ height: 3, background: G, borderRadius: '24px 24px 0 0' }} />
          <Box sx={{
            px: 3.5, py: 2.5,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(17, 17, 17,0.06)',
          }}>
            <Box>
              <Typography sx={{ color: '#111111', fontWeight: 700, fontSize: '1.1rem' }}>
                Buy {selectedPlan?.title} credits
              </Typography>
              <Typography sx={{ color: '#475569', fontSize: '0.82rem', mt: 0.25 }}>
                {selectedPlan?.monthly} — one-time credit pack
              </Typography>
            </Box>
            <Box
              onClick={() => setIsModalOpen(false)}
              sx={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(17, 17, 17, 0.05)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', transition: 'all 0.2s ease',
                '&:hover': { background: 'rgba(17, 17, 17, 0.1)', color: '#111111' },
              }}
            >
              <Close sx={{ fontSize: 18 }} />
            </Box>
          </Box>
          <Box sx={{ p: 3.5 }}>
            {selectedPlan && (
              <PesapalCheckoutForm
                amount={getAmountInCents(selectedPlan.monthly) / 100}
                tier={selectedPlan.title}
                tierId={selectedPlan.tierId}
                userId={user.userId || user.uid}
                onClose={() => setIsModalOpen(false)}
              />
            )}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default SubscriptionComponent;
