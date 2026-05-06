"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import CarMatchResult, { type MatchData } from "@/components/CarMatchResult";
import { useAuth } from "@/lib/store/auth";

interface RecordDetail {
  id: string;
  summary: string;
  createdAt: string;
  result: MatchData;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }) +
    " " + d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export default function CarMatchHistoryDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetch(`/api/car-match/history/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.record) setRecord(data.record);
        else setError(data.message ?? "获取失败");
      })
      .catch(() => setError("网络错误，请重试"))
      .finally(() => setLoading(false));
  }, [user, authLoading, params.id]);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/car-match/history" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0" title="返回记录列表">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
                选车分析详情
              </h1>
              {record && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(record.createdAt)}</p>
              )}
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
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="text-5xl">😕</div>
            <p className="text-sm text-gray-500">{error}</p>
            <Link
              href="/car-match/history"
              className="text-sm font-medium"
              style={{ color: "hsl(var(--theme-primary))" }}
            >
              返回列表
            </Link>
          </div>
        )}

        {/* 结果展示 */}
        {!loading && !error && record && (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">专属选车报告</h2>
              <p className="text-xs text-gray-400 mt-1">{formatDate(record.createdAt)}</p>
            </div>
            <CarMatchResult
              data={record.result}
              onRetry={() => router.push("/car-match")}
            />
          </div>
        )}

      </div>
    </main>
  );
}
