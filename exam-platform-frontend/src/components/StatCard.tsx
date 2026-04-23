import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning";
  className?: string;
}

export function StatCard({ label, value, icon: Icon, variant = "default", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm",
        variant === "primary" && "border-primary/20 bg-primary/5",
        variant === "success" && "border-success/20 bg-success-light",
        variant === "warning" && "border-hook/20 bg-hook-light",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className={cn(
            "mt-1 text-2xl font-bold tracking-tight",
            variant === "primary" && "text-primary",
            variant === "success" && "text-success",
            variant === "warning" && "text-hook-foreground"
          )}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={cn(
            "rounded-lg p-2",
            variant === "default" && "bg-muted text-muted-foreground",
            variant === "primary" && "bg-primary/10 text-primary",
            variant === "success" && "bg-success/10 text-success",
            variant === "warning" && "bg-hook/10 text-hook"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
