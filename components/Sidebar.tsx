"use client";

import {
  Archive,
  BarChart3,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Inbox,
  LineChart,
  Moon,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Tag,
} from "lucide-react";

import { motion } from "framer-motion";

const mainNavItems = [
  {
    key: "today",
    label: "Today",
    icon: CalendarDays,
  },
  {
    key: "inbox",
    label: "Inbox",
    icon: Inbox,
  },
  {
    key: "upcoming",
    label: "Upcoming",
    icon: Calendar,
  },
  {
    key: "priorities",
    label: "Priority",
    icon: Star,
  },
  {
    key: "goals",
    label: "Goals",
    icon: ShieldCheck,
  },
  {
    key: "routines",
    label: "Routines",
    icon: RefreshCcw,
  },
  {
    key: "calendar",
    label: "Calendar",
    icon: CalendarCheck,
  },
  {
    key: "review",
    label: "Review",
    icon: LineChart,
  },
  {
    key: "insights",
    label: "Insights",
    icon: BarChart3,
  },
];

const libraryNavItems = [
  {
    key: "categories",
    label: "Categories",
    icon: Tag,
  },
  {
    key: "archive",
    label: "Archive",
    icon: Archive,
  },
];

type SidebarProps = {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  selectedView: string;
  setSelectedView: (value: string) => void;
  themeColor: string;
  inboxCount?: number;
};

export default function Sidebar({
  darkMode,
  setDarkMode,
  selectedView,
  setSelectedView,
  themeColor,
  inboxCount = 0,
}: SidebarProps) {
  const sidebarBg = "bg-[#1f232b]";

  const border = "border-white/[0.09]";
  const mutedText = "text-white/45";
  const softSurface = "bg-white/[0.06]";
  const hoverSurface = "hover:bg-white/[0.08]";
  const activeSurface = "bg-white/[0.12]";

  return (
    <aside
      className={`sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r px-4 py-5 text-white shadow-[18px_0_70px_rgba(0,0,0,0.38)] lg:flex ${border} ${sidebarBg}`}
    >
      <div className="mb-7">
        <div className="mb-5 flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white shadow-[0_14px_34px_rgba(0,0,0,0.28)]"
            style={{
              backgroundColor: themeColor,
            }}
          >
            M
          </div>

          <div>
            <h1 className="text-[15px] font-[800] tracking-[-0.03em] text-white">
              Momentum
            </h1>

            <p className={`text-[11px] font-medium ${mutedText}`}>
              Personal OS
            </p>
          </div>
        </div>

        <div className={`rounded-2xl border ${border} ${softSurface} p-3`}>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles
              size={14}
              style={{
                color: themeColor,
              }}
            />

            <p className="text-xs font-[800] text-white">
              AI planning enabled
            </p>
          </div>

          <p className={`text-[11px] leading-relaxed ${mutedText}`}>
            Momentum can prioritize and suggest dates from your task titles.
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto pr-1">
        <SidebarSectionLabel label="Plan" mutedText={mutedText} />

        <div className="mb-6 space-y-1.5">
          {mainNavItems.map((item) => (
            <SidebarNavButton
              key={item.key}
              item={{
                ...item,
                count: item.key === "inbox" ? inboxCount : undefined,
              }}
              selectedView={selectedView}
              setSelectedView={setSelectedView}
              activeSurface={activeSurface}
              hoverSurface={hoverSurface}
              themeColor={themeColor}
            />
          ))}
        </div>

        <SidebarSectionLabel label="Library" mutedText={mutedText} />

        <div className="mb-6 space-y-1.5">
          {libraryNavItems.map((item) => (
            <SidebarNavButton
              key={item.key}
              item={item}
              selectedView={selectedView}
              setSelectedView={setSelectedView}
              activeSurface={activeSurface}
              hoverSurface={hoverSurface}
              themeColor={themeColor}
            />
          ))}
        </div>

        <SidebarSectionLabel label="System" mutedText={mutedText} />

        <div className="space-y-1.5">
          <SidebarNavButton
            item={{
              key: "settings",
              label: "Settings",
              icon: Settings,
            }}
            selectedView={selectedView}
            setSelectedView={setSelectedView}
            activeSurface={activeSurface}
            hoverSurface={hoverSurface}
            themeColor={themeColor}
          />

          <motion.button
            whileHover={{
              scale: 1.01,
            }}
            whileTap={{
              scale: 0.98,
            }}
            onClick={() => setDarkMode(!darkMode)}
            className={`flex h-11 w-full items-center justify-between rounded-2xl px-3 text-sm font-[700] text-white/70 transition hover:text-white ${hoverSurface}`}
          >
            <div className="flex items-center gap-3">
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}

              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </div>

            <div className="flex h-6 w-11 items-center rounded-full bg-white/12 p-1 transition">
              <div
                className="h-4 w-4 rounded-full transition-transform"
                style={{
                  backgroundColor: themeColor,
                  transform: darkMode
                    ? "translateX(20px)"
                    : "translateX(0px)",
                }}
              />
            </div>
          </motion.button>
        </div>
      </nav>

      <div className={`mt-5 border-t ${border} pt-4`}>
        <button
          className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:text-white ${hoverSurface}`}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-[900] text-white shadow-[0_12px_28px_rgba(0,0,0,0.24)]"
            style={{
              backgroundColor: themeColor,
            }}
          >
            A
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-[800] text-white">Arnav</p>
            <p className={`text-[11px] font-medium ${mutedText}`}>
              View Profile
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
}

function SidebarSectionLabel({
  label,
  mutedText,
}: {
  label: string;
  mutedText: string;
}) {
  return (
    <p
      className={`mb-2 px-1 text-[11px] font-[800] uppercase tracking-[0.16em] ${mutedText}`}
    >
      {label}
    </p>
  );
}

function SidebarNavButton({
  item,
  selectedView,
  setSelectedView,
  activeSurface,
  hoverSurface,
  themeColor,
}: any) {
  const Icon = item.icon;
  const isActive = selectedView === item.key;

  return (
    <motion.button
      whileHover={{
        scale: 1.01,
      }}
      whileTap={{
        scale: 0.98,
      }}
      onClick={() => setSelectedView(item.key)}
      className={`flex h-11 w-full items-center justify-between rounded-2xl px-3 text-sm font-[700] transition ${
        isActive
          ? `${activeSurface} text-white shadow-[0_14px_34px_rgba(0,0,0,0.22)]`
          : `text-white/58 hover:text-white ${hoverSurface}`
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon
          size={17}
          style={
            isActive
              ? {
                  color: themeColor,
                }
              : undefined
          }
        />

        <span>{item.label}</span>
      </div>

      {item.count ? (
        <span
          className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-[900] text-white shadow-sm"
          style={{
            backgroundColor: themeColor,
          }}
        >
          {item.count}
        </span>
      ) : null}
    </motion.button>
  );
}