"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import { Archive } from "lucide-react";

export default function Toast({
  message,
  darkMode,
}: {
  message: string;
  darkMode: boolean;
}) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{
            opacity: 0,
            y: -20,
            scale: 0.96,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: -20,
            scale: 0.96,
          }}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl backdrop-blur-2xl ${
            darkMode
              ? "bg-white/[0.08]"
              : "bg-white/90"
          }`}
        >
          <div className="flex items-center gap-3">
            <Archive size={16} />

            <span className="text-sm font-medium">
              {message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}