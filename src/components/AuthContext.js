import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { provisionUserAccount, provisionStoredUser, clearStaleAuthSession, markExplicitLogout, clearExplicitLogout, hasExplicitLogout } from '../utils/provisionUser';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const isSessionValid = () => {
  const user = localStorage.getItem('user');
  const loginAt = localStorage.getItem('loginAt');
  if (!user || !loginAt) return false;
  return Date.now() - parseInt(loginAt, 10) < SESSION_DURATION;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isSessionValid());

  const logout = useCallback(async () => {
    markExplicitLogout();
    setIsAuthenticated(false);
    await clearStaleAuthSession();
  }, []);

  // Check session expiry on mount and every minute
  useEffect(() => {
    if (isAuthenticated && !isSessionValid()) {
      logout();
    }
    const interval = setInterval(() => {
      if (isAuthenticated && !isSessionValid()) logout();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(isSessionValid());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Restore a Firebase session only when the user did not explicitly log out.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return;
      if (hasExplicitLogout()) {
        try {
          await signOut(auth);
        } catch (_) {
          /* ignore */
        }
        return;
      }
      try {
        const result = await provisionUserAccount(firebaseUser, { notify: false });
        if (hasExplicitLogout() || !result) return;
        setIsAuthenticated(true);
      } catch (err) {
        console.warn('[Auth] provision on auth state change failed:', err);
      }
    });
    return () => unsubscribe();
  }, []);

  // Backfill credits for users with a valid local session but no fresh Firebase popup
  useEffect(() => {
    if (hasExplicitLogout() || !isSessionValid()) return;
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    provisionStoredUser({ notify: false }).catch(() => {});
  }, [isAuthenticated]);

  const login = (userData) => {
    clearExplicitLogout();
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('loginAt', Date.now().toString());
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};