"use client";

import type { ReactNode } from "react";
import {
  Archive,
  BriefcaseBusiness,
  ClipboardCheck,
  RotateCcw,
  Sparkles,
  Tags,
} from "lucide-react";

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
}: SettingsViewProps) {
  const pageText = darkMode ? "text-white" : "text-[#111827]";
  const mutedText = darkMode ? "text-white/46" : "text-[#667085]";
  const cardSurface = darkMode
    ? "border-white/[0.10] bg-[#15181E]"
    : "border-[#E3EAF3] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.045)]";
  const divider = darkMode ? "border-white/[0.08]" : "border-[#EDF1F6]";
  const inputClass = darkMode
    ? "border-white/[0.15] bg-white/[0.04] text-white placeholder:text-white/30 focus:border-blue-300/60 focus:ring-blue-300/10"
    : "border-[#D6DEE9] bg-[#FBFCFE] text-[#111827] placeholder:text-[#98A2B3] focus:border-[#0B6EFF] focus:bg-white focus:ring-[#0B6EFF]/10";

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <header className="mb-5">
        <p
          className={`text-[9px] font-[800] uppercase tracking-[0.17em] ${
            darkMode ? "text-blue-300" : "text-[#0B6EFF]"
          }`}
        >
          Personalize Momentuhm
        </p>
        <h1
          className={`mt-2 text-[29px] font-[790] leading-none tracking-[-0.052em] ${pageText}`}
        >
          Settings
        </h1>
        <p className={`mt-2.5 text-[12.5px] font-[500] ${mutedText}`}>
          Tune how Momentuhm helps, captures, and keeps your data.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <SettingsCard
          eyebrow="AI and capture"
          title="Task intelligence"
          description="Choose how much support Momentuhm gives while you plan."
          darkMode={darkMode}
          className={cardSurface}
        >
          <SettingsRow
            icon={<BriefcaseBusiness size={16} strokeWidth={1.8} />}
            title="Your role"
            description="Makes task reasoning and suggestions more relevant to your work."
            darkMode={darkMode}
          >
            <input
              value={userRole}
              onChange={(event) => setUserRole(event.target.value)}
              placeholder="Product Manager"
              aria-label="Your work role"
              className={`h-10 w-full rounded-[9px] border px-3.5 text-[12px] font-[620] outline-none ring-2 ring-transparent transition sm:w-[250px] ${inputClass}`}
            />
          </SettingsRow>

          <div className={`border-t ${divider}`} />

          <SettingsRow
            icon={<Sparkles size={16} strokeWidth={1.8} />}
            title="Suggested dates"
            description="Suggest a useful date when a task signals urgency or timing."
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
            icon={<Tags size={16} strokeWidth={1.8} />}
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
            icon={<ClipboardCheck size={16} strokeWidth={1.8} />}
            title="Clipboard Assist"
            description="Notice useful copied text and suggest actions when you return."
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
          eyebrow="Your data"
          title="Storage and reset"
          description="Keep completed work tidy or reset the app when needed."
          darkMode={darkMode}
          className={cardSurface}
        >
          <SettingsRow
            icon={<Archive size={16} strokeWidth={1.8} />}
            title="Archive"
            description={`${archiveCount} archived item${archiveCount === 1 ? "" : "s"} saved.`}
            darkMode={darkMode}
            stacked
          >
            <button
              type="button"
              onClick={clearArchive}
              disabled={archiveCount === 0}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-[9px] border px-4 text-[11px] font-[700] transition active:scale-[0.98] ${
                archiveCount === 0
                  ? "cursor-not-allowed opacity-30"
                  : darkMode
                  ? "border-white/[0.11] bg-white/[0.05] text-white/70 hover:bg-white/[0.09] hover:text-white"
                  : "border-[#DCE4EE] bg-white text-[#4F5B6B] hover:border-[#BFD0E7] hover:bg-[#F8FBFF] hover:text-[#0B6EFF]"
              }`}
            >
              <Archive size={14} strokeWidth={1.8} />
              Clear archive
            </button>
          </SettingsRow>

          <div className={`border-t ${divider}`} />

          <SettingsRow
            icon={<RotateCcw size={16} strokeWidth={1.8} />}
            title="Reset Momentuhm"
            description="Delete active tasks, completions, focus selections, archive, and learned planning history."
            darkMode={darkMode}
            stacked
          >
            <button
              type="button"
              onClick={resetAppData}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] border border-red-200 bg-red-50 px-4 text-[11px] font-[700] text-red-600 transition hover:border-red-300 hover:bg-red-100 active:scale-[0.98] dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
            >
              <RotateCcw size={14} strokeWidth={1.8} />
              Reset data
            </button>
          </SettingsRow>
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({
  eyebrow,
  title,
  description,
  darkMode,
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  darkMode: boolean;
  className: string;
  children: ReactNode;
}) {
  return (
    <section className={`overflow-hidden rounded-[16px] border ${className}`}>
      <div
        className={`border-b px-5 pb-4 pt-5 sm:px-6 ${
          darkMode
            ? "border-white/[0.08] bg-white/[0.018]"
            : "border-[#EDF1F6] bg-[linear-gradient(135deg,#FFFFFF,#F8FBFF)]"
        }`}
      >
        <p
          className={`text-[8.5px] font-[800] uppercase tracking-[0.16em] ${
            darkMode ? "text-blue-300" : "text-[#0B6EFF]"
          }`}
        >
          {eyebrow}
        </p>
        <h2
          className={`mt-1.5 text-[17px] font-[760] tracking-[-0.03em] ${
            darkMode ? "text-white" : "text-[#111827]"
          }`}
        >
          {title}
        </h2>
        <p
          className={`mt-1 text-[11px] font-[500] leading-5 ${
            darkMode ? "text-white/42" : "text-[#667085]"
          }`}
        >
          {description}
        </p>
      </div>

      <div className="px-5 sm:px-6">{children}</div>
    </section>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  darkMode,
  children,
  stacked = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  darkMode: boolean;
  children: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[82px] gap-3 py-4 ${
        stacked
          ? "flex-col items-start"
          : "flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border ${
            darkMode
              ? "border-blue-300/15 bg-blue-400/10 text-blue-200"
              : "border-blue-100 bg-blue-50 text-[#0B6EFF]"
          }`}
        >
          {icon}
        </span>

        <div className="min-w-0">
          <p
            className={`text-[12.5px] font-[700] ${
              darkMode ? "text-white" : "text-[#111827]"
            }`}
          >
            {title}
          </p>
          <p
            className={`mt-1 max-w-[560px] text-[10.5px] font-[500] leading-[18px] ${
              darkMode ? "text-white/44" : "text-[#667085]"
            }`}
          >
            {description}
          </p>
        </div>
      </div>

      <div className={stacked ? "pl-11" : "shrink-0"}>{children}</div>
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
      className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6EFF] focus-visible:ring-offset-2 ${
        checked
          ? "bg-[#0B6EFF]"
          : darkMode
          ? "bg-white/[0.15]"
          : "bg-[#D8DFE9]"
      } ${darkMode ? "focus-visible:ring-offset-[#15181E]" : "focus-visible:ring-offset-white"}`}
    >
      <span
        aria-hidden="true"
        className={`h-5 w-5 rounded-full bg-white shadow-[0_2px_5px_rgba(15,23,42,0.25)] transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
