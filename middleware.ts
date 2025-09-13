import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken, signAccessToken, getCookieOptions } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 不需要认证的路径
  const publicPaths = ['/auth', '/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/logout'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // API路由不进行重定向，只有页面路由才重定向
  const isApiRoute = pathname.startsWith('/api');
  
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 获取tokens
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  
  // 调试信息（生产环境可以移除）
  if (process.env.NODE_ENV === 'development') {
    console.log(`Middleware: ${pathname}, hasAccessToken: ${!!accessToken}, hasRefreshToken: ${!!refreshToken}`);
  }

  // 验证access token
  if (accessToken) {
    try {
      await verifyAccessToken(accessToken);
      return NextResponse.next();
    } catch (error) {
      // access token无效，尝试用refresh token刷新
    }
  }

  // 如果有refresh token，尝试刷新access token
  if (refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);
      const newAccessToken = await signAccessToken(payload.sub, payload.email);
      
      const response = NextResponse.next();
      response.cookies.set('access_token', newAccessToken, getCookieOptions(15 * 60)); // 15分钟
      
      return response;
    } catch (error) {
      // refresh token也无效，清除cookies并重定向到登录
      const response = NextResponse.redirect(new URL('/auth', request.url));
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      return response;
    }
  }

  // 没有有效的token
  if (!isApiRoute && pathname !== '/auth') {
    // 检查是否来自登录页面，给一些时间让cookie生效
    const referer = request.headers.get('referer');
    if (referer && referer.includes('/auth')) {
      // 如果是从登录页跳转过来的，暂时允许通过，让客户端处理
      return NextResponse.next();
    }
    // 只有页面路由才重定向到登录页
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};