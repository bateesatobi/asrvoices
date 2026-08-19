import React from 'react';
import ResultsTable from './ResultsTable';
import VaultDateCell from './VaultDateCell';
import { TitleCell, LangPair, MetaText } from './vault/VaultTableCells';
import { defaultVaultSearch, truncateText } from '../utils/mediaVault';
import { dataAPI } from '../services/api';
import { VAULT_CACHE_KEYS } from '../utils/vaultCache';

const fetchTranslations = (id) => dataAPI.getTranslations(id);

function translationPreview(row) {
  const trans = row.translations || {};
  const first = Object.values(trans)[0];
  if (typeof first === 'string') return truncateText(first, 56);
  if (Array.isArray(first)) return truncateText(first.map(t => t?.text).filter(Boolean).join(' '), 56);
  return truncateText(row.original_text, 56);
}

const columns = [
  {
    id: 'title', label: 'Title', sortable: true,
    render: row => <TitleCell row={row} />,
  },
  {
    id: 'languages', label: 'Languages', sortable: false,
    render: row => (
      <LangPair
        source={row.source_lang}
        target={row.target_lang || row.target_langs?.[0]}
      />
    ),
  },
  {
    id: 'preview', label: 'Preview', sortable: false,
    render: row => <MetaText>{translationPreview(row)}</MetaText>,
  },
  {
    id: 'date', label: 'Date', sortable: true,
    render: row => <VaultDateCell row={row} />,
  },
];

export default function TranslationsTable({ refreshKey }) {
  return (
    <ResultsTable
      fetchFn={fetchTranslations}
      cacheKey={VAULT_CACHE_KEYS.translation}
      columns={columns}
      viewPath={id => `/dashboard/ttdata/${id}`}
      collectionName="text_store"
      studioPath="/dashboard/translate"
      emptyActionLabel="Open Translation Studio"
      searchFilter={defaultVaultSearch}
      searchPlaceholder="Search translations…"
      emptyTitle="No translations yet"
      emptySubtitle="Translate text or documents and your results will appear here."
      refreshKey={refreshKey}
    />
  );
}
