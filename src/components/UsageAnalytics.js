import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  Stack, Tooltip, Alert, Skeleton, IconButton, Button
} from '@mui/material';
import { AvoicesProgress, AvoicesRingProgress } from './progress';
import {
  AccountBalanceWallet as WalletIcon,
  Timeline as TimelineIcon,
  History as HistoryIcon,
  Translate as TranslateIcon,
  SettingsVoice as TranscribeIcon,
  Notes as SummarizeIcon,
  SwapHoriz as TransactionIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { subscriptionAPI, keysAPI } from '../services/api';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';


const GLASS = { 
  background: 'rgba(17, 17, 17,0.02)', 
  border: '1px solid rgba(17, 17, 17, 0.05)', 
  borderRadius: '20px',
  backdropFilter: 'blur(10px)'
};

const SERVICE_ICONS = {
  transcription: <TranscribeIcon sx={{ color: '#f59e0b' }} fontSize="small" />,
  video_extraction: <TimelineIcon sx={{ color: '#fbbf24' }} fontSize="small" />,
  text_translation: <TranslateIcon sx={{ color: '#10b981' }} fontSize="small" />,
  doc_translation: <TranslateIcon sx={{ color: '#f59e0b' }} fontSize="small" />,
  summarization: <SummarizeIcon sx={{ color: '#d97706' }} fontSize="small" />,
  credit_addition: <WalletIcon sx={{ color: '#10b981' }} fontSize="small" />,
  voice_cloning: <TranscribeIcon sx={{ color: '#fb923c' }} fontSize="small" />
};

const CustomRechartsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ p: 2, background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <Typography sx={{ color: '#111111', fontWeight: 600, fontSize: '0.85rem', mb: 1 }}>{label}</Typography>
        <Typography sx={{ color: '#f59e0b', fontWeight: 800, fontSize: '1.1rem' }}>
          {payload[0].value.toFixed(2)} <Typography component="span" sx={{ fontSize: '0.75rem', color: 'rgba(17, 17, 17, 0.5)' }}>Credits Used</Typography>
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function UsageAnalytics({ userId }) {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total_pages: 1, total: 0, limit: 20 });
  const [apiKeys, setApiKeys] = useState([]);

  const fetchData = React.useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const [balRes, ledgerRes, analyticsRes, keysRes] = await Promise.all([
        subscriptionAPI.getBalance(userId),
        subscriptionAPI.getLedger(userId, p, 20),
        subscriptionAPI.getAnalytics(userId),
        keysAPI.list().catch(() => ({ keys: [] })),
      ]);
      setBalance(balRes.balance || 0);
      setLedger(ledgerRes.ledger || []);
      setAnalytics(analyticsRes.analytics || {});
      setApiKeys(keysRes.keys || []);
      setPagination(ledgerRes.pagination || { total_pages: 1, total: 0, limit: 20 });
      setPage(p);

      // Dispatch event to sync global navbar
      window.dispatchEvent(new CustomEvent('refresh-balance'));
    } catch (err) {
      setError('Could not load usage data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, fetchData]);

  const chartData = useMemo(() => {
    if (!ledger || ledger.length === 0) return [];
    const reversed = [...ledger].reverse(); // Chronological
    const groups = {};
    reversed.forEach(item => {
      // Ignore top-ups, plot only consumption
      if (item.service === 'credit_addition' || item.type === 'credit' || item.amount < 0) return;
      const d = item.timestamp ? format(new Date(item.timestamp), 'MMM dd') : 'Unknown';
      if (!groups[d]) groups[d] = 0;
      groups[d] += item.amount;
    });
    return Object.keys(groups).map(date => ({ date, spent: groups[date] }));
  }, [ledger]);

  const totalSpent = Object.values(analytics).reduce((a, b) => a + b, 0);

  // Gamification Metrics
  const getCreatorTier = (spent) => {
    if (spent >= 500) return { name: 'Platinum Creator', color: '#8b5cf6', badge: '👑' };
    if (spent >= 150) return { name: 'Gold Creator', color: '#f59e0b', badge: '🏆' };
    if (spent >= 50) return { name: 'Silver Creator', color: '#94a3b8', badge: '🥈' };
    return { name: 'Bronze Creator', color: '#cd7f32', badge: '🥉' };
  };
  const tier = getCreatorTier(totalSpent);
  
  // Estimate 1 credit = roughly 3 minutes of manual labor saved
  const hoursSaved = (totalSpent * 0.05).toFixed(1);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 6, mb: 3, bgcolor: 'rgba(17, 17, 17, 0.05)' }} />
        <Skeleton variant="text" sx={{ width: '30%', mb: 2, bgcolor: 'rgba(17, 17, 17, 0.05)' }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 6, bgcolor: 'rgba(17, 17, 17, 0.05)' }} />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', bgcolor: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
          {error}
        </Alert>
      )}

      {apiKeys.length > 0 && (
        <Paper sx={{ ...GLASS, p: 3, mb: 4 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <TransactionIcon sx={{ color: '#f59e0b' }} />
            <Typography variant="h6" sx={{ color: '#111111', fontWeight: 800 }}>API key usage</Typography>
            <Button size="small" href="/dashboard/api-keys" sx={{ ml: 'auto', textTransform: 'none', fontWeight: 700, color: '#f59e0b' }}>
              Manage keys
            </Button>
          </Stack>
          <Stack spacing={1.25}>
            {apiKeys.slice(0, 6).map((key) => (
              <Stack key={key.id} direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{key.name || key.prefix}</Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                    {(key.kind || 'metered')} · {key.prefix}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
                  {(key.request_count || 0).toLocaleString()} req
                  {key.credits_charged ? ` · ${Number(key.credits_charged).toFixed(1)} cr` : ''}
                  {key.credits_waived ? ` · ${Number(key.credits_waived).toFixed(1)} waived` : ''}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Top Banner metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Balance Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, borderRadius: '24px', height: '100%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', boxShadow: '0 10px 40px rgba(245, 158, 11, 0.1)'
          }}>
            <AvoicesRingProgress value={Math.min((balance / 1500) * 100, 100)} size={140} sx={{ mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#111111' }}>
                {balance.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(17, 17, 17, 0.6)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Credits
              </Typography>
            </AvoicesRingProgress>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip 
                icon={<WalletIcon sx={{ fontSize: '1rem !important', color: `${tier.color} !important` }} />} 
                label={tier.name} 
                size="small"
                sx={{ bgcolor: `${tier.color}20`, color: tier.color, border: `1px solid ${tier.color}40`, fontWeight: 800 }}
              />
              <Tooltip title="Estimated manual labor hours saved by using AI">
                <Chip 
                  label={`${hoursSaved}h Saved`} 
                  size="small"
                  sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 800 }}
                />
              </Tooltip>
            </Stack>
            
            {/* Quick Refresh */}
            <Tooltip title="Refresh Balance">
              <IconButton 
                onClick={fetchData} 
                disabled={loading}
                sx={{ 
                  position: 'absolute', top: 12, right: 12, 
                  color: 'rgba(17, 17, 17, 0.2)',
                  '&:hover': { color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }
                }}
              >
                <RefreshIcon fontSize="small" sx={{ animation: loading ? 'spin 2s linear infinite' : 'none' }} />
              </IconButton>
            </Tooltip>
          </Paper>
        </Grid>

        {/* Time-Series Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ ...GLASS, p: 3, height: '100%', position: 'relative' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TimelineIcon sx={{ color: '#d97706' }} />
                <Typography variant="h6" sx={{ color: '#111111', fontWeight: 800 }}>Consumption Rate</Typography>
              </Stack>
              <Chip label="Last 30 Days" size="small" sx={{ bgcolor: 'rgba(17, 17, 17, 0.05)', color: 'rgba(17, 17, 17, 0.5)', fontWeight: 600 }} />
            </Box>
            
            {chartData.length > 0 ? (
              <Box sx={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(17, 17, 17, 0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="rgba(17, 17, 17,0.3)" style={{ fontSize: '0.75rem', fontWeight: 600 }} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(17, 17, 17,0.3)" style={{ fontSize: '0.75rem', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomRechartsTooltip />} cursor={{ stroke: 'rgba(17, 17, 17, 0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Area type="monotone" dataKey="spent" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorSpent)" activeDot={{ r: 6, fill: '#d97706', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'rgba(17, 17, 17,0.3)', fontWeight: 600 }}>Not enough consumption data to map trend.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Services Mix & Ledger */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...GLASS, p: 3, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ color: 'rgba(17, 17, 17, 0.5)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, mb: 3 }}>
              Total Distribution
            </Typography>
              {totalSpent.toFixed(2)} <Typography component="span" sx={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(17, 17, 17, 0.4)' }}>CR</Typography>
            <Box sx={{ mb: 4 }} />
            
            <Stack spacing={2.5}>
              {Object.entries(analytics).length > 0 ? Object.entries(analytics).map(([service, amount]) => (
                <Box key={service}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {SERVICE_ICONS[service] || <TransactionIcon fontSize="small" sx={{ color: 'rgba(17, 17, 17, 0.5)' }}/>}
                      <Typography variant="body2" sx={{ textTransform: 'capitalize', color: 'rgba(17, 17, 17, 0.8)', fontWeight: 600 }}>{service.replace('_', ' ')}</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: '#111111', fontWeight: 800 }}>{amount.toFixed(2)}</Typography>
                  </Stack>
                  <AvoicesProgress
                    variant="determinate"
                    value={totalSpent > 0 ? (amount / totalSpent) * 100 : 0}
                    size="xs"
                  />
                </Box>
              )) : (
                <Typography sx={{ color: 'rgba(17, 17, 17,0.3)', fontSize: '0.85rem' }}>No usage tracked yet.</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ ...GLASS, p: 0, overflow: 'hidden', height: '100%', minHeight: 400 }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(17, 17, 17, 0.05)' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <HistoryIcon sx={{ color: '#f59e0b' }} />
                <Typography variant="h6" sx={{ color: '#111111', fontWeight: 800 }}>Audit Ledger</Typography>
              </Stack>
            </Box>
            <TableContainer sx={{ maxHeight: 450 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', color: 'rgba(17, 17, 17, 0.4)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>Timestamp</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', color: 'rgba(17, 17, 17, 0.4)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>Service Endpoint</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', color: 'rgba(17, 17, 17, 0.4)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>Trace ID / Job Name</TableCell>
                    <TableCell align="right" sx={{ bgcolor: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', color: 'rgba(17, 17, 17, 0.4)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ledger.map((row) => {
                    const isCredit = row.service === 'credit_addition' || row.type === 'credit' || row.amount < 0;
                    return (
                      <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'rgba(17, 17, 17,0.02)' } }}>
                        <TableCell sx={{ color: 'rgba(17, 17, 17, 0.6)', borderBottom: '1px solid rgba(17, 17, 17,0.03)', fontSize: '0.85rem' }}>
                          {row.timestamp ? format(new Date(row.timestamp), 'MMM dd, yyyy • HH:mm') : '---'}
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(17, 17, 17,0.03)' }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ p: 0.5, borderRadius: '6px', bgcolor: 'rgba(17, 17, 17,0.03)' }}>
                              {SERVICE_ICONS[row.service] || <TransactionIcon fontSize="small" sx={{ color: 'rgba(17, 17, 17,0.3)' }}/>}
                            </Box>
                            <Typography variant="body2" sx={{ color: '#111111', fontWeight: 600, textTransform: 'capitalize' }}>
                              {row.service.replace('_', ' ')}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(17, 17, 17, 0.5)', borderBottom: '1px solid rgba(17, 17, 17,0.03)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                          {row.job_name || row.id}
                        </TableCell>
                        <TableCell align="right" sx={{ borderBottom: '1px solid rgba(17, 17, 17,0.03)' }}>
                          <Chip 
                            size="small"
                            label={`${isCredit ? '+' : '-'}${Math.abs(row.amount).toFixed(2)}`}
                            sx={{ 
                                fontWeight: 800, fontSize: '0.8rem',
                                bgcolor: isCredit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: isCredit ? '#10b981' : '#f43f5e',
                                border: `1px solid ${isCredit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {ledger.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'rgba(17, 17, 17,0.3)', border: 'none' }}>
                        No transactions registered in the ledger.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Controls */}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(17, 17, 17, 0.05)', bgcolor: 'rgba(17, 17, 17,0.01)' }}>
              <Typography variant="caption" sx={{ color: 'rgba(17, 17, 17,0.3)', fontWeight: 600 }}>
                Showing Page {page} of {pagination.total_pages || 1} ({pagination.total || 0} items)
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button 
                  variant="outlined"
                  size="small" 
                  disabled={page <= 1 || loading} 
                  onClick={() => fetchData(page - 1)}
                  sx={{ 
                    borderColor: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b', 
                    '&:hover': { borderColor: '#f59e0b', bgcolor: 'rgba(245, 158, 11, 0.1)' },
                    '&.Mui-disabled': { borderColor: 'rgba(17, 17, 17, 0.05)', color: 'rgba(17, 17, 17, 0.2)' }
                  }}
                >
                  Previous
                </Button>
                <Button 
                  variant="outlined"
                  size="small" 
                  disabled={page >= (pagination.total_pages || 1) || loading} 
                  onClick={() => fetchData(page + 1)}
                  sx={{ 
                    borderColor: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b', 
                    '&:hover': { borderColor: '#f59e0b', bgcolor: 'rgba(245, 158, 11, 0.1)' },
                    '&.Mui-disabled': { borderColor: 'rgba(17, 17, 17, 0.05)', color: 'rgba(17, 17, 17, 0.2)' }
                  }}
                >
                  Next
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
