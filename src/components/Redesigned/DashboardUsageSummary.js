import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Stack, Button, Chip,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  ArrowForward,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import { AvoicesProgress, AvoicesRingProgress } from '../progress';

const AC = '#E8A020';
const G = 'linear-gradient(135deg, #E8A020, #C47F10)';
const GLASS = {
  background: 'rgba(17, 17, 17, 0.02)',
  border: '1px solid rgba(17, 17, 17, 0.05)',
  borderRadius: '20px',
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ p: 1.5, background: '#111111', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ color: '#F5B844', fontWeight: 800, fontSize: '0.95rem' }}>
        {payload[0].value.toFixed(2)} CR
      </Typography>
    </Box>
  );
}

/**
 * Compact usage + consumption panel for the dashboard home.
 */
export default function DashboardUsageSummary({
  balance = 0,
  analytics = {},
  ledger = [],
  loading = false,
}) {
  const navigate = useNavigate();

  const totalSpent = Object.values(analytics).reduce((a, b) => a + b, 0);
  const hoursSaved = (totalSpent * 0.05).toFixed(1);

  const chartData = React.useMemo(() => {
    if (!ledger.length) return [];
    const groups = {};
    [...ledger].reverse().forEach((item) => {
      if (item.service === 'credit_addition' || item.type === 'credit' || item.amount < 0) return;
      const d = item.timestamp ? format(new Date(item.timestamp), 'MMM dd') : 'Unknown';
      groups[d] = (groups[d] || 0) + item.amount;
    });
    return Object.keys(groups).map((date) => ({ date, spent: groups[date] }));
  }, [ledger]);

  const topServices = React.useMemo(
    () => Object.entries(analytics).sort((a, b) => b[1] - a[1]).slice(0, 4),
    [analytics]
  );

  return (
    <Stack spacing={2.5} sx={{ height: '100%' }} data-tour="usage-summary">
      <Paper sx={{ ...GLASS, p: 2.5, display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <AvoicesRingProgress value={Math.min((balance / 1500) * 100, 100)} size={100}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#111111' }}>
            {loading ? '…' : balance.toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(17,17,17,0.5)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
            Credits
          </Typography>
        </AvoicesRingProgress>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: '#111111', mb: 0.5 }}>Wallet</Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'rgba(17,17,17,0.5)', mb: 1.5 }}>
            {totalSpent.toFixed(1)} credits used · ~{hoursSaved}h saved
          </Typography>
          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={() => navigate('/dashboard/subscription')}
            sx={{ background: G, borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}
          >
            Top up credits
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ ...GLASS, p: 2.5, flex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TimelineIcon sx={{ color: '#C47F10', fontSize: 20 }} />
            <Typography sx={{ fontWeight: 800, color: '#111111', fontSize: '0.9375rem' }}>
              Consumption
            </Typography>
          </Stack>
          <Chip label="Recent" size="small" sx={{ bgcolor: 'rgba(17,17,17,0.05)', fontWeight: 600, height: 22 }} />
        </Stack>

        {chartData.length > 1 ? (
          <Box sx={{ width: '100%', height: 110, mb: 2 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="homeSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C47F10" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#C47F10" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,17,17,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(17,17,17,0.3)" style={{ fontSize: '0.65rem', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(17,17,17,0.3)" style={{ fontSize: '0.65rem', fontWeight: 600 }} axisLine={false} tickLine={false} width={34} />
                <RechartsTooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(17,17,17,0.1)', strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="spent" stroke="#C47F10" strokeWidth={2.5} fillOpacity={1} fill="url(#homeSpent)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Typography sx={{ color: 'rgba(17,17,17,0.35)', fontWeight: 600, fontSize: '0.8rem' }}>
              Run a studio job to see consumption trends.
            </Typography>
          </Box>
        )}

        <Stack spacing={1.25}>
          {topServices.length > 0 ? (
            topServices.map(([service, amount]) => (
              <Box key={service}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: 'rgba(17,17,17,0.7)', fontWeight: 600, textTransform: 'capitalize' }}>
                    {service.replace(/_/g, ' ')}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#111111', fontWeight: 800 }}>
                    {amount.toFixed(1)}
                  </Typography>
                </Stack>
                <AvoicesProgress variant="determinate" value={totalSpent > 0 ? (amount / totalSpent) * 100 : 0} size="xs" />
              </Box>
            ))
          ) : (
            <Typography sx={{ color: 'rgba(17,17,17,0.35)', fontSize: '0.8rem' }}>No usage tracked yet.</Typography>
          )}
        </Stack>

        <Button
          size="small"
          endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
          onClick={() => navigate('/dashboard/usage')}
          sx={{ mt: 2, textTransform: 'none', fontWeight: 700, color: AC }}
        >
          Full usage analytics
        </Button>
      </Paper>
    </Stack>
  );
}
