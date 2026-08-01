"use client";

import { useState, type ComponentType } from "react";
import {
  Archive,
  BarChart3,
  Bell,
  CalendarDays,
  HelpCircle,
  Inbox,
  Menu,
  Moon,
  Settings,
  Sun,
  Tag,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { UserButton, useUser } from "@clerk/nextjs";
import MomentuhmLogo from "@/components/MomentuhmLogo";

const BLUE = "#0B6EFF";

const mainNavItems = [
  { key: "today", label: "Today", icon: CalendarDays },
  { key: "inbox", label: "Inbox", icon: Inbox },
];

const libraryNavItems = [
  { key: "categories", label: "Categories", icon: Tag },
  { key: "archive", label: "Archive", icon: Archive },
  { key: "insights", label: "Insights", icon: BarChart3 },
];

type SidebarProps = {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  selectedView: string;
  setSelectedView: (value: string) => void;
  themeColor: string;
  inboxCount?: number;
  pendingSuggestionCount?: number;
  onOpenSuggestedDates: () => void;
  onOpenTutorial: () => void;
};

type SidebarItem = {
  key: string;
  label: string;
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  count?: number;
};

type SidebarContentProps = {
  darkMode: boolean;
  displayName: string;
  secondaryIdentity: string;
  inboxCount: number;
  selectedView: string;
  onSelect: (view: string) => void;
};

export default function Sidebar({
  darkMode,
  setDarkMode,
  selectedView,
  setSelectedView,
  themeColor: _themeColor,
  inboxCount = 0,
  pendingSuggestionCount = 0,
  onOpenSuggestedDates,
  onOpenTutorial,
}: SidebarProps) {
  const { user, isLoaded } = useUser();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const displayName =
    isLoaded && user
      ? user.fullName ||
        user.firstName ||
        user.primaryEmailAddress?.emailAddress ||
        "Account"
      : "Account";

  const secondaryIdentity =
    isLoaded && user
      ? user.primaryEmailAddress?.emailAddress || "View profile"
      : "View profile";

  const surfaceClass = darkMode
    ? "border-white/[0.09] bg-[#11141A] text-white"
    : "border-[#E5EAF2] bg-white text-[#111827]";

  const iconButtonClass = darkMode
    ? "border-white/[0.09] bg-white/[0.04] text-white/62 hover:bg-white/[0.08] hover:text-white"
    : "border-[#E4EAF2] bg-white text-[#4E596B] shadow-[0_3px_12px_rgba(15,23,42,0.04)] hover:border-[#CAD7EB] hover:bg-[#F8FBFF] hover:text-[#0B6EFF]";

  const helpButtonClass = darkMode
    ? "border-white/[0.10] bg-white/[0.035] text-white/70 hover:bg-white/[0.07] hover:text-white"
    : "border-blue-200 bg-white text-blue-700 shadow-[0_3px_12px_rgba(15,23,42,0.04)] hover:border-blue-300 hover:bg-blue-50";

  const selectView = (view: string) => {
    setSelectedView(view);
    setIsDrawerOpen(false);
  };

  const sidebarContentProps: SidebarContentProps = {
    darkMode,
    displayName,
    secondaryIdentity,
    inboxCount,
    selectedView,
    onSelect: selectView,
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[150] hidden h-[68px] items-center justify-between border-b px-5 sm:flex lg:px-6 ${surfaceClass}`}
      >
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={() => setIsDrawerOpen((previous) => !previous)}
            aria-label={isDrawerOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isDrawerOpen}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border transition lg:hidden ${iconButtonClass}`}
          >
            {isDrawerOpen ? (
              <X size={18} strokeWidth={1.9} />
            ) : (
              <Menu size={19} strokeWidth={1.9} />
            )}
          </button>

          <button
            type="button"
            onClick={() => selectView("today")}
            aria-label="Open Today"
            title="Momentuhm"
            className="min-w-0 rounded-[12px] text-left transition-opacity hover:opacity-85 active:opacity-70"
          >
            <MomentuhmLogo darkMode={darkMode} />
          </button>
        </div>

        <div className="flex h-full items-center gap-2">
          <button
            id="momentuhm-tour-help-button-desktop"
            type="button"
            onClick={onOpenTutorial}
            aria-label="Open quick tutorial"
            title="How Momentuhm works"
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-full border px-3.5 text-[11px] font-[700] transition active:scale-[0.97] ${helpButtonClass}`}
          >
            <HelpCircle size={15} strokeWidth={1.9} />
            <span className="hidden md:inline">How it works</span>
          </button>

          <button
            type="button"
            onClick={onOpenSuggestedDates}
            aria-label={
              pendingSuggestionCount > 0
                ? `Review ${pendingSuggestionCount} pending date suggestion${
                    pendingSuggestionCount === 1 ? "" : "s"
                  }`
                : "Review suggested dates"
            }
            title={
              pendingSuggestionCount > 0
                ? `${pendingSuggestionCount} suggested date${
                    pendingSuggestionCount === 1 ? "" : "s"
                  } pending`
                : "No pending suggested dates"
            }
            className={`relative flex h-9 w-9 items-center justify-center rounded-[10px] border transition ${iconButtonClass}`}
          >
            <Bell size={17} strokeWidth={1.8} />

            {pendingSuggestionCount > 0 && (
              <span
                aria-hidden="true"
                className={`absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 px-1 text-[9px] font-[800] leading-none ${
                  darkMode
                    ? "border-[#11141A] bg-[#B9F227] text-[#15220A]"
                    : "border-white bg-[#0B6EFF] text-white"
                }`}
              >
                {pendingSuggestionCount > 99 ? "99+" : pendingSuggestionCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Light mode" : "Dark mode"}
            className={`flex h-9 w-9 items-center justify-center rounded-[10px] border transition ${iconButtonClass}`}
          >
            {darkMode ? (
              <Sun size={17} strokeWidth={1.8} />
            ) : (
              <Moon size={17} strokeWidth={1.8} />
            )}
          </button>

          <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-white">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{ elements: { userButtonAvatarBox: "h-9 w-9" } }}
            />
          </div>
        </div>
      </header>

      <aside
        className={`fixed bottom-0 left-0 top-[68px] z-[140] hidden w-[252px] flex-col border-r px-4 pb-5 pt-7 lg:flex ${surfaceClass}`}
      >
        <SidebarContent {...sidebarContentProps} />
      </aside>

      <AnimatePresence>
        {isDrawerOpen && (
          <div className="lg:hidden">
            <motion.button
              type="button"
              aria-label="Close navigation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-[140] hidden bg-black/20 backdrop-blur-[2px] sm:block"
            />

            <motion.aside
              initial={{ x: -274 }}
              animate={{ x: 0 }}
              exit={{ x: -274 }}
              transition={{
                type: "spring",
                stiffness: 310,
                damping: 31,
                mass: 0.9,
              }}
              className={`fixed bottom-0 left-0 top-[68px] z-[145] hidden w-[252px] flex-col border-r px-4 pb-5 pt-7 shadow-[18px_0_60px_rgba(15,23,42,0.10)] sm:flex lg:hidden ${surfaceClass}`}
            >
              <SidebarContent {...sidebarContentProps} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  darkMode,
  displayName,
  secondaryIdentity,
  inboxCount,
  selectedView,
  onSelect,
}: SidebarContentProps) {
  return (
    <>
      <nav className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="mb-8 space-y-1.5">
          {mainNavItems.map((item) => (
            <SidebarNavButton
              key={item.key}
              item={{
                ...item,
                count: item.key === "inbox" ? inboxCount : undefined,
              }}
              darkMode={darkMode}
              selectedView={selectedView}
              onSelect={onSelect}
            />
          ))}
        </div>

        <SidebarSectionLabel label="Library" darkMode={darkMode} />

        <div className="mb-8 space-y-1.5">
          {libraryNavItems.map((item) => (
            <SidebarNavButton
              key={item.key}
              item={item}
              darkMode={darkMode}
              selectedView={selectedView}
              onSelect={onSelect}
            />
          ))}
        </div>

        <SidebarSectionLabel label="System" darkMode={darkMode} />

        <div className="space-y-1.5">
          <SidebarNavButton
            item={{ key: "settings", label: "Settings", icon: Settings }}
            darkMode={darkMode}
            selectedView={selectedView}
            onSelect={onSelect}
          />
        </div>
      </nav>

      <div
        className={`mt-5 shrink-0 border-t pt-4 ${
          darkMode ? "border-white/[0.08]" : "border-[#EEF1F5]"
        }`}
      >
        <div
          className={`flex items-center gap-3 rounded-[13px] border px-2.5 py-2.5 transition ${
            darkMode
              ? "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.06]"
              : "border-transparent hover:border-[#E4EAF2] hover:bg-[#F8FBFF]"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{ elements: { userButtonAvatarBox: "h-9 w-9" } }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-[13px] font-[760] ${
                darkMode ? "text-white" : "text-[#111827]"
              }`}
            >
              {displayName}
            </p>

            <p
              className={`mt-0.5 truncate text-[10.5px] font-[500] ${
                darkMode ? "text-white/38" : "text-[#7A8595]"
              }`}
            >
              {secondaryIdentity}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function SidebarSectionLabel({
  label,
  darkMode,
}: {
  label: string;
  darkMode: boolean;
}) {
  return (
    <p
      className={`mb-3 px-3 text-[9.5px] font-[800] uppercase tracking-[0.19em] ${
        darkMode ? "text-white/28" : "text-[#7A8595]"
      }`}
    >
      {label}
    </p>
  );
}

function SidebarNavButton({
  item,
  darkMode,
  selectedView,
  onSelect,
}: {
  item: SidebarItem;
  darkMode: boolean;
  selectedView: string;
  onSelect: (view: string) => void;
}) {
  const Icon = item.icon;
  const isActive = selectedView === item.key;

  return (
    <motion.button
      type="button"
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onSelect(item.key)}
      aria-current={isActive ? "page" : undefined}
      className={`relative flex h-11 w-full items-center justify-between rounded-[11px] px-3 text-[12.5px] transition ${
        isActive
          ? darkMode
            ? "bg-blue-400/12 font-[760] text-blue-200"
            : "bg-[#EEF5FF] font-[760] text-[#0B6EFF]"
          : darkMode
          ? "font-[600] text-white/56 hover:bg-white/[0.05] hover:text-white"
          : "font-[600] text-[#4F5B6B] hover:bg-[#F7F9FC] hover:text-[#111827]"
      }`}
    >
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full"
          style={{ backgroundColor: BLUE }}
        />
      )}

      <div className="flex items-center gap-3">
        <Icon
          size={17}
          strokeWidth={isActive ? 2.1 : 1.75}
          className={
            isActive
              ? darkMode
                ? "text-blue-200"
                : "text-[#0B6EFF]"
              : darkMode
              ? "text-white/46"
              : "text-[#667085]"
          }
        />

        <span>{item.label}</span>
      </div>

      {item.count ? (
        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-[800] ${
            isActive
              ? darkMode
                ? "bg-blue-300/15 text-blue-200"
                : "bg-white text-[#0B6EFF] shadow-[0_2px_8px_rgba(11,110,255,0.10)]"
              : darkMode
              ? "bg-white/[0.06] text-white/55"
              : "bg-[#F0F3F7] text-[#667085]"
          }`}
        >
          {item.count}
        </span>
      ) : null}
    </motion.button>
  );
}
