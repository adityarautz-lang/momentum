"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function Toast({
  message,
  darkMode,
}: {
  message: string;
  darkMode: boolean;
}) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 top-[82px] z-[22000] flex max-w-[calc(100vw-28px)] -translate-x-1/2 items-center gap-2.5 rounded-[12px] border px-4 py-3 text-[11px] font-[650] shadow-[0_16px_45px_rgba(15,23,42,0.16)] sm:top-[84px] ${
            darkMode
              ? "border-white/[0.10] bg-[#171B22] text-white"
              : "border-[#DCE6F2] bg-white text-[#111827]"
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              darkMode
                ? "bg-emerald-400/12 text-emerald-300"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <CheckCircle2 size={15} strokeWidth={2} />
          </span>
          <span className="min-w-0 truncate">{message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
