import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Mic, Videocam } from '@mui/icons-material';
import DataTable from '../DataTable';
import VideoTable from '../VideoTable';
import TextTable from '../TextTable';
import TranslationsTable from '../TranslationsTable';
import SummaryTable from '../SummaryTable';
import DubbedVideosTable from '../DubbedVideosTable';
import VoiceoverTable from '../VoiceoverTable';
import { ElevenLabsTabs } from '../ElevenLabsUI';

const SERVICE_TABLES = {
  transcription: {
    title: 'History',
    tables: [
      { id: 'audio', Component: DataTable, label: 'Audio', icon: <Mic fontSize="small" /> },
      { id: 'video', Component: VideoTable, label: 'Video', icon: <Videocam fontSize="small" /> },
    ],
  },
  tts: { Component: TextTable, title: 'History' },
  translation: { Component: TranslationsTable, title: 'History' },
  summary: { Component: SummaryTable, title: 'History' },
  dubbing: { Component: DubbedVideosTable, title: 'History' },
  voiceover: { Component: VoiceoverTable, title: 'History' },
};

/**
 * Flat history table for studio pages — one list, no nested cards.
 */
export default function StudioHistorySection({ sourceId, title }) {
  const config = SERVICE_TABLES[sourceId];
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyTab, setHistoryTab] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener('library-updated', refresh);
    return () => window.removeEventListener('library-updated', refresh);
  }, []);

  if (!config) return null;

  const { Component, tables, title: defaultTitle } = config;

  return (
    <Box
      data-tour="studio-history"
      sx={{ mt: 4, pt: 2.5, borderTop: '1px solid #ececec', width: '100%' }}
    >
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          mb: 1.5,
        }}
      >
        {title || defaultTitle}
      </Typography>

      {tables?.length ? (
        <>
          <ElevenLabsTabs
            value={historyTab}
            onChange={(_, v) => setHistoryTab(v)}
            tabs={tables.map((t) => ({ label: t.label, icon: t.icon }))}
            sx={{ mb: 1.5 }}
          />
          {React.createElement(tables[historyTab]?.Component || tables[0].Component, { refreshKey })}
        </>
      ) : (
        <Component refreshKey={refreshKey} />
      )}
    </Box>
  );
}
