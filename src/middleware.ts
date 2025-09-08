import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Map employee types to allowed routes
const routeMap: Record<string, string> = {
  'Finance Admin': '/finance-admin',
  'Finance Employee': '/finance-employee',
  'Bill Employee':'/apply-bill',
  'Audit': '/audit',
  'Student Purchase': '/student-purchase',
};

// List of protected routes
const protectedRoutes = Object.values(routeMap);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the user's session token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // If accessing login page and already logged in, redirect to appropriate page
  if (pathname === '/login' && token) {
    const employeeType = token.employee_type;
    const allowedRoute = routeMap[employeeType as string];
    
    if (employeeType && allowedRoute) {
      return NextResponse.redirect(new URL(allowedRoute, request.url));
    } else {
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }

  // If accessing login page and not logged in, allow
  if (pathname === '/login' && !token) {
    return NextResponse.next();
  }

  // If accessing /user page, allow if logged in
  if (pathname === '/user' && token) {
    return NextResponse.next();
  }

  // If accessing /user page without token, redirect to login
  if (pathname === '/user' && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // For all other routes, check if they are protected
  if (!protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Protected routes - must be logged in
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check employee_type for protected routes
  const employeeType = token.employee_type;
  const allowedRoute = routeMap[employeeType as string];

  // If employee_type is missing or not valid, redirect to /user
  if (!employeeType || !allowedRoute) {
    return NextResponse.redirect(new URL('/user', request.url));
  }

  // If trying to access their allowed route, allow
  if (pathname.startsWith(allowedRoute)) {
    return NextResponse.next();
  }

  // Otherwise, redirect to /user
  return NextResponse.redirect(new URL('/user', request.url));
}

export const config = {
  matcher: [
    '/login',
    '/user',
    '/apply-bill/:path*',
    '/finance-admin/:path*', 
    '/finance-employee/:path*', 
    '/audit/:path*', 
    '/student-purchase/:path*'
  ],
};
