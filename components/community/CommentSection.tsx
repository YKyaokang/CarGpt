"use client";

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { CommentData } from '@/types/community';

interface Props {
  postId: string;
  currentUserId: string | null;
  comments: CommentData[];
  total: number;
  onCommentAdded: (comment: CommentData) => void;
}

function getInitials(name: string | null): string {
  if (name) return name.slice(0, 2).toUpperCase();
  return 'U';
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function CommentItem({
  comment,
  postId,
  currentUserId,
  onReplyAdded,
}: {
  comment: CommentData;
  postId: string;
  currentUserId: string | null;
  onReplyAdded: (parentId: string, reply: CommentData) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim() || submitting) return;
    if (!currentUserId) { window.location.href = '/auth?redirect=/community'; return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim(), parentId: comment.id }),
      });
      const data = await res.json();
      if (res.ok) {
        onReplyAdded(comment.id, data.comment);
        setReplyText('');
        setReplying(false);
      }
    } catch {}
    finally { setSubmitting(false); }
  };

  return (
    <div className="flex gap-3">
      {/* 头像 */}
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}>
        {comment.author.avatarUrl
          ? <img src={comment.author.avatarUrl} alt="" className="w-full h-full object-cover" />
          : getInitials(comment.author.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {comment.author.name ?? '匿名'}
          </span>
          <span className="text-xs text-gray-400">{formatTime(comment.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{comment.content}</p>

        {/* 回复按钮 */}
        {currentUserId && (
          <button
            onClick={() => setReplying((r) => !r)}
            className="mt-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            回复
          </button>
        )}

        {/* 回复输入框 */}
        {replying && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
              placeholder={`回复 ${comment.author.name ?? '匿名'}...`}
              autoFocus
              className="flex-1 px-3 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 transition-shadow"
              style={{ '--tw-ring-color': 'hsl(var(--theme-primary) / 0.3)' } as React.CSSProperties}
            />
            <button
              onClick={handleReply}
              disabled={submitting || !replyText.trim()}
              className="p-2 rounded-xl disabled:opacity-40 transition-all text-white"
              style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* 子回复 */}
        {comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 pl-3 border-l-2 border-gray-100 dark:border-gray-700/50">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}>
                  {reply.author.avatarUrl
                    ? <img src={reply.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : getInitials(reply.author.name)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{reply.author.name ?? '匿名'}</span>
                    <span className="text-xs text-gray-400">{formatTime(reply.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ postId, currentUserId, comments: initialComments, total: initialTotal, onCommentAdded }: Props) {
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [total, setTotal] = useState(initialTotal);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    if (!currentUserId) { window.location.href = '/auth?redirect=/community'; return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [data.comment, ...prev]);
        setTotal((t) => t + 1);
        setCommentText('');
        onCommentAdded(data.comment);
      }
    } catch {}
    finally { setSubmitting(false); }
  };

  const handleReplyAdded = (parentId: string, reply: CommentData) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
      )
    );
    setTotal((t) => t + 1);
    onCommentAdded(reply);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-base font-bold text-gray-900 dark:text-white">
        评论 <span className="text-gray-400 font-normal text-sm">({total})</span>
      </h3>

      {/* 评论输入框 */}
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}>
          我
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
            placeholder={currentUserId ? '发表评论，Enter 发送...' : '登录后参与评论'}
            disabled={!currentUserId}
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ '--tw-ring-color': 'hsl(var(--theme-primary) / 0.3)' } as React.CSSProperties}
          />
          <button
            onClick={handleComment}
            disabled={submitting || !commentText.trim() || !currentUserId}
            className="px-4 py-2.5 text-sm font-medium rounded-xl text-white disabled:opacity-40 transition-all shadow-sm hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 评论列表 */}
      {comments.length > 0 ? (
        <div className="space-y-5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              postId={postId}
              currentUserId={currentUserId}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-6">还没有评论，来发表第一条吧</p>
      )}
    </div>
  );
}
