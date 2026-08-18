import React from 'react';
import { Chip, Stack } from '@mui/material';
import ResultsTable from './ResultsTable';
import VaultDateCell from './VaultDateCell';
import { TitleCell, StatusChip, MetaText } from './vault/VaultTableCells';
import { getProcessingStartedAt } from '../utils/mediaVault';
import {
  formatDurationMins, defaultVaultSearch, getDubbingDisplayTitle, getDubbingTargetLangs, langLabel,
} from '../utils/mediaVault';
import { dataAPI } from '../services/api';
import { VAULT_CACHE_KEYS } from '../utils/vaultCache';

const fetchDubbed = (id) => dataAPI.getDubbedVideos(id);

const columns = [
  {
    id: 'title', label: 'Project', sortable: true,
    render: row => (
      <TitleCell
        row={row}
        titleOverride={getDubbingDisplayTitle(row)}
        subtitle={
          row.segments?.length
            ? `${row.segments.length} dubbed segment${row.segments.length !== 1 ? 's' : ''}`
            : undefined
        }
      />
    ),
  },
  {
    id: 'target_lang', label: 'Languages', sortable: false,
    render: row => {
      const langs = getDubbingTargetLangs(row);
      if (!langs.length) return <MetaText>—</MetaText>;
      return (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {langs.slice(0, 3).map(l => (
            <Chip key={l} label={langLabel(l)} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
          ))}
          {langs.length > 3 && (
            <Chip label={`+${langs.length - 3}`} size="small" sx={{ fontSize: '0.7rem', height: 22 }} />
          )}
        </Stack>
      );
    },
  },
  {
    id: 'video_duration_mins', label: 'Length', sortable: true,
    render: row => <MetaText>{formatDurationMins(row.video_duration_mins) || '—'}</MetaText>,
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

export default function DubbedVideosTable({ refreshKey }) {
  return (
    <ResultsTable
      fetchFn={fetchDubbed}
      cacheKey={VAULT_CACHE_KEYS.dubbing}
      columns={columns}
      viewPath={(id) => `/dashboard/dub/${id}`}
      collectionName="dubbing_store"
      studioPath="/dashboard/dubbing"
      emptyActionLabel="Open Dubbing Studio"
      searchFilter={defaultVaultSearch}
      searchPlaceholder="Search dubbed videos…"
      emptyTitle="No dubbed videos processed yet"
      emptySubtitle="Go to the Neural Dubbing studio and start dubbing video files."
      refreshKey={refreshKey}
    />
  );
}
