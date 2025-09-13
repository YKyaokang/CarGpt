"use client";
import { create } from "zustand";

type User = { id: string; email: string; name: string | null };

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (params: { name?: string; email: string; password: string }) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
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
      set({ user: data.user, loading: false });
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
      set({ user: data.user, loading: false });
    } catch (e: any) {
      set({ error: e.message || "注册失败", loading: false });
      throw e;
    }
  },

  async fetchMe() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) {
        set({ user: data.user });
      } else {
        set({ user: null });
      }
    } catch (e) {
      set({ user: null });
    }
  },

  async logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (e) {
      // ignore error
    }
    set({ user: null });
  },
}));



