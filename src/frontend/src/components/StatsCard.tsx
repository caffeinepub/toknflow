import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  trend?: string;
  colorClass?: string;
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  colorClass = "text-teal-400",
  isLoading = false,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <div
        className="glass rounded-2xl p-5 card-hover"
        data-ocid="stats.loading_state"
      >
        <Skeleton className="h-10 w-10 rounded-xl mb-3 bg-white/10" />
        <Skeleton className="h-4 w-24 mb-2 bg-white/10" />
        <Skeleton className="h-8 w-16 bg-white/10" />
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5 card-hover animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-white/5 ${colorClass}`}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full font-medium">
            {trend}
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
        {title}
      </p>
      <p className={`text-2xl font-bold font-display ${colorClass}`}>{value}</p>
      {subtitle && (
        <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>
      )}
    </div>
  );
}
