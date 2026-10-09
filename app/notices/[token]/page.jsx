import { redirect } from 'next/navigation';
import AjeerNoticeView from '../../../components/AjeerNoticeView';
import { parseTokenData } from '../../../lib/token';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function QiwaNoticeTokenPage({ params }) {
  const resolvedParams = await params;
  const token = resolvedParams?.token;

  if (token === 'admin') {
    redirect('/admin');
  }

  const tokenData = await parseTokenData(token);

  return <AjeerNoticeView tokenData={tokenData} tokenId={token} />;
}
