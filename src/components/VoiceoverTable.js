import React from 'react';
import ResultsTable from './ResultsTable';
import VaultDateCell from './VaultDateCell';
import { TitleCell, StatusChip, MetaText } from './vault/VaultTableCells';
import { getProcessingStartedAt } from '../utils/mediaVault';
import { defaultVaultSearch } from '../utils/mediaVault';
import { dataAPI } from '../services/api';
import { VAULT_CACHE_KEYS } from '../utils/vaultCache';

const fetchVoiceovers = (id) => dataAPI.getVoiceovers(id);

const columns = [
  {
    id: 'title', label: 'Project', sortable: true,
    render: row => <TitleCell row={row} subtitle={row.total_blocks ? `${row.total_blocks} blocks` : undefined} />,
  },
  {
    id: 'successful', label: 'Progress', sortable: false,
    render: row => (
      <MetaText>
        {row.successful != null && row.total_blocks != null
          ? `${row.successful} / ${row.total_blocks} rendered`
          : '—'}
      </MetaText>
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

export default function VoiceoverTable({ refreshKey }) {
  return (
    <ResultsTable
      fetchFn={fetchVoiceovers}
      cacheKey={VAULT_CACHE_KEYS.voiceover}
      columns={columns}
      viewPath={(id) => `/dashboard/voiceover/${id}`}
      collectionName="voiceover_store"
      studioPath="/dashboard/voiceovers"
      emptyActionLabel="Open Voiceover Studio"
      searchFilter={defaultVaultSearch}
      searchPlaceholder="Search voiceovers…"
      emptyTitle="No voiceovers yet"
      emptySubtitle="Create narration or slideshow voiceovers in the Voiceover studio."
      refreshKey={refreshKey}
    />
  );
}
