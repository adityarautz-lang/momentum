"use client";

import {
  Archive,
  Calendar,
  CalendarDays,
  Inbox,
  Moon,
  Settings,
  Sparkles,
  Star,
  Sun,
  Tag,
} from "lucide-react";

import { motion } from "framer-motion";
import { UserButton, useUser } from "@clerk/nextjs";

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
  const { user, isLoaded } = useUser();

  const displayName =
    isLoaded && user
      ? user.fullName ||
        user.firstName ||
        user.primaryEmailAddress?.emailAddress ||
        "Account"
      : "Account";

  const sidebarBg = darkMode
    ? "bg-[#050505]"
    : "bg-white/95 backdrop-blur-2xl";

  const border = darkMode ? "border-[#05AD98]/18" : "border-[#BBBFBF]/35";

  const text = darkMode ? "text-white" : "text-[#111111]";

  const mutedText = darkMode ? "text-white/45" : "text-[#878787]";

  const softSurface = darkMode ? "bg-[#0b0b0b]" : "bg-white";

  const softBorder = darkMode ? "border-[#05AD98]/18" : "border-[#BBBFBF]/35";

  const hoverSurface = darkMode ? "hover:bg-[#0d0d0d]" : "hover:bg-[#f6f8f8]";

  const activeSurface = darkMode
  ? "border border-[#05AD98]/30 bg-[#05AD98]/10"
  : "border border-[#05AD98]/20 bg-[#05AD98]/10";
  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-screen w-[260px] shrink-0 flex-col border-r px-4 py-5 shadow-[18px_0_70px_rgba(0,0,0,0.30)] lg:flex ${border} ${sidebarBg} ${text}`}
    >
      <div className="relative z-10 mb-7">
      <div className="mb-5 flex items-center gap-4">
  <div
    className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[19px] text-[22px] font-[900] leading-none text-white shadow-[0_12px_28px_rgba(0,0,0,0.22)]"
    style={{
      backgroundColor: themeColor,
    }}
  >
    V
  </div>

  <div className="flex min-w-0 flex-col justify-center">
    <h1 className={`text-[39px] font-[900] leading-none tracking-[-0.055em] ${text}`}>
      Veira
    </h1>

    <p className={`mt-2 text-[12px] font-[800] leading-none ${mutedText}`}>
      Personal OS
    </p>
  </div>
</div>

        <div
          className={`rounded-[20px] border p-3 shadow-[0_12px_30px_rgba(0,0,0,0.08)] ${softBorder} ${softSurface}`}
        >
          <div className="mb-2 flex items-center gap-2">
            <Sparkles
              size={14}
              style={{
                color: themeColor,
              }}
            />

            <p className={`text-xs font-[800] ${text}`}>
              AI planning enabled
            </p>
          </div>

          <p className={`text-[11px] leading-relaxed ${mutedText}`}>
            Veira can prioritize and suggest dates from your task titles.
          </p>
        </div>
      </div>

      <nav className="relative z-10 min-h-0 flex-1 overflow-y-auto pr-1">
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
              darkMode={darkMode}
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
              darkMode={darkMode}
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
            darkMode={darkMode}
          />

          <motion.button
            whileHover={{
              scale: 1.01,
            }}
            whileTap={{
              scale: 0.98,
            }}
            onClick={() => setDarkMode(!darkMode)}
            className={`flex h-11 w-full items-center justify-between rounded-2xl px-3 text-sm font-[750] transition ${
              darkMode
                ? "text-white/68 hover:text-white"
                : "text-black/62 hover:text-black"
            } ${hoverSurface}`}
          >
            <div className="flex items-center gap-3">
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}

              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </div>

            <div
              className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
                darkMode
                  ? "border border-white/[0.09] bg-white/[0.06]"
                  : "border border-[#BBBFBF]/45 bg-[#BBBFBF]/30"
              }`}
            >
              <div
                className="h-4 w-4 rounded-full shadow-[0_8px_18px_rgba(0,0,0,0.20)] transition-transform"
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

      <div className={`relative z-10 mt-4 shrink-0 border-t ${border} pt-4`}>
        <div
          className={`flex w-full items-center gap-3 rounded-[20px] border p-2 text-left transition ${
            darkMode
              ? "border-white/[0.09] bg-[#11191b] hover:bg-[#121a1c]"
              : "border-[#BBBFBF]/35 bg-white hover:bg-[#f6f8f8]"
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  userButtonAvatarBox:
                    "h-9 w-9 shadow-[0_12px_28px_rgba(0,0,0,0.24)]",

                  userButtonPopoverCard:
                    "w-[280px] rounded-[16px] border border-[#05AD98]/35 bg-[#11191b] p-2 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]",

                  userButtonPopoverMain: "bg-[#11191b] text-white",

                  userButtonPopoverActions: "bg-[#11191b]",

                  userButtonPopoverActionButton:
                    "h-10 rounded-[10px] px-3 text-white hover:bg-white/[0.08]",

                  userButtonPopoverActionButtonText:
                    "text-[13px] font-[700] text-white",

                  userButtonPopoverActionButtonIcon: "text-white/60",

                  userButtonPopoverFooter: "hidden",

                  userPreviewMainIdentifier:
                    "text-sm font-[800] text-white",

                  userPreviewSecondaryIdentifier:
                    "text-xs font-[600] text-white/55",

                  userPreviewAvatarBox: "h-9 w-9",
                },
              }}
            />
          </div>

          <div className="min-w-0">
            <p className={`truncate text-sm font-[800] ${text}`}>
              {displayName}
            </p>

            <p className={`text-[11px] font-medium ${mutedText}`}>
              Profile & sign out
            </p>
          </div>
        </div>
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
      className={`mb-2 px-1 text-[11px] font-[800] uppercase tracking-[0.18em] ${mutedText}`}
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
  darkMode,
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
      className={`flex h-11 w-full items-center justify-between rounded-2xl px-3 text-sm font-[750] transition ${
        isActive
          ? `${activeSurface} ${
              darkMode ? "text-white" : "text-[#111111]"
            } shadow-[0_14px_34px_rgba(0,0,0,0.16)]`
          : `${
              darkMode
                ? "text-white/62 hover:text-white"
                : "text-black/58 hover:text-black"
            } ${hoverSurface}`
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
          className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-[900] text-white shadow-[0_10px_20px_rgba(5,173,152,0.20)]"
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