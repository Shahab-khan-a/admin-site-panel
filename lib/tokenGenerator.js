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
 * Generates an authentic Qiwa Ajeer Verification JWT token
 */
export function generateNoticeToken(data = {}) {
  const header = {
    typ: 'JWT',
    alg: 'HS256'
  };

  const cleanNoticeNumber = (data.noticeNumber || '586633').replace(/\D/g, '') || '586633';
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    service: 'tempwork',
    id: cleanNoticeNumber,
    iat: now,
    status: data.isValid !== false ? 'valid' : 'invalid',
    start_at: data.startDate || '2026-09-27',
    end_at: data.endDate || '2026-10-27',
    uid: Math.random().toString(36).substring(2, 8) + Date.now().toString(36)
  };

  const headerB64 = toBase64Url(JSON.stringify(header));
  const payloadB64 = toBase64Url(JSON.stringify(payload));

  // Generate realistic 43-character cryptographic signature
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let sig = '';
  for (let i = 0; i < 43; i++) {
    sig += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return `${headerB64}.${payloadB64}.${sig}`;
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
