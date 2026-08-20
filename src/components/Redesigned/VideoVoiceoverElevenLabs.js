import React, { useState } from 'react';
import { Box } from '@mui/material';
import { VideoLibrary, RecordVoiceOver } from '@mui/icons-material';
import { ElevenLabsTabs } from '../ElevenLabsUI';
import VideoDubbingElevenLabs from './VideoDubbingElevenLabs';
import VoiceoverElevenLabs from './VoiceoverElevenLabs';

const MAIN_TABS = [
  { label: 'Video dubbing', icon: <VideoLibrary fontSize="small" /> },
  { label: 'Voiceover', icon: <RecordVoiceOver fontSize="small" /> },
];

export default function VideoVoiceoverElevenLabs({ userId, initialTab = 0 }) {
  const [mainTab, setMainTab] = useState(initialTab);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 1, flexShrink: 0 }}>
        <ElevenLabsTabs value={mainTab} onChange={(_, v) => setMainTab(v)} tabs={MAIN_TABS} />
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {mainTab === 0 ? (
          <VideoDubbingElevenLabs userId={userId} />
        ) : (
          <VoiceoverElevenLabs userId={userId} />
        )}
      </Box>
    </Box>
  );
}
