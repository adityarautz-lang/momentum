"use client";

import type { ReactNode } from "react";

type SettingsViewProps = {
  darkMode: boolean;
  userRole: string;
  setUserRole: (value: string) => void;
  enableAppSuggestions: boolean;
  setEnableAppSuggestions: (value: boolean) => void;
  enableAutoPriority: boolean;
  setEnableAutoPriority: (value: boolean) => void;
  enableClipboardAssist: boolean;
  setEnableClipboardAssist: (value: boolean) => void;
  archiveCount: number;
  clearArchive: () => void;
  resetAppData: () => void;

  /*
   * These remain optional so the component can drop into the
   * current page.tsx without forcing an immediate style refactor.
   */
  border?: string;
  className?: string;
  input?: string;
};

export default function SettingsView({
  darkMode,
  userRole,
  setUserRole,
  enableAppSuggestions,
  setEnableAppSuggestions,
  enableAutoPriority,
  setEnableAutoPriority,
  enableClipboardAssist,
  setEnableClipboardAssist,
  archiveCount,
  clearArchive,
  resetAppData,
  className = "",
  input = "",
}: SettingsViewProps) {
  const pageText = darkMode ? "text-white" : "text-[#181818]";

  const mutedText = darkMode
    ? "text-white/48"
    : "text-[#6F6F6A]";

  const cardSurface = darkMode
    ? "border-white/[0.10] bg-[#171717]"
    : "border-black/[0.07] bg-white";

  const divider = darkMode
    ? "border-white/[0.08]"
    : "border-black/[0.07]";

  const fallbackInput = darkMode
    ? "border-white/[0.16] bg-[#1C1C1C] text-white placeholder:text-white/30 focus:border-white/45"
    : "border-[#C8C8C3] bg-white text-[#181818] placeholder:text-[#8B8B85] focus:border-[#181818]";

  const inputClass = input || fallbackInput;

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <header className="mb-7">
        <h1
          className={`text-[30px] font-[760] leading-none tracking-[-0.045em] ${pageText}`}
        >
          Settings
        </h1>

        <p className={`mt-3 text-[13px] font-[500] ${mutedText}`}>
          Manage task intelligence, clipboard capture, and saved app data.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <SettingsCard
          title="Task intelligence"
          description="Control how Momentuhm understands and organizes your work."
          darkMode={darkMode}
          className={`${className} ${cardSurface}`}
        >
          <SettingsRow
            title="Your role"
            description="Used to make AI-generated task reasoning more specific to your work."
            darkMode={darkMode}
          >
            <input
              value={userRole}
              onChange={(event) => setUserRole(event.target.value)}
              placeholder="Product Manager"
              aria-label="Your work role"
              className={`h-11 w-full rounded-[10px] border px-4 text-[13px] font-[650] outline-none transition sm:w-[270px] ${inputClass}`}
            />
          </SettingsRow>

          <div className={`border-t ${divider}`} />

          <SettingsRow
            title="Suggested dates"
            description="Suggest a useful date when a task title indicates urgency or timing."
            darkMode={darkMode}
          >
            <ToggleSwitch
              checked={enableAppSuggestions}
              onChange={setEnableAppSuggestions}
              darkMode={darkMode}
              label="Suggested dates"
            />
          </SettingsRow>

          <div className={`border-t ${divider}`} />

          <SettingsRow
            title="Automatic priority"
            description="Classify new tasks as High, Medium, or Low."
            darkMode={darkMode}
          >
            <ToggleSwitch
              checked={enableAutoPriority}
              onChange={setEnableAutoPriority}
              darkMode={darkMode}
              label="Automatic priority"
            />
          </SettingsRow>

          <div className={`border-t ${divider}`} />

          <SettingsRow
            title="Clipboard Assist"
            description="Check useful copied text when you return and suggest possible tasks."
            darkMode={darkMode}
          >
            <ToggleSwitch
              checked={enableClipboardAssist}
              onChange={setEnableClipboardAssist}
              darkMode={darkMode}
              label="Clipboard Assist"
            />
          </SettingsRow>
        </SettingsCard>

        <SettingsCard
          title="Data"
          description="Manage completed work and saved app data."
          darkMode={darkMode}
          className={`${className} ${cardSurface}`}
        >
          <SettingsRow
            title="Archive"
            description={`${archiveCount} archived item${
              archiveCount === 1 ? "" : "s"
            } saved.`}
            darkMode={darkMode}
          >
            <button
              type="button"
              onClick={clearArchive}
              disabled={archiveCount === 0}
              className={`h-10 shrink-0 rounded-[9px] border px-4 text-[12px] font-[700] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                archiveCount === 0
                  ? "cursor-not-allowed opacity-30"
                  : darkMode
                  ? "border-white/[0.10] bg-white/[0.06] text-white/68 hover:bg-white/[0.10] hover:text-white focus-visible:ring-white focus-visible:ring-offset-[#171717]"
                  : "border-black/[0.07] bg-black/[0.035] text-[#555550] hover:bg-black/[0.065] hover:text-[#181818] focus-visible:ring-[#181818] focus-visible:ring-offset-white"
              }`}
            >
              Clear archive
            </button>
          </SettingsRow>

          <div className={`border-t ${divider}`} />

          <SettingsRow
            title="Reset Momentuhm"
            description="Delete active tasks, completed tasks, focus selections, and archived items."
            darkMode={darkMode}
          >
            <button
              type="button"
              onClick={resetAppData}
              className="h-10 shrink-0 rounded-[9px] border border-red-500/20 bg-red-500/[0.09] px-4 text-[12px] font-[700] text-red-500 transition hover:bg-red-500/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Reset data
            </button>
          </SettingsRow>
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  darkMode,
  className,
  children,
}: {
  title: string;
  description: string;
  darkMode: boolean;
  className: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[18px] border shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${className}`}
    >
      <div className="px-5 pb-4 pt-5 sm:px-6">
        <h2
          className={`text-[16px] font-[740] tracking-[-0.02em] ${
            darkMode ? "text-white" : "text-[#181818]"
          }`}
        >
          {title}
        </h2>

        <p
          className={`mt-1.5 text-[12px] font-[500] leading-5 ${
            darkMode ? "text-white/42" : "text-[#6F6F6A]"
          }`}
        >
          {description}
        </p>
      </div>

      <div className="space-y-0 px-5 pb-2 sm:px-6">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  title,
  description,
  darkMode,
  children,
}: {
  title: string;
  description: string;
  darkMode: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[82px] flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p
          className={`text-[13px] font-[700] ${
            darkMode ? "text-white" : "text-[#181818]"
          }`}
        >
          {title}
        </p>

        <p
          className={`mt-1 max-w-[560px] text-[11px] font-[500] leading-5 ${
            darkMode ? "text-white/44" : "text-[#6F6F6A]"
          }`}
        >
          {description}
        </p>
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  darkMode,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  darkMode: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        checked
          ? darkMode
            ? "bg-white focus-visible:ring-white focus-visible:ring-offset-[#171717]"
            : "bg-[#181818] focus-visible:ring-[#181818] focus-visible:ring-offset-white"
          : darkMode
          ? "bg-white/[0.16] focus-visible:ring-white focus-visible:ring-offset-[#171717]"
          : "bg-black/[0.14] focus-visible:ring-[#181818] focus-visible:ring-offset-white"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-5 w-5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.22)] transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        } ${
          checked
            ? darkMode
              ? "bg-[#181818]"
              : "bg-white"
            : darkMode
            ? "bg-white"
            : "bg-[#181818]"
        }`}
      />
    </button>
  );
}