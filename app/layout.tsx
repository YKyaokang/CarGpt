import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthInitializer from "@/components/AuthInitializer";
import { ThemeProvider } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarGPT",
  description: "An AI Chatbot that demonstrates the basic concept of RAG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/*
          ThemeProvider 必须包裹整个 body 内容
          - 读取 localStorage 恢复主题 & 暗色模式
          - 动态写入 CSS 变量到 :root
          - 监听系统 prefers-color-scheme 变化
        */}
        <ThemeProvider>
          <AuthInitializer />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
