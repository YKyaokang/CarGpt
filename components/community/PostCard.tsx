"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Heart, MessageCircle, Eye, MoreHorizontal, Trash2, Edit, Bookmark } from 'lucide-react';
import type { Post } from '@/types/community';
import PostImageGrid from './PostImageGrid';

interface Props {
  post: Post;
  currentUserId?: string | null;
  onLikeToggle?: (postId: string, isLiked: boolean) => void;
  onBookmarkToggle?: (postId: string, isBookmarked: boolean) => void;
  onDelete?: (postId: string) => void;
}

function getInitials(name: string | null, email?: string): string {
  if (name) return name.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'U';
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function ContentPreview({ content }: { content: string }) {
  // 去掉 markdown 语法，显示纯文本预览
  const plain = content
    .replace(/!\[.*?\]\(.*?\)/g, '[图片]')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_`~>]/g, '')
    .replace(/#([^#\s]+)#/g, '#$1')
    .trim();

  const lines = plain.split('\n').filter(Boolean);
  const preview = lines.slice(0, 3).join(' ');
  const isLong = plain.length > 120 || lines.length > 3;

  return (
    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-1">
      {isLong ? preview.slice(0, 120) + '…' : preview}
    </p>
  );
}

export default function PostCard({ post, currentUserId, onLikeToggle, onBookmarkToggle, onDelete }: Props) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [liking, setLiking] = useState(false);
  const [bookmarked, setBookmarked] = useState(!!post.isBookmarked);
  const [bookmarking, setBookmarking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = currentUserId === post.authorId;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (liking) return;
    if (!currentUserId) {
      window.location.href = '/auth?redirect=/community';
      return;
    }
    setLiking(true);
    const prevLiked = liked;
    const prevCount = likeCount;
    // 乐观更新
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.isLiked);
        onLikeToggle?.(post.id, data.isLiked);
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

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarking) return;
    if (!currentUserId) {
      window.location.href = '/auth?redirect=/community';
      return;
    }
    setBookmarking(true);
    const prevBookmarked = bookmarked;
    setBookmarked(!bookmarked);
    try {
      const res = await fetch(`/api/posts/${post.id}/bookmark`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setBookmarked(data.isBookmarked);
        onBookmarkToggle?.(post.id, data.isBookmarked);
      } else {
        setBookmarked(prevBookmarked);
      }
    } catch {
      setBookmarked(prevBookmarked);
    } finally {
      setBookmarking(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) onDelete?.(post.id);
    } catch {}
    setMenuOpen(false);
  };

  return (
    <Link href={`/community/${post.id}`} className="block group">
      <article className="rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:border-transparent hover:-translate-y-0.5"
        style={{ boxShadow: '0 2px 12px hsl(var(--theme-primary) / 0.04)' }}>

        {/* 作者区域 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* 头像 */}
            <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden"
              style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}>
              {post.author.avatarUrl ? (
                <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(post.author.name)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {post.author.name || '匿名用户'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{formatTime(post.createdAt)}</p>
            </div>
          </div>

          {/* 操作菜单（仅作者可见） */}
          {isOwner && (
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((o) => !o); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-800 shadow-xl py-1 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}>
                  <Link href={`/community/create?edit=${post.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setMenuOpen(false)}>
                    <Edit className="w-4 h-4" />
                    编辑
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 标题（可选） */}
        {post.title && (
          <h3 className="mt-3 text-base font-bold text-gray-900 dark:text-white line-clamp-2">
            {post.title}
          </h3>
        )}

        {/* 内容预览 */}
        <ContentPreview content={post.content} />

        {/* 图片 */}
        {post.images.length > 0 && <PostImageGrid images={post.images} />}

        {/* 话题标签 */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: 'hsl(var(--theme-primary) / 0.1)',
                  color: 'hsl(var(--theme-primary))',
                  border: '1px solid hsl(var(--theme-primary) / 0.2)',
                }}
              >
                #{t.tag}
              </span>
            ))}
          </div>
        )}

        {/* 底部统计 */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
          {/* 点赞 */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              liked
                ? 'text-red-500'
                : 'text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </button>

          {/* 评论 */}
          <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentCount}</span>
          </div>

          {/* 浏览 */}
          <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 ml-auto">
            <Eye className="w-4 h-4" />
            <span>{post.viewCount}</span>
          </div>

          {/* 收藏 */}
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              bookmarked
                ? 'text-yellow-500'
                : 'text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </article>
    </Link>
  );
}
