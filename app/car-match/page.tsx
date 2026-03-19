"use client";
import { useState } from "react";
import Link from "next/link";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import CarMatchResult, { type MatchData } from "@/components/CarMatchResult";

interface Answers {
  adventure: number; spending: number; family: number; techLove: number;
  statusCare: number; environmentCare: number; drivingFun: number; safety: number;
  practicality: number; style: number; independence: number; brandLoyalty: number;
  commuteDistance: number; annualMileage: number; passengerFreq: number;
  parkingCondition: number; budget: number; fuelPreference: number;
  cargoNeed: number; weatherCondition: number;
}

const INIT: Answers = {
  adventure: 3, spending: 3, family: 3, techLove: 3, statusCare: 3,
  environmentCare: 3, drivingFun: 3, safety: 3, practicality: 3, style: 3,
  independence: 3, brandLoyalty: 3,
  commuteDistance: 20, annualMileage: 15000, passengerFreq: 3,
  parkingCondition: 2, budget: 20, fuelPreference: 2,
  cargoNeed: 2, weatherCondition: 1,
};

const PERSONALITY_QUESTIONS: Array<{
  key: keyof Answers; question: string; icon: string; low: string; high: string;
}> = [
  { key: "adventure",       question: "您喜欢尝试新路线、挑战未知驾驶体验吗？",           icon: "🏔️", low: "稳健保守",      high: "极具冒险精神" },
  { key: "spending",        question: "在汽车消费上，您倾向于慷慨投入还是精打细算？",     icon: "💳", low: "精打细算",      high: "愿意重金投入" },
  { key: "family",          question: "您的家庭成员结构是？",                             icon: "👨‍👩‍👧‍👦", low: "单身/两人世界",  high: "三代同堂大家庭" },
  { key: "techLove",        question: "您对车机互联、智能驾驶辅助等科技配置的热情？",     icon: "🖥️", low: "够用就好",      high: "科技狂热爱好者" },
  { key: "statusCare",      question: "您在意车辆代表的品牌形象和社会地位吗？",           icon: "👑", low: "完全不在意",    high: "非常重视面子" },
  { key: "environmentCare", question: "您对节能减排、环保出行的关注程度？",               icon: "🌱", low: "不太关注",      high: "环保优先考量" },
  { key: "drivingFun",      question: "您追求驾驶激情和操控乐趣的程度？",               icon: "🏎️", low: "代步工具即可",  high: "热血驾驶狂热者" },
  { key: "safety",          question: "安全配置在您选车中的优先级？",                     icon: "🛡️", low: "基础安全即可",  high: "安全是第一位" },
  { key: "practicality",    question: "您更看重车辆的实用性（空间、省油、保养）？",       icon: "🔧", low: "颜值&感受优先",  high: "极度追求实用" },
  { key: "style",           question: "外观设计在您购车决策中的重要程度？",               icon: "✨", low: "外观无所谓",    high: "颜值即正义" },
  { key: "independence",    question: "您喜欢与众不同、彰显个性的车型吗？",               icon: "🎨", low: "低调大众化",    high: "个性彰显自我" },
  { key: "brandLoyalty",    question: "您倾向于坚持已有品牌还是愿意尝试新品牌？",         icon: "🏷️", low: "乐于尝试新品牌", high: "忠于熟悉品牌" },
];

