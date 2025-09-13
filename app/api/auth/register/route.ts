import { NextResponse } from "next/server";
import { registerUser, loginUser, getAccessTokenCookieOptions, getRefreshTokenCookieOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: "邮箱和密码必填" }, { status: 400 });
    }
    await registerUser({ email, password, name });
    const { user, accessToken, refreshToken, refreshTokenExpiresAt } = await loginUser({ email, password });

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      success: true,
    });
    
    // 设置accessToken和refreshToken到cookie
    res.cookies.set("access_token", accessToken, getAccessTokenCookieOptions());
    res.cookies.set("refresh_token", refreshToken, getRefreshTokenCookieOptions(Math.floor((refreshTokenExpiresAt.getTime() - Date.now()) / 1000)));
    return res;
  } catch (err: any) {
    return NextResponse.json({ message: err?.message ?? "注册失败" }, { status: 400 });
  }
}

