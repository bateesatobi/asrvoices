import React from 'react';
import { Box, Typography, IconButton, Chip, CircularProgress } from '@mui/material';
import { Refresh, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useStudioHistory from '../../hooks/useStudioHistory';
import {
  getHistoryTitle,
  getHistorySubtitle,
  getHistoryViewPath,
  getHistoryItemId,
} from '../../utils/historyHelpers';
import { isProcessingStatus } from '../../utils/mediaVault';

export default function StudioHistoryPanel({
  userId,
  sourceId,
  fetchFn,
  panelTab,
  historyTabIndex = 1,
  emptyMessage = 'No items yet',
  onItemClick,
}) {
  const navigate = useNavigate();
  const { items, loading, error, refresh } = useStudioHistory({
    userId,
    sourceId,
    fetchFn,
    panelTab,
    historyTabIndex,
  });

  if (loading && items.length === 0) {
    return (
      <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <CircularProgress size={24} sx={{ color: '#E8A020' }} />
        <Typography sx={{ fontSize: '0.8125rem', color: '#999' }}>Loading history…</Typography>
      </Box>
    );
  }

  if (error && items.length === 0) {
    return (
      <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.875rem', color: '#999', mb: 1.5 }}>{error}</Typography>
        <IconButton size="small" onClick={refresh} sx={{ color: '#666' }}>
          <Refresh fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  if (!items.length) {
    return (
      <Typography sx={{ fontSize: '0.875rem', color: '#999', py: 4, textAlign: 'center', px: 2 }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Box sx={{ py: 0.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, pb: 0.5 }}>
        <IconButton size="small" onClick={refresh} disabled={loading} sx={{ color: '#999' }} aria-label="Refresh history">
          <Refresh fontSize="small" />
        </IconButton>
      </Box>
      {items.map((item) => {
        const id = getHistoryItemId(item);
        const viewPath = getHistoryViewPath(item, sourceId);
        const processing = isProcessingStatus(item._status || item.status);
        return (
          <Box
            key={id || getHistoryTitle(item, sourceId)}
            onClick={() => {
              if (onItemClick) {
                onItemClick(item);
                return;
              }
              if (viewPath) navigate(viewPath);
            }}
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid #f0f0f0',
              cursor: viewPath || onItemClick ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': viewPath || onItemClick ? { bgcolor: '#fafafa' } : {},
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1a1a' }} noWrap>
                  {getHistoryTitle(item, sourceId)}
                </Typography>
                {processing && (
                  <Chip
                    label="Processing"
                    size="small"
                    sx={{ height: 18, fontSize: '0.625rem', bgcolor: 'rgba(232,160,32,0.12)', color: '#C47F10' }}
                  />
                )}
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#999' }} noWrap>
                {getHistorySubtitle(item, sourceId)}
              </Typography>
            </Box>
            {(viewPath || onItemClick) && <ChevronRight sx={{ fontSize: 18, color: '#ccc', flexShrink: 0 }} />}
          </Box>
        );
      })}
    </Box>
  );
}
