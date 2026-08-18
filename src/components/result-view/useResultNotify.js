import { useState, useCallback } from 'react';

/** Shared snackbar state for result detail views. */
export default function useResultNotify() {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const notify = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeNotify = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return { snackbar, notify, closeNotify };
}
