import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, IconButton, Typography, Button, Tooltip, Chip,
  Stack, InputAdornment, Menu, MenuItem, ListItemIcon, Divider, Alert,
  FormControl, Select, Snackbar, Card, useMediaQuery, useTheme,
} from '@mui/material';
import {
  InboxOutlined, Search, Delete, Visibility, MoreVert, Share,
  Refresh, CalendarMonth as CalendarIcon, Download, Replay,
} from '@mui/icons-material';
import ReactPaginate from 'react-paginate';
import './Pagination.css';
import Skeleton from '@mui/material/Skeleton';
import { dataAPI } from '../services/api';
import {
  AC, G, fetchAllVaultActivity, filterVaultEntries, formatRelativeDate,
  formatFullDate, isProcessingStatus, VAULT_SOURCES, readAllVaultActivityCache,
  invalidateVaultCache, getAssetDownloadUrl,
} from '../utils/mediaVault';
import { VAULT_CACHE_KEYS } from '../utils/vaultCache';

const PAGE_SIZE = [10, 25, 50];
const getUser = () => JSON.parse(localStorage.getItem('user') || '{}');

export default function AllActivityFeed({ refreshKey = 0, onMetrics, statusFilter: externalStatusFilter, typeFilter: externalTypeFilter }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const onMetricsRef = useRef(onMetrics);
  const hasEntriesRef = useRef(false);
  onMetricsRef.current = onMetrics;

  const [entries, setEntries] = useState(() => {
    const { uid, userId } = getUser();
    const id = uid || userId;
    return id ? (readAllVaultActivityCache(id) || []) : [];
  });
  const [initialLoading, setInitialLoading] = useState(() => entries.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [anchor, setAnchor] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'info' });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const effectiveStatus = externalStatusFilter ?? statusFilter;
  const effectiveType = externalTypeFilter ?? typeFilter;

  const notify = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  const loadEntries = useCallback(async ({ force = false, silent = false } = {}) => {
    const { uid, userId } = getUser();
    const id = uid || userId;
    if (!id) {
      setInitialLoading(false);
      return;
    }

    if (!silent && !hasEntriesRef.current) setInitialLoading(true);
    else if (silent) setRefreshing(true);

    setLoadError(false);
    try {
      const merged = await fetchAllVaultActivity(id, { force });
      hasEntriesRef.current = merged.length > 0;
      setEntries(merged);
      onMetricsRef.current?.(merged);
    } catch {
      if (!silent && !hasEntriesRef.current) setLoadError(true);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    hasEntriesRef.current = entries.length > 0;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshKeyRef = useRef(refreshKey);
  useEffect(() => {
    const force = refreshKey !== refreshKeyRef.current;
    refreshKeyRef.current = refreshKey;
    if (force) {
      const { uid, userId } = getUser();
      const id = uid || userId;
      if (id) invalidateVaultCache(id);
    }
    loadEntries({ force, silent: hasEntriesRef.current });
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hasProcessing = entries.some(e => isProcessingStatus(e._status));
    if (!hasProcessing) return undefined;
    const iv = setInterval(() => loadEntries({ force: true, silent: true }), 15000);
    return () => clearInterval(iv);
  }, [entries, loadEntries]);

  const filtered = useMemo(() => filterVaultEntries(entries, {
    query: filter,
    status: effectiveStatus,
    type: effectiveType,
    dateFrom,
    dateTo,
  }), [entries, filter, effectiveStatus, effectiveType, dateFrom, dateTo]);

  const displayed = useMemo(() => filtered.slice(page * perPage, (page + 1) * perPage), [filtered, page, perPage]);

  const handleView = (row) => {
    if (row._viewPath) navigate(row._viewPath);
    else {
      const url = getAssetDownloadUrl(row);
      if (url) window.open(url, '_blank');
    }
  };

  const handleShare = (row) => {
    const path = row._viewPath;
    const url = path ? `${window.location.origin}${path}` : `${window.location.origin}/dashboard/history?view=${row._vaultType}`;
    navigator.clipboard.writeText(url).then(() => notify('Link copied to clipboard'));
  };

  const handleMenuAction = async (action) => {
    if (action === 'view') handleView(activeRow);
    if (action === 'share') handleShare(activeRow);
    if (action === 'delete' && activeRow) {
      if (window.confirm('Permanently delete this record?')) {
        try {
          await dataAPI.deleteRecord(activeRow._collection, activeRow.doc_id);
          const { uid, userId } = getUser();
          const id = uid || userId;
          if (id) invalidateVaultCache(id);
          setEntries(prev => prev.filter(r => r.doc_id !== activeRow.doc_id));
          notify('Record deleted');
        } catch {
          notify('Delete failed', 'error');
        }
      }
    }
    if (action === 'redo' && activeRow) {
      try {
        notify('Starting redo…', 'info');
        const result = await dataAPI.redoJob(activeRow._collection, activeRow.doc_id);
        const { uid, userId } = getUser();
        const id = uid || userId;
        if (id) invalidateVaultCache(id);
        window.dispatchEvent(new Event('library-updated'));
        await loadEntries({ force: true, silent: true });
        notify(result?.message || 'Redo started. A new row will appear shortly.');
      } catch (err) {
        notify(err?.response?.data?.detail || err.message || 'Redo failed', 'error');
      }
    }
    setAnchor(null);
    setActiveRow(null);
  };

  const statusChip = (status) => {
    const s = (status || 'completed').toLowerCase();
    const color = s === 'failed' ? 'error' : isProcessingStatus(s) ? 'warning' : 'success';
    return <Chip label={s} size="small" color={color} sx={{ fontWeight: 700, textTransform: 'capitalize', fontSize: '0.7rem' }} />;
  };

  const handleManualRefresh = () => {
    const { uid, userId } = getUser();
    const id = uid || userId;
    if (id) invalidateVaultCache(id);
    loadEntries({ force: true, silent: hasEntriesRef.current });
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2.5 }}>
        <TextField
          fullWidth size="small" placeholder="Search all assets…" value={filter}
          onChange={e => { setFilter(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
            sx: { borderRadius: 1.5 },
          }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
          {!externalStatusFilter && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 1.5, fontSize: '0.85rem' }}>
                <MenuItem value="all">All status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="processing">In progress</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          )}
          {!externalTypeFilter && (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 1.5, fontSize: '0.85rem' }}>
                <MenuItem value="all">All types</MenuItem>
                {VAULT_SOURCES.map(s => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={handleManualRefresh} sx={{ opacity: refreshing ? 0.6 : 1 }}>
              <Refresh fontSize="small" sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filter by date">
            <IconButton size="small" onClick={() => setShowDateFilter(v => !v)} sx={{ color: (dateFrom || dateTo) ? AC : 'inherit' }}>
              <CalendarIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <FormControl size="small" sx={{ minWidth: 72 }}>
            <Select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(0); }} sx={{ borderRadius: 1.5, fontSize: '0.85rem' }}>
              {PAGE_SIZE.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {showDateFilter && (
        <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <TextField size="small" type="date" label="From" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }} />
          <TextField size="small" type="date" label="To" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }} />
          {(dateFrom || dateTo) && <Button size="small" onClick={() => { setDateFrom(''); setDateTo(''); setPage(0); }}>Clear</Button>}
        </Stack>
      )}

      {loadError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} action={<Button color="inherit" size="small" onClick={() => loadEntries({ force: true })}>Retry</Button>}>
          Could not load your library. Check your connection and try again.
        </Alert>
      )}

      {initialLoading ? (
        <Stack spacing={1.5}>{[...Array(5)].map((_, i) => <Skeleton key={i} height={48} sx={{ borderRadius: 2 }} />)}</Stack>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <InboxOutlined sx={{ fontSize: 48, color: 'rgba(17,17,17,0.15)', mb: 2 }} />
          <Typography fontWeight={700} mb={0.5}>{filter ? 'No matches' : 'No assets yet'}</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {filter ? `Nothing matches "${filter}"` : 'Create content in any studio and it will appear here.'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/dashboard/transcribe')} sx={{ background: G, fontWeight: 800, borderRadius: '12px' }}>Open Transcribe Studio</Button>
        </Box>
      ) : isMobile ? (
        <Stack spacing={1.5}>
          {displayed.map(row => (
            <Card key={`${row._vaultType}-${row.doc_id}`} sx={{ p: 2, borderRadius: '12px', border: '1px solid rgba(17,17,17,0.06)' }}>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Chip label={row._vaultLabel} size="small" sx={{ bgcolor: `${row._vaultColor}18`, color: row._vaultColor, fontWeight: 800, fontSize: '0.65rem' }} />
                {statusChip(row._status)}
              </Stack>
              <Typography fontWeight={700} fontSize="0.9rem" mb={0.5} onClick={() => handleView(row)} sx={{ cursor: 'pointer' }}>{row._title}</Typography>
              <Tooltip title={formatFullDate(row._date)}><Typography variant="caption" color="text.secondary">{formatRelativeDate(row._date)}</Typography></Tooltip>
              <Stack direction="row" spacing={0.5} justifyContent="flex-end" mt={1}>
                <IconButton size="small" aria-label="Open actions" onClick={e => { setAnchor(e.currentTarget); setActiveRow(row); }}><MoreVert sx={{ fontSize: 18 }} /></IconButton>
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : (
        <TableContainer sx={{ opacity: refreshing ? 0.85 : 1, transition: 'opacity 0.2s' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-head': { fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'rgba(17,17,17,0.4)' } }}>
                <TableCell>Type</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {displayed.map(row => (
                <TableRow key={`${row._vaultType}-${row.doc_id}`} hover sx={{ cursor: 'pointer' }} onClick={() => handleView(row)}>
                  <TableCell><Chip label={row._vaultLabel} size="small" sx={{ bgcolor: `${row._vaultColor}15`, color: row._vaultColor, fontWeight: 700, fontSize: '0.68rem' }} /></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 280 }}>{row._title}</Typography></TableCell>
                  <TableCell>{statusChip(row._status)}</TableCell>
                  <TableCell>
                    <Tooltip title={formatFullDate(row._date)}><Typography variant="body2" color="text.secondary">{formatRelativeDate(row._date)}</Typography></Tooltip>
                  </TableCell>
                  <TableCell align="right" onClick={e => e.stopPropagation()}>
                    <IconButton size="small" aria-label="Open actions" onClick={e => { setAnchor(e.currentTarget); setActiveRow(row); }}>
                      <MoreVert sx={{ fontSize: 18, color: 'rgba(17,17,17,0.55)' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {filtered.length > perPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <ReactPaginate
            previousLabel="Prev" nextLabel="Next" breakLabel="..."
            pageCount={Math.ceil(filtered.length / perPage)} forcePage={page}
            onPageChange={({ selected: p }) => setPage(p)}
            containerClassName="pagination" activeClassName="active"
            pageClassName="page-item" previousClassName="page-item" nextClassName="page-item"
            pageLinkClassName="page-link" previousLinkClassName="page-link" nextLinkClassName="page-link"
            activeLinkClassName="active-link"
          />
        </Box>
      )}

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 160, borderRadius: 1.5 } }}
      >
        <MenuItem onClick={() => handleMenuAction('view')}><ListItemIcon><Visibility fontSize="small" sx={{ color: AC }} /></ListItemIcon> View</MenuItem>
        {activeRow && getAssetDownloadUrl(activeRow) && (
          <MenuItem onClick={() => { const url = getAssetDownloadUrl(activeRow); if (url) window.open(url, '_blank'); setAnchor(null); }}>
            <ListItemIcon><Download fontSize="small" sx={{ color: AC }} /></ListItemIcon> Download
          </MenuItem>
        )}
        {activeRow && !isProcessingStatus(activeRow._status || activeRow.status) && (
          <MenuItem onClick={() => handleMenuAction('redo')}>
            <ListItemIcon><Replay fontSize="small" sx={{ color: AC }} /></ListItemIcon>
            {String(activeRow._status || activeRow.status || '').toLowerCase() === 'failed' ? 'Retry' : 'Redo'}
          </MenuItem>
        )}
        <MenuItem onClick={() => handleMenuAction('share')}><ListItemIcon><Share fontSize="small" /></ListItemIcon> Copy link</MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: '#f43f5e' }}><ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon> Delete</MenuItem>
      </Menu>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.sev} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
