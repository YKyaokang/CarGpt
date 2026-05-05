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
    const { id } = await params;

    let currentUserId: string | null = null;
    const token = parseToken(req);
    if (token) {
      try {
        const payload = await verifyAccessToken(token);
        currentUserId = payload.sub;
      } catch {
        // 未登录忽略
      }
    }

    const post = await prisma.post.findUnique({
      where: { id, status: 'published' },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        images: { orderBy: { order: 'asc' } },
        tags: true,
        likes: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
      },
    });

    if (!post) {
      return NextResponse.json({ message: '帖子不存在' }, { status: 404 });
    }

    // 异步增加浏览量，不阻塞响应
    prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    const { likes, ...rest } = post;
    return NextResponse.json({
      post: {
        ...rest,
        viewCount: rest.viewCount + 1,
        isLiked: currentUserId ? ((likes as { id: string }[] | false | undefined) || []).length > 0 : false,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取失败';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = parseToken(req);
    if (!token) return NextResponse.json({ message: '未登录' }, { status: 401 });
    const payload = await verifyAccessToken(token);
    const userId = payload.sub;

    const { id } = await params;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: '帖子不存在' }, { status: 404 });
    if (existing.authorId !== userId) return NextResponse.json({ message: '无权限' }, { status: 403 });

    const body: {
      title?: string;
      content?: string;
      status?: string;
      images?: Array<{ url: string; order: number; fileName?: string; mimeType?: string; size?: number }>;
      tags?: string[];
    } = await req.json();
    const { title, content, status, images, tags } = body;

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title?.trim() || null } : {}),
        ...(content !== undefined ? { content: content.trim() } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(images !== undefined
          ? {
              images: {
                deleteMany: {},
                create: images.map((img) => ({
                  url: img.url,
                  order: img.order,
                  fileName: img.fileName ?? null,
                  mimeType: img.mimeType ?? null,
                  size: img.size ?? null,
                })),
              },
            }
          : {}),
        ...(tags !== undefined
          ? {
              tags: {
                deleteMany: {},
                create: tags
                  .map((t) => ({ tag: t.replace(/^#|#$/g, '').trim() }))
                  .filter((t) => t.tag.length > 0),
              },
            }
          : {}),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        images: { orderBy: { order: 'asc' } },
        tags: true,
      },
    });

    return NextResponse.json({ post });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '更新失败';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = parseToken(req);
    if (!token) return NextResponse.json({ message: '未登录' }, { status: 401 });
    const payload = await verifyAccessToken(token);
    const userId = payload.sub;

    const { id } = await params;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: '帖子不存在' }, { status: 404 });
    if (existing.authorId !== userId) return NextResponse.json({ message: '无权限' }, { status: 403 });

    // 软删除
    await prisma.post.update({ where: { id }, data: { status: 'deleted' } });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '删除失败';
    return NextResponse.json({ message }, { status: 500 });
  }
}
