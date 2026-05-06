"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useAuth } from "@/lib/store/auth";

interface HistoryRecord {
  id: string;
  summary: string;
  createdAt: string;
  answers: {
    budget?: number;
    fuelPreference?: number;
  };
}

const FUEL_LABELS = ["燃油车", "混动/插混", "纯电动"];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }) +
    " " + d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export default function CarMatchHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/car-match/history")
      .then((r) => r.json())
      .then((data) => {
        if (data.records) setRecords(data.records);
        else setError(data.message ?? "获取失败");
      })
      .catch(() => setError("网络错误，请重试"))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/car-match" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0" title="返回">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
                历史分析记录
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">查看您的历次智能选车分析</p>
            </div>
          </div>
          <ThemeSwitcher />
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">

        {/* 未登录引导 */}
        {!authLoading && !user && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="text-5xl">🔒</div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">请先登录</h2>
            <p className="text-sm text-gray-400">登录后即可查看您的历史分析记录</p>
            <button
              onClick={() => router.push("/profile")}
              className="mt-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}
            >
              前往登录
            </button>
          </div>
        )}

        {/* 加载中 */}
        {(authLoading || (user && loading)) && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative w-14 h-14 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-700" />
              <div
                className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: `hsl(var(--theme-primary)) transparent transparent transparent` }}
              />
            </div>
            <p className="text-sm text-gray-400">加载中...</p>
          </div>
        )}

        {/* 错误 */}
        {!loading && error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400 text-center">
            ⚠️ {error}
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && user && records.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="text-5xl">📋</div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">暂无分析记录</h2>
            <p className="text-sm text-gray-400">完成一次智能选车测试后，记录将自动保存在这里</p>
            <Link
              href="/car-match"
              className="mt-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}
            >
              立即测试
            </Link>
          </div>
        )}

        {/* 记录列表 */}
        {!loading && !error && records.length > 0 && (
          <div className="space-y-3">
            {records.map((rec) => {
              const fuelLabel = rec.answers?.fuelPreference
                ? FUEL_LABELS[(rec.answers.fuelPreference as number) - 1] ?? "—"
                : "—";
              const budget = rec.answers?.budget ? `${rec.answers.budget} 万` : "—";
              return (
                <Link
                  key={rec.id}
                  href={`/car-match/history/${rec.id}`}
                  className="block rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm p-4 hover:shadow-md transition-all duration-200 group"
                  style={{ borderColor: "hsl(var(--theme-primary)/0.15)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 group-hover:text-[hsl(var(--theme-primary))] transition-colors">
                        {rec.summary}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "hsl(var(--theme-primary)/0.1)", color: "hsl(var(--theme-primary))" }}
                        >
                          预算 {budget}
                        </span>
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "hsl(var(--theme-primary)/0.1)", color: "hsl(var(--theme-primary))" }}
                        >
                          {fuelLabel}
                        </span>
                        <span className="text-[11px] text-gray-400">{formatDate(rec.createdAt)}</span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-[hsl(var(--theme-primary))] flex-shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
