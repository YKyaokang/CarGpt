import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

function parseToken(req: Request): string | null {
  const cookieToken = req.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("access_token="))
    ?.split("=")[1];
  const authHeader = req.headers.get("authorization") || "";
  const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  return cookieToken || headerToken || null;
}

export async function PATCH(req: Request) {
  try {
    const token = parseToken(req);
    if (!token) return NextResponse.json({ message: "未登录" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : undefined;
    const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
    const carBrand = typeof body.carBrand === "string" ? body.carBrand.trim() : undefined;
    const carModel = typeof body.carModel === "string" ? body.carModel.trim() : undefined;
    const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : undefined;

    let carYear: number | undefined;
    if (body.carYear !== undefined && body.carYear !== null && body.carYear !== "") {
      const parsedYear = Number(body.carYear);
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(parsedYear) || parsedYear < 1990 || parsedYear > currentYear + 1) {
        return NextResponse.json({ message: "车辆年份不合法" }, { status: 400 });
      }
      carYear = parsedYear;
    }

    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "邮箱格式不正确" }, { status: 400 });
    }

    if (phone !== undefined && phone !== "" && !isValidPhone(phone)) {
      return NextResponse.json({ message: "手机号格式不正确" }, { status: 400 });
    }

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== payload.sub) {
        return NextResponse.json({ message: "该邮箱已被占用" }, { status: 409 });
      }
    }

    const updateData: {
      name?: string | null;
      email?: string;
      phone?: string | null;
      carBrand?: string | null;
      carModel?: string | null;
      carYear?: number | null;
      avatarUrl?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name || null;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (carBrand !== undefined) updateData.carBrand = carBrand || null;
    if (carModel !== undefined) updateData.carModel = carModel || null;
    if (body.carYear !== undefined) updateData.carYear = carYear ?? null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null;

    const user = await prisma.user.update({
      where: { id: payload.sub },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        carBrand: true,
        carModel: true,
        carYear: true,
      },
    });

    return NextResponse.json({ user, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "更新失败";
    return NextResponse.json({ message }, { status: 400 });
  }
}
