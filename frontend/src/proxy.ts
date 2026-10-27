import { NextResponse, type NextRequest } from 'next/server';
const publicPaths = ['/login'];
export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const access = request.cookies.get('access_token');
  if (!access && !publicPaths.includes(path)) return NextResponse.redirect(new URL('/login', request.url));
  if (access && path === '/login') return NextResponse.redirect(new URL('/', request.url));
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next|favicon.ico).*)'] };
