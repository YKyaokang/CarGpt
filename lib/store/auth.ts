"use client";
import { create } from "zustand";

export type User = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
  carBrand: string | null;
  carModel: string | null;
  carYear: number | null;
};

export type UpdateUserProfilePayload = {
  name?: string;
  email?: string;
  phone?: string;
  carBrand?: string;
  carModel?: string;
  carYear?: number | null;
  avatarUrl?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (params: { name?: string; email: string; password: string }) => Promise<void>;
  fetchMe: () => Promise<void>;
  updateProfile: (payload: UpdateUserProfilePayload) => Promise<void>;
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

  async updateProfile(payload) {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "更新失败");
      set({ user: data.user, loading: false });
    } catch (e: any) {
      set({ error: e.message || "更新失败", loading: false });
      throw e;
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



