"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, type UpdateUserProfilePayload } from "@/lib/store/auth";

type AvatarStyle = "cartoon" | "realistic" | "pixel" | "minimal" | "oil";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  carBrand: string;
  carModel: string;
  carYear: string;
  avatarUrl: string;
};

const EMAIL_DOMAIN_FIXES: Array<{ wrong: string; correct: string }> = [
  { wrong: "gmial.com", correct: "gmail.com" },
  { wrong: "gamil.com", correct: "gmail.com" },
  { wrong: "hotnail.com", correct: "hotmail.com" },
  { wrong: "qq.con", correct: "qq.com" },
  { wrong: "163.con", correct: "163.com" },
];

const AVATAR_STYLES: Array<{ key: AvatarStyle; label: string }> = [
  { key: "cartoon", label: "卡通" },
  { key: "realistic", label: "写实" },
  { key: "pixel", label: "像素" },
  { key: "minimal", label: "极简" },
  { key: "oil", label: "油画" },
];

function suggestEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  const atIndex = value.indexOf("@");
  if (atIndex === -1) return null;
  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);
  if (!local || !domain) return null;

  const fixed = EMAIL_DOMAIN_FIXES.find((item) => item.wrong === domain);
  if (!fixed) return null;
  return `${local}@${fixed.correct}`;
}

export default function ProfilePage() {
  const { user, fetchMe, updateProfile, loading } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    carBrand: "",
    carModel: "",
    carYear: "",
    avatarUrl: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>("cartoon");
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    if (!user) fetchMe();
  }, [fetchMe, user]);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      carBrand: user.carBrand ?? "",
      carModel: user.carModel ?? "",
      carYear: user.carYear ? String(user.carYear) : "",
      avatarUrl: user.avatarUrl ?? "",
    });
  }, [user]);

  const emailSuggestion = useMemo(() => suggestEmail(form.email), [form.email]);

  const onChange = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
  };

  const validate = (): string | null => {
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!email) return "邮箱不能为空";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "邮箱格式不正确";

    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      return "手机号格式不正确";
    }

    if (form.carYear.trim()) {
      const year = Number(form.carYear.trim());
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(year) || year < 1990 || year > currentYear + 1) {
        return "车辆年份需在 1990 到明年之间";
      }
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const payload: UpdateUserProfilePayload = {
        name: form.name,
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        carBrand: form.carBrand,
        carModel: form.carModel,
        carYear: form.carYear.trim() ? Number(form.carYear.trim()) : null,
        avatarUrl: form.avatarUrl,
      };

      await updateProfile(payload);
      setSuccess("资料保存成功");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "保存失败";
      setError(message);
    }
  };

  const handleGenerateAvatar = async () => {
    try {
      setAvatarLoading(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/user/avatar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: avatarStyle,
          prompt: avatarPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "头像生成失败");
      }

      onChange("avatarUrl", data.imageUrl);
      setSuccess("AI 头像生成成功，请点击保存资料");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "头像生成失败";
      setError(message);
    } finally {
      setAvatarLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm p-8 text-center max-w-md w-full">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">请先登录</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">登录后可查看和编辑个人资料</p>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-white font-medium"
            style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}
          >
            前往登录
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="返回首页">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
                个人资料
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">管理昵称、联系方式、车辆信息和头像</p>
            </div>
          </div>
          <ThemeSwitcher />
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm p-5">
          <div className="flex flex-col items-center text-center">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
            ) : (
              <div className="w-24 h-24 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">
                👤
              </div>
            )}
            <p className="mt-4 text-base font-semibold text-gray-800 dark:text-gray-100">{form.name || "未设置昵称"}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{form.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{form.phone || "未设置手机号"}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {form.carBrand || form.carModel || form.carYear
                ? `${form.carYear ? `${form.carYear} ` : ""}${form.carBrand || ""} ${form.carModel || ""}`.trim()
                : "未设置车辆信息"}
            </p>
          </div>
        </section>

        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm p-5 space-y-4">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">编辑基础资料</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">昵称</label>
                <Input value={form.name} onChange={(e) => onChange("name", e.target.value)} placeholder="请输入昵称" />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">手机号</label>
                <Input value={form.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="请输入手机号" />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">邮箱</label>
                <Input value={form.email} onChange={(e) => onChange("email", e.target.value)} placeholder="请输入邮箱" />
                {emailSuggestion && (
                  <button
                    type="button"
                    onClick={() => onChange("email", emailSuggestion)}
                    className="text-xs mt-1"
                    style={{ color: "hsl(var(--theme-primary))" }}
                  >
                    自动补全建议: {emailSuggestion}
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">车辆品牌</label>
                <Input value={form.carBrand} onChange={(e) => onChange("carBrand", e.target.value)} placeholder="例如: 比亚迪" />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">车辆型号</label>
                <Input value={form.carModel} onChange={(e) => onChange("carModel", e.target.value)} placeholder="例如: 宋 PLUS" />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">车辆年份</label>
                <Input value={form.carYear} onChange={(e) => onChange("carYear", e.target.value)} placeholder="例如: 2024" />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button onClick={handleSave} disabled={loading} className="w-full text-white" style={{ background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }}>
              {loading ? "保存中..." : "保存资料"}
            </Button>
          </div>

          <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm p-5 space-y-4">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">AI 头像生成</h2>

            <div className="flex flex-wrap gap-2">
              {AVATAR_STYLES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setAvatarStyle(item.key)}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                    avatarStyle === item.key
                      ? "text-white border-transparent"
                      : "text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                  }`}
                  style={
                    avatarStyle === item.key
                      ? { background: "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))" }
                      : {}
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600 dark:text-gray-300">附加描述（可选）</label>
              <Input
                value={avatarPrompt}
                onChange={(e) => setAvatarPrompt(e.target.value)}
                placeholder="例如: 蓝色背景，微笑，佩戴眼镜"
              />
            </div>

            <Button variant="outline" onClick={handleGenerateAvatar} disabled={avatarLoading} className="w-full">
              {avatarLoading ? "生成中..." : "生成头像"}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
