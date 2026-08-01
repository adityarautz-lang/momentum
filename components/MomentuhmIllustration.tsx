"use client";

export type MomentuhmIllustrationName =
  | "focus-target"
  | "task-checklist"
  | "backlog-box"
  | "inbox-tray"
  | "upcoming-calendar"
  | "archive-drawer"
  | "completed-mountain"
  | "progress-trophy"
  | "clipboard-extraction"
  | "ai-suggestions"
  | "insights-chart"
  | "momentum-landscape"
  | "categories-cards"
  | "reviewed-check"
  | "reminder-clock"
  | "conflict-alert";

type MomentuhmIllustrationProps = {
  name: MomentuhmIllustrationName;
  className?: string;
  priority?: boolean;
};

export default function MomentuhmIllustration({
  name,
  className = "",
  priority = false,
}: MomentuhmIllustrationProps) {
  return (
    <img
      src={`/illustrations/${name}.png`}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`block select-none object-contain ${className}`}
    />
  );
}
