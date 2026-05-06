"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, ArrowUp, Users, Bookmark } from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import PostCard from '@/components/community/PostCard';
import PostFilter from '@/components/community/PostFilter';
import { useAuth } from '@/lib/store/auth';
import type { Post, PostFilterParams, PostListResponse } from '@/types/community';

const DEFAULT_FILTER: PostFilterParams = {
  page: 1,
  pageSize: 10,
  sort: 'latest',
};

const POPULAR_TAGS = ['性能改装', '新能源用车', '二手车', '保养维修', '驾驶技巧', '新车资讯'];

type ActiveTab = 'feed' | 'bookmarked';

export default function CommunityPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');

  // feed tab state
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<PostFilterParams>(DEFAULT_FILTER);

  // bookmarked tab state
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [bookmarkedTotal, setBookmarkedTotal] = useState(0);
  const [bookmarkedHasMore, setBookmarkedHasMore] = useState(false);
  const [bookmarkedLoading, setBookmarkedLoading] = useState(false);
  const [bookmarkedLoadingMore, setBookmarkedLoadingMore] = useState(false);
  const [bookmarkedPage, setBookmarkedPage] = useState(1);

  const [showScrollTop, setShowScrollTop] = useState(false);

  const buildQuery = (params: PostFilterParams) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.sort) q.set('sort', params.sort);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    if (params.tag) q.set('tag', params.tag);
    if (params.keyword) q.set('keyword', params.keyword);
    return q.toString();
  };

  const fetchPosts = useCallback(async (params: PostFilterParams, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await fetch(`/api/posts?${buildQuery(params)}`);
      const data: PostListResponse = await res.json();
      if (res.ok) {
        setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
        setTotal(data.total);
        setHasMore(data.hasMore);
      }
    } catch {}
    finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchBookmarked = useCallback(async (page: number, append = false) => {
    if (!append) setBookmarkedLoading(true);
    else setBookmarkedLoadingMore(true);
    try {
      const res = await fetch(`/api/posts/bookmarked?page=${page}&pageSize=10`);
      const data: PostListResponse = await res.json();
      if (res.ok) {
        setBookmarkedPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
        setBookmarkedTotal(data.total);
        setBookmarkedHasMore(data.hasMore);
      }
    } catch {}
    finally {
      setBookmarkedLoading(false);
      setBookmarkedLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(filter);
  }, [filter, fetchPosts]);

  useEffect(() => {
    if (activeTab === 'bookmarked' && user) {
      setBookmarkedPage(1);
      fetchBookmarked(1);
    }
  }, [activeTab, user, fetchBookmarked]);

  // 滚动监听
  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleFilterChange = (params: PostFilterParams) => {
    setFilter({ ...params, page: 1 });
  };

  const handleLoadMore = () => {
    const nextPage = (filter.page ?? 1) + 1;
    const nextFilter = { ...filter, page: nextPage };
    setFilter(nextFilter);
    fetchPosts(nextFilter, true);
  };

  const handleBookmarkedLoadMore = () => {
    const nextPage = bookmarkedPage + 1;
    setBookmarkedPage(nextPage);
    fetchBookmarked(nextPage, true);
  };

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setTotal((t) => t - 1);
  };

  const handleLikeToggle = (postId: string, isLiked: boolean) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked, likeCount: p.likeCount + (isLiked ? 1 : -1) }
          : p
      )
    );
  };

  const handleBookmarkToggleInFeed = (postId: string, isBookmarked: boolean) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isBookmarked } : p))
    );
  };

  // 在收藏列表中取消收藏 → 立即移除
  const handleBookmarkToggleInBookmarked = (postId: string, isBookmarked: boolean) => {
    if (!isBookmarked) {
      setBookmarkedPosts((prev) => prev.filter((p) => p.id !== postId));
      setBookmarkedTotal((t) => t - 1);
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'bookmarked' && !user) {
      window.location.href = '/auth?redirect=/community';
      return;
    }
    setActiveTab(tab);
  };

  return (
    <main className="min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0" title="返回首页">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}>
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">社区广场</h1>
                <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                  {activeTab === 'feed' ? `共 ${total} 条帖子` : `已收藏 ${bookmarkedTotal} 条`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/community/create"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-white shadow-sm hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}>
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">发帖</span>
            </Link>
            <ThemeSwitcher />
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="max-w-2xl mx-auto px-4 pb-0 flex gap-0 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => handleTabChange('feed')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'feed'
                ? 'border-current'
                : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            style={activeTab === 'feed' ? { color: 'hsl(var(--theme-primary))' } : {}}
          >
            <Users className="w-4 h-4" />
            广场
          </button>
          <button
            onClick={() => handleTabChange('bookmarked')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'bookmarked'
                ? 'border-current'
                : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            style={activeTab === 'bookmarked' ? { color: 'hsl(var(--theme-primary))' } : {}}
          >
            <Bookmark className="w-4 h-4" />
            我收藏的
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {activeTab === 'feed' ? (
          <>
            {/* 筛选器 */}
            <PostFilter
              value={filter}
              onChange={handleFilterChange}
              popularTags={POPULAR_TAGS}
            />

            {/* 帖子列表 */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/50 p-5 animate-pulse">
                    <div className="flex gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-700/60 rounded w-16" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                      <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🚗</div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">还没有帖子</p>
                <p className="text-sm text-gray-400">成为第一个发帖的人吧！</p>
                <Link href="/community/create"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium rounded-xl text-white shadow-md hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}>
                  <Plus className="w-4 h-4" />
                  发第一条帖子
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={user?.id ?? null}
                      onLikeToggle={handleLikeToggle}
                      onBookmarkToggle={handleBookmarkToggleInFeed}
                      onDelete={handlePostDelete}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-6 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 hover:shadow-md disabled:opacity-50"
                      style={{
                        borderColor: 'hsl(var(--theme-primary) / 0.3)',
                        color: 'hsl(var(--theme-primary))',
                      }}
                    >
                      {loadingMore ? '加载中...' : '加载更多'}
                    </button>
                  </div>
                )}

                {!hasMore && posts.length > 0 && (
                  <p className="text-center text-sm text-gray-400 py-2">已显示全部 {total} 条帖子</p>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {/* 收藏列表 */}
            {bookmarkedLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/50 p-5 animate-pulse">
                    <div className="flex gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-700/60 rounded w-16" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                      <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : bookmarkedPosts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔖</div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">还没有收藏的帖子</p>
                <p className="text-sm text-gray-400">在广场中点击收藏按钮保存感兴趣的内容</p>
                <button
                  onClick={() => setActiveTab('feed')}
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium rounded-xl text-white shadow-md hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}
                >
                  去广场逛逛
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {bookmarkedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={user?.id ?? null}
                      onLikeToggle={(postId, isLiked) => {
                        setBookmarkedPosts((prev) =>
                          prev.map((p) =>
                            p.id === postId
                              ? { ...p, isLiked, likeCount: p.likeCount + (isLiked ? 1 : -1) }
                              : p
                          )
                        );
                      }}
                      onBookmarkToggle={handleBookmarkToggleInBookmarked}
                      onDelete={(postId) => {
                        setBookmarkedPosts((prev) => prev.filter((p) => p.id !== postId));
                        setBookmarkedTotal((t) => t - 1);
                      }}
                    />
                  ))}
                </div>

                {bookmarkedHasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleBookmarkedLoadMore}
                      disabled={bookmarkedLoadingMore}
                      className="px-6 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 hover:shadow-md disabled:opacity-50"
                      style={{
                        borderColor: 'hsl(var(--theme-primary) / 0.3)',
                        color: 'hsl(var(--theme-primary))',
                      }}
                    >
                      {bookmarkedLoadingMore ? '加载中...' : '加载更多'}
                    </button>
                  </div>
                )}

                {!bookmarkedHasMore && bookmarkedPosts.length > 0 && (
                  <p className="text-center text-sm text-gray-400 py-2">已显示全部 {bookmarkedTotal} 条收藏</p>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* 回到顶部 */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-110"
          style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* 移动端悬浮发帖按钮 */}
      <Link href="/community/create"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:hidden z-40 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-white shadow-xl hover:opacity-90 transition-opacity"
        style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}>
        <Plus className="w-4 h-4" />
        发帖
      </Link>
    </main>
  );
}
