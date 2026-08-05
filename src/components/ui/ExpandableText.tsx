"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Uzun matnni N qatorga qisqartiradi, "Batafsil" bilan ochiladi
export default function ExpandableText({
  text,
  className,
  style,
  lines = 3,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  lines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setTruncated(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  const clampStyle: React.CSSProperties = expanded
    ? {}
    : {
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      };

  return (
    <div>
      <p ref={ref} className={className} style={{ ...style, ...clampStyle }}>
        {text}
      </p>
      {(truncated || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: "var(--accent-violet)" }}
        >
          {expanded ? "Yashirish" : "Batafsil"}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
