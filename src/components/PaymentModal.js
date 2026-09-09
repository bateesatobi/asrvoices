/**
 * Legacy Stripe subscription checkout — retired for live credit packs.
 * Studio uses PesapalCheckoutForm via SubscriptionComponent / UpgradePromptModal.
 * Kept as a no-op shim so any stale import does not crash the bundle.
 */
import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, Button, DialogActions } from '@mui/material';

const PaymentModal = ({ open, onClose }) => (
  <Dialog open={Boolean(open)} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Credits checkout moved</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary">
        Card checkout via Stripe is no longer used. Buy a credit pack with Pesapal
        from Credits in the dashboard.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default PaymentModal;
