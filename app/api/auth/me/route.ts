import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return NextResponse.json({ message: "未登录" }, { status: 401 });
    const payload = await verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, name: true } });
    if (!user) return NextResponse.json({ message: "用户不存在" }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message ?? "获取失败" }, { status: 400 });
  }
}

