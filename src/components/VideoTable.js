import React from 'react';
import { Chip } from '@mui/material';
import ResultsTable from './ResultsTable';
import VaultDateCell from './VaultDateCell';
import { TitleCell, StatusChip, LangChip } from './vault/VaultTableCells';
import { getProcessingStartedAt } from '../utils/mediaVault';
import { defaultVaultSearch } from '../utils/mediaVault';
import { dataAPI } from '../services/api';
import { VAULT_CACHE_KEYS } from '../utils/vaultCache';

const fetchVideos = (id) => dataAPI.getVideos(id);

const columns = [
  {
    id: 'title', label: 'Title', sortable: true,
    render: row => (
      <TitleCell
        row={row}
        subtitle={row.type ? String(row.type) : 'Video transcription'}
      />
    ),
  },
  {
    id: 'source_lang', label: 'Language', sortable: false,
    render: row => <LangChip code={row.source_lang} />,
  },
  {
    id: 'type', label: 'Source', sortable: false,
    render: row => (
      <Chip label={row.type || 'Upload'} size="small" variant="outlined" sx={{ fontSize: '0.72rem', height: 22 }} />
    ),
  },
  {
    id: 'status', label: 'Status', sortable: true,
    render: row => (
      <StatusChip status={row.status} startedAt={getProcessingStartedAt(row)} progress={row.progress} />
    ),
  },
  {
    id: 'date', label: 'Date', sortable: true,
    render: row => <VaultDateCell row={row} />,
  },
];

export default function VideoTable({ refreshKey }) {
  return (
    <ResultsTable
      fetchFn={fetchVideos}
      cacheKey={VAULT_CACHE_KEYS.video}
      columns={columns}
      viewPath={id => `/dashboard/video/${id}`}
      collectionName="video_store"
      studioPath="/dashboard/transcribe"
      emptyActionLabel="Open Transcribe Studio"
      searchFilter={defaultVaultSearch}
      searchPlaceholder="Search videos…"
      emptyTitle="No videos processed yet"
      emptySubtitle="Submit a YouTube link or video file to get started."
      refreshKey={refreshKey}
    />
  );
}
