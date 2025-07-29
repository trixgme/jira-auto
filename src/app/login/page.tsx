'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ id: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        setError('잘못된 아이디 또는 비밀번호입니다')
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Jira Dashboard Login
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            대시보드에 접근하려면 로그인하세요
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                className="relative block w-full px-3 py-2 border border-input bg-background rounded-t-md placeholder:text-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring focus:z-10 sm:text-sm"
                placeholder="ID"
                value={credentials.id}
                onChange={(e) => setCredentials({...credentials, id: e.target.value})}
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="relative block w-full px-3 py-2 border border-input bg-background rounded-b-md placeholder:text-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring focus:z-10 sm:text-sm"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="text-destructive text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 transition-colors"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-xs text-muted-foreground">
          <p>기본 계정: admin/admin 또는 user/user</p>
        </div>
      </div>
    </div>
  )
}