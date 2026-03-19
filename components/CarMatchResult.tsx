"use client";
import { useState } from "react";

const DIMENSIONS = ["性能驾控", "科技配置", "空间实用", "经济省油", "安全舒适", "外观颜值"] as const;
type Dimension = typeof DIMENSIONS[number];

export interface CarResult {
  rank: number;
  name: string;
  price: string;
  type: string;
  fuel: string;
  totalScore: number;
  reason: string;
  highlight: string;
  dimensions: Record<Dimension, number>;
}

export interface MatchData {
  summary: string;
  top3: CarResult[];
}

interface Props {
  data: MatchData;
  onRetry: () => void;
}

// ── SVG 六边形雷达图 ──────────────────────────────────────────────────────────
function RadarChart({ scores }: { scores: Record<string, number> }) {
  const cx = 110;
  const cy = 110;
  const r = 78;
  const labels = DIMENSIONS;
  const n = labels.length;
  const angleStep = (Math.PI * 2) / n;

  const getPoint = (i: number, radius: number) => ({
    x: cx + radius * Math.sin(i * angleStep),
    y: cy - radius * Math.cos(i * angleStep),
  });

  const gridLevels = [20, 40, 60, 80, 100];

  const dataPoints = labels.map((label, i) =>
    getPoint(i, (r * Math.min(scores[label] ?? 0, 100)) / 100)
  );
  const dataPath =
    dataPoints
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ") + " Z";

  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-[200px] mx-auto">
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) =>
          getPoint(i, (r * level) / 100)
        );
        const d =
          pts
            .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(" ") + " Z";
        return (
          <path
            key={level}
            d={d}
            fill={level === 100 ? "hsl(var(--theme-primary)/0.04)" : "none"}
            stroke="hsl(var(--theme-primary)/0.18)"
            strokeWidth="1"
          />
        );
      })}

      {Array.from({ length: n }, (_, i) => {
        const outer = getPoint(i, r);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
            stroke="hsl(var(--theme-primary)/0.2)"
            strokeWidth="1"
          />
        );
      })}

      <path
        d={dataPath}
        fill="hsl(var(--theme-primary)/0.2)"
        stroke="hsl(var(--theme-primary))"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="hsl(var(--theme-primary))" />
      ))}

      {labels.map((label, i) => {
        const outer = getPoint(i, r + 20);
        return (
          <text
            key={label}
            x={outer.x.toFixed(1)}
            y={outer.y.toFixed(1)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9.5"
            fill="hsl(var(--theme-primary))"
            fontWeight="500"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ── 环形得分圆 ────────────────────────────────────────────────────────────────
function ScoreRing({ score, rank }: { score: number; rank: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const gradIds = ["ring-gold", "ring-silver", "ring-bronze"];
  const gradId = gradIds[rank - 1] ?? gradIds[0];
  const gradColors: [string, string][] = [
    ["#f59e0b", "#f97316"],
    ["#94a3b8", "#64748b"],
    ["#b45309", "#78350f"],
  ];
  const [c1, c2] = gradColors[rank - 1] ?? gradColors[0];

  return (
    <div className="relative w-[88px] h-[88px] flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <circle cx="44" cy="44" r={radius} fill="none" stroke="hsl(var(--theme-primary)/0.1)" strokeWidth="8" />
        <circle
          cx="44" cy="44" r={radius} fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(1)} ${(circumference - dash).toFixed(1)}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{score}</span>
        <span className="text-[10px] text-gray-500">分</span>
      </div>
    </div>
  );
}

// ── 单车维度条 ────────────────────────────────────────────────────────────────
function DimensionBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-14 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-700/60 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${value}%`,
            background: "linear-gradient(90deg, var(--theme-gradient-from), var(--theme-gradient-to))",
          }}
        />
      </div>
      <span className="text-xs font-medium w-7 text-right" style={{ color: "hsl(var(--theme-primary))" }}>
        {value}
      </span>
    </div>
  );
}

// ── 单车卡片 ──────────────────────────────────────────────────────────────────
function CarCard({ car, expanded, onToggle }: { car: CarResult; expanded: boolean; onToggle: () => void }) {
  const rankBadge = ["🥇", "🥈", "🥉"][car.rank - 1] ?? "";
  const fuelColors: Record<string, string> = {
    纯电: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    插混: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    混动: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    燃油: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  };
  const fuelKey = Object.keys(fuelColors).find((k) => car.fuel.includes(k)) ?? "燃油";

  return (
    <div
      className="rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-lg"
      style={{ boxShadow: expanded ? `0 4px 32px hsl(var(--theme-primary)/0.12)` : undefined }}
    >
      <button onClick={onToggle} className="w-full text-left p-4 flex items-center gap-4">
        <ScoreRing score={car.totalScore} rank={car.rank} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{rankBadge}</span>
            <h3 className="font-bold text-base text-gray-800 dark:text-gray-100 truncate">{car.name}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${fuelColors[fuelKey]}`}>
              {car.fuel}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-gray-500 dark:text-gray-400">{car.type}</span>
            <span className="text-sm font-semibold" style={{ color: "hsl(var(--theme-primary))" }}>
              {car.price} 万
            </span>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: "hsl(var(--theme-primary)/0.1)", color: "hsl(var(--theme-primary))" }}
            >
              {car.highlight}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">{car.reason}</p>
        </div>
        <span
          className="text-gray-400 flex-shrink-0 text-lg transition-transform duration-300"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-5 border-t border-gray-100 dark:border-gray-700/50 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fadeIn">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">六维匹配雷达图</p>
            <RadarChart scores={car.dimensions} />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">各维度匹配度</p>
            <div className="space-y-3">
              {DIMENSIONS.map((dim) => (
                <DimensionBar key={dim} label={dim} value={car.dimensions[dim] ?? 0} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function CarMatchResult({ data, onRetry }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const toggle = (i: number) => setExpandedIdx((prev) => (prev === i ? null : i));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div
        className="rounded-2xl p-4 text-center"
        style={{
          background: "linear-gradient(135deg, hsl(var(--theme-primary)/0.12), hsl(var(--theme-accent)/0.10))",
          border: "1px solid hsl(var(--theme-primary)/0.2)",
        }}
      >
        <p className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-1">您的用车画像</p>
        <p className="text-base font-bold text-gray-800 dark:text-gray-100">{data.summary}</p>
      </div>

      <div className="space-y-4">
        {data.top3.map((car, i) => (
          <CarCard key={car.rank} car={car} expanded={expandedIdx === i} onToggle={() => toggle(i)} />
        ))}
      </div>

      <div className="text-center pt-2">
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 hover:shadow-md"
          style={{ borderColor: "hsl(var(--theme-primary)/0.4)", color: "hsl(var(--theme-primary))" }}
        >
          重新测试
        </button>
      </div>
    </div>
  );
}
