"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// ─── 预设主题定义 ───────────────────────────────────────────────────────────────
export type ThemeId = "tech-blue" | "race-red" | "aurora-purple" | "custom";
export type DarkMode = "light" | "dark" | "system";

export interface ThemePreset {
  id: ThemeId;
  label: string;
  labelCN: string;
  /** 主色调 (hex, 用于 UI 展示色块) */
  swatch: string;
  /** CSS 变量值映射 */
  vars: Record<string, string>;
}

/** 三套预设主题的亮色 CSS 变量 */
export const PRESETS: ThemePreset[] = [
  {
    id: "tech-blue",
    label: "Tech Blue",
    labelCN: "科技蓝",
    swatch: "#2563eb",
    vars: {
      "--theme-primary":        "220 91% 55%",   // hsl
      "--theme-primary-light":  "213 100% 92%",
      "--theme-primary-dark":   "224 76% 38%",
      "--theme-accent":         "199 89% 55%",
      "--theme-accent-light":   "199 100% 92%",
      "--theme-gradient-from":  "#1d4ed8",
      "--theme-gradient-to":    "#0ea5e9",
      "--theme-ring":           "220 91% 55%",
      "--theme-bubble-user-from": "#2563eb",
      "--theme-bubble-user-to":   "#0ea5e9",
      "--theme-ai-dot":         "#2563eb",
    },
  },
  {
    id: "race-red",
    label: "Race Red",
    labelCN: "赛道红",
    swatch: "#dc2626",
    vars: {
      "--theme-primary":        "0 84% 60%",
      "--theme-primary-light":  "0 100% 94%",
      "--theme-primary-dark":   "0 72% 38%",
      "--theme-accent":         "25 95% 55%",
      "--theme-accent-light":   "25 100% 92%",
      "--theme-gradient-from":  "#dc2626",
      "--theme-gradient-to":    "#f97316",
      "--theme-ring":           "0 84% 60%",
      "--theme-bubble-user-from": "#dc2626",
      "--theme-bubble-user-to":   "#f97316",
      "--theme-ai-dot":         "#dc2626",
    },
  },
  {
    id: "aurora-purple",
    label: "Aurora Purple",
    labelCN: "极光紫",
    swatch: "#7c3aed",
    vars: {
      "--theme-primary":        "262 83% 58%",
      "--theme-primary-light":  "270 100% 94%",
      "--theme-primary-dark":   "263 70% 38%",
      "--theme-accent":         "314 80% 56%",
      "--theme-accent-light":   "314 100% 93%",
      "--theme-gradient-from":  "#7c3aed",
      "--theme-gradient-to":    "#ec4899",
      "--theme-ring":           "262 83% 58%",
      "--theme-bubble-user-from": "#7c3aed",
      "--theme-bubble-user-to":   "#ec4899",
      "--theme-ai-dot":         "#7c3aed",
    },
  },
];

// ─── Context 类型 ──────────────────────────────────────────────────────────────
interface ThemeContextValue {
  themeId: ThemeId;
  darkMode: DarkMode;
  customColor: string;
  setTheme: (id: ThemeId) => void;
  setDarkMode: (mode: DarkMode) => void;
  setCustomColor: (hex: string) => void;
  currentPreset: ThemePreset | null;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── 工具：hex → hsl 字符串 ────────────────────────────────────────────────────
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** 由自定义 hex 生成动态主题变量 */
function buildCustomVars(hex: string): Record<string, string> {
  const hsl = hexToHsl(hex);
  const [h, s] = hsl.split(" ");
  return {
    "--theme-primary":        hsl,
    "--theme-primary-light":  `${h} ${s} 92%`,
    "--theme-primary-dark":   `${h} ${s} 38%`,
    "--theme-accent":         `${(parseInt(h) + 30) % 360} ${s} 55%`,
    "--theme-accent-light":   `${(parseInt(h) + 30) % 360} ${s} 92%`,
    "--theme-gradient-from":  hex,
    "--theme-gradient-to":    hex,
    "--theme-ring":           hsl,
    "--theme-bubble-user-from": hex,
    "--theme-bubble-user-to":   hex,
    "--theme-ai-dot":         hex,
  };
}

/** 将变量对象应用到 document.documentElement */
function applyVars(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val);
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("tech-blue");
  const [darkMode, setDarkModeState] = useState<DarkMode>("system");
  const [customColor, setCustomColorState] = useState<string>("#6366f1");
  const [isDark, setIsDark] = useState(false);

  // 计算真实暗色状态
  const resolveIsDark = useCallback((mode: DarkMode) => {
    if (mode === "dark") return true;
    if (mode === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, []);

  // 应用暗色模式到 html 元素
  const applyDarkClass = useCallback((dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
  }, []);

  // 应用主题变量
  const applyTheme = useCallback((id: ThemeId, hex?: string) => {
    if (id === "custom" && hex) {
      applyVars(buildCustomVars(hex));
    } else {
      const preset = PRESETS.find((p) => p.id === id);
      if (preset) applyVars(preset.vars);
    }
  }, []);

  // 初始化：从 localStorage 恢复
  useEffect(() => {
    const savedTheme = (localStorage.getItem("car-theme") as ThemeId) || "tech-blue";
    const savedDark = (localStorage.getItem("car-dark") as DarkMode) || "system";
    const savedCustom = localStorage.getItem("car-custom-color") || "#6366f1";

    setThemeId(savedTheme);
    setDarkModeState(savedDark);
    setCustomColorState(savedCustom);
    applyTheme(savedTheme, savedCustom);

    const dark = resolveIsDark(savedDark);
    applyDarkClass(dark);
  }, [applyTheme, applyDarkClass, resolveIsDark]);

  // 监听系统暗色偏好变化
  useEffect(() => {
    if (darkMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => applyDarkClass(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [darkMode, applyDarkClass]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    localStorage.setItem("car-theme", id);
    applyTheme(id, customColor);
  }, [applyTheme, customColor]);

  const setDarkMode = useCallback((mode: DarkMode) => {
    setDarkModeState(mode);
    localStorage.setItem("car-dark", mode);
    applyDarkClass(resolveIsDark(mode));
  }, [applyDarkClass, resolveIsDark]);

  const setCustomColor = useCallback((hex: string) => {
    setCustomColorState(hex);
    localStorage.setItem("car-custom-color", hex);
    if (themeId === "custom") applyTheme("custom", hex);
  }, [themeId, applyTheme]);

  const currentPreset = PRESETS.find((p) => p.id === themeId) ?? null;

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        darkMode,
        customColor,
        setTheme,
        setDarkMode,
        setCustomColor,
        currentPreset,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
