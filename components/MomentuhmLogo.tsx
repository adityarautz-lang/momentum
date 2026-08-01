"use client";

import { Zap } from "lucide-react";

type MomentuhmLogoProps = {
  darkMode?: boolean;
  size?: "small" | "default";
};

export default function MomentuhmLogo({
  darkMode = false,
  size = "default",
}: MomentuhmLogoProps) {
  const compact = size === "small";

  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-[9px] bg-[#0B6EFF] text-white shadow-[0_6px_18px_rgba(11,110,255,0.25)] ${
          compact ? "h-7 w-7" : "h-8 w-8"
        }`}
      >
        <Zap
          size={compact ? 15 : 17}
          strokeWidth={2.2}
          fill="currentColor"
        />
      </span>

      <span
        className={`truncate font-[800] tracking-[-0.035em] ${
          compact ? "text-[14px]" : "text-[17px]"
        } ${darkMode ? "text-white" : "text-[#111827]"}`}
      >
        Momentuhm
      </span>
    </span>
  );
}
