"use client";
import { useChat } from '@ai-sdk/react';
import ChatOutput from '@/components/ChatOutput';
import ChatInput from '@/components/ChatInput';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function Home() {
  const {
    input,
    messages,
    status,
    handleInputChange,
    handleSubmit,
  } = useChat();

  const suggestions = [
    "请问2026年3月发布了哪些车？",
    "20万预算推荐哪些新能源SUV？",
    "宝马BMW i4的续航大概是多少？",
    "如何保养涡轮增压发动机？",
  ];

  const onSuggestionClick = (text: string) => {
    handleInputChange({ target: { value: text } } as any);
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="min-w-0">
            <h1
              className="text-2xl font-bold bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))",
              }}
            >
              🚗 CarGPT
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Your AI assistant for all car-related questions
            </p>
          </div>

          {/* 主题切换器 */}
          <ThemeSwitcher />
        </div>

        {/* 滚动公告栏 */}
        <div
          className="overflow-hidden border-t border-gray-200/60 dark:border-gray-700/60"
          style={{ backgroundColor: 'hsl(var(--theme-primary) / 0.06)' }}
        >
          <div className="max-w-4xl mx-auto px-4">
            <div
              className="whitespace-nowrap py-1 text-sm animate-marquee"
              style={{ color: 'hsl(var(--theme-primary))' }}
            >
              CarGpt信息已经更新到了2026年3月，欢迎体验！
            </div>
          </div>
        </div>
      </div>

      {/* ── Chat Container ── */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div
          className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 h-[calc(100vh-220px)] flex flex-col"
          style={{ boxShadow: '0 8px 40px hsl(var(--theme-primary) / 0.08)' }}
        >
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <ChatOutput messages={messages} status={status} />
            {messages.length === 0 && (
              <div className="text-center py-12 animate-fadeIn">
                <div className="text-6xl mb-4 animate-pulse-slow">🚗</div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Welcome to CarGPT!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Ask me anything about cars, automotive technology, or vehicle maintenance.
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                  {[
                    { label: 'Car Maintenance',   themeVar: '--theme-primary' },
                    { label: 'Electric Vehicles', themeVar: '--theme-accent' },
                    { label: 'Car Reviews',       themeVar: '--theme-primary-dark' },
                    { label: 'Auto Technology',   themeVar: '--theme-accent' },
                  ].map(({ label, themeVar }) => (
                    <span
                      key={label}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: `hsl(var(${themeVar}) / 0.12)`,
                        color: `hsl(var(${themeVar}))`,
                        border: `1px solid hsl(var(${themeVar}) / 0.25)`,
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50">
            {/* Prompt Suggestions */}
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSuggestionClick(s)}
                  className="rounded-full border px-3 py-1 text-xs
                    bg-white/70 dark:bg-gray-800/50
                    text-gray-700 dark:text-gray-200
                    hover:bg-gray-50 dark:hover:bg-gray-800/70
                    transition-all duration-200"
                  style={{ borderColor: 'hsl(var(--theme-primary) / 0.3)' }}
                >
                  {s}
                </button>
              ))}
            </div>
            <ChatInput
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
