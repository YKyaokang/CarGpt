"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useAuth } from "@/lib/store/auth";
import { MessageSquare, Target, Database, Zap, Brain, Car, ArrowRight, ChevronDown, LogIn, UserPlus, Users } from "lucide-react";

/* ── 计数动画 Hook ── */
function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  return { count, ref };
}

/* ── 滚动入场 Hook ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/* ══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "用户";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* ═══ Navbar ═══ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20"
          : "bg-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
              CarGPT
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/chat"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              AI 对话
            </Link>
            <Link href="/car-match"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              智能选车
            </Link>
            <Link href="/community"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              社区
            </Link>
            <Link href="/profile"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              个人资料
            </Link>
            <ThemeSwitcher />
            {!user && (
              <>
                <Link href="/auth"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <LogIn className="w-4 h-4" />
                  登录
                </Link>
                <Link href="/auth?mode=register"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90 shadow-md"
                  style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
                  <UserPlus className="w-4 h-4" />
                  注册
                </Link>
              </>
            )}
            {user && (
              <div className="hidden sm:flex items-center px-4 py-2 rounded-xl text-sm font-medium border border-gray-200/60 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-700 dark:text-gray-200">
                {`欢迎您! 亲爱的${displayName}`}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <HeroSection />

      {/* ═══ Features ═══ */}
      <FeaturesSection />

      {/* ═══ Stats ═══ */}
      <StatsSection />

      {/* ═══ How it works ═══ */}
      <HowItWorksSection />

      {/* ═══ CTA ═══ */}
      <CTASection user={user} />

      {/* ═══ Footer ═══ */}
      <Footer />
    </main>
  );
}

/* ══════════════════ Hero ══════════════════ */
function HeroSection() {
  const { user } = useAuth();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 背景光晕 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] animate-glow-pulse"
          style={{ background: "var(--theme-gradient-from)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] animate-glow-pulse"
          style={{ background: "var(--theme-gradient-to)", animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[150px]"
          style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }} />
      </div>

      {/* 网格背景 */}
      <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]"
        style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="max-w-5xl mx-auto px-6 text-center pt-24 pb-16">
        {/* 标签 */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8 animate-fadeIn"
          style={{ borderColor: "hsl(var(--theme-primary) / 0.3)", background: "hsl(var(--theme-primary) / 0.06)" }}>
          <Zap className="w-3.5 h-3.5" style={{ color: "hsl(var(--theme-primary))" }} />
          <span className="text-xs font-medium" style={{ color: "hsl(var(--theme-primary))" }}>
            数据已更新至 2026 年 3 月
          </span>
        </div>

        {/* 主标题 */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 animate-slideUp">
          <span className="text-gray-900 dark:text-white">你的 AI</span>
          <br />
          <span className="bg-clip-text text-transparent animate-gradient"
            style={{ backgroundImage: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to), var(--theme-gradient-from))", backgroundSize: "200% 200%" }}>
            汽车智能助手
          </span>
        </h1>

        {/* 副标题 */}
        <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 animate-slideUp" style={{ animationDelay: "0.1s" }}>
          基于 RAG 技术，覆盖海量车型数据与专业知识，为你提供精准的汽车咨询与智能选车服务
        </p>

        {/* CTA 按钮 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-slideUp" style={{ animationDelay: "0.2s" }}>
          <Link href="/chat"
            className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-semibold text-base shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
            style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))", boxShadow: "0 8px 30px hsl(var(--theme-primary) / 0.35)" }}>
            <MessageSquare className="w-5 h-5" />
            开始对话
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/car-match"
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-base border-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
            style={{ borderColor: "hsl(var(--theme-primary) / 0.4)", color: "hsl(var(--theme-primary))" }}>
            <Target className="w-5 h-5" />
            智能选车
          </Link>
          <Link href="/community"
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-base border-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
            style={{ borderColor: "hsl(var(--theme-primary) / 0.4)", color: "hsl(var(--theme-primary))" }}>
            <Users className="w-5 h-5" />
            社区广场
          </Link>
        </div>

        {/* 登录提示 */}
        {!user && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-16 animate-slideUp" style={{ animationDelay: "0.25s" }}>
            AI 对话与智能选车需
            <Link href="/auth" className="underline underline-offset-2 mx-0.5" style={{ color: "hsl(var(--theme-primary))" }}>登录</Link>
            后使用
          </p>
        )}
        {user && <div className="mb-16" />}

        {/* 聊天预览 */}
        <ChatPreview />

        {/* 向下滚动提示 */}
        <div className="mt-12 animate-float">
          <ChevronDown className="w-6 h-6 mx-auto text-gray-300 dark:text-gray-600" />
        </div>
      </div>
    </section>
  );
}

/* ── 聊天预览卡片 ── */
function ChatPreview() {
  return (
    <div className="max-w-2xl mx-auto animate-scale-in" style={{ animationDelay: "0.4s" }}>
      <div className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl shadow-2xl overflow-hidden"
        style={{ boxShadow: "0 20px 60px hsl(var(--theme-primary) / 0.1)" }}>
        {/* 顶栏 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <span className="w-3 h-3 rounded-full bg-green-400/70" />
          </div>
          <span className="text-xs text-gray-400 ml-2">CarGPT Chat</span>
        </div>
        {/* 消息 */}
        <div className="p-5 space-y-4">
          <div className="flex justify-end">
            <div className="px-4 py-2.5 rounded-2xl rounded-br-md text-white text-sm max-w-[75%]"
              style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
              20 万预算推荐哪些新能源 SUV？
            </div>
          </div>
          <div className="flex justify-start gap-2">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center shadow-md"
              style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-tl-md px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 max-w-[80%] border border-gray-100 dark:border-gray-600">
              为您推荐以下几款 20 万级新能源 SUV：比亚迪宋 PLUS DM-i、深蓝 S7、零跑 C11...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ Features ══════════════════ */
function FeaturesSection() {
  const reveal = useScrollReveal();
  const features = [
    {
      icon: <Brain className="w-7 h-7" />,
      title: "AI 智能问答",
      desc: "基于 RAG 检索增强生成技术，精准回答各类汽车问题，从选购到保养全覆盖",
    },
    {
      icon: <Target className="w-7 h-7" />,
      title: "智能选车匹配",
      desc: "20 维度性格与习惯分析，AI 深度理解你的需求，推荐最适合的车型",
    },
    {
      icon: <Database className="w-7 h-7" />,
      title: "实时数据更新",
      desc: "持续更新至 2026 年最新车型数据，涵盖参数、价格、评测等全方位信息",
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: "车主社区",
      desc: "图文发帖、话题标签、@提及，与同好车主交流改装经验、驾驶心得",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div ref={reveal.ref} className={`max-w-6xl mx-auto transition-all duration-700 ${reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            强大的 AI 汽车助手能力
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            融合前沿 AI 技术与专业汽车知识，为你提供全方位的智能服务
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i}
              className="group relative p-8 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/50 dark:bg-gray-800/40 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-transparent"
              style={{ transitionDelay: `${i * 100}ms` }}>
              {/* hover 渐变边框 */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
                style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))", padding: "1px" }}>
                <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-800" />
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-white shadow-lg"
                style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════ Stats ══════════════════ */
function StatsSection() {
  const stats = [
    { end: 500, suffix: "+", label: "覆盖车型" },
    { end: 10000, suffix: "+", label: "知识库条目" },
    { end: 20, suffix: "维", label: "选车维度" },
    { end: 98, suffix: "%", label: "回答准确率" },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl border border-gray-200/50 dark:border-gray-700/40 bg-white/40 dark:bg-gray-800/30 backdrop-blur-sm p-10 sm:p-14"
          style={{ boxShadow: "0 10px 50px hsl(var(--theme-primary) / 0.06)" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <StatItem key={i} end={s.end} suffix={s.suffix} label={s.label} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatItem({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(end);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent mb-2"
        style={{ backgroundImage: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

/* ══════════════════ How it works ══════════════════ */
function HowItWorksSection() {
  const reveal = useScrollReveal();
  const steps = [
    { num: "01", title: "提出问题", desc: "输入任何汽车相关问题，或开始智能选车测试", icon: <MessageSquare className="w-6 h-6" /> },
    { num: "02", title: "AI 深度分析", desc: "RAG 技术检索知识库，结合上下文生成精准回答", icon: <Brain className="w-6 h-6" /> },
    { num: "03", title: "获得答案", desc: "获取专业、详细的汽车建议与个性化推荐", icon: <Zap className="w-6 h-6" /> },
  ];

  return (
    <section className="py-24 px-6">
      <div ref={reveal.ref} className={`max-w-5xl mx-auto transition-all duration-700 ${reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            三步开始体验
          </h2>
          <p className="text-gray-500 dark:text-gray-400">简单几步，即刻获得专业汽车咨询</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* 连接线 */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px"
            style={{ background: "linear-gradient(90deg, var(--theme-gradient-from), var(--theme-gradient-to))", opacity: 0.3 }} />

          {steps.map((s, i) => (
            <div key={i} className="relative text-center" style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white shadow-lg relative z-10"
                style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
                {s.icon}
              </div>
              <div className="text-xs font-bold mb-2" style={{ color: "hsl(var(--theme-primary))" }}>{s.num}</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════ CTA ══════════════════ */
function CTASection({ user }: { user: { id: string; email: string; name: string | null } | null }) {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="relative rounded-3xl overflow-hidden p-12 sm:p-16"
          style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
          {/* 装饰光晕 */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 blur-3xl translate-y-1/2 -translate-x-1/2" />

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 relative z-10">
            准备好了吗？
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto relative z-10">
            立即体验 CarGPT，让 AI 成为你的专属汽车顾问
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link href="/chat"
              className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white font-semibold text-base shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
              style={{ color: "var(--theme-gradient-from)" }}>
              <MessageSquare className="w-5 h-5" />
              开始对话
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/car-match"
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-base border-2 border-white/40 text-white transition-all duration-300 hover:bg-white/10 hover:scale-105">
              <Target className="w-5 h-5" />
              智能选车
            </Link>
            <Link href="/community"
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-base border-2 border-white/40 text-white transition-all duration-300 hover:bg-white/10 hover:scale-105">
              <Users className="w-5 h-5" />
              社区广场
            </Link>
          </div>
          {!user && (
            <p className="text-white/60 text-sm mt-6 relative z-10">
              还没有账号？
              <Link href="/auth?mode=register" className="text-white underline underline-offset-2 ml-1">免费注册</Link>
              <span className="mx-2">·</span>
              <Link href="/auth" className="text-white underline underline-offset-2">去登录</Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════ Footer ══════════════════ */
function Footer() {
  return (
    <footer className="border-t border-gray-200/50 dark:border-gray-700/40 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
            <Car className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">CarGPT</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400 dark:text-gray-500">
          <Link href="/chat" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">AI 对话</Link>
          <Link href="/car-match" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">智能选车</Link>
          <Link href="/community" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">社区</Link>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600">
          &copy; 2026 CarGPT. Powered by AI.
        </p>
      </div>
    </footer>
  );
}
