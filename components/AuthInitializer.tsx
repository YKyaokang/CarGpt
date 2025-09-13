"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/store/auth";
import { useRouter, usePathname } from "next/navigation";

export default function AuthInitializer() {
  const { fetchMe, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    // 中间件已经处理了token刷新，这里只需要获取用户信息
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    // 只在首页进行检查
    if (pathname !== '/') return;
    
    // 如果已经有用户信息，不需要检查
    if (user) return;
    
    // 限制检查次数，避免无限循环
    if (checkCount >= 3) return;
    
    const timer = setTimeout(() => {
      const hasTokens = document.cookie.includes('access_token') || document.cookie.includes('refresh_token');
      
      if (!hasTokens && user === null) {
        // 没有token且没有用户信息，重定向到登录页
        router.replace('/auth');
      } else if (hasTokens && user === null) {
        // 有token但没有用户信息，重新尝试获取用户信息
        fetchMe();
        setCheckCount(prev => prev + 1);
      }
    }, 1500); // 给更多时间让认证状态稳定

    return () => clearTimeout(timer);
  }, [user, pathname, router, checkCount, fetchMe]);

  return null;
}

