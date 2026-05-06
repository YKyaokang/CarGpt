"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Eye, ArrowLeft, Share2, Edit, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import PostImageGrid from '@/components/community/PostImageGrid';
import CommentSection from '@/components/community/CommentSection';
import { useAuth } from '@/lib/store/auth';
import type { Post, CommentData } from '@/types/community';
import ReactMarkdown from 'react-markdown';

function getInitials(name: string | null): string {
  if (name) return name.slice(0, 2).toUpperCase();
  return 'U';
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PostDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`/api/posts/${id}`),
          fetch(`/api/posts/${id}/comments?pageSize=50`),
        ]);
        if (postRes.status === 404) { setNotFound(true); setLoading(false); return; }
        if (postRes.ok) {
          const data = await postRes.json();
          setPost(data.post);
          setLiked(data.post.isLiked);
          setLikeCount(data.post.likeCount);
        }
        if (commentsRes.ok) {
          const cData = await commentsRes.json();
          setComments(cData.comments);
          setCommentTotal(cData.total);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleLike = async () => {
    if (liking) return;
    if (!user) { window.location.href = '/auth?redirect=/community/' + id; return; }
    setLiking(true);
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      const res = await fetch(`/api/posts/${id}/like`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.isLiked);
      } else {
        setLiked(prevLiked);
        setLikeCount(prevCount);
      }
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCommentAdded = (comment: CommentData) => {
    setCommentTotal((t) => t + 1);
    if (post) setPost({ ...post, commentCount: post.commentCount + 1 });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--theme-primary))' }} />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-500 dark:text-gray-400">帖子不存在或已删除</p>
        <Link href="/community"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-colors"
          style={{ borderColor: 'hsl(var(--theme-primary) / 0.3)', color: 'hsl(var(--theme-primary))' }}>
          <ArrowLeft className="w-4 h-4" />
          返回社区
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === post.authorId;

  return (
    <main className="min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/community"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回社区</span>
          </Link>
          <div className="flex items-center gap-2">
            {isOwner && (
              <Link href={`/community/create?edit=${post.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors"
                style={{ borderColor: 'hsl(var(--theme-primary) / 0.3)', color: 'hsl(var(--theme-primary))' }}>
                <Edit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">编辑</span>
              </Link>
            )}
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 帖子主体 */}
        <article className="rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm p-5 sm:p-6">
          {/* 作者信息 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shadow-sm"
              style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}>
              {post.author.avatarUrl
                ? <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                : getInitials(post.author.name)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{post.author.name ?? '匿名用户'}</p>
              <p className="text-xs text-gray-400">{formatDateTime(post.createdAt)}</p>
            </div>
          </div>

          {/* 标题 */}
          {post.title && (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-snug">{post.title}</h1>
          )}

          {/* 正文 */}
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* 图片 */}
          {post.images.length > 0 && <PostImageGrid images={post.images} />}

          {/* 标签 */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {post.tags.map((t) => (
                <Link key={t.id} href={`/community?tag=${encodeURIComponent(t.tag)}`}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
                  style={{
                    background: 'hsl(var(--theme-primary) / 0.1)',
                    color: 'hsl(var(--theme-primary))',
                    border: '1px solid hsl(var(--theme-primary) / 0.2)',
                  }}>
                  #{t.tag}
                </Link>
              ))}
            </div>
          )}

          {/* 统计栏 */}
          <div className="flex items-center gap-5 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            {/* 点赞 */}
            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-200 ${
                liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400'
              } disabled:opacity-60`}
            >
              <Heart className={`w-5 h-5 transition-transform ${liked ? 'fill-current scale-110' : ''}`} />
              <span>{likeCount}</span>
            </button>

            {/* 评论 */}
            <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
              <MessageCircle className="w-5 h-5" />
              <span>{post.commentCount}</span>
            </div>

            {/* 浏览 */}
            <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
              <Eye className="w-5 h-5" />
              <span>{post.viewCount}</span>
            </div>

            <div className="flex-1" />

            {/* 分享 */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{copied ? '已复制' : '分享'}</span>
            </button>
          </div>
        </article>

        {/* 评论区 */}
        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm p-5 sm:p-6">
          <CommentSection
            postId={post.id}
            currentUserId={user?.id ?? null}
            comments={comments}
            total={commentTotal}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      </div>
    </main>
  );
}
