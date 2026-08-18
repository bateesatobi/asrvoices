import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';

const GOLD = '#E8A020';

/**
 * ElevenLabs-style tabs component
 * Clean horizontal tabs matching the Transcriptions/Speakers design
 */
export default function ElevenLabsTabs({ value, onChange, tabs, sx = {} }) {
  return (
    <Box sx={{ borderBottom: '1px solid #e8e8e8', ...sx }}>
      <Tabs
        value={value}
        onChange={onChange}
        sx={{
          minHeight: 'auto',
          '& .MuiTabs-indicator': {
            height: 2,
            bgcolor: '#1a1a1a',
            borderRadius: '2px 2px 0 0',
          },
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
            disabled={tab.disabled}
            sx={{
              minHeight: 'auto',
              py: 2,
              px: 2.5,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#666',
              minWidth: 'auto',
              '&.Mui-selected': {
                color: '#1a1a1a',
              },
              '&:hover': {
                color: '#1a1a1a',
                bgcolor: 'rgba(0,0,0,0.02)',
              },
              '& .MuiTab-iconWrapper': {
                mr: 1,
                fontSize: 18,
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
}
