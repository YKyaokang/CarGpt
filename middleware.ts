import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken, signAccessToken, getCookieOptions } from '@/lib/auth';

// 需要登录才能访问的页面路径
const protectedPagePaths = ['/chat', '/car-match', '/community/create'];
// 需要登录才能调用的 API 路径
const protectedApiPaths = ['/api/chat', '/api/car-match'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = protectedPagePaths.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isProtectedApi = protectedApiPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

  // 非受保护路由直接放行
  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  // ── 以下为受保护路由的鉴权逻辑 ──

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (process.env.NODE_ENV === 'development') {
    console.log(`Middleware: ${pathname}, hasAccessToken: ${!!accessToken}, hasRefreshToken: ${!!refreshToken}`);
  }

  // 1. 验证 access token
  if (accessToken) {
    try {
      await verifyAccessToken(accessToken);
      return NextResponse.next();
    } catch {
      // access token 无效，继续尝试 refresh
    }
  }

  // 2. 尝试用 refresh token 刷新
  if (refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);
      const newAccessToken = await signAccessToken(payload.sub, payload.email);

      const response = NextResponse.next();
      response.cookies.set('access_token', newAccessToken, getCookieOptions(15 * 60));
      return response;
    } catch {
      // refresh token 也无效，清除 cookies
      if (isProtectedApi) {
        const response = NextResponse.json({ message: '未登录' }, { status: 401 });
        response.cookies.delete('access_token');
        response.cookies.delete('refresh_token');
        return response;
      }
      const response = NextResponse.redirect(
        new URL(`/auth?redirect=${encodeURIComponent(pathname)}`, request.url)
      );
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      return response;
    }
  }

  // 3. 完全没有 token
  if (isProtectedApi) {
    return NextResponse.json({ message: '未登录' }, { status: 401 });
  }

  return NextResponse.redirect(
    new URL(`/auth?redirect=${encodeURIComponent(pathname)}`, request.url)
  );
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
