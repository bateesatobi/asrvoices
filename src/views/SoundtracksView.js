import React from 'react';
import { Box } from '@mui/material';
import SoundtracksElevenLabs from '../components/Redesigned/SoundtracksElevenLabs';

export default function SoundtracksView() {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: 'transparent' }}>
      <SoundtracksElevenLabs />
    </Box>
  );
}
