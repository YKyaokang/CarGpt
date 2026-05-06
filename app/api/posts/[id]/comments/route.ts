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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

    const [comments, total] = await prisma.$transaction([
      prisma.comment.findMany({
        where: { postId, parentId: null },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: { select: { id: true, name: true, avatarUrl: true } },
              replies: false,
            },
          },
        },
      }),
      prisma.comment.count({ where: { postId, parentId: null } }),
    ]);

    return NextResponse.json({ comments, total, page, pageSize, hasMore: page * pageSize < total });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取失败';
    return NextResponse.json({ message }, { status: 500 });
  }
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
    const { content, parentId }: { content: string; parentId?: string } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ message: '评论内容不能为空' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId, status: 'published' } });
    if (!post) return NextResponse.json({ message: '帖子不存在' }, { status: 404 });

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId, postId } });
      if (!parent) return NextResponse.json({ message: '回复的评论不存在' }, { status: 404 });
    }

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          postId,
          authorId: userId,
          content: content.trim(),
          parentId: parentId ?? null,
        },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          replies: {
            include: { author: { select: { id: true, name: true, avatarUrl: true } } },
          },
        },
      }),
      prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
    ]);

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '评论失败';
    return NextResponse.json({ message }, { status: 500 });
  }
}
