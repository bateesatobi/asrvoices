import { useState, useEffect, useCallback } from 'react';
import { subscriptionAPI } from '../services/api';

export default function useStudioUser() {
  const [userId, setUserId] = useState(null);
  const [balance, setBalance] = useState(null);

  const refreshBalance = useCallback(() => {
    if (!userId) return;
    subscriptionAPI
      .getBalance(userId)
      .then((data) => setBalance(data.balance ?? data.credit_balance ?? null))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    try {
      const user = JSON.parse(stored);
      setUserId(user.uid || user.userId || null);
    } catch {
      setUserId(null);
    }
  }, []);

  useEffect(() => {
    refreshBalance();
    const onRefresh = () => refreshBalance();
    window.addEventListener('refresh-balance', onRefresh);
    return () => window.removeEventListener('refresh-balance', onRefresh);
  }, [refreshBalance]);

  return { userId, balance, refreshBalance };
}
