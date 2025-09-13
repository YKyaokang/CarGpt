"use client";
import { create } from "zustand";

type User = { id: string; email: string; name: string | null };

type AuthState = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (params: { name?: string; email: string; password: string }) => Promise<void>;
  refresh: () => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  loading: false,
  error: null,

  async login(email, password) {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "登录失败");
      set({ accessToken: data.accessToken, user: data.user, loading: false });
    } catch (e: any) {
      set({ error: e.message || "登录失败", loading: false });
      throw e;
    }
  },

  async register(params) {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "注册失败");
      set({ accessToken: data.accessToken, user: data.user, loading: false });
    } catch (e: any) {
      set({ error: e.message || "注册失败", loading: false });
      throw e;
    }
  },

  async refresh() {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "刷新失败");
      set({ accessToken: data.accessToken });
    } catch (e) {
      // ignore; user may be logged out
    }
  },

  async fetchMe() {
    const token = get().accessToken;
    if (!token) return;
    const res = await fetch("/api/auth/me", {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) set({ user: data.user });
  },

  async logout() {
    const token = get().accessToken;
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    });
    set({ accessToken: null, user: null });
  },
}));


