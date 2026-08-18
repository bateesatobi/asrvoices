import React from 'react';
import { Box } from '@mui/material';
import VoicesElevenLabs from '../components/Redesigned/VoicesElevenLabs';

export default function VoicesView() {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: 'transparent' }}>
      <VoicesElevenLabs />
    </Box>
  );
}
