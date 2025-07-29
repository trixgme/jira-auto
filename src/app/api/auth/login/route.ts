import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { id, password } = await request.json()
    
    // 환경변수를 함수 내부에서 읽기
    const users: Record<string, string> = {
      'admin': process.env.ADMIN_PASSWORD || 'admin',
      'user': process.env.USER_PASSWORD || 'user'
    }
    
    // 디버깅을 위한 로그 (프로덕션에서는 제거해야 함)
    console.log('Environment variables:', {
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      USER_PASSWORD: process.env.USER_PASSWORD
    })
    console.log('Login attempt:', { id, providedPassword: password })
    console.log('Expected password for', id, ':', users[id])
    console.log('Users object:', users)
    
    if (users[id] && users[id] === password) {
      const response = NextResponse.json({ success: true })
      response.cookies.set('auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 86400, // 24시간
        path: '/'
      })
      return response
    }
    
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}