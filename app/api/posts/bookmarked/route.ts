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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));

    const [bookmarks, total] = await prisma.$transaction([
      prisma.postBookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          post: {
            include: {
              author: { select: { id: true, name: true, avatarUrl: true } },
              images: {
                orderBy: { order: 'asc' as const },
                take: 4,
                select: { id: true, url: true, order: true, fileName: true, mimeType: true, size: true },
              },
              tags: { select: { id: true, tag: true } },
              likes: {
                where: { userId },
                select: { id: true },
              },
            },
          },
        },
      }),
      prisma.postBookmark.count({ where: { userId } }),
    ]);

    const posts = bookmarks.map(({ post }) => ({
      ...post,
      likes: undefined,
      isLiked: (post.likes?.length ?? 0) > 0,
      isBookmarked: true,
    }));

    return NextResponse.json({ posts, total, page, pageSize, hasMore: page * pageSize < total });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取失败';
    return NextResponse.json({ message }, { status: 500 });
  }
}
