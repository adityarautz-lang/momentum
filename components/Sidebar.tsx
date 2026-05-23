
"use client";

import {
  Archive,
  ListTodo,
  Moon,
  Palette,
  Sun,
  Tag,
} from "lucide-react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

const themes = [
  "black", // soft violet
  "White", // soft violet
  "#A78BFA", // soft violet
  "#F9A8D4", // pastel pink
  "#93C5FD", // pastel blue
  "#86EFAC", // mint green
  "#FCD34D", // warm yellow
  "#FDBA74", // peach orange
  "#67E8F9", // cyan
  "#C4B5FD", // lavender
  "#FDA4AF", // blush rose
  "#99F6E4", // aqua mint
  "#D8B4FE", // lilac
  "#BFDBFE", // ice blue
  "#FDE68A", // pastel amber
  "#FBCFE8", // soft magenta
  "#BBF7D0", // soft green
];

export default function Sidebar({
  darkMode,
  setDarkMode,
  selectedView,
  setSelectedView,
  themeColor,
  setThemeColor,
  showThemePicker,
  setShowThemePicker,
}: any) {
  const glass = darkMode
    ? "bg-white/[0.05]"
    : "bg-white/75";

  const border = darkMode
    ? "border-white/[0.06]"
    : "border-black/[0.04]";

  return (
    <aside
      className={`w-[280px] min-h-screen border-r px-5 py-8 ${border}`}
    >
      {/* Logo */}
      <div className="mb-10">
        <p className="text-sm opacity-50 mb-2">
          Productivity reimagined
        </p>

        <h1 className="text-[32px] font-[700] tracking-[-0.05em]">
          Momentum
        </h1>

        <div
          className="h-[4px] w-20 rounded-full mt-4"
          style={{
            backgroundColor: themeColor,
          }}
        />
      </div>

      {/* Navigation */}
      <div className="space-y-2 mb-10">
        {[
          {
            key: "current",
            label: "Current List",
            icon: ListTodo,
          },

          {
            key: "archive",
            label: "Archived Items",
            icon: Archive,
          },

          {
            key: "categories",
            label: "Categories",
            icon: Tag,
          },
        ].map((item) => (
          <motion.button
            whileHover={{
              scale: 1.01,
            }}
            whileTap={{
              scale: 0.98,
            }}
            key={item.key}
            onClick={() =>
              setSelectedView(item.key)
            }
            className={`w-full h-12 px-4 rounded-2xl flex items-center gap-3 text-sm font-[600] transition ${
              selectedView === item.key
                ? glass
                : "hover:bg-black/[0.04]"
            }`}
          >
            <item.icon size={18} />

            {item.label}
          </motion.button>
        ))}
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Theme */}
        <div className="relative">
          <button
            onClick={() =>
              setShowThemePicker(
                !showThemePicker
              )
            }
            className={`w-full h-12 px-4 rounded-2xl flex items-center justify-between ${glass}`}
          >
            <div className="flex items-center gap-3">
              <Palette size={18} />

              <span className="text-sm font-[600]">
                Theme
              </span>
            </div>

            <div
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: themeColor,
              }}
            />
          </button>

          <AnimatePresence>
            {showThemePicker && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -10,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                  scale: 0.96,
                }}
                transition={{
                  duration: 0.2,
                }}
                className={`absolute top-14 left-0 z-50 p-4 rounded-3xl backdrop-blur-2xl border ${glass} ${border}`}
              >
                <div className="grid grid-cols-5 gap-3">
                  {themes.map((color) => (
                    <motion.button
                      key={color}
                      whileHover={{
                        scale: 1.12,
                      }}
                      whileTap={{
                        scale: 0.92,
                      }}
                      onClick={() => {
                        setThemeColor(color);

                        setShowThemePicker(
                          false
                        );
                      }}
                      className={`w-8 h-8 rounded-full border-2 ${
                        themeColor === color
                          ? darkMode
                            ? "border-white"
                            : "border-black"
                          : "border-transparent"
                      }`}
                      style={{
                        backgroundColor: color,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dark Mode */}
        <button
          onClick={() =>
            setDarkMode(!darkMode)
          }
          className={`w-full h-12 px-4 rounded-2xl flex items-center justify-between ${glass}`}
        >
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}

            <span className="text-sm font-[600]">
              {darkMode
                ? "Light"
                : "Dark"}
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
}