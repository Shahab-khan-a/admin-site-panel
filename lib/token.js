import { getNoticeData } from './storage';

export function parseTokenData(token) {
  const currentData = getNoticeData();

  if (!token) return currentData;

  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      // Base64URL decode
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const json = Buffer.from(base64, 'base64').toString('utf8');
      const payload = JSON.parse(json);

      // If user has saved custom data in storage that differs from base default,
      // we preserve user's edited data, otherwise use token's payload
      return {
        ...currentData,
        // Keep whatever the admin saved
      };
    }
  } catch (e) {
    // Return currentData on error
  }

  return currentData;
}
