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
    title: 'Transcription history',
    tables: [
      { id: 'audio', Component: DataTable, label: 'Audio', icon: <Mic fontSize="small" /> },
      { id: 'video', Component: VideoTable, label: 'Video', icon: <Videocam fontSize="small" /> },
    ],
  },
  tts: { Component: TextTable, title: 'Speech history' },
  translation: { Component: TranslationsTable, title: 'Translation history' },
  summary: { Component: SummaryTable, title: 'Summary history' },
  dubbing: { Component: DubbedVideosTable, title: 'Dubbing history' },
  voiceover: { Component: VoiceoverTable, title: 'Voiceover history' },
};

/**
 * Full history table for studio main body — latest entries first (via ResultsTable default sort).
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

  if (tables?.length) {
    const activeTable = tables[historyTab] || tables[0];
    const TableComponent = activeTable.Component;
    const tabItems = tables.map((t) => ({ label: t.label, icon: t.icon }));

    return (
      <Box
        data-tour="studio-history"
        sx={{ mt: 4, pt: 3, borderTop: '1px solid #f0f0f0', width: '100%' }}
      >
        <Typography
          sx={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            mb: 2,
          }}
        >
          {title || defaultTitle}
        </Typography>

        <ElevenLabsTabs
          value={historyTab}
          onChange={(_, v) => setHistoryTab(v)}
          tabs={tabItems}
          sx={{ mb: 2 }}
        />

        <TableComponent refreshKey={refreshKey} />
      </Box>
    );
  }

  return (
    <Box
      data-tour="studio-history"
      sx={{ mt: 4, pt: 3, borderTop: '1px solid #f0f0f0', width: '100%' }}
    >
      <Typography
        sx={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          mb: 2,
        }}
      >
        {title || defaultTitle}
      </Typography>
      <Component refreshKey={refreshKey} />
    </Box>
  );
}
