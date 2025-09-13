import { NextResponse } from "next/server";
import { loginUser, getCookieOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: "邮箱和密码必填" }, { status: 400 });
    }
    const { user, accessToken, refreshToken, refreshTokenExpiresAt } = await loginUser({ email, password });
    const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name }, accessToken });
    res.cookies.set("refresh_token", refreshToken, getCookieOptions(Math.floor((refreshTokenExpiresAt.getTime() - Date.now()) / 1000)));
    return res;
  } catch (err: any) {
    return NextResponse.json({ message: err?.message ?? "登录失败" }, { status: 400 });
  }
}

