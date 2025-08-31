import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Could gate routes if needed
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/planner', '/tasks', '/tutor', '/analytics', '/teacher', '/parent'],
}

