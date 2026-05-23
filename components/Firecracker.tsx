"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import { Firecracker } from "@/types";

export default function FirecrackerLayer({
  firecrackers,
  themeColor,
}: {
  firecrackers: Firecracker[];
  themeColor: string;
}) {
  return (
    <AnimatePresence>
      {firecrackers.map((firecracker) => (
        <div
          key={firecracker.id}
          className="fixed inset-0 pointer-events-none z-[200]"
        >
          {Array.from({ length: 14 }).map(
            (_, index) => {
              const angle =
                (index / 14) *
                Math.PI *
                2;

              const distance =
                30 +
                Math.random() * 40;

              return (
                <motion.div
                  key={index}
                  initial={{
                    opacity: 1,
                    scale: 0,
                    x: firecracker.x,
                    y: firecracker.y,
                  }}
                  animate={{
                    opacity: 0,
                    scale: 1,
                    x:
                      firecracker.x +
                      Math.cos(angle) *
                        distance,
                    y:
                      firecracker.y +
                      Math.sin(angle) *
                        distance,
                  }}
                  transition={{
                    duration: 0.9,
                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      themeColor,
                    boxShadow: `0 0 14px ${themeColor}`,
                  }}
                />
              );
            }
          )}
        </div>
      ))}
    </AnimatePresence>
  );
}