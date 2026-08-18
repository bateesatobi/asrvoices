import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const ResultViewSnackbar = ({ open, message, severity = 'success', onClose }) => (
  <Snackbar
    open={open}
    autoHideDuration={2500}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  >
    <Alert severity={severity} onClose={onClose} sx={{ borderRadius: '12px', fontWeight: 600 }}>
      {message}
    </Alert>
  </Snackbar>
);

export default ResultViewSnackbar;
