/**
 * Realistic Qiwa / Ajeer JWT Token Generator and Parser
 * Compatible with both Node.js server and Client Browser
 */

function toBase64Url(str) {
  if (typeof window !== 'undefined') {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  } else {
    return Buffer.from(str, 'utf8')
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
}

function fromBase64Url(str) {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    if (typeof window !== 'undefined') {
      return decodeURIComponent(escape(atob(padded)));
    } else {
      return Buffer.from(padded, 'base64').toString('utf8');
    }
  } catch (e) {
    return null;
  }
}

/**
 * Generates a standard UUID v4
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates an authentic Qiwa Ajeer Verification token (UUID format matching official Qiwa permits)
 */
export function generateNoticeToken(data = {}) {
  return generateUUID();
}

/**
 * Parses payload from a JWT token safely without throwing errors
 */
export function parseTokenPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const jsonStr = fromBase64Url(parts[1]);
    if (jsonStr) {
      return JSON.parse(jsonStr);
    }
  } catch (err) {
    console.warn('Failed to parse token payload:', err);
  }
  return null;
}
