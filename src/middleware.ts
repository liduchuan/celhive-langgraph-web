import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = [
  '/login',
  '/'
];

// 白名单前缀：以这些前缀开头的路由跳过认证
const PUBLIC_ROUTE_PREFIXES: string[] = [
];

// 静态资源和 Next.js 内部路由
const STATIC_FILES = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

/**
 * 检查路径是否在白名单中
 */
function isPublicRoute(pathname: string): boolean {
  // 检查静态资源
  if (STATIC_FILES.some(file => pathname.startsWith(file))) {
    return true;
  }

  // 检查精确匹配的公开路由
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  // 检查前缀匹配的公开路由
  if (PUBLIC_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return true;
  }

  return false;
}

/**
 * 中间件主函数
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 获取 token
  const token = request.cookies.get('token')?.value;

  // 检查是否为公开路由
  const isPublic = isPublicRoute(pathname);

  // 情况 1: 用户已登录，访问 /login 页面 → 重定向到首页
  if (pathname === '/login' && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 情况 2: 用户未登录，访问受保护的页面 → 重定向到 /login
  if (!isPublic && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // 可选：保存原始 URL，登录后跳转回来
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 情况 3: 白名单路由或已认证 → 继续访问
  return NextResponse.next();
}

/**
 * 配置中间件匹配规则
 * 排除 API 路由和静态资源
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