// ── 滑块选择题 ──────────────────────────────────────────────────────────────
function SliderQuestion({
  q, value, onChange, index,
}: {
  q: (typeof PERSONALITY_QUESTIONS)[0];
  value: number;
  onChange: (v: number) => void;
  index: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-5 space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{q.icon}</span>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--theme-primary))" }}>
            性格测试 {index + 1}/12
          </span>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-0.5">{q.question}</p>
        </div>
      </div>
      <div className="px-1">
        <div className="flex justify-between mb-2">
          <span className="text-[11px] text-gray-400">{q.low}</span>
          <span className="text-[11px] text-gray-400">{q.high}</span>
        </div>
        <div className="flex gap-2">
          {[1,2,3,4,5].map((v) => {
            const active = value === v;
            return (
              <button key={v} type="button" onClick={() => onChange(v)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                  active ? "text-white shadow-md scale-105" : "border-gray-200 dark:border-gray-600 text-gray-400 bg-transparent hover:border-gray-300"
                }`}
                style={active ? { background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))", borderColor: "transparent" } : {}}
              >{v}</button>
            );
          })}
        </div>
        <p className="text-center text-xs font-medium mt-2" style={{ color: "hsl(var(--theme-primary))" }}>
          {["非常低","较低","中等","较高","非常高"][value - 1]}
        </p>
      </div>
    </div>
  );
}

// ── 选项按钮 helper ──────────────────────────────────────────────────────────
function OptionBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`py-2 px-2 text-xs rounded-xl border-2 font-medium transition-all duration-200 ${
        active ? "text-white shadow-md" : "border-gray-200 dark:border-gray-600 text-gray-500 bg-transparent"
      }`}
      style={active ? { background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))", borderColor: "transparent" } : {}}
    >{children}</button>
  );
}

// ── 生活习惯区 ────────────────────────────────────────────────────────────────
function HabitSection({ answers, set }: { answers: Answers; set: (k: keyof Answers, v: number) => void }) {
  const habitLabel = (n: number) => `生活习惯 ${n}/8`;
  return (
    <div className="space-y-4">

      {/* 通勤距离 */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🛣️</span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--theme-primary))" }}>{habitLabel(1)}</span>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">日常通勤距离（单程 km）</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input type="range" min={1} max={100} step={1} value={answers.commuteDistance}
            onChange={(e) => set("commuteDistance", Number(e.target.value))}
            className="flex-1" style={{ accentColor: "hsl(var(--theme-primary))" }} />
          <span className="text-sm font-bold w-16 text-right" style={{ color: "hsl(var(--theme-primary))" }}>{answers.commuteDistance} km</span>
        </div>
      </div>

      {/* 年均里程 */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📊</span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--theme-primary))" }}>{habitLabel(2)}</span>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">年均行驶里程</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input type="range" min={3000} max={80000} step={1000} value={answers.annualMileage}
            onChange={(e) => set("annualMileage", Number(e.target.value))}
            className="flex-1" style={{ accentColor: "hsl(var(--theme-primary))" }} />
          <span className="text-sm font-bold w-20 text-right" style={{ color: "hsl(var(--theme-primary))" }}>{(answers.annualMileage / 10000).toFixed(1)} 万km</span>
        </div>
      </div>

      {/* 载人需求 */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">👥</span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--theme-primary))" }}>{habitLabel(3)}</span>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">载人需求频率</p>
          </div>
        </div>
        <div className="flex gap-2">
          {["极少","偶尔","一般","经常","几乎每天"].map((label, idx) => (
            <OptionBtn key={idx} active={answers.passengerFreq === idx+1} onClick={() => set("passengerFreq", idx+1)}>{label}</OptionBtn>
          ))}
        </div>
      </div>

      {/* 停车条件 */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🅿️</span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--theme-primary))" }}>{habitLabel(4)}</span>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">停车条件</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{val:1,label:"路边停车",icon:"🛤️"},{val:2,label:"小区车位",icon:"🏘️"},{val:3,label:"私家车库",icon:"🏠"}].map(({val,label,icon}) => (
            <OptionBtn key={val} active={answers.parkingCondition === val} onClick={() => set("parkingCondition", val)}>
              <span className="flex flex-col items-center gap-1"><span className="text-xl">{icon}</span>{label}</span>
            </OptionBtn>
          ))}
        </div>
      </div>

      {/* 预算 */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">💰</span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--theme-primary))" }}>{habitLabel(5)}</span>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">购车预算</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input type="range" min={5} max={150} step={5} value={answers.budget}
            onChange={(e) => set("budget", Number(e.target.value))}
            className="flex-1" style={{ accentColor: "hsl(var(--theme-primary))" }} />
          <span className="text-sm font-bold w-16 text-right" style={{ color: "hsl(var(--theme-primary))" }}>{answers.budget} 万</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
          <span>5万</span><span>30万</span><span>60万</span><span>100万</span><span>150万</span>
        </div>
      </div>

      {/* 燃料偏好 */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">⛽</span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--theme-primary))" }}>{habitLabel(6)}</span>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">燃料偏好</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{val:1,label:"燃油车",icon:"⛽"},{val:2,label:"混动/插混",icon:"🔋"},{val:3,label:"纯电动",icon:"⚡"}].map(({val,label,icon}) => (
            <OptionBtn key={val} active={answers.fuelPreference === val} onClick={() => set("fuelPreference", val)}>
              <span className="flex flex-col items-center gap-1"><span className="text-xl">{icon}</span>{label}</span>
            </OptionBtn>
          ))}
        </div>
      </div>

      {/* 货物需求 */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📦</span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--theme-primary))" }}>{habitLabel(7)}</span>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">货物/行李运载需求</p>
          </div>
        </div>
        <div className="flex gap-2">
          {["几乎没有","偶尔","一般","频繁","重度需求"].map((label, idx) => (
            <OptionBtn key={idx} active={answers.cargoNeed === idx+1} onClick={() => set("cargoNeed", idx+1)}>{label}</OptionBtn>
          ))}
        </div>
      </div>

      {/* 常驾路况 */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🗺️</span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--theme-primary))" }}>{habitLabel(8)}</span>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">常驾路况环境</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{val:1,label:"城市道路",icon:"🏙️"},{val:2,label:"山路复杂",icon:"⛰️"},{val:3,label:"高速长途",icon:"🛣️"}].map(({val,label,icon}) => (
            <OptionBtn key={val} active={answers.weatherCondition === val} onClick={() => set("weatherCondition", val)}>
              <span className="flex flex-col items-center gap-1"><span className="text-xl">{icon}</span>{label}</span>
            </OptionBtn>
          ))}
        </div>
      </div>

    </div>
  );
}
// ── 进度条 ───────────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>完成度</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}
        />
      </div>
    </div>
  );
}

// ── 主页面 ───────────────────────────────────────────────────────────────────
export default function CarMatchPage() {
  const [answers, setAnswers] = useState<Answers>(INIT);
  const [step, setStep] = useState<"personality" | "habits" | "loading" | "result">("personality");
  const [result, setResult] = useState<MatchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof Answers, v: number) => setAnswers((prev) => ({ ...prev, [k]: v }));

  const countAnswered = () => {
    const pKeys = PERSONALITY_QUESTIONS.map((q) => q.key);
    return pKeys.filter((k) => answers[k] !== 3).length;
  };

  const handleSubmit = async () => {
    setStep("loading");
    setError(null);
    try {
      const res = await fetch("/api/car-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json.data);
      setStep("result");
    } catch (e: any) {
      setError(e.message ?? "分析失败，请重试");
      setStep("habits");
    }
  };

  const handleRetry = () => {
    setAnswers(INIT);
    setResult(null);
    setStep("personality");
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0" title="返回首页">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
                🎯 智能选车测试
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">AI 为您精准匹配最适合的车型</p>
            </div>
          </div>
          <ThemeSwitcher />
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">

        {/* 性格测试 */}
        {step === "personality" && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">第一步：性格测试</h2>
              <p className="text-sm text-gray-500 mt-1">共 12 题，请根据实际情况如实作答</p>
              <div className="mt-3"><ProgressBar step={countAnswered()} total={12} /></div>
            </div>
            {PERSONALITY_QUESTIONS.map((q, i) => (
              <SliderQuestion key={q.key} q={q} value={answers[q.key] as number} onChange={(v) => set(q.key, v)} index={i} />
            ))}
            <div className="pt-2">
              <button
                onClick={() => setStep("habits")}
                className="w-full py-3.5 rounded-2xl text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}
              >
                下一步：生活习惯采集 →
              </button>
            </div>
          </div>
        )}

        {/* 生活习惯 */}
        {step === "habits" && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">第二步：生活习惯采集</h2>
              <p className="text-sm text-gray-500 mt-1">共 8 项，帮助 AI 精准匹配您的用车场景</p>
            </div>
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
                ⚠️ {error}
              </div>
            )}
            <HabitSection answers={answers} set={set} />
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep("personality")}
                className="flex-1 py-3 rounded-2xl font-medium text-sm border-2 transition-all duration-200"
                style={{ borderColor: "hsl(var(--theme-primary)/0.4)", color: "hsl(var(--theme-primary))" }}
              >
                ← 上一步
              </button>
              <button
                onClick={handleSubmit}
                className="flex-[2] py-3.5 rounded-2xl text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}
              >
                🚀 AI 智能分析匹配
              </button>
            </div>
          </div>
        )}

        {/* 加载中 */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-24 animate-fadeIn">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-700" />
              <div
                className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: `hsl(var(--theme-primary)) transparent transparent transparent` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-3xl">🚗</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">AI 正在为您分析匹配...</h3>
            <p className="text-sm text-gray-400">综合 20 项数据，精准推荐专属车型</p>
          </div>
        )}

        {/* 结果 */}
        {step === "result" && result && (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">🎉 专属选车报告</h2>
              <p className="text-sm text-gray-500 mt-1">基于您的 20 项测评数据，AI 为您精准匹配</p>
            </div>
            <CarMatchResult data={result} onRetry={handleRetry} />
          </div>
        )}

      </div>
    </main>
  );
}


