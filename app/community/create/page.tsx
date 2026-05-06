"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import PostEditor from '@/components/community/PostEditor';
import { useAuth } from '@/lib/store/auth';
import type { UploadedImage } from '@/types/community';

export default function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 编辑模式：加载已有帖子数据
  const [initialTitle, setInitialTitle] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [initialImages, setInitialImages] = useState<UploadedImage[]>([]);
  const [initialTags, setInitialTags] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (!editId) return;
    setEditLoading(true);
    fetch(`/api/posts/${editId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.post) {
          setInitialTitle(data.post.title ?? '');
          setInitialContent(data.post.content ?? '');
          setInitialImages(
            (data.post.images ?? []).map((img: { id: string; url: string; order: number; fileName: string | null; mimeType: string | null; size: number | null }) => ({
              url: img.url,
              order: img.order,
              fileName: img.fileName ?? undefined,
              mimeType: img.mimeType ?? undefined,
              size: img.size ?? undefined,
              previewUrl: img.url,
            }))
          );
          setInitialTags((data.post.tags ?? []).map((t: { tag: string }) => t.tag));
        }
      })
      .catch(() => {})
      .finally(() => setEditLoading(false));
  }, [editId]);

  // 未登录跳转
  useEffect(() => {
    if (user === null && !editLoading) {
      // 等待 auth 初始化
    }
  }, [user, editLoading]);

  const handlePublish = async (data: {
    title: string;
    content: string;
    images: UploadedImage[];
    tags: string[];
    mentions: string[];
    status: 'published' | 'draft';
  }) => {
    if (!user) {
      router.push('/auth?redirect=/community/create');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: data.title || undefined,
        content: data.content,
        contentType: 'markdown' as const,
        status: data.status,
        images: data.images.map((img, i) => ({
          url: img.url,
          order: i,
          fileName: img.fileName,
          mimeType: img.mimeType,
          size: img.size,
        })),
        tags: data.tags,
        mentions: data.mentions,
      };

      const url = editId ? `/api/posts/${editId}` : '/api/posts';
      const method = editId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (res.ok) {
        const postId = editId ?? result.post?.id;
        if (data.status === 'draft') {
          router.push('/community');
        } else {
          router.push(postId ? `/community/${postId}` : '/community');
        }
      } else {
        setError(result.message ?? '操作失败，请重试');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (editLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--theme-primary))' }} />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            href="/community"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回社区</span>
          </Link>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            {editId ? '编辑帖子' : '发布帖子'}
          </h1>
          <ThemeSwitcher />
        </div>
      </header>

      {/* ── 主内容 ── */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <div
          className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-5 sm:p-6"
          style={{ boxShadow: '0 4px 24px hsl(var(--theme-primary) / 0.06)' }}
        >
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {!user ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">请先登录后再发帖</p>
              <Link
                href="/auth?redirect=/community/create"
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl text-white shadow-md hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}
              >
                去登录
              </Link>
            </div>
          ) : (
            <PostEditor
              initialTitle={initialTitle}
              initialContent={initialContent}
              initialImages={initialImages}
              initialTags={initialTags}
              onPublish={handlePublish}
              submitting={submitting}
            />
          )}
        </div>
      </div>
    </main>
  );
}
