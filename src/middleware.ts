import { type NextRequest, NextResponse } from 'next/server';

// This middleware is for future authentication checks
// Currently, auth protection is handled at the page level using useAuth hook

export function middleware(request: NextRequest) {
  // You can add custom middleware logic here if needed
  // For now, we're letting pages handle auth checks
  return NextResponse.next();
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};