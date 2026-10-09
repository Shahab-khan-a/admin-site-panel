import AjeerNoticeView from '../../components/AjeerNoticeView';
import { getNoticeData } from '../../lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function QiwaNoticeIndexPage() {
  const tokenData = await getNoticeData('current');
  return <AjeerNoticeView tokenData={tokenData} tokenId="current" />;
}
