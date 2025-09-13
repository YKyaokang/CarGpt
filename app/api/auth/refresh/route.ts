import { NextResponse } from "next/server";
import { validateAndConsumeRefreshToken, getCookieOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const refreshToken = (await (req as any).cookies?.get?.("refresh_token")?.value) || (await (req as any)).headers.get("x-refresh-token") || "";
    const { accessToken, refreshToken: newRefresh, refreshTokenExpiresAt } = await validateAndConsumeRefreshToken(refreshToken);
    const res = NextResponse.json({ accessToken });
    res.cookies.set("refresh_token", newRefresh, getCookieOptions(Math.floor((refreshTokenExpiresAt.getTime() - Date.now()) / 1000)));
    return res;
  } catch (err: any) {
    return NextResponse.json({ message: err?.message ?? "刷新失败" }, { status: 400 });
  }
}

