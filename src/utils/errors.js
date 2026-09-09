/**
 * Unified error message mapper.
 * Maps API/network errors to user-friendly messages.
 */

const AXIOS_NOISE = /^Request failed with status code \d+$/i;

const API_ERROR_MESSAGES = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Your session has expired. Please log in again.',
  402: 'Insufficient credits. Buy a credit pack to continue.',
  403: 'You do not have enough credits for this action. Top up your wallet to continue.',
  404: 'The requested resource was not found.',
  408: 'The request timed out. Please check your connection and try again.',
  413: 'This file is too large. Maximum upload size is 500 MB. Compress the video or use a shorter clip.',
  422: 'The file format is not supported.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'A server error occurred. Please try again in a few moments.',
  502: 'The service is temporarily unavailable. Please try again shortly.',
  503: 'The service is currently down for maintenance. Please try again later.',
};

const NETWORK_MESSAGES = {
  'Network Error': 'No internet connection. Please check your network and try again.',
  'timeout': 'The request took too long. This may be a large file — please try again.',
  'ECONNABORTED': 'Connection timed out. Please try again.',
};

function isTechnicalMessage(message) {
  if (!message || typeof message !== 'string') return true;
  const trimmed = message.trim();
  if (AXIOS_NOISE.test(trimmed)) return true;
  if (/^AxiosError/i.test(trimmed)) return true;
  if (/^Network Error$/i.test(trimmed)) return true;
  if (/^timeout of \d+ms exceeded$/i.test(trimmed)) return true;
  return false;
}

/**
 * Dispatch a global snackbar notification (handled by GlobalSnackbar).
 */
export function notifyUser({ message, type = 'error', title }) {
  if (!message) return;
  window.dispatchEvent(new CustomEvent('app-notification', {
    detail: { type, message, title },
  }));
}

/**
 * Returns a user-friendly error message from any error object.
 * @param {Error|object} error
 * @param {string} [fallback] — fallback message
 * @returns {{ message: string, shouldUpgrade: boolean, isNetwork: boolean }}
 */
export function parseError(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.friendlyMessage && !isTechnicalMessage(error.friendlyMessage)) {
    return {
      message: error.friendlyMessage,
      shouldUpgrade: Boolean(error.shouldUpgrade),
      isNetwork: Boolean(error.isNetwork),
    };
  }

  const status = error?.response?.status;
  const rawDetail = error?.response?.data?.detail;
  const serverMsg = error?.response?.data?.message ||
    (typeof rawDetail === 'string' ? rawDetail : Array.isArray(rawDetail) ? rawDetail.map((d) => d?.msg || d).join(', ') : '');
  const isUpgrade = status === 402 || status === 403 ||
    (serverMsg && (serverMsg.includes('limit') || serverMsg.includes('subscription') || serverMsg.includes('credit')));

  // Network errors — Safari reports proxy 413s as CORS with no response body
  if (!error.response) {
    const blob = `${error.message || ''} ${error.code || ''}`;
    if (/status code:\s*413/i.test(blob) || /\b413\b/.test(blob) && /access-control-allow-origin/i.test(blob)) {
      return { message: API_ERROR_MESSAGES[413], shouldUpgrade: false, isNetwork: false };
    }
    for (const [key, msg] of Object.entries(NETWORK_MESSAGES)) {
      if (error.message?.includes(key) || error.code?.includes(key)) {
        return { message: msg, shouldUpgrade: false, isNetwork: true };
      }
    }
  }

  // Prefer explicit server message over generic status text (e.g. provision/sign-in errors)
  if (serverMsg && typeof serverMsg === 'string' && serverMsg.length < 200 && !isTechnicalMessage(serverMsg)) {
    return { message: serverMsg, shouldUpgrade: isUpgrade, isNetwork: false };
  }

  // HTTP status errors
  if (status && API_ERROR_MESSAGES[status]) {
    return {
      message: API_ERROR_MESSAGES[status],
      shouldUpgrade: isUpgrade,
      isNetwork: false,
    };
  }

  // Client-provided message (skip axios boilerplate)
  if (
    error?.message &&
    error.message.length < 200 &&
    !error.message.includes('Error:') &&
    !isTechnicalMessage(error.message)
  ) {
    return { message: error.message, shouldUpgrade: isUpgrade, isNetwork: false };
  }

  return { message: fallback, shouldUpgrade: isUpgrade, isNetwork: false };
}

/** Shorthand: friendly string only. */
export function getFriendlyErrorMessage(error, fallback) {
  return parseError(error, fallback).message;
}

/** Parse error, show snackbar, return friendly message. */
export function notifyApiError(error, fallback) {
  const parsed = parseError(error, fallback);
  notifyUser({
    type: parsed.shouldUpgrade ? 'warning' : 'error',
    message: parsed.message,
  });
  return parsed.message;
}
