import { NextResponse } from "next/server";
import { verifyAccessToken, revokeRefreshToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return NextResponse.json({ message: "未登录" }, { status: 401 });
    const payload = await verifyAccessToken(token);
    await revokeRefreshToken(payload.sub);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("refresh_token", "", { httpOnly: true, maxAge: 0, path: "/" });
    return res;
  } catch (err: any) {
    return NextResponse.json({ message: err?.message ?? "登出失败" }, { status: 400 });
  }
}

