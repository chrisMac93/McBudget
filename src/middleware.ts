import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public paths that don't require authentication
const publicPaths = [
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the user is authenticated based on Firebase session cookie
  // Note: Firebase typically uses '__session' cookie for authentication
  // But we need to verify if this cookie exists and is being set correctly
  const firebaseSession = request.cookies.get('__session');
  const hasFirebaseSession = !!firebaseSession?.value;
  
  // Check if this is a public path that doesn't require authentication
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // Check if path is static/internal Next.js path
  const isNextInternal = pathname.includes('/_next') || 
                          pathname.includes('/favicon.ico') || 
                          pathname.includes('.') ||
                          pathname === '/';
  
  console.log(`Path: ${pathname}, Auth: ${hasFirebaseSession}, Public: ${isPublicPath}`);
  
  // If trying to access a protected route without authentication, redirect to login
  if (!isPublicPath && !isNextInternal && !hasFirebaseSession) {
    console.log(`Redirecting to login from: ${pathname}`);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // If authenticated user tries to access auth pages, redirect to dashboard
  // Only do this if we're sure they're logged in
  if (hasFirebaseSession && isPublicPath) {
    console.log(`Redirecting authenticated user to dashboard from: ${pathname}`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Configure middleware to run only on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/* (API routes)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 