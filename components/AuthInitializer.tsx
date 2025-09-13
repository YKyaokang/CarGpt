"use client";
import { useEffect } from "react";
import { useAuth } from "@/lib/store/auth";

export default function AuthInitializer() {
  const { fetchMe } = useAuth();

  useEffect(() => {
    // 中间件已经处理了token刷新，这里只需要获取用户信息
    fetchMe();
  }, [fetchMe]);

  return null;
}

