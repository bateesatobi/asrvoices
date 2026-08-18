import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import VideoVoiceoverElevenLabs from '../components/Redesigned/VideoVoiceoverElevenLabs';

const DubbingView = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserId(user.uid || user.userId);
  }, []);

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 0, background: 'transparent' }}>
      {userId && <VideoVoiceoverElevenLabs userId={userId} />}
    </Box>
  );
};

export default DubbingView;
