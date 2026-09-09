import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, LinearProgress, TextField, Tooltip, Typography,
} from '@mui/material';
import { ContentCopy, Check, VpnKey, Add, Block } from '@mui/icons-material';
import { keysAPI } from '../services/api';

const GOLD = '#E8A020';
const GLASS = {
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid #e8e8e8',
  borderRadius: '16px',
};

function formatWhen(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export default function ApiKeysStudio() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [issued, setIssued] = useState(null);
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [usageOpen, setUsageOpen] = useState(null);
  const [usageEvents, setUsageEvents] = useState([]);
  const [usageLoading, setUsageLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await keysAPI.list();
      setKeys(data?.keys || []);
    } catch (err) {
      setError(err?.friendlyMessage || err?.response?.data?.detail || err.message || 'Failed to load keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const record = await keysAPI.create({ name: name.trim(), notes: notes.trim() });
      setIssued(record);
      setCreateOpen(false);
      setName('');
      setNotes('');
      await load();
    } catch (err) {
      setError(err?.friendlyMessage || err?.response?.data?.detail || err.message || 'Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (row) => {
    if (!row?.id || row.kind === 'unlimited') return;
    setBusyId(row.id);
    setError(null);
    try {
      await keysAPI.revoke(row.id);
      await load();
    } catch (err) {
      setError(err?.friendlyMessage || err?.response?.data?.detail || err.message || 'Failed to revoke key');
    } finally {
      setBusyId(null);
    }
  };

  const openUsage = async (row) => {
    setUsageOpen(row);
    setUsageLoading(true);
    try {
      const data = await keysAPI.usage(row.id);
      setUsageEvents(data?.events || []);
    } catch (err) {
      setError(err?.friendlyMessage || err?.response?.data?.detail || err.message || 'Failed to load usage');
      setUsageEvents([]);
    } finally {
      setUsageLoading(false);
    }
  };

  const copyIssued = async () => {
    if (!issued?.key) return;
    try {
      await navigator.clipboard.writeText(issued.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#111', mb: 1 }}>
              API Keys
            </Typography>
            <Typography sx={{ color: 'rgba(17,17,17,0.55)', maxWidth: 560 }}>
              Create billed keys for your own apps. They use the av_live_ prefix and spend your studio credits.
              Admin unlimited keys (av_unlim_) appear here as read-only if one was granted to this account.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateOpen(true)}
            sx={{ background: GOLD, color: '#111', fontWeight: 800, '&:hover': { background: '#C47F10' } }}
          >
            Create key
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
        )}

        <Box sx={{ ...GLASS, overflow: 'hidden' }}>
          {loading ? <LinearProgress /> : null}
          {!loading && !keys.length ? (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <VpnKey sx={{ color: GOLD, mb: 1 }} />
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>No API keys yet</Typography>
              <Typography variant="body2" color="text.secondary">
                Create a named key to call transcription, TTS, dubbing, and more from your own system.
              </Typography>
            </Box>
          ) : keys.map((key, idx) => (
            <Box
              key={key.id}
              sx={{
                p: 2.5,
                borderBottom: idx === keys.length - 1 ? 'none' : '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 2,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 800 }}>{key.name}</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#666' }}>
                  {key.prefix}
                </Typography>
                <Chip
                  size="small"
                  label={key.kind_label || (key.unlimited ? 'Unlimited' : 'Metered')}
                  sx={{
                    ml: 1, height: 20, fontWeight: 800, fontSize: '0.65rem',
                    bgcolor: key.kind === 'unlimited' ? 'rgba(8,102,255,0.1)' : 'rgba(232,160,32,0.15)',
                    color: key.kind === 'unlimited' ? '#0866FF' : '#C47F10',
                  }}
                />
                <Chip
                  size="small"
                  label={key.status}
                  sx={{
                    ml: 0.5, height: 20, fontWeight: 800, fontSize: '0.65rem',
                    bgcolor: key.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(228,30,63,0.1)',
                    color: key.status === 'active' ? '#059669' : '#E41E3F',
                  }}
                />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                  {Number(key.request_count || 0).toLocaleString()} calls
                  {key.kind === 'unlimited'
                    ? ` · ${Number(key.credits_waived || 0).toLocaleString()} cr waived`
                    : ` · ${Number(key.credits_charged || 0).toLocaleString()} cr billed`}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#999' }}>
                  Last used {formatWhen(key.last_used_at)}
                </Typography>
                <Button size="small" onClick={() => openUsage(key)} sx={{ textTransform: 'none' }}>Usage</Button>
                {key.status === 'active' && key.kind !== 'unlimited' && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Block fontSize="small" />}
                    disabled={busyId === key.id}
                    onClick={() => handleRevoke(key)}
                    sx={{ textTransform: 'none' }}
                  >
                    Revoke
                  </Button>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Container>

      <Dialog open={createOpen} onClose={() => !creating && setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Create a billed API key</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Named with the av_live_ prefix. Jobs using this key debit your credit wallet just like Studio.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            placeholder="Production server"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={creating}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={creating}
          />
          {creating && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating || !name.trim()} sx={{ background: GOLD, color: '#111', fontWeight: 800 }}>
            Issue key
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(issued)} onClose={() => setIssued(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Copy this secret now</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>This is the only time the full key is shown.</Alert>
          <Box sx={{ p: 2, bgcolor: '#F6F6F6', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
              {issued?.key}
            </Typography>
            <Tooltip title={copied ? 'Copied' : 'Copy'}>
              <IconButton size="small" onClick={copyIssued}>
                {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setIssued(null)} sx={{ background: GOLD, color: '#111', fontWeight: 800 }}>
            I have saved the key
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(usageOpen)} onClose={() => setUsageOpen(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>{usageOpen?.name || 'Key'} usage</DialogTitle>
        <DialogContent>
          {usageLoading ? <LinearProgress /> : null}
          {!usageLoading && !usageEvents.length ? (
            <Typography variant="body2" color="text.secondary">No recorded calls yet.</Typography>
          ) : usageEvents.map((ev) => (
            <Box key={ev.id} sx={{ py: 1.2, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {ev.event === 'job' ? (ev.service || 'Job') : `${ev.method || ''} ${ev.path || ''}`.trim()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ev.created_at ? new Date(ev.created_at).toLocaleString() : ''}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {ev.credits ? `${ev.billed ? '-' : 'waived '}${ev.credits} cr` : 'call'}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUsageOpen(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
