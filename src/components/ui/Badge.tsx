import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "purple" | "pink" | "green" | "yellow" | "red";
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-white/10 text-gray-300 border border-white/10",
    purple: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    pink: "bg-pink-500/20 text-pink-300 border border-pink-500/30",
    green: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    yellow: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    red: "bg-red-500/20 text-red-300 border border-red-500/30",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
