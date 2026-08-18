import React from 'react';
import ResultsTable from './ResultsTable';
import VaultDateCell from './VaultDateCell';
import { TitleCell, StatusChip, LangChip, MetaText } from './vault/VaultTableCells';
import { getProcessingStartedAt } from '../utils/mediaVault';
import { formatDurationMins, defaultVaultSearch } from '../utils/mediaVault';
import { dataAPI } from '../services/api';
import { VAULT_CACHE_KEYS } from '../utils/vaultCache';

const fetchAudios = (id) => dataAPI.getAudios(id);

const columns = [
  {
    id: 'title', label: 'Title', sortable: true,
    render: row => (
      <TitleCell
        row={row}
        subtitle={row.fileName ? `File · ${row.fileName}` : undefined}
      />
    ),
  },
  {
    id: 'source_lang', label: 'Language', sortable: false,
    render: row => <LangChip code={row.source_lang} />,
  },
  {
    id: 'response_format', label: 'Format', sortable: false,
    render: row => <MetaText>{(row.response_format || 'json').toUpperCase()}</MetaText>,
  },
  {
    id: 'duration', label: 'Length', sortable: true,
    render: row => <MetaText>{formatDurationMins(row.duration) || '—'}</MetaText>,
  },
  {
    id: 'status', label: 'Status', sortable: true,
    render: row => (
      <StatusChip status={row.status} startedAt={getProcessingStartedAt(row)} progress={row.progress} />
    ),
  },
  {
    id: 'Date', label: 'Date', sortable: true,
    render: row => <VaultDateCell row={row} dateKey="Date" />,
  },
];

export default function DataTable({ refreshKey }) {
  return (
    <ResultsTable
      fetchFn={fetchAudios}
      cacheKey={VAULT_CACHE_KEYS.transcription}
      columns={columns}
      viewPath={id => `/dashboard/audio/${id}`}
      collectionName="audio_store"
      studioPath="/dashboard/transcribe"
      emptyActionLabel="Open Transcribe Studio"
      searchFilter={defaultVaultSearch}
      searchPlaceholder="Search transcripts…"
      emptyTitle="No transcriptions yet"
      emptySubtitle="Upload or record audio to get your first transcription."
      dateKey="Date"
      sortKey="Date"
      refreshKey={refreshKey}
    />
  );
}
