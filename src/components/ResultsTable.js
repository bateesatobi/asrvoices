import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Checkbox, TextField, IconButton,
  Typography, Button, Tooltip, TableSortLabel, Snackbar, Alert,
  Menu, MenuItem, Stack, InputAdornment, ListItemIcon, Select, FormControl,
  useMediaQuery, useTheme, Divider,
} from '@mui/material';
import {
  FileDownload as DownloadIcon, CalendarMonth as CalendarIcon,
  Search, Delete, Visibility, MoreVert, Share, Refresh, Replay,
} from '@mui/icons-material';
import ReactPaginate from 'react-paginate';
import './Pagination.css';
import Skeleton from '@mui/material/Skeleton';
import { dataAPI } from '../services/api';
import {
  AC, isProcessingStatus, getEntryDate, getAssetDownloadUrl, defaultVaultSearch, resolveRowTitle,
} from '../utils/mediaVault';
import {
  fetchVaultCached, readVaultCacheSync, invalidateVaultCache, VAULT_CACHE_KEYS,
} from '../utils/vaultCache';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const getUser = () => JSON.parse(localStorage.getItem('user') || '{}');

export default function ResultsTable({
  fetchFn,
  columns,
  viewPath,
  collectionName,
  searchFilter,
  searchPlaceholder = 'Search…',
  emptyTitle = 'No results yet',
  emptySubtitle = 'Your processed files will appear here.',
  emptyActionLabel = 'Open Studio',
  studioPath = null,
  sortKey,
  dateKey = 'date',
  refreshKey = 0,
  cacheKey = null,
  onEntriesLoaded,
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchFnRef = useRef(fetchFn);
  const onLoadedRef = useRef(onEntriesLoaded);
  const hasEntriesRef = useRef(false);
  fetchFnRef.current = fetchFn;
  onLoadedRef.current = onEntriesLoaded;

  const resolveCacheKey = cacheKey || collectionName || 'table';

  const [entries, setEntries] = useState(() => {
    const { uid, userId } = getUser();
    const id = uid || userId;
    if (!id) return [];
    const cached = readVaultCacheSync(id, resolveCacheKey);
    return Array.isArray(cached?.entries) ? cached.entries : [];
  });
  const [initialLoading, setInitialLoading] = useState(() => entries.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
  const resolvedSortKey = sortKey ?? dateKey;
  const [orderBy, setOrderBy] = useState(resolvedSortKey);
  const [order, setOrder] = useState('desc');
  const [selected, setSelected] = useState([]);
  const [anchor, setAnchor] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'info' });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => {
    hasEntriesRef.current = entries.length > 0;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const notify = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  const applyEntries = useCallback((list) => {
    hasEntriesRef.current = list.length > 0;
    setEntries(list);
    onLoadedRef.current?.(list);
  }, []);

  const fetchData = useCallback(async ({ force = false, silent = false } = {}) => {
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
      const { data: res } = await fetchVaultCached(
        id,
        resolveCacheKey,
        () => fetchFnRef.current(id),
        { force }
      );
      const list = Array.isArray(res?.entries) ? res.entries : [];
      applyEntries(list);
    } catch {
      if (!silent && !hasEntriesRef.current) setLoadError(true);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [applyEntries, resolveCacheKey]);

  const refreshKeyRef = useRef(refreshKey);
  useEffect(() => {
    const force = refreshKey !== refreshKeyRef.current;
    refreshKeyRef.current = refreshKey;
    if (force) {
      const { uid, userId } = getUser();
      const id = uid || userId;
      if (id) invalidateVaultCache(id, resolveCacheKey);
    }
    fetchData({ force, silent: hasEntriesRef.current });
  }, [refreshKey, resolveCacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hasProcessing = entries.some(r => isProcessingStatus(r.status));
    if (!hasProcessing) return undefined;
    const iv = setInterval(() => fetchData({ force: true, silent: true }), 4000);
    return () => clearInterval(iv);
  }, [entries, fetchData]);

  const handleSort = (field) => {
    setOrder(orderBy === field && order === 'asc' ? 'desc' : 'asc');
    setOrderBy(field);
  };

  const toggleSelectAll = (e) =>
    setSelected(e.target.checked ? entries.map(r => r.doc_id) : []);

  const toggleSelect = (id) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = columns.map(c => c.label).join(',');
    const rows = filtered.map(r =>
      columns.map(c => {
        const val = r[c.id] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv'; a.click();
    URL.revokeObjectURL(url);
    notify('CSV exported');
  };

  const filtered = useMemo(() => {
    return entries.filter(r => {
      if (filter && !(searchFilter ? searchFilter(r, filter) : defaultVaultSearch(r, filter))) return false;
      if (dateFrom || dateTo) {
        const d = new Date(getEntryDate(r) || 0);
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
      }
      return true;
    });
  }, [entries, filter, searchFilter, dateFrom, dateTo, dateKey]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (orderBy === resolvedSortKey || orderBy === dateKey || orderBy === 'date' || orderBy === 'Date') {
        const da = new Date(getEntryDate(a) || 0);
        const db = new Date(getEntryDate(b) || 0);
        return order === 'asc' ? da - db : db - da;
      }
      if (orderBy === 'title') {
        const va = resolveRowTitle(a);
        const vb = resolveRowTitle(b);
        return order === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const va = (a[orderBy] ?? '').toString();
      const vb = (b[orderBy] ?? '').toString();
      return order === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [filtered, orderBy, order, dateKey, resolvedSortKey]);

  const displayed = useMemo(() => sorted.slice(page * perPage, (page + 1) * perPage), [sorted, page, perPage]);

  const handleView = useCallback((id, row) => {
    const path = viewPath?.(id);
    if (path) navigate(path);
    else {
      const url = getAssetDownloadUrl(row);
      if (url) window.open(url, '_blank');
    }
  }, [navigate, viewPath]);

  const copyShareLink = (row) => {
    const path = viewPath?.(row?.doc_id);
    const url = path
      ? `${window.location.origin}${path}`
      : `${window.location.origin}/dashboard/history`;
    navigator.clipboard.writeText(url).then(() => notify('Link copied to clipboard')).catch(() => notify('Could not copy link', 'error'));
  };

  const handleMenuAction = async (action) => {
    if (action === 'view') handleView(activeRow?.doc_id, activeRow);
    if (action === 'download' && activeRow) {
      const url = getAssetDownloadUrl(activeRow);
      if (url) window.open(url, '_blank');
      else notify('No download available for this item', 'warning');
    }
    if (action === 'delete' && activeRow) {
      if (window.confirm('Are you sure you want to permanently delete this record?')) {
        try {
          const coll = activeRow.collection || collectionName;
          if (!coll) { notify('Error: Collection name missing', 'error'); return; }
          await dataAPI.deleteRecord(coll, activeRow.doc_id);
          const { uid, userId } = getUser();
          const id = uid || userId;
          if (id) {
            invalidateVaultCache(id, resolveCacheKey);
            invalidateVaultCache(id, VAULT_CACHE_KEYS.ALL_ACTIVITY);
          }
          setEntries(prev => prev.filter(r => r.doc_id !== activeRow.doc_id));
          notify('Record deleted permanently');
        } catch (err) {
          console.error('[ResultsTable] Delete failed:', err);
          notify('Failed to delete record', 'error');
        }
      }
    }
    if (action === 'share' && activeRow) copyShareLink(activeRow);
    if (action === 'redo' && activeRow) {
      const coll = activeRow.collection || collectionName;
      if (!coll) {
        notify('Cannot redo: missing collection', 'error');
      } else {
        try {
          notify('Starting redo…', 'info');
          const result = await dataAPI.redoJob(coll, activeRow.doc_id);
          const { uid, userId } = getUser();
          const id = uid || userId;
          if (id) {
            invalidateVaultCache(id, resolveCacheKey);
            invalidateVaultCache(id, VAULT_CACHE_KEYS.ALL_ACTIVITY);
          }
          window.dispatchEvent(new Event('library-updated'));
          await fetchData({ force: true, silent: true });
          notify(result?.message || 'Redo started. A new row will appear shortly.');
        } catch (err) {
          const detail = err?.response?.data?.detail || err.message || 'Redo failed';
          notify(detail, 'error');
        }
      }
    }
    setAnchor(null);
    setActiveRow(null);
  };

  return (
    <Box sx={{ width: '100%' }}>
        {/* Toolbar */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2.5 }}>
          <TextField
            fullWidth size="small"
            placeholder={searchPlaceholder}
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
              sx: { borderRadius: 1.5 },
            }}
          />
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
            {selected.length > 0 && (
              <Button size="small" variant="outlined" color="error" startIcon={<Delete />}
                sx={{ whiteSpace: 'nowrap' }}
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to permanently delete ${selected.length} records?`)) {
                    try {
                      await Promise.all(selected.map(id => {
                        const row = entries.find(r => r.doc_id === id);
                        const coll = row?.collection || collectionName;
                        return dataAPI.deleteRecord(coll, id);
                      }));
                      setEntries(prev => prev.filter(r => !selected.includes(r.doc_id)));
                      setSelected([]);
                      notify(`${selected.length} items deleted permanently`);
                    } catch (err) {
                      notify('Failed to delete some items', 'error');
                    }
                  }
                }}>
                Del ({selected.length})
              </Button>
            )}
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={() => {
                  const { uid, userId } = getUser();
                  const id = uid || userId;
                  if (id) invalidateVaultCache(id, resolveCacheKey);
                  fetchData({ force: true, silent: hasEntriesRef.current });
                }}
                sx={{ flexShrink: 0, opacity: refreshing ? 0.5 : 1 }}
              >
                <Refresh fontSize="small" sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filter by date">
              <IconButton size="small" onClick={() => setShowDateFilter(v => !v)}
                sx={{ flexShrink: 0, color: (dateFrom || dateTo) ? AC : 'inherit' }}>
                <CalendarIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {!isMobile && (
              <Tooltip title="Export CSV">
                <IconButton size="small" onClick={exportCSV} sx={{ flexShrink: 0 }}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <FormControl size="small" sx={{ minWidth: 90, flexShrink: 0 }}>
              <Select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(0); }}
                sx={{ borderRadius: 1.5, fontSize: '0.85rem' }}
              >
                {PAGE_SIZE_OPTIONS.map(n => (
                  <MenuItem key={n} value={n}>{n}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {showDateFilter && (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <TextField size="small" type="date" label="From" value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              sx={{ borderRadius: 1.5, minWidth: 140, flex: 1 }}
            />
            <TextField size="small" type="date" label="To" value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              sx={{ borderRadius: 1.5, minWidth: 140, flex: 1 }}
            />
            {(dateFrom || dateTo) && (
              <Button size="small" variant="text" onClick={() => { setDateFrom(''); setDateTo(''); setPage(0); }}>
                Clear
              </Button>
            )}
          </Stack>
        )}

        {loadError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} action={<Button color="inherit" size="small" onClick={() => fetchData({ force: true })}>Retry</Button>}>
            Could not load records. Try refreshing.
          </Alert>
        )}

        {/* Content */}
        {initialLoading ? (
          <Box sx={{ px: 1, pt: 1 }}>
            {[...Array(5)].map((_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, py: 0.5 }}>
                <Skeleton variant="rectangular" width={18} height={18} sx={{ borderRadius: '4px', bgcolor: 'rgba(17, 17, 17,0.07)', flexShrink: 0 }} />
                <Skeleton variant="text" sx={{ flex: 1, height: 20, bgcolor: 'rgba(17, 17, 17, 0.05)' }} />
                <Skeleton variant="circular" width={28} height={28} sx={{ bgcolor: 'rgba(17, 17, 17, 0.05)', flexShrink: 0 }} />
              </Box>
            ))}
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 4, px: 0.5 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a' }}>
              {filter ? 'No matching rows' : emptyTitle}
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: '#888', mt: 0.5 }}>
              {filter ? `Nothing matches “${filter}”.` : emptySubtitle}
            </Typography>
          </Box>
        ) : (
        <Box sx={{ opacity: refreshing ? 0.92 : 1, transition: 'opacity 0.15s ease' }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: isMobile ? 640 : 720 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(17,17,17,0.03)' }}>
                  <TableCell padding="checkbox" sx={{ width: 44 }}>
                    <Checkbox
                      size="small"
                      indeterminate={selected.length > 0 && selected.length < filtered.length}
                      checked={filtered.length > 0 && selected.length === filtered.length}
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  {columns.map(col => (
                    <TableCell
                      key={col.id}
                      sortDirection={orderBy === col.id ? order : false}
                      sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'rgba(17,17,17,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
                    >
                      {col.sortable !== false ? (
                        <TableSortLabel
                          active={orderBy === col.id}
                          direction={orderBy === col.id ? order : 'asc'}
                          onClick={() => handleSort(col.id)}
                        >
                          {col.label}
                        </TableSortLabel>
                      ) : (
                        col.label
                      )}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ width: 52, px: 1 }} aria-label="Actions" />
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(row => (
                  <TableRow
                    key={row.doc_id}
                    hover
                    selected={selected.includes(row.doc_id)}
                    sx={{
                      cursor: 'pointer',
                      '&:last-child td': { borderBottom: 0 },
                      '&:hover': { bgcolor: 'rgba(232,160,32,0.04)' },
                    }}
                    onClick={() => handleView(row.doc_id, row)}
                  >
                    <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        size="small"
                        checked={selected.includes(row.doc_id)}
                        onChange={() => toggleSelect(row.doc_id)}
                      />
                    </TableCell>
                    {columns.map(col => (
                      <TableCell key={col.id} sx={{ fontSize: '0.875rem', color: '#1a1a1a', verticalAlign: 'middle', maxWidth: isMobile ? 180 : 280 }}>
                        {col.render ? col.render(row) : (row[col.id] || '—')}
                      </TableCell>
                    ))}
                    <TableCell align="right" onClick={e => e.stopPropagation()} sx={{ whiteSpace: 'nowrap', width: 52, px: 0.5 }}>
                      <Tooltip title="Actions">
                        <IconButton
                          size="small"
                          aria-label="Open actions"
                          onClick={e => {
                            setAnchor(e.currentTarget);
                            setActiveRow(row);
                          }}
                        >
                          <MoreVert sx={{ fontSize: 18, color: 'rgba(17,17,17,0.55)' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        )}

        {filtered.length > perPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, pt: 2, borderTop: '1px solid rgba(17, 17, 17, 0.05)' }}>
            <ReactPaginate
              previousLabel="Prev" nextLabel="Next" breakLabel="..."
              pageCount={Math.ceil(filtered.length / perPage)}
              forcePage={page}
              marginPagesDisplayed={isMobile ? 0 : 1} pageRangeDisplayed={isMobile ? 2 : 3}
              onPageChange={({ selected: p }) => setPage(p)}
              containerClassName="pagination" activeClassName="active"
              previousClassName="page-item" nextClassName="page-item"
              pageClassName="page-item" breakClassName="page-item"
              pageLinkClassName="page-link" previousLinkClassName="page-link"
              nextLinkClassName="page-link" breakLinkClassName="page-link"
              activeLinkClassName="active-link"
            />
          </Box>
        )}

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { background: 'transparent', border: '1px solid rgba(17, 17, 17, 0.1)', borderRadius: 1.5, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: 160 } }}>
        <MenuItem onClick={() => handleMenuAction('view')} sx={{ fontSize: '0.875rem', py: 1, color: '#111111' }}>
          <ListItemIcon><Visibility fontSize="small" sx={{ color: '#E8A020' }} /></ListItemIcon> View
        </MenuItem>
        {activeRow && getAssetDownloadUrl(activeRow) && (
          <MenuItem onClick={() => handleMenuAction('download')} sx={{ fontSize: '0.875rem', py: 1, color: '#111111' }}>
            <ListItemIcon><DownloadIcon fontSize="small" sx={{ color: '#C47F10' }} /></ListItemIcon> Download
          </MenuItem>
        )}
        {activeRow && !isProcessingStatus(activeRow.status) && (
          <MenuItem onClick={() => handleMenuAction('redo')} sx={{ fontSize: '0.875rem', py: 1, color: '#111111' }}>
            <ListItemIcon><Replay fontSize="small" sx={{ color: '#C47F10' }} /></ListItemIcon>
            {String(activeRow.status || '').toLowerCase() === 'failed' ? 'Retry' : 'Redo'}
          </MenuItem>
        )}
        <MenuItem onClick={() => handleMenuAction('share')} sx={{ fontSize: '0.875rem', py: 1, color: '#111111' }}>
          <ListItemIcon><Share fontSize="small" sx={{ color: '#C47F10' }} /></ListItemIcon> Share Link
        </MenuItem>
        <Divider sx={{ opacity: 0.1 }} />
        <MenuItem onClick={() => handleMenuAction('delete')} sx={{ fontSize: '0.875rem', py: 1, color: '#f43f5e' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon> Delete Forever
        </MenuItem>
      </Menu>

      <Snackbar open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.sev} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: '12px' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
