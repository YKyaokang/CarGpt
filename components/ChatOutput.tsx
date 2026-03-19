"use client";
import type { Message } from "ai";
import ReactMarkdown from "react-markdown";

interface ChatOutputProps {
  messages: Message[];
  status: string;
}

export default function ChatOutput({ messages, status }: ChatOutputProps) {
  return (
    <>
      {messages.map((message, index) =>
        message.role === "user" ? (
          <UserChat key={index} content={message.content} />
        ) : (
          <AssistantChat key={index} content={message.content} />
        )
      )}

      {status === "submitted" && (
        <div className="flex items-center gap-2 text-muted-foreground p-4">
          <div className="flex space-x-1">
            {[0, 0.15, 0.3].map((delay, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  backgroundColor: 'hsl(var(--theme-primary))',
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </div>
          <span>AI is thinking...</span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>Something went wrong. Please try again.</span>
        </div>
      )}
    </>
  );
}

const UserChat = ({ content }: { content: any }) => (
  <div className="flex justify-end mb-6 animate-fadeIn">
    <div
      className="theme-bubble-user text-white rounded-2xl rounded-br-md
        max-w-[80%] w-fit px-4 py-3 shadow-lg
        transform transition-all duration-200 hover:scale-[1.02]"
    >
      <p className="text-sm leading-relaxed">{content}</p>
    </div>
  </div>
);

const AssistantChat = ({ content }: { content: any }) => (
  <div className="flex justify-start mb-6 animate-slideUp">
    <div className="max-w-[85%]">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 theme-ai-avatar rounded-full flex items-center justify-center shadow-md"
        >
          <span className="text-white text-sm font-bold">AI</span>
        </div>
        <span className="text-xs text-muted-foreground">CarGPT</span>
      </div>
      <div
        className="bg-white dark:bg-gray-700 rounded-2xl rounded-tl-md p-4
          shadow-md border border-gray-200 dark:border-gray-600
          transform transition-all duration-200 hover:shadow-lg"
      >
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <a
                  target="_blank"
                  href={href}
                  className="underline"
                  style={{ color: 'hsl(var(--theme-primary))' }}
                >
                  {children}
                </a>
              ),
              p: ({ children }) => (
                <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
              ),
              code: ({ children }) => (
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto">
                  {children}
                </pre>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  </div>
);
