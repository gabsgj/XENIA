import { NextResponse } from 'next/server'

export function middleware() {
  // Could gate routes if needed
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/planner', '/tasks', '/tutor', '/analytics', '/teacher', '/parent'],
}

