import React from 'react';
import ResultsTable from './ResultsTable';
import VaultDateCell from './VaultDateCell';
import { TitleCell, StatusChip, LangChip, MetaText } from './vault/VaultTableCells';
import { getProcessingStartedAt } from '../utils/mediaVault';
import { defaultVaultSearch, truncateText } from '../utils/mediaVault';
import { dataAPI } from '../services/api';
import { VAULT_CACHE_KEYS } from '../utils/vaultCache';

const fetchTts = (id) => dataAPI.getVocifyVoices(id);

const columns = [
  {
    id: 'title', label: 'Title', sortable: true,
    render: row => <TitleCell row={row} />,
  },
  {
    id: 'source_lang', label: 'Language', sortable: false,
    render: row => <LangChip code={row.source_lang} />,
  },
  {
    id: 'original_text', label: 'Script', sortable: false,
    render: row => <MetaText>{truncateText(row.original_text, 64)}</MetaText>,
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

export default function TextTable({ refreshKey }) {
  return (
    <ResultsTable
      fetchFn={fetchTts}
      cacheKey={VAULT_CACHE_KEYS.tts}
      columns={columns}
      viewPath={id => `/dashboard/tts/${id}`}
      collectionName="vocify"
      studioPath="/dashboard/synthesize"
      emptyActionLabel="Open Synthesis Studio"
      searchFilter={defaultVaultSearch}
      searchPlaceholder="Search speech files…"
      emptyTitle="No text-to-speech files yet"
      emptySubtitle="Generate speech from text and your files will appear here."
      refreshKey={refreshKey}
    />
  );
}
