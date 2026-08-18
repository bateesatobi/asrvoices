import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import DashboardHomeElevenLabs from '../components/Redesigned/DashboardHomeElevenLabs';

const DashboardHomeView = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserId(userData.uid || userData.userId);
      } catch (e) {
        console.error('Failed to parse user for DashboardHomeView', e);
      }
    }
  }, []);

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: 'transparent' }}>
      {userId ? <DashboardHomeElevenLabs userId={userId} /> : null}
    </Box>
  );
};

export default DashboardHomeView;
