import VerificationView from '../components/VerificationView';
import { getNoticeData } from '../lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  const tokenData = getNoticeData();
  return <VerificationView tokenData={tokenData} />;
}
