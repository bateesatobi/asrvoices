import { useState, useEffect, useCallback } from 'react';
import { normalizeHistoryRows } from '../utils/historyHelpers';

/**
 * Fetch + normalize history for a studio service panel tab.
 */
export default function useStudioHistory({
  userId,
  sourceId,
  fetchFn,
  panelTab = 0,
  historyTabIndex = 1,
  enabled = true,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!userId || !fetchFn) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFn(userId);
      setItems(normalizeHistoryRows(data, sourceId));
    } catch (e) {
      console.error(`[useStudioHistory] ${sourceId}`, e);
      setError('Could not load history');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchFn, sourceId]);

  useEffect(() => {
    if (enabled && panelTab === historyTabIndex) refresh();
  }, [enabled, panelTab, historyTabIndex, refresh]);

  useEffect(() => {
    const onUpdate = () => {
      if (panelTab === historyTabIndex) refresh();
    };
    window.addEventListener('library-updated', onUpdate);
    return () => window.removeEventListener('library-updated', onUpdate);
  }, [panelTab, historyTabIndex, refresh]);

  return { items, loading, error, refresh };
}
