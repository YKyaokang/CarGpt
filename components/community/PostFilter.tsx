"use client";

import { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import type { PostFilterParams, SortBy } from '@/types/community';

interface Props {
  value: PostFilterParams;
  onChange: (params: PostFilterParams) => void;
  popularTags?: string[];
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'latest', label: '最新' },
  { value: 'popular', label: '最热' },
  { value: 'commented', label: '最多评论' },
];

export default function PostFilter({ value, onChange, popularTags = [] }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [keyword, setKeyword] = useState(value.keyword ?? '');

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword !== (value.keyword ?? '')) {
        onChange({ ...value, keyword: keyword || undefined, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilter =
    value.startDate || value.endDate || value.tag || value.keyword;

  const clearAll = () => {
    setKeyword('');
    onChange({ sort: value.sort, page: 1, pageSize: value.pageSize });
  };

  return (
    <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm p-4 space-y-3">
      {/* 第一行：搜索 + 排序 + 展开按钮 */}
      <div className="flex items-center gap-2">
        {/* 搜索框 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索帖子..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 transition-shadow"
            style={{ '--tw-ring-color': 'hsl(var(--theme-primary) / 0.3)' } as React.CSSProperties}
          />
        </div>

        {/* 排序 Tab */}
        <div className="hidden sm:flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/60 p-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...value, sort: opt.value, page: 1 })}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200"
              style={
                value.sort === opt.value
                  ? {
                      background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))',
                      color: 'white',
                    }
                  : { color: 'hsl(var(--theme-primary) / 0.8)' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 展开筛选 */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border transition-all duration-200"
          style={{
            borderColor: hasActiveFilter ? 'hsl(var(--theme-primary) / 0.5)' : 'hsl(var(--theme-primary) / 0.25)',
            color: 'hsl(var(--theme-primary))',
            background: hasActiveFilter ? 'hsl(var(--theme-primary) / 0.08)' : 'transparent',
          }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">筛选</span>
          {hasActiveFilter && (
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
          )}
        </button>
      </div>

      {/* 移动端排序 */}
      <div className="flex sm:hidden items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/60 p-1">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...value, sort: opt.value, page: 1 })}
            className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200"
            style={
              value.sort === opt.value
                ? {
                    background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))',
                    color: 'white',
                  }
                : { color: 'hsl(var(--theme-primary) / 0.8)' }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 展开的高级筛选 */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700/50">
          {/* 时间范围 */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">发布时间</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={value.startDate ?? ''}
                onChange={(e) => onChange({ ...value, startDate: e.target.value || undefined, page: 1 })}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-shadow"
                style={{ '--tw-ring-color': 'hsl(var(--theme-primary) / 0.3)' } as React.CSSProperties}
              />
              <span className="text-gray-400 text-sm flex-shrink-0">至</span>
              <input
                type="date"
                value={value.endDate ?? ''}
                min={value.startDate}
                onChange={(e) => onChange({ ...value, endDate: e.target.value || undefined, page: 1 })}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-shadow"
                style={{ '--tw-ring-color': 'hsl(var(--theme-primary) / 0.3)' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* 话题标签 */}
          {popularTags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">话题标签</p>
              <div className="flex flex-wrap gap-1.5">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onChange({ ...value, tag: value.tag === tag ? undefined : tag, page: 1 })}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
                    style={
                      value.tag === tag
                        ? {
                            background: 'hsl(var(--theme-primary))',
                            color: 'white',
                          }
                        : {
                            background: 'hsl(var(--theme-primary) / 0.1)',
                            color: 'hsl(var(--theme-primary))',
                            border: '1px solid hsl(var(--theme-primary) / 0.2)',
                          }
                    }
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 清空筛选 */}
          {hasActiveFilter && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              清空筛选
            </button>
          )}
        </div>
      )}
    </div>
  );
}
