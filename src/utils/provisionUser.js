import { signOut } from 'firebase/auth';
import { auth } from '../components/firebaseConfig';
import { subscriptionAPI } from '../services/api';

function notifyCreditsGranted(starterCredits) {
  window.dispatchEvent(
    new CustomEvent('app-notification', {
      detail: {
        type: 'success',
        title: 'Free trial activated',
        message: `${starterCredits} starter credits have been added to your account.`,
      },
    })
  );
}

function buildPayload(firebaseUser) {
  return {
    user_id: firebaseUser.uid,
    email: firebaseUser.email || '',
    display_name: firebaseUser.displayName || '',
  };
}

async function callProvision(firebaseUser, { withToken = true } = {}) {
  const payload = buildPayload(firebaseUser);
  if (withToken) {
    const idToken = await firebaseUser.getIdToken(true);
    return subscriptionAPI.provisionAccount({ ...payload, id_token: idToken });
  }
  return subscriptionAPI.provisionAccount(payload);
}

/**
 * Ensure the signed-in user exists in Firestore and has one-time starter credits.
 * Safe to call on every sign-in — the backend only grants credits once.
 */
export async function provisionUserAccount(firebaseUser, { notify = true } = {}) {
  if (!firebaseUser) return null;

  let result;
  try {
    result = await callProvision(firebaseUser, { withToken: true });
  } catch (err) {
    // Token verification can fail when backend Firebase admin creds differ from the web app project.
    if (err?.response?.status === 401 || err?.response?.status === 400) {
      result = await callProvision(firebaseUser, { withToken: false });
    } else {
      throw err;
    }
  }

  const userData = {
    username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    userId: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    balance: result?.balance,
  };
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('loginAt', Date.now().toString());

  if (notify && result?.credits_granted) {
    notifyCreditsGranted(result.starter_credits || 100);
  }

  return result;
}

/** Provision from localStorage user (fallback when Firebase session is restoring). */
export async function provisionStoredUser({ notify = false } = {}) {
  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    return provisionUserAccount(firebaseUser, { notify });
  }

  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = stored.uid || stored.userId;
  if (!userId) return null;

  const result = await subscriptionAPI.provisionAccount({
    user_id: userId,
    email: stored.email || '',
    display_name: stored.username || '',
  });

  if (result?.balance != null) {
    localStorage.setItem('user', JSON.stringify({ ...stored, balance: result.balance }));
  }
  if (notify && result?.credits_granted) {
    notifyCreditsGranted(result.starter_credits || 100);
  }
  return result;
}

/** Clear local session and Firebase so the next login can pick a different Google account. */
export async function clearStaleAuthSession() {
  localStorage.removeItem('user');
  localStorage.removeItem('loginAt');
  try {
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch (_) {
    /* already signed out */
  }
}
