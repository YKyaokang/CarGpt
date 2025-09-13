"use client";
// hooks 
import {
  useChat
} from '@ai-sdk/react';
import ChatOutput from '@/components/ChatOutput';
import ChatInput from '@/components/ChatInput';
import Link from 'next/link';
import { useAuth } from '@/lib/store/auth';

export default function Home() {
  // chat llm 业务 抽离
  const {
    input, // 输入框的值
    messages, // 消息列表
    status, // 状态 
    handleInputChange, // 输入框变化
    handleSubmit, // 提交
  } = useChat();
  
  console.log(status)
  const { user } = useAuth();
  
  const suggestions = [
    "请问2025年9月发布了哪些车？",
    "20万预算推荐哪些新能源SUV？",
    "宝马BMW i4的续航大概是多少？",
    "如何保养涡轮增压发动机？",
  ];
  
  const onSuggestionClick = (text: string) => {
    // 通过 handleInputChange 预填输入框
    // 这里模拟一个事件对象，保持与 Input 的 onChange 兼容
    handleInputChange({ target: { value: text } } as any);
  }
  
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🚗 CarGPT
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your AI assistant for all car-related questions</p>
        </div>
        {/* Scrolling Announcement */}
        <div className="overflow-hidden border-t border-gray-200/60 dark:border-gray-700/60 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="whitespace-nowrap py-1 text-sm text-blue-700 dark:text-blue-300 animate-marquee">
              CarGpt信息已经更新到了2025年9月，欢迎体验！
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 h-[calc(100vh-220px)] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <ChatOutput messages={messages} status={status} />
            {messages.length === 0 && (
              <div className="text-center py-12 animate-fadeIn">
                <div className="text-6xl mb-4 animate-pulse-slow">🚗</div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Welcome to CarGPT!</h2>
                <p className="text-muted-foreground mb-6">Ask me anything about cars, automotive technology, or vehicle maintenance.</p>
                {!user && (
                  <Link href="/auth" className="block mb-6">
                    <div className="rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/30 px-4 py-3 inline-flex items-center gap-3 hover:shadow transition">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">请登录解锁更多！</span>
                      <span className="text-blue-600/80 dark:text-blue-400/80 text-sm">点击前往登录 / 注册</span>
                    </div>
                  </Link>
                )}
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Car Maintenance</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">Electric Vehicles</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">Car Reviews</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">Auto Technology</span>
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
                  className="rounded-full border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/50 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition"
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
  )
}