"use client";

import {
  useState,
  type ComponentType,
} from "react";

import {
  Archive,
  BarChart3,
  Bell,
  CalendarDays,
  Inbox,
  Menu,
  Moon,
  Settings,
  Sun,
  Tag,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  UserButton,
  useUser,
} from "@clerk/nextjs";

import MomentuhmLogo from "@/components/MomentuhmLogo";

/* ------------------------------------------------ */
/* Navigation configuration */
/* ------------------------------------------------ */

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
  {
    key: "insights",
    label: "Insights",
    icon: BarChart3,
  },
];

/* ------------------------------------------------ */
/* Types */
/* ------------------------------------------------ */

type SidebarProps = {
  darkMode: boolean;
  setDarkMode: (
    value: boolean
  ) => void;
  selectedView: string;
  setSelectedView: (
    value: string
  ) => void;
  themeColor: string;
  inboxCount?: number;
  pendingSuggestionCount?: number;
  onOpenSuggestedDates: () => void;
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
  onSelect: (
    view: string
  ) => void;
};

/* ------------------------------------------------ */
/* Sidebar */
/* ------------------------------------------------ */

export default function Sidebar({
  darkMode,
  setDarkMode,
  selectedView,
  setSelectedView,
  inboxCount = 0,
  pendingSuggestionCount = 0,
  onOpenSuggestedDates,
}: SidebarProps) {
  const {
    user,
    isLoaded,
  } = useUser();

  const [
    isDrawerOpen,
    setIsDrawerOpen,
  ] = useState(false);

  const displayName =
    isLoaded && user
      ? user.fullName ||
        user.firstName ||
        user
          .primaryEmailAddress
          ?.emailAddress ||
        "Account"
      : "Account";

  const secondaryIdentity =
    isLoaded && user
      ? user
          .primaryEmailAddress
          ?.emailAddress ||
        "View profile"
      : "View profile";

  const surfaceClass = darkMode
    ? "border-white/[0.09] bg-[#111317] text-white"
    : "border-[#E3E4E8] bg-white text-[#15171C]";

  const iconButtonClass =
    darkMode
      ? "border-white/[0.08] bg-white/[0.035] text-white/62 hover:bg-white/[0.07] hover:text-white"
      : "border-black/[0.06] bg-white text-[#4F535E] hover:bg-black/[0.025] hover:text-[#15171C]";

  const selectView = (
    view: string
  ) => {
    setSelectedView(view);
    setIsDrawerOpen(false);
  };

  const sidebarContentProps: SidebarContentProps =
    {
      darkMode,
      displayName,
      secondaryIdentity,
      inboxCount,
      selectedView,
      onSelect: selectView,
    };

  return (
    <>
      {/* Desktop and tablet top bar */}
      <header
        className={`fixed inset-x-0 top-0 z-[150] hidden h-[68px] items-center justify-between border-b px-5 shadow-[0_1px_0_rgba(15,23,42,0.02)] sm:flex lg:px-6 ${surfaceClass}`}
      >
        <div className="flex min-w-0 items-center gap-4">
          {/* Tablet navigation toggle */}
          <button
            type="button"
            onClick={() =>
              setIsDrawerOpen(
                (previous) =>
                  !previous
              )
            }
            aria-label={
              isDrawerOpen
                ? "Close navigation"
                : "Open navigation"
            }
            aria-expanded={
              isDrawerOpen
            }
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border transition lg:hidden ${iconButtonClass}`}
          >
            {isDrawerOpen ? (
              <X
                size={18}
                strokeWidth={1.8}
              />
            ) : (
              <Menu
                size={19}
                strokeWidth={1.8}
              />
            )}
          </button>

          {/* Logo */}
          <button
            type="button"
            onClick={() =>
              selectView("today")
            }
            aria-label="Open Today"
            title="Momentuhm"
            className="min-w-0 rounded-[12px] text-left transition-opacity hover:opacity-85 active:opacity-70"
          >
            <MomentuhmLogo
              darkMode={darkMode}
            />
          </button>
        </div>

        {/* Header controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={
              onOpenSuggestedDates
            }
            aria-label={
              pendingSuggestionCount >
              0
                ? `Review ${pendingSuggestionCount} pending date suggestion${
                    pendingSuggestionCount ===
                    1
                      ? ""
                      : "s"
                  }`
                : "Review suggested dates"
            }
            title={
              pendingSuggestionCount >
              0
                ? `${pendingSuggestionCount} suggested date${
                    pendingSuggestionCount ===
                    1
                      ? ""
                      : "s"
                  } pending`
                : "No pending suggested dates"
            }
            className={`relative flex h-9 w-9 items-center justify-center rounded-[9px] border transition ${iconButtonClass}`}
          >
            <Bell
              size={17}
              strokeWidth={1.7}
            />

            {pendingSuggestionCount >
              0 && (
              <span
                aria-hidden="true"
                className={`absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 px-1 text-[9px] font-[800] leading-none ${
                  darkMode
                    ? "border-[#111317] bg-white text-[#111317]"
                    : "border-white bg-[#181818] text-white"
                }`}
              >
                {pendingSuggestionCount >
                99
                  ? "99+"
                  : pendingSuggestionCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setDarkMode(
                !darkMode
              )
            }
            aria-label={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={
              darkMode
                ? "Light mode"
                : "Dark mode"
            }
            className={`flex h-9 w-9 items-center justify-center rounded-[9px] border transition ${iconButtonClass}`}
          >
            {darkMode ? (
              <Sun
                size={17}
                strokeWidth={1.7}
              />
            ) : (
              <Moon
                size={17}
                strokeWidth={1.7}
              />
            )}
          </button>

          <div className="ml-1 flex h-9 w-9 items-center justify-center">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  userButtonAvatarBox:
                    "h-9 w-9",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Permanent desktop sidebar */}
      <aside
        className={`fixed bottom-0 left-0 top-[68px] z-[140] hidden w-[252px] flex-col border-r px-5 py-6 shadow-[8px_0_30px_rgba(15,23,42,0.025)] lg:flex ${surfaceClass}`}
      >
        <SidebarContent
          {...sidebarContentProps}
        />
      </aside>

      {/* Tablet navigation drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="lg:hidden">
            <motion.button
              type="button"
              aria-label="Close navigation"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.16,
              }}
              onClick={() =>
                setIsDrawerOpen(
                  false
                )
              }
              className="fixed inset-0 z-[140] hidden bg-black/18 backdrop-blur-[2px] sm:block"
            />

            <motion.aside
              initial={{
                x: -274,
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: -274,
              }}
              transition={{
                type: "spring",
                stiffness: 310,
                damping: 31,
                mass: 0.9,
              }}
              className={`fixed bottom-0 left-0 top-[68px] z-[145] hidden w-[252px] flex-col border-r px-5 py-6 shadow-[18px_0_60px_rgba(15,23,42,0.10)] sm:flex lg:hidden ${surfaceClass}`}
            >
              <SidebarContent
                {...sidebarContentProps}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------ */
/* Sidebar content */
/* ------------------------------------------------ */

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
        <SidebarSectionLabel
          label=""
          darkMode={darkMode}
        />

        {/* Main navigation */}
        <div className="mb-9 space-y-1">
          {mainNavItems.map(
            (item) => (
              <SidebarNavButton
                key={item.key}
                item={{
                  ...item,
                  count:
                    item.key ===
                    "inbox"
                      ? inboxCount
                      : undefined,
                }}
                darkMode={
                  darkMode
                }
                selectedView={
                  selectedView
                }
                onSelect={
                  onSelect
                }
              />
            )
          )}
        </div>

        {/* Library */}
        <SidebarSectionLabel
          label="Library"
          darkMode={darkMode}
        />

        <div className="mb-9 space-y-1">
          {libraryNavItems.map(
            (item) => (
              <SidebarNavButton
                key={item.key}
                item={item}
                darkMode={
                  darkMode
                }
                selectedView={
                  selectedView
                }
                onSelect={
                  onSelect
                }
              />
            )
          )}
        </div>

        {/* System */}
        <SidebarSectionLabel
          label="System"
          darkMode={darkMode}
        />

        <div className="space-y-1">
          <SidebarNavButton
            item={{
              key: "settings",
              label: "Settings",
              icon: Settings,
            }}
            darkMode={darkMode}
            selectedView={
              selectedView
            }
            onSelect={
              onSelect
            }
          />
        </div>
      </nav>

      {/* Account */}
      <div
        className={`mt-5 shrink-0 border-t pt-5 ${
          darkMode
            ? "border-white/[0.08]"
            : "border-black/[0.055]"
        }`}
      >
        <div
          className={`flex items-center gap-3 rounded-[12px] px-2 py-2 transition ${
            darkMode
              ? "hover:bg-white/[0.05]"
              : "hover:bg-black/[0.025]"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  userButtonAvatarBox:
                    "h-9 w-9",
                },
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-[13px] font-[760] ${
                darkMode
                  ? "text-white"
                  : "text-[#15171C]"
              }`}
            >
              {displayName}
            </p>

            <p
              className={`mt-0.5 truncate text-[11px] font-[500] ${
                darkMode
                  ? "text-white/38"
                  : "text-black/38"
              }`}
            >
              {
                secondaryIdentity
              }
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------ */
/* Section label */
/* ------------------------------------------------ */

function SidebarSectionLabel({
  label,
  darkMode,
}: {
  label: string;
  darkMode: boolean;
}) {
  return (
    <p
      className={`mb-3 px-3 text-[10px] font-[800] uppercase tracking-[0.19em] ${
        darkMode
          ? "text-white/30"
          : "text-black/32"
      }`}
    >
      {label}
    </p>
  );
}

/* ------------------------------------------------ */
/* Navigation button */
/* ------------------------------------------------ */

function SidebarNavButton({
  item,
  darkMode,
  selectedView,
  onSelect,
}: {
  item: SidebarItem;
  darkMode: boolean;
  selectedView: string;
  onSelect: (
    view: string
  ) => void;
}) {
  const Icon = item.icon;

  const isActive =
    selectedView === item.key;

  return (
    <motion.button
      type="button"
      whileHover={{
        x: 2,
      }}
      whileTap={{
        scale: 0.985,
      }}
      onClick={() =>
        onSelect(item.key)
      }
      aria-current={
        isActive
          ? "page"
          : undefined
      }
      className={`relative flex h-11 w-full items-center justify-between rounded-[10px] px-3 text-[13px] transition ${
        isActive
          ? darkMode
            ? "bg-white/[0.08] font-[760] text-white"
            : "bg-black/[0.035] font-[760] text-black"
          : darkMode
          ? "font-[600] text-white/56 hover:bg-white/[0.05] hover:text-white"
          : "font-[600] text-black/58 hover:bg-black/[0.025] hover:text-black"
      }`}
    >
      {isActive && (
        <span
          aria-hidden="true"
          className={`absolute bottom-2 left-0 top-2 w-[3px] rounded-full ${
            darkMode
              ? "bg-white"
              : "bg-black"
          }`}
        />
      )}

      <div className="flex items-center gap-3">
        <Icon
          size={17}
          strokeWidth={
            isActive
              ? 2.1
              : 1.75
          }
          className={
            isActive
              ? darkMode
                ? "text-white"
                : "text-black"
              : darkMode
              ? "text-white/50"
              : "text-black/50"
          }
        />

        <span>{item.label}</span>
      </div>

      {item.count ? (
        <span
          className={`flex h-6 min-w-6 items-center justify-center rounded-full border px-2 text-[10px] font-[800] ${
            darkMode
              ? "border-white/[0.08] bg-white/[0.06] text-white/58"
              : "border-black/[0.06] bg-white text-black/58"
          }`}
        >
          {item.count}
        </span>
      ) : null}
    </motion.button>
  );
}