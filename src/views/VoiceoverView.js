import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import VoiceoverElevenLabs from '../components/Redesigned/VoiceoverElevenLabs';

const VoiceoverView = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserId(user.uid || user.userId);
  }, []);

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 0, background: 'transparent' }}>
      {userId && <VoiceoverElevenLabs userId={userId} />}
    </Box>
  );
};

export default VoiceoverView;
