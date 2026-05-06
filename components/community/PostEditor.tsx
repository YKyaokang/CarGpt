"use client";

import { useState, useRef, useCallback } from 'react';
import { ImagePlus, X, Bold, Italic, List, Hash, AtSign, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { UploadedImage, UserSearchResult } from '@/types/community';
import ReactMarkdown from 'react-markdown';

interface Props {
  initialTitle?: string;
  initialContent?: string;
  initialImages?: UploadedImage[];
  initialTags?: string[];
  onPublish: (data: {
    title: string;
    content: string;
    images: UploadedImage[];
    tags: string[];
    mentions: string[];
    status: 'published' | 'draft';
  }) => Promise<void>;
  submitting?: boolean;
}

/** 图片压缩（前端缩放 + JPEG 压缩） */
function compressImage(file: File, maxPx = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          const ratio = Math.min(maxPx / width, maxPx / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function PostEditor({
  initialTitle = '',
  initialContent = '',
  initialImages = [],
  initialTags = [],
  onPublish,
  submitting = false,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mentions, setMentions] = useState<string[]>([]);

  // @ mention 搜索
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<UserSearchResult[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const mentionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const remaining = 9 - images.length;
    if (remaining <= 0) return;
    setUploading(true);
    const toUpload = Array.from(files).slice(0, remaining);
    const compressed = await Promise.all(
      toUpload.map(async (f, i) => {
        const url = await compressImage(f);
        return {
          url,
          order: images.length + i,
          fileName: f.name,
          mimeType: 'image/jpeg',
          size: Math.round(url.length * 0.75),
          previewUrl: url,
        } satisfies UploadedImage;
      })
    );
    setImages((prev) => [...prev, ...compressed]);
    setUploading(false);
  }, [images.length]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, order: i })));
  };

  const addTag = () => {
    const t = tagInput.replace(/^#|#$/g, '').trim();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  /** 监听 textarea 输入，检测 @ 触发 */
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const match = before.match(/@(\w*)$/);
    if (match) {
      const q = match[1];
      setMentionQuery(q);
      setShowMentionDropdown(true);
      clearTimeout(mentionTimer.current);
      mentionTimer.current = setTimeout(async () => {
        if (q.length < 1) { setMentionResults([]); return; }
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
          const data = await res.json();
          if (res.ok) setMentionResults(data.users);
        } catch {}
      }, 300);
    } else {
      setShowMentionDropdown(false);
      setMentionResults([]);
    }
  };

  const insertMention = (user: UserSearchResult) => {
    const displayName = user.name ?? user.email.split('@')[0];
    const cursor = textareaRef.current?.selectionStart ?? content.length;
    const before = content.slice(0, cursor);
    const after = content.slice(cursor);
    const replaced = before.replace(/@\w*$/, `@${displayName} `);
    setContent(replaced + after);
    if (!mentions.includes(user.id)) setMentions((prev) => [...prev, user.id]);
    setShowMentionDropdown(false);
    setMentionResults([]);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  /** Markdown 快捷插入 */
  const insertMarkdown = (prefix: string, suffix = '', placeholder = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const newContent = content.slice(0, start) + prefix + selected + suffix + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const handleSubmit = async (status: 'published' | 'draft') => {
    if (!content.trim() && status === 'published') return;
    await onPublish({ title, content, images, tags, mentions, status });
  };

  const contentWordCount = content.trim().length;
  const canPublish = contentWordCount > 0 && !submitting;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* 标题输入 */}
      <input
        type="text"
        placeholder="输入标题（可选）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
        className="w-full px-4 py-3 text-lg font-semibold rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 transition-shadow"
        style={{ '--tw-ring-color': 'hsl(var(--theme-primary) / 0.3)' } as React.CSSProperties}
      />

      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-gray-200/60 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/40 flex-wrap">
        <button type="button" title="加粗" onClick={() => insertMarkdown('**', '**', '粗体文字')}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" title="斜体" onClick={() => insertMarkdown('*', '*', '斜体文字')}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" title="列表" onClick={() => insertMarkdown('\n- ', '', '列表项')}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <List className="w-4 h-4" />
        </button>
        <button type="button" title="插入话题" onClick={() => insertMarkdown('#', '#', '话题')}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <Hash className="w-4 h-4" />
        </button>
        <button type="button" title="@提及" onClick={() => { setContent((c) => c + '@'); textareaRef.current?.focus(); }}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <AtSign className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 pr-1">{contentWordCount} 字</span>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-all duration-200"
          style={preview
            ? { background: 'hsl(var(--theme-primary) / 0.15)', color: 'hsl(var(--theme-primary))' }
            : { color: 'hsl(var(--theme-primary) / 0.7)' }}
        >
          {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {preview ? '编辑' : '预览'}
        </button>
      </div>

      {/* 编辑 / 预览区域 */}
      <div className="relative flex-1 min-h-[280px]">
        {!preview ? (
          <div className="relative h-full">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="记录你的爱车故事，输入 # 添加话题，@ 提及用户..."
              className="w-full h-full min-h-[280px] px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 resize-none transition-shadow leading-relaxed"
              style={{ '--tw-ring-color': 'hsl(var(--theme-primary) / 0.3)' } as React.CSSProperties}
            />
            {/* @ mention 下拉 */}
            {showMentionDropdown && mentionResults.length > 0 && (
              <div className="absolute left-0 right-0 z-30 mt-1 rounded-xl border border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
                {mentionResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}>
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : (u.name ?? u.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name ?? '未命名'}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full min-h-[280px] px-4 py-3 rounded-xl border border-gray-200/60 dark:border-gray-700/40 bg-gray-50/60 dark:bg-gray-800/40 prose prose-sm dark:prose-invert max-w-none overflow-auto">
            {content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <p className="text-gray-400 italic">预览区域（暂无内容）</p>
            )}
          </div>
        )}
      </div>

      {/* 图片上传 */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleImageFiles(e.target.files)}
        />
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                <img src={img.previewUrl ?? img.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 transition-colors"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                <span className="text-xs">{images.length}/9</span>
              </button>
            )}
          </div>
        )}
        {images.length === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            添加图片（最多 9 张）
          </button>
        )}
      </div>

      {/* 标签区域 */}
      <div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {tags.map((t) => (
            <span key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: 'hsl(var(--theme-primary) / 0.1)', color: 'hsl(var(--theme-primary))' }}>
              #{t}
              <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {tags.length < 5 && (
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTag}
              placeholder={tags.length === 0 ? '# 添加话题标签，回车确认（最多5个）' : '# 继续添加...'}
              className="flex-1 min-w-[160px] px-2 py-1 text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* 发布按钮 */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/50">
        <button
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={!canPublish && !content.trim()}
          className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
        >
          存草稿
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('published')}
          disabled={!canPublish}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:opacity-90 disabled:opacity-40 shadow-md"
          style={{ background: 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))' }}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? '发布中...' : '立即发布'}
        </button>
      </div>
    </div>
  );
}
