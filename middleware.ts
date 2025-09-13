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
    // 检查是否有任何token存在（即使无效）
    const hasAnyToken = accessToken || refreshToken;
    
    // 调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log(`No valid token for ${pathname}, hasAnyToken: ${hasAnyToken}`);
    }
    
    // 如果有任何token（即使无效），给一些时间让页面加载并让客户端处理
    if (hasAnyToken) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Has token but invalid, allowing client to handle');
      }
      // 设置一个短期标记，避免无限循环
      const response = NextResponse.next();
      response.headers.set('x-auth-check', 'pending');
      return response;
    }
    
    // 完全没有token，重定向到登录页
    if (process.env.NODE_ENV === 'development') {
      console.log('No token at all, redirecting to auth page');
    }
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