import VerificationView from '../../../components/VerificationView';
import { parseTokenData } from '../../../lib/token';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NoticeVerificationPage({ params }) {
  const resolvedParams = await params;
  const token = resolvedParams?.token;
  const tokenData = parseTokenData(token);

  return <VerificationView tokenData={tokenData} />;
}
