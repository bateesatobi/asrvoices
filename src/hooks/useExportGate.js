import { useCallback } from 'react';
import { subscriptionAPI, getCurrentUser } from '../services/api';
import useStudioUser from './useStudioUser';

/** Minimum balance required to copy or download exported content. */
export const MIN_EXPORT_CREDITS = 0.01;

const BLOCK_MESSAGE =
  'Insufficient credits to copy or download. Please top up your balance to export results.';

function dispatchExportBlocked(action = 'export') {
  window.dispatchEvent(
    new CustomEvent('subscription-limit-exceeded', {
      detail: { message: BLOCK_MESSAGE, status: 402, action },
    })
  );
}

/**
 * Gate copy/download actions behind an active credit balance.
 * Opens the upgrade modal via `subscription-limit-exceeded` when blocked.
 */
export default function useExportGate() {
  const { balance, refreshBalance } = useStudioUser();

  const resolveBalance = useCallback(async () => {
    if (balance != null && !Number.isNaN(Number(balance))) {
      return Number(balance);
    }
    const { userId } = getCurrentUser();
    if (!userId) return null;
    try {
      const data = await subscriptionAPI.getBalance(userId);
      const bal = data.balance ?? data.credit_balance ?? 0;
      refreshBalance();
      return Number(bal);
    } catch {
      return null;
    }
  }, [balance, refreshBalance]);

  const ensureCredits = useCallback(async () => {
    const bal = await resolveBalance();
    if (bal == null || Number.isNaN(bal)) {
      dispatchExportBlocked();
      return false;
    }
    if (bal >= MIN_EXPORT_CREDITS) return true;
    dispatchExportBlocked();
    return false;
  }, [resolveBalance]);

  const gateAction = useCallback(
    (fn) =>
      async (...args) => {
        if (!(await ensureCredits())) return false;
        return fn(...args);
      },
    [ensureCredits]
  );

  const copyText = useCallback(
    async (text, onNotify) => {
      if (!text) return false;
      if (!(await ensureCredits())) return false;
      try {
        await navigator.clipboard.writeText(text);
        onNotify?.('Copied to clipboard', 'success');
        return true;
      } catch {
        onNotify?.('Failed to copy', 'error');
        return false;
      }
    },
    [ensureCredits]
  );

  const downloadBlob = useCallback(
    async (content, filename, mimeType = 'text/plain', onNotify) => {
      if (!(await ensureCredits())) return false;
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename || 'download.txt';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      onNotify?.('Download started', 'success');
      return true;
    },
    [ensureCredits]
  );

  const downloadUrl = useCallback(
    async (url, onNotify) => {
      if (!url) return false;
      if (!(await ensureCredits())) return false;
      const link = document.createElement('a');
      link.href = decodeURIComponent(url);
      link.download = '';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onNotify?.('Download started', 'success');
      return true;
    },
    [ensureCredits]
  );

  const creditsKnown = balance != null && !Number.isNaN(Number(balance));
  const hasCredits = !creditsKnown || Number(balance) >= MIN_EXPORT_CREDITS;
  const lowCredits = creditsKnown && Number(balance) < MIN_EXPORT_CREDITS;

  return {
    balance,
    hasCredits,
    lowCredits,
    creditsKnown,
    canExport: hasCredits,
    exportBlockedTitle: 'Add credits to copy or download',
    ensureCredits,
    gateAction,
    copyText,
    downloadBlob,
    downloadUrl,
  };
}
