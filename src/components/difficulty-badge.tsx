import { Badge } from "@/components/ui/badge";
import { Zap, ZapOff, Flame } from "lucide-react";

interface DifficultyBadgeProps {
  difficulty?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function DifficultyBadge({ difficulty, showLabel = true, size = "md" }: DifficultyBadgeProps) {
  if (!difficulty) return null;

  const getDifficultyConfig = (level: number) => {
    switch (level) {
      case 1:
        return {
          label: "매우 쉬움",
          variant: "secondary" as const,
          className: "bg-green-100 text-green-800 hover:bg-green-100",
          icon: ZapOff,
        };
      case 2:
        return {
          label: "쉬움",
          variant: "secondary" as const,
          className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
          icon: Zap,
        };
      case 3:
        return {
          label: "보통",
          variant: "secondary" as const,
          className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
          icon: Zap,
        };
      case 4:
        return {
          label: "어려움",
          variant: "secondary" as const,
          className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
          icon: Flame,
        };
      case 5:
        return {
          label: "매우 어려움",
          variant: "secondary" as const,
          className: "bg-red-100 text-red-800 hover:bg-red-100",
          icon: Flame,
        };
      default:
        return {
          label: "알 수 없음",
          variant: "outline" as const,
          className: "",
          icon: Zap,
        };
    }
  };

  const config = getDifficultyConfig(difficulty);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} flex items-center gap-1`}
    >
      <Icon size={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}