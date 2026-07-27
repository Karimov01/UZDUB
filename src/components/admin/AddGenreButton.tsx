"use client";

import { Tag } from "lucide-react";

export default function AddGenreButton() {
  return (
    <button
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
      style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
      onClick={() => alert("Yangi janr qo'shish (demo rejim)")}
    >
      <Tag className="h-4 w-4" />
      Yangi janr
    </button>
  );
}
