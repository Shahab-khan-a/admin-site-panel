import { getNoticeData } from './storage';
import { parseTokenPayload } from './tokenGenerator';
import { DEFAULT_NOTICE_DATA } from './defaultData';

export async function parseTokenData(token) {
  if (!token) {
    return await getNoticeData('current');
  }

  try {
    // 1. Fetch data for this specific token from storage / Firestore
    const data = await getNoticeData(token);
    if (data) {
      return data;
    }
  } catch (err) {
    console.warn('Error fetching token data:', err);
  }

  // 2. Decode payload as fallback if Firestore doesn't have it
  const payload = parseTokenPayload(token);
  if (payload) {
    return {
      ...DEFAULT_NOTICE_DATA,
      noticeNumber: payload.id || DEFAULT_NOTICE_DATA.noticeNumber,
      startDate: payload.start_at || DEFAULT_NOTICE_DATA.startDate,
      endDate: payload.end_at || DEFAULT_NOTICE_DATA.endDate,
      isValid: payload.status === 'valid',
      statusText: payload.status === 'valid' ? 'ساري / فعال' : 'منتهي / ملغي'
    };
  }

  // 3. Fallback to current
  return await getNoticeData('current');
}
