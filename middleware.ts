import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Map employee types to allowed routes
const routeMap: Record<string, string> = {
  'Finance Admin': '/finance-admin',
  'Finance Employee': '/finance-employee',
  'Audit': '/audit',
  'Bill Employee':'/apply-bill',
  'Student Purchase': '/student-purchase',
};

// List of protected routes
const protectedRoutes = Object.values(routeMap);

export const middleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  
  console.log("🚀 Middleware running for pathname:", pathname);

  // Get the user's session token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // If accessing login page and already logged in, redirect to appropriate page
  if (pathname === '/login' && token) {
    const employeeType = token.employee_type as string;
    console.log("User already logged in, employee type:", employeeType);
    
    if (employeeType && routeMap[employeeType]) {
      const redirectUrl = new URL(routeMap[employeeType], request.url);
      console.log("Redirecting to:", redirectUrl.toString());
      return NextResponse.redirect(redirectUrl);
    }
    const defaultRedirect = new URL("/user", request.url);
    console.log("Redirecting to default:", defaultRedirect.toString());
    return NextResponse.redirect(defaultRedirect);
  }

  // If accessing login page and not logged in, allow
  if (pathname === '/login' && !token) {
    console.log("✅ Accessing login page without token - allowed");
    return NextResponse.next();
  }

  // If accessing /user page, allow if logged in
  if (pathname === '/user' && token) {
    console.log("✅ Accessing /user page with token - allowed");
    return NextResponse.next();
  }

  // If accessing /user page without token, redirect to login
  if (pathname === '/user' && !token) {
    console.log("🔒 Accessing /user without login, redirecting to login");
    const loginUrl = new URL("/login", request.url);
    console.log("Redirecting to login:", loginUrl.toString());
    return NextResponse.redirect(loginUrl);
  }

  // For all other routes, check if they are protected
  if (!protectedRoutes.some(route => pathname.startsWith(route))) {
    console.log("⏭️ Non-protected route - allowing:", pathname);
    return NextResponse.next();
  }

  // Protected routes - must be logged in
  if (!token) {
    console.log("🔄 No token for protected route, redirecting to login");
    const loginUrl = new URL('/login', request.url);
    console.log("Redirecting to login:", loginUrl.toString());
    return NextResponse.redirect(loginUrl);
  }

  // Check employee_type for protected routes
  const employeeType = token.employee_type;
  const allowedRoute = routeMap[employeeType as string];

  console.log("🔍 Protected route access:", {
    pathname,
    employeeType,
    allowedRoute
  });

  // If employee_type is missing or not valid, redirect to /user
  if (!employeeType || !allowedRoute) {
    console.log("❌ Invalid employee type, redirecting to /user");
    const userUrl = new URL('/user', request.url);
    console.log("Redirecting to user:", userUrl.toString());
    return NextResponse.redirect(userUrl);
  }

  // If trying to access their allowed route, allow
  if (pathname.startsWith(allowedRoute)) {
    console.log("✅ Accessing allowed route:", allowedRoute);
    return NextResponse.next();
  }

  // Otherwise, redirect to /user
  console.log("❌ Accessing unauthorized route, redirecting to /user");
  const userUrl = new URL('/user', request.url);
  console.log("Redirecting to user:", userUrl.toString());
  return NextResponse.redirect(userUrl);
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
