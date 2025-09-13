"use client";
import { useEffect } from "react";
import { useAuth } from "@/lib/store/auth";
import { useRouter, usePathname } from "next/navigation";

export default function AuthInitializer() {
  const { fetchMe, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 中间件已经处理了token刷新，这里只需要获取用户信息
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    // 如果在首页但没有用户信息，且不是从登录页来的，重定向到登录
    if (pathname === '/' && user === null) {
      const hasTokens = document.cookie.includes('access_token') || document.cookie.includes('refresh_token');
      if (!hasTokens) {
        setTimeout(() => {
          router.replace('/auth');
        }, 1000); // 给一些时间让认证状态稳定
      }
    }
  }, [user, pathname, router]);

  return null;
}

