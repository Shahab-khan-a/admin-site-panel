import { getNoticeData } from './storage';

export async function parseTokenData(token) {
  const currentData = await getNoticeData();
  return currentData;
}
