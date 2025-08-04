"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface GradientProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  showText?: boolean
  height?: 'sm' | 'md' | 'lg' | 'xl'
  gradientType?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'blue'
}

const GradientProgress = React.forwardRef<HTMLDivElement, GradientProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    showText = true, 
    height = 'md',
    gradientType = 'default',
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    // 높이 클래스
    const heightClasses = {
      sm: 'h-2',
      md: 'h-4',
      lg: 'h-6',
      xl: 'h-8'
    }
    
    // 그라디언트 클래스
    const gradientClasses = {
      default: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
      success: 'bg-gradient-to-r from-green-400 to-emerald-500',
      warning: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      danger: 'bg-gradient-to-r from-red-400 to-red-600',
      purple: 'bg-gradient-to-r from-purple-400 to-violet-600',
      blue: 'bg-gradient-to-r from-blue-400 to-cyan-500'
    }
    
    // 값에 따른 자동 그라디언트 선택
    const getGradientByValue = (val: number) => {
      if (gradientType !== 'default') return gradientClasses[gradientType]
      
      if (val >= 90) return gradientClasses.purple // S등급
      if (val >= 80) return gradientClasses.success // A등급
      if (val >= 70) return gradientClasses.blue // B등급
      if (val >= 60) return gradientClasses.warning // C등급
      return gradientClasses.danger // D등급
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          heightClasses[height],
          className
        )}
        {...props}
      >
        {/* 프로그레스 바 */}
        <div
          className={cn(
            "h-full transition-all duration-700 ease-out rounded-full",
            getGradientByValue(value)
          )}
          style={{ width: `${percentage}%` }}
        />
        
        {/* 텍스트 오버레이 */}
        {showText && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "font-semibold text-white drop-shadow-sm",
              height === 'sm' ? 'text-xs' : 
              height === 'md' ? 'text-sm' : 
              height === 'lg' ? 'text-base' : 'text-lg'
            )}>
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        
        {/* 반짝이는 효과 */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse opacity-30 rounded-full"
          style={{ 
            animation: 'shimmer 2s ease-in-out infinite',
            transform: `translateX(${percentage > 0 ? '0%' : '-100%'})`,
            width: `${percentage}%`
          }}
        />
      </div>
    )
  }
)
GradientProgress.displayName = "GradientProgress"

export { GradientProgress }