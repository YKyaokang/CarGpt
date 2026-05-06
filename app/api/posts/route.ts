import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import type { CreatePostPayload } from '@/types/community';

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
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tag = searchParams.get('tag');
    const authorId = searchParams.get('authorId');
    const sort = searchParams.get('sort') || 'latest';
    const keyword = searchParams.get('keyword');

    // 尝试获取当前用户（用于判断 isLiked）
    let currentUserId: string | null = null;
    const token = parseToken(req);
    if (token) {
      try {
        const payload = await verifyAccessToken(token);
        currentUserId = payload.sub;
      } catch {
        // 未登录时忽略
      }
    }

    const where: {
      status: string;
      createdAt?: { gte?: Date; lte?: Date };
      tags?: { some: { tag: string } };
      authorId?: string;
      OR?: Array<{ title?: { contains: string }; content?: { contains: string } }>;
    } = { status: 'published' };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }
    if (tag) where.tags = { some: { tag } };
    if (authorId) where.authorId = authorId;
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }

    const orderBy =
      sort === 'popular'
        ? { likeCount: 'desc' as const }
        : sort === 'commented'
          ? { commentCount: 'desc' as const }
          : { createdAt: 'desc' as const };

    const [rawPosts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          images: {
            orderBy: { order: 'asc' as const },
            take: 4,
            select: { id: true, url: true, order: true, fileName: true, mimeType: true, size: true },
          },
          tags: { select: { id: true, tag: true } },
          likes: {
            where: { userId: currentUserId ?? '' },
            select: { id: true },
          },
          bookmarks: {
            where: { userId: currentUserId ?? '' },
            select: { id: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const posts = rawPosts.map((p) => ({
      ...p,
      likes: undefined,
      bookmarks: undefined,
      isLiked: currentUserId ? ((p as { likes?: { id: string }[] }).likes?.length ?? 0) > 0 : false,
      isBookmarked: currentUserId ? ((p as { bookmarks?: { id: string }[] }).bookmarks?.length ?? 0) > 0 : false,
    }));

    return NextResponse.json({ posts, total, page, pageSize, hasMore: page * pageSize < total });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取失败';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = parseToken(req);
    if (!token) return NextResponse.json({ message: '未登录' }, { status: 401 });
    const payload = await verifyAccessToken(token);
    const userId = payload.sub;

    const body: CreatePostPayload = await req.json();
    const {
      title,
      content,
      contentType = 'markdown',
      status = 'published',
      images = [],
      tags = [],
      mentions = [],
    } = body;

    if (!content?.trim()) {
      return NextResponse.json({ message: '内容不能为空' }, { status: 400 });
    }
    if (images.length > 9) {
      return NextResponse.json({ message: '最多上传 9 张图片' }, { status: 400 });
    }

    // 解析内容中的 #标签# 和 @用户
    const inlineTags = [...content.matchAll(/#([^#\s]+)#/g)].map((m) => m[1]);
    const allTags = [...new Set([...tags, ...inlineTags])].filter(Boolean);

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        title: title?.trim() || null,
        content: content.trim(),
        contentType,
        status,
        images: {
          create: images.map((img) => ({
            url: img.url,
            order: img.order,
            fileName: img.fileName ?? null,
            mimeType: img.mimeType ?? null,
            size: img.size ?? null,
          })),
        },
        tags: {
          create: allTags
            .map((t) => ({ tag: t.replace(/^#|#$/g, '').trim() }))
            .filter((t) => t.tag.length > 0),
        },
        ...(mentions.length > 0
          ? { mentions: { create: mentions.map((mentionedId) => ({ mentionedId })) } }
          : {}),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        images: { orderBy: { order: 'asc' } },
        tags: true,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '发布失败';
    return NextResponse.json({ message }, { status: 500 });
  }
}
