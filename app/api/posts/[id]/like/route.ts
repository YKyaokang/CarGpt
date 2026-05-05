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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = parseToken(req);
    if (!token) return NextResponse.json({ message: '未登录' }, { status: 401 });
    const payload = await verifyAccessToken(token);
    const userId = payload.sub;

    const { id: postId } = await params;

    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      // 取消点赞
      await prisma.$transaction([
        prisma.postLike.delete({ where: { postId_userId: { postId, userId } } }),
        prisma.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } }),
      ]);
      return NextResponse.json({ isLiked: false });
    } else {
      // 点赞
      await prisma.$transaction([
        prisma.postLike.create({ data: { postId, userId } }),
        prisma.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
      ]);
      return NextResponse.json({ isLiked: true });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败';
    return NextResponse.json({ message }, { status: 500 });
  }
}
