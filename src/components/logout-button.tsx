'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  const handleLogout = async () => {
    setIsLoading(true)
    
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">
        {isLoading ? `${t('logout')}...` : t('logout')}
      </span>
    </Button>
  )
}