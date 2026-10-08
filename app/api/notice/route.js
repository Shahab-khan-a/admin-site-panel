import { NextResponse } from 'next/server';
import { getNoticeData, saveNoticeData, resetNoticeData, getLinksHistory, deleteNoticeData } from '../../../lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const isHistory = searchParams.get('history') === 'true';

    if (isHistory) {
      const history = await getLinksHistory();
      return NextResponse.json({ success: true, history });
    }

    const data = await getNoticeData(token || 'current');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notice data: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const customToken = body.token || null;
    const saved = await saveNoticeData(body, customToken);
    return NextResponse.json({ success: true, data: saved, token: saved.token });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to save notice data: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (token) {
      await deleteNoticeData(token);
      return NextResponse.json({ success: true, deleted: token });
    }

    const defaultData = await resetNoticeData();
    return NextResponse.json({ success: true, data: defaultData });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to reset/delete notice data' },
      { status: 500 }
    );
  }
}
