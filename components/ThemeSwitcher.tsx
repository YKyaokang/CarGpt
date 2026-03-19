"use client";
import { useState, useRef, useEffect } from "react";
import { useTheme, PRESETS, type ThemeId, type DarkMode } from "@/lib/theme";
import { Palette, Sun, Moon, Monitor, ChevronDown } from "lucide-react";

export default function ThemeSwitcher() {
  const { themeId, darkMode, customColor, setTheme, setDarkMode, setCustomColor, isDark } =
    useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭面板
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const darkModes: { id: DarkMode; icon: React.ReactNode; label: string }[] = [
    { id: "light",  icon: <Sun     className="w-3.5 h-3.5" />, label: "亮色" },
    { id: "system", icon: <Monitor className="w-3.5 h-3.5" />, label: "跟随" },
    { id: "dark",   icon: <Moon    className="w-3.5 h-3.5" />, label: "暗色" },
  ];

  const activePreset = PRESETS.find((p) => p.id === themeId);
  const triggerColor =
    themeId === "custom" ? customColor : (activePreset?.swatch ?? "#2563eb");

  return (
    <div ref={panelRef} className="relative">
      {/* ── 触发按钮 ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="切换主题"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border
          transition-all duration-300
          bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm
          border-[color:hsl(var(--theme-primary)/0.3)]
          hover:border-[color:hsl(var(--theme-primary)/0.8)]
          hover:shadow-[0_0_14px_hsl(var(--theme-primary)/0.35)]
          text-gray-700 dark:text-gray-200 text-xs font-medium select-none"
      >
        <span
          className="w-3.5 h-3.5 rounded-full ring-1 ring-white/60 shadow-sm flex-shrink-0 transition-all duration-300"
          style={{ background: triggerColor }}
        />
        <span className="hidden sm:inline">
          {themeId === "custom" ? "自定义" : (activePreset?.labelCN ?? "主题")}
        </span>
        <Palette className="w-3 h-3 opacity-60" />
        <ChevronDown
          className={`w-3 h-3 opacity-60 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ── 面板 ── */}
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] w-64 sm:w-72
            bg-white/96 dark:bg-gray-900/96 backdrop-blur-xl
            border border-gray-200/70 dark:border-gray-700/70
            rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/50
            p-4 z-50
            animate-[themePanel_0.18s_ease-out]"
        >
          {/* 预设主题标题 */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            预设主题
          </p>

          {/* 三套预设色块 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {PRESETS.map((preset) => {
              const active = themeId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setTheme(preset.id)}
                  className={`group relative flex flex-col items-center gap-2 p-3
                    rounded-xl border-2 transition-all duration-200
                    ${
                      active
                        ? "border-[color:hsl(var(--theme-primary))] bg-[hsl(var(--theme-primary)/0.06)]"
                        : "border-gray-200/80 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600"
                    }
                  `}
                >
                  {/* 渐变色块 */}
                  <span
                    className="w-8 h-8 rounded-lg shadow-md ring-2 ring-white/40 dark:ring-black/30 transition-transform duration-200 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${preset.vars["--theme-gradient-from"]}, ${preset.vars["--theme-gradient-to"]})`,
                    }}
                  />
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    {preset.labelCN}
                  </span>
                  {active && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[hsl(var(--theme-primary))] flex items-center justify-center">
                      <svg viewBox="0 0 10 10" className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1.5 5.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 自定义主题色 */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
              自定义主题色
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => colorInputRef.current?.click()}
                className={`relative w-8 h-8 rounded-lg shadow-md ring-2 ring-white/40 dark:ring-black/30
                  cursor-pointer hover:scale-110 transition-transform duration-200 flex-shrink-0
                  ${
                    themeId === "custom"
                      ? "ring-[color:hsl(var(--theme-primary))]"
                      : "ring-gray-300 dark:ring-gray-600"
                  }`}
                style={{ background: customColor }}
                aria-label="选择自定义颜色"
              >
                <input
                  ref={colorInputRef}
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setTheme("custom" as ThemeId);
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {customColor.toUpperCase()}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-600">点击色块选色</p>
              </div>
              <button
                onClick={() => setTheme("custom" as ThemeId)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200
                  ${
                    themeId === "custom"
                      ? "bg-[hsl(var(--theme-primary))] text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
              >
                {themeId === "custom" ? "已应用" : "应用"}
              </button>
            </div>
          </div>

          {/* 分割线 */}
          <div className="border-t border-gray-200/60 dark:border-gray-700/60 mb-3" />

          {/* 暗黑模式切换 */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            显示模式
          </p>
          <div className="flex gap-1.5">
            {darkModes.map(({ id, icon, label }) => {
              const active = darkMode === id;
              return (
                <button
                  key={id}
                  onClick={() => setDarkMode(id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-1
                    rounded-xl border text-[11px] font-medium transition-all duration-200
                    ${
                      active
                        ? "border-[color:hsl(var(--theme-primary))] bg-[hsl(var(--theme-primary)/0.08)] text-[hsl(var(--theme-primary))]"
                        : "border-gray-200/80 dark:border-gray-700/80 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    }
                  `}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          </div>

          {/* 当前状态指示 */}
          <p className="mt-3 text-center text-[10px] text-gray-400 dark:text-gray-600">
            当前：{isDark ? "🌙 暗色" : "☀️ 亮色"}
            {" · "}
            {themeId === "custom" ? "自定义" : activePreset?.labelCN}
          </p>
        </div>
      )}
    </div>
  );
}
