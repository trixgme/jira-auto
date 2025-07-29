'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LoadingProgressProps {
  isLoading: boolean;
  steps: string[];
  currentStep?: number;
  className?: string;
}

export function LoadingProgress({ isLoading, steps, currentStep = 0, className }: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      return;
    }

    // 현재 단계에 따른 진행률 계산
    const stepProgress = (currentStep / steps.length) * 100;
    setProgress(stepProgress);
  }, [isLoading, currentStep, steps.length]);

  if (!isLoading) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">
              Jira 데이터를 가져오는 중...
            </span>
          </div>
          
          <Progress 
            value={progress} 
            className="h-3"
            showPercentage={false}
          />
          
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`text-xs flex items-center gap-2 ${
                  index === currentStep 
                    ? 'text-primary font-medium' 
                    : index < currentStep 
                      ? 'text-green-600' 
                      : 'text-muted-foreground'
                }`}
              >
                {index < currentStep && (
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                )}
                {index === currentStep && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
                {index > currentStep && (
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                )}
                {step}
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            {currentStep + 1} / {steps.length} 단계 진행 중
          </div>
        </div>
      </CardContent>
    </Card>
  );
}