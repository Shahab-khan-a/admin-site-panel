import { NextResponse } from 'next/server';
import { getNoticeData, saveNoticeData, resetNoticeData } from '../../../lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = getNoticeData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notice data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const saved = saveNoticeData(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to save notice data' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const defaultData = resetNoticeData();
    return NextResponse.json({ success: true, data: defaultData });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to reset notice data' },
      { status: 500 }
    );
  }
}
