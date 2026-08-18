import React from 'react';
import { Box } from '@mui/material';
import VoiceCloningComponent from '../components/VoiceCloningComponent';
import VoiceCloningElevenLabs from '../components/Redesigned/VoiceCloningElevenLabs';

export default function VoiceCloning() {
  // Use the new ElevenLabs-style design
  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <VoiceCloningElevenLabs />
    </Box>
  );
}
