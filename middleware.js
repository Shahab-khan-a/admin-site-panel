import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // If URL ends with /admin or /admin/ but is not the root /admin, redirect straight to /admin
  if (pathname !== '/admin' && (pathname.endsWith('/admin') || pathname.endsWith('/admin/'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths ending with admin
     */
    '/:path*/admin',
    '/:path*/admin/',
  ],
};
