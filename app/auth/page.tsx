"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/store/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Car, MessageSquare, Target, History, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import ThemeSwitcher from "@/components/ThemeSwitcher";

function getSafeRedirect(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default function AuthPage() {
  const { login, register, loading } = useAuth();
  const searchParams = useSearchParams();

  const defaultMode = searchParams.get("mode") === "register" ? "register" : "login";
  const redirectTarget = getSafeRedirect(searchParams.get("redirect"));

  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: boolean; password?: boolean }>({});

  // 切换模式时清除提示
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setFieldErrors({});
  }, [mode]);

  // 输入变化时清除错误
  function clearError() {
    if (error) setError(null);
    if (Object.keys(fieldErrors).length) setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    // 前端基础校验
    const errors: { email?: boolean; password?: boolean } = {};
    if (!email) errors.email = true;
    if (!password || password.length < 6) errors.password = true;
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setError(!email ? "请输入邮箱地址" : "密码至少需要 6 位");
      return;
    }

    try {
      if (mode === "login") {
        await login(email, password);
        setSuccess("登录成功，正在跳转...");
      } else {
        await register({ name: name || undefined, email, password });
        setSuccess("注册成功，正在跳转...");
      }
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 100);
    } catch (err: any) {
      const msg = err?.message || (mode === "login" ? "登录失败" : "注册失败");
      setError(msg);
      // 根据错误内容标记字段
      if (msg.includes("邮箱") || msg.includes("email")) setFieldErrors({ email: true });
      if (msg.includes("密码") || msg.includes("password")) setFieldErrors({ password: true });
    }
  }

  const benefits = [
    { icon: <MessageSquare className="w-4 h-4" />, text: "AI 智能对话" },
    { icon: <Target className="w-4 h-4" />, text: "智能选车匹配" },
    { icon: <History className="w-4 h-4" />, text: "保存历史记录" },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* 背景光晕 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full opacity-20 blur-[120px] animate-glow-pulse"
          style={{ background: "var(--theme-gradient-from)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] rounded-full opacity-15 blur-[100px] animate-glow-pulse"
          style={{ background: "var(--theme-gradient-to)", animationDelay: "2s" }} />
      </div>

      {/* 网格背景 */}
      <div className="absolute inset-0 -z-10 opacity-[0.02] dark:opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* 右上角主题切换 */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md animate-slideUp">
        {/* 品牌区 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
              style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
              CarGPT
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === "login" ? "欢迎回来" : "创建账号"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {mode === "login" ? "登录以继续使用 CarGPT" : "注册以解锁全部功能"}
          </p>
        </div>

        {/* 卡片 */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/40 rounded-2xl shadow-2xl p-7"
          style={{ boxShadow: "0 20px 60px hsl(var(--theme-primary) / 0.08)" }}>

          {/* 模式切换 */}
          <div className="flex p-1 mb-6 rounded-xl bg-gray-100/80 dark:bg-gray-800/80">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                mode === "login"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}>
              登录
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                mode === "register"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}>
              注册
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">昵称</label>
                <Input
                  placeholder="你的名字（可选）"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearError(); }}
                  className="h-10 rounded-xl"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">邮箱</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                required
                aria-invalid={fieldErrors.email || undefined}
                className="h-10 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">密码</label>
              <Input
                type="password"
                placeholder="至少 6 位"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                required
                aria-invalid={fieldErrors.password || undefined}
                className="h-10 rounded-xl"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 animate-fadeIn">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 成功提示 */}
            {success && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-600 dark:text-green-400 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 rounded-xl text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}
              disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  处理中...
                </span>
              ) : mode === "login" ? "登录" : "注册并登录"}
            </Button>
          </form>

          {/* 功能亮点 */}
          <div className="mt-6 pt-5 border-t border-gray-200/60 dark:border-gray-700/40">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-3">登录后即可使用</p>
            <div className="flex items-center justify-center gap-4">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span style={{ color: "hsl(var(--theme-primary))" }}>{b.icon}</span>
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部链接 */}
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-6 text-center">
          <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline underline-offset-2">
            返回首页
          </Link>
        </p>
      </div>
    </main>
  );
}
