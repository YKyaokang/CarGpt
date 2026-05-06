import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

function parseToken(req: Request): string | null {
  const cookieToken = req.headers
    .get('cookie')
    ?.split(';')
    .find((c) => c.trim().startsWith('access_token='))
    ?.split('=')[1];
  const authHeader = req.headers.get('authorization') || '';
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  return cookieToken || headerToken || null;
}

export async function GET(req: Request) {
  try {
    const token = parseToken(req);
    if (!token) return NextResponse.json({ message: '未登录' }, { status: 401 });
    const payload = await verifyAccessToken(token);
    const userId = payload.sub;

    const records = await prisma.carMatchRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        summary: true,
        createdAt: true,
        answers: true,
      },
    });

    return NextResponse.json({ records });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取失败';
    return NextResponse.json({ message }, { status: 500 });
  }
}
