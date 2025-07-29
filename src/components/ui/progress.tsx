"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  text?: string
  showPercentage?: boolean
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, text, showPercentage = true, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
        {(text || showPercentage) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-primary-foreground">
              {text || `${Math.round(percentage)}%`}
            </span>
          </div>
        )}
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }