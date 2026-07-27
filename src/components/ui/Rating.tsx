"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

export default function Rating({
  value,
  max = 10,
  size = "md",
  readonly = true,
  onChange,
  className,
}: RatingProps) {
  const stars = 5;
  const normalizedValue = (value / max) * stars;

  const sizes = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };
  const iconSize = sizes[size];

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: stars }).map((_, i) => {
        const filled = i < Math.floor(normalizedValue);
        const half = !filled && i < normalizedValue;

        return (
          <button
            key={i}
            disabled={readonly}
            onClick={() => onChange?.((((i + 1) / stars) * max))}
            className={cn(
              "transition-transform",
              !readonly && "hover:scale-110 cursor-pointer"
            )}
          >
            <Star
              className={cn(
                iconSize,
                filled || half ? "text-yellow-400" : "text-gray-600",
                filled && "fill-yellow-400"
              )}
            />
          </button>
        );
      })}
      <span className={cn("ml-1 font-medium text-gray-300", size === "sm" ? "text-xs" : "text-sm")}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}
