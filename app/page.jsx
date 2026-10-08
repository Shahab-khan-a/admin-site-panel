import VerificationView from '../components/VerificationView';
import { getNoticeData } from '../lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const tokenData = await getNoticeData('current');
  return <VerificationView tokenData={tokenData} tokenId="current" />;
}
