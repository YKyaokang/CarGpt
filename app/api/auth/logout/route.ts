import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const res = NextResponse.json({ success: true });
    
    // 清除cookies
    res.cookies.delete('access_token');
    res.cookies.delete('refresh_token');
    
    return res;
  } catch (err: any) {
    return NextResponse.json({ message: err?.message ?? "登出失败" }, { status: 400 });
  }
}