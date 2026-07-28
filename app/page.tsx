"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Inter } from "next/font/google";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "@/components/Sidebar";
import SettingsView from "@/components/SettingsView";
import Toast from "@/components/Toast";
import FirecrackerLayer from "@/components/Firecracker";

import type {
  Category,
  Firecracker,
  Priority,
} from "@/types";

import {
  loadState,
  saveState,
} from "@/utils/storage";

type LoadedStateResult = {
  state: any;
  revision: number;
};

const normalizeLoadedState = (
  saved: any
): LoadedStateResult | null => {
  if (!saved) {
    return null;
  }

  if (
    typeof saved === "object" &&
    saved !== null &&
    "state" in saved
  ) {
    return {
      state: saved.state,
      revision: Number.isFinite(
        Number(saved.revision)
      )
        ? Number(saved.revision)
        : 0,
    };
  }

  return {
    state: saved,
    revision: 0,
  };
};

import {
  useMomentuhmMemory,
} from "@/hooks/useMomentuhmMemory";

import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock3,
  Flame,
  LayoutGrid,
  Lightbulb,
  List,
ListChecks,
  Moon,
  Plus,
  Send,
  Sparkles,
Star,
Sun,
Sunrise,
Sunset,
Target,
  Trash2,
  TrendingUp,
Eye,
ChevronDown,
ChevronRight,
Check,
X,
PencilLine,
RotateCcw,
MoreVertical,
Play,
Settings2,
HelpCircle,
} from "lucide-react";


type TaskTag = "follow-up";

type TaskStatus =
| "Not started"
| "In progress"
| "Waiting"
| "Done";

const normalizeTaskStatus = (
status: unknown
): TaskStatus => {
const value = String(status || "")
  .trim()
  .toLowerCase();

if (
  value === "done" ||
  value === "complete" ||
  value === "completed"
) {
  return "Done";
}

if (
  value === "waiting" ||
  value === "paused" ||
  value === "someday"
) {
  return "Waiting";
}

if (
  value === "in progress" ||
  value === "in-progress" ||
  value === "started"
) {
  return "In progress";
}

/*
 * Existing tasks used "Active" as their default value.
 * Treat those legacy tasks as Not started.
 */
return "Not started";
};

const getTaskStatusLabel = (
status: unknown
) => {
const normalizedStatus =
  normalizeTaskStatus(status);

if (normalizedStatus === "Waiting") {
  return "Paused";
}

return normalizedStatus;
};

/*
* Completion and status are separate.
* When a completed task is restored, return it to the
* exact status it had before completion.
*/
const getRestorableTaskStatus = (
status: unknown
): TaskStatus => {
if (
  typeof status !== "string" ||
  !status.trim()
) {
  return "Not started";
}

return normalizeTaskStatus(status);
};

type SortMode = "date" | "priority";
type GroupMode = "none" | "category" | "priority" | "date";
type MobileGroupMode = "category" | "priority" | "date";

const MOBILE_GROUP_MODE_KEY = "Momentuhm-mobile-group-mode";

const DEFAULT_THEME_COLOR = "#1F2937";

type Subtask = {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
};

const getTaskSubtasks = (task: any): Subtask[] => {
  return Array.isArray(task.subtasks) ? task.subtasks : [];
};

const getSubtaskProgress = (task: any) => {
  const subtasks = getTaskSubtasks(task);
  const total = subtasks.length;
  const completed = subtasks.filter((subtask) => subtask.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    subtasks,
    total,
    completed,
    percent,
    hasSubtasks: total > 0,
    allComplete: total > 0 && completed === total,
  };
};

type ExtractedTaskSuggestion = {
  id: string;
  selected: boolean;
  title: string;
  priority: Priority;
  suggestedDueDate: string | null;
  category: string;
  notes: string;
  status: TaskStatus;
  reason: string;
  confidence: number;
  tags: TaskTag[];
};

type TutorialStepDefinition = {
  id:
    | "welcome"
    | "smart-assist"
    | "clipboard"
    | "extract"
    | "focus"
    | "daily-intelligence"
    | "control"
    | "insights"
    | "help";

  eyebrow: string;
  title: string;
  description: string;
  desktopSelector?: string;
  mobileSelector?: string;
};

type TutorialSpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TUTORIAL_SMART_TASK =
  "Prepare the quarterly client review";

const TUTORIAL_CLIPBOARD_TEXT =
  "Please send the revised budget by Thursday, book the vendor review, and follow up with Maya next week.";

const TUTORIAL_CLIPBOARD_TASKS = [
  {
    title: "Send the revised budget",
    meta: "High · Thursday · Major Projects",
  },
  {
    title: "Book the vendor review",
    meta: "Medium · Tomorrow · Sustaining",
  },
  {
    title: "Follow up with Maya",
    meta: "Medium · Next week · Follow-up",
  },
];

const TUTORIAL_EXTRACT_SOURCE_LINES = [
  "Finance needs the final estimate",
  "Schedule the design review",
  "Confirm the launch owner",
];

const TUTORIAL_EXTRACTED_TASKS = [
  {
    title: "Send the final estimate to Finance",
    meta: "High · Tomorrow",
  },
  {
    title: "Schedule the design review",
    meta: "Medium · Major Projects",
  },
  {
    title: "Confirm the launch owner",
    meta: "High · Follow-up",
  },
];

const TUTORIAL_FOCUS_TASKS = [
  {
    title: "Send revised client budget",
    reason: "Deadline and external dependency",
  },
  {
    title: "Review launch risks",
    reason: "Could block the release",
  },
  {
    title: "Book vendor review",
    reason:
      "Depends on another person’s availability",
  },
];

const TUTORIAL_CONTROL_FIELDS = [
  {
    label: "Priority",
    value: "High",
  },
  {
    label: "Due date",
    value: "Tomorrow",
  },
  {
    label: "Category",
    value: "Major Projects",
  },
  {
    label: "Why it matters",
    value: "Client decision dependency",
  },
  {
    label: "Focus",
    value: "Included",
  },
];

/*
 * Fixed preview data used only inside the tutorial.
 *
 * It lets new users understand Insights before they
 * have completed enough real work to unlock analytics.
 */
const TUTORIAL_INSIGHT_METRICS = [
  {
    label: "Total closed",
    value: "42",
  },
  {
    label: "Last 7 days",
    value: "11",
  },
  {
    label: "Average per day",
    value: "1.6",
  },
  {
    label: "Current streak",
    value: "4 days",
  },
];

const TUTORIAL_INSIGHT_CATEGORIES = [
  {
    label: "Planning & Prioritization",
    percentage: 26,
  },
  {
    label: "Product / Project Delivery",
    percentage: 22,
  },
  {
    label: "Communication & Follow-ups",
    percentage: 18,
  },
  {
    label: "Meetings & Team Rituals",
    percentage: 14,
  },
  {
    label: "Admin & Reporting",
    percentage: 9,
  },
  {
    label: "Personal Admin",
    percentage: 6,
  },
  {
    label: "Finance & Compliance",
    percentage: 5,
  },
];

const TUTORIAL_INSIGHT_RHYTHM = [
  {
    label: "6AM",
    height: 18,
  },
  {
    label: "9AM",
    height: 68,
  },
  {
    label: "12PM",
    height: 46,
  },
  {
    label: "3PM",
    height: 34,
  },
  {
    label: "6PM",
    height: 25,
  },
  {
    label: "9PM",
    height: 12,
  },
];

const QUICK_TUTORIAL_STEPS:
  TutorialStepDefinition[] = [
    {
      id: "welcome",
      eyebrow: "Welcome to Momentuhm",
      title: "See how Momentuhm helps",
      description:
        "This quick walkthrough demonstrates how Momentuhm turns everyday work into clear, prioritized next actions.",
    },
    {
      id: "smart-assist",
      eyebrow: "AI task assistance",
      title:
        "Add one task. Get useful structure.",
      description:
        "Momentuhm can suggest priority, timing, category, context, and why the task deserves attention.",
      desktopSelector:
        "#momentuhm-tour-capture-desktop",
      mobileSelector:
        "#mobile-quick-capture",
    },
    {
      id: "clipboard",
      eyebrow: "Clipboard Assist",
      title:
        "Copied text becomes actionable work",
      description:
        "When copied content contains useful actions, Momentuhm can separate it into structured tasks for review.",
    },
    {
      id: "extract",
      eyebrow: "Extract from text",
      title: "Turn notes into a task list",
      description:
        "Paste an email, message, or meeting note and review the actions Momentuhm identifies before adding them.",
      desktopSelector:
        "#momentuhm-tour-capture-desktop",
      mobileSelector:
        "#mobile-quick-capture",
    },
    {
      id: "focus",
      eyebrow: "AI Focus",
      title: "Find the strongest next moves",
      description:
        "Momentuhm considers urgency, impact, dependencies, and timing when building a suggested Focus stack.",
      desktopSelector:
        "#momentuhm-tour-focus-desktop",
      mobileSelector:
        "#momentuhm-tour-focus-mobile",
    },
    {
      id: "daily-intelligence",
      eyebrow: "Daily intelligence",
      title: "Understand your day quickly",
      description:
        "Morning guidance, progress insights, completion metrics, and time awareness help you decide what to do next.",
      desktopSelector:
        "#momentuhm-tour-progress-desktop",
      mobileSelector:
        "#momentuhm-tour-progress-mobile",
    },
    {
      id: "control",
      eyebrow: "You remain in control",
      title: "Every suggestion stays editable",
      description:
        "AI prepares a useful first draft. You can change the priority, date, category, reasoning, Focus placement, or any other detail.",
      desktopSelector:
        "#Momentuhm-task-list-anchor",
      mobileSelector:
        "#Momentuhm-mobile-task-list-anchor",
    },
    {
      id: "insights",
      eyebrow: "Insights",
      title:
        "See what your completed work reveals",
      description:
        "Momentuhm turns completed work into useful patterns across categories, task types, productivity timing, and momentum. This preview uses sample data.",
    },
    {
      id: "help",
      eyebrow: "You are ready",
      title: "Return to this tour anytime",
      description:
        "Select How it works whenever you want to revisit Momentuhm’s task assistance, Focus tools, daily guidance, and Insights.",
      desktopSelector:
        "#momentuhm-tour-help-button",
      mobileSelector:
        "#momentuhm-tour-help-button",
    },
  ];

/* ------------------------------------------------ */
/* Font */
/* ------------------------------------------------ */

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const textStyles = {
  pageTitle: "text-[22px] leading-[28px] font-[800]",
  sectionTitle: "text-[18px] leading-[24px] font-[800]",
  taskTitle: "text-[12px] leading-[18px] font-[800]",
  body: "text-[13px] leading-[18px] font-[650]",
  small: "text-[12px] leading-[16px] font-[600]",
  meta: "text-[11px] leading-[14px] font-[700]",
  badge: "text-[10px] leading-none font-[900] uppercase tracking-[0.14em]",
  button: "text-[12px] leading-none font-[800]",
  whyText: "text-[12px] leading-5 font-[500]",
} as const;


/* ------------------------------------------------ */
/* Initial Data */
/* ------------------------------------------------ */

const createInitialCategories = (): Category[] => [
  {
    id: crypto.randomUUID(),
    title: "Planning & Prioritization",
    tasks: [],
  },
  {
    id: crypto.randomUUID(),
    title: "Meetings & Team Rituals",
    tasks: [],
  },
  {
    id: crypto.randomUUID(),
    title: "Communication & Follow-ups",
    tasks: [],
  },
  {
    id: crypto.randomUUID(),
    title: "Product / Project Delivery",
    tasks: [],
  },
  {
    id: crypto.randomUUID(),
    title: "Admin & Reporting",
    tasks: [],
  },
  {
    id: crypto.randomUUID(),
    title: "Personal Admin",
    tasks: [],
  },
  {
    id: crypto.randomUUID(),
    title: "Finance & Compliance",
    tasks: [],
  },
];

/* ------------------------------------------------ */
/* Helper Functions */
/* ------------------------------------------------ */

const getLocalDateKey = (
  value: Date | string
) => {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayDate = () => {
  return getLocalDateKey(
    new Date()
  );
};

const isCompletedToday = (
  task: any
) => {
  if (!task?.completedAt) {
    return false;
  }

  return (
    getLocalDateKey(
      task.completedAt
    ) === getTodayDate()
  );
};

const getCompletedTodayFromCategories = (
  categories: Category[]
) => {
  return categories
    .flatMap((category) =>
      category.tasks.map((task: any) => ({
        ...task,
        category: category.title,
      }))
    )
    .filter(
      (task: any) =>
        Boolean(task.completed) &&
        isCompletedToday(task)
    )
    .sort(
      (taskA: any, taskB: any) =>
        new Date(
          taskB.completedAt || 0
        ).getTime() -
        new Date(
          taskA.completedAt || 0
        ).getTime()
    );
};

const getTomorrowDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getNextWeekDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const addDaysToDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDueDate = (dueDate?: string) => {
  if (!dueDate) return "";

  return new Date(`${dueDate}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const formatDueDateParts = (dueDate?: string) => {
  if (!dueDate) {
    return {
      day: "",
      month: "",
    };
  }

  const date = new Date(`${dueDate}T00:00:00`);

  return {
    day: date.toLocaleDateString(undefined, {
      day: "2-digit",
    }),
    month: date.toLocaleDateString(undefined, {
      month: "short",
    }),
  };
};

const formatDateLong = () => {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

const formatSingleLineInsight = (message: string) => {
  const cleaned = String(message || "")
    .replace(/\s+/g, " ")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim();

  if (!cleaned) return "";

  const shortened = cleaned
    .split(/\s+/)
    .slice(0, 6)
    .join(" ")
    .replace(/[,:;–—-]+$/, "");

  return /[.!?]$/.test(shortened)
    ? shortened
    : `${shortened}.`;
};

const getAccessibleTextColor = (hexColor: string) => {
  const normalized = hexColor.replace("#", "").trim();

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return "#FFFFFF";
  }

  const channels = [0, 2, 4].map(
    (index) =>
      parseInt(normalized.slice(index, index + 2), 16) / 255
  );

  const linearChannels = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4)
  );

  const luminance =
    0.2126 * linearChannels[0] +
    0.7152 * linearChannels[1] +
    0.0722 * linearChannels[2];

  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / 0.05;

  return whiteContrast >= darkContrast
    ? "#FFFFFF"
    : "#111111";
};


const normalizeDayEndTime = (value: unknown) => {
  const candidate =
    typeof value === "string" ? value.trim() : "";

  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(candidate)
    ? candidate
    : "18:00";
};

const getTimeRemainingInDay = (
  dayEndTime: string,
  now: Date
) => {
  const normalizedEndTime = normalizeDayEndTime(dayEndTime);

  const [hours, minutes] = normalizedEndTime
    .split(":")
    .map(Number);

  const endTime = new Date(now);
  endTime.setHours(hours, minutes, 0, 0);

  const difference = endTime.getTime() - now.getTime();

  if (difference <= 0) {
    return {
      label: "Day ended",
      shortLabel: "0h 0m",
      minutesLeft: 0,
      percentLeft: 0,
      isOver: true,
    };
  }

  const totalMinutes = Math.ceil(
    difference / (1000 * 60)
  );

  const hoursLeft = Math.floor(totalMinutes / 60);
  const minutesLeft = totalMinutes % 60;

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const totalDayDuration = Math.max(
    1,
    endTime.getTime() - startOfDay.getTime()
  );

  const percentLeft = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (difference / totalDayDuration) * 100
      )
    )
  );

  return {
    label: `${hoursLeft}h ${minutesLeft}m left`,
    shortLabel: `${hoursLeft}h ${minutesLeft}m`,
    minutesLeft: totalMinutes,
    percentLeft,
    isOver: false,
  };
};

const getTaskDate = (task: any) => {
  return task.dueDate || task.suggestedDueDate || "";
};

const isToday = (date?: string) => {
  return date === getTodayDate();
};

const isTomorrow = (date?: string) => {
  return date === getTomorrowDate();
};

const isLater = (date?: string) => {
  if (!date) return false;

  return date > getTomorrowDate();
};

const isOverdue = (date?: string) => {
  if (!date) return false;

  return date < getTodayDate();
};

const getOverdueDays = (date?: string) => {
  if (!date) return 0;

  const today = new Date(`${getTodayDate()}T00:00:00`);
  const due = new Date(`${date}T00:00:00`);

  return Math.max(
    0,
    Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  );
};

const textIncludesAny = (text: string, words: string[]) => {
  return words.some((word) => text.includes(word));
};

const inferPriority = (title: string): Priority => {
  const text = title.toLowerCase();

  const highPriorityWords = [
    "passport",
    "expense",
    "submit",
    "deadline",
    "urgent",
    "pay",
    "renew",
    "client",
    "appointment",
    "insurance",
    "tax",
    "visa",
    "report",
    "application",
    "book",
    "call",
  ];

  const mediumPriorityWords = [
    "review",
    "prepare",
    "update",
    "email",
    "schedule",
    "follow up",
    "clean",
    "organize",
    "plan",
  ];

  if (highPriorityWords.some((word) => text.includes(word))) {
    return "High";
  }

  if (mediumPriorityWords.some((word) => text.includes(word))) {
    return "Medium";
  }

  return "Low";
};

const suggestDueDate = (title: string) => {
  const text = title.toLowerCase();

  const todayWords = [
    "today",
    "tonight",
    "this morning",
    "this afternoon",
    "this evening",
    "end of day",
    "eod",
    "asap",
    "right away",
    "immediately",
    "now",
  ];

  const tomorrowWords = ["tomorrow", "tmrw", "next day"];

  const thisWeekWords = [
    "this week",
    "by friday",
    "before friday",
    "end of week",
    "eow",
    "this weekend",
    "weekend",
  ];

  const nextWeekWords = [
    "next week",
    "next monday",
    "next tuesday",
    "next wednesday",
    "next thursday",
    "next friday",
    "following week",
  ];

  const urgentAdminWords = [
    "submit",
    "send",
    "file",
    "apply",
    "application",
    "form",
    "paperwork",
    "document",
    "documents",
    "upload",
    "verify",
    "verification",
    "confirm",
    "confirmation",
    "register",
    "registration",
    "renew",
    "renewal",
    "passport",
    "visa",
    "license",
    "permit",
    "insurance",
    "claim",
    "tax",
    "taxes",
    "irs",
    "bank",
    "loan",
    "mortgage",
    "rent",
    "lease",
    "bill",
    "invoice",
    "payment",
    "pay",
    "fee",
    "fine",
    "ticket",
  ];

  const appointmentWords = [
    "appointment",
    "schedule",
    "book",
    "booking",
    "reservation",
    "reserve",
    "doctor",
    "dentist",
    "therapy",
    "therapist",
    "clinic",
    "hospital",
    "mechanic",
    "service",
    "repair",
    "call",
    "meeting",
    "interview",
    "consultation",
  ];

  const communicationWords = [
    "email",
    "reply",
    "respond",
    "follow up",
    "follow-up",
    "message",
    "text",
    "call back",
    "reach out",
    "ping",
    "remind",
    "ask",
    "confirm with",
    "check with",
  ];

  const shoppingErrandWords = [
    "buy",
    "purchase",
    "order",
    "pick up",
    "pickup",
    "drop off",
    "return",
    "exchange",
    "ship",
    "mail",
    "post",
    "grocery",
    "groceries",
    "medicine",
    "prescription",
    "gift",
    "birthday",
    "anniversary",
  ];

  const planningWords = [
    "plan",
    "prepare",
    "review",
    "organize",
    "outline",
    "draft",
    "research",
    "compare",
    "decide",
    "brainstorm",
    "estimate",
  ];

  const lowUrgencyWords = [
    "someday",
    "maybe",
    "eventually",
    "whenever",
    "later",
    "read",
    "watch",
    "learn",
    "explore",
    "ideas",
  ];

  if (textIncludesAny(text, todayWords)) return getTodayDate();
  if (textIncludesAny(text, tomorrowWords)) return getTomorrowDate();
  if (textIncludesAny(text, thisWeekWords)) return addDaysToDate(3);
  if (textIncludesAny(text, nextWeekWords)) return getNextWeekDate();
  if (textIncludesAny(text, urgentAdminWords)) return getTomorrowDate();
  if (textIncludesAny(text, appointmentWords)) return getTomorrowDate();
  if (textIncludesAny(text, communicationWords)) return getTomorrowDate();
  if (textIncludesAny(text, shoppingErrandWords)) return addDaysToDate(2);
  if (textIncludesAny(text, planningWords)) return addDaysToDate(3);
  if (textIncludesAny(text, lowUrgencyWords)) return undefined;

  return undefined;
};

const getAppSuggestionReason = (title: string, priority: Priority) => {
  const text = title.toLowerCase();

  if (
    textIncludesAny(text, [
      "passport",
      "visa",
      "application",
      "license",
      "permit",
      "registration",
      "renew",
      "renewal",
      "document",
      "paperwork",
      "form",
    ])
  ) {
    return "This looks like an admin or official task, so Momentuhm suggests handling it soon.";
  }

  if (
    textIncludesAny(text, [
      "expense",
      "submit",
      "send",
      "report",
      "invoice",
      "payment",
      "pay",
      "bill",
      "tax",
      "claim",
      "insurance",
    ])
  ) {
    return "This sounds time-sensitive or submission-based, so Momentuhm moved it higher.";
  }

  if (
    textIncludesAny(text, [
      "appointment",
      "book",
      "schedule",
      "reservation",
      "doctor",
      "dentist",
      "meeting",
      "interview",
      "call",
    ])
  ) {
    return "This may depend on another person or available slots, so Momentuhm suggests doing it early.";
  }

  if (
    textIncludesAny(text, [
      "email",
      "reply",
      "respond",
      "follow up",
      "message",
      "confirm",
      "check with",
      "ask",
    ])
  ) {
    return "This involves communication with someone else, so Momentuhm suggests not leaving it open too long.";
  }

  if (
    textIncludesAny(text, [
      "buy",
      "purchase",
      "order",
      "pick up",
      "return",
      "gift",
      "grocery",
      "medicine",
    ])
  ) {
    return "This looks like an errand or purchase, so Momentuhm suggests scheduling it soon.";
  }

  if (priority === "High") {
    return "This was classified as high priority, so Momentuhm kept it near the top.";
  }

  if (priority === "Medium") {
    return "This looks useful but not immediately critical.";
  }

  return "This looks less urgent, so Momentuhm placed it lower for now.";
};

const scoreTask = (task: any) => {
  let score = 0;

  const title = String(task.title || "").toLowerCase();
  const whyThisMatters = String(task.whyThisMatters || "").toLowerCase();
  const combinedText = `${title} ${whyThisMatters}`;

  const urgentWords = [
    "submit",
    "apply",
    "deadline",
    "due",
    "pay",
    "renew",
    "send",
    "report",
    "expense",
    "passport",
    "appointment",
    "insurance",
    "book",
    "client",
    "tax",
    "visa",
  ];

  const impactWords = [
    "approval",
    "budget",
    "revenue",
    "launch",
    "release",
    "blocked",
    "blocking",
    "manager",
    "client",
    "customer",
    "stakeholder",
    "career",
    "interview",
    "promotion",
    "risk",
    "legal",
    "health",
    "family",
    "money",
    "dependency",
    "deadline",
    "quarterly",
  ];

  const lowValueWords = [
    "clean",
    "organize",
    "watch",
    "read",
    "maybe",
    "someday",
  ];

  urgentWords.forEach((word) => {
    if (title.includes(word)) score += 10;
  });

  impactWords.forEach((word) => {
    if (whyThisMatters.includes(word)) score += 12;
  });

  lowValueWords.forEach((word) => {
    if (combinedText.includes(word)) score -= 3;
  });

  if (whyThisMatters.trim()) score += 8;

  if (task.priority === "High") score += 25;
  if (task.priority === "Medium") score += 12;
  if (task.priority === "Low") score += 3;
  if (task.dueDate) score += 18;
  if (task.suggestedDueDate) score += 10;

  return score;
};
const getPriorityClass = (_priority: Priority) => {
  return "border border-[#E7E7E3] bg-[#F7F7F5] text-[#666661] dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/55";
};

const getPriorityRowClass = (priority: Priority, darkMode: boolean) => {
  if (darkMode) {
    return "bg-[#1a1a1a] hover:bg-[#222222]";
  }

  return "bg-white hover:bg-[#f6f8f8]";
};

const normalizeTaskTags = (tags: any): TaskTag[] => {
  if (!Array.isArray(tags)) return [];

  return tags.filter((tag) => tag === "follow-up");
};

const hasFollowUpTag = (task: any) => {
  return Array.isArray(task.tags) && task.tags.includes("follow-up");
};

const MIN_CLIPBOARD_ASSIST_LENGTH = 35;
const MAX_CLIPBOARD_ASSIST_LENGTH = 8000;
const CLIPBOARD_HANDLED_KEY = "Momentuhm-last-handled-clipboard-text";

/**
 * Temporary testing flag.
 * false prevents clipboard reads and automatic AI extraction requests.
 */
const CLIPBOARD_ASSIST_ENABLED_FOR_TESTING = true;

const normalizeClipboardText = (text: string) => {
  return text.replace(/\s+/g, " ").trim();
};

const isUsefulClipboardText = (text: string) => {
  const normalizedText = normalizeClipboardText(text);

  if (normalizedText.length < MIN_CLIPBOARD_ASSIST_LENGTH) return false;
  if (normalizedText.length > 50000) return false;
  if (normalizedText.split(/\s+/).length < 5) return false;
  if (/^\d{4,8}$/.test(normalizedText)) return false;
  if (/^(https?:\/\/|www\.)\S+$/i.test(normalizedText)) return false;

  return true;
};

const prepareClipboardTextForExtraction = (text: string) => {
  return text.trim().slice(0, MAX_CLIPBOARD_ASSIST_LENGTH);
};

const getClipboardTaskTitle = (text: string) => {
  const normalizedText = normalizeClipboardText(text);
  const firstUsefulLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  const preferredTitle = firstUsefulLine || normalizedText || "Copied item";

  if (preferredTitle.length <= 140) return preferredTitle;

  return `${preferredTitle.slice(0, 137).trim()}...`;
};

function FollowUpTag({ darkMode }: { darkMode: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${textStyles.badge} ${
        darkMode
          ? "border-amber-300/15 bg-amber-300/[0.08] text-amber-200/80"
          : "border-amber-500/15 bg-amber-500/[0.07] text-amber-700"
      }`}
    >
      <span className="text-[11px] leading-none">↗</span>
      Follow-up
    </span>
  );
}


/* ------------------------------------------------ */
/* Component */
/* ------------------------------------------------ */

export default function Home() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [categories, setCategories] =
  useState<Category[]>([]);

const categoriesRef =
  useRef<Category[]>([]);

useEffect(() => {
  categoriesRef.current =
    categories;
}, [categories]);

const [archive, setArchive] =
  useState<any[]>([]);

/*
* Insights history is intentionally separate from Archive.
*
* Clearing the visible Archive list will not erase historical
* completion patterns, charts, streaks, or AI insights.
*/
const [insightsHistory, setInsightsHistory] =
useState<any[]>([]);

const [completedToday, setCompletedToday] =
useState<any[]>([]);
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [darkMode, setDarkMode] = useState(false);
const [selectedView, setSelectedView] = useState("today");
const [todayTaskSortMode, setTodayTaskSortMode] =
  useState<SortMode>("date");
const [todayTaskGroupMode, setTodayTaskGroupMode] = useState<GroupMode>("none");
const [priorityViewMode, setPriorityViewMode] =
  useState<"cards" | "list">("list");
  const [upcomingViewMode, setUpcomingViewMode] = useState<
    "calendar" | "list"
  >("calendar");
  const [enableAppSuggestions, setEnableAppSuggestions] = useState(true);
  const [enableAutoPriority, setEnableAutoPriority] = useState(true);
const [enableClipboardAssist, setEnableClipboardAssist] = useState(true);
const [clipboardCandidate, setClipboardCandidate] = useState("");
const [showClipboardPrompt, setShowClipboardPrompt] = useState(false);
const [clipboardExtractLoading, setClipboardExtractLoading] = useState(false);
const [clipboardExtractError, setClipboardExtractError] = useState("");
const [clipboardExtractedTasks, setClipboardExtractedTasks] = useState<
  ExtractedTaskSuggestion[]
>([]);
const [archiveToast, setArchiveToast] = useState("");

const [
  showRevisionConflictModal,
  setShowRevisionConflictModal,
] = useState(false);

const [firecrackers, setFirecrackers] = useState<Firecracker[]>([]);

  const [newTask, setNewTask] = useState("");
const [newlyAddedTaskIds, setNewlyAddedTaskIds] = useState<string[]>([]);
const [newTaskWhy, setNewTaskWhy] = useState("");
const [newCategory, setNewCategory] = useState("");
const [selectedCategory, setSelectedCategory] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategoryTitle, setEditingCategoryTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] =
    useState(false);
const [showDueReminderPopup, setShowDueReminderPopup] = useState(false);
const [extractInput, setExtractInput] = useState("");
const [extractLoading, setExtractLoading] = useState(false);
const [extractError, setExtractError] = useState("");
const [extractedTasks, setExtractedTasks] = useState<ExtractedTaskSuggestion[]>(
  []
);
const [suggestingTaskIds, setSuggestingTaskIds] = useState<string[]>([]);
const [boostMessage, setBoostMessage] = useState("");
const [boostLoading, setBoostLoading] = useState(false);
const [lastBoostTaskKey, setLastBoostTaskKey] = useState("");

const [dayEndTime, setDayEndTime] = useState("18:00");
const [userRole, setUserRole] = useState("");
const [currentTime, setCurrentTime] = useState(new Date());
const [
  manualFocusTaskIds,
  setManualFocusTaskIds,
] = useState<string[]>([]);

const {
  planningEvents,
  userPlanningProfile,
  recordPlanningEvent,
  loadMemory,
  forgetTaskMemory,
  resetMemory,
} = useMomentuhmMemory();





const [isLoaded, setIsLoaded] =
  useState(false);

const [
  isRefreshingStatus,
  setIsRefreshingStatus,
] = useState(false);

/*
* Prevents state loaded from the server from immediately
* being written back to the server.
*/
const skipNextPersistRef =
useRef(false);

/*
* Prevents multiple refresh requests from running together.
*/
const refreshInFlightRef =
useRef(false);

/*
* Indicates that a local change is waiting to be saved.
*
* While this is true, automatic remote refreshes are skipped
* so they cannot overwrite the user's newest local change.
*/
const localChangesPendingRef =
useRef(false);

/*
* Indicates that a save request is currently running.
*/
const saveInFlightRef =
useRef(false);

/*
* Identifies the newest local state change.
* An older save must not mark a newer change as synced.
*/
const localChangeVersionRef =
useRef(0);

/*
* Stores the current debounce timer so refresh logic can
* determine whether a local save is still pending.
*/
const saveTimerRef =
useRef<number | null>(null);

/*
* Used only for diagnostics and future sync indicators.
*/
const lastSuccessfulSaveRef =
useRef<string | null>(null);

/*
 * The revision of the state currently loaded from the server.
 *
 * Every successful server save returns a newer revision.
 * A save is rejected when another device has already changed
 * the server state since this browser last loaded it.
 */
const serverRevisionRef =
  useRef(0);

/*
 * A newer server revision was detected.
 *
 * Silent refreshes remain blocked so local changes do not
 * suddenly disappear. A manual refresh is still allowed.
 */
const revisionConflictRef =
  useRef(false);

/*
* Mark a local mutation immediately.
*
* Waiting for the persistence useEffect is too late because
* a focus or visibility refresh can happen before that effect
* runs and restore older server state.
*/
const markLocalChangesPending = () => {
localChangesPendingRef.current = true;
};

/*
* Applies a persisted local-state update only when the
* resolved value is actually different.
*
* Remote loads and full resets continue to use the raw
* React setters so they are not treated as user mutations.
*/
function applyPersistedStateUpdate<T>(
setter: React.Dispatch<React.SetStateAction<T>>,
nextValue: React.SetStateAction<T>
) {
setter((previousValue) => {
  const resolvedValue =
    typeof nextValue === "function"
      ? (nextValue as (previousValue: T) => T)(previousValue)
      : nextValue;

  if (Object.is(resolvedValue, previousValue)) {
    return previousValue;
  }

  markLocalChangesPending();

  return resolvedValue;
});
}

const updateDarkMode: React.Dispatch<
React.SetStateAction<boolean>
> = (nextValue) => {
applyPersistedStateUpdate(
  setDarkMode,
  nextValue
);
};

const updateTodayTaskSortMode: React.Dispatch<
React.SetStateAction<SortMode>
> = (nextValue) => {
applyPersistedStateUpdate(
  setTodayTaskSortMode,
  nextValue
);
};

const updateTodayTaskGroupMode: React.Dispatch<
React.SetStateAction<GroupMode>
> = (nextValue) => {
applyPersistedStateUpdate(
  setTodayTaskGroupMode,
  nextValue
);
};

const updatePriorityViewMode: React.Dispatch<
React.SetStateAction<"cards" | "list">
> = (nextValue) => {
applyPersistedStateUpdate(
  setPriorityViewMode,
  nextValue
);
};

const updateUpcomingViewMode: React.Dispatch<
React.SetStateAction<"calendar" | "list">
> = (nextValue) => {
applyPersistedStateUpdate(
  setUpcomingViewMode,
  nextValue
);
};

const updateEnableAppSuggestions: React.Dispatch<
React.SetStateAction<boolean>
> = (nextValue) => {
applyPersistedStateUpdate(
  setEnableAppSuggestions,
  nextValue
);
};

const updateEnableAutoPriority: React.Dispatch<
React.SetStateAction<boolean>
> = (nextValue) => {
applyPersistedStateUpdate(
  setEnableAutoPriority,
  nextValue
);
};

const updateEnableClipboardAssist: React.Dispatch<
React.SetStateAction<boolean>
> = (nextValue) => {
applyPersistedStateUpdate(
  setEnableClipboardAssist,
  nextValue
);
};

const updateDayEndTime: React.Dispatch<
React.SetStateAction<string>
> = (nextValue) => {
applyPersistedStateUpdate(
  setDayEndTime,
  nextValue
);
};

const updateUserRole: React.Dispatch<
React.SetStateAction<string>
> = (nextValue) => {
applyPersistedStateUpdate(
  setUserRole,
  nextValue
);
};

const updateHasCompletedTutorial: React.Dispatch<
React.SetStateAction<boolean>
> = (nextValue) => {
applyPersistedStateUpdate(
  setHasCompletedTutorial,
  nextValue
);
};

const updateManualFocusTaskIds: React.Dispatch<
React.SetStateAction<string[]>
> = (nextValue) => {
setManualFocusTaskIds(
  (previousTaskIds) => {
    const nextTaskIds =
      typeof nextValue ===
      "function"
        ? nextValue(
            previousTaskIds
          )
        : nextValue;

    const hasChanged =
      nextTaskIds.length !==
        previousTaskIds.length ||
      nextTaskIds.some(
        (taskId, index) =>
          taskId !==
          previousTaskIds[index]
      );

    if (!hasChanged) {
      return previousTaskIds;
    }

    markLocalChangesPending();

    return nextTaskIds;
  }
);
};

const taskListRef =
useRef<HTMLElement | null>(null);

const lastClipboardTextRef =
useRef("");

const clipboardCheckInFlightRef =
useRef(false);

const tutorialAutoOpenedForUserRef =
useRef<string | null>(null);
const anchorScrollAnimationRef = useRef<number | null>(null);
const anchorRequestIdRef = useRef(0);
const completedAnchorRequestIdRef = useRef(0);
const anchorPreviousScrollBehaviorRef = useRef<string | null>(null);


const easeAnchorScroll = (progress: number) => {
  return -(Math.cos(Math.PI * progress) - 1) / 2;
};

const restoreNativeScrollBehavior = () => {
  if (typeof document === "undefined") return;

  if (anchorPreviousScrollBehaviorRef.current === null) return;

  document.documentElement.style.scrollBehavior =
    anchorPreviousScrollBehaviorRef.current;
  anchorPreviousScrollBehaviorRef.current = null;
};

const animateWindowScrollTo = (targetTop: number, duration = 1500) => {
  if (typeof window === "undefined") return;

  if (anchorScrollAnimationRef.current !== null) {
    window.cancelAnimationFrame(anchorScrollAnimationRef.current);
    anchorScrollAnimationRef.current = null;
    restoreNativeScrollBehavior();
  }

  const startTop = window.scrollY;
  const distance = targetTop - startTop;

  if (Math.abs(distance) < 8) return;

  anchorPreviousScrollBehaviorRef.current =
    document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";

  const startTime = performance.now();

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeAnchorScroll(progress);

    window.scrollTo({
      top: startTop + distance * easedProgress,
      behavior: "auto",
    });

    if (progress < 1) {
      anchorScrollAnimationRef.current = window.requestAnimationFrame(step);
      return;
    }

    anchorScrollAnimationRef.current = null;
    restoreNativeScrollBehavior();
  };

  anchorScrollAnimationRef.current = window.requestAnimationFrame(step);
};

const getTaskListAnchorElement = () => {
  if (typeof document === "undefined") return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  if (isMobile) {
    return (
      document.getElementById("Momentuhm-mobile-task-list-anchor") ||
      document.getElementById("Momentuhm-task-list-anchor")
    );
  }

  return taskListRef.current || document.getElementById("Momentuhm-task-list-anchor");
};

const anchorTaskList = () => {
  if (typeof window === "undefined") return false;

  const el = getTaskListAnchorElement();
  if (!el) return false;

  const rect = el.getBoundingClientRect();
  const idealTopOffset =
  window.innerWidth < 640
    ? 18
    : 80;
  const targetTop = Math.max(0, rect.top + window.scrollY - idealTopOffset);

  if (Math.abs(targetTop - window.scrollY) < 4) return true;

  animateWindowScrollTo(targetTop, 950);
  return true;
};

const anchorTaskListSoon = () => {
  if (typeof window === "undefined") return;

  const requestId = anchorRequestIdRef.current + 1;
  anchorRequestIdRef.current = requestId;

  [80, 260, 520, 900].forEach((delay) => {
    window.setTimeout(() => {
      if (anchorRequestIdRef.current !== requestId) return;

      window.requestAnimationFrame(() => {
        if (anchorRequestIdRef.current !== requestId) return;

        const anchored = anchorTaskList();

        if (anchored) {
          anchorRequestIdRef.current = requestId + 1;
        }
      });
    }, delay);
  });
};



const anchorTaskWorkspaceTabsSoon = () => {
  if (typeof window === "undefined") return;

  window.setTimeout(() => {
    const element =
      document.getElementById(
        "Momentuhm-task-workspace-tabs"
      );

    if (!element) return;

    const rect =
      element.getBoundingClientRect();

    const targetTop = Math.max(
      0,
      rect.top +
        window.scrollY -
        80
    );

    animateWindowScrollTo(
      targetTop,
      950
    );
  }, 40);
};

const getCompletedSectionAnchorElement = () => {
  if (typeof document === "undefined") return null;

  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 640;

  return document.getElementById(
    isMobile
      ? "Momentuhm-mobile-completed-anchor"
      : "Momentuhm-desktop-completed-anchor"
  );
};

const anchorCompletedSectionSoon = () => {
  if (typeof window === "undefined") return;

  /*
  * The completed section only exists inside the Today view.
  */
  setSelectedView("today");

  const requestId = completedAnchorRequestIdRef.current + 1;
  completedAnchorRequestIdRef.current = requestId;

  [160, 360, 700, 1100].forEach((delay) => {
    window.setTimeout(() => {
      if (completedAnchorRequestIdRef.current !== requestId) return;

      /*
      * Ensure the Tasks workspace is open before looking for
      * the completed-section element.
      */
      window.dispatchEvent(new Event("momentuhm:open-tasks"));

      window.requestAnimationFrame(() => {
        if (completedAnchorRequestIdRef.current !== requestId) return;

        const element = getCompletedSectionAnchorElement();

        if (!element) return;

        const topOffset =
          window.innerWidth < 640
            ? 18
            : window.innerWidth < 1024
            ? 148
            : 32;

        const rect = element.getBoundingClientRect();

        const targetTop = Math.max(
          0,
          rect.top + window.scrollY - topOffset
        );

        animateWindowScrollTo(targetTop, 1200);

        completedAnchorRequestIdRef.current = requestId + 1;
      });
    }, delay);
  });
};

const todayDate =
getLocalDateKey(
  currentTime
);

useEffect(() => {
const refreshCurrentTime = () => {
  setCurrentTime(
    new Date()
  );
};

refreshCurrentTime();

const timer =
  window.setInterval(
    refreshCurrentTime,
    30000
  );

const handleVisibilityChange =
  () => {
    if (
      document.visibilityState ===
      "visible"
    ) {
      refreshCurrentTime();
    }
  };

window.addEventListener(
  "focus",
  refreshCurrentTime
);

document.addEventListener(
  "visibilitychange",
  handleVisibilityChange
);

return () => {
  window.clearInterval(
    timer
  );

  window.removeEventListener(
    "focus",
    refreshCurrentTime
  );

  document.removeEventListener(
    "visibilitychange",
    handleVisibilityChange
  );
};
}, []);

/*
 * Keep Completed Today synchronized with categories.
 *
 * Categories are the source of truth. This repairs any
 * mismatch caused by an interrupted save, an older saved
 * completedToday list, refresh, or another update path.
 */
useEffect(() => {
  if (!isLoaded) {
    return;
  }

  const synchronizedCompletedTasks =
    getCompletedTodayFromCategories(
      categories
    );

  setCompletedToday(
    (previousTasks) => {
      const previousSignature =
        previousTasks
          .map(
            (task: any) =>
              `${task.id}:${task.completedAt || ""}:${task.category || ""}`
          )
          .sort()
          .join("|");

      const nextSignature =
        synchronizedCompletedTasks
          .map(
            (task: any) =>
              `${task.id}:${task.completedAt || ""}:${task.category || ""}`
          )
          .sort()
          .join("|");

      if (
        previousSignature ===
        nextSignature
      ) {
        return previousTasks;
      }

      return synchronizedCompletedTasks;
    }
  );
}, [
  categories,
  todayDate,
  isLoaded,
]);
  
  const dayTimeRemaining = useMemo(() => {
    return getTimeRemainingInDay(
      dayEndTime,
      currentTime
    );
  }, [dayEndTime, currentTime]);

/* ------------------------------------------------ */
/* Load, Refresh and Persist State */
/* ------------------------------------------------ */

const resetToInitialState = () => {
const initialCategories =
  createInitialCategories();

setCategories(initialCategories);
setArchive([]);
setInsightsHistory([]);
setCompletedToday([]);
setManualFocusTaskIds([]);
resetMemory();

setSelectedCategory(
  initialCategories[0]?.title || ""
);

setSelectedView("today");

setThemeColor(
  DEFAULT_THEME_COLOR
);

setDarkMode(false);

setTodayTaskSortMode("date");
setTodayTaskGroupMode("none");
setPriorityViewMode("list");
setUpcomingViewMode("calendar");

setEnableAppSuggestions(true);
setEnableAutoPriority(true);
setEnableClipboardAssist(true);

setDayEndTime("18:00");
setUserRole("");
setHasCompletedTutorial(false);
};

const applyLatestSavedState = (
  savedState: any,
  revision = 0
  ) => {
  if (!savedState) {
    return;
  }
  
  /*
   * Remember the exact server revision that produced
   * the state being applied.
   */
  serverRevisionRef.current =
  Number.isFinite(Number(revision))
    ? Number(revision)
    : 0;

revisionConflictRef.current =
  false;
  
  const parsed: any =
    savedState;

/*
 * All state setters below belong to one remote update.
 * The persistence effect must ignore the resulting render.
 */
skipNextPersistRef.current =
  true;

  const loadedCategories =
  Array.isArray(parsed.categories) &&
  parsed.categories.length > 0
    ? parsed.categories.map(
        (category: any) => ({
          ...category,

          tasks: Array.isArray(
            category.tasks
          )
            ? category.tasks.map(
                (task: any) => {
                  const hasTemporaryWhyText =
                    String(
                      task.whyThisMatters || ""
                    ).trim() ===
                    "Momentuhm is finding why this matters...";

                  const hasTemporaryAiReason =
                    String(
                      task.aiReason || ""
                    ).trim() ===
                    "Momentuhm is finding why this matters...";

                  return {
                    ...task,

                    whyThisMatters:
                      hasTemporaryWhyText
                        ? ""
                        : task.whyThisMatters,

                    aiReason:
                      hasTemporaryAiReason
                        ? ""
                        : task.aiReason,
                  };
                }
              )
            : [],
        })
      )
    : createInitialCategories();

const loadedArchive =
  Array.isArray(parsed.archive)
    ? parsed.archive
    : [];

const loadedInsightsHistory =
  Array.isArray(
    parsed.insightsHistory
  ) &&
  parsed.insightsHistory.length > 0
    ? parsed.insightsHistory
    : loadedArchive;

setCategories(
  loadedCategories
);

setArchive(
  loadedArchive
);

setInsightsHistory(
  loadedInsightsHistory
);

/*
 * Categories are the source of truth for task completion.
 *
 * Rebuild Completed Today from the actual completed tasks
 * instead of trusting a second independently saved list.
 */
const completedTasksFromCategories =
  getCompletedTodayFromCategories(
    loadedCategories
  );

/*
 * Legacy fallback:
 * Older saved data may contain completedToday entries whose
 * category task was already removed or not saved correctly.
 */
const legacyCompletedToday =
  Array.isArray(parsed.completedToday)
    ? parsed.completedToday.filter(
        (task: any) =>
          Boolean(task.completed) &&
          isCompletedToday(task)
      )
    : [];

const completedTaskMap =
  new Map<string, any>();

[
  ...legacyCompletedToday,
  ...completedTasksFromCategories,
].forEach((task: any) => {
  completedTaskMap.set(
    String(task.id),
    task
  );
});

setCompletedToday(
  Array.from(
    completedTaskMap.values()
  ).sort(
    (taskA: any, taskB: any) =>
      new Date(
        taskB.completedAt || 0
      ).getTime() -
      new Date(
        taskA.completedAt || 0
      ).getTime()
  )
);

setManualFocusTaskIds(
  Array.isArray(
    parsed.manualFocusTaskIds
  )
    ? parsed.manualFocusTaskIds
    : []
);

loadMemory(
  parsed.planningEvents
);

setSelectedCategory(
  loadedCategories[0]?.title || ""
);

setDarkMode(
  parsed.darkMode ?? false
);

setThemeColor(
  parsed.themeColor ||
    DEFAULT_THEME_COLOR
);

setTodayTaskSortMode(
  ["date", "priority"].includes(
    parsed.todayTaskSortMode
  )
    ? parsed.todayTaskSortMode
    : "date"
);

setTodayTaskGroupMode(
  [
    "none",
    "category",
    "priority",
    "date",
  ].includes(
    parsed.todayTaskGroupMode
  )
    ? parsed.todayTaskGroupMode
    : "none"
);

setPriorityViewMode(
  parsed.priorityViewMode ||
    "list"
);

setUpcomingViewMode(
  parsed.upcomingViewMode ||
    "calendar"
);

setEnableAppSuggestions(
  parsed.enableAppSuggestions ??
    true
);

setEnableAutoPriority(
  parsed.enableAutoPriority ??
    true
);

setEnableClipboardAssist(
  parsed.enableClipboardAssist ??
    true
);

setDayEndTime(
  normalizeDayEndTime(
    parsed.dayEndTime
  )
);

setUserRole(
  parsed.userRole || ""
);

setHasCompletedTutorial(
  parsed.hasCompletedTutorial ??
    false
);
};

/*
* Initial state load.
*/
useEffect(() => {
if (!isUserLoaded) {
  return;
}

let isCancelled = false;

setIsLoaded(false);

tutorialAutoOpenedForUserRef.current =
  null;

const loadUserState =
  async () => {
    /*
     * Signed-out users use a clean local state.
     */
    if (!user?.id) {
      if (!isCancelled) {
        serverRevisionRef.current = 0;
        revisionConflictRef.current = false;
        resetToInitialState();
        setIsLoaded(true);
      }
    
      return;
    }

    try {
      const saved =
      await loadState(user.id);

    const loadedState =
      normalizeLoadedState(saved);
    
    if (isCancelled) {
      return;
    }
    
    if (loadedState?.state) {
      applyLatestSavedState(
        loadedState.state,
        loadedState.revision
      );
    } else {
      serverRevisionRef.current = 0;
      resetToInitialState();
    }
    } catch (error) {
      console.error(
        "Failed to load initial Momentuhm state:",
        error
      );

      if (!isCancelled) {
        /*
         * Do not allow this temporary fallback state
         * to overwrite the user's existing server data.
         */
        skipNextPersistRef.current = true;
      
        resetToInitialState();
      
        setArchiveToast(
          "Could not load your latest changes"
        );
      
        window.setTimeout(() => {
          setArchiveToast("");
        }, 3500);
      }
    } finally {
      if (!isCancelled) {
        setIsLoaded(true);
      }
    }
  };

void loadUserState();

return () => {
  isCancelled = true;
};
}, [
isUserLoaded,
user?.id,
loadMemory,
resetMemory,
]);

/*
* Automatically open the tutorial once for a
* first-time signed-in user.
*/
useEffect(() => {
if (!isLoaded) return;
if (!isUserLoaded) return;
if (!user?.id) return;

if (
  tutorialAutoOpenedForUserRef.current ===
  user.id
) {
  return;
}

tutorialAutoOpenedForUserRef.current =
  user.id;

if (hasCompletedTutorial) {
  return;
}

setSelectedView("today");
setTutorialStep(0);
setIsTutorialOpen(true);
}, [
isLoaded,
isUserLoaded,
user?.id,
hasCompletedTutorial,
]);

/*
* Opens the tutorial manually through
* the "How it works" button.
*/
const openQuickTutorial = () => {
setShowDueReminderPopup(false);
setShowClipboardPrompt(false);
setClipboardCandidate("");

setIsExtractModalOpen(false);
setIsSuggestionsModalOpen(false);
setIsEditModalOpen(false);
setSelectedTask(null);

setSelectedView("today");
setTutorialStep(0);
setIsTutorialOpen(true);
};

/*
* Used for both completing and skipping the tour.
*/
const finishQuickTutorial = () => {
updateHasCompletedTutorial(true);
setIsTutorialOpen(false);
setTutorialStep(0);

if (
  typeof window !==
  "undefined"
) {
  window.dispatchEvent(
    new Event(
      "momentuhm:open-tasks"
    )
  );
}
};

/*
* Retrieve the latest state from the server.
*
* Automatic refreshes are skipped whenever this browser
* still has a local change waiting to be saved. This is
* important because loading older server data at that point
* could erase the user's newest local task.
*/
const refreshLatestStatus =
async (
  showConfirmation = true
) => {
  if (
    refreshInFlightRef.current
  ) {
    return;
  }
  
  /*
   * After a revision conflict, do not silently replace
   * the user's local changes.
   *
   * A manual refresh uses showConfirmation = true and
   * is allowed to continue.
   */
  if (
    revisionConflictRef.current &&
    !showConfirmation
  ) {
    return;
  }

  /*
   * Never replace local state while it is waiting to save.
   */
  if (
    localChangesPendingRef.current ||
    saveInFlightRef.current ||
    saveTimerRef.current !== null
  ) {
    if (showConfirmation) {
      setArchiveToast(
        "Saving your latest changes first"
      );

      window.setTimeout(() => {
        setArchiveToast("");
      }, 2200);
    }

    return;
  }

  refreshInFlightRef.current =
    true;

  if (showConfirmation) {
    setIsRefreshingStatus(true);
  }

  try {
    setCurrentTime(
      new Date()
    );

    if (user?.id) {
      const saved =
  await loadState(
    user.id
  );

const loadedState =
  normalizeLoadedState(saved);

if (loadedState?.state) {
  applyLatestSavedState(
    loadedState.state,
    loadedState.revision
  );
}
    }

    if (showConfirmation) {
      setArchiveToast(
        "Status refreshed"
      );

      window.setTimeout(() => {
        setArchiveToast("");
      }, 2200);
    }
  } catch (error) {
    console.error(
      "Failed to refresh latest status:",
      error
    );

    if (showConfirmation) {
      setArchiveToast(
        "Could not refresh status"
      );

      window.setTimeout(() => {
        setArchiveToast("");
      }, 3000);
    }
  } finally {
    refreshInFlightRef.current =
      false;

    if (showConfirmation) {
      setIsRefreshingStatus(false);
    }
  }
};

/*
* Automatically retrieve updates created on another device
* when this browser becomes active again.
*/
useEffect(() => {
if (!isLoaded) return;
if (!user?.id) return;

const refreshSilently = () => {
  void refreshLatestStatus(
    false
  );
};

const handleWindowFocus =
  () => {
    refreshSilently();
  };

const handleVisibilityChange =
  () => {
    if (
      document.visibilityState ===
      "visible"
    ) {
      refreshSilently();
    }
  };

window.addEventListener(
  "focus",
  handleWindowFocus
);

document.addEventListener(
  "visibilitychange",
  handleVisibilityChange
);

return () => {
  window.removeEventListener(
    "focus",
    handleWindowFocus
  );

  document.removeEventListener(
    "visibilitychange",
    handleVisibilityChange
  );
};
}, [
isLoaded,
user?.id,
]);

/* ------------------------------------------------ */
/* Persist */
/* ------------------------------------------------ */

useEffect(() => {
if (!isLoaded) return;
if (!user?.id) return;

/*
 * This render came from server-loaded data.
 * It must not be written back immediately.
 */
if (
  skipNextPersistRef.current
) {
  skipNextPersistRef.current =
    false;

  localChangesPendingRef.current =
    false;

  return;
}

localChangeVersionRef.current +=
  1;

const changeVersion =
  localChangeVersionRef.current;

localChangesPendingRef.current =
  true;

if (
  saveTimerRef.current !==
  null
) {
  window.clearTimeout(
    saveTimerRef.current
  );
}

let retryAttempt = 0;

const maximumRetryAttempts = 3;

const scheduleSave = (
  delay: number
) => {
  if (
    saveTimerRef.current !==
    null
  ) {
    window.clearTimeout(
      saveTimerRef.current
    );
  }

  saveTimerRef.current =
    window.setTimeout(() => {
      saveTimerRef.current =
        null;

      void persistState();
    }, delay);
};

const persistState =
  async () => {
    /*
     * Preserve save order by waiting for
     * the active request to finish.
     */
    if (
      saveInFlightRef.current
    ) {
      scheduleSave(250);
      return;
    }

    saveInFlightRef.current =
      true;

    try {
      const saveResult =
      await (saveState as any)(
        user.id,
        {
          categories,
          darkMode,
          themeColor,
          todayTaskSortMode,
          todayTaskGroupMode,
          priorityViewMode,
          upcomingViewMode,
          enableAppSuggestions,
          enableAutoPriority,
          enableClipboardAssist,
          archive,
          insightsHistory,
          completedToday,
          dayEndTime,
          userRole,
          manualFocusTaskIds,
          planningEvents,
          userPlanningProfile,
          hasCompletedTutorial,
        } as any,
        serverRevisionRef.current
      );
    
    /*
     * The server increments the revision only after
     * successfully writing this state.
     */
    serverRevisionRef.current =
    Number.isFinite(
      Number(saveResult?.revision)
    )
      ? Number(saveResult.revision)
      : serverRevisionRef.current;
  
  revisionConflictRef.current =
    false;
  
  retryAttempt = 0;
      /*
       * An older save must not mark a newer
       * local change as synchronized.
       */
      if (
        localChangeVersionRef.current ===
        changeVersion
      ) {
        localChangesPendingRef.current =
          false;

        lastSuccessfulSaveRef.current =
          new Date().toISOString();
      }
    } catch (error) {
      console.error(
        "Failed to save Momentuhm state:",
        error
      );
    
      localChangesPendingRef.current =
        true;
    
      const isRevisionConflict =
        error instanceof Error &&
        error.message ===
          "STATE_REVISION_CONFLICT";
    
      /*
       * Do not keep retrying an outdated snapshot.
       *
       * Retrying the same stale data would continue failing,
       * and forcing it through would overwrite another device.
       */
      if (isRevisionConflict) {
        revisionConflictRef.current =
          true;
      
        /*
         * The server rejected this stale snapshot.
         *
         * Stop retrying it because forcing the save could
         * overwrite newer work from another device.
         */
        localChangesPendingRef.current =
          false;
      
        if (
          saveTimerRef.current !==
          null
        ) {
          window.clearTimeout(
            saveTimerRef.current
          );
      
          saveTimerRef.current =
            null;
        }
      
        /*
         * A revision conflict is too important for a
         * temporary corner notification. Show a centred
         * modal on both mobile and desktop.
         */
        setShowRevisionConflictModal(
          true
        );
      
        return;
      }
    
      retryAttempt += 1;

      /*
       * Retry temporary failures without
       * requiring another user action.
       */
      if (
        retryAttempt <=
        maximumRetryAttempts
      ) {
        const retryDelay =
          retryAttempt * 2000;

        scheduleSave(
          retryDelay
        );

        setArchiveToast(
          "Sync interrupted. Retrying..."
        );
      } else {
        setArchiveToast(
          "Changes could not be synced"
        );
      }

      window.setTimeout(() => {
        setArchiveToast("");
      }, 3500);
    } finally {
      saveInFlightRef.current =
        false;
    }
  };

scheduleSave(700);

return () => {
  if (
    saveTimerRef.current !==
    null
  ) {
    window.clearTimeout(
      saveTimerRef.current
    );

    saveTimerRef.current =
      null;
  }
};
}, [
categories,
darkMode,
themeColor,
todayTaskSortMode,
todayTaskGroupMode,
priorityViewMode,
upcomingViewMode,
enableAppSuggestions,
enableAutoPriority,
enableClipboardAssist,
archive,
insightsHistory,
completedToday,
dayEndTime,
userRole,
manualFocusTaskIds,
planningEvents,
userPlanningProfile,
hasCompletedTutorial,
isLoaded,
user?.id,
]);

  /* ------------------------------------------------ */
  /* Derived Data */
  /* ------------------------------------------------ */

  const allTasks = useMemo(() => {
    return categories.flatMap((category) =>
      category.tasks.map((task: any) => ({
        ...task,
        category: category.title,
        score: scoreTask(task),
      }))
    );
  }, [categories]);

  const prioritizedTasks = useMemo(() => {
    return [...allTasks]
      .filter((task) => !task.completed)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }
      
        const overdueA = a.dueDate && isOverdue(a.dueDate);
        const overdueB = b.dueDate && isOverdue(b.dueDate);
      
        if (overdueA && !overdueB) return -1;
        if (!overdueA && overdueB) return 1;
      
        if (b.score !== a.score) {
          return b.score - a.score;
        }
  
        const dateA = getTaskDate(a);
        const dateB = getTaskDate(b);
  
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
  
        return dateA.localeCompare(dateB);
      });
  }, [allTasks]);
  
  const priorityViewTasks = useMemo(() => {
    return [...allTasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
  
      return b.score - a.score;
    });
  }, [allTasks]);

  const activeTasks = allTasks.filter((task) => !task.completed);

const highPriorityCount = activeTasks.filter(
  (task) => task.priority === "High"
).length;

const dueSoonCount = activeTasks.filter(
  (task) =>
    task.dueDate === todayDate ||
    task.suggestedDueDate === todayDate ||
    task.dueDate === getTomorrowDate() ||
    task.suggestedDueDate === getTomorrowDate()
).length;

const taskTabActiveTasks = activeTasks.filter(
  (task) => !Boolean(task.isBacklog)
);

const taskTabCompletedToday =
  completedToday.filter(
    (task) => !Boolean(task.isBacklog)
  );

const taskTabTotalCount =
  taskTabActiveTasks.length +
  taskTabCompletedToday.length;

const completionPercent =
  taskTabTotalCount === 0
    ? 0
    : Math.round(
        (
          taskTabCompletedToday.length /
          taskTabTotalCount
        ) * 100
      );

  const suggestedDateCount = allTasks.filter(
    (task) => !task.dueDate && task.suggestedDueDate
  ).length;

  const highPriorityTasks = priorityViewTasks.filter(
    (task) => task.priority === "High"
  );
  
  const mediumPriorityTasks = priorityViewTasks.filter(
    (task) => task.priority === "Medium"
  );
  
  const lowPriorityTasks = priorityViewTasks.filter(
    (task) => task.priority === "Low"
  );

  const upcomingTasks = useMemo(() => {
    return [...prioritizedTasks].sort((a, b) => {
      const dateA = getTaskDate(a);
      const dateB = getTaskDate(b);

      if (!dateA && !dateB) return b.score - a.score;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return dateA.localeCompare(dateB);
    });
  }, [prioritizedTasks]);

  const todayTasks = upcomingTasks.filter(
    (task) => isToday(getTaskDate(task)) && !task.completed
  );

  const tomorrowTasks = upcomingTasks.filter((task) =>
    isTomorrow(getTaskDate(task))
  );

  const laterTasks = upcomingTasks.filter((task) => isLater(getTaskDate(task)));

  const noDateTasks = upcomingTasks.filter((task) => !getTaskDate(task));

  const inboxTasks = prioritizedTasks.filter(
    (task) => !task.dueDate && !task.suggestedDueDate
  );

  const suggestionReviewTasks = prioritizedTasks.filter(
  (task) => !task.dueDate && task.suggestedDueDate
);

const dueReminderKey = `Momentuhm-due-reminder-${todayDate}-${dayEndTime}`;

useEffect(() => {
  if (!isLoaded) return;
if (!hasCompletedTutorial) return;
if (isTutorialOpen) return;
if (todayTasks.length === 0) return;
  if (dayTimeRemaining.isOver) return;
  if (dayTimeRemaining.minutesLeft > 120 || dayTimeRemaining.minutesLeft <= 0) return;

  const dismissed = localStorage.getItem(dueReminderKey) === "dismissed";

  if (dismissed) return;

  setShowDueReminderPopup(true);
}, [
  isLoaded,
  hasCompletedTutorial,
  isTutorialOpen,
  todayTasks.length,
  dayTimeRemaining.minutesLeft,
  dayTimeRemaining.isOver,
  dueReminderKey,
]);

const closeDueReminderPopup = () => {
  localStorage.setItem(dueReminderKey, "dismissed");
  setShowDueReminderPopup(false);
};

const viewDueReminderTasks = () => {
  setSelectedView("today");
  updateTodayTaskGroupMode("date");
  updateTodayTaskSortMode("date");
  closeDueReminderPopup();
  anchorTaskListSoon();
};

const openDueReminderTask = (task: any) => {
  setSelectedTask(task);
  setIsEditModalOpen(true);
  closeDueReminderPopup();
};

/* ------------------------------------------------ */
/* Clipboard Assist */
/* ------------------------------------------------ */

useEffect(() => {
  if (!CLIPBOARD_ASSIST_ENABLED_FOR_TESTING) return;
if (!isLoaded) return;
if (!hasCompletedTutorial) return;
if (isTutorialOpen) return;
if (!enableClipboardAssist) return;
  if (typeof window === "undefined") return;
  if (!navigator.clipboard?.readText) return;

  let isMounted = true;

  const checkClipboard = async () => {
    if (clipboardCheckInFlightRef.current) return;
    if (document.visibilityState !== "visible") return;
    if (isExtractModalOpen || isEditModalOpen || showClipboardPrompt) return;

    clipboardCheckInFlightRef.current = true;

    try {
      const clipboardText = await navigator.clipboard.readText();

      if (!isMounted) return;

      const normalizedText = normalizeClipboardText(clipboardText);

      if (!isUsefulClipboardText(normalizedText)) return;

      const lastHandledClipboardText =
  localStorage.getItem(CLIPBOARD_HANDLED_KEY) || lastClipboardTextRef.current;

if (normalizedText === lastHandledClipboardText) return;

lastClipboardTextRef.current = normalizedText;
localStorage.setItem(CLIPBOARD_HANDLED_KEY, normalizedText);

      const preparedText = prepareClipboardTextForExtraction(clipboardText);
      
      setClipboardCandidate(preparedText);
      setShowClipboardPrompt(true);
      setClipboardExtractedTasks([]);
      setClipboardExtractError("");
      setClipboardExtractLoading(true);
      
      try {
        const response = await fetch("/api/extract-tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: preparedText,
            categories: categories.map((category) => category.title),
            today: getTodayDate(),
          }),
        });
      
        const data = await response.json();
      
        if (!response.ok) {
          throw new Error(data?.error || "Could not read copied text.");
        }
      
        const normalizedTasks: ExtractedTaskSuggestion[] = (data.tasks || []).map(
          (task: any) => ({
            id: crypto.randomUUID(),
            selected: true,
            title: String(task.title || "").trim(),
            priority: ["Low", "Medium", "High"].includes(task.priority)
              ? task.priority
              : "Medium",
            suggestedDueDate: task.suggestedDueDate || null,
            category:
              categories.find((category) => category.title === task.category)
                ?.title ||
                categories[0]?.title ||
                "Planning & Prioritization",
            notes: String(task.notes || ""),
            status: normalizeTaskStatus(task.status),
            reason: String(task.reason || ""),
            confidence:
              typeof task.confidence === "number" ? task.confidence : 0.7,
            tags: normalizeTaskTags(task.tags),
          })
        );
      
        setClipboardExtractedTasks(normalizedTasks);
      } catch (error) {
        console.error(error);
        setClipboardExtractError("Momentuhm could not extract tasks from this text.");
      } finally {
        setClipboardExtractLoading(false);
      }


    } catch (error) {
      // Clipboard reads can be blocked until the browser grants permission.
    } finally {
      clipboardCheckInFlightRef.current = false;
    }
  };

  const handleFocus = () => {
    void checkClipboard();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      void checkClipboard();
    }
  };

  const baselineTimer = window.setTimeout(() => {
    void checkClipboard();
  }, 700);

  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    isMounted = false;
    window.clearTimeout(baselineTimer);
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, [
  isLoaded,
  hasCompletedTutorial,
  isTutorialOpen,
  enableClipboardAssist,
  isExtractModalOpen,
  isEditModalOpen,
  showClipboardPrompt,
]);

useEffect(() => {
  if (enableClipboardAssist) return;

  setClipboardCandidate("");
  setShowClipboardPrompt(false);
  setClipboardExtractedTasks([]);
  setClipboardExtractError("");
  setClipboardExtractLoading(false);
}, [enableClipboardAssist]);
const completedBoostTaskKey = completedToday
.map((task) => task.id)
.sort()
.join("-");

const boostCacheDate = getTodayDate();

/*
* Using v2 prevents the previous long cached paragraph
* from being loaded again.
*/
const boostCacheKey = `momentum-boost-v3-${boostCacheDate}`;

/* ------------------------------------------------ */
/* Load Momentuhm Boost Cache */
/* ------------------------------------------------ */

useEffect(() => {
if (!isLoaded) return;

const cachedBoost = localStorage.getItem(boostCacheKey);

if (!cachedBoost) return;

try {
  const parsed = JSON.parse(cachedBoost);

  if (!parsed?.message || !parsed?.taskKey) return;

  setBoostMessage(formatSingleLineInsight(parsed.message));
  setLastBoostTaskKey(parsed.taskKey);
} catch (error) {
  console.error("Failed to load cached boost:", error);
  localStorage.removeItem(boostCacheKey);
}
}, [isLoaded, boostCacheKey]);

/* ------------------------------------------------ */
/* Automatic Momentuhm Boost */
/* ------------------------------------------------ */

useEffect(() => {
if (!isLoaded) return;
if (selectedView !== "today") return;

if (completedToday.length === 0) {
  setBoostMessage("");
  setLastBoostTaskKey("");
  setBoostLoading(false);
  localStorage.removeItem(boostCacheKey);
  return;
}

/*
* Do not call the AI again unless the completed-task
* collection has changed.
*/
if (completedBoostTaskKey === lastBoostTaskKey) return;

const timeout = window.setTimeout(async () => {
  const completedTaskTitles = completedToday.map((task) => task.title);

  try {
    setBoostLoading(true);

    const response = await fetch("/api/boost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        completedTasks: completedTaskTitles,
        instruction:
        "Return one encouraging phrase of 3 to 6 words. Do not mention task names, task details, numbers, headings, or emojis.",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to generate boost.");
    }

    const nextBoostMessage = formatSingleLineInsight(data?.boost || "");

    if (!nextBoostMessage) {
      throw new Error("The AI returned an empty progress insight.");
    }

    setBoostMessage(nextBoostMessage);
    setLastBoostTaskKey(completedBoostTaskKey);

    localStorage.setItem(
      boostCacheKey,
      JSON.stringify({
        message: nextBoostMessage,
        taskKey: completedBoostTaskKey,
        generatedAt: new Date().toISOString(),
        source: "ai",
      })
    );
  } catch (error) {
    console.error("Failed to generate AI progress insight:", error);

    setBoostMessage("AI progress insight is temporarily unavailable.");
    setLastBoostTaskKey(completedBoostTaskKey);
  } finally {
    setBoostLoading(false);
  }
}, 1200);

return () => window.clearTimeout(timeout);
}, [
isLoaded,
selectedView,
completedBoostTaskKey,
completedToday,
lastBoostTaskKey,
boostCacheKey,
]);


  /* ------------------------------------------------ */
  /* Theme Classes */
  /* ------------------------------------------------ */

  const glass = darkMode
    ? "bg-[#181818] border border-white/[0.08]"
    : "bg-white border border-[#E7E7E3]";

  const strongerGlass = darkMode
    ? "bg-[#181818] border border-white/[0.08]"
    : "bg-white border border-[#E7E7E3] shadow-[0_1px_2px_rgba(0,0,0,0.025)]";

    const input = darkMode
    ? "bg-[#202020] text-white placeholder:text-white/[0.55] border border-white/[0.35] focus:border-white/[0.70]"
    : "bg-white text-[#181818] placeholder:text-[#6F6F6A] border border-[#868681] focus:border-[#181818]";
  
  const border = darkMode
    ? "border-white/[0.12]"
    : "border-[#D4D4CF]";
  
  const modalSelect = darkMode
    ? "bg-[#202020] text-white border border-white/[0.35]"
    : "bg-white text-[#181818] border border-[#868681]";

    const fontClass = inter.className;

  /* ------------------------------------------------ */
  /* Firecracker */
  /* ------------------------------------------------ */

  const triggerFirecracker = (x: number, y: number) => {
    const id = crypto.randomUUID();

    setFirecrackers((prev) => [
      ...prev,
      {
        id,
        x,
        y,
      },
    ]);

    setTimeout(() => {
      setFirecrackers((prev) =>
        prev.filter((firecracker) => firecracker.id !== id)
      );
    }, 1000);
  };

  const markTaskAsNew = (taskId: string) => {
    setNewlyAddedTaskIds((prev) => [...prev, taskId]);

    window.setTimeout(() => {
      setNewlyAddedTaskIds((prev) => prev.filter((id) => id !== taskId));
    }, 2200);
  };


  const improveTaskWithAI = async (
    taskId: string,
    title: string,
    whyThisMatters: string
  ) => {
    setSuggestingTaskIds((previousIds) => [
      ...previousIds,
      taskId,
    ]);
  
    try {
      const response = await fetch(
        "/api/suggest-task",
        {
          method: "POST",
  
          headers: {
            "Content-Type": "application/json",
          },
  
          body: JSON.stringify({
            title,
            whyThisMatters,
  
            categories: categories.map(
              (category) => category.title
            ),
  
            today: getTodayDate(),
  
            planningProfile: userPlanningProfile,
  
            memoryInstructions:
              userPlanningProfile.promptInstructions,
          }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to suggest task details."
        );
      }
  
      const suggestion =
        data.suggestion || {};
  
      const suggestedPriority:
        | Priority
        | undefined = [
        "Low",
        "Medium",
        "High",
      ].includes(suggestion.priority)
        ? suggestion.priority
        : undefined;
  
      const suggestedDueDate =
        typeof suggestion.suggestedDueDate ===
          "string" &&
        suggestion.suggestedDueDate.trim()
          ? suggestion.suggestedDueDate
          : undefined;
  
      const suggestedCategory =
        typeof suggestion.category ===
          "string" &&
        categories.some(
          (category) =>
            category.title ===
            suggestion.category
        )
          ? suggestion.category
          : undefined;
  
      const suggestionId =
        crypto.randomUUID();
  
      const suggestedAt =
        new Date().toISOString();
  
        const originalTask =
        categoriesRef.current
          .flatMap((category) =>
            category.tasks.map(
              (task: any) => ({
                ...task,
                category:
                  category.title,
              })
            )
          )
          .find(
            (task: any) =>
              task.id === taskId
          );
  
      if (suggestedPriority) {
        recordPlanningEvent({
          type: "priority_suggested",
  
          taskId,
  
          suggestedValue:
            suggestedPriority,
  
          context: {
            title,
  
            category:
              suggestedCategory ||
              originalTask?.category,
  
            priority:
              suggestedPriority,
  
            suggestedDueDate:
              suggestedDueDate || null,
  
            source: "suggest-task",
          },
        });
      }
  
      if (suggestedDueDate) {
        recordPlanningEvent({
          type: "date_suggested",
  
          taskId,
  
          suggestedValue:
            suggestedDueDate,
  
          context: {
            title,
  
            category:
              suggestedCategory ||
              originalTask?.category,
  
            priority:
              suggestedPriority ||
              originalTask?.priority,
  
            suggestedDueDate,
  
            source: "suggest-task",
          },
        });
      }
  
      const taskStillExists =
      categoriesRef.current.some(
        (category) =>
          category.tasks.some(
            (task: any) =>
              task.id === taskId
          )
      );
    
    if (!taskStillExists) {
      return {
        suggestedDueDate:
          undefined,
      };
    }
    
    /*
     * The AI request may finish after the first task
     * save has completed. Mark this later mutation
     * pending before changing the task.
     */
    markLocalChangesPending();
    
    setCategories(
        (previousCategories) =>
          previousCategories.map(
            (category) => ({
              ...category,
  
              tasks: category.tasks.map(
                (task: any) => {
                  if (task.id !== taskId) {
                    return task;
                  }
  
                  return {
                    ...task,
  
                    whyThisMatters:
                      task.whyThisMatters ||
                      whyThisMatters,
  
                    priority:
                      suggestedPriority ||
                      task.priority,
  
                    suggestedDueDate:
                      suggestedDueDate ||
                      task.suggestedDueDate,
  
                    status: task.completed
                      ? "Done"
                      : normalizeTaskStatus(
                          task.status
                        ),
  
                    notes:
                      suggestion.notes ||
                      task.notes ||
                      "",
  
                    tags: normalizeTaskTags(
                      suggestion.tags ||
                        task.tags
                    ),
  
                    aiReason:
                      suggestion.reason ||
                      task.aiReason ||
                      "Momentuhm reviewed this task with your reason in mind.",
  
                    aiConfidence:
                      typeof suggestion.confidence ===
                      "number"
                        ? suggestion.confidence
                        : task.aiConfidence ||
                          0.7,
  
                    aiSuggestionSnapshot: {
                      suggestionId,
  
                      priority:
                        suggestedPriority,
  
                      dueDate:
                        suggestedDueDate,
  
                      category:
                        suggestedCategory ||
                        category.title,
  
                      suggestedAt,
                    },
  
                    prioritySuggestionDecision:
                      undefined,
                  };
                }
              ),
            })
          )
      );
  
      const currentTaskCategory =
      categoriesRef.current.find(
        (category) =>
          category.tasks.some(
            (task: any) =>
              task.id === taskId
          )
      )?.title;
    
    if (
      suggestedCategory &&
      currentTaskCategory &&
      currentTaskCategory !==
        suggestedCategory
    ) {
      /*
       * Category movement is another persistent
       * mutation and can happen after an earlier
       * save has already finished.
       */
      markLocalChangesPending();
    
      setCategories(
          (previousCategories) => {
            const taskToMove =
              previousCategories
                .flatMap((category) =>
                  category.tasks.map(
                    (task: any) => ({
                      ...task,
  
                      categoryTitle:
                        category.title,
                    })
                  )
                )
                .find(
                  (task: any) =>
                    task.id === taskId
                );
  
            if (!taskToMove) {
              return previousCategories;
            }
  
            if (
              taskToMove.categoryTitle ===
              suggestedCategory
            ) {
              return previousCategories;
            }
  
            const categoriesWithoutTask =
              previousCategories.map(
                (category) => ({
                  ...category,
  
                  tasks:
                    category.tasks.filter(
                      (task: any) =>
                        task.id !== taskId
                    ),
                })
              );
  
            return categoriesWithoutTask.map(
              (category) => {
                if (
                  category.title !==
                  suggestedCategory
                ) {
                  return category;
                }
  
                const movedTask: any = {
                  ...taskToMove,
  
                  whyThisMatters:
                    taskToMove.whyThisMatters ||
                    whyThisMatters,
  
                  priority:
                    suggestedPriority ||
                    taskToMove.priority,
  
                  suggestedDueDate:
                    suggestedDueDate ||
                    taskToMove.suggestedDueDate,
  
                  status:
                    taskToMove.completed
                      ? "Done"
                      : normalizeTaskStatus(
                          taskToMove.status
                        ),
  
                  notes:
                    suggestion.notes ||
                    taskToMove.notes ||
                    "",
  
                  tags: normalizeTaskTags(
                    suggestion.tags ||
                      taskToMove.tags
                  ),
  
                  aiReason:
                    suggestion.reason ||
                    taskToMove.aiReason ||
                    "Momentuhm reviewed this task.",
  
                  aiConfidence:
                    typeof suggestion.confidence ===
                    "number"
                      ? suggestion.confidence
                      : taskToMove.aiConfidence ||
                        0.7,
  
                  aiSuggestionSnapshot: {
                    suggestionId,
  
                    priority:
                      suggestedPriority,
  
                    dueDate:
                      suggestedDueDate,
  
                    category:
                      suggestedCategory,
  
                    suggestedAt,
                  },
  
                  prioritySuggestionDecision:
                    undefined,
                };
  
                delete movedTask.categoryTitle;
  
                return {
                  ...category,
  
                  tasks: [
                    movedTask,
                    ...category.tasks,
                  ],
                };
              }
            );
          }
        );
      }
  
      return {
        suggestedDueDate,
      };
    } catch (error) {
      console.error(
        "Failed to improve task with AI:",
        error
      );
  
      return {
        suggestedDueDate: undefined,
      };
    } finally {
      setSuggestingTaskIds(
        (previousIds) =>
          previousIds.filter(
            (id) => id !== taskId
          )
      );
    }
  };
  
  const generateWhySuggestions = async (
    title: string
  ) => {
    const response = await fetch(
      "/api/why-matters",
      {
        method: "POST",
  
        headers: {
          "Content-Type":
            "application/json",
        },
  
        body: JSON.stringify({
          title,
          role:
            userRole ||
            "professional",
        }),
      }
    );
  
    const data = await response.json();
  
    if (!response.ok) {
      throw new Error(
        data.error ||
          "Failed to generate why suggestions."
      );
    }
  
    return Array.isArray(
      data.suggestions
    )
      ? data.suggestions
      : [];
  };
  
  const selectWhySuggestion = (
    taskId: string,
    suggestion: string,
    index: number
  ) => {
    const taskExists =
      categories.some((category) =>
        category.tasks.some(
          (task: any) =>
            task.id === taskId
        )
      );
  
    if (!taskExists) {
      return;
    }
  
    markLocalChangesPending();
  
    setCategories((previousCategories) =>
      previousCategories.map(
        (category) => ({
          ...category,
  
          tasks:
            category.tasks.map(
              (task: any) =>
                task.id === taskId
                  ? {
                      ...task,
  
                      whyThisMatters:
                        suggestion,
  
                      selectedWhyIndex:
                        index,
  
                      aiReason:
                        suggestion,
                    }
                  : task
            ),
        })
      )
    );
  };
  
  /* ------------------------------------------------ */
  /* Add Task */
  /* ------------------------------------------------ */
  
  const addTask = async () => {
    const title = newTask.trim();
  
    if (!title) {
      return;
    }
  
    const manualWhy =
      newTaskWhy.trim();
  
    const categoryTitle =
      categories.some(
        (category) =>
          category.title ===
          selectedCategory &&
          category.title !== "-"
      )
        ? selectedCategory
        : categories.find(
            (category) =>
              category.title !== "-"
          )?.title;
  
    if (!categoryTitle) {
      setArchiveToast(
        "Create a category before adding a task."
      );
  
      window.setTimeout(() => {
        setArchiveToast("");
      }, 2500);
  
      return;
    }
  
    markLocalChangesPending();
  
    const priority: Priority =
      enableAutoPriority
        ? inferPriority(title)
        : "Medium";
  
    const suggestedDueDate =
      enableAppSuggestions
        ? suggestDueDate(title)
        : undefined;
  
    const taskId =
      crypto.randomUUID();
  
      const initialWhy =
      manualWhy || "";
  
    const taskToAdd = {
      id: taskId,
      title,
  
      isBacklog: false,

      whyThisMatters:
        initialWhy,
  
      whySuggestions:
        manualWhy
          ? [manualWhy]
          : [],
  
      selectedWhyIndex: 0,
  
      priority,
  
      dueDate: undefined,
  
      suggestedDueDate,
  
      notes: "",
  
      status: "Not started",
  
      tags: [],
  
      subtasks: [],
  
      aiReason:
        initialWhy,
  
      aiConfidence:
        manualWhy
          ? 0.95
          : 0.5,
  
      completed: false,
  
      createdAt:
        new Date().toISOString(),
    };
  
    setCategories(
      (previousCategories) =>
        previousCategories.map(
          (category) =>
            category.title ===
            categoryTitle
              ? {
                  ...category,
  
                  tasks: [
                    taskToAdd,
                    ...category.tasks,
                  ],
                }
              : category
        )
    );
  
    setNewTask("");
    setNewTaskWhy("");
  
    anchorTaskListSoon();
  
    try {
      if (!manualWhy) {
        setSuggestingTaskIds(
          (previousIds) => [
            ...previousIds,
            taskId,
          ]
        );
  
        const whySuggestions =
          await generateWhySuggestions(
            title
          );
  
        const bestWhy =
          whySuggestions[0] ||
          "This task may support meaningful progress on active work.";
  
          const taskStillExists =
          categoriesRef.current.some(
            (category) =>
              category.tasks.some(
                (task: any) =>
                  task.id === taskId
              )
          );

        if (!taskStillExists) {
          return;
        }

        /*
         * The request may complete after the initial
         * task save, so protect this second mutation.
         */
        markLocalChangesPending();
  
        setCategories(
          (previousCategories) =>
            previousCategories.map(
              (category) => ({
                ...category,
  
                tasks:
                  category.tasks.map(
                    (task: any) =>
                      task.id === taskId
                        ? {
                            ...task,
  
                            whyThisMatters:
                              bestWhy,
  
                            whySuggestions,
  
                            selectedWhyIndex:
                              0,
  
                            aiReason:
                              bestWhy,
  
                            aiConfidence:
                              0.86,
                          }
                        : task
                  ),
              })
            )
        );
      }
  
      if (enableAppSuggestions) {
        await improveTaskWithAI(
          taskId,
          title,
          manualWhy
        );
      }
  
      markTaskAsNew(taskId);
    } catch (error) {
      console.error(error);
  
      const taskStillExists =
      categoriesRef.current.some(
        (category) =>
          category.tasks.some(
            (task: any) =>
              task.id === taskId
          )
      );

      if (!taskStillExists) {
        return;
      }

      /*
       * The fallback is also a persistent task update.
       */
      markLocalChangesPending();
  
      setCategories(
        (previousCategories) =>
          previousCategories.map(
            (category) => ({
              ...category,
  
              tasks:
                category.tasks.map(
                  (task: any) =>
                    task.id === taskId
                      ? {
                          ...task,
  
                          whyThisMatters:
                            "This may deserve attention because it could unblock future work.",
  
                          whySuggestions: [
                            "This may deserve attention because it could unblock future work.",
                            "Completing this can reduce open-loop mental load.",
                            "It may help maintain progress on an active responsibility.",
                          ],
  
                          selectedWhyIndex:
                            0,
  
                          aiReason:
                            "This may deserve attention because it could unblock future work.",
  
                          aiConfidence:
                            0.6,
                        }
                      : task
                ),
            })
          )
      );
  
      markTaskAsNew(taskId);
    } finally {
      setSuggestingTaskIds(
        (previousIds) =>
          previousIds.filter(
            (id) => id !== taskId
          )
      );
    }
  };
  
  const extractTasksFromText = async (
    sourceTextOverride?: string
  ) => {
    const rawSourceText =
      typeof sourceTextOverride ===
      "string"
        ? sourceTextOverride
        : extractInput;
  
    const sourceText =
      rawSourceText.trim();
  
    if (!sourceText) {
      setExtractError(
        "Paste some text first."
      );
  
      return;
    }
  
    setExtractLoading(true);
    setExtractError("");
    setExtractedTasks([]);
  
    try {
      const response = await fetch(
        "/api/extract-tasks",
        {
          method: "POST",
  
          headers: {
            "Content-Type":
              "application/json",
          },
  
          body: JSON.stringify({
            text: sourceText,
  
            categories:
              categories
                .filter(
                  (category) =>
                    category.title !== "-"
                )
                .map(
                  (category) =>
                    category.title
                ),
  
            today:
              getTodayDate(),
          }),
        }
      );
  
      const responseText =
        await response.text();
  
      let data: any = null;
  
      try {
        data = responseText
          ? JSON.parse(
              responseText
            )
          : {};
      } catch {
        console.error(
          "Extract API returned non-JSON response:",
          responseText
        );
  
        throw new Error(
          "Momentuhm could not connect to the AI service. Please try again."
        );
      }
  
      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Momentuhm could not extract tasks right now."
        );
      }
  
      const visibleCategories =
        categories.filter(
          (category) =>
            category.title !== "-"
        );
  
      const fallbackCategory =
        visibleCategories[0]?.title ||
        "";
  
      const normalizedTasks:
        ExtractedTaskSuggestion[] =
        (data.tasks || [])
          .map((task: any) => ({
            id: crypto.randomUUID(),
  
            selected: true,
  
            title:
              String(
                task.title || ""
              ).trim(),
  
            priority: [
              "Low",
              "Medium",
              "High",
            ].includes(
              task.priority
            )
              ? task.priority
              : "Medium",
  
            suggestedDueDate:
              task.suggestedDueDate ||
              null,
  
            category:
              visibleCategories.find(
                (category) =>
                  category.title ===
                  task.category
              )?.title ||
              fallbackCategory,
  
            notes:
              String(
                task.notes || ""
              ),
  
            status:
              normalizeTaskStatus(
                task.status
              ),
  
            reason:
              String(
                task.reason || ""
              ),
  
            confidence:
              typeof task.confidence ===
              "number"
                ? task.confidence
                : 0.7,
  
            tags:
              normalizeTaskTags(
                task.tags
              ),
          }))
          .filter(
            (task:
              ExtractedTaskSuggestion) =>
              Boolean(
                task.title &&
                task.category
              )
          );
  
      setExtractedTasks(
        normalizedTasks
      );
  
      if (
        normalizedTasks.length === 0
      ) {
        setExtractError(
          "No tasks were found. Try adding a little more context or rewrite it as something to do."
        );
      }
    } catch (error) {
      console.error(error);
  
      setExtractError(
        error instanceof Error
          ? error.message
          : "Failed to extract tasks. Please try again."
      );
    } finally {
      setExtractLoading(false);
    }
  };
  
  const dismissClipboardCandidate =
    () => {
      setShowClipboardPrompt(false);
      setClipboardCandidate("");
      setClipboardExtractedTasks([]);
      setClipboardExtractError("");
      setClipboardExtractLoading(false);
    };
  
  const addClipboardCandidateAsTask =
    () => {
      const sourceText =
        clipboardCandidate.trim();
  
      if (!sourceText) {
        dismissClipboardCandidate();
        return;
      }
  
      const categoryTitle =
        categories.some(
          (category) =>
            category.title ===
              selectedCategory &&
            category.title !== "-"
        )
          ? selectedCategory
          : categories.find(
              (category) =>
                category.title !== "-"
            )?.title;
  
      if (!categoryTitle) {
        setArchiveToast(
          "Create a category before adding a task."
        );
  
        window.setTimeout(() => {
          setArchiveToast("");
        }, 2500);
  
        return;
      }
  
      markLocalChangesPending();
  
      const title =
        getClipboardTaskTitle(
          sourceText
        );
  
      const priority: Priority =
        enableAutoPriority
          ? inferPriority(title)
          : "Medium";
  
      const suggestedDueDate =
        enableAppSuggestions
          ? suggestDueDate(title)
          : undefined;
  
      const normalizedText =
        normalizeClipboardText(
          sourceText
        );
  
      const taskToAdd = {
        id: crypto.randomUUID(),
  
        title,

        isBacklog: false,

  
        whyThisMatters:
          "Captured from clipboard.",
  
        whySuggestions: [
          "Captured from clipboard.",
        ],
  
        selectedWhyIndex: 0,
  
        priority,
  
        dueDate: undefined,
  
        suggestedDueDate,
  
        notes:
          normalizedText === title
            ? ""
            : sourceText,
  
        status: "Not started",
  
        tags: [],
  
        subtasks: [],
  
        aiReason:
          "Added directly from copied text.",
  
        aiConfidence: 1,
  
        completed: false,
  
        createdAt:
          new Date().toISOString(),
      };
  
      setCategories(
        (previousCategories) =>
          previousCategories.map(
            (category) =>
              category.title ===
              categoryTitle
                ? {
                    ...category,
  
                    tasks: [
                      taskToAdd,
                      ...category.tasks,
                    ],
                  }
                : category
          )
      );
  
      markTaskAsNew(
        taskToAdd.id
      );
  
      setArchiveToast(
        "Copied text added as task"
      );
  
      window.setTimeout(() => {
        setArchiveToast("");
      }, 5000);
  
      dismissClipboardCandidate();
      setSelectedView("today");
      anchorTaskListSoon();
    };
  
  const toggleClipboardExtractedTask =
    (taskId: string) => {
      setClipboardExtractedTasks(
        (previousTasks) =>
          previousTasks.map(
            (task) =>
              task.id === taskId
                ? {
                    ...task,
                    selected:
                      !task.selected,
                  }
                : task
          )
      );
    };
  
  const addSelectedClipboardExtractedTasks =
    () => {
      const selectedTasks =
        clipboardExtractedTasks.filter(
          (task) => task.selected
        );
  
      if (
        selectedTasks.length === 0
      ) {
        setClipboardExtractError(
          "Select at least one task to add."
        );
  
        return;
      }
  
      const visibleCategories =
        categories.filter(
          (category) =>
            category.title !== "-"
        );
  
      const fallbackCategory =
        visibleCategories[0]?.title;
  
      if (!fallbackCategory) {
        setClipboardExtractError(
          "Create a category before adding tasks."
        );
  
        return;
      }
  
      const normalizedSelectedTasks =
        selectedTasks.map(
          (task) => ({
            ...task,
  
            category:
              visibleCategories.some(
                (category) =>
                  category.title ===
                  task.category
              )
                ? task.category
                : fallbackCategory,
          })
        );
  
      markLocalChangesPending();
  
      setCategories(
        (previousCategories) =>
          previousCategories.map(
            (category) => {
              const tasksForCategory =
                normalizedSelectedTasks
                  .filter(
                    (task) =>
                      task.category ===
                      category.title
                  )
                  .map((task) => {
                    const newId =
                      crypto.randomUUID();
  
                    markTaskAsNew(newId);
  
                    return {
                      id: newId,
  
                      title:
                        task.title,

                      isBacklog: false,
  
                      priority:
                        task.priority,
  
                      dueDate:
                        undefined,
  
                      suggestedDueDate:
                        task.suggestedDueDate ||
                        undefined,
  
                      notes:
                        task.notes,
  
                      status:
                        task.status,
  
                      whyThisMatters:
                        task.reason ||
                        "",
  
                      whySuggestions:
                        task.reason
                          ? [task.reason]
                          : [],
  
                      selectedWhyIndex:
                        0,
  
                      aiReason:
                        task.reason,
  
                      aiConfidence:
                        task.confidence,
  
                      tags:
                        normalizeTaskTags(
                          task.tags
                        ),
  
                      subtasks: [],
  
                      completed: false,
  
                      createdAt:
                        new Date().toISOString(),
                    };
                  });
  
              if (
                tasksForCategory.length ===
                0
              ) {
                return category;
              }
  
              return {
                ...category,
  
                tasks: [
                  ...tasksForCategory,
                  ...category.tasks,
                ],
              };
            }
          )
      );
  
      setArchiveToast(
        `${
          normalizedSelectedTasks.length
        } task${
          normalizedSelectedTasks.length ===
          1
            ? ""
            : "s"
        } added from clipboard`
      );
  
      window.setTimeout(() => {
        setArchiveToast("");
      }, 2200);
  
      dismissClipboardCandidate();
      setSelectedView("today");
      anchorTaskListSoon();
    };
  


    const addSelectedClipboardTasksAsSubtasks = (
      parentTaskName: string
    ) => {
      const title =
        parentTaskName.trim();
    
      if (!title) {
        setClipboardExtractError(
          "Enter a name for the parent task."
        );
    
        return;
      }
    
      const selectedTasks =
        clipboardExtractedTasks.filter(
          (task) => task.selected
        );
    
      if (selectedTasks.length === 0) {
        setClipboardExtractError(
          "Select at least one task to use as a subtask."
        );
    
        return;
      }
    
      const visibleCategories =
        categories.filter(
          (category) =>
            category.title !== "-"
        );
    
      const categoryTitle =
        visibleCategories.some(
          (category) =>
            category.title ===
            selectedCategory
        )
          ? selectedCategory
          : visibleCategories[0]?.title;
    
      if (!categoryTitle) {
        setClipboardExtractError(
          "Create a category before adding this task."
        );
    
        return;
      }
    
      const priorityRank: Record<
        Priority,
        number
      > = {
        Low: 1,
        Medium: 2,
        High: 3,
      };
    
      const parentPriority =
        selectedTasks.reduce<Priority>(
          (
            highestPriority,
            task
          ) =>
            priorityRank[task.priority] >
            priorityRank[highestPriority]
              ? task.priority
              : highestPriority,
          "Low"
        );
    
      const suggestedDates =
        selectedTasks
          .map(
            (task) =>
              task.suggestedDueDate
          )
          .filter(
            (
              date
            ): date is string =>
              Boolean(date)
          )
          .sort();
    
      const parentTaskId =
        crypto.randomUUID();
    
      const createdAt =
        new Date().toISOString();
    
      const parentTask = {
        id: parentTaskId,
    
        title,
    
        isBacklog: false,
    
        whyThisMatters:
          `This task groups ${selectedTasks.length} related actions captured from the clipboard.`,
    
        whySuggestions: [
          `This task groups ${selectedTasks.length} related actions captured from the clipboard.`,
        ],
    
        selectedWhyIndex: 0,
    
        priority:
          parentPriority,
    
        dueDate:
          undefined,
    
        suggestedDueDate:
          suggestedDates[0] ||
          undefined,
    
        notes:
          "Created from Clipboard Assist.",
    
        status:
          "Not started" as TaskStatus,
    
        tags: [],
    
        subtasks:
          selectedTasks.map(
            (task): Subtask => ({
              id:
                crypto.randomUUID(),
    
              title:
                task.title,
    
              completed:
                false,
    
              dueDate:
                task.suggestedDueDate ||
                undefined,
    
              createdAt,
            })
          ),
    
        aiReason:
          "Related clipboard actions were grouped under one task.",
    
        aiConfidence: 1,
    
        completed: false,
    
        createdAt,
      };
    
      markLocalChangesPending();
    
      setCategories(
        (
          previousCategories
        ) =>
          previousCategories.map(
            (category) =>
              category.title ===
              categoryTitle
                ? {
                    ...category,
    
                    tasks: [
                      parentTask,
                      ...category.tasks,
                    ],
                  }
                : category
          )
      );
    
      markTaskAsNew(
        parentTaskId
      );
    
      setArchiveToast(
        `${selectedTasks.length} subtasks added under "${title}"`
      );
    
      window.setTimeout(() => {
        setArchiveToast("");
      }, 3000);
    
      dismissClipboardCandidate();
      setSelectedView("today");
      anchorTaskListSoon();
    };

  const toggleExtractedTask = (
    taskId: string
  ) => {
    setExtractedTasks(
      (previousTasks) =>
        previousTasks.map(
          (task) =>
            task.id === taskId
              ? {
                  ...task,
  
                  selected:
                    !task.selected,
                }
              : task
        )
    );
  };
  
  const addSelectedExtractedTasks =
    () => {
      const selectedTasks =
        extractedTasks.filter(
          (task) => task.selected
        );
  
      if (
        selectedTasks.length === 0
      ) {
        setExtractError(
          "Select at least one task to add."
        );
  
        return;
      }
  
      const visibleCategories =
        categories.filter(
          (category) =>
            category.title !== "-"
        );
  
      const fallbackCategory =
        visibleCategories[0]?.title;
  
      if (!fallbackCategory) {
        setExtractError(
          "Create a category before adding tasks."
        );
  
        return;
      }
  
      const normalizedSelectedTasks =
        selectedTasks.map(
          (task) => ({
            ...task,
  
            category:
              visibleCategories.some(
                (category) =>
                  category.title ===
                  task.category
              )
                ? task.category
                : fallbackCategory,
          })
        );
  
      markLocalChangesPending();
  
      setCategories(
        (previousCategories) =>
          previousCategories.map(
            (category) => {
              const tasksForCategory =
                normalizedSelectedTasks
                  .filter(
                    (task) =>
                      task.category ===
                      category.title
                  )
                  .map((task) => {
                    const newId =
                      crypto.randomUUID();
  
                    markTaskAsNew(newId);
  
                    return {
                      id: newId,
  
                      title:
                        task.title,

                        isBacklog: false,
  
                      priority:
                        task.priority,
  
                      dueDate:
                        undefined,
  
                      suggestedDueDate:
                        task.suggestedDueDate ||
                        undefined,
  
                      notes:
                        task.notes,
  
                      status:
                        task.status,
  
                      whyThisMatters:
                        task.reason ||
                        "",
  
                      whySuggestions:
                        task.reason
                          ? [task.reason]
                          : [],
  
                      selectedWhyIndex:
                        0,
  
                      aiReason:
                        task.reason,
  
                      aiConfidence:
                        task.confidence,
  
                      tags:
                        normalizeTaskTags(
                          task.tags
                        ),
  
                      subtasks: [],
  
                      completed: false,
  
                      createdAt:
                        new Date().toISOString(),
                    };
                  });
  
              if (
                tasksForCategory.length ===
                0
              ) {
                return category;
              }
  
              return {
                ...category,
  
                tasks: [
                  ...tasksForCategory,
                  ...category.tasks,
                ],
              };
            }
          )
      );
  
      setArchiveToast(
        `${
          normalizedSelectedTasks.length
        } extracted task${
          normalizedSelectedTasks.length ===
          1
            ? ""
            : "s"
        } added`
      );
  
      window.setTimeout(() => {
        setArchiveToast("");
      }, 2200);
  
      setIsExtractModalOpen(false);
      setNewTask("");
      setExtractInput("");
      setExtractedTasks([]);
      setExtractError("");
      anchorTaskListSoon();
    };

  /* ------------------------------------------------ */
  /* Toggle Task */
  /* ------------------------------------------------ */

  const toggleTaskById = (
    taskId: string,
    e: React.MouseEvent
  ) => {
    const taskWithCategory =
      categories
        .flatMap((category) =>
          category.tasks.map(
            (task: any) => ({
              ...task,
              category:
                category.title,
            })
          )
        )
        .find(
          (task: any) =>
            task.id === taskId
        );
  
    if (!taskWithCategory) {
      return;
    }
  
    /*
     * Block automatic remote refresh only after confirming
     * that this task exists and will actually be changed.
     */
    markLocalChangesPending();
  
    const rect =
      e.currentTarget.getBoundingClientRect();
  
    triggerFirecracker(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
  
    const isAlreadyCompleted =
      Boolean(
        taskWithCategory.completed
      );
  
    const completedAt =
      isAlreadyCompleted
        ? undefined
        : new Date().toISOString();
  
    /*
     * Record the execution decision before
     * changing the task state.
     */
    if (isAlreadyCompleted) {
      recordPlanningEvent({
        type:
          "task_completion_reversed",
  
        taskId,
  
        previousValue:
          "completed",
  
        finalValue:
          "active",
  
        context: {
          title:
            taskWithCategory.title,
  
          category:
            taskWithCategory.category,
  
          priority:
            taskWithCategory.priority,
  
          dueDate:
            taskWithCategory.dueDate ||
            null,
  
          suggestedDueDate:
            taskWithCategory
              .suggestedDueDate ||
            null,
  
          createdAt:
            taskWithCategory.createdAt,
  
          source:
            "task-checkbox",
        },
      });
    } else {
      recordPlanningEvent({
        type:
          "task_completed",
  
        taskId,
  
        previousValue:
          "active",
  
        finalValue:
          "completed",
  
        context: {
          title:
            taskWithCategory.title,
  
          category:
            taskWithCategory.category,
  
          priority:
            taskWithCategory.priority,
  
          dueDate:
            taskWithCategory.dueDate ||
            null,
  
          suggestedDueDate:
            taskWithCategory
              .suggestedDueDate ||
            null,
  
          createdAt:
            taskWithCategory.createdAt,
  
          source:
            "task-checkbox",
        },
      });
    }
  
    setCategories(
      (previousCategories) =>
        previousCategories.map(
          (category) => ({
            ...category,
  
            tasks:
              category.tasks.map(
                (task: any) => {
                  if (
                    task.id !== taskId
                  ) {
                    return task;
                  }
  
                  if (
                    isAlreadyCompleted
                  ) {
                    return {
                      ...task,
  
                      completed: false,
  
                      completedAt:
                        undefined,
  
                      status:
                        getRestorableTaskStatus(
                          task
                            .statusBeforeCompletion
                        ),
  
                      statusBeforeCompletion:
                        undefined,
                    };
                  }
  
                  return {
                    ...task,
  
                    completed: true,
  
                    completedAt,
  
                    statusBeforeCompletion:
                      getRestorableTaskStatus(
                        task.status
                      ),
  
                    status:
                      "Done",
                  };
                }
              ),
          })
        )
    );
  
    if (isAlreadyCompleted) {
      setCompletedToday(
        (previousTasks) =>
          previousTasks.filter(
            (task) =>
              task.id !== taskId
          )
      );
  
      anchorTaskListSoon();
  
      return;
    }
  
    setCompletedToday(
      (previousTasks) => [
        {
          ...taskWithCategory,
  
          completed:
            true,
  
          completedAt,
  
          statusBeforeCompletion:
            getRestorableTaskStatus(
              taskWithCategory.status
            ),
  
          status:
            "Done",
        },
  
        ...previousTasks.filter(
          (task) =>
            task.id !== taskId
        ),
      ]
    );
  
    anchorCompletedSectionSoon();
  };



  /*
 * Persist subtask changes immediately from the edit modal.
 *
 * This updates categories—the persisted source of truth—
 * without saving the other unsaved task fields in the modal.
 */
  const updateTaskSubtasksImmediately = (
    taskId: string,
    nextSubtasks: Subtask[]
  ) => {
    let taskWasUpdated = false;
  
    setCategories(
      (previousCategories) => {
        const nextCategories =
          previousCategories.map(
            (category) => ({
              ...category,
  
              tasks:
                category.tasks.map(
                  (task: any) => {
                    if (
                      task.id !== taskId
                    ) {
                      return task;
                    }
  
                    taskWasUpdated = true;
  
                    return {
                      ...task,
  
                      subtasks:
                        nextSubtasks,
                    };
                  }
                ),
            })
          );
  
        if (!taskWasUpdated) {
          return previousCategories;
        }
  
        markLocalChangesPending();
  
        return nextCategories;
      }
    );
  
    setCompletedToday(
      (previousTasks) => {
        let completedTaskWasUpdated =
          false;
  
        const nextTasks =
          previousTasks.map(
            (task: any) => {
              if (
                task.id !== taskId
              ) {
                return task;
              }
  
              completedTaskWasUpdated =
                true;
  
              return {
                ...task,
  
                subtasks:
                  nextSubtasks,
              };
            }
          );
  
        return completedTaskWasUpdated
          ? nextTasks
          : previousTasks;
      }
    );
  };


   /* ------------------------------------------------ */
  /* Toggle Subtask */
  /* ------------------------------------------------ */

  const toggleSubtaskById = (
    taskId: string,
    subtaskId: string
  ) => {
    const taskWithSubtask =
      categories
        .flatMap((category) =>
          category.tasks
        )
        .find(
          (task: any) =>
            task.id === taskId &&
            getTaskSubtasks(task).some(
              (subtask) =>
                subtask.id === subtaskId
            )
        );

    if (!taskWithSubtask) {
      return;
    }

    /*
     * Protect the local subtask change from an automatic
     * focus or visibility refresh before it is persisted.
     */
    markLocalChangesPending();

    setCategories(
      (previousCategories) =>
        previousCategories.map(
          (category) => ({
            ...category,

            tasks: category.tasks.map(
              (task: any) => {
                if (task.id !== taskId) {
                  return task;
                }

                return {
                  ...task,

                  subtasks:
                    getTaskSubtasks(task).map(
                      (subtask) =>
                        subtask.id ===
                        subtaskId
                          ? {
                              ...subtask,

                              completed:
                                !subtask.completed,
                            }
                          : subtask
                    ),
                };
              }
            ),
          })
        )
    );
  };

  /* ------------------------------------------------ */
  /* Restore Completed Task */
  /* ------------------------------------------------ */

  const restoreCompletedTask = (
    taskId: string
  ) => {
    const taskWithCategory =
      categories
        .flatMap((category) =>
          category.tasks.map(
            (task: any) => ({
              ...task,
              category:
                category.title,
            })
          )
        )
        .find(
          (task: any) =>
            task.id === taskId
        );
  
        if (!taskWithCategory) {
          return;
        }
        
        /*
         * Prevent a focus or visibility refresh from replacing
         * the restored task with older server state.
         */
        markLocalChangesPending();
        
        recordPlanningEvent({
      type:
        "task_completion_reversed",
  
      taskId,
  
      previousValue:
        "completed",
  
      finalValue:
        "active",
  
      context: {
        title:
          taskWithCategory.title,
  
        category:
          taskWithCategory.category,
  
        priority:
          taskWithCategory.priority,
  
        dueDate:
          taskWithCategory.dueDate ||
          null,
  
        suggestedDueDate:
          taskWithCategory
            .suggestedDueDate ||
          null,
  
        createdAt:
          taskWithCategory.createdAt,
  
        source:
          "completed-section-restore",
      },
    });
  
    setCategories(
      (previousCategories) =>
        previousCategories.map(
          (category) => ({
            ...category,
  
            tasks:
              category.tasks.map(
                (task: any) =>
                  task.id === taskId
                    ? {
                        ...task,
  
                        completed:
                          false,
  
                        completedAt:
                          undefined,
  
                        status:
                          getRestorableTaskStatus(
                            task
                              .statusBeforeCompletion
                          ),
  
                        statusBeforeCompletion:
                          undefined,
                      }
                    : task
              ),
          })
        )
    );
  
    setCompletedToday(
      (previousTasks) =>
        previousTasks.filter(
          (task) =>
            task.id !== taskId
        )
    );
  
    anchorTaskListSoon();
  };


  const togglePinTask = (taskId: string) => {
    const taskExists = categories.some(
      (category) =>
        category.tasks.some(
          (task: any) => task.id === taskId
        )
    );
  
    if (!taskExists) {
      return;
    }
  
    markLocalChangesPending();
  
    setCategories((previousCategories) =>
      previousCategories.map((category) => ({
        ...category,
  
        tasks: category.tasks.map(
          (task: any) =>
            task.id === taskId
              ? {
                  ...task,
                  pinned: !task.pinned,
                }
              : task
        ),
      }))
    );
  };

  const toggleFocusTask = (
    taskId: string
  ) => {
    const taskExists = categories.some(
      (category) =>
        category.tasks.some(
          (task: any) =>
            task.id === taskId &&
            !task.completed
        )
    );
  
    if (!taskExists) {
      return;
    }
  
    const isAlreadyFocused =
      manualFocusTaskIds.includes(
        taskId
      );
  
    if (
      !isAlreadyFocused &&
      manualFocusTaskIds.length >= 3
    ) {
      setArchiveToast(
        "Your Focus stack already has three tasks"
      );
  
      window.setTimeout(() => {
        setArchiveToast("");
      }, 2500);
  
      return;
    }
  
    markLocalChangesPending();
  
    setManualFocusTaskIds(
      (previousTaskIds) =>
        isAlreadyFocused
          ? previousTaskIds.filter(
              (existingTaskId) =>
                existingTaskId !== taskId
            )
          : [
              ...previousTaskIds,
              taskId,
            ]
    );
  };

  /* ------------------------------------------------ */
  /* Delete Task */
  /* ------------------------------------------------ */

  const deleteTask = (taskId: string) => {
    const taskExists = categories.some(
      (category) =>
        category.tasks.some(
          (task: any) => task.id === taskId
        )
    );
  
    if (!taskExists) {
      return;
    }
  
    markLocalChangesPending();
  
    setCategories((previousCategories) =>
      previousCategories.map(
        (category) => ({
          ...category,
          tasks: category.tasks.filter(
            (task: any) =>
              task.id !== taskId
          ),
        })
      )
    );
  };

  const deleteTaskEverywhere = (
    taskId: string
  ) => {
    const taskExistsAnywhere =
      categories.some((category) =>
        category.tasks.some(
          (task: any) =>
            task.id === taskId
        )
      ) ||
      completedToday.some(
        (task) =>
          task.id === taskId
      ) ||
      archive.some(
        (task: any) =>
          task.id === taskId
      ) ||
      manualFocusTaskIds.includes(
        taskId
      ) ||
      insightsHistory.some(
        (item: any) => {
          const sourceTaskId =
            String(
              item.sourceTaskId ||
                item.id ||
                ""
            ).split(":")[0];
  
          return (
            sourceTaskId ===
            String(taskId)
          );
        }
      );
  
    if (!taskExistsAnywhere) {
      setIsEditModalOpen(false);
      setSelectedTask(null);
      return;
    }
  
    markLocalChangesPending();
  
    setCategories(
      (previousCategories) =>
        previousCategories.map(
          (category) => ({
            ...category,
  
            tasks:
              category.tasks.filter(
                (task: any) =>
                  task.id !== taskId
              ),
          })
        )
    );
  
    setCompletedToday(
      (previousTasks) =>
        previousTasks.filter(
          (task) =>
            task.id !== taskId
        )
    );
  
    setArchive(
      (previousTasks) =>
        previousTasks.filter(
          (task) =>
            task.id !== taskId
        )
    );
  
    setManualFocusTaskIds(
      (previousTaskIds) =>
        previousTaskIds.filter(
          (existingTaskId) =>
            existingTaskId !==
            taskId
        )
    );
  
    setInsightsHistory(
      (previousItems) =>
        previousItems.filter(
          (item: any) => {
            const sourceTaskId =
              String(
                item.sourceTaskId ||
                  item.id ||
                  ""
              ).split(":")[0];
  
            return (
              sourceTaskId !==
              String(taskId)
            );
          }
        )
    );
  
    forgetTaskMemory(
      taskId
    );
  
    setIsEditModalOpen(
      false
    );
  
    setSelectedTask(
      null
    );
  };
  
 
 

  /* ------------------------------------------------ */
  /* Schedule Task */
  /* ------------------------------------------------ */

  const scheduleTaskById = (
    taskId: string,
    dueDate: string
  ) => {
    const taskWithCategory =
      categories
        .flatMap((category) =>
          category.tasks.map(
            (task: any) => ({
              ...task,
              category:
                category.title,
            })
          )
        )
        .find(
          (task: any) =>
            task.id === taskId
        );
  
        if (!taskWithCategory) {
          return;
        }
        
        if (!dueDate) {
          return;
        }
        
        if (
          taskWithCategory.dueDate ===
            dueDate &&
          !taskWithCategory.suggestedDueDate
        ) {
          return;
        }
        
        markLocalChangesPending();
        
        const previousDueDate =
          taskWithCategory.dueDate;
  
    const previousSuggestedDate =
      taskWithCategory.suggestedDueDate;
  
    const dateChanged =
      dueDate !== previousDueDate;
  
    const wasDeferred =
      Boolean(
        previousDueDate &&
        dateChanged &&
        dueDate > previousDueDate
      );
  
    const nextDeferCount =
      wasDeferred
        ? Number(
            taskWithCategory.deferCount ||
            0
          ) + 1
        : Number(
            taskWithCategory.deferCount ||
            0
          );
  
    /*
     * Record whether an AI date was accepted
     * or replaced.
     */
    if (previousSuggestedDate) {
      const acceptedSuggestion =
        previousSuggestedDate ===
        dueDate;
  
      recordPlanningEvent({
        type: acceptedSuggestion
          ? "date_suggestion_accepted"
          : "date_suggestion_overridden",
  
        taskId,
  
        suggestedValue:
          previousSuggestedDate,
  
        finalValue:
          dueDate,
  
        context: {
          title:
            taskWithCategory.title,
  
          category:
            taskWithCategory.category,
  
          priority:
            taskWithCategory.priority,
  
          dueDate,
  
          suggestedDueDate:
            previousSuggestedDate,
  
          createdAt:
            taskWithCategory.createdAt,
  
          source:
            "manual-schedule",
        },
      });
    } else if (!previousDueDate) {
      /*
       * This is the first confirmed date assigned
       * to the task.
       */
      recordPlanningEvent({
        type:
          "manual_date_assigned",
  
        taskId,
  
        finalValue:
          dueDate,
  
        context: {
          title:
            taskWithCategory.title,
  
          category:
            taskWithCategory.category,
  
          priority:
            taskWithCategory.priority,
  
          dueDate,
  
          createdAt:
            taskWithCategory.createdAt,
  
          source:
            "manual-schedule",
        },
      });
    }
  
    /*
     * A deferral occurs only when an existing
     * confirmed date is moved to a later day.
     */
    if (wasDeferred) {
      recordPlanningEvent({
        type:
          "task_deferred",
  
        taskId,
  
        previousValue:
          previousDueDate,
  
        finalValue:
          dueDate,
  
        context: {
          title:
            taskWithCategory.title,
  
          category:
            taskWithCategory.category,
  
          priority:
            taskWithCategory.priority,
  
          dueDate,
  
          createdAt:
            taskWithCategory.createdAt,
  
          deferCount:
            nextDeferCount,
  
          source:
            "manual-schedule",
        },
      });
    }
  
    setCategories(
      (previousCategories) =>
        previousCategories.map(
          (category) => ({
            ...category,
  
            tasks:
              category.tasks.map(
                (task: any) => {
                  if (
                    task.id !== taskId
                  ) {
                    return task;
                  }
  
                  return {
                    ...task,

                    isBacklog: false,
  
                    dueDate,
  
                    suggestedDueDate:
                      undefined,
  
                    deferCount:
                      nextDeferCount,
  
                    aiReason:
                      previousSuggestedDate
                        ? previousSuggestedDate ===
                          dueDate
                          ? "You accepted Momentuhm's suggested date."
                          : "You replaced Momentuhm's suggested date."
                        : wasDeferred
                        ? "You moved this task to a later date."
                        : previousDueDate
                        ? "You rescheduled this task."
                        : "You manually scheduled this task.",
  
                    aiConfidence:
                      1,
                  };
                }
              ),
          })
        )
    );
  };
  /* ------------------------------------------------ */
  /* Accept Suggested Date */
  /* ------------------------------------------------ */

  const acceptSuggestedDateById = (
    taskId: string
  ) => {
    const taskWithCategory =
      categories
        .flatMap((category) =>
          category.tasks.map(
            (task: any) => ({
              ...task,
              category:
                category.title,
            })
          )
        )
        .find(
          (task: any) =>
            task.id === taskId
        );
  
        if (
          !taskWithCategory?.suggestedDueDate
        ) {
          return;
        }
        
        markLocalChangesPending();
        
        const acceptedDate =
          taskWithCategory.suggestedDueDate;
  
    recordPlanningEvent({
      type:
        "date_suggestion_accepted",
  
      taskId,
  
      suggestedValue:
        acceptedDate,
  
      finalValue:
        acceptedDate,
  
      context: {
        title:
          taskWithCategory.title,
  
        category:
          taskWithCategory.category,
  
        priority:
          taskWithCategory.priority,
  
        dueDate:
          acceptedDate,
  
        suggestedDueDate:
          acceptedDate,
  
        createdAt:
          taskWithCategory.createdAt,
  
        source:
          "suggested-date-review",
      },
    });
  
    setCategories(
      (previousCategories) =>
        previousCategories.map(
          (category) => ({
            ...category,
  
            tasks:
              category.tasks.map(
                (task: any) => {
                  if (
                    task.id !== taskId
                  ) {
                    return task;
                  }
  
                  if (
                    !task.suggestedDueDate
                  ) {
                    return task;
                  }
  
                  return {
                    ...task,

                    isBacklog: false,
  
                    dueDate:
                      task.suggestedDueDate,
  
                    suggestedDueDate:
                      undefined,
  
                    aiReason:
                      "You accepted Momentuhm's app-suggested date.",
  
                    aiConfidence: 1,
                  };
                }
              ),
          })
        )
    );
  };

  const acceptAllSuggestedDates = () => {
    /*
     * Capture the accepted suggestions before
     * updating task state.
     */
    const acceptedTasks =
      categories.flatMap(
        (category) =>
          category.tasks
            .filter(
              (task: any) =>
                !task.dueDate &&
                Boolean(
                  task.suggestedDueDate
                )
            )
            .map(
              (task: any) => ({
                ...task,
  
                category:
                  category.title,
              })
            )
      );
  
      if (acceptedTasks.length === 0) {
        setIsSuggestionsModalOpen(false);
        return;
      }
      
      acceptedTasks.forEach(
        (task: any) => {
        const acceptedDate =
          task.suggestedDueDate;
  
        recordPlanningEvent({
          type:
            "date_suggestion_accepted",
  
          taskId:
            task.id,
  
          suggestedValue:
            acceptedDate,
  
          finalValue:
            acceptedDate,
  
          context: {
            title:
              task.title,
  
            category:
              task.category,
  
            priority:
              task.priority,
  
            dueDate:
              acceptedDate,
  
            suggestedDueDate:
              acceptedDate,
  
            createdAt:
              task.createdAt,
  
            source:
              "accept-all-suggested-dates",
          },
        });
      }
    );
  
    /*
     * Close the modal first. Updating every
     * task in the following frame prevents the
     * modal animation and task render from
     * competing.
     */
    setIsSuggestionsModalOpen(
      false
    );
    
    markLocalChangesPending();
    
    window.requestAnimationFrame(
      () => {
        setCategories(
          (
            previousCategories
          ) =>
            previousCategories.map(
              (category) => {
                let categoryChanged =
                  false;
  
                const updatedTasks =
                  category.tasks.map(
                    (task: any) => {
                      if (
                        task.dueDate ||
                        !task.suggestedDueDate
                      ) {
                        return task;
                      }
  
                      categoryChanged =
                        true;
  
                      return {
                        ...task,

                        isBacklog: false,
  
                        dueDate:
                          task.suggestedDueDate,
  
                        suggestedDueDate:
                          undefined,
  
                        aiReason:
                          "You accepted Momentuhm's app-suggested date.",
  
                        aiConfidence: 1,
                      };
                    }
                  );
  
                return categoryChanged
                  ? {
                      ...category,
                      tasks:
                        updatedTasks,
                    }
                  : category;
              }
            )
        );
      }
    );
  };

  /* ------------------------------------------------ */
  /* Save Task Changes */
  /* ------------------------------------------------ */

  const saveTaskChanges = (
    updatedTask: any
  ) => {
    if (!updatedTask?.title?.trim()) {
      return;
    }
  
    const originalTaskWithCategory =
      categories
        .flatMap((category) =>
          category.tasks.map(
            (task: any) => ({
              ...task,
              category:
                category.title,
            })
          )
        )
        .find(
          (task: any) =>
            task.id === updatedTask.id
        );
  
    if (!originalTaskWithCategory) {
      return;
    }
  
    /*
     * The edit modal can close and return focus to the page.
     * Mark the change pending only after confirming that the
     * task exists and will actually be changed.
     */
    markLocalChangesPending();
  
    const title =
      updatedTask.title.trim();
  
    const whyThisMatters = String(
      updatedTask.whyThisMatters || ""
    ).trim();
  
    const priority: Priority =
      updatedTask.priority ||
      inferPriority(title);
  
 /*
* Status and completion remain separate.
* Completion changes are detected by comparing
* the modal value with the original task.
*/
const wasCompleted =
Boolean(
originalTaskWithCategory
  .completed
);

const completed =
Boolean(
updatedTask.completed
);

const completionChanged =
completed !== wasCompleted;

const normalizedStatus =
completed
? "Done"
: normalizeTaskStatus(
    updatedTask.status
  );

const completedAt =
completed
? wasCompleted
  ? updatedTask.completedAt ||
    originalTaskWithCategory
      .completedAt ||
    new Date().toISOString()
  : new Date().toISOString()
: undefined;

const statusBeforeCompletion =
completed
? getRestorableTaskStatus(
    updatedTask
      .statusBeforeCompletion ||
      originalTaskWithCategory
        .statusBeforeCompletion ||
      originalTaskWithCategory
        .status
  )
: undefined;

/*
* Record completion changes made through
* the edit-task modal.
*/
if (completionChanged) {
if (completed) {
recordPlanningEvent({
  type:
    "task_completed",

  taskId:
    updatedTask.id,

  previousValue:
    "active",

  finalValue:
    "completed",

  context: {
    title,

    category:
      updatedTask.category ||
      originalTaskWithCategory
        .category,

    priority,

    dueDate:
      updatedTask.dueDate ||
      null,

    suggestedDueDate:
      updatedTask
        .suggestedDueDate ||
      null,

    createdAt:
      originalTaskWithCategory
        .createdAt,

    source:
      "edit-task-modal",
  },
});
} else {
recordPlanningEvent({
  type:
    "task_completion_reversed",

  taskId:
    updatedTask.id,

  previousValue:
    "completed",

  finalValue:
    "active",

  context: {
    title,

    category:
      updatedTask.category ||
      originalTaskWithCategory
        .category,

    priority,

    dueDate:
      updatedTask.dueDate ||
      null,

    suggestedDueDate:
      updatedTask
        .suggestedDueDate ||
      null,

    createdAt:
      originalTaskWithCategory
        .createdAt,

    source:
      "edit-task-modal",
  },
});
}
}

/*
* Compare the edited date with the task's
* state before the modal was saved.
*/
const previousDueDate =
originalTaskWithCategory.dueDate;

const previousSuggestedDate =
originalTaskWithCategory
  .suggestedDueDate;

const nextDueDate =
updatedTask.dueDate ||
undefined;

const dateChanged =
nextDueDate !== previousDueDate;

const wasDeferred =
Boolean(
  previousDueDate &&
  nextDueDate &&
  dateChanged &&
  nextDueDate > previousDueDate
);

const nextDeferCount =
wasDeferred
  ? Number(
      originalTaskWithCategory
        .deferCount || 0
    ) + 1
  : Number(
      originalTaskWithCategory
        .deferCount || 0
    );

if (dateChanged && nextDueDate) {
if (
  previousSuggestedDate &&
  nextDueDate ===
    previousSuggestedDate
) {
  recordPlanningEvent({
    type:
      "date_suggestion_accepted",

    taskId:
      updatedTask.id,

    suggestedValue:
      previousSuggestedDate,

    finalValue:
      nextDueDate,

    context: {
      title,

      category:
        updatedTask.category ||
        originalTaskWithCategory
          .category,

      priority,

      dueDate:
        nextDueDate,

      suggestedDueDate:
        previousSuggestedDate,

      createdAt:
        originalTaskWithCategory
          .createdAt,

      source:
        "edit-task-modal",
    },
  });
} else if (
  previousSuggestedDate &&
  nextDueDate !==
    previousSuggestedDate
) {
  recordPlanningEvent({
    type:
      "date_suggestion_overridden",

    taskId:
      updatedTask.id,

    suggestedValue:
      previousSuggestedDate,

    finalValue:
      nextDueDate,

    context: {
      title,

      category:
        updatedTask.category ||
        originalTaskWithCategory
          .category,

      priority,

      dueDate:
        nextDueDate,

      suggestedDueDate:
        previousSuggestedDate,

      createdAt:
        originalTaskWithCategory
          .createdAt,

      source:
        "edit-task-modal",
    },
  });
} else if (!previousDueDate) {
  recordPlanningEvent({
    type:
      "manual_date_assigned",

    taskId:
      updatedTask.id,

    finalValue:
      nextDueDate,

    context: {
      title,

      category:
        updatedTask.category ||
        originalTaskWithCategory
          .category,

      priority,

      dueDate:
        nextDueDate,

      createdAt:
        originalTaskWithCategory
          .createdAt,

      source:
        "edit-task-modal",
    },
  });
}
}

/*
* Record a deferral separately from date-suggestion
* acceptance or override.
*
* This runs only when an already confirmed date is
* moved to a later calendar day.
*/
if (wasDeferred && nextDueDate) {
recordPlanningEvent({
  type:
    "task_deferred",

  taskId:
    updatedTask.id,

  previousValue:
    previousDueDate,

  finalValue:
    nextDueDate,

  context: {
    title,

    category:
      updatedTask.category ||
      originalTaskWithCategory
        .category,

    priority,

    dueDate:
      nextDueDate,

    createdAt:
      originalTaskWithCategory
        .createdAt,

    deferCount:
      nextDeferCount,

    source:
      "edit-task-modal",
  },
});
}

/*
* Compare the saved priority with the original
* AI priority suggestion.
*
* prioritySuggestionDecision prevents the same
* acceptance or override from being recorded
* every time the task modal is saved.
*/
const suggestedPriority =
originalTaskWithCategory
  .aiSuggestionSnapshot
  ?.priority;

const previousPrioritySuggestionDecision =
originalTaskWithCategory
  .prioritySuggestionDecision;

let nextPrioritySuggestionDecision =
previousPrioritySuggestionDecision;

if (suggestedPriority) {
/*
 * The user selected a different priority from
 * the one originally suggested by Momentuhm.
 */
if (
  priority !== suggestedPriority &&
  previousPrioritySuggestionDecision !==
    "overridden"
) {
  recordPlanningEvent({
    type:
      "priority_suggestion_overridden",

    taskId:
      updatedTask.id,

    suggestedValue:
      suggestedPriority,

    finalValue:
      priority,

    context: {
      title,

      category:
        updatedTask.category ||
        originalTaskWithCategory.category,

      priority,

      source:
        "edit-task-modal",
    },
  });

  nextPrioritySuggestionDecision =
    "overridden";
}

/*
 * The user kept the original AI priority.
 *
 * Record this only once. Saving the same task
 * again without changing priority will not
 * create another acceptance event.
 */
if (
  priority === suggestedPriority &&
  !previousPrioritySuggestionDecision
) {
  recordPlanningEvent({
    type:
      "priority_suggestion_accepted",

    taskId:
      updatedTask.id,

    suggestedValue:
      suggestedPriority,

    finalValue:
      priority,

    context: {
      title,

      category:
        updatedTask.category ||
        originalTaskWithCategory.category,

      priority,

      source:
        "edit-task-modal",
    },
  });

  nextPrioritySuggestionDecision =
    "accepted";
}
}

const savedTask = {
  id: updatedTask.id,
  title,
  whyThisMatters,
  priority,

  isBacklog:
    updatedTask.moveToBacklog
      ? true
      : Boolean(
          updatedTask.isBacklog ??
          originalTaskWithCategory.isBacklog
        ),

  dueDate:
    updatedTask.moveToBacklog
      ? undefined
      : updatedTask.dueDate ||
        undefined,

  suggestedDueDate:
    updatedTask.moveToBacklog
      ? undefined
      : updatedTask.dueDate
      ? undefined
      : updatedTask.suggestedDueDate ||
        (
          enableAppSuggestions
            ? suggestDueDate(title)
            : undefined
        ),
      notes: updatedTask.notes || "",
      status: normalizedStatus,
      statusBeforeCompletion,
      aiReason:
        updatedTask.aiReason ||
        (enableAppSuggestions
          ? getAppSuggestionReason(
              title,
              priority
            )
          : "App suggestions are turned off."),
          aiConfidence:
          updatedTask.aiConfidence || 0.72,
        
          aiSuggestionSnapshot:
          updatedTask.aiSuggestionSnapshot ||
          originalTaskWithCategory
            .aiSuggestionSnapshot,
        
        
            prioritySuggestionDecision:
nextPrioritySuggestionDecision,

deferCount:
nextDeferCount,

tags: normalizeTaskTags(
updatedTask.tags
),

      subtasks:
        getTaskSubtasks(updatedTask),
      whySuggestions:
        updatedTask.whySuggestions || [],
      selectedWhyIndex:
        updatedTask.selectedWhyIndex || 0,
      completed,
      completedAt,
      pinned: Boolean(
        updatedTask.pinned
      ),
      createdAt:
        updatedTask.createdAt ||
        new Date().toISOString(),
    };
  
    setCategories((prev) => {
      const visibleCategories =
        prev.filter(
          (category) =>
            category.title !== "-"
        );
    
      const targetCategory =
        updatedTask.category ||
        visibleCategories[0]?.title ||
        "-";
    
      const cleanedCategories =
        prev.map((category) => ({
          ...category,
          tasks: category.tasks.filter(
            (task: any) =>
              task.id !== updatedTask.id
          ),
        }));
    
      const targetExists =
        cleanedCategories.some(
          (category) =>
            category.title === targetCategory
        );
    
      if (!targetExists) {
        return [
          ...cleanedCategories,
          {
            id: crypto.randomUUID(),
            title: "-",
            tasks: [savedTask],
          },
        ];
      }
    
      return cleanedCategories.map(
        (category) =>
          category.title === targetCategory
            ? {
                ...category,
                tasks: [
                  savedTask,
                  ...category.tasks,
                ],
              }
            : category
      );
    });
  
    if (completed) {
      setCompletedToday((prev) => [
        {
          ...savedTask,
          category:
            updatedTask.category ||
            categories[0]?.title ||
            "No category",
        },
        ...prev.filter(
          (task) =>
            task.id !== updatedTask.id
        ),
      ]);
    } else {
      setCompletedToday((prev) =>
        prev.filter(
          (task) =>
            task.id !== updatedTask.id
        )
      );
    }
  
    setIsEditModalOpen(false);
    setSelectedTask(null);
  
    if (completed) {
      anchorCompletedSectionSoon();
    } else {
      anchorTaskListSoon();
    }
  };

  /* ------------------------------------------------ */
  /* Archive Completed Today */
  /* ------------------------------------------------ */

  const archiveCompletedToday = () => {
    if (completedToday.length === 0) {
      return;
    }
    
    markLocalChangesPending();
    
    const completedIds =
      completedToday.map(
        (task) => task.id
      );
  
    /*
     * These remain visible in Archive until the user clears it.
     */
    setArchive((previousArchive) => {
      const existingIds = new Set(
        previousArchive.map(
          (task: any) => task.id
        )
      );
  
      const newArchiveItems =
        completedToday.filter(
          (task) =>
            !existingIds.has(task.id)
        );
  
      return [
        ...newArchiveItems,
        ...previousArchive,
      ];
    });
  
    /*
     * Keep a separate historical ledger for Insights.
     *
     * Only fields required for analytics and AI interpretation
     * are retained here.
     */
 /*
* Store every completion as an independent historical event.
*
* The same task may be completed more than once in the future,
* particularly when recurring and routine tasks are introduced.
*/
const completedInsightItems =
completedToday.map(
(task: any) => {
  const completedAt =
    task.completedAt ||
    new Date().toISOString();

  return {
    /*
     * Combining the source task ID and completion time
     * creates a stable ID for this specific completion.
     *
     * It prevents duplicate insertion from a repeated click,
     * while still allowing the same task to count again when
     * completed at a different time.
     */
    id: `${String(
      task.id
    )}:${completedAt}`,

    sourceTaskId: String(
      task.id
    ),

    title: String(
      task.title || ""
    ),

    category: String(
      task.category ||
        "No category"
    ),

    priority: String(
      task.priority ||
        "No priority"
    ),

    completedAt,

    notes: String(
      task.notes || ""
    ),

    whyThisMatters: String(
      task.whyThisMatters || ""
    ),

    aiReason: String(
      task.aiReason || ""
    ),
  };
}
);

setInsightsHistory(
(previousHistory) => {
const existingEventIds =
  new Set(
    previousHistory.map(
      (item: any) =>
        String(item.id)
    )
  );

const newHistoryItems =
  completedInsightItems.filter(
    (item) =>
      !existingEventIds.has(
        String(item.id)
      )
  );

return [
  ...newHistoryItems,
  ...previousHistory,
].sort(
  (taskA, taskB) =>
    new Date(
      taskB.completedAt || 0
    ).getTime() -
    new Date(
      taskA.completedAt || 0
    ).getTime()
);
}
);
  
    
  
    setCategories((previous) =>
      previous.map((category) => ({
        ...category,
        tasks:
          category.tasks.filter(
            (task: any) =>
              !completedIds.includes(
                task.id
              )
          ),
      }))
    );
  
    setCompletedToday([]);
  
    setArchiveToast(
      `${completedToday.length} completed item${
        completedToday.length > 1
          ? "s"
          : ""
      } archived`
    );
  
    window.setTimeout(() => {
      setArchiveToast("");
    }, 2200);
  };

  const clearArchive = () => {
    if (archive.length === 0) {
      return;
    }
  
    const confirmed =
      window.confirm(
        "Clear all archived items? Your Insights history and analytics will be preserved."
      );
  
      if (!confirmed) {
        return;
      }
      
      markLocalChangesPending();
      
      /*
       * Only clear the visible Archive list.
     * Do not clear insightsHistory.
     */
    setArchive([]);
  
    setArchiveToast(
      "Archive cleared. Insights preserved."
    );
  
    window.setTimeout(() => {
      setArchiveToast("");
    }, 2200);
  };

  /* ------------------------------------------------ */
  /* Reset App Data */
  /* ------------------------------------------------ */

  const resetAppData = () => {
    const confirmed =
      window.confirm(
        "Reset all Momentuhm data? This will permanently delete active tasks, completed tasks, archived items, Insights history, and everything Momentuhm has learned about your planning."
      );
  
      if (!confirmed) {
        return;
      }
      
      markLocalChangesPending();

      const initialCategories =
        createInitialCategories();
      
      setCategories(
        initialCategories
      );
  
    setArchive([]);
    setInsightsHistory([]);
    setCompletedToday([]);
    setManualFocusTaskIds([]);
    resetMemory();
    
    setSelectedCategory(
      initialCategories[0].title
    );
  
    setSelectedView("today");
  
    setTodayTaskSortMode(
      "date"
    );
  
    setTodayTaskGroupMode(
      "none"
    );
  
    setPriorityViewMode(
      "list"
    );
  
    setUpcomingViewMode(
      "calendar"
    );
  
    setThemeColor(
      DEFAULT_THEME_COLOR
    );
  
    setDarkMode(false);
    setDayEndTime("18:00");
    setUserRole("");
  
    if (
      typeof window !==
      "undefined"
    ) {
      window.localStorage.removeItem(
        MOBILE_GROUP_MODE_KEY
      );
  
      window.localStorage.removeItem(
        "momentuhm-archive-ai-insight-v1"
      );
    }
  
    setArchiveToast(
      "Momentuhm data reset"
    );
  
    window.setTimeout(() => {
      setArchiveToast("");
    }, 2200);
  };

  /* ------------------------------------------------ */
  /* Category Actions */
  /* ------------------------------------------------ */



  const addCategory = () => {
    const categoryTitle =
      newCategory.trim();
  
    if (!categoryTitle) {
      return;
    }
  
    if (categoryTitle === "-") {
      setArchiveToast(
        '"-" is reserved for tasks without a category'
      );
  
      window.setTimeout(() => {
        setArchiveToast("");
      }, 2500);
  
      return;
    }
  
    const categoryAlreadyExists =
      categories.some(
        (category) =>
          category.title
            .trim()
            .toLowerCase() ===
          categoryTitle.toLowerCase()
      );
  
    if (categoryAlreadyExists) {
      setArchiveToast(
        "A category with that name already exists"
      );
  
      window.setTimeout(() => {
        setArchiveToast("");
      }, 2500);
  
      return;
    }
  
    const categoryToAdd: Category = {
      id: crypto.randomUUID(),
      title: categoryTitle,
      tasks: [],
    };
  
    markLocalChangesPending();
  
    setCategories((previousCategories) => [
      ...previousCategories,
      categoryToAdd,
    ]);
  
    setSelectedCategory(
      categoryToAdd.title
    );
  
    setNewCategory("");
  };

  const renameCategory = (categoryId: string) => {
    if (!editingCategoryTitle.trim()) return;

    const oldCategory = categories.find((category) => category.id === categoryId);
    if (!oldCategory) return;

    const newTitle = editingCategoryTitle.trim();

    if (newTitle === "-") {
      setArchiveToast(
        '"-" is reserved for tasks without a category'
      );
    
      window.setTimeout(() => {
        setArchiveToast("");
      }, 2500);
    
      return;
    }
    
    const duplicateCategoryExists =
      categories.some(
        (category) =>
          category.id !== categoryId &&
          category.title
            .trim()
            .toLowerCase() ===
          newTitle.toLowerCase()
      );
    
    if (duplicateCategoryExists) {
      setArchiveToast(
        "A category with that name already exists"
      );
    
      window.setTimeout(() => {
        setArchiveToast("");
      }, 2500);
    
      return;
    }
    
    if (oldCategory.title === newTitle) {
      setEditingCategoryId(null);
      setEditingCategoryTitle("");
      return;
    }
    
    markLocalChangesPending();
    
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              title: newTitle,
            }
          : category
      )
    );

    if (selectedCategory === oldCategory.title) {
      setSelectedCategory(newTitle);
    }

    setCompletedToday((prev) =>
      prev.map((task) =>
        task.category === oldCategory.title
          ? {
              ...task,
              category: newTitle,
            }
          : task
      )
    );

    setInsightsHistory((previous) =>
      previous.map((task) =>
        task.category ===
        oldCategory.title
          ? {
              ...task,
              category: newTitle,
            }
          : task
      )
    );

    setArchive((prev) =>
      prev.map((task) =>
        task.category === oldCategory.title
          ? {
              ...task,
              category: newTitle,
            }
          : task
      )
    );

    setEditingCategoryId(null);
    setEditingCategoryTitle("");
  };

  const deleteCategory = (categoryId: string) => {
    const categoryToDelete = categories.find(
      (category) => category.id === categoryId
    );
  
    if (!categoryToDelete) return;
  
    /*
     * "-" is an internal storage bucket for tasks that no
     * longer belong to a visible category.
     *
     * It is hidden from the Categories page.
     */
    if (categoryToDelete.title === "-") {
      return;
    }
  
    const taskCount = Array.isArray(categoryToDelete.tasks)
      ? categoryToDelete.tasks.length
      : 0;
  
    const confirmed = window.confirm(
      taskCount > 0
        ? `Delete "${categoryToDelete.title}"? Its ${taskCount} task${
            taskCount === 1 ? "" : "s"
          } will remain without a category.`
        : `Delete "${categoryToDelete.title}"?`
    );
  
    if (!confirmed) {
      return;
    }
    
    markLocalChangesPending();
    
    setCategories((previousCategories) => {
      const categoryBeingDeleted =
        previousCategories.find(
          (category) =>
            category.id === categoryId
        );
  
      if (!categoryBeingDeleted) {
        return previousCategories;
      }
  
      const tasksToKeep = Array.isArray(
        categoryBeingDeleted.tasks
      )
        ? categoryBeingDeleted.tasks
        : [];
  
      const remainingCategories =
        previousCategories.filter(
          (category) =>
            category.id !== categoryId
        );
  
      const existingNoCategoryBucket =
        remainingCategories.find(
          (category) =>
            category.title === "-"
        );
  
      /*
       * If the deleted category has no tasks, simply remove it.
       */
      if (tasksToKeep.length === 0) {
        return remainingCategories;
      }
  
      /*
       * Reuse the existing hidden bucket when one already exists.
       */
      if (existingNoCategoryBucket) {
        return remainingCategories.map(
          (category) => {
            if (
              category.id !==
              existingNoCategoryBucket.id
            ) {
              return category;
            }
  
            return {
              ...category,
              tasks: [
                ...tasksToKeep,
                ...category.tasks,
              ],
            };
          }
        );
      }
  
      /*
       * Create the hidden bucket only when it is first needed.
       */
      return [
        ...remainingCategories,
        {
          id: crypto.randomUUID(),
          title: "-",
          tasks: tasksToKeep,
        },
      ];
    });
  
    /*
     * Completed, archived and Insights records store their
     * category separately, so update those values too.
     */
    setCompletedToday((previousTasks) =>
      previousTasks.map((task) =>
        task.category ===
        categoryToDelete.title
          ? {
              ...task,
              category: "-",
            }
          : task
      )
    );
  
    setArchive((previousTasks) =>
      previousTasks.map((task) =>
        task.category ===
        categoryToDelete.title
          ? {
              ...task,
              category: "-",
            }
          : task
      )
    );
  
    setInsightsHistory((previousTasks) =>
      previousTasks.map((task) =>
        task.category ===
        categoryToDelete.title
          ? {
              ...task,
              category: "-",
            }
          : task
      )
    );
  
    /*
     * Do not make the hidden "-" bucket the active category
     * for newly created tasks.
     */
    if (
      selectedCategory ===
      categoryToDelete.title
    ) {
      const nextVisibleCategory =
        categories.find(
          (category) =>
            category.id !== categoryId &&
            category.title !== "-"
        );
  
      setSelectedCategory(
        nextVisibleCategory?.title || ""
      );
    }
  
    if (
      editingCategoryId ===
      categoryId
    ) {
      setEditingCategoryId(null);
      setEditingCategoryTitle("");
    }
  
    setArchiveToast(
      taskCount > 0
        ? `${taskCount} task${
            taskCount === 1 ? "" : "s"
          } now have no category`
        : `"${categoryToDelete.title}" deleted`
    );
    
    window.setTimeout(() => {
      setArchiveToast("");
    }, 2500);
    };
    
    /* ------------------------------------------------ */
    /* Loading */
    /* ------------------------------------------------ */
    
    if (!isLoaded) {
      return <main className="min-h-screen bg-white" />;
    }

  return (
    <main
  style={
    {
      "--focus-inner": darkMode ? "#111111" : "#F7F7F5",
      "--focus-outer": darkMode ? "#FFFFFF" : "#181818",
    } as React.CSSProperties
  }
  className={`${fontClass} min-h-screen w-full overflow-x-hidden transition-colors duration-500 ${
    darkMode
      ? "bg-[#111111] text-white"
      : "bg-[#F7F7F5] text-[#181818]"
  }`}
>
    {darkMode && (
  <>
  <div className="pointer-events-none fixed inset-0 z-0 bg-[#111111]" />
    
  </>
)}

<FirecrackerLayer firecrackers={firecrackers} themeColor={themeColor} />
<Toast message={archiveToast} darkMode={darkMode} />

<Sidebar
  darkMode={darkMode}
  setDarkMode={updateDarkMode}
  selectedView={selectedView}
  setSelectedView={setSelectedView}
  themeColor={themeColor}
  inboxCount={inboxTasks.length}
  pendingSuggestionCount={suggestionReviewTasks.length}
  onOpenSuggestedDates={() =>
    setIsSuggestionsModalOpen(true)
  }
/>

<button
id="momentuhm-tour-help-button"
type="button"
onClick={openQuickTutorial}
aria-label="Open quick tutorial"
title="How Momentuhm works"
className={`fixed right-[76px] top-5 z-[175] inline-flex h-9 items-center justify-center gap-2 rounded-full border px-2.5 text-[11px] font-[650] shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition active:scale-[0.97] sm:right-[170px] sm:top-[14px] sm:h-10 sm:px-3.5 ${
  darkMode
    ? "border-white/[0.12] bg-[#202124]/95 text-white/72 hover:bg-[#292A2E] hover:text-white"
    : "border-[#DADCE0] bg-white/95 text-[#3C4043] hover:bg-[#F1F3F4] hover:text-[#202124]"
}`}
>
<HelpCircle
  size={16}
  strokeWidth={1.8}
/>

<span className="hidden sm:inline">
  How it works
</span>
</button>

<div className="relative z-10 min-h-screen w-full overflow-x-hidden">
  <div className="w-full min-w-0 overflow-x-hidden px-3 pb-28 pt-5 sm:px-5 sm:pb-28 sm:pt-[96px] md:px-6 lg:pl-[276px] lg:pr-6 2xl:pb-16 2xl:pr-8">
    <div className="w-full min-w-0 overflow-x-hidden">
            {selectedView === "today" && (
            <TodayView
            darkMode={darkMode}
            insightsHistory={insightsHistory}
            setDarkMode={updateDarkMode}
            themeColor={themeColor}
            glass={glass}
            strongerGlass={strongerGlass}
            border={border}
            allTasks={allTasks}
            prioritizedTasks={prioritizedTasks}
taskSortMode={todayTaskSortMode}
setTaskSortMode={updateTodayTaskSortMode}
taskGroupMode={todayTaskGroupMode}
setTaskGroupMode={updateTodayTaskGroupMode}
highPriorityCount={highPriorityCount}
            dueSoonCount={dueSoonCount}
            completionPercent={completionPercent}
            taskTabTotalCount={taskTabTotalCount}
            taskTabCompletedCount={taskTabCompletedToday.length}
            suggestedDateCount={suggestedDateCount}
            completedToday={completedToday}
            boostMessage={boostMessage}
            boostLoading={boostLoading}
            dayEndTime={dayEndTime}
            setDayEndTime={updateDayEndTime}
            dayTimeRemaining={dayTimeRemaining}
            newTask={newTask}
setNewTask={setNewTask}
newTaskWhy={newTaskWhy}
setNewTaskWhy={setNewTaskWhy}
addTask={addTask}
toggleTaskById={toggleTaskById}
toggleSubtaskById={
  toggleSubtaskById
}
deleteTask={deleteTask}
            acceptSuggestedDateById={acceptSuggestedDateById}
            setSelectedTask={setSelectedTask}
            setIsEditModalOpen={setIsEditModalOpen}
            setIsSuggestionsModalOpen={setIsSuggestionsModalOpen}
            setIsExtractModalOpen={setIsExtractModalOpen}
            setExtractInput={setExtractInput}
            enableClipboardAssist={enableClipboardAssist}
            archiveCompletedToday={archiveCompletedToday}
            restoreCompletedTask={restoreCompletedTask}
            suggestingTaskIds={suggestingTaskIds}
            manualFocusTaskIds={manualFocusTaskIds}
            setManualFocusTaskIds={updateManualFocusTaskIds}
togglePinTask={togglePinTask}
            selectWhySuggestion={selectWhySuggestion}
            taskListRef={taskListRef}
anchorTaskListSoon={anchorTaskListSoon}
anchorTaskWorkspaceTabsSoon={
anchorTaskWorkspaceTabsSoon
}
newlyAddedTaskIds={newlyAddedTaskIds}
            userFirstName={user?.firstName || ""}
            refreshLatestStatus={refreshLatestStatus}
isRefreshingStatus={isRefreshingStatus}
userPlanningProfile={userPlanningProfile}
/>
            )}

{selectedView === "priorities" && (
<PrioritiesView
  darkMode={darkMode}
  border={border}
  className={strongerGlass}
  glass={glass}
  strongerGlass={strongerGlass}
  themeColor={themeColor}
  viewMode={priorityViewMode}
  setViewMode={updatePriorityViewMode}
  highPriorityTasks={highPriorityTasks}
  mediumPriorityTasks={mediumPriorityTasks}
  lowPriorityTasks={lowPriorityTasks}
  completedToday={completedToday}
  archiveCompletedToday={
    archiveCompletedToday
  }
  restoreCompletedTask={
    restoreCompletedTask
  }
  toggleTaskById={
    toggleTaskById
  }
  deleteTask={deleteTask}
  setSelectedTask={
    setSelectedTask
  }
  setIsEditModalOpen={
    setIsEditModalOpen
  }
  manualFocusTaskIds={
    manualFocusTaskIds
  }
  toggleFocusTask={
    toggleFocusTask
  }
/>
)}

{selectedView === "upcoming" && (
<UpcomingView
  darkMode={darkMode}
  border={border}
  className={strongerGlass}
  themeColor={themeColor}
  viewMode={upcomingViewMode}
  setViewMode={
    updateUpcomingViewMode
  }
  todayTasks={todayTasks}
  tomorrowTasks={
    tomorrowTasks
  }
  laterTasks={laterTasks}
  noDateTasks={noDateTasks}
  toggleTaskById={
    toggleTaskById
  }
  deleteTask={deleteTask}
  acceptSuggestedDateById={
    acceptSuggestedDateById
  }
  setSelectedTask={
    setSelectedTask
  }
  setIsEditModalOpen={
    setIsEditModalOpen
  }
  manualFocusTaskIds={
    manualFocusTaskIds
  }
  toggleFocusTask={
    toggleFocusTask
  }
/>
)}

{selectedView === "inbox" && (
<InboxView
  darkMode={darkMode}
  border={border}
  className={strongerGlass}
  themeColor={themeColor}
  inboxTasks={inboxTasks}
  enableAppSuggestions={
    enableAppSuggestions
  }
  toggleTaskById={
    toggleTaskById
  }
  deleteTask={deleteTask}
  scheduleTaskById={
    scheduleTaskById
  }
  setSelectedTask={
    setSelectedTask
  }
  setIsEditModalOpen={
    setIsEditModalOpen
  }
  manualFocusTaskIds={
    manualFocusTaskIds
  }
  toggleFocusTask={
    toggleFocusTask
  }
/>
)}

{selectedView === "archive" && (
<ArchiveView
  key="archive-view"
  mode="archive"
  archive={archive}
  clearArchive={clearArchive}
  darkMode={darkMode}
/>
)}

{selectedView === "insights" && (
<ArchiveView
  key="insights-view"
  mode="insights"
  archive={insightsHistory}
  clearArchive={clearArchive}
  darkMode={darkMode}
/>
)}

            {selectedView === "categories" && (
              <CategoriesView
              darkMode={darkMode}
              categories={categories}
                newCategory={newCategory}
                setNewCategory={setNewCategory}
                addCategory={addCategory}
                editingCategoryId={editingCategoryId}
                setEditingCategoryId={setEditingCategoryId}
                editingCategoryTitle={editingCategoryTitle}
                setEditingCategoryTitle={setEditingCategoryTitle}
                renameCategory={renameCategory}
                deleteCategory={deleteCategory}
                themeColor={themeColor}
                input={input}
                glass={glass}
                strongerGlass={strongerGlass}
                border={border}
              />
            )}

{selectedView === "settings" && (
  <SettingsView
    darkMode={darkMode}
    userRole={userRole}
    setUserRole={updateUserRole}
    enableAppSuggestions={enableAppSuggestions}
    setEnableAppSuggestions={updateEnableAppSuggestions}
    enableAutoPriority={enableAutoPriority}
    setEnableAutoPriority={updateEnableAutoPriority}
    enableClipboardAssist={enableClipboardAssist}
    setEnableClipboardAssist={updateEnableClipboardAssist}
    archiveCount={archive.length}
    clearArchive={clearArchive}
    resetAppData={resetAppData}
    border={border}
    className={strongerGlass}
    input={input}
  />
)}

          
          </div>
        </div>
      </div>

      <MobileBottomNav
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        inboxCount={inboxTasks.length}
        darkMode={darkMode}
        themeColor={themeColor}
      />

<AnimatePresence initial={false} mode="sync">
{showRevisionConflictModal && (
  <RevisionConflictModal
    key="revision-conflict"
    darkMode={darkMode}
    onStay={() => {
      setShowRevisionConflictModal(
        false
      );
    }}
    onReload={() => {
      window.location.reload();
    }}
  />
)}

{isTutorialOpen && (
  <QuickTutorial
    key="quick-tutorial"
    isOpen={isTutorialOpen}
    stepIndex={tutorialStep}
    setStepIndex={setTutorialStep}
    darkMode={darkMode}
    onSkip={finishQuickTutorial}
    onFinish={finishQuickTutorial}
  />
)}

{!isTutorialOpen &&
  showDueReminderPopup &&
  todayTasks.length > 0 && (
  <DueTasksReminderPopup
    key="due-tasks-reminder"
    tasks={todayTasks}
    themeColor={themeColor}
    darkMode={darkMode}
    timeRemainingLabel={dayTimeRemaining.label}
    onClose={closeDueReminderPopup}
    onViewAll={viewDueReminderTasks}
    onOpenTask={openDueReminderTask}
  />
)}

{!isTutorialOpen &&
CLIPBOARD_ASSIST_ENABLED_FOR_TESTING &&
enableClipboardAssist &&
showClipboardPrompt &&
clipboardCandidate && (
  <ClipboardAssistPrompt
  key="clipboard-assist"
  text={clipboardCandidate}
  themeColor={themeColor}
  darkMode={darkMode}
  loading={clipboardExtractLoading}
  error={clipboardExtractError}
  extractedTasks={clipboardExtractedTasks}
  onClose={dismissClipboardCandidate}
  onAddAsIs={addClipboardCandidateAsTask}
  onToggleTask={toggleClipboardExtractedTask}
  onAddSelected={
    addSelectedClipboardExtractedTasks
  }
  onAddAsSubtasks={
    addSelectedClipboardTasksAsSubtasks
  }
/>
  )}

{isExtractModalOpen && (
  <ExtractTasksModal
    key="extract-tasks"
    extractInput={extractInput}
    setExtractInput={setExtractInput}
    extractLoading={extractLoading}
    extractError={extractError}
    extractedTasks={extractedTasks}
    setIsExtractModalOpen={setIsExtractModalOpen}
    extractTasksFromText={extractTasksFromText}
    toggleExtractedTask={toggleExtractedTask}
    addSelectedExtractedTasks={addSelectedExtractedTasks}
    themeColor={themeColor}
    darkMode={darkMode}
    glass={glass}
    strongerGlass={strongerGlass}
    border={border}
  />
)}

{isSuggestionsModalOpen && (
  <SuggestionsReviewModal
    key="suggestions-review"
    tasks={suggestionReviewTasks}
    darkMode={darkMode}
    themeColor={themeColor}
    glass={glass}
    strongerGlass={strongerGlass}
    border={border}
    setIsSuggestionsModalOpen={setIsSuggestionsModalOpen}
    acceptSuggestedDateById={acceptSuggestedDateById}
    acceptAllSuggestedDates={acceptAllSuggestedDates}
    setSelectedTask={setSelectedTask}
    setIsEditModalOpen={setIsEditModalOpen}
  />
)}

{isEditModalOpen && selectedTask && (
 <EditTaskModal
 key="edit-task"
 selectedTask={selectedTask}
 setSelectedTask={setSelectedTask}
 setIsEditModalOpen={setIsEditModalOpen}
 saveTaskChanges={saveTaskChanges}
 updateTaskSubtasksImmediately={
   updateTaskSubtasksImmediately
 }
    deleteTaskEverywhere={deleteTaskEverywhere}
    restoreCompletedTask={restoreCompletedTask}
    categories={categories}
    themeColor={themeColor}
    darkMode={darkMode}
    input={input}
    modalSelect={modalSelect}
    glass={glass}
    strongerGlass={strongerGlass}
    border={border}
    manualFocusTaskIds={manualFocusTaskIds}
    setManualFocusTaskIds={updateManualFocusTaskIds}
  />
)}
</AnimatePresence>


<style jsx global>{`
  html {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    scrollbar-gutter: stable;
    overscroll-behavior-x: none;
  }

  body {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    overscroll-behavior-x: none;
  }

  #__next {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  @supports not (scrollbar-gutter: stable) {
    body {
      overflow-y: scroll;
    }
  }

  .Momentuhm-mobile-category-tabs {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .Momentuhm-mobile-category-tabs::-webkit-scrollbar {
    display: none;
  }

  button:focus-visible,
  a:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  [tabindex]:not([tabindex="-1"]):focus-visible {
    outline: 2px solid var(--focus-outer) !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 2px var(--focus-inner) !important;
  }

  .task-capture-input:focus,
.task-capture-input:focus-visible {
  outline: none !important;
  outline-offset: 0 !important;
  box-shadow: none !important;
  border-color: transparent !important;
}




  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto !important;
    }

    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  @keyframes veiraNewTaskGlow {
    0% {
      background-color: rgba(24, 24, 24, 0.08);
      box-shadow: 0 0 0 1px rgba(24, 24, 24, 0.16);
    }

    42% {
      background-color: rgba(24, 24, 24, 0.05);
      box-shadow: 0 0 0 1px rgba(24, 24, 24, 0.1);
    }

    72% {
      background-color: rgba(24, 24, 24, 0.025);
      box-shadow: 0 0 0 1px rgba(24, 24, 24, 0.05);
    }

    100% {
      background-color: transparent;
      box-shadow: none;
    }
  }
`}</style>


    </main>
  );
}

/* ------------------------------------------------ */
/* Revision Conflict Modal */
/* ------------------------------------------------ */

function RevisionConflictModal({
  darkMode,
  onStay,
  onReload,
}: {
  darkMode: boolean;
  onStay: () => void;
  onReload: () => void;
}) {
  /*
   * Let Escape dismiss the modal without pretending
   * that the rejected local change was saved.
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onStay();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onStay]);

  return (
    <motion.div
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
        duration: 0.18,
      }}
      className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-[3px] sm:px-6"
    >
      <motion.section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="revision-conflict-title"
        aria-describedby="revision-conflict-description"
        initial={{
          opacity: 0,
          y: 16,
          scale: 0.97,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 10,
          scale: 0.98,
        }}
        transition={{
          type: "spring",
          stiffness: 360,
          damping: 30,
          mass: 0.85,
        }}
        className={`w-full max-w-[420px] overflow-hidden rounded-[18px] border shadow-[0_28px_90px_rgba(0,0,0,0.35)] ${
          darkMode
            ? "border-white/[0.12] bg-[#1B1C20] text-white"
            : "border-[#DADCE0] bg-white text-[#202124]"
        }`}
      >
        <div className="px-5 pb-5 pt-6 text-center sm:px-6 sm:pt-7">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
              darkMode
                ? "bg-violet-400/12 text-violet-300"
                : "bg-violet-50 text-violet-600"
            }`}
          >
            <RotateCcw
              size={22}
              strokeWidth={1.9}
            />
          </div>

          <h2
            id="revision-conflict-title"
            className="mt-4 text-[20px] font-[740] leading-tight tracking-[-0.035em]"
          >
            Newer changes found
          </h2>

          <p
            id="revision-conflict-description"
            className={`mx-auto mt-2 max-w-[340px] text-[12px] font-[500] leading-5 ${
              darkMode
                ? "text-white/58"
                : "text-[#5F6368]"
            }`}
          >
            Another device saved a newer
            version of your tasks. Your
            latest change on this device
            was not saved.
          </p>

          <div
            className={`mt-4 rounded-[10px] border px-3.5 py-3 text-left ${
              darkMode
                ? "border-amber-300/15 bg-amber-300/[0.06]"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <p
              className={`text-[10.5px] font-[600] leading-4 ${
                darkMode
                  ? "text-amber-100/80"
                  : "text-amber-800"
              }`}
            >
              Reloading will load the
              latest saved version. The
              unsaved change currently
              visible on this device will
              be removed.
            </p>
          </div>
        </div>

        <footer
          className={`flex flex-col gap-2 border-t px-4 py-4 sm:flex-row-reverse sm:px-5 ${
            darkMode
              ? "border-white/[0.09] bg-white/[0.018]"
              : "border-[#E8EAED] bg-[#FAFAFB]"
          }`}
        >
          <button
            type="button"
            autoFocus
            onClick={onReload}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-violet-600 px-4 text-[12px] font-[700] text-white transition hover:bg-violet-700 active:scale-[0.98] sm:flex-1"
          >
            <RotateCcw
              size={15}
              strokeWidth={1.9}
            />

            Reload latest changes
          </button>

          <button
            type="button"
            onClick={onStay}
            className={`h-11 w-full rounded-[10px] border px-4 text-[12px] font-[650] transition active:scale-[0.98] sm:flex-1 ${
              darkMode
                ? "border-white/[0.11] text-white/62 hover:bg-white/[0.06] hover:text-white"
                : "border-[#DADCE0] bg-white text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]"
            }`}
          >
            Stay here
          </button>
        </footer>
      </motion.section>
    </motion.div>
  );
}

/* ------------------------------------------------ */
/* Views */
/* ------------------------------------------------ */

function TodayView({
  darkMode,
  insightsHistory,
  setDarkMode,
  themeColor,
  glass,
  strongerGlass,
  border,
  allTasks,
  prioritizedTasks,
  taskSortMode,
  setTaskSortMode,
  taskGroupMode,
  setTaskGroupMode,
  highPriorityCount,
  dueSoonCount,
completionPercent,
taskTabTotalCount,
taskTabCompletedCount,
suggestedDateCount,
completedToday,
  boostMessage,
  boostLoading,
  dayEndTime,
  setDayEndTime,
  dayTimeRemaining,
  newTask,
  setNewTask,
  newTaskWhy,
  setNewTaskWhy,
  addTask,
  toggleTaskById,
  toggleSubtaskById,
  deleteTask,
  acceptSuggestedDateById,
setSelectedTask,
setIsEditModalOpen,
setIsSuggestionsModalOpen,
setIsExtractModalOpen,
setExtractInput,
enableClipboardAssist,
archiveCompletedToday,
  restoreCompletedTask,
  suggestingTaskIds,
  manualFocusTaskIds,
  setManualFocusTaskIds,
  togglePinTask,
  selectWhySuggestion,
  taskListRef,
  anchorTaskListSoon,
  anchorTaskWorkspaceTabsSoon,
  newlyAddedTaskIds,
  userFirstName,
refreshLatestStatus,
isRefreshingStatus,
userPlanningProfile,
}: any) {
const [showMorningBrief, setShowMorningBrief] =
useState(false);

const taskInputRef =
useRef<HTMLInputElement | null>(
  null
);

const [
  planningHorizon,
  setPlanningHorizon,
] = useState<
  "tasks" | "backlog"
>("tasks");

/*
 * Completion anchoring dispatches this event before searching
 * for the Completed section.
 *
 * Mobile already responds to this event. Desktop must also
 * switch from Backlog to Tasks because CompletedTodaySection
 * only exists in the Tasks workspace.
 */
useEffect(() => {
  const openTasksWorkspace = () => {
    setPlanningHorizon("tasks");
  };

  window.addEventListener(
    "momentuhm:open-tasks",
    openTasksWorkspace
  );

  return () => {
    window.removeEventListener(
      "momentuhm:open-tasks",
      openTasksWorkspace
    );
  };
}, []);

useEffect(() => {
  const focusTimer = window.setTimeout(() => {
    taskInputRef.current?.focus();
  }, 120);

  return () => window.clearTimeout(focusTimer);
}, []);

  const submitNewTask = () => {
    if (!newTask.trim()) {
      taskInputRef.current?.focus();
      return;
    }

    void addTask();

    window.requestAnimationFrame(() => {
      taskInputRef.current?.focus();
    });
  };

  const handleTaskInputPaste = (
    event: React.ClipboardEvent<HTMLInputElement>
  ) => {
    /*
     * When Clipboard Assist is disabled, allow the browser
     * to paste normally without opening the extraction modal.
     */
    if (!enableClipboardAssist) return;
  
    const pastedText = event.clipboardData
      .getData("text")
      .trim();
  
    const shouldExtract =
      pastedText.includes("\n") ||
      pastedText.length >= 120;
  
    if (!shouldExtract) return;
  
    event.preventDefault();
    setExtractInput(pastedText);
    setIsExtractModalOpen(true);
  };

  const [morningBrief, setMorningBrief] = useState({
    quote: "Small steps still move the day forward.",
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetingWithName = `${greeting}${userFirstName ? `, ${userFirstName}.` : "."}`;

  useEffect(() => {
    const now = new Date();
    const morningBriefKey = `Momentuhm-morning-brief-${getTodayDate()}`;

    if (now.getHours() < 7 || now.getHours() >= 10) return;

    const cachedBrief = localStorage.getItem(morningBriefKey);

    if (cachedBrief) {
      try {
        setMorningBrief(JSON.parse(cachedBrief));
        setShowMorningBrief(true);
        return;
      } catch {
        localStorage.removeItem(morningBriefKey);
      }
    }

    const loadMorningBrief = async () => {
      try {
        const response = await fetch("/api/morning-brief", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dueSoonCount,
            highPriorityCount,
            completedTodayCount: completedToday.length,
            activeTaskCount: prioritizedTasks.length,
          }),
        });

        const data = await response.json();
        const nextBrief = {
          quote: data.quote || "Small steps still move the day forward.",
        };

        setMorningBrief(nextBrief);
        setShowMorningBrief(true);
        localStorage.setItem(morningBriefKey, JSON.stringify(nextBrief));
      } catch {
        setShowMorningBrief(true);
      }
    };

    void loadMorningBrief();
  }, [
    dueSoonCount,
    highPriorityCount,
    completedToday.length,
    prioritizedTasks.length,
  ]);

  const dashboardBorder = darkMode
    ? "border-white/[0.10]"
    : "border-[#DDDDE3]";

  const dashboardSurface = darkMode
    ? "bg-[#14171B]"
    : "bg-white";

  const mutedText = darkMode
    ? "text-white/52"
    : "text-[#6B6F7B]";

    const insightText =
    completedToday.length === 0
      ? "One clear step at a time."
      : completionPercent >= 80
      ? "Excellent momentum. Finish strong."
      : completionPercent >= 50
      ? "Great progress. Keep moving."
      : completedToday.length >= 3
      ? "Strong progress. Stay focused."
      : "Nice start. Keep going.";
  
/*
* The planning horizons affect only the main
* task-list area. The greeting, Day Left,
* Add Task panel and Focus panel stay unchanged.
*/

/*
 * Tasks remain in the Tasks tab by default.
 *
 * A task enters Backlog only when the user explicitly
 * selects "Move to backlog".
 */
const planningTasks = useMemo(() => {
  return prioritizedTasks.filter(
    (task: any) =>
      !Boolean(task.isBacklog)
  );
}, [prioritizedTasks]);

const planningBacklogTasks = useMemo(() => {
  return prioritizedTasks.filter(
    (task: any) =>
      Boolean(task.isBacklog)
  );
}, [prioritizedTasks]);
  
  return (
    <>
      <MobileTodayAppView
  darkMode={darkMode}
  setDarkMode={setDarkMode}
  themeColor={themeColor}
        strongerGlass={strongerGlass}
        border={border}
        allTasks={allTasks}
        prioritizedTasks={planningTasks}
        completedToday={completedToday}
        completionPercent={completionPercent}
        taskTabTotalCount={taskTabTotalCount}
        taskTabCompletedCount={taskTabCompletedCount}
        dayTimeRemaining={dayTimeRemaining}
        dayEndTime={dayEndTime}
        setDayEndTime={setDayEndTime}
        newTask={newTask}
        setNewTask={setNewTask}
        newTaskWhy={newTaskWhy}
        setNewTaskWhy={setNewTaskWhy}
        addTask={addTask}
        setIsExtractModalOpen={setIsExtractModalOpen}
        toggleTaskById={toggleTaskById}
        deleteTask={deleteTask}
        setSelectedTask={setSelectedTask}
        setIsEditModalOpen={setIsEditModalOpen}
        manualFocusTaskIds={manualFocusTaskIds}
        setManualFocusTaskIds={setManualFocusTaskIds}
        archiveCompletedToday={archiveCompletedToday}
        restoreCompletedTask={restoreCompletedTask}
        anchorTaskListSoon={anchorTaskListSoon}
        userFirstName={userFirstName}
        refreshLatestStatus={refreshLatestStatus}
        isRefreshingStatus={isRefreshingStatus}
        />

      <div className="hidden sm:block">
        <div className="mx-auto w-full max-w-[1500px]">
          <div className="grid min-w-0 items-start gap-3 lg:grid-cols-2">
            {/* Left: daily planning */}
            <section
              aria-label="Daily planning workspace"
              className={`min-w-0 rounded-[14px] border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] xl:p-6 ${dashboardBorder} ${dashboardSurface}`}
            >
              <header className="mb-5">
                <div className="grid min-w-0 gap-5 min-[1180px]:grid-cols-[minmax(0,1fr)_300px] min-[1180px]:items-center">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        darkMode ? "bg-violet-400/10 text-violet-300" : "bg-violet-50 text-violet-600"
                      }`}
                    >
                      <Sparkles size={22} strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0">
                      <h1
                        className={`text-[24px] font-[760] leading-tight tracking-[-0.045em] xl:text-[24px] ${
                          darkMode ? "text-white" : "text-[#15171C]"
                        }`}
                      >
                        {greetingWithName}
                      </h1>

                      <p
                        title={insightText}
                        className={`mt-1.5 line-clamp-1 text-[13px] font-[500] leading-5 ${mutedText}`}
                      >
                        {insightText}
                      </p>
                    </div>
                  </div>

                  <div
id="momentuhm-tour-progress-desktop"
className="grid grid-cols-3 gap-3"
>
                    {[
                    {
                      label: "Tasks",
                      value: taskTabTotalCount,
                      valueClass: darkMode
                        ? "text-blue-300"
                        : "text-blue-600",
                    },
                    {
                      label: "Completed",
                      value: taskTabCompletedCount,
                      valueClass: darkMode
                        ? "text-emerald-300"
                        : "text-emerald-600",
                    },
                    {
                      label: "Progress",
                      value: `${completionPercent}%`,
                      valueClass: darkMode
                        ? "text-violet-300"
                        : "text-violet-600",
                    },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className={`flex min-h-[78px] min-w-0 flex-col items-center justify-center rounded-[11px] border px-2 text-center ${dashboardBorder}`}
                      >
                        <p
                          className={`text-[25px] font-[720] leading-none tracking-[-0.055em] ${metric.valueClass}`}
                        >
                          {metric.value}
                        </p>
                        <p
                          className={`mt-2 text-[10px] font-[700] uppercase tracking-[0.06em] ${mutedText}`}
                        >
                          {metric.label}
                        </p>
                      </div>
                    ))}
                                  </div>
                </div>

                {/* Time remaining in the working day */}
                <div
                  className={`mt-4 border-t pt-3 ${dashboardBorder}`}
                >
                  <DayTimeLeftCard
                    dayEndTime={dayEndTime}
                    setDayEndTime={setDayEndTime}
                    dayTimeRemaining={dayTimeRemaining}
                    darkMode={darkMode}
                    themeColor={
                      darkMode ? "#FFFFFF" : "#181818"
                    }
                  />
                </div>
              </header>

              {/* Add task */}
              <section
id="momentuhm-tour-capture-desktop"
className="relative mb-5"
>
                <div
                  role="group"
                  aria-label="Create a new task"
                  onClick={() => taskInputRef.current?.focus()}
                  className={`flex min-h-[58px] w-full cursor-text items-center gap-2 rounded-[11px] border px-3.5 transition focus-within:ring-2 focus-within:ring-violet-500/10 ${
                    darkMode
                      ? "border-white/[0.10] bg-white/[0.025] focus-within:border-white/[0.22]"
                      : "border-[#DDDDE3] bg-white focus-within:border-[#BFC0C8]"
                  }`}
                >
                  <button
                    type="button"
                    data-testid="desktop-add-task-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (newTask.trim()) {
                        void submitNewTask();
                      } else {
                        taskInputRef.current?.focus();
                      }
                    }}
                    aria-label={newTask.trim() ? "Add task" : "Focus task input"}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
                      darkMode
                        ? "border-white/[0.10] bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"
                        : "border-[#DDDDE3] bg-[#F5F6F8] text-[#4F5562] hover:bg-[#ECEEF2]"
                    }`}
                  >
                    <Plus size={19} strokeWidth={1.7} />
                  </button>

                  <input
                    ref={taskInputRef}
                    data-testid="desktop-task-input"
                    autoFocus
                    value={newTask}
                    onChange={(event) => setNewTask(event.target.value)}
                    onPaste={handleTaskInputPaste}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void submitNewTask();
                      }
                    }}
                    placeholder="Add a task. Momentuhm will organize it for you."
                    aria-label="Add a new task"
                    className={`task-capture-input h-[56px] min-w-0 flex-1 border-0 bg-transparent px-0 text-[14px] font-[500] outline-none ring-0 ${
                      darkMode
                        ? "text-white placeholder:text-white/38 caret-white"
                        : "text-[#252933] placeholder:text-[#747986] caret-[#252933]"
                    }`}
                  />

                  <div
                    className="flex shrink-0 items-center gap-1"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setIsSuggestionsModalOpen(true)}
                      aria-label="Review suggested dates"
                      title="Review suggested dates"
                      className={`flex h-9 w-9 items-center justify-center rounded-[8px] transition ${
                        darkMode
                          ? "text-white/48 hover:bg-white/[0.06] hover:text-white"
                          : "text-[#626875] hover:bg-[#F2F3F6] hover:text-[#252933]"
                      }`}
                    >
                      <Calendar size={17} strokeWidth={1.7} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsExtractModalOpen(true)}
                      aria-label="Extract tasks from text"
                      title="Extract tasks from text"
                      className={`flex h-9 w-9 items-center justify-center rounded-[8px] transition ${
                        darkMode
                          ? "text-white/48 hover:bg-white/[0.06] hover:text-white"
                          : "text-[#626875] hover:bg-[#F2F3F6] hover:text-[#252933]"
                      }`}
                    >
                      <Sparkles size={17} strokeWidth={1.7} />
                    </button>
                  </div>
                </div>
              </section>

            {/* Planning horizons */}
{/* Task workspace views */}
<section
id="Momentuhm-task-workspace-tabs"
aria-label="Task workspace"
className={`mb-4 grid grid-cols-2 overflow-hidden rounded-[11px] border p-[3px] ${
  darkMode
    ? "border-white/[0.10] bg-white/[0.035]"
    : "border-[#DDDDE3] bg-[#F6F7F9]"
}`}
>
{[
  {
    value: "tasks",
    label: "Tasks",
    count:
      planningTasks.length,
    icon: ListChecks,
  },
  {
    value: "backlog",
    label: "Backlog",
    count:
      planningBacklogTasks.length,
    icon: List,
  },
].map((option) => {
  const Icon =
    option.icon;

  const isActive =
    planningHorizon ===
    option.value;

  return (
    <button
      key={option.value}
      type="button"
      onClick={() => {
        setPlanningHorizon(
          option.value as
            | "tasks"
            | "backlog"
        );
      
        anchorTaskWorkspaceTabsSoon();
      }}
      aria-pressed={isActive}
      className={`relative flex min-h-[46px] items-center justify-center gap-2 rounded-[8px] px-3 text-[11px] font-[650] transition active:scale-[0.99] ${
        isActive
          ? darkMode
            ? "bg-[#303134] text-white shadow-[0_1px_3px_rgba(0,0,0,0.28)]"
            : "bg-white text-[#202124] shadow-[0_1px_3px_rgba(60,64,67,0.16)]"
          : darkMode
          ? "text-white/48 hover:text-white/76"
          : "text-[#626875] hover:text-[#252933]"
      }`}
    >
      <Icon
        size={15}
        strokeWidth={1.7}
      />

      <span>
        {option.label}
      </span>

      <span
        className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-[700] ${
          isActive
            ? darkMode
              ? "bg-white/[0.10] text-white/72"
              : "bg-[#F0F1F4] text-[#4F5562]"
            : darkMode
            ? "bg-white/[0.05] text-white/38"
            : "bg-black/[0.035] text-[#777D88]"
        }`}
      >
        {option.count}
      </span>

      {isActive && (
        <span
          aria-hidden="true"
          className={`absolute bottom-0 left-5 right-5 h-[2px] rounded-full ${
            darkMode
              ? "bg-violet-300"
              : "bg-violet-600"
          }`}
        />
      )}
    </button>
  );
})}
</section>

{planningHorizon ===
"tasks" && (
<>
  <TaskListPanel
    title="Tasks"
    description="Your scheduled work"
    tasks={
      planningTasks
    }
    sortMode={
      taskSortMode
    }
    setSortMode={
      setTaskSortMode
    }
    groupMode={
      taskGroupMode
    }
    setGroupMode={
      setTaskGroupMode
    }
    darkMode={darkMode}
    border={border}
    className={
      strongerGlass
    }
    themeColor="#181818"
    toggleTaskById={
      toggleTaskById
    }
    toggleSubtaskById={
      toggleSubtaskById
    }
    suggestingTaskIds={
      suggestingTaskIds
    }
    deleteTask={
      deleteTask
    }
    acceptSuggestedDateById={
      acceptSuggestedDateById
    }
    setSelectedTask={
      setSelectedTask
    }
    setIsEditModalOpen={
      setIsEditModalOpen
    }
    emptyMessage="No scheduled tasks yet."
    ranked
    draggableTasks
    manualFocusTaskIds={
      manualFocusTaskIds
    }
    setManualFocusTaskIds={
      setManualFocusTaskIds
    }
    togglePinTask={
      togglePinTask
    }
    selectWhySuggestion={
      selectWhySuggestion
    }
    taskListRef={
      taskListRef
    }
    anchorTaskListSoon={
      anchorTaskWorkspaceTabsSoon
    }
    newlyAddedTaskIds={
      newlyAddedTaskIds
    }
    onFocusCapture={() =>
      taskInputRef.current?.focus()
    }
  />

<CompletedTodaySection
  sectionId="Momentuhm-desktop-completed-anchor"
  completedToday={
    completedToday
  }
  restoreCompletedTask={
    restoreCompletedTask
  }
  archiveCompletedToday={
    archiveCompletedToday
  }
  setSelectedTask={
    setSelectedTask
  }
  setIsEditModalOpen={
    setIsEditModalOpen
  }
  darkMode={darkMode}
  border={border}
/>
</>
)}

{planningHorizon ===
"backlog" && (
<TaskListPanel
  title="Backlog"
  description="Tasks you moved out of your active list"
  tasks={
    planningBacklogTasks
  }
  sortMode="priority"
  setSortMode={() => {}}
  groupMode="priority"
  setGroupMode={() => {}}
  darkMode={darkMode}
  border={border}
  className={
    strongerGlass
  }
  themeColor="#181818"
  toggleTaskById={
    toggleTaskById
  }
  suggestingTaskIds={
    suggestingTaskIds
  }
  deleteTask={
    deleteTask
  }
  acceptSuggestedDateById={
    acceptSuggestedDateById
  }
  setSelectedTask={
    setSelectedTask
  }
  setIsEditModalOpen={
    setIsEditModalOpen
  }
  emptyMessage="Your backlog is clear."
  draggableTasks
  manualFocusTaskIds={
    manualFocusTaskIds
  }
  setManualFocusTaskIds={
    setManualFocusTaskIds
  }
  togglePinTask={
    togglePinTask
  }
  selectWhySuggestion={
    selectWhySuggestion
  }
  taskListRef={
    taskListRef
  }
  anchorTaskListSoon={
    anchorTaskWorkspaceTabsSoon
  }
  newlyAddedTaskIds={
    newlyAddedTaskIds
  }
  onFocusCapture={() =>
    taskInputRef.current?.focus()
  }
/>
)}
            </section>

            {/* Right: focus execution */}
            <aside
id="momentuhm-tour-focus-desktop"
aria-label="Focus workspace"
  className={`min-w-0 self-start rounded-[14px] border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] xl:p-6 ${dashboardBorder} ${dashboardSurface}`}
>
              <FocusModePanel
prioritizedTasks={prioritizedTasks}
completedToday={completedToday}
insightsHistory={insightsHistory}
userPlanningProfile={userPlanningProfile}
darkMode={darkMode}
                border={border}
                strongerGlass={strongerGlass}
                themeColor="#181818"
                toggleTaskById={toggleTaskById}
                setSelectedTask={setSelectedTask}
                setIsEditModalOpen={setIsEditModalOpen}
                manualFocusTaskIds={manualFocusTaskIds}
                setManualFocusTaskIds={setManualFocusTaskIds}
              />
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}


function MobileBottomNav({
  selectedView,
  setSelectedView,
  inboxCount,
  darkMode,
  themeColor,
}: any) {
  const [
    activeMobileTab,
    setActiveMobileTab,
  ] = useState<
    "today" | "focus" | "inbox"
  >(
    selectedView === "inbox"
      ? "inbox"
      : "today"
  );

  useEffect(() => {
    if (selectedView === "inbox") {
      setActiveMobileTab("inbox");
      return;
    }

    if (selectedView !== "today") {
      setActiveMobileTab("today");
    }
  }, [selectedView]);

  const goToToday = () => {
    setActiveMobileTab("today");
    setSelectedView("today");

    window.setTimeout(() => {
      window.dispatchEvent(
        new Event(
          "momentuhm:open-tasks"
        )
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 60);
  };

  const goToFocus = () => {
    setActiveMobileTab("focus");
    setSelectedView("today");

    window.setTimeout(() => {
      window.dispatchEvent(
        new Event(
          "momentuhm:open-focus"
        )
      );
    }, 80);
  };

  const goToCapture = () => {
    setActiveMobileTab("today");
    setSelectedView("today");

    window.setTimeout(() => {
      window.dispatchEvent(
        new Event(
          "momentuhm:open-capture"
        )
      );
    }, 80);
  };

  const goToInbox = () => {
    setActiveMobileTab("inbox");
    setSelectedView("inbox");

    window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 60);
  };

  const getNavigationItemClass = (
    isActive: boolean
  ) => {
    return `flex min-w-0 flex-col items-center justify-center gap-1 rounded-[14px] py-1.5 text-[9.5px] font-[600] transition active:scale-[0.97] ${
      isActive
        ? darkMode
          ? "text-[#F1F3F4]"
          : "text-[#202124]"
        : darkMode
        ? "text-white/42 hover:text-white/70"
        : "text-[#5F6368] hover:text-[#202124]"
    }`;
  };

  const getActiveIndicatorStyle = (
    isActive: boolean
  ): React.CSSProperties | undefined => {
    if (!isActive) return undefined;

    return {
      backgroundColor: darkMode
        ? `${themeColor}28`
        : `${themeColor}16`,
    };
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className={`fixed bottom-3 left-1/2 z-[180] grid h-[68px] w-[calc(100%_-_24px)] max-w-[430px] -translate-x-1/2 grid-cols-5 items-center rounded-[22px] border px-2 shadow-[0_8px_30px_rgba(60,64,67,0.22)] backdrop-blur-xl lg:hidden ${
        darkMode
          ? "border-white/[0.10] bg-[#202124]/95 text-[#F1F3F4]"
          : "border-[#DADCE0] bg-white/95 text-[#202124]"
      }`}
    >
      <button
        type="button"
        onClick={goToToday}
        className={getNavigationItemClass(
          activeMobileTab === "today"
        )}
        style={getActiveIndicatorStyle(
          activeMobileTab === "today"
        )}
      >
        <ListChecks
          size={18}
          strokeWidth={1.8}
        />
        Today
      </button>

      <button
        type="button"
        onClick={goToFocus}
        className={getNavigationItemClass(
          activeMobileTab === "focus"
        )}
        style={getActiveIndicatorStyle(
          activeMobileTab === "focus"
        )}
      >
        <Target
          size={18}
          strokeWidth={1.8}
        />
        Focus
      </button>

      <button
        type="button"
        onClick={goToCapture}
        aria-label="Add a task"
        title="Add a task"
        className="mx-auto flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full text-white shadow-[0_5px_16px_rgba(60,64,67,0.30)] transition active:scale-95"
        style={{
          backgroundColor: themeColor,
        }}
      >
        <Plus
          size={22}
          strokeWidth={1.9}
        />
      </button>

      <button
        type="button"
        onClick={goToInbox}
        className={`relative ${getNavigationItemClass(
          activeMobileTab === "inbox"
        )}`}
        style={getActiveIndicatorStyle(
          activeMobileTab === "inbox"
        )}
      >
        <Calendar
          size={18}
          strokeWidth={1.8}
        />

        Inbox

        {inboxCount > 0 && (
          <span
            className={`absolute right-2.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-[700] ${
              darkMode
                ? "bg-[#F28B82] text-[#202124]"
                : "bg-[#D93025] text-white"
            }`}
          >
            {inboxCount}
          </span>
        )}
      </button>

      <div className="flex min-w-0 flex-col items-center justify-center gap-1 py-1.5">
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              userButtonAvatarBox:
                "h-6 w-6",

              userButtonPopoverCard:
                "w-[280px] rounded-[16px] border border-[#DADCE0] bg-white p-2 text-[#202124] shadow-[0_8px_30px_rgba(60,64,67,0.25)] dark:border-white/[0.10] dark:bg-[#202124] dark:text-[#F1F3F4]",

              userButtonPopoverMain:
                "bg-transparent",

              userButtonPopoverActions:
                "bg-transparent",

              userButtonPopoverActionButton:
                "h-10 rounded-[10px] px-3 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",

              userButtonPopoverActionButtonText:
                "text-[13px] font-[600]",

              userButtonPopoverActionButtonIcon:
                "opacity-60",

              userButtonPopoverFooter:
                "hidden",

              userPreviewMainIdentifier:
                "text-sm font-[650]",

              userPreviewSecondaryIdentifier:
                "text-xs font-[500] opacity-55",

              userPreviewAvatarBox:
                "h-8 w-8",
            },
          }}
        />

        <span
          className={`truncate text-[9.5px] font-[600] ${
            darkMode
              ? "text-white/42"
              : "text-[#5F6368]"
          }`}
        >
          Account
        </span>
      </div>
    </nav>
  );
}

function InlineFocusAction({
  taskId,
  manualFocusTaskIds = [],
  toggleFocusTask,
  darkMode,
  showSeparator = true,
}: {
  taskId: string;
  manualFocusTaskIds?: string[];
  toggleFocusTask?: (
    taskId: string
  ) => void;
  darkMode: boolean;
  showSeparator?: boolean;
}) {
  const isInFocus =
    manualFocusTaskIds.includes(
      taskId
    );

  const isFocusStackFull =
    !isInFocus &&
    manualFocusTaskIds.length >= 3;

  if (!toggleFocusTask) {
    return null;
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 transition ${
        isInFocus
          ? "opacity-100"
          : "opacity-0 group-hover/task:opacity-100 group-focus-within/task:opacity-100"
      }`}
    >
      {showSeparator && (
        <span
          aria-hidden="true"
          className="opacity-40"
        >
          ·
        </span>
      )}

      <button
        type="button"
        disabled={isFocusStackFull}
        onClick={(event) => {
          event.stopPropagation();
          toggleFocusTask(taskId);
        }}
        aria-pressed={isInFocus}
        title={
          isInFocus
            ? "Remove from Focus"
            : isFocusStackFull
            ? "Focus stack is full"
            : "Add to Focus"
        }
        className={`shrink-0 font-[650] transition disabled:cursor-not-allowed disabled:opacity-35 ${
          isInFocus
            ? darkMode
              ? "text-emerald-300 hover:text-emerald-200"
              : "text-emerald-700 hover:text-emerald-800"
            : darkMode
            ? "text-white/48 hover:text-white"
            : "text-[#6B6F7B] hover:text-[#252933]"
        }`}
      >
        {isInFocus
          ? "In focus"
          : "Add to focus"}
      </button>
    </span>
  );
}



function TaskListPanel({
  title,
  description,
  tasks,
  sortMode = "date",
  setSortMode = () => {},
  groupMode = "none",
  setGroupMode = () => {},
  emptyMessage,
  darkMode,
  border,
  toggleTaskById,
  toggleSubtaskById,
  suggestingTaskIds = [],
  deleteTask,
  acceptSuggestedDateById,
  setSelectedTask,
  setIsEditModalOpen,
  ranked = false,
  draggableTasks = false,
  manualFocusTaskIds = [],
  setManualFocusTaskIds,
  togglePinTask,
  selectWhySuggestion,
  taskListRef,
  anchorTaskListSoon = () => {},
  newlyAddedTaskIds = [],
  onFocusCapture = () => {},
}: any) {
  const [showAllTasks, setShowAllTasks] =
    useState(false);

  /*
   * Subtasks are intentionally collapsed when the
   * task list first loads. Expansion is local UI state
   * and does not need to be persisted.
   */
  const [
    expandedTaskIds,
    setExpandedTaskIds,
  ] = useState<string[]>([]);

  const defaultVisibleTaskCount = 15;

  const toggleSubtaskExpansion = (
    taskId: string
  ) => {
    const isCurrentlyExpanded =
      expandedTaskIds.includes(
        taskId
      );
  
    setExpandedTaskIds(
      (previousTaskIds) =>
        previousTaskIds.includes(taskId)
          ? previousTaskIds.filter(
              (existingTaskId) =>
                existingTaskId !== taskId
            )
          : [
              ...previousTaskIds,
              taskId,
            ]
    );
  
    /*
     * When opening subtasks, return the viewport to
     * the Tasks / Backlog workspace header, matching
     * the other anchored interactions in the app.
     */
    if (!isCurrentlyExpanded) {
      window.setTimeout(() => {
        anchorTaskListSoon();
      }, 120);
    }
  };

  const tableGridClass =
    "grid w-full grid-cols-[36px_minmax(0,1fr)_72px_76px_88px_30px] items-stretch";

  const cardBorder = darkMode
    ? "border-white/[0.10]"
    : "border-[#DDDDE3]";

  const rowBorder = darkMode
    ? "border-white/[0.08]"
    : "border-[#E8E9ED]";

  const mutedText = darkMode
    ? "text-white/48"
    : "text-[#6B6F7B]";

  const priorityRank: Record<string, number> = {
    High: 3,
    Medium: 2,
    Med: 2,
    Low: 1,
  };

  const sortedTasks = useMemo(() => {
    const nextTasks = [...tasks];

    const comparePinned = (a: any, b: any) => {
      const aPinned = Boolean(a.pinned);
      const bPinned = Boolean(b.pinned);
      if (aPinned === bPinned) return 0;
      return aPinned ? -1 : 1;
    };

    const compareDates = (a: any, b: any) => {
      const dateA = getTaskDate(a);
      const dateB = getTaskDate(b);

      if (!dateA && !dateB) return (b.score || 0) - (a.score || 0);
      if (!dateA) return 1;
      if (!dateB) return -1;

      const dateDifference = dateA.localeCompare(dateB);
      return dateDifference !== 0
        ? dateDifference
        : (b.score || 0) - (a.score || 0);
    };

    if (sortMode === "priority") {
      return nextTasks.sort((a, b) => {
        const pinnedDifference = comparePinned(a, b);
        if (pinnedDifference !== 0) return pinnedDifference;

        const priorityDifference =
          (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);

        if (priorityDifference !== 0) return priorityDifference;
        return compareDates(a, b);
      });
    }

    return nextTasks.sort((a, b) => {
      const pinnedDifference = comparePinned(a, b);
      return pinnedDifference !== 0 ? pinnedDifference : compareDates(a, b);
    });
  }, [tasks, sortMode]);

  const categoryGroupOrder: Record<string, number> = {};

  sortedTasks.forEach((task: any) => {
    const categoryTitle = task.category || "No category";
    if (categoryGroupOrder[categoryTitle] === undefined) {
      categoryGroupOrder[categoryTitle] = Object.keys(categoryGroupOrder).length;
    }
  });

  const getTaskGroupMeta = (task: any) => {
    if (groupMode === "category") {
      const categoryTitle = task.category || "No category";
      return {
        key: `category:${categoryTitle}`,
        title: categoryTitle,
        order: categoryGroupOrder[categoryTitle] ?? 999,
      };
    }

    if (groupMode === "priority") {
      const normalizedPriority = task.priority === "Med" ? "Medium" : task.priority || "Low";
      const order = normalizedPriority === "High" ? 0 : normalizedPriority === "Medium" ? 1 : 2;
      return {
        key: `priority:${normalizedPriority}`,
        title: normalizedPriority === "Medium" ? "Mid" : normalizedPriority,
        order,
      };
    }

    if (groupMode === "date") {
      const date = getTaskDate(task);
      if (!date) return { key: "date:no-date", title: "No date", order: 9999999999999 };
      if (isOverdue(date)) return { key: "date:overdue", title: "Overdue", order: 0 };
      if (isToday(date)) return { key: "date:today", title: "Today", order: 1 };
      if (isTomorrow(date)) return { key: "date:tomorrow", title: "Tomorrow", order: 2 };
      return {
        key: `date:${date}`,
        title: formatDueDate(date),
        order: 3 + new Date(`${date}T00:00:00`).getTime(),
      };
    }

    return { key: "none", title: "", order: 0 };
  };

  const displayTasks =
    groupMode === "none"
      ? sortedTasks
      : sortedTasks
          .map((task: any, originalIndex: number) => ({ task, originalIndex }))
          .sort((a, b) => {
            const groupA = getTaskGroupMeta(a.task);
            const groupB = getTaskGroupMeta(b.task);

            if (groupA.order !== groupB.order) return groupA.order - groupB.order;
            if (Boolean(a.task.pinned) !== Boolean(b.task.pinned)) {
              return a.task.pinned ? -1 : 1;
            }
            return a.originalIndex - b.originalIndex;
          })
          .map(({ task }) => task);

  const groupCounts = displayTasks.reduce<Record<string, number>>(
    (counts, task: any) => {
      if (groupMode === "none") return counts;
      const groupKey = getTaskGroupMeta(task).key;
      counts[groupKey] = (counts[groupKey] || 0) + 1;
      return counts;
    },
    {}
  );

  const visibleTasks = showAllTasks
    ? displayTasks
    : displayTasks.slice(0, defaultVisibleTaskCount);

  const hiddenTaskCount = Math.max(
    displayTasks.length - defaultVisibleTaskCount,
    0
  );

  const openTask = (task: any) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const toggleTaskFocusFromList = (
    taskId: string
  ) => {
    if (!setManualFocusTaskIds) {
      return;
    }
  
    setManualFocusTaskIds(
      (previousTaskIds: string[]) => {
        if (
          previousTaskIds.includes(
            taskId
          )
        ) {
          return previousTaskIds.filter(
            (existingTaskId) =>
              existingTaskId !== taskId
          );
        }
  
        if (
          previousTaskIds.length >= 3
        ) {
          return previousTaskIds;
        }
  
        return [
          ...previousTaskIds,
          taskId,
        ];
      }
    );
  };

  return (
    <section
      id="Momentuhm-task-list-anchor"
      ref={taskListRef}
      aria-label={description || title}
      className={`w-full min-w-0 scroll-mt-[80px] overflow-hidden rounded-[12px] border ${cardBorder}`}
    >
      <div
        className={`flex min-h-[72px] flex-col gap-3 border-b px-4 py-3.5 xl:flex-row xl:items-center xl:justify-between ${rowBorder}`}
      >
        <div className="min-w-0">
          <h2
            className={`text-[20px] font-[760] leading-none tracking-[-0.04em] ${
              darkMode ? "text-white" : "text-[#17191F]"
            }`}
          >
            {title}
          </h2>
          <p className={`mt-1.5 text-[12px] font-[500] ${mutedText}`}>
            {description}
          </p>
        </div>

        {ranked && (
<div className="flex flex-wrap items-center gap-2">
  <label className="relative">
    <span className="sr-only">Sort tasks</span>

    <select
      value={sortMode}
      onChange={(event) => {
        setSortMode(event.target.value as SortMode);
        setShowAllTasks(false);
        anchorTaskListSoon();
      }}
      className={`h-9 appearance-none rounded-[8px] border bg-transparent pl-3 pr-8 text-[11px] font-[650] outline-none ${
        darkMode
          ? "border-white/[0.10] text-white/72"
          : "border-[#DDDDE3] text-[#484D59]"
      }`}
    >
      <option value="date">Sort: Date</option>
      <option value="priority">Sort: Priority</option>
    </select>

    <ChevronDown
      size={13}
      className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${mutedText}`}
    />
  </label>

  <label className="relative">
    <span className="sr-only">Group tasks</span>

    <select
      value={groupMode}
      onChange={(event) => {
        setGroupMode(event.target.value as GroupMode);
        setShowAllTasks(false);
        anchorTaskListSoon();
      }}
      className={`h-9 appearance-none rounded-[8px] border bg-transparent pl-3 pr-8 text-[11px] font-[650] outline-none ${
        darkMode
          ? "border-white/[0.10] text-white/72"
          : "border-[#DDDDE3] text-[#484D59]"
      }`}
    >
      <option value="none">Group: None</option>
      <option value="category">Group: Category</option>
      <option value="priority">Group: Priority</option>
      <option value="date">Group: Due</option>
    </select>

    <ChevronDown
      size={13}
      className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${mutedText}`}
    />
  </label>
</div>
)}
      </div>

      {tasks.length === 0 ? (
        <div className={`px-5 py-14 text-center text-[13px] font-[500] ${mutedText}`}>
          {emptyMessage}
        </div>
      ) : (
        <div className="min-w-0 overflow-x-hidden">
          <div
            className={`${tableGridClass} min-h-[40px] border-b ${rowBorder} ${
              darkMode ? "bg-white/[0.018]" : "bg-[#FAFAFB]"
            }`}
          >
        

        <div className="flex items-center justify-center">
  <span
    aria-hidden="true"
    className={`h-4 w-4 rounded-[4px] border ${
      darkMode
        ? "border-white/45"
        : "border-[#9297A1]"
    }`}
  />
</div>

            <div className={`flex items-center px-2 text-[10px] font-[700] ${mutedText}`}>
              Task
            </div>
            {['Due', 'Priority', 'Status'].map((heading) => (
              <div
                key={heading}
                className={`flex items-center justify-center border-l px-1 text-center text-[10px] font-[700] ${rowBorder} ${mutedText}`}
              >
                {heading}
              </div>
            ))}
            <div className={`border-l ${rowBorder}`} />
          </div>

          {visibleTasks.map((task: any, index: number) => {
            const visibleDueDate = task.dueDate || task.suggestedDueDate;
            const groupMeta = getTaskGroupMeta(task);
            const previousTask = index > 0 ? visibleTasks[index - 1] : null;
            const previousGroupKey = previousTask
              ? getTaskGroupMeta(previousTask).key
              : "";
            const shouldShowGroupHeader =
              groupMode !== "none" && groupMeta.key !== previousGroupKey;
            const isTaskOverdue = Boolean(task.dueDate && isOverdue(task.dueDate));
            const isFocused =
            manualFocusTaskIds.includes(
              task.id
            );

          const isNewlyAdded =
            newlyAddedTaskIds.includes(
              task.id
            );

          const subtaskProgress =
            getSubtaskProgress(task);

          const isSubtasksExpanded =
            expandedTaskIds.includes(
              task.id
            );

          const priorityLabel =
              task.priority === "Medium" || task.priority === "Med"
                ? "Medium"
                : task.priority;
                const normalizedStatus =
                normalizeTaskStatus(task.status);
              
              const statusLabel =
                getTaskStatusLabel(normalizedStatus);

                const dueLabel = visibleDueDate
                ? isTaskOverdue
                  ? `Overdue ${formatDueDate(visibleDueDate)}`
                  : formatDueDate(visibleDueDate)
                : "—";
              
              const dueClass = isTaskOverdue
                ? darkMode
                  ? "text-red-300"
                  : "text-red-600"
                : mutedText;

            const priorityPill =
              task.priority === "High"
                ? darkMode
                  ? "border-red-400/20 bg-red-400/10 text-red-300"
                  : "border-red-200 bg-red-50 text-red-600"
                : task.priority === "Medium" || task.priority === "Med"
                ? darkMode
                  ? "border-orange-400/20 bg-orange-400/10 text-orange-300"
                  : "border-orange-200 bg-orange-50 text-orange-600"
                : darkMode
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-600";

                const statusPill =
                normalizedStatus === "Done"
                  ? darkMode
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : normalizedStatus === "Waiting"
                  ? darkMode
                    ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                  : normalizedStatus === "In progress"
                  ? darkMode
                    ? "border-blue-400/20 bg-blue-400/10 text-blue-300"
                    : "border-blue-200 bg-blue-50 text-blue-700"
                  : darkMode
                  ? "border-white/[0.12] bg-white/[0.05] text-white/60"
                  : "border-[#DADCE0] bg-[#F1F3F4] text-[#5F6368]";

            return (
              <div key={task.id} className="contents">
  {shouldShowGroupHeader && (
    <div
      className={`col-span-6 flex min-h-[34px] items-center gap-2 border-b px-3 text-[11px] font-[700] ${rowBorder} ${
        darkMode
          ? "bg-white/[0.035] text-white"
          : "bg-[#F4F5F7] text-black"
      }`}
    >
      <span>{groupMeta.title}</span>
      <span>{groupCounts[groupMeta.key] || 0}</span>
    </div>
  )}
            

<motion.div
  data-testid="task-row"
  data-task-id={task.id}
  data-task-title={task.title}
  data-task-completed={String(Boolean(task.completed))}
  data-task-backlog={String(Boolean(task.isBacklog))}
  layout="position"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  draggable={Boolean(draggableTasks)}
  onDragStartCapture={(
    event: React.DragEvent<HTMLDivElement>
  ) => {
    if (!draggableTasks) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.setData(
      "text/plain",
      String(task.id)
    );

    event.dataTransfer.effectAllowed = "copy";
  }}
  className={`group/task ${tableGridClass} min-h-[62px] border-b transition last:border-b-0 ${rowBorder} ${
    darkMode
      ? "hover:bg-white/[0.025]"
      : "hover:bg-[#FBFBFC]"
  } ${
    isNewlyAdded
      ? "animate-[veiraNewTaskGlow_2.2s_ease-out]"
      : ""
  }`}
>
                <div className="flex items-start justify-center pt-3">
  <button
    type="button"
    data-testid="complete-task-button"
    data-task-id={task.id}
    data-task-title={task.title}
    onClick={(event) => toggleTaskById(task.id, event)}
    aria-label={`Complete ${task.title}`}
    className="group/check flex h-5 w-5 items-center justify-center"
  >
    <span
      aria-hidden="true"
      className={`h-4 w-4 rounded-[4px] border transition ${
        darkMode
          ? "border-white/45 group-hover/check:border-white"
          : "border-[#9297A1] group-hover/check:border-[#252933]"
      }`}
    />
  </button>
</div>

                  <div className="flex min-w-0 flex-col justify-start px-2 py-3">
                  <button
  type="button"
  data-testid="task-title"
  data-task-id={task.id}
  onClick={() => openTask(task)}
  title={task.title}
  className={`block w-full text-left text-[13px] font-[600] leading-5 tracking-[-0.015em] transition hover:opacity-70 ${
    groupMode === "category"
      ? "line-clamp-2 whitespace-normal"
      : "truncate"
  } ${
    darkMode ? "text-white/90" : "text-[#20232B]"
  }`}
>
  {task.title}
</button>

  {groupMode !== "category" && (
  <div
  className={`mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] font-[500] ${mutedText}`}
>
  <span className="truncate">
    {task.category === "-"
      ? "-"
      : task.category ||
        "No category"}
  </span>

  <InlineFocusAction
    taskId={task.id}
    manualFocusTaskIds={
      manualFocusTaskIds
    }
    toggleFocusTask={
      toggleTaskFocusFromList
    }
    darkMode={darkMode}
  />

  {task.pinned && (
    <>
      {/* <span
        aria-hidden="true"
        className="opacity-40"
      >
        ·
      </span>

      <span>Pinned</span> */}
    </>
  )}

  {suggestingTaskIds.includes(
    task.id
  ) && (
    <Sparkles
      size={9}
      className="shrink-0 animate-pulse"
    />
  )}
</div>
  )}

{groupMode === "category" && (
  <div
    className={`mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] font-[500] ${mutedText}`}
  >
    <InlineFocusAction
      taskId={task.id}
      manualFocusTaskIds={
        manualFocusTaskIds
      }
      toggleFocusTask={
        toggleTaskFocusFromList
      }
      darkMode={darkMode}
      showSeparator={false}
    />

    {suggestingTaskIds.includes(
      task.id
    ) && (
      <Sparkles
        size={9}
        className="shrink-0 animate-pulse"
      />
    )}
  </div>
)}

{subtaskProgress.hasSubtasks && (
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();

      toggleSubtaskExpansion(
        task.id
      );
    }}
    aria-expanded={
      isSubtasksExpanded
    }
    aria-controls={`task-subtasks-${task.id}`}
    className={`mt-2 inline-flex max-w-full items-center gap-1.5 rounded-[6px] border px-2 py-1 text-[9.5px] font-[600] transition ${
      darkMode
        ? "border-white/[0.09] bg-white/[0.025] text-white/52 hover:border-white/[0.18] hover:bg-white/[0.05] hover:text-white/78"
        : "border-[#E1E2E6] bg-[#F8F9FA] text-[#626875] hover:border-[#C8CAD0] hover:bg-[#F1F2F5] hover:text-[#252933]"
    }`}
  >
    {isSubtasksExpanded ? (
      <ChevronDown
        size={12}
        strokeWidth={1.9}
        className="shrink-0"
      />
    ) : (
      <ChevronRight
        size={12}
        strokeWidth={1.9}
        className="shrink-0"
      />
    )}

    <span>
      {subtaskProgress.total}{" "}
      subtask
      {subtaskProgress.total === 1
        ? ""
        : "s"}
    </span>

    <span
      aria-hidden="true"
      className="opacity-35"
    >
      •
    </span>

    <span
      className={
        subtaskProgress.allComplete
          ? darkMode
            ? "text-emerald-300"
            : "text-emerald-700"
          : ""
      }
    >
      {subtaskProgress.completed} completed
    </span>

    <span
      aria-hidden="true"
      className={`ml-1 h-1.5 w-12 overflow-hidden rounded-full ${
        darkMode
          ? "bg-white/[0.08]"
          : "bg-[#E2E4E8]"
      }`}
    >
      <span
        className={`block h-full rounded-full transition-[width] duration-300 ${
          subtaskProgress.allComplete
            ? "bg-emerald-500"
            : darkMode
            ? "bg-violet-300"
            : "bg-violet-600"
        }`}
        style={{
          width: `${subtaskProgress.percent}%`,
        }}
      />
    </span>
  </button>
)}
</div>

                  <div className={`flex items-center justify-center border-l px-1 text-center text-[12px] font-[600] ${rowBorder} ${dueClass}`}>
                    {dueLabel}
                  </div>

                  <div className={`flex items-center justify-center border-l px-1 ${rowBorder}`}>
                    <span className={`rounded-[6px] border px-2 py-1 text-[10px] font-[650] ${priorityPill}`}>
                      {priorityLabel}
                    </span>
                  </div>

                  <div className={`flex items-center justify-center border-l px-1 ${rowBorder}`}>
                    <button
                      type="button"
                      onClick={() => openTask(task)}
title="Edit task status"
                      className={`max-w-full truncate rounded-[6px] border px-2 py-1 text-[10px] font-[650] ${statusPill}`}
                    >
                      {statusLabel}
                    </button>
                  </div>

                  <div className={`flex items-center justify-center border-l ${rowBorder}`}>
<button
  type="button"
  onClick={() => togglePinTask(task.id)}
  aria-pressed={Boolean(task.pinned)}
  aria-label={
    task.pinned
      ? `Unpin ${task.title}`
      : `Pin ${task.title} to top`
  }
  title={task.pinned ? "Unpin task" : "Pin to top"}
  className={`flex h-8 w-7 items-center justify-center transition ${
    task.pinned
      ? darkMode
        ? "text-white"
        : "text-[#202124]"
      : darkMode
      ? "text-white/38 opacity-0 group-hover/task:opacity-100 group-focus-within/task:opacity-100 hover:text-white"
      : "text-[#747986] opacity-0 group-hover/task:opacity-100 group-focus-within/task:opacity-100 hover:text-[#252933]"
  }`}
>
  <Star
    size={15}
    strokeWidth={1.8}
    fill={task.pinned ? "currentColor" : "none"}
  />
</button>
</div>
</motion.div>

<AnimatePresence initial={false}>
  {subtaskProgress.hasSubtasks &&
    isSubtasksExpanded && (
      <motion.div
        id={`task-subtasks-${task.id}`}
        key={`subtasks-${task.id}`}
        initial={{
          height: 0,
          opacity: 0,
          y: -8,
        }}
        animate={{
          height: "auto",
          opacity: 1,
          y: 0,
        }}
        exit={{
          height: 0,
          opacity: 0,
          y: -6,
        }}
        transition={{
          height: {
            duration: 0.65,
            ease: [
              0.16,
              1,
              0.3,
              1,
            ],
          },
        
          opacity: {
            duration: 0.65,
            ease: [
              0.16,
              1,
              0.3,
              1,
            ],
          },
        
          y: {
            duration: 0.65,
            ease: [
              0.16,
              1,
              0.3,
              1,
            ],
          },
        }}
        className={`overflow-hidden border-b ${rowBorder} ${
          darkMode
            ? "bg-white/[0.018]"
            : "bg-[#FAFAFB]"
        }`}
      >
        <div className="pb-3 pl-[44px] pr-3 pt-2">
          <div
            className={`overflow-hidden rounded-[9px] border ${
              darkMode
                ? "border-white/[0.09] bg-[#121519]"
                : "border-[#E1E2E6] bg-white"
            }`}
          >
            <div
              className={`flex min-h-[34px] items-center justify-between gap-3 border-b px-3 ${rowBorder}`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <ListChecks
                  size={13}
                  strokeWidth={1.8}
                  className={
                    darkMode
                      ? "text-white/42"
                      : "text-[#6B6F7B]"
                  }
                />

                <span
                  className={`text-[9.5px] font-[700] uppercase tracking-[0.06em] ${mutedText}`}
                >
                  Subtasks
                </span>
              </div>

              <span
                className={`text-[9.5px] font-[600] tabular-nums ${mutedText}`}
              >
                {subtaskProgress.completed}
                {" / "}
                {subtaskProgress.total}
              </span>
            </div>

            <div>
              {subtaskProgress.subtasks.map(
                (subtask) => {
                  const subtaskDate =
                    subtask.dueDate
                      ? formatDueDate(
                          subtask.dueDate
                        )
                      : "";

                  return (
                    <div
                      key={subtask.id}
                      className={`group/subtask grid min-h-[40px] grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 border-b px-2.5 last:border-b-0 ${rowBorder}`}
                    >
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          toggleSubtaskById(
                            task.id,
                            subtask.id
                          );
                        }}
                        aria-label={
                          subtask.completed
                            ? `Mark ${subtask.title} incomplete`
                            : `Complete ${subtask.title}`
                        }
                        aria-pressed={
                          subtask.completed
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] transition active:scale-95"
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-4 w-4 items-center justify-center rounded-[4px] border transition ${
                            subtask.completed
                              ? darkMode
                                ? "border-violet-300 bg-violet-300 text-[#17181C]"
                                : "border-violet-600 bg-violet-600 text-white"
                              : darkMode
                              ? "border-white/35 group-hover/subtask:border-white/60"
                              : "border-[#9297A1] group-hover/subtask:border-[#4F5562]"
                          }`}
                        >
                          {subtask.completed && (
                            <Check
                              size={10}
                              strokeWidth={2.5}
                            />
                          )}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openTask(task);
                        }}
                        title={subtask.title}
                        className={`min-w-0 truncate text-left text-[11px] leading-4 font-[550] transition hover:opacity-70 ${
                          subtask.completed
                            ? darkMode
                              ? "text-white/38 line-through decoration-white/25"
                              : "text-[#777D88] line-through decoration-black/20"
                            : darkMode
                            ? "text-white/76"
                            : "text-[#353A45]"
                        }`}
                      >
                        {subtask.title}
                      </button>

                      {subtaskDate && (
                        <span
                          className={`flex shrink-0 items-center gap-1 text-[9px] font-[550] ${mutedText}`}
                        >
                          <Calendar
                            size={11}
                            strokeWidth={1.7}
                          />

                          {subtaskDate}
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            <div
              className={`flex min-h-[38px] items-center border-t px-3 ${rowBorder}`}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openTask(task);
                }}
                className={`inline-flex items-center gap-1.5 text-[10px] font-[600] transition ${
                  darkMode
                    ? "text-white/42 hover:text-white/72"
                    : "text-[#686E7A] hover:text-[#252933]"
                }`}
              >
                <Plus
                  size={12}
                  strokeWidth={1.8}
                />

                Add or edit subtasks
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )}
</AnimatePresence>
              </div>
            );
          })}

          <div className={`flex min-h-[42px] items-center border-t px-3 ${rowBorder}`}>
            <button
              type="button"
              onClick={onFocusCapture}
              className={`inline-flex items-center gap-2 text-[12px] font-[550] transition ${
                darkMode ? "text-white/45 hover:text-white" : "text-[#686E7A] hover:text-[#252933]"
              }`}
            >
              <Plus size={14} strokeWidth={1.7} />
              Add task
            </button>

            {hiddenTaskCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllTasks((previous) => !previous)}
                className={`ml-auto inline-flex items-center gap-1.5 text-[11px] font-[600] ${mutedText}`}
              >
                {showAllTasks ? "Show less" : `Show ${hiddenTaskCount} more`}
                <ChevronDown
                  size={12}
                  className={`transition ${showAllTasks ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function CompletedTodaySection({
  sectionId,
  completedToday,
  restoreCompletedTask,
  archiveCompletedToday,
  setSelectedTask,
  setIsEditModalOpen,
  darkMode,
  border,
}: any) {
  const [showAllCompleted, setShowAllCompleted] =
    useState(false);

  const defaultVisibleCount = 3;

  const visibleCompletedTasks =
    showAllCompleted
      ? completedToday
      : completedToday.slice(
          0,
          defaultVisibleCount
        );

  const hiddenCompletedCount =
    Math.max(
      completedToday.length -
        defaultVisibleCount,
      0
    );

  const formatCompletedTime = (
    completedAt?: string
  ) => {
    if (!completedAt) {
      return "";
    }

    const date =
      new Date(completedAt);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleTimeString(
      undefined,
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const openCompletedTask = (
    task: any
  ) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const cardBorder = darkMode
    ? "border-white/[0.10]"
    : "border-[#DDDDE3]";

  const rowBorder = darkMode
    ? "border-white/[0.08]"
    : "border-[#E8E9ED]";

  const mutedText = darkMode
    ? "text-white/48"
    : "text-[#6B6F7B]";

  return (
    <section
      id={sectionId}
      data-testid="completed-today-section"
      aria-label="Completed today"
      className={`mt-4 w-full scroll-mt-8 overflow-hidden rounded-[12px] border ${cardBorder}`}
    >
      <div
        className={`flex min-h-[66px] items-center justify-between gap-4 border-b px-4 ${rowBorder}`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2
              className={`text-[18px] font-[740] leading-none tracking-[-0.035em] ${
                darkMode
                  ? "text-white"
                  : "text-[#17191F]"
              }`}
            >
              Completed today
            </h2>

            <span
              className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-[700] ${
                darkMode
                  ? "bg-white/[0.07] text-white/58"
                  : "bg-[#F0F1F4] text-[#59606C]"
              }`}
            >
              {completedToday.length}
            </span>
          </div>

          <p
            className={`mt-1.5 text-[11px] font-[500] ${mutedText}`}
          >
            Well done! Keep the momentum
            going.
          </p>
        </div>

        <button
          type="button"
          onClick={
            archiveCompletedToday
          }
          disabled={
            completedToday.length === 0
          }
          className={`h-9 shrink-0 px-2 text-[11px] font-[650] transition ${
            completedToday.length === 0
              ? "cursor-not-allowed opacity-30"
              : darkMode
              ? "text-violet-300 hover:text-violet-200"
              : "text-violet-600 hover:text-violet-700"
          }`}
        >
          Archive all
        </button>
      </div>

      {completedToday.length === 0 ? (
        <div
          className={`px-4 py-8 text-[12px] font-[500] ${mutedText}`}
        >
          Nothing completed yet.
        </div>
      ) : (
        <div role="list">
          <AnimatePresence
            initial={false}
          >
            {visibleCompletedTasks.map(
              (task: any) => {
                const completedTime =
                  formatCompletedTime(
                    task.completedAt
                  );

                return (
                  <motion.div
                    key={task.id}
                    role="listitem"
                    data-testid="completed-task-row"
                    data-task-id={task.id}
                    data-task-title={task.title}
                    layout="position"
                    initial={{
                      opacity: 0,
                      y: 4,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                    className={`group/completed grid min-h-[48px] grid-cols-[28px_minmax(0,1fr)_auto_34px] items-center gap-2 border-b px-3 transition last:border-b-0 ${
                      darkMode
                        ? "hover:bg-white/[0.025]"
                        : "hover:bg-[#FBFBFC]"
                    } ${rowBorder}`}
                  >
                    <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check
                        size={12}
                        strokeWidth={2.3}
                      />
                    </span>

                    <button
                      type="button"
                      data-testid="completed-task-title"
                      data-task-id={task.id}
                      onClick={() =>
                        openCompletedTask(
                          task
                        )
                      }
                      title={`Edit ${task.title}`}
                      className="min-w-0 py-2 text-left"
                    >
                      <p
                        className={`truncate text-[12px] font-[550] line-through transition group-hover/completed:opacity-75 ${
                          darkMode
                            ? "text-white/55 decoration-white/30"
                            : "text-[#5D626E] decoration-black/25"
                        }`}
                      >
                        {task.title}
                      </p>

                      <p
                        className={`mt-0.5 truncate text-[10px] font-[500] ${mutedText}`}
                      >
                        {task.category ||
                          "No category"}
                      </p>
                    </button>

                    <time
                      dateTime={
                        task.completedAt
                      }
                      className={`whitespace-nowrap text-[10px] font-[500] tabular-nums ${mutedText}`}
                    >
                      {completedTime}
                    </time>

                    <button
                      type="button"
                      data-testid="restore-task-button"
                      data-task-id={task.id}
                      onClick={(event) => {
                        event.stopPropagation();

                        restoreCompletedTask(
                          task.id
                        );
                      }}
                      aria-label={`Restore ${task.title}`}
                      title="Restore task"
                      className={`flex h-8 w-8 items-center justify-center transition ${
                        darkMode
                          ? "text-white/38 hover:text-white"
                          : "text-[#747986] hover:text-[#252933]"
                      }`}
                    >
                      <RotateCcw
                        size={14}
                        strokeWidth={1.7}
                      />
                    </button>
                  </motion.div>
                );
              }
            )}
          </AnimatePresence>
        </div>
      )}

      {(hiddenCompletedCount > 0 ||
        completedToday.length > 0) && (
        <div
          className={`flex min-h-[42px] items-center justify-center border-t px-3 ${rowBorder}`}
        >
          {hiddenCompletedCount > 0 ? (
            <button
              type="button"
              onClick={() =>
                setShowAllCompleted(
                  (previous) =>
                    !previous
                )
              }
              className={`inline-flex items-center gap-1.5 text-[11px] font-[600] ${mutedText}`}
            >
              {showAllCompleted
                ? "Show less"
                : `Show ${hiddenCompletedCount} more`}

              <ChevronDown
                size={12}
                className={`transition ${
                  showAllCompleted
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>
          ) : (
            <p
              className={`text-center text-[10.5px] font-[500] ${mutedText}`}
            >
              You’ve completed{" "}
              {completedToday.length} task
              {completedToday.length === 1
                ? ""
                : "s"}{" "}
              today. Amazing work! 💜
            </p>
          )}
        </div>
      )}
    </section>
  );
}


function ArchiveView({
  archive,
  clearArchive,
  darkMode,
  mode = "archive",
}: {
  archive: any[];
  clearArchive: () => void;
  darkMode: boolean;
  mode?: "archive" | "insights";
}) {
  type ArchiveAIInsight = {
    headline: string;
    summary: string;
    recommendation: string;
  };

  const isArchiveMode =
    mode === "archive";

  const isInsightsMode =
    mode === "insights";

  const [groupBy, setGroupBy] =
    useState<"date" | "priority">(
      "date"
    );

  const [
    aiInsight,
    setAiInsight,
  ] =
    useState<ArchiveAIInsight | null>(
      null
    );

  const [
    aiInsightLoading,
    setAiInsightLoading,
  ] = useState(false);

  const [
    aiInsightError,
    setAiInsightError,
  ] = useState("");

  const safeArchive = useMemo(
    () =>
      Array.isArray(archive)
        ? archive
        : [],
    [archive]
  );

  const getArchiveDate = (
    task: any
  ) => {
    const rawDate =
      task.completedAt ||
      task.archivedAt ||
      task.createdAt;

    if (!rawDate) return null;

    const date = new Date(rawDate);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  };

  const getLocalDateKey = (
    date: Date
  ) => {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getDateGroupLabel = (
    date: Date
  ) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const comparisonDate =
      new Date(date);

    comparisonDate.setHours(
      0,
      0,
      0,
      0
    );

    const differenceInDays =
      Math.round(
        (today.getTime() -
          comparisonDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

    if (differenceInDays === 0) {
      return "Today";
    }

    if (differenceInDays === 1) {
      return "Yesterday";
    }

    return date.toLocaleDateString(
      undefined,
      {
        weekday: "short",
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !==
          today.getFullYear()
            ? "numeric"
            : undefined,
      }
    );
  };

  const analytics = useMemo(() => {
    const totalClosed =
      safeArchive.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /*
     * Includes today and the previous
     * six calendar days.
     */
    const sevenDaysAgo =
      new Date(today);

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 6
    );

    const closedLastSevenDays =
      safeArchive.filter(
        (task: any) => {
          const date =
            getArchiveDate(task);

          return Boolean(
            date &&
              date >= sevenDaysAgo
          );
        }
      ).length;

    /*
     * Category distribution.
     */
    const categoryCounts =
safeArchive.reduce<
  Record<string, number>
>(
  (
    counts,
    task: any
  ) => {
    const category =
      String(
        task.category ||
          "No category"
      ).trim() ||
      "No category";

    counts[category] =
      (counts[category] ?? 0) + 1;

    return counts;
  },
  {}
);

const sortedCategories:
Array<{
  label: string;
  count: number;
}> = Object.entries(
categoryCounts
)
.map(
  ([label, count]) => ({
    label,
    count: Number(count),
  })
)
.sort(
  (a, b) =>
    b.count - a.count
);

    /*
     * Show the strongest four categories
     * and combine the remainder as Other.
     */
    const strongestCategories =
      sortedCategories.slice(0, 4);

    const otherCategoryCount =
      sortedCategories
        .slice(4)
        .reduce(
          (sum, item) =>
            sum + item.count,
          0
        );

    const categoryItems =
      otherCategoryCount > 0
        ? [
            ...strongestCategories,
            {
              label: "Other",
              count:
                otherCategoryCount,
            },
          ]
        : strongestCategories;

    const categoryPalette = [
      "#22C55E",
      "#3B82F6",
      "#8B5CF6",
      "#F97316",
      "#EAB308",
    ];

    const categoryBreakdown =
      categoryItems.map(
        (item, index) => ({
          ...item,
          percentage:
            totalClosed === 0
              ? 0
              : Math.round(
                  (item.count /
                    totalClosed) *
                    100
                ),
          precisePercentage:
            totalClosed === 0
              ? 0
              : (item.count /
                  totalClosed) *
                100,
          color:
            categoryPalette[
              index %
                categoryPalette.length
            ],
        })
      );

    let donutCursor = 0;

    const donutSegments =
      categoryBreakdown.map(
        (item) => {
          const start =
            donutCursor;

          donutCursor +=
            item.precisePercentage;

          return `${item.color} ${start}% ${donutCursor}%`;
        }
      );

    const donutBackground =
      donutSegments.length > 0
        ? `conic-gradient(${donutSegments.join(
            ", "
          )})`
        : darkMode
        ? "conic-gradient(rgba(255,255,255,0.10) 0 100%)"
        : "conic-gradient(#E3E5E8 0 100%)";

    /*
     * Task-type analysis.
     * These are execution patterns rather
     * than user-created categories.
     */
    const taskTypeDefinitions = [
      {
        label:
          "Admin / Operations",
        keywords: [
          "pay",
          "payment",
          "invoice",
          "passport",
          "kyc",
          "form",
          "application",
          "document",
          "submit",
          "tax",
          "ticket",
          "booking",
          "book ",
          "schedule",
          "renew",
          "verification",
        ],
        color: "#22C55E",
      },
      {
        label: "Communication",
        keywords: [
          "email",
          "call",
          "message",
          "reply",
          "respond",
          "follow up",
          "follow-up",
          "meeting",
          "confirm",
          "send",
          "ask ",
          "reach out",
        ],
        color: "#3B82F6",
      },
      {
        label: "Planning",
        keywords: [
          "plan",
          "planning",
          "review",
          "strategy",
          "estimate",
          "research",
          "grooming",
          "design",
          "roadmap",
          "outline",
        ],
        color: "#8B5CF6",
      },
      {
        label: "Preparation",
        keywords: [
          "prepare",
          "prep",
          "draft",
          "readiness",
          "organize",
          "create",
          "build",
          "complete",
        ],
        color: "#F97316",
      },
      {
        label: "Learning",
        keywords: [
          "learn",
          "training",
          "course",
          "watch",
          "read",
          "study",
          "practice",
        ],
        color: "#EAB308",
      },
    ];

    const taskTypeCounts:
      Record<string, number> = {};

    safeArchive.forEach(
      (task: any) => {
        const searchableText = [
          task.title,
          task.notes,
          task.whyThisMatters,
          task.aiReason,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchedType =
          taskTypeDefinitions.find(
            (definition) =>
              definition.keywords.some(
                (keyword) =>
                  searchableText.includes(
                    keyword
                  )
              )
          );

        const typeLabel =
          matchedType?.label ||
          "General execution";

        taskTypeCounts[typeLabel] =
          (taskTypeCounts[
            typeLabel
          ] || 0) + 1;
      }
    );

    const taskTypeBreakdown =
      Object.entries(
        taskTypeCounts
      )
        .map(
          ([label, count]) => {
            const definition =
              taskTypeDefinitions.find(
                (item) =>
                  item.label === label
              );

            return {
              label,
              count,
              percentage:
                totalClosed === 0
                  ? 0
                  : Math.round(
                      (count /
                        totalClosed) *
                        100
                    ),
              color:
                definition?.color ||
                "#64748B",
            };
          }
        )
        .sort(
          (a, b) =>
            b.count - a.count
        )
        .slice(0, 5);

    /*
     * Completion rhythm.
     */
    const productivityBuckets = [
      {
        label: "6AM",
        friendlyLabel:
          "early morning",
        count: 0,
      },
      {
        label: "9AM",
        friendlyLabel:
          "late morning",
        count: 0,
      },
      {
        label: "12PM",
        friendlyLabel: "midday",
        count: 0,
      },
      {
        label: "3PM",
        friendlyLabel:
          "the afternoon",
        count: 0,
      },
      {
        label: "6PM",
        friendlyLabel:
          "early evening",
        count: 0,
      },
      {
        label: "9PM",
        friendlyLabel:
          "late evening",
        count: 0,
      },
    ];

    safeArchive.forEach(
      (task: any) => {
        const completedDate =
          getArchiveDate(task);

        if (!completedDate) return;

        const hour =
          completedDate.getHours();

        let bucketIndex = 5;

        if (
          hour >= 5 &&
          hour <= 8
        ) {
          bucketIndex = 0;
        } else if (
          hour >= 9 &&
          hour <= 11
        ) {
          bucketIndex = 1;
        } else if (
          hour >= 12 &&
          hour <= 14
        ) {
          bucketIndex = 2;
        } else if (
          hour >= 15 &&
          hour <= 17
        ) {
          bucketIndex = 3;
        } else if (
          hour >= 18 &&
          hour <= 20
        ) {
          bucketIndex = 4;
        }

        productivityBuckets[
          bucketIndex
        ].count += 1;
      }
    );

    const peakProductivity =
      [...productivityBuckets].sort(
        (a, b) =>
          b.count - a.count
      )[0];

    /*
     * Build the line-chart coordinates.
     */
    const chartWidth = 360;
    const chartTop = 14;
    const chartBottom = 112;

    const maximumBucketCount =
      Math.max(
        1,
        ...productivityBuckets.map(
          (item) => item.count
        )
      );

    const productivityPoints =
      productivityBuckets.map(
        (bucket, index) => {
          const x =
            15 +
            index *
              ((chartWidth - 30) /
                Math.max(
                  1,
                  productivityBuckets.length -
                    1
                ));

          const y =
            chartBottom -
            (bucket.count /
              maximumBucketCount) *
              (chartBottom -
                chartTop);

          return {
            x,
            y,
            ...bucket,
          };
        }
      );

    const productivityPath =
      productivityPoints
        .map(
          (point, index) =>
            `${
              index === 0
                ? "M"
                : "L"
            } ${point.x} ${point.y}`
        )
        .join(" ");

    const productivityAreaPath =
      productivityPoints.length > 0
        ? `${productivityPath} L ${
            productivityPoints[
              productivityPoints.length -
                1
            ].x
          } ${chartBottom} L ${
            productivityPoints[0].x
          } ${chartBottom} Z`
        : "";

    /*
     * Completion streaks.
     */
    const completedDateKeys =
      Array.from(
        new Set(
          safeArchive
            .map((task: any) => {
              const date =
                getArchiveDate(task);

              return date
                ? getLocalDateKey(date)
                : null;
            })
            .filter(Boolean) as string[]
        )
      ).sort();

    let longestStreak = 0;
    let runningStreak = 0;
    let previousDate:
      | Date
      | null = null;

    completedDateKeys.forEach(
      (dateKey) => {
        const date = new Date(
          `${dateKey}T00:00:00`
        );

        if (!previousDate) {
          runningStreak = 1;
        } else {
          const expectedDate =
            new Date(previousDate);

          expectedDate.setDate(
            expectedDate.getDate() + 1
          );

          runningStreak =
            getLocalDateKey(
              expectedDate
            ) === dateKey
              ? runningStreak + 1
              : 1;
        }

        longestStreak = Math.max(
          longestStreak,
          runningStreak
        );

        previousDate = date;
      }
    );

    const completedDateSet =
      new Set(completedDateKeys);

    const streakCursor =
      new Date(today);

    /*
     * A streak remains current when the
     * most recent completion was yesterday.
     */
    if (
      !completedDateSet.has(
        getLocalDateKey(
          streakCursor
        )
      )
    ) {
      streakCursor.setDate(
        streakCursor.getDate() - 1
      );
    }

    let currentStreak = 0;

    while (
      completedDateSet.has(
        getLocalDateKey(
          streakCursor
        )
      )
    ) {
      currentStreak += 1;

      streakCursor.setDate(
        streakCursor.getDate() - 1
      );
    }

    return {
      totalClosed,
      closedLastSevenDays,
      averagePerDay:
        closedLastSevenDays === 0
          ? "0.0"
          : (
              closedLastSevenDays / 7
            ).toFixed(1),
      topCategory:
        categoryBreakdown[0]
          ?.label || "—",
      topCategoryPercentage:
        categoryBreakdown[0]
          ?.percentage || 0,
      categoryBreakdown,
      donutBackground,
      taskTypeBreakdown,
      topTaskType:
        taskTypeBreakdown[0]
          ?.label ||
        "General execution",
      productivityBuckets,
      productivityPoints,
      productivityPath,
      productivityAreaPath,
      peakProductivityLabel:
        peakProductivity
          ?.friendlyLabel ||
        "your working day",
      currentStreak,
      longestStreak,
      activeCompletionDays:
        completedDateKeys.length,
    };
  }, [safeArchive, darkMode]);

  /*
   * Group the history beneath the
   * analytics section.
   */
  const groupedArchive = useMemo(
    () => {
      const sortedArchive = [
        ...safeArchive,
      ].sort(
        (a: any, b: any) => {
          const dateA =
            getArchiveDate(a);

          const dateB =
            getArchiveDate(b);

          return (
            (dateB?.getTime() ||
              0) -
            (dateA?.getTime() ||
              0)
          );
        }
      );

      if (
        groupBy === "priority"
      ) {
        const priorityOrder = [
          "High",
          "Medium",
          "Low",
          "No priority",
        ];

        return priorityOrder
          .map((priority) => {
            const items =
              sortedArchive.filter(
                (task: any) => {
                  const taskPriority =
                    task.priority ||
                    "No priority";

                  return (
                    taskPriority ===
                    priority
                  );
                }
              );

            return {
              key: `priority:${priority}`,
              title: priority,
              items,
            };
          })
          .filter(
            (group) =>
              group.items.length > 0
          );
      }

      const dateGroups = new Map<
        string,
        {
          key: string;
          title: string;
          items: any[];
        }
      >();

      sortedArchive.forEach(
        (task: any) => {
          const completedDate =
            getArchiveDate(task);

          const key = completedDate
            ? getLocalDateKey(
                completedDate
              )
            : "unknown-date";

          const title = completedDate
            ? getDateGroupLabel(
                completedDate
              )
            : "Date unavailable";

          if (
            !dateGroups.has(key)
          ) {
            dateGroups.set(key, {
              key: `date:${key}`,
              title,
              items: [],
            });
          }

          dateGroups
            .get(key)
            ?.items.push(task);
        }
      );

      return Array.from(
        dateGroups.values()
      );
    },
    [safeArchive, groupBy]
  );

  /*
   * Create a compact signature so the AI
   * is called only when archived work changes.
   */
  const archiveSignature =
    useMemo(() => {
      const signatureSource =
        safeArchive
          .map((task: any) =>
            [
              task.id,
              task.title,
              task.category,
              task.completedAt,
            ].join(":")
          )
          .sort()
          .join("|");

      let hash = 2166136261;

      for (
        let index = 0;
        index <
        signatureSource.length;
        index += 1
      ) {
        hash ^=
          signatureSource.charCodeAt(
            index
          );

        hash = Math.imul(
          hash,
          16777619
        );
      }

      return `${safeArchive.length}-${(
        hash >>> 0
      ).toString(36)}`;
    }, [safeArchive]);

  const archiveInsightPayload =
    useMemo(
      () => ({
        totalClosed:
          analytics.totalClosed,
        closedLastSevenDays:
          analytics.closedLastSevenDays,
        averagePerDay:
          analytics.averagePerDay,
        topCategory:
          analytics.topCategory,
        categoryBreakdown:
          analytics.categoryBreakdown.map(
            (item) => ({
              label: item.label,
              count: item.count,
              percentage:
                item.percentage,
            })
          ),
        taskTypeBreakdown:
          analytics.taskTypeBreakdown.map(
            (item) => ({
              label: item.label,
              count: item.count,
              percentage:
                item.percentage,
            })
          ),
        productivityRhythm:
          analytics.productivityBuckets.map(
            (item) => ({
              label: item.label,
              count: item.count,
            })
          ),
        peakProductivityPeriod:
          analytics.peakProductivityLabel,
        currentStreak:
          analytics.currentStreak,
        longestStreak:
          analytics.longestStreak,
        recentTasks: safeArchive
          .slice(0, 40)
          .map((task: any) => ({
            title:
              task.title || "",
            category:
              task.category ||
              "No category",
            priority:
              task.priority ||
              "No priority",
            completedAt:
              task.completedAt ||
              null,
          })),
      }),
      [analytics, safeArchive]
    );

 /*
* Load AI interpretation only while the
* dedicated Insights view is open.
*
* Archive remains a lightweight historical list
* and does not trigger an AI request.
*/
useEffect(() => {
const cacheKey =
  "momentuhm-archive-ai-insight-v1";

if (!isInsightsMode) {
  return;
}

if (safeArchive.length < 5) {
  setAiInsight(null);
  setAiInsightLoading(false);
  setAiInsightError("");
  return;
}

try {
  const cachedValue =
    localStorage.getItem(
      cacheKey
    );

  if (cachedValue) {
    const parsedCache =
      JSON.parse(cachedValue);

    if (
      parsedCache?.signature ===
        archiveSignature &&
      parsedCache?.insight
    ) {
      setAiInsight(
        parsedCache.insight
      );

      setAiInsightLoading(
        false
      );

      setAiInsightError("");
      return;
    }
  }
} catch {
  localStorage.removeItem(
    cacheKey
  );
}

const controller =
  new AbortController();

const timer =
  window.setTimeout(
    async () => {
      setAiInsightLoading(
        true
      );

      setAiInsightError("");

      try {
        const response =
          await fetch(
            "/api/archive-insights",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                archiveInsightPayload
              ),
              signal:
                controller.signal,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Could not create archive insight."
          );
        }

        const nextInsight =
          data?.insight;

        if (
          !nextInsight?.headline ||
          !nextInsight?.summary ||
          !nextInsight?.recommendation
        ) {
          throw new Error(
            "The archive insight was incomplete."
          );
        }

        setAiInsight(
          nextInsight
        );

        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            signature:
              archiveSignature,
            insight:
              nextInsight,
            generatedAt:
              new Date().toISOString(),
          })
        );
      } catch (error) {
        if (
          controller.signal
            .aborted
        ) {
          return;
        }

        console.error(
          "Archive AI insight failed:",
          error
        );

        setAiInsightError(
          "AI interpretation is temporarily unavailable. Your calculated analytics are still shown."
        );
      } finally {
        if (
          !controller.signal
            .aborted
        ) {
          setAiInsightLoading(
            false
          );
        }
      }
    },
    700
  );

return () => {
  controller.abort();
  window.clearTimeout(timer);
};
}, [
isInsightsMode,
archiveSignature,
archiveInsightPayload,
safeArchive.length,
]);

/*
* Insights should only make pattern-based claims
* after enough completed work has been collected.
*/
const minimumTasksForInsights = 5;

const hasEnoughInsightsData =
safeArchive.length >=
minimumTasksForInsights;

const tasksNeededForInsights =
Math.max(
  0,
  minimumTasksForInsights -
    safeArchive.length
);

const insightsProgressPercent =
Math.min(
  100,
  Math.round(
    (safeArchive.length /
      minimumTasksForInsights) *
      100
  )
);

const fallbackInsight:
ArchiveAIInsight =
!hasEnoughInsightsData
  ? {
      headline:
        "Complete more tasks to unlock insights",

      summary:
        tasksNeededForInsights === 1
          ? "Momentuhm needs one more archived task before identifying a meaningful execution pattern."
          : `Momentuhm needs ${tasksNeededForInsights} more archived tasks before identifying a meaningful execution pattern.`,

      recommendation:
        "Keep archiving completed work to build a clearer picture of your focus and productivity.",
    }
  : {
      headline: `${analytics.topCategory} leads your completed work`,

      summary: `Your strongest recorded pattern is ${analytics.topTaskType.toLowerCase()} work, with most completions happening during ${analytics.peakProductivityLabel}.`,

      recommendation: `Protect time for ${analytics.topCategory} work during ${analytics.peakProductivityLabel}.`,
    };

const displayedInsight =
aiInsight ||
fallbackInsight;

  const panelBorder = darkMode
    ? "border-white/[0.10]"
    : "border-[#DDDDE3]";

  const rowBorder = darkMode
    ? "border-white/[0.08]"
    : "border-[#E8E9ED]";

  const panelSurface = darkMode
    ? "bg-[#14171B]"
    : "bg-white";

  const secondarySurface =
    darkMode
      ? "bg-white/[0.025]"
      : "bg-[#FAFAFB]";

  const insetSurface = darkMode
    ? "bg-[#101317]"
    : "bg-[#F8F9FA]";

  const primaryText = darkMode
    ? "text-white"
    : "text-[#17191F]";

  const secondaryText =
    darkMode
      ? "text-white/82"
      : "text-[#303540]";

  const mutedText = darkMode
    ? "text-white/48"
    : "text-[#6B6F7B]";

  const getPriorityPill = (
    priority?: string
  ) => {
    if (priority === "High") {
      return darkMode
        ? "border-red-400/20 bg-red-400/10 text-red-300"
        : "border-red-200 bg-red-50 text-red-600";
    }

    if (
      priority === "Medium" ||
      priority === "Med"
    ) {
      return darkMode
        ? "border-orange-400/20 bg-orange-400/10 text-orange-300"
        : "border-orange-200 bg-orange-50 text-orange-600";
    }

    if (priority === "Low") {
      return darkMode
        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
        : "border-emerald-200 bg-emerald-50 text-emerald-600";
    }

    return darkMode
      ? "border-white/[0.10] bg-white/[0.04] text-white/55"
      : "border-[#DDDDE3] bg-[#F7F8FA] text-[#5F6572]";
  };

  return (
    <div className="mx-auto w-full max-w-[1500px]">
     {/* Page header */}
<header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
<div>
  <div className="flex items-center gap-3">
    <h1
      className={`text-[28px] font-[760] leading-none tracking-[-0.045em] ${primaryText}`}
    >
      {isInsightsMode
        ? "Insights"
        : "Archived items"}
    </h1>

    {isArchiveMode && (
      <span
        className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[11px] font-[700] ${
          darkMode
            ? "bg-white/[0.08] text-white/62"
            : "bg-[#F0F1F4] text-[#59606C]"
        }`}
      >
        {safeArchive.length}
      </span>
    )}
  </div>

  <p
    className={`mt-2 max-w-[680px] text-[13px] font-[500] leading-5 ${mutedText}`}
  >
    {isInsightsMode
      ? "Understand where your effort goes and identify your strongest execution patterns."
      : "Review and manage the work you have completed and archived."}
  </p>
</div>

{isArchiveMode && (
  <button
    type="button"
    onClick={clearArchive}
    disabled={
      safeArchive.length === 0
    }
    className={`h-10 shrink-0 rounded-[9px] border px-4 text-[12px] font-[650] transition ${
      safeArchive.length === 0
        ? "cursor-not-allowed opacity-30"
        : darkMode
        ? "border-white/[0.10] text-white/62 hover:bg-white/[0.06] hover:text-white"
        : "border-[#DDDDE3] bg-white text-[#555B67] hover:bg-[#F4F5F7] hover:text-[#252933]"
    }`}
  >
    Clear archive
  </button>
)}
</header>

    {/* Summary statistics — Insights only */}
<section
className={
  isInsightsMode
    ? `mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 ${
        hasEnoughInsightsData
          ? "xl:grid-cols-4"
          : ""
      }`
    : "hidden"
}
>
{[
  {
    label: "Total closed",
    value:
      analytics.totalClosed,
    description:
      "All archived tasks",
    icon: CheckCircle2,
    requiresPatternData: false,
  },
  {
    label:
      "Closed last 7 days",
    value:
      analytics.closedLastSevenDays,
    description:
      "Recent completion volume",
    icon: Calendar,
    requiresPatternData: false,
  },
  {
    label:
      "Average per day",
    value:
      analytics.averagePerDay,
    description:
      "Across the last 7 days",
    icon: TrendingUp,
    requiresPatternData: true,
  },
  {
    label: "Top category",
    value:
      analytics.topCategory,
    description:
      "Most completed work",
    icon: LayoutGrid,
    requiresPatternData: true,
  },
]
  .filter(
    (stat) =>
      hasEnoughInsightsData ||
      !stat.requiresPatternData
  )
  .map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className={`min-w-0 rounded-[13px] border p-4 ${panelBorder} ${panelSurface}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`text-[10px] font-[700] uppercase tracking-[0.08em] ${mutedText}`}
                  >
                    {stat.label}
                  </p>

                  <p
                    title={String(
                      stat.value
                    )}
                    className={`mt-3 truncate text-[24px] font-[740] leading-none tracking-[-0.045em] ${primaryText}`}
                  >
                    {stat.value}
                  </p>

                  <p
                    className={`mt-2 text-[10.5px] font-[500] ${mutedText}`}
                  >
                    {stat.description}
                  </p>
                </div>

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border ${
                    darkMode
                      ? "border-white/[0.10] bg-white/[0.04] text-white/55"
                      : "border-[#DDDDE3] bg-[#F7F8FA] text-[#5F6572]"
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={1.7}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>

    {/* AI analytics — Insights only */}
<section
className={
  isInsightsMode
    ? `mb-4 overflow-hidden rounded-[14px] border ${panelBorder} ${panelSurface}`
    : "hidden"
}
>
        <header
          className={`border-b px-4 py-4 sm:px-5 ${rowBorder}`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border ${
                  darkMode
                    ? "border-amber-300/15 bg-amber-300/[0.07] text-amber-200"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                <Sparkles
                  size={16}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h2
                  className={`text-[17px] font-[720] tracking-[-0.025em] ${primaryText}`}
                >
                  AI focus insights
                </h2>

                <p
                  className={`mt-1 text-[11px] font-[500] ${mutedText}`}
                >
                  Discover where your
                  effort goes and which
                  execution patterns are
                  strongest.
                </p>
              </div>
            </div>

            <div
              className={`inline-flex h-8 shrink-0 items-center gap-2 self-start rounded-full border px-3 text-[9.5px] font-[650] ${
                darkMode
                  ? "border-white/[0.09] bg-white/[0.03] text-white/48"
                  : "border-[#E1E2E6] bg-[#F8F9FA] text-[#6B6F7B]"
              }`}
            >
            {!hasEnoughInsightsData ? (
<>
  <Clock3
    size={12}
    strokeWidth={1.8}
  />

  {tasksNeededForInsights} more task
  {tasksNeededForInsights === 1
    ? ""
    : "s"}{" "}
  needed
</>
) : aiInsightLoading ? (
<>
  <Sparkles
    size={12}
    className="animate-pulse"
  />
  Analyzing archive
</>
) : aiInsight ? (
<>
  <Check
    size={12}
  />
  AI analysis ready
</>
) : (
<>
  <LayoutGrid
    size={12}
  />
  Based on archived tasks
</>
)}
            </div>
          </div>

          <div
            className={`mt-4 flex flex-col gap-3 rounded-[11px] border p-3.5 sm:flex-row sm:items-start ${panelBorder} ${insetSurface}`}
          >
            <Sparkles
              size={17}
              strokeWidth={1.8}
              className={
                darkMode
                  ? "mt-0.5 shrink-0 text-violet-300"
                  : "mt-0.5 shrink-0 text-violet-600"
              }
            />

            <div className="min-w-0 flex-1">
              <p
                className={`text-[12.5px] font-[700] leading-5 ${primaryText}`}
              >
                {
                  displayedInsight.headline
                }
              </p>

              <p
                className={`mt-1 text-[11px] font-[500] leading-5 ${mutedText}`}
              >
                {
                  displayedInsight.summary
                }
              </p>
            </div>
          </div>

          {aiInsightError && (
            <p
              className={`mt-2 text-[9.5px] font-[500] ${mutedText}`}
            >
              {aiInsightError}
            </p>
          )}
        </header>

        {hasEnoughInsightsData ? (
<div className="grid gap-3 p-3 lg:grid-cols-2 xl:grid-cols-[1.12fr_1fr_1fr_0.78fr]">
          {/* Category distribution */}
          <article
            className={`flex min-w-0 flex-col rounded-[12px] border p-4 ${panelBorder} ${insetSurface}`}
          >
            <div>
              <h3
                className={`text-[14px] font-[700] ${primaryText}`}
              >
                Where you focus most
              </h3>

              <p
                className={`mt-1 text-[10px] font-[500] ${mutedText}`}
              >
                By category
              </p>
            </div>

            <div className="mt-5 grid flex-1 items-center gap-5 sm:grid-cols-[150px_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[145px_minmax(0,1fr)]">
              <div
                role="img"
                aria-label="Archived tasks by category"
                className="relative mx-auto h-[145px] w-[145px] rounded-full"
                style={{
                  background:
                    analytics.donutBackground,
                }}
              >
                <div
                  className={`absolute inset-[23px] flex flex-col items-center justify-center rounded-full border ${panelBorder} ${panelSurface}`}
                >
                  <span
                    className={`text-[22px] font-[740] leading-none ${primaryText}`}
                  >
                    {
                      analytics.totalClosed
                    }
                  </span>

                  <span
                    className={`mt-1 text-[9px] font-[600] ${mutedText}`}
                  >
                    Total
                  </span>
                </div>
              </div>

              <div className="min-w-0 space-y-2.5">
                {analytics.categoryBreakdown.map(
                  (item) => (
                    <div
                      key={
                        item.label
                      }
                      className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            item.color,
                        }}
                      />

                      <span
                        title={
                          item.label
                        }
                        className={`truncate text-[10px] font-[600] ${secondaryText}`}
                      >
                        {item.label}
                      </span>

                      <span
                        className={`text-[10px] font-[700] tabular-nums ${primaryText}`}
                      >
                        {
                          item.percentage
                        }
                        %
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div
              className={`mt-4 rounded-[9px] border px-3 py-2.5 ${
                darkMode
                  ? "border-amber-300/10 bg-amber-300/[0.05]"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <p
                className={`text-[9.5px] font-[600] leading-4 ${
                  darkMode
                    ? "text-amber-100/80"
                    : "text-amber-800"
                }`}
              >
                You focus most on{" "}
                {
                  analytics.topCategory
                }{" "}
                work.
              </p>
            </div>
          </article>

          {/* Work type */}
          <article
            className={`flex min-w-0 flex-col rounded-[12px] border p-4 ${panelBorder} ${insetSurface}`}
          >
            <div>
              <h3
                className={`text-[14px] font-[700] ${primaryText}`}
              >
                What you complete most
              </h3>

              <p
                className={`mt-1 text-[10px] font-[500] ${mutedText}`}
              >
                By task type
              </p>
            </div>

            <div className="mt-5 flex-1 space-y-4">
              {analytics.taskTypeBreakdown.map(
                (item) => (
                  <div
                    key={item.label}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span
                        className={`truncate text-[10px] font-[600] ${secondaryText}`}
                      >
                        {item.label}
                      </span>

                      <span
                        className={`text-[10px] font-[700] tabular-nums ${primaryText}`}
                      >
                        {
                          item.percentage
                        }
                        %
                      </span>
                    </div>

                    <div
                      className={`h-2 overflow-hidden rounded-full ${
                        darkMode
                          ? "bg-white/[0.07]"
                          : "bg-[#E8E9ED]"
                      }`}
                    >
                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${Math.max(
                            item.percentage,
                            item.count >
                              0
                              ? 4
                              : 0
                          )}%`,
                        }}
                        transition={{
                          duration: 0.7,
                          ease: [
                            0.16,
                            1,
                            0.3,
                            1,
                          ],
                        }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor:
                            item.color,
                        }}
                      />
                    </div>
                  </div>
                )
              )}

              {analytics.taskTypeBreakdown
                .length === 0 && (
                <p
                  className={`text-[11px] font-[500] ${mutedText}`}
                >
                  More completed tasks
                  are needed to identify
                  work types.
                </p>
              )}
            </div>

            <div
              className={`mt-4 rounded-[9px] border px-3 py-2.5 ${
                darkMode
                  ? "border-emerald-300/10 bg-emerald-300/[0.05]"
                  : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <p
                className={`text-[9.5px] font-[600] leading-4 ${
                  darkMode
                    ? "text-emerald-100/80"
                    : "text-emerald-800"
                }`}
              >
                {
                  analytics.topTaskType
                }{" "}
                tasks lead your
                completions.
              </p>
            </div>
          </article>

          {/* Productivity rhythm */}
          <article
            className={`flex min-w-0 flex-col rounded-[12px] border p-4 ${panelBorder} ${insetSurface}`}
          >
            <div>
              <h3
                className={`text-[14px] font-[700] ${primaryText}`}
              >
                Your productivity rhythm
              </h3>

              <p
                className={`mt-1 text-[10px] font-[500] ${mutedText}`}
              >
                By time of day
              </p>
            </div>

            <div className="mt-4 flex-1">
              <svg
                viewBox="0 0 360 125"
                className="h-[145px] w-full overflow-visible"
                aria-label="Task completion rhythm by time of day"
                role="img"
              >
                <defs>
                  <linearGradient
                    id="archive-productivity-area"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#8B5CF6"
                      stopOpacity="0.28"
                    />
                    <stop
                      offset="100%"
                      stopColor="#8B5CF6"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                {[20, 50, 80, 110].map(
                  (y) => (
                    <line
                      key={y}
                      x1="15"
                      x2="345"
                      y1={y}
                      y2={y}
                      stroke={
                        darkMode
                          ? "rgba(255,255,255,0.07)"
                          : "rgba(23,25,31,0.08)"
                      }
                      strokeWidth="1"
                    />
                  )
                )}

                {analytics.productivityAreaPath && (
                  <path
                    d={
                      analytics.productivityAreaPath
                    }
                    fill="url(#archive-productivity-area)"
                  />
                )}

                {analytics.productivityPath && (
                  <motion.path
                    initial={{
                      pathLength: 0,
                      opacity: 0,
                    }}
                    animate={{
                      pathLength: 1,
                      opacity: 1,
                    }}
                    transition={{
                      duration: 0.8,
                    }}
                    d={
                      analytics.productivityPath
                    }
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {analytics.productivityPoints.map(
                  (point) => (
                    <circle
                      key={
                        point.label
                      }
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#8B5CF6"
                      stroke={
                        darkMode
                          ? "#14171B"
                          : "#FFFFFF"
                      }
                      strokeWidth="2"
                    />
                  )
                )}
              </svg>

              <div className="grid grid-cols-6 gap-1">
                {analytics.productivityBuckets.map(
                  (bucket) => (
                    <div
                      key={
                        bucket.label
                      }
                      className="text-center"
                    >
                      <p
                        className={`text-[8px] font-[600] ${mutedText}`}
                      >
                        {bucket.label}
                      </p>

                      <p
                        className={`mt-1 text-[9px] font-[700] ${secondaryText}`}
                      >
                        {bucket.count}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div
              className={`mt-4 rounded-[9px] border px-3 py-2.5 ${
                darkMode
                  ? "border-violet-300/10 bg-violet-300/[0.05]"
                  : "border-violet-200 bg-violet-50"
              }`}
            >
              <p
                className={`text-[9.5px] font-[600] leading-4 ${
                  darkMode
                    ? "text-violet-100/80"
                    : "text-violet-800"
                }`}
              >
                You complete the most
                work during{" "}
                {
                  analytics.peakProductivityLabel
                }.
              </p>
            </div>
          </article>

          {/* Streaks */}
          <article
            className={`flex min-w-0 flex-col rounded-[12px] border p-4 ${panelBorder} ${insetSurface}`}
          >
            <div>
              <h3
                className={`text-[14px] font-[700] ${primaryText}`}
              >
                Streaks & momentum
              </h3>

              <p
                className={`mt-1 text-[10px] font-[500] ${mutedText}`}
              >
                By completion day
              </p>
            </div>

            <div className="mt-5 flex-1 space-y-3">
              <div
                className={`rounded-[10px] border p-3 ${panelBorder} ${panelSurface}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      darkMode
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <Flame
                      size={18}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <p
                      className={`text-[9px] font-[600] ${mutedText}`}
                    >
                      Longest streak
                    </p>

                    <p
                      className={`mt-1 text-[21px] font-[740] leading-none ${primaryText}`}
                    >
                      {
                        analytics.longestStreak
                      }{" "}
                      day
                      {analytics.longestStreak ===
                      1
                        ? ""
                        : "s"}
                    </p>

                    <p
                      className={`mt-2 text-[8.5px] font-[500] ${mutedText}`}
                    >
                      Completed at least
                      one task
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-[10px] border p-3 ${panelBorder} ${panelSurface}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      darkMode
                        ? "bg-blue-400/10 text-blue-300"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <TrendingUp
                      size={18}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <p
                      className={`text-[9px] font-[600] ${mutedText}`}
                    >
                      Current streak
                    </p>

                    <p
                      className={`mt-1 text-[21px] font-[740] leading-none ${primaryText}`}
                    >
                      {
                        analytics.currentStreak
                      }{" "}
                      day
                      {analytics.currentStreak ===
                      1
                        ? ""
                        : "s"}
                    </p>

                    <p
                      className={`mt-2 text-[8.5px] font-[500] ${mutedText}`}
                    >
                      {analytics.currentStreak >
                      0
                        ? "Keep it going"
                        : "Complete a task today"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-[10px] border p-3 ${panelBorder} ${panelSurface}`}
              >
                <p
                  className={`text-[9px] font-[600] ${mutedText}`}
                >
                  Active completion days
                </p>

                <p
                  className={`mt-1 text-[17px] font-[720] ${primaryText}`}
                >
                  {
                    analytics.activeCompletionDays
                  }
                </p>
              </div>
            </div>

            <div
className={`mt-4 rounded-[9px] border px-3 py-2.5 ${
  darkMode
    ? "border-blue-300/10 bg-blue-300/[0.05]"
    : "border-blue-200 bg-blue-50"
}`}
>
<p
  className={`text-[9.5px] font-[600] leading-4 ${
    darkMode
      ? "text-blue-100/80"
      : "text-blue-800"
  }`}
>
  {
    displayedInsight.recommendation
  }
</p>
</div>
</article>
</div>
) : (
/* Low-data unlock state */
<div className="p-3">
  <div
    className={`flex min-h-[300px] items-center justify-center rounded-[12px] border px-5 py-10 text-center sm:px-8 ${panelBorder} ${insetSurface}`}
  >
    <div className="w-full max-w-[520px]">
      <div
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] border ${
          darkMode
            ? "border-white/[0.10] bg-white/[0.04] text-white/60"
            : "border-[#DDDDE3] bg-white text-[#5F6572]"
        }`}
      >
        <Sparkles
          size={20}
          strokeWidth={1.7}
        />
      </div>

      <h3
        className={`mt-5 text-[18px] font-[720] tracking-[-0.025em] ${primaryText}`}
      >
        Complete{" "}
        {tasksNeededForInsights} more{" "}
        task
        {tasksNeededForInsights === 1
          ? ""
          : "s"}{" "}
        to unlock insights
      </h3>

      <p
        className={`mx-auto mt-2 max-w-[430px] text-[12px] font-[500] leading-5 ${mutedText}`}
      >
        Momentuhm needs at least five
        archived tasks before showing
        focus patterns, task-type
        analysis, productivity rhythms,
        or recommendations.
      </p>

      <div className="mx-auto mt-6 max-w-[360px]">
        <div className="flex items-center justify-between gap-4">
          <span
            className={`text-[10px] font-[650] ${mutedText}`}
          >
            Building your data
          </span>

          <span
            className={`text-[10px] font-[700] tabular-nums ${secondaryText}`}
          >
            {safeArchive.length} /{" "}
            {minimumTasksForInsights}
          </span>
        </div>

        <div
          className={`mt-2 h-2 overflow-hidden rounded-full ${
            darkMode
              ? "bg-white/[0.08]"
              : "bg-[#E5E7EB]"
          }`}
        >
          <motion.div
            initial={{
              width: 0,
            }}
            animate={{
              width: `${insightsProgressPercent}%`,
            }}
            transition={{
              duration: 0.6,
              ease: [
                0.16,
                1,
                0.3,
                1,
              ],
            }}
            className={`h-full rounded-full ${
              darkMode
                ? "bg-white/70"
                : "bg-[#252933]"
            }`}
          />
        </div>
      </div>

      <div
        className={`mx-auto mt-6 grid max-w-[430px] gap-2 text-left sm:grid-cols-2 ${
          darkMode
            ? "text-white/52"
            : "text-[#666C78]"
        }`}
      >
        {[
          "Category patterns",
          "Task-type analysis",
          "Productivity rhythm",
          "AI recommendations",
        ].map((feature) => (
          <div
            key={feature}
            className={`flex min-h-[38px] items-center gap-2 rounded-[8px] border px-3 text-[10px] font-[600] ${
              darkMode
                ? "border-white/[0.08] bg-white/[0.025]"
                : "border-[#E1E2E6] bg-white"
            }`}
          >
            <Clock3
              size={12}
              strokeWidth={1.7}
              className="shrink-0 opacity-60"
            />

            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
)}
</section>

    {/* Completion history — Archive only */}
<section
className={
  isArchiveMode
    ? `overflow-hidden rounded-[14px] border ${panelBorder} ${panelSurface}`
    : "hidden"
}
>
        <div
          className={`flex min-h-[68px] flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${rowBorder}`}
        >
          <div>
            <h2
              className={`text-[17px] font-[720] tracking-[-0.025em] ${primaryText}`}
            >
              Completion history
            </h2>

            <p
              className={`mt-1 text-[11px] font-[500] ${mutedText}`}
            >
              Group completed work by
              completion date or task
              priority.
            </p>
          </div>

          <label className="relative shrink-0">
            <span className="sr-only">
              Group archived tasks
            </span>

            <select
              value={groupBy}
              onChange={(event) =>
                setGroupBy(
                  event.target
                    .value as
                    | "date"
                    | "priority"
                )
              }
              className={`h-9 min-w-[150px] appearance-none rounded-[8px] border bg-transparent pl-3 pr-8 text-[11px] font-[650] outline-none transition ${
                darkMode
                  ? "border-white/[0.10] text-white/72 hover:border-white/[0.20]"
                  : "border-[#DDDDE3] text-[#484D59] hover:border-[#BFC0C8]"
              }`}
            >
              <option value="date">
                Group: Date
              </option>

              <option value="priority">
                Group: Priority
              </option>
            </select>

            <ChevronDown
              size={13}
              className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${mutedText}`}
            />
          </label>
        </div>

        {safeArchive.length ===
        0 ? (
          <div className="flex min-h-[300px] items-center justify-center px-6 py-12 text-center">
            <div className="max-w-[360px]">
              <div
                className={`mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] border ${
                  darkMode
                    ? "border-white/[0.10] bg-white/[0.04] text-white/55"
                    : "border-[#DDDDE3] bg-[#F7F8FA] text-[#5F6572]"
                }`}
              >
                <CheckCircle2
                  size={19}
                  strokeWidth={1.7}
                />
              </div>

              <h3
                className={`mt-4 text-[16px] font-[700] ${primaryText}`}
              >
                No archived work yet
              </h3>

              <p
                className={`mt-2 text-[12px] font-[500] leading-5 ${mutedText}`}
              >
                Completed tasks will
                appear here after they
                are archived.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {groupedArchive.map(
              (group) => (
                <section
                  key={group.key}
                >
                  <div
                    className={`flex min-h-[38px] items-center gap-2 border-b px-4 sm:px-5 ${rowBorder} ${secondarySurface}`}
                  >
                    <h3
                      className={`text-[11px] font-[700] ${
                        darkMode
                          ? "text-white/68"
                          : "text-[#565C68]"
                      }`}
                    >
                      {group.title}
                    </h3>

                    <span
                      className={`text-[10px] font-[650] ${mutedText}`}
                    >
                      {
                        group.items
                          .length
                      }
                    </span>
                  </div>

                  <AnimatePresence
                    initial={false}
                    mode="popLayout"
                  >
                    {group.items.map(
                      (task: any) => {
                        const completedDate =
                          getArchiveDate(
                            task
                          );

                        const priorityLabel =
                          task.priority ===
                            "Medium" ||
                          task.priority ===
                            "Med"
                            ? "Medium"
                            : task.priority ||
                              "No priority";

                        return (
                          <motion.div
                            key={
                              task.id
                            }
                            layout
                            initial={{
                              opacity: 0,
                              y: 4,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              y: -4,
                            }}
                            transition={{
                              duration: 0.18,
                              ease: [
                                0.16,
                                1,
                                0.3,
                                1,
                              ],
                            }}
                            className={`grid min-h-[68px] grid-cols-1 gap-3 border-b px-4 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5 ${rowBorder}`}
                          >
                            <div className="min-w-0">
                              <p
                                title={
                                  task.title
                                }
                                className={`truncate text-[13px] font-[650] tracking-[-0.015em] ${
                                  darkMode
                                    ? "text-white/88"
                                    : "text-[#20232B]"
                                }`}
                              >
                                {
                                  task.title
                                }
                              </p>

                              <div
                                className={`mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-[500] ${mutedText}`}
                              >
                                <span>
                                  {task.category ||
                                    "No category"}
                                </span>

                                {task.dueDate && (
                                  <>
                                    <span
                                      aria-hidden="true"
                                      className="opacity-40"
                                    >
                                      •
                                    </span>

                                    <span>
                                      Due{" "}
                                      {formatDueDate(
                                        task.dueDate
                                      )}
                                    </span>
                                  </>
                                )}

                                {completedDate && (
                                  <>
                                    <span
                                      aria-hidden="true"
                                      className="opacity-40"
                                    >
                                      •
                                    </span>

                                    <span>
                                      Closed{" "}
                                      {completedDate.toLocaleTimeString(
                                        undefined,
                                        {
                                          hour:
                                            "2-digit",
                                          minute:
                                            "2-digit",
                                        }
                                      )}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`rounded-[6px] border px-2 py-1 text-[10px] font-[650] ${getPriorityPill(
                                  task.priority
                                )}`}
                              >
                                {
                                  priorityLabel
                                }
                              </span>

                              {groupBy ===
                                "priority" &&
                                completedDate && (
                                  <time
                                    dateTime={
                                      task.completedAt
                                    }
                                    className={`whitespace-nowrap text-[10.5px] font-[500] ${mutedText}`}
                                  >
                                    {completedDate.toLocaleDateString(
                                      undefined,
                                      {
                                        month:
                                          "short",
                                        day: "numeric",
                                      }
                                    )}
                                  </time>
                                )}
                            </div>
                          </motion.div>
                        );
                      }
                    )}
                  </AnimatePresence>
                </section>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}


function CategoriesView({
  darkMode,
  categories,
  newCategory,
  setNewCategory,
  addCategory,
  editingCategoryId,
  setEditingCategoryId,
  editingCategoryTitle,
  setEditingCategoryTitle,
  renameCategory,
  deleteCategory,
}: any) {
  const panelBorder = darkMode
    ? "border-white/[0.10]"
    : "border-[#DDDDE3]";

  const rowBorder = darkMode
    ? "border-white/[0.08]"
    : "border-[#E8E9ED]";

  const panelSurface = darkMode
    ? "bg-[#14171B]"
    : "bg-white";

  const secondarySurface = darkMode
    ? "bg-white/[0.025]"
    : "bg-[#FAFAFB]";

  const primaryText = darkMode
    ? "text-white"
    : "text-[#17191F]";

  const secondaryText = darkMode
    ? "text-white/82"
    : "text-[#252933]";

  const mutedText = darkMode
    ? "text-white/48"
    : "text-[#6B6F7B]";

  const inputClass = darkMode
    ? "border-white/[0.16] bg-white/[0.035] text-white placeholder:text-white/35 focus:border-white/[0.32]"
    : "border-[#C9CBD1] bg-white text-[#252933] placeholder:text-[#80868B] focus:border-[#8F939C]";

  const beginEditingCategory = (
    category: any
  ) => {
    setEditingCategoryId(category.id);
    setEditingCategoryTitle(
      category.title
    );
  };

  const cancelEditingCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryTitle("");
  };

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      {/* Page header */}
      <header className="mb-5">
        <h1
          className={`text-[28px] font-[760] leading-none tracking-[-0.045em] ${primaryText}`}
        >
          Categories
        </h1>

        <p
          className={`mt-2 text-[13px] font-[500] leading-5 ${mutedText}`}
        >
          Organize tasks into clear working
          areas.
        </p>
      </header>

      {/* Create category */}
      <section
        aria-label="Create category"
        className={`mb-5 rounded-[14px] border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] sm:p-5 ${panelBorder} ${panelSurface}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={newCategory}
            onChange={(event) =>
              setNewCategory(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                newCategory.trim()
              ) {
                event.preventDefault();
                addCategory();
              }
            }}
            placeholder="Create new category"
            aria-label="New category name"
            className={`h-11 min-w-0 flex-1 rounded-[9px] border px-3.5 text-[13px] font-[520] outline-none transition ${inputClass}`}
          />

          <button
            type="button"
            onClick={addCategory}
            disabled={!newCategory.trim()}
            className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[9px] px-5 text-[12px] font-[700] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 ${
              darkMode
                ? "bg-white text-[#181818] hover:bg-white/90"
                : "bg-[#20232B] text-white hover:bg-[#30343D]"
            }`}
          >
            <Plus
              size={15}
              strokeWidth={1.9}
            />
            Add category
          </button>
        </div>
      </section>

{/* Category list */}
<section
aria-label="Category list"
className={`overflow-hidden rounded-[14px] border shadow-[0_1px_2px_rgba(15,23,42,0.02)] ${panelBorder} ${panelSurface}`}
>
<header
  className={`flex min-h-[66px] items-center justify-between gap-4 border-b px-4 sm:px-5 ${rowBorder} ${secondarySurface}`}
>
  <div>
    <h2
      className={`text-[17px] font-[720] tracking-[-0.025em] ${primaryText}`}
    >
      Working areas
    </h2>

    <p
      className={`mt-1 text-[11px] font-[500] ${mutedText}`}
    >
      Select a name to rename the
      category.
    </p>
  </div>

  <span
    className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2.5 text-[10px] font-[700] ${
      darkMode
        ? "bg-white/[0.07] text-white/60"
        : "bg-[#F0F1F4] text-[#59606C]"
    }`}
  >
    {
      categories.filter(
        (category: any) =>
          category.title !== "-"
      ).length
    }
  </span>
</header>

{categories.filter(
  (category: any) =>
    category.title !== "-"
).length === 0 ? (
  <div className="flex min-h-[260px] items-center justify-center px-6 py-12 text-center">
    <div className="max-w-[340px]">
      <div
        className={`mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] border ${
          darkMode
            ? "border-white/[0.10] bg-white/[0.04] text-white/55"
            : "border-[#DDDDE3] bg-[#F7F8FA] text-[#5F6572]"
        }`}
      >
        <LayoutGrid
          size={19}
          strokeWidth={1.7}
        />
      </div>

      <h3
        className={`mt-4 text-[16px] font-[700] ${primaryText}`}
      >
        No categories yet
      </h3>

      <p
        className={`mt-2 text-[12px] font-[500] leading-5 ${mutedText}`}
      >
        Create a working area to start
        organizing your tasks.
      </p>
    </div>
  </div>
) : (
  <div>
    {categories
      /*
       * Hide the internal no-category storage bucket.
       */
      .filter(
        (category: any) =>
          category.title !== "-"
      )
      .map((category: any) => {
        const isEditing =
          editingCategoryId ===
          category.id;

        const taskCount =
          Array.isArray(
            category.tasks
          )
            ? category.tasks.length
            : 0;

        return (
          <div
            key={category.id}
            className={`flex min-h-[68px] items-center gap-3 border-b px-4 py-3 last:border-b-0 sm:px-5 ${rowBorder} ${
              darkMode
                ? "hover:bg-white/[0.025]"
                : "hover:bg-[#FBFBFC]"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border ${
                darkMode
                  ? "border-white/[0.10] bg-white/[0.04] text-white/55"
                  : "border-[#DDDDE3] bg-[#F7F8FA] text-[#5F6572]"
              }`}
            >
              <LayoutGrid
                size={15}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  autoFocus
                  value={
                    editingCategoryTitle
                  }
                  onChange={(event) =>
                    setEditingCategoryTitle(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" &&
                      editingCategoryTitle.trim()
                    ) {
                      event.preventDefault();

                      renameCategory(
                        category.id
                      );
                    }

                    if (
                      event.key ===
                      "Escape"
                    ) {
                      event.preventDefault();
                      cancelEditingCategory();
                    }
                  }}
                  aria-label={`Rename ${category.title}`}
                  className={`h-10 w-full rounded-[8px] border px-3 text-[12px] font-[600] outline-none transition ${inputClass}`}
                />
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    beginEditingCategory(
                      category
                    )
                  }
                  className="block max-w-full text-left"
                >
                  <p
                    title={
                      category.title
                    }
                    className={`truncate text-[13px] font-[650] tracking-[-0.015em] transition hover:opacity-70 ${secondaryText}`}
                  >
                    {category.title}
                  </p>

                  <p
                    className={`mt-1 text-[10px] font-[500] ${mutedText}`}
                  >
                    {taskCount} task
                    {taskCount === 1
                      ? ""
                      : "s"}
                  </p>
                </button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      renameCategory(
                        category.id
                      )
                    }
                    disabled={
                      !editingCategoryTitle.trim()
                    }
                    className={`h-9 rounded-[8px] px-3 text-[10px] font-[700] transition disabled:cursor-not-allowed disabled:opacity-35 ${
                      darkMode
                        ? "bg-white text-[#181818] hover:bg-white/90"
                        : "bg-[#20232B] text-white hover:bg-[#30343D]"
                    }`}
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={
                      cancelEditingCategory
                    }
                    className={`h-9 rounded-[8px] border px-3 text-[10px] font-[650] transition ${
                      darkMode
                        ? "border-white/[0.10] text-white/58 hover:bg-white/[0.06] hover:text-white"
                        : "border-[#DDDDE3] bg-white text-[#5F6572] hover:bg-[#F4F5F7] hover:text-[#252933]"
                    }`}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    deleteCategory(
                      category.id
                    )
                  }
                  aria-label={`Delete ${category.title}`}
                  title="Delete category"
                  className={`flex h-9 w-9 items-center justify-center rounded-[8px] border transition ${
                    darkMode
                      ? "border-white/[0.08] text-white/35 hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-300"
                      : "border-[#E1E2E6] text-[#8A8F99] hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  <Trash2
                    size={14}
                    strokeWidth={1.7}
                  />
                </button>
              )}
            </div>
          </div>
        );
      })}
  </div>
)}
</section>    

    </div>
  );
}

/* ------------------------------------------------ */
/* Small Components */
/* ------------------------------------------------ */

function PageHeader({
  title,
  description,
  children,
  darkMode,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
  darkMode: boolean;
}) {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
      <div>
      <h2 className="text-[24px] font-[700] tracking-[-0.04em] sm:text-[32px]">
          {title}
        </h2>

        <p
          className={`mt-2 text-[13px] sm:text-sm ${
            darkMode ? "text-white/55" : "text-[#666661]/45"
          }`}
        >
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  themeColor,
  className,
  border,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  themeColor: string;
  className: string;
  border: string;
}) {
  return (
    <div
    className={`flex min-h-[78px] min-w-[118px] flex-col items-center justify-center gap-2 rounded-[22px] border px-2 text-center transition-all duration-200 hover:-translate-y-0.5 sm:min-w-0 sm:min-h-[88px] sm:flex-row sm:justify-start sm:gap-4 sm:rounded-[26px] sm:px-5 sm:text-left ${className} ${border}`}
    >
      <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_14px_30px_rgba(0,0,0,0.16)] sm:h-11 sm:w-11"
        style={{
          backgroundColor: themeColor,
        }}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[18px] font-[700] leading-none tracking-[-0.04em] sm:text-[24px]">
          {value}
        </p>

        <p className="mt-1 truncate text-[10px] font-[700] leading-tight opacity-45 sm:mt-1.5 sm:text-xs">
          {label}
        </p>
      </div>
    </div>
  );
}

function AssistantItem({ icon, title, description, color, darkMode }: any) {
  return (
    <div className="flex gap-3">
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm font-[700]">{title}</p>
        <p
          className={`mt-1 text-xs leading-5 ${
            darkMode ? "text-white/42" : "text-[#666661]/42"
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function CompactMetric({
  label,
  value,
  color,
  darkMode,
}: {
  label: string;
  value: string | number;
  color: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
        darkMode
          ? "border-white/[0.07] bg-white/[0.04]"
          : "border-black/[0.045] bg-white/70"
      }`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />

      <span className="text-[12px] font-[900]">{value}</span>

      <span
        className={`text-[11px] font-[700] ${
          darkMode ? "text-white/38" : "text-[#666661]/38"
        }`}
      >
        {label}
      </span>
    </div>
  );
}


function DayTimeLeftCard({
  dayEndTime,
  setDayEndTime,
  dayTimeRemaining,
  darkMode,
  themeColor,
}: any) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const getTimeParts = (value: string) => {
    const [rawHour, rawMinute] = String(value || "18:00")
      .split(":")
      .map(Number);

    const hour24 = Number.isFinite(rawHour)
      ? Math.min(23, Math.max(0, rawHour))
      : 18;

    const minuteNumber = Number.isFinite(rawMinute)
      ? Math.min(59, Math.max(0, rawMinute))
      : 0;

    const period: "AM" | "PM" =
      hour24 >= 12 ? "PM" : "AM";

    const displayHour =
      hour24 === 0
        ? 12
        : hour24 > 12
        ? hour24 - 12
        : hour24;

    return {
      hour: displayHour,
      minute: String(minuteNumber).padStart(2, "0"),
      period,
    };
  };

  const currentParts = getTimeParts(dayEndTime);

  /*
  * The picker edits draft values. The actual day end time
  * changes only when the picker is closed.
  */
  const [draftHour, setDraftHour] = useState(
    currentParts.hour
  );

  const [draftMinute, setDraftMinute] = useState(
    currentParts.minute
  );

  const [draftPeriod, setDraftPeriod] = useState<
    "AM" | "PM"
  >(currentParts.period);

  const hourOptions = Array.from(
    { length: 12 },
    (_, index) => index + 1
  );

  const minuteOptions = Array.from(
    { length: 12 },
    (_, index) =>
      String(index * 5).padStart(2, "0")
  );

  const saveDraftTime = () => {
    let hour24 = draftHour;

    if (draftPeriod === "AM" && draftHour === 12) {
      hour24 = 0;
    }

    if (draftPeriod === "PM" && draftHour !== 12) {
      hour24 = draftHour + 12;
    }

    setDayEndTime(
      `${String(hour24).padStart(
        2,
        "0"
      )}:${draftMinute}`
    );
  };

  const openPicker = () => {
    const latestParts = getTimeParts(dayEndTime);

    setDraftHour(latestParts.hour);
    setDraftMinute(latestParts.minute);
    setDraftPeriod(latestParts.period);
    setIsPickerOpen(true);
  };

  const togglePicker = () => {
    if (isPickerOpen) {
      saveDraftTime();
      setIsPickerOpen(false);
      return;
    }

    openPicker();
  };

  /*
  * Clicking outside applies the selected time
  * and then closes the picker.
  */
  useEffect(() => {
    if (!isPickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(
          event.target as Node
        )
      ) {
        let hour24 = draftHour;

        if (
          draftPeriod === "AM" &&
          draftHour === 12
        ) {
          hour24 = 0;
        }

        if (
          draftPeriod === "PM" &&
          draftHour !== 12
        ) {
          hour24 = draftHour + 12;
        }

        setDayEndTime(
          `${String(hour24).padStart(
            2,
            "0"
          )}:${draftMinute}`
        );

        setIsPickerOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [
    isPickerOpen,
    draftHour,
    draftMinute,
    draftPeriod,
    setDayEndTime,
  ]);

  const selectClass = `h-9 appearance-none rounded-[8px] border px-2 text-[11px] font-[700] outline-none transition ${
    darkMode
      ? "border-white/[0.12] bg-[#202020] text-white focus:border-white/[0.30]"
      : "border-[#D4D4CF] bg-white text-[#181818] focus:border-[#8B8B85]"
  }`;

  return (
    <div
      ref={pickerRef}
      className="relative z-[1000] inline-block"
    >
      <button
        type="button"
        onClick={togglePicker}
        aria-expanded={isPickerOpen}
        title="Edit day end time"
        className={`group flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-left transition ${
          darkMode
            ? "hover:bg-white/[0.05]"
            : "hover:bg-black/[0.025]"
        }`}
      >
        <div className="w-[168px]">
          <div className="flex items-baseline justify-between gap-3">
            <span
              className={`whitespace-nowrap text-[13px] font-[700] leading-none tracking-[-0.025em] ${
                darkMode
                  ? "text-white"
                  : "text-[#181818]"
              }`}
            >
              {dayTimeRemaining.label}
            </span>

            <span
              className={`whitespace-nowrap text-[9px] font-[600] ${
                darkMode
                  ? "text-white/35"
                  : "text-[#6F6F6A]"
              }`}
            >
              Ends {currentParts.hour}:
              {currentParts.minute}{" "}
              {currentParts.period}
            </span>
          </div>

          <div
            className={`mt-2 h-[2px] overflow-hidden rounded-full ${
              darkMode
                ? "bg-white/[0.10]"
                : "bg-black/[0.08]"
            }`}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${dayTimeRemaining.percentLeft}%`,
                backgroundColor: themeColor,
              }}
            />
          </div>
        </div>

        <PencilLine
          size={12}
          className={`shrink-0 opacity-35 transition group-hover:opacity-75 ${
            darkMode
              ? "text-white"
              : "text-[#181818]"
          }`}
        />
      </button>

      {isPickerOpen && (
        <div
          className={`absolute left-0 top-[calc(100%+8px)] z-[1100] w-[310px] rounded-[12px] border p-3 shadow-[0_14px_40px_rgba(0,0,0,0.14)] min-[1400px]:left-[calc(100%+16px)] min-[1400px]:top-0 ${
            darkMode
              ? "border-white/[0.10] bg-[#171717]"
              : "border-[#D4D4CF] bg-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`mr-1 shrink-0 text-[9px] font-[700] uppercase tracking-[0.12em] ${
                darkMode
                  ? "text-white/38"
                  : "text-[#6F6F6A]"
              }`}
            >
              End time
            </span>

            <select
              value={draftHour}
              onChange={(event) =>
                setDraftHour(
                  Number(event.target.value)
                )
              }
              className={`${selectClass} w-[62px]`}
              aria-label="End hour"
            >
              {hourOptions.map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0")}
                </option>
              ))}
            </select>

            <span
              className={`text-[12px] font-[700] ${
                darkMode
                  ? "text-white/30"
                  : "text-[#6F6F6A]"
              }`}
            >
              :
            </span>

            <select
              value={draftMinute}
              onChange={(event) =>
                setDraftMinute(event.target.value)
              }
              className={`${selectClass} w-[62px]`}
              aria-label="End minute"
            >
              {minuteOptions.map((minute) => (
                <option
                  key={minute}
                  value={minute}
                >
                  {minute}
                </option>
              ))}
            </select>

            <select
              value={draftPeriod}
              onChange={(event) =>
                setDraftPeriod(
                  event.target.value as "AM" | "PM"
                )
              }
              className={`${selectClass} w-[62px]`}
              aria-label="AM or PM"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>

          <p
            className={`mt-2 text-[9px] font-[500] ${
              darkMode
                ? "text-white/32"
                : "text-[#777772]"
            }`}
          >
            Click outside to apply the new time.
          </p>
        </div>
      )}
    </div>
  );
}


function FocusModePanel({
  prioritizedTasks,
  completedToday,
  insightsHistory = [],
  userPlanningProfile,
  darkMode,
  border,
  strongerGlass,
  themeColor,
  toggleTaskById,
  setSelectedTask,
  setIsEditModalOpen,
  manualFocusTaskIds,
  setManualFocusTaskIds,
}: any) {
  const [focusIndex, setFocusIndex] = useState(0);
  const [focusLoading, setFocusLoading] = useState(false);
  const [focusError, setFocusError] = useState("");
  const [focusPlan, setFocusPlan] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);

const [
isMomentumOpen,
setIsMomentumOpen,
] = useState(false);


  const focusCacheDate = getTodayDate();
  const focusCacheKey = `momentum-focus-plan-${focusCacheDate}`;

  useEffect(() => {
    const cachedFocusPlan = localStorage.getItem(focusCacheKey);
    if (!cachedFocusPlan) return;

    try {
      const parsed = JSON.parse(cachedFocusPlan);
      if (!parsed?.focusTaskIds?.length) return;

      const validTaskIds = parsed.focusTaskIds.filter((taskId: string) =>
        prioritizedTasks.some((task: any) => task.id === taskId)
      );

      if (validTaskIds.length === 0) {
        setFocusPlan(null);
        setFocusIndex(0);
        localStorage.removeItem(focusCacheKey);
        return;
      }

      setFocusPlan({ ...parsed, focusTaskIds: validTaskIds });
      setFocusIndex(0);
    } catch (error) {
      console.error("Failed to load cached focus plan:", error);
      localStorage.removeItem(focusCacheKey);
    }
  }, [focusCacheKey, prioritizedTasks]);

  useEffect(() => {
    if (prioritizedTasks.length > 0) return;

    setFocusPlan(null);
    setFocusIndex(0);
    setManualFocusTaskIds([]);
    localStorage.removeItem(focusCacheKey);
  }, [prioritizedTasks.length, focusCacheKey, setManualFocusTaskIds]);

  useEffect(() => {
    setManualFocusTaskIds((previous: string[]) =>
      previous.filter((taskId) =>
        prioritizedTasks.some((task: any) => task.id === taskId)
      )
    );
  }, [prioritizedTasks, setManualFocusTaskIds]);

  const manualFocusTasks = manualFocusTaskIds
    .map((taskId: string) =>
      prioritizedTasks.find((task: any) => task.id === taskId)
    )
    .filter(Boolean);

  const aiFocusTasks =
    focusPlan?.focusTaskIds
      ?.map((taskId: string) =>
        prioritizedTasks.find((task: any) => task.id === taskId)
      )
      .filter(Boolean) || [];

  const activeFocusTasks =
    manualFocusTasks.length > 0 ? manualFocusTasks : aiFocusTasks;

  const currentTask =
    activeFocusTasks[focusIndex] || activeFocusTasks[0] || null;

  const isManualMode = manualFocusTasks.length > 0;

  const addManualFocusTask = (taskId: string) => {
    const taskExists = prioritizedTasks.some((task: any) => task.id === taskId);
    if (!taskExists) return;

    setManualFocusTaskIds((previous: string[]) => {
      if (previous.includes(taskId) || previous.length >= 3) return previous;
      return [...previous, taskId];
    });

    setFocusIndex(0);
  };

  

  const moveNext = () => {
    if (activeFocusTasks.length === 0) return;

    setFocusIndex((previous) =>
      previous >= activeFocusTasks.length - 1 ? 0 : previous + 1
    );
  };

  const getTaskReason = (taskId: string) => {
    if (isManualMode) {
      const task = prioritizedTasks.find((item: any) => item.id === taskId);
      return (
        task?.whyThisMatters ||
        "You manually added this to your focus stack."
      );
    }

    return (
      focusPlan?.reasons?.[taskId] ||
      "Momentuhm selected this as one of the strongest next moves."
    );
  };

  const computeFocusStack = async () => {
    if (prioritizedTasks.length === 0) return;

    setFocusLoading(true);
    setFocusError("");

    try {
      const response = await fetch("/api/focus-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          today: getTodayDate(),
        
          completedTodayCount:
            completedToday.length,
        
          planningProfile:
            userPlanningProfile,
        
          memoryInstructions:
            userPlanningProfile
              ?.promptInstructions || [],
        
          tasks: prioritizedTasks
            .slice(0, 15)
            .map((task: any) => ({
            id: task.id,
            title: task.title,
            whyThisMatters: task.whyThisMatters || "",
            priority: task.priority,
            dueDate: task.dueDate || null,
            suggestedDueDate: task.suggestedDueDate || null,
            category: task.category,
            score: task.score || 0,
            aiReason: task.aiReason || "",
            status: normalizeTaskStatus(task.status),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to compute focus stack.");
      }

      const validTaskIds = (data.focusTaskIds || []).filter((taskId: string) =>
        prioritizedTasks.some((task: any) => task.id === taskId)
      );

      if (validTaskIds.length === 0) {
        throw new Error("Momentuhm could not pick focus tasks.");
      }

      const nextFocusPlan = {
        focusTaskIds: validTaskIds.slice(0, 3),
        reasons: data.reasons || {},
        summary:
          data.summary ||
          "Momentuhm selected the strongest next moves from your active tasks.",
        generatedAt: new Date().toISOString(),
        source: "ai",
      };

      setFocusPlan(nextFocusPlan);
      setManualFocusTaskIds([]);
      localStorage.setItem(focusCacheKey, JSON.stringify(nextFocusPlan));
      setFocusIndex(0);
    } catch (error) {
      console.error(error);

      const fallbackTasks = prioritizedTasks.slice(0, 3);
      const fallbackFocusPlan = {
        focusTaskIds: fallbackTasks.map((task: any) => task.id),
        reasons: Object.fromEntries(
          fallbackTasks.map((task: any) => [
            task.id,
            task.whyThisMatters ||
              "This task is near the top of your prioritized list.",
          ])
        ),
        summary:
          "Momentuhm used your prioritized list because AI focus planning was unavailable.",
        generatedAt: new Date().toISOString(),
        source: "fallback",
      };

      setFocusPlan(fallbackFocusPlan);
      setManualFocusTaskIds([]);
      localStorage.setItem(focusCacheKey, JSON.stringify(fallbackFocusPlan));
      setFocusIndex(0);
      setFocusError("AI focus was unavailable. Your top tasks were used instead.");
    } finally {
      setFocusLoading(false);
    }
  };

  const openTaskEditor = (task: any) => {
    /*
    * An AI-generated focus plan lives locally inside FocusModePanel.
    * Convert it into the editable manual stack before opening the modal.
    */
    if (!isManualMode && activeFocusTasks.length > 0) {
      setManualFocusTaskIds(
        activeFocusTasks.map((focusTask: any) => focusTask.id)
      );
    }
  
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };
  
  const openCurrentTask = () => {
    if (!currentTask) return;
  
    openTaskEditor(currentTask);
  };

  const totalTrackedToday =
completedToday.length +
prioritizedTasks.length;

const dayProgress = Math.round(
(completedToday.length /
  Math.max(
    1,
    totalTrackedToday
  )) *
  100
);

const tasksRemaining =
prioritizedTasks.length;

const completedFocusTaskIds =
new Set(
  completedToday.map(
    (task: any) =>
      String(task.id)
  )
);

const allFocusTaskIds = Array.from(
new Set([
  ...manualFocusTaskIds.map(
    (taskId: string) =>
      String(taskId)
  ),
  ...(
    focusPlan?.focusTaskIds ||
    []
  ).map(
    (taskId: string) =>
      String(taskId)
  ),
])
);

const focusTasksCompletedToday =
allFocusTaskIds.filter(
  (taskId) =>
    completedFocusTaskIds.has(
      taskId
    )
).length;

const totalFocusTasks = Math.max(
activeFocusTasks.length,
focusTasksCompletedToday
);

const focusCompletionPercent =
totalFocusTasks === 0
  ? 0
  : Math.round(
      (focusTasksCompletedToday /
        totalFocusTasks) *
        100
    );

const momentumTimeline = useMemo(
() => {
  const timelinePoints = [
    {
      label: "6 AM",
      hour: 6,
      count: 0,
    },
    {
      label: "8 AM",
      hour: 8,
      count: 0,
    },
    {
      label: "10 AM",
      hour: 10,
      count: 0,
    },
    {
      label: "12 PM",
      hour: 12,
      count: 0,
    },
    {
      label: "2 PM",
      hour: 14,
      count: 0,
    },
    {
      label: "4 PM",
      hour: 16,
      count: 0,
    },
    {
      label: "6 PM",
      hour: 18,
      count: 0,
    },
    {
      label: "8 PM",
      hour: 20,
      count: 0,
    },
    {
      label: "10 PM",
      hour: 22,
      count: 0,
    },
  ];

  completedToday.forEach(
    (task: any) => {
      if (!task.completedAt) {
        return;
      }

      const completedDate =
        new Date(
          task.completedAt
        );

      if (
        Number.isNaN(
          completedDate.getTime()
        )
      ) {
        return;
      }

      const hour =
        completedDate.getHours();

      const closestPoint =
        timelinePoints.reduce(
          (
            closest,
            point
          ) => {
            const closestDifference =
              Math.abs(
                closest.hour -
                  hour
              );

            const pointDifference =
              Math.abs(
                point.hour -
                  hour
              );

            return pointDifference <
              closestDifference
              ? point
              : closest;
          },
          timelinePoints[0]
        );

      closestPoint.count += 1;
    }
  );

  let cumulativeCount = 0;

  return timelinePoints.map(
    (point) => {
      cumulativeCount +=
        point.count;

      return {
        ...point,
        cumulativeCount,
      };
    }
  );
},
[completedToday]
);

const timelineMaximum =
Math.max(
  1,
  ...momentumTimeline.map(
    (point) =>
      point.cumulativeCount
  )
);

const timelineCoordinates =
momentumTimeline.map(
  (point, index) => {
    const chartWidth = 760;
    const chartHeight = 155;
    const chartLeft = 24;
    const chartRight = 736;
    const chartTop = 34;
    const chartBottom = 132;

    const x =
      chartLeft +
      index *
        ((chartRight -
          chartLeft) /
          Math.max(
            1,
            momentumTimeline.length -
              1
          ));

    const y =
      chartBottom -
      (point.cumulativeCount /
        timelineMaximum) *
        (chartBottom -
          chartTop);

    return {
      ...point,
      x,
      y,
    };
  }
);

const timelinePath =
timelineCoordinates.length > 0
  ? timelineCoordinates
      .map(
        (
          point,
          index
        ) =>
          `${
            index === 0
              ? "M"
              : "L"
          } ${point.x} ${point.y}`
      )
      .join(" ")
  : "";

const timelineAreaPath =
timelineCoordinates.length > 0
  ? `${timelinePath} L ${
      timelineCoordinates[
        timelineCoordinates.length -
          1
      ].x
    } 132 L ${
      timelineCoordinates[0].x
    } 132 Z`
  : "";

const currentHour =
new Date().getHours();

const currentTimelineIndex =
momentumTimeline.reduce(
  (
    closestIndex,
    point,
    index
  ) => {
    const currentClosest =
      momentumTimeline[
        closestIndex
      ];

    return Math.abs(
      point.hour -
        currentHour
    ) <
      Math.abs(
        currentClosest.hour -
          currentHour
      )
      ? index
      : closestIndex;
  },
  0
);

const currentTimelinePoint =
timelineCoordinates[
  currentTimelineIndex
];

const completedTodayTimes =
completedToday
  .map((task: any) => {
    if (!task.completedAt) {
      return null;
    }

    const date = new Date(
      task.completedAt
    );

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  })
  .filter(Boolean) as Date[];

const productiveWindow =
useMemo(() => {
  if (
    completedTodayTimes.length ===
    0
  ) {
    return {
      startLabel: "No completions yet",
      endLabel: "",
      count: 0,
    };
  }

  const sortedTimes = [
    ...completedTodayTimes,
  ].sort(
    (dateA, dateB) =>
      dateA.getTime() -
      dateB.getTime()
  );

  const firstCompletion =
    sortedTimes[0];

  const lastCompletion =
    sortedTimes[
      sortedTimes.length - 1
    ];

  const formatTime = (
    date: Date
  ) =>
    date.toLocaleTimeString(
      undefined,
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );

  return {
    startLabel:
      formatTime(
        firstCompletion
      ),
    endLabel:
      formatTime(
        lastCompletion
      ),
    count:
      sortedTimes.length,
  };
}, [completedToday]);

const getLocalDateKey = (
date: Date
) => {
const year =
  date.getFullYear();

const month = String(
  date.getMonth() + 1
).padStart(2, "0");

const day = String(
  date.getDate()
).padStart(2, "0");

return `${year}-${month}-${day}`;
};

const dayStreak = useMemo(() => {
const completionDates =
  new Set<string>();

[
  ...insightsHistory,
  ...completedToday,
].forEach((task: any) => {
  if (!task.completedAt) {
    return;
  }

  const completedDate =
    new Date(
      task.completedAt
    );

  if (
    Number.isNaN(
      completedDate.getTime()
    )
  ) {
    return;
  }

  completionDates.add(
    getLocalDateKey(
      completedDate
    )
  );
});

const cursor =
  new Date();

if (
  !completionDates.has(
    getLocalDateKey(cursor)
  )
) {
  cursor.setDate(
    cursor.getDate() - 1
  );
}

let streak = 0;

while (
  completionDates.has(
    getLocalDateKey(cursor)
  )
) {
  streak += 1;

  cursor.setDate(
    cursor.getDate() - 1
  );
}

return streak;
}, [
insightsHistory,
completedToday,
]);

const paceStatus =
tasksRemaining === 0
  ? {
      label: "Complete",
      message:
        "You have closed all currently active work.",
    }
  : dayProgress >= 60
  ? {
      label: "Strong pace",
      message:
        "You are ahead of the pace suggested by your current workload.",
    }
  : dayProgress >= 30
  ? {
      label: "On track",
      message:
        "You are on a steady pace for the rest of the day.",
    }
  : completedToday.length > 0
  ? {
      label: "Building",
      message:
        "Your day has started moving. Protect the next meaningful completion.",
    }
  : {
      label: "Ready",
      message:
        "Complete one meaningful task to establish today’s pace.",
    };

const momentumInsight =
completedToday.length === 0
  ? {
      headline:
        "Your first win is still ahead.",
      message:
        "Start with the clearest Focus task and create momentum with one meaningful completion.",
    }
  : completedToday.length >= 5
  ? {
      headline: `You closed ${completedToday.length} important tasks today.`,
      message:
        productiveWindow.endLabel
          ? `Your strongest visible progress occurred between ${productiveWindow.startLabel} and ${productiveWindow.endLabel}.`
          : "You have built strong momentum across the day.",
    }
  : {
      headline: `You closed ${completedToday.length} ${
        completedToday.length ===
        1
          ? "task"
          : "tasks"
      } so far.`,
      message:
        productiveWindow.endLabel
          ? `Your visible progress currently spans ${productiveWindow.startLabel} to ${productiveWindow.endLabel}.`
          : "Keep protecting the pace you have started.",
    };
  


  const cardBorder = darkMode
    ? "border-white/[0.10]"
    : "border-[#DDDDE3]";

  const rowBorder = darkMode
    ? "border-white/[0.08]"
    : "border-[#E8E9ED]";

  const mutedText = darkMode
    ? "text-white/50"
    : "text-[#6B6F7B]";

  return (
    <section className="min-w-0">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            className={`text-[20px] font-[760] leading-none tracking-[-0.045em] ${
              darkMode ? "text-white" : "text-[#17191F]"
            }`}
          >
            Focus
          </h2>
          <p className={`mt-2 text-[13px] font-[500] ${mutedText}`}>
            Stay focused. Finish what matters most.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void computeFocusStack()}
          disabled={focusLoading || prioritizedTasks.length === 0}
          className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-[9px] border px-3 text-[11px] font-[650] transition disabled:cursor-not-allowed disabled:opacity-40 ${
            darkMode
              ? "border-white/[0.10] bg-white/[0.04] text-white/68 hover:bg-white/[0.07]"
              : "border-[#DDDDE3] bg-[#F7F8FA] text-[#4F5562] hover:bg-[#F0F1F4]"
          }`}
        >
          <Settings2 size={15} strokeWidth={1.7} />
          {focusLoading ? "Updating..." : "AI Mode"}
        </button>
      </header>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          addManualFocusTask(event.dataTransfer.getData("text/plain"));
        }}
        className={`relative overflow-hidden rounded-[14px] border p-5 transition ${
          isDragOver
            ? darkMode
              ? "border-amber-300/40 bg-amber-300/[0.08]"
              : "border-amber-300 bg-amber-50"
            : darkMode
            ? "border-amber-300/20 bg-[linear-gradient(135deg,rgba(251,191,36,0.08),rgba(251,191,36,0.025))]"
            : "border-amber-200 bg-[linear-gradient(135deg,#FFFDF8,#FFF9EE)]"
        }`}
      >
        <div
          className={`pointer-events-none absolute -right-8 -top-6 flex h-32 w-32 items-center justify-center rounded-full border-[10px] opacity-15 ${
            darkMode ? "border-amber-300" : "border-amber-500"
          }`}
        >
          <Target size={52} strokeWidth={1.5} />
        </div>

        {currentTask ? (
          <div className="relative pr-8 sm:pr-20">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-[10px] font-[700] ${
                darkMode
                  ? "bg-amber-300/10 text-amber-200"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              Current focus
            </span>

            <button
              type="button"
              onClick={openCurrentTask}
              className={`mt-3 block max-w-full text-left text-[17px] font-[720] leading-6 tracking-[-0.025em] hover:opacity-72 ${
                darkMode ? "text-white" : "text-[#1C1F26]"
              }`}
            >
              {currentTask.title}
            </button>

            <p className={`mt-1.5 text-[11px] font-[550] ${mutedText}`}>
              {currentTask.priority} impact task
              {currentTask.category ? ` · ${currentTask.category}` : ""}
            </p>

            <p
              className={`mt-5 line-clamp-3 max-w-[500px] text-[12px] font-[500] leading-5 ${
                darkMode ? "text-white/68" : "text-[#454A56]"
              }`}
            >
              {getTaskReason(currentTask.id)}
            </p>

            {/* <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-[11px] font-[600]">
                <span className={darkMode ? "text-white/70" : "text-[#353A45]"}>
                  Progress
                </span>
                <span className={darkMode ? "text-white/70" : "text-[#353A45]"}>
                  {dayProgress}%
                </span>
              </div>
              <div className={`h-2 overflow-hidden rounded-full ${darkMode ? "bg-white/[0.10]" : "bg-black/[0.08]"}`}>
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
                  style={{ width: `${dayProgress}%` }}
                />
              </div>
            </div> */}
          </div>
        ) : (
          <div className="relative flex min-h-[210px] items-center justify-center text-center">
            <div className="max-w-sm">
              <Target
                size={34}
                className={`mx-auto ${darkMode ? "text-amber-200/55" : "text-amber-600/55"}`}
              />
              <h3
                className={`mt-4 text-[17px] font-[700] ${
                  darkMode ? "text-white" : "text-[#1C1F26]"
                }`}
              >
                Build your focus stack.
              </h3>
              <p className={`mt-2 text-[12px] font-[500] leading-5 ${mutedText}`}>
                Drag a task here or let Momentuhm choose your strongest next move.
              </p>
              <button
                type="button"
                onClick={() => void computeFocusStack()}
                disabled={focusLoading || prioritizedTasks.length === 0}
                className={`mt-4 h-10 rounded-[9px] px-4 text-[11px] font-[700] transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  darkMode
                    ? "bg-white text-[#181818]"
                    : "bg-[#20232B] text-white"
                }`}
              >
                {focusLoading ? "Thinking..." : "Choose focus tasks"}
              </button>
            </div>
          </div>
        )}
      </div>

      {focusError && (
        <p className="mt-3 rounded-[10px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] font-[600] text-red-500">
          {focusError}
        </p>
      )}

      <section className={`mt-4 overflow-hidden rounded-[13px] border ${cardBorder}`}>
        <div className={`flex min-h-[58px] items-center gap-2 border-b px-4 ${rowBorder}`}>
          <h3
            className={`text-[17px] font-[720] tracking-[-0.025em] ${
              darkMode ? "text-white" : "text-[#17191F]"
            }`}
          >
            Focus stack
          </h3>
          <span
            className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-[700] ${
              darkMode ? "bg-white/[0.07] text-white/58" : "bg-[#F0F1F4] text-[#59606C]"
            }`}
          >
            {activeFocusTasks.length}
          </span>
        </div>

        {activeFocusTasks.length === 0 ? (
          <div className={`px-4 py-8 text-center text-[12px] font-[500] ${mutedText}`}>
            Your focus stack is empty.
          </div>
        ) : (
          activeFocusTasks.map((task: any, index: number) => {
            const priorityPill =
              task.priority === "High"
                ? darkMode
                  ? "border-red-400/20 bg-red-400/10 text-red-300"
                  : "border-red-200 bg-red-50 text-red-600"
                : task.priority === "Medium" || task.priority === "Med"
                ? darkMode
                  ? "border-orange-400/20 bg-orange-400/10 text-orange-300"
                  : "border-orange-200 bg-orange-50 text-orange-600"
                : darkMode
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-600";

            return (
              <div
                key={task.id}
                className={`grid min-h-[58px] w-full grid-cols-[24px_minmax(0,1fr)_auto_30px] items-center gap-2 border-b px-4 text-left last:border-b-0 ${rowBorder} ${
                  currentTask?.id === task.id
                    ? darkMode
                      ? "bg-white/[0.035]"
                      : "bg-[#FBFBFC]"
                    : ""
                }`}
              >
                <button
type="button"
onClick={() => {
  setFocusIndex(index);
  openTaskEditor(task);
}}
aria-label={`Edit ${task.title}`}
title={`Open ${task.title}`}
className="col-span-2 grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-2 self-stretch text-left"
>
<span
  className={`text-[11px] font-[700] ${
    currentTask?.id === task.id
      ? darkMode
        ? "text-white"
        : "text-[#20232B]"
      : mutedText
  }`}
>
  {index + 1}.
</span>

<span
  className={`min-w-0 truncate text-[12px] font-[600] transition hover:opacity-70 ${
    darkMode
      ? "text-white/84"
      : "text-[#282C35]"
  }`}
>
  {task.title}
</span>
</button>

                <span className={`rounded-[6px] border px-2 py-1 text-[10px] font-[650] ${priorityPill}`}>
                  {task.priority === "Medium" || task.priority === "Med" ? "Medium" : task.priority}
                </span>

                <button
  type="button"
  onClick={() => openTaskEditor(task)}
  aria-label={`Edit ${task.title}`}
  title="Edit task"
  className={`flex h-8 w-8 items-center justify-center transition ${
    darkMode
      ? "text-white/36 hover:text-white"
      : "text-[#747986] hover:text-[#252933]"
  }`}
>
  <MoreVertical size={15} strokeWidth={1.8} />
</button>
              </div>
            );
          })
        )}
      </section>

      <section className={`mt-4 rounded-[13px] border p-4 ${cardBorder}`}>
        <h3
          className={`text-[17px] font-[720] tracking-[-0.025em] ${
            darkMode ? "text-white" : "text-[#17191F]"
          }`}
        >
          Quick actions
        </h3>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <button
            type="button"
            disabled={!currentTask}
            onClick={(event) => {
              if (!currentTask) return;
              toggleTaskById(currentTask.id, event);
            }}
            className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-[10px] border px-2 text-center text-[11px] font-[600] transition disabled:cursor-not-allowed disabled:opacity-35 ${cardBorder} ${
              darkMode ? "hover:bg-white/[0.04]" : "hover:bg-[#FAFAFB]"
            }`}
          >
            <Check size={22} className="text-blue-500" strokeWidth={2} />
            <span>Mark current complete</span>
          </button>

          <button
            type="button"
            disabled={activeFocusTasks.length < 2}
            onClick={moveNext}
            className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-[10px] border px-2 text-center text-[11px] font-[600] transition disabled:cursor-not-allowed disabled:opacity-35 ${cardBorder} ${
              darkMode ? "hover:bg-white/[0.04]" : "hover:bg-[#FAFAFB]"
            }`}
          >
            <Play size={21} className="text-emerald-500" strokeWidth={1.9} />
            <span>Start next in stack</span>
          </button>

          <button
type="button"
onClick={() =>
  setIsMomentumOpen(true)
}
className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-[10px] border px-2 text-center text-[11px] font-[600] transition ${cardBorder} ${
  darkMode
    ? "hover:bg-white/[0.04]"
    : "hover:bg-[#FAFAFB]"
}`}
>
<TrendingUp
  size={21}
  className="text-violet-500"
  strokeWidth={1.9}
/>

<span>
  See today&apos;s momentum
</span>
</button>
        </div>
      </section>

   
      <section
className={`mt-4 flex min-h-[110px] items-center gap-4 rounded-[13px] border p-5 ${
  darkMode
    ? "border-violet-400/20 bg-violet-400/[0.06]"
    : "border-violet-200 bg-[linear-gradient(135deg,#FBF8FF,#F7F2FF)]"
}`}
>
<Sparkles
  size={30}
  className={
    darkMode
      ? "shrink-0 text-violet-300"
      : "shrink-0 text-violet-600"
  }
  strokeWidth={1.7}
/>

<div className="min-w-0">
  <h3
    className={`text-[15px] font-[700] ${
      darkMode
        ? "text-white"
        : "text-[#20232B]"
    }`}
  >
    {completedToday.length > 0
      ? "Keep the momentum going"
      : "Start with one meaningful task"}
  </h3>

  <p
    className={`mt-1.5 text-[12px] font-[500] ${mutedText}`}
  >
    {prioritizedTasks.length} active task
    {prioritizedTasks.length === 1
      ? ""
      : "s"}{" "}
    remain today.
  </p>
</div>
</section>



<AnimatePresence>
{isMomentumOpen && (
  <motion.div
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
      duration: 0.18,
    }}
    onClick={() =>
      setIsMomentumOpen(false)
    }
    className="fixed inset-x-0 bottom-0 top-[72px] z-[9999] flex items-center justify-center bg-black/55 p-3 backdrop-blur-[3px] sm:top-[80px] sm:p-6"
  >
    <motion.section
      role="dialog"
      aria-modal="true"
      aria-labelledby="momentum-modal-title"
      initial={{
        opacity: 0,
        y: 16,
        scale: 0.985,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: 10,
        scale: 0.99,
      }}
      transition={{
        type: "spring",
        stiffness: 360,
        damping: 32,
        mass: 0.84,
      }}
      onClick={(event) =>
        event.stopPropagation()
      }
      className={`relative z-[10000] flex max-h-[calc(100vh-104px)] w-full max-w-[980px] flex-col overflow-hidden rounded-[18px] border shadow-[0_30px_100px_rgba(0,0,0,0.34)] sm:max-h-[calc(100vh-120px)] ${
        darkMode
          ? "border-white/[0.12] bg-[#17181C] text-[#F1F3F4]"
          : "border-[#DADCE0] bg-[#FFFDFB] text-[#202124]"
      }`}
    >
      {/* Modal header */}
      <header className="flex shrink-0 items-start justify-between gap-5 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              darkMode
                ? "bg-violet-400/12 text-violet-300"
                : "bg-violet-100 text-violet-600"
            }`}
          >
            <TrendingUp
              size={19}
              strokeWidth={2}
            />
          </div>

          <div className="min-w-0">
            <h2
              id="momentum-modal-title"
              className="text-[22px] font-[760] leading-none tracking-[-0.04em]"
            >
              Today&apos;s Momentum
            </h2>

            <p
              className={`mt-2 text-[12px] font-[500] ${
                darkMode
                  ? "text-white/48"
                  : "text-[#5F6368]"
              }`}
            >
              How your day is unfolding so far
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setIsMomentumOpen(false)
          }
          aria-label="Close today's momentum"
          title="Close"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] transition ${
            darkMode
              ? "text-white/52 hover:bg-white/[0.07] hover:text-white"
              : "text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]"
          }`}
        >
          <X
            size={20}
            strokeWidth={1.7}
          />
        </button>
      </header>

      {/* Scrollable modal body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
        {/* Top metrics */}
        <section className="grid grid-cols-1 gap-0 overflow-hidden rounded-[13px] border sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label:
                "Tasks completed",
              value:
                completedToday.length,
              detail: `of ${totalTrackedToday} total`,
              icon:
                CheckCircle2,
              iconClass:
                darkMode
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-600",
            },
            {
              label:
                "Day progress",
              value: `${dayProgress}%`,
              detail:
                "of tracked work",
              icon:
                TrendingUp,
              iconClass:
                darkMode
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-600",
            },
            {
              label:
                "Tasks remaining",
              value:
                tasksRemaining,
              detail:
                "active tasks",
              icon:
                Clock3,
              iconClass:
                darkMode
                  ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
                  : "border-violet-200 bg-violet-50 text-violet-600",
            },
            {
              label:
                "Day streak",
              value:
                dayStreak,
              detail:
                dayStreak === 1
                  ? "day"
                  : "days",
              icon:
                Flame,
              iconClass:
                darkMode
                  ? "border-orange-400/20 bg-orange-400/10 text-orange-300"
                  : "border-orange-200 bg-orange-50 text-orange-600",
            },
          ].map(
            (
              metric,
              index
            ) => {
              const Icon =
                metric.icon;

              return (
                <article
                  key={
                    metric.label
                  }
                  className={`flex min-h-[112px] items-center gap-3 border-b p-4 sm:border-b lg:border-b-0 ${
                    index > 0
                      ? darkMode
                        ? "lg:border-l lg:border-white/[0.09]"
                        : "lg:border-l lg:border-[#E8EAED]"
                      : ""
                  } ${
                    darkMode
                      ? "border-white/[0.09] bg-white/[0.018]"
                      : "border-[#E8EAED] bg-white"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${metric.iconClass}`}
                  >
                    <Icon
                      size={19}
                      strokeWidth={1.9}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-[25px] font-[760] leading-none tracking-[-0.045em]">
                        {metric.value}
                      </p>
                    </div>

                    <p className="mt-1.5 text-[11px] font-[650]">
                      {metric.label}
                    </p>

                    <p
                      className={`mt-0.5 text-[9.5px] font-[500] ${
                        darkMode
                          ? "text-white/40"
                          : "text-[#6B6F7B]"
                      }`}
                    >
                      {metric.detail}
                    </p>
                  </div>
                </article>
              );
            }
          )}
        </section>

        {/* Progress timeline */}
        <section
          className={`mt-3 overflow-hidden rounded-[13px] border p-4 sm:p-5 ${
            darkMode
              ? "border-white/[0.10] bg-white/[0.018]"
              : "border-[#DADCE0] bg-white"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[14px] font-[720]">
                Progress timeline
              </h3>

              <p
                className={`mt-1 text-[10.5px] font-[500] ${
                  darkMode
                    ? "text-white/42"
                    : "text-[#6B6F7B]"
                }`}
              >
                Tasks completed throughout the day
              </p>
            </div>

            <div
              className={`flex shrink-0 items-center gap-2 text-[9.5px] font-[550] ${
                darkMode
                  ? "text-white/52"
                  : "text-[#4F5562]"
              }`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check
                  size={10}
                  strokeWidth={2.4}
                />
              </span>

              Completed task
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <svg
              viewBox="0 0 760 175"
              className="h-[190px] min-w-[700px] w-full overflow-visible"
              role="img"
              aria-label="Cumulative task completion timeline"
            >
              <defs>
                <linearGradient
                  id="momentum-timeline-area"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#34A853"
                    stopOpacity="0.22"
                  />

                  <stop
                    offset="100%"
                    stopColor="#34A853"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {timelineCoordinates.map(
                (point) => (
                  <line
                    key={`grid-${point.label}`}
                    x1={point.x}
                    x2={point.x}
                    y1="18"
                    y2="132"
                    stroke={
                      darkMode
                        ? "rgba(255,255,255,0.055)"
                        : "rgba(32,33,36,0.07)"
                    }
                    strokeWidth="1"
                  />
                )
              )}

              <line
                x1="24"
                x2="736"
                y1="132"
                y2="132"
                stroke={
                  darkMode
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(32,33,36,0.10)"
                }
                strokeWidth="1"
              />

              {timelineAreaPath && (
                <path
                  d={
                    timelineAreaPath
                  }
                  fill="url(#momentum-timeline-area)"
                />
              )}

              {timelinePath && (
                <motion.path
                  initial={{
                    pathLength: 0,
                    opacity: 0,
                  }}
                  animate={{
                    pathLength: 1,
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.75,
                    ease: [
                      0.16,
                      1,
                      0.3,
                      1,
                    ],
                  }}
                  d={timelinePath}
                  fill="none"
                  stroke="#34A853"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {currentTimelinePoint && (
                <>
                <line
x1={
  currentTimelinePoint.x
}
x2={
  currentTimelinePoint.x
}
y1="27"
y2="132"
stroke="#8B5CF6"
strokeDasharray="4 4"
strokeWidth="1.5"
/>

<rect
x={currentTimelinePoint.x - 23}
y="3"
width="46"
height="22"
rx="6"
fill="#7C3AED"
/>

<text
x={currentTimelinePoint.x}
y="18"
textAnchor="middle"
fill="white"
fontSize="10"
fontWeight="700"
>
Now
</text>
                </>
              )}

              {timelineCoordinates.map(
                (
                  point,
                  index
                ) => {
                  const isPast =
                    index <=
                    currentTimelineIndex;

                  return (
                    <g
                      key={
                        point.label
                      }
                    >
                      <circle
                        cx={point.x}
                        cy={
                          isPast
                            ? point.y
                            : timelineCoordinates[
                                currentTimelineIndex
                              ]?.y || 90
                        }
                        r="6"
                        fill={
                          isPast
                            ? "#34A853"
                            : darkMode
                            ? "#17181C"
                            : "#FFFFFF"
                        }
                        stroke={
                          isPast
                            ? "#34A853"
                            : darkMode
                            ? "rgba(255,255,255,0.40)"
                            : "#9AA0A6"
                        }
                        strokeWidth="2"
                      />

                      {isPast &&
                        point.cumulativeCount >
                          0 && (
                          <path
                          d={`M ${
                            point.x - 2.5
                          } ${
                            point.y
                          } l 2 2.2 l 4 -5`}
                            fill="none"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                      <text
                        x={point.x}
                        y="158"
                        textAnchor="middle"
                        fill={
                          darkMode
                            ? "rgba(255,255,255,0.48)"
                            : "#6B6F7B"
                        }
                        fontSize="9"
                        fontWeight="600"
                      >
                        {point.label}
                      </text>
                    </g>
                  );
                }
              )}
            </svg>
          </div>
        </section>

        {/* Three secondary panels */}
        <section className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.12fr_0.92fr_0.92fr]">
          {/* Focus time */}
          <article
            className={`rounded-[13px] border p-4 ${
              darkMode
                ? "border-white/[0.10] bg-white/[0.018]"
                : "border-[#DADCE0] bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock3
                size={15}
                strokeWidth={1.8}
                className={
                  darkMode
                    ? "text-white/55"
                    : "text-[#5F6368]"
                }
              />

              <h3 className="text-[13px] font-[700]">
                Focus time
              </h3>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p
                  className={`text-[9.5px] font-[550] ${
                    darkMode
                      ? "text-white/42"
                      : "text-[#6B6F7B]"
                  }`}
                >
                  Most productive
                </p>

                <p className="mt-1.5 text-[16px] font-[730] tracking-[-0.025em]">
                  {productiveWindow.count >
                  0
                    ? `${productiveWindow.startLabel}${
                        productiveWindow.endLabel
                          ? ` – ${productiveWindow.endLabel}`
                          : ""
                      }`
                    : "Not enough data yet"}
                </p>

                <p
                  className={`mt-2 text-[9.5px] font-[500] ${
                    darkMode
                      ? "text-white/40"
                      : "text-[#6B6F7B]"
                  }`}
                >
                  {productiveWindow.count >
                  0
                    ? `You completed ${productiveWindow.count} task${
                        productiveWindow.count ===
                        1
                          ? ""
                          : "s"
                      } in this visible window.`
                    : "Complete tasks to reveal your strongest window."}
                </p>
              </div>

              <div className="flex h-[52px] shrink-0 items-end gap-1">
                {[
                  18,
                  24,
                  31,
                  46,
                  29,
                  37,
                ].map(
                  (
                    height,
                    index
                  ) => (
                    <span
                      key={
                        index
                      }
                      className={`w-[8px] rounded-t-[3px] ${
                        index === 3
                          ? "bg-emerald-500"
                          : darkMode
                          ? "bg-white/[0.13]"
                          : "bg-[#E1E3E7]"
                      }`}
                      style={{
                        height,
                      }}
                    />
                  )
                )}
              </div>
            </div>
          </article>

          {/* Pace */}
          <article
            className={`rounded-[13px] border p-4 ${
              darkMode
                ? "border-white/[0.10] bg-white/[0.018]"
                : "border-[#DADCE0] bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp
                size={15}
                strokeWidth={1.8}
                className={
                  darkMode
                    ? "text-white/55"
                    : "text-[#5F6368]"
                }
              />

              <h3 className="text-[13px] font-[700]">
                Pace
              </h3>
            </div>

            <span
              className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] font-[650] ${
                darkMode
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              <Check
                size={11}
                strokeWidth={2.1}
              />

              {paceStatus.label}
            </span>

            <p
              className={`mt-3 text-[11px] font-[550] leading-5 ${
                darkMode
                  ? "text-white/62"
                  : "text-[#3C4043]"
              }`}
            >
              {paceStatus.message}
            </p>
          </article>

          {/* Focus tasks */}
          <article
            className={`rounded-[13px] border p-4 ${
              darkMode
                ? "border-white/[0.10] bg-white/[0.018]"
                : "border-[#DADCE0] bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Target
                size={15}
                strokeWidth={1.8}
                className={
                  darkMode
                    ? "text-white/55"
                    : "text-[#5F6368]"
                }
              />

              <h3 className="text-[13px] font-[700]">
                Focus tasks
              </h3>
            </div>

            <p className="mt-4 text-[25px] font-[760] leading-none tracking-[-0.045em]">
              {focusTasksCompletedToday}{" "}
              /{" "}
              {totalFocusTasks}
            </p>

            <p
              className={`mt-2 text-[10.5px] font-[550] ${
                darkMode
                  ? "text-white/52"
                  : "text-[#4F5562]"
              }`}
            >
              Focus tasks completed
            </p>

            <div
              className={`mt-4 h-2 overflow-hidden rounded-full ${
                darkMode
                  ? "bg-white/[0.09]"
                  : "bg-[#E8EAED]"
              }`}
            >
              <motion.div
                initial={{
                  width: 0,
                }}
                animate={{
                  width: `${focusCompletionPercent}%`,
                }}
                transition={{
                  duration: 0.6,
                  ease: [
                    0.16,
                    1,
                    0.3,
                    1,
                  ],
                }}
                className="h-full rounded-full bg-violet-600"
              />
            </div>
          </article>
        </section>

        {/* AI insight */}
        <section
          className={`relative mt-3 min-h-[145px] overflow-hidden rounded-[13px] border px-5 py-5 ${
            darkMode
              ? "border-violet-400/20 bg-[linear-gradient(110deg,rgba(139,92,246,0.12),rgba(124,58,237,0.05))]"
              : "border-violet-200 bg-[linear-gradient(110deg,#FCF8FF_0%,#F7F0FF_58%,#E9DDFC_100%)]"
          }`}
        >
          <div className="relative z-10 max-w-[58%]">
            <div className="flex items-center gap-2">
              <Sparkles
                size={16}
                strokeWidth={1.8}
                className={
                  darkMode
                    ? "text-violet-300"
                    : "text-violet-600"
                }
              />

              <h3 className="text-[13px] font-[720]">
                AI insight
              </h3>
            </div>

            <p
              className={`mt-3 text-[11.5px] font-[600] leading-5 ${
                darkMode
                  ? "text-white/82"
                  : "text-[#2F243E]"
              }`}
            >
              {momentumInsight.headline}
            </p>

            <p
              className={`mt-1 text-[11px] font-[520] leading-5 ${
                darkMode
                  ? "text-white/60"
                  : "text-[#51455F]"
              }`}
            >
              {momentumInsight.message}
            </p>

            <p
              className={`mt-3 text-[11.5px] font-[720] ${
                darkMode
                  ? "text-violet-200"
                  : "text-[#352346]"
              }`}
            >
              Keep this momentum going.
            </p>
          </div>

          {/* Decorative mountain artwork */}
          <svg
            aria-hidden="true"
            viewBox="0 0 420 180"
            className="pointer-events-none absolute bottom-0 right-0 h-[145px] w-[44%] opacity-95"
            preserveAspectRatio="xMidYMax meet"
          >
            <defs>
              <linearGradient
                id="momentum-mountain-back"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#C4B5FD"
                />
                <stop
                  offset="100%"
                  stopColor="#8B5CF6"
                />
              </linearGradient>

              <linearGradient
                id="momentum-mountain-front"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#8B5CF6"
                />
                <stop
                  offset="100%"
                  stopColor="#4C1D95"
                />
              </linearGradient>

              <linearGradient
                id="momentum-sun"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#FDBA74"
                />
                <stop
                  offset="100%"
                  stopColor="#F97316"
                />
              </linearGradient>
            </defs>

            <circle
              cx="205"
              cy="118"
              r="30"
              fill="url(#momentum-sun)"
              opacity="0.9"
            />

            <path
              d="M 0 170 L 68 100 L 112 140 L 170 82 L 235 150 L 296 92 L 352 145 L 420 105 L 420 180 L 0 180 Z"
              fill="url(#momentum-mountain-back)"
              opacity="0.88"
            />

            <path
              d="M 0 180 L 92 125 L 135 157 L 218 74 L 274 145 L 338 96 L 420 155 L 420 180 Z"
              fill="url(#momentum-mountain-front)"
              opacity="0.95"
            />

            <path
              d="M 206 180 C 230 160, 212 147, 244 133 C 270 121, 253 104, 281 88"
              fill="none"
              stroke="#FDBA74"
              strokeWidth="5"
              strokeLinecap="round"
            />

            <line
              x1="281"
              x2="281"
              y1="88"
              y2="53"
              stroke="#F8FAFC"
              strokeWidth="3"
            />

            <path
              d="M 284 54 L 321 65 L 284 76 Z"
              fill="#7C3AED"
            />

            {[
              [58, 46],
              [118, 68],
              [347, 45],
              [380, 74],
            ].map(
              (
                sparkle,
                index
              ) => (
                <g
                  key={
                    index
                  }
                  transform={`translate(${sparkle[0]} ${sparkle[1]})`}
                  opacity="0.7"
                >
                  <path
                    d="M 0 -6 L 2 -2 L 6 0 L 2 2 L 0 6 L -2 2 L -6 0 L -2 -2 Z"
                    fill="#A78BFA"
                  />
                </g>
              )
            )}
          </svg>
        </section>
      </div>

      {/* Footer */}
      <footer
        className={`flex shrink-0 flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
          darkMode
            ? "border-white/[0.09] bg-white/[0.018]"
            : "border-[#E8EAED] bg-[#FFFDFB]"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setIsMomentumOpen(false);

            window.setTimeout(
              () => {
                window.dispatchEvent(
                  new Event(
                    "momentuhm:open-tasks"
                  )
                );

                document
                  .getElementById(
                    "Momentuhm-desktop-completed-anchor"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                    block:
                      "start",
                  });
              },
              100
            );
          }}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-[9px] border px-4 text-[11px] font-[650] transition ${
            darkMode
              ? "border-white/[0.10] text-white/62 hover:bg-white/[0.06] hover:text-white"
              : "border-[#DADCE0] bg-white text-[#4F5562] hover:bg-[#F1F3F4] hover:text-[#202124]"
          }`}
        >
          <ListChecks
            size={14}
            strokeWidth={1.8}
          />

          View full day breakdown
        </button>

        <button
          type="button"
          onClick={() =>
            setIsMomentumOpen(false)
          }
          className="h-10 rounded-[9px] bg-violet-600 px-8 text-[11px] font-[700] text-white transition hover:bg-violet-700 active:scale-[0.98]"
        >
          Close
        </button>
      </footer>
    </motion.section>
  </motion.div>
)}
</AnimatePresence>

    </section>
  );
}

function DateBadge({ task, visibleDueDate, darkMode }: any) {
  if (visibleDueDate) {
    const isManualDate = Boolean(task.dueDate);

    return (
      <span
        className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-[700] tracking-[-0.01em] ${
          isManualDate
            ? "border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-600 dark:border-emerald-300/10 dark:bg-emerald-300/[0.08] dark:text-emerald-200"
            : "border-[#05AD98]/15 bg-[#05AD98]/[0.08] text-[#047E70] dark:border-[#05AD98]/25 dark:bg-[#05AD98]/12 dark:text-[#7EE7DC]"
        }`}
      >
        {isManualDate
          ? `Due ${formatDueDate(task.dueDate)}`
          : `Suggested ${formatDueDate(task.suggestedDueDate)}`}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-[700] tracking-[-0.01em] ${
        darkMode
          ? "border-white/[0.08] bg-white/[0.04] text-white/35"
          : "border-black/[0.06] bg-black/[0.025] text-[#666661]/35"
      }`}
    >
      No date
    </span>
  );
}


function PrioritiesView({
  darkMode,
  border,
  className,
  highPriorityTasks,
  mediumPriorityTasks,
  lowPriorityTasks,
  toggleTaskById,
  deleteTask,
  setSelectedTask,
  setIsEditModalOpen,
  manualFocusTaskIds = [],
  toggleFocusTask,
}: any) {
  const totalTasks =
    highPriorityTasks.length +
    mediumPriorityTasks.length +
    lowPriorityTasks.length;

  const priorityGroups = [
    {
      key: "high",
      title: "High",
      description:
        "Handle these first.",
      tasks: highPriorityTasks,
      dotColor: "#ef4444",
    },
    {
      key: "medium",
      title: "Medium",
      description:
        "Useful work, but less urgent.",
      tasks: mediumPriorityTasks,
      dotColor: "#f59e0b",
    },
    {
      key: "low",
      title: "Low",
      description:
        "Keep visible, but do later.",
      tasks: lowPriorityTasks,
      dotColor: "#10b981",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[28px] font-[700] tracking-[-0.04em] sm:text-[32px]">
            Priority
          </h2>

          <p
            className={`mt-2 text-sm ${
              darkMode
                ? "text-white/55"
                : "text-[#666661]/45"
            }`}
          >
            Your active tasks grouped by
            importance.
          </p>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-[700] ${className} ${border}`}
        >
          {totalTasks} active task
          {totalTasks === 1
            ? ""
            : "s"}
        </div>
      </div>

      <div className="space-y-6">
        {priorityGroups.map(
          (group) => (
            <section
              key={group.key}
              className={`overflow-hidden rounded-[20px] border border-l-[3px] shadow-sm ${
                group.title === "High"
                  ? "border-l-red-500"
                  : group.title ===
                    "Medium"
                  ? "border-l-orange-500"
                  : "border-l-emerald-500"
              } ${
                darkMode
                  ? "border-y-white/[0.09] border-r-white/[0.09] bg-[#171717]"
                  : "border-y-black/[0.07] border-r-black/[0.07] bg-white"
              }`}
            >
              <div
                className={`flex items-center justify-between border-b px-6 py-5 ${border}`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          group.dotColor,
                      }}
                    />

                    <h3 className="text-[15px] font-[700] sm:text-[16px]">
                      {group.title}
                    </h3>
                  </div>

                  <p
                    className={`mt-1 text-[11px] sm:text-[12px] ${
                      darkMode
                        ? "text-white/55"
                        : "text-[#666661]/45"
                    }`}
                  >
                    {group.description}
                  </p>
                </div>

                <div
                  className={`flex h-8 min-w-8 items-center justify-center rounded-full px-3 text-xs font-[700] ${
                    darkMode
                      ? "bg-white/10 text-white/70"
                      : "bg-black/[0.04] text-[#666661]/60"
                  }`}
                >
                  {group.tasks.length}
                </div>
              </div>

              {group.tasks.map(
                (task: any) => (
                  <div
                    key={task.id}
                    className={`group/task flex min-h-[64px] flex-col items-start gap-3 border-b px-5 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-4 sm:px-6 ${border}`}
                  >
                    <button
                      type="button"
                      onClick={(event) =>
                        toggleTaskById(
                          task.id,
                          event
                        )
                      }
                      className="opacity-60 hover:opacity-100"
                    >
                      <Circle size={22} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTask(
                            task
                          );

                          setIsEditModalOpen(
                            true
                          );
                        }}
                        className={`block max-w-full truncate text-left text-[13px] font-[700] sm:text-[14px] ${
                          darkMode
                            ? "text-white"
                            : "text-[#252933]"
                        }`}
                      >
                        {task.title}
                      </button>

                      <div
                        className={`mt-1 flex min-w-0 items-center gap-1.5 text-[11px] ${
                          darkMode
                            ? "text-white/48"
                            : "text-[#666661]/55"
                        }`}
                      >
                        <span className="truncate">
                          {task.category ===
                          "-"
                            ? "-"
                            : task.category ||
                              "No category"}
                        </span>

                        <InlineFocusAction
                          taskId={
                            task.id
                          }
                          manualFocusTaskIds={
                            manualFocusTaskIds
                          }
                          toggleFocusTask={
                            toggleFocusTask
                          }
                          darkMode={
                            darkMode
                          }
                        />
                      </div>
                    </div>

                    <span
                      className={`text-[12px] font-[700] ${
                        task.priority ===
                        "High"
                          ? "text-red-500"
                          : task.priority ===
                            "Medium"
                          ? "text-orange-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {task.priority}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        deleteTask(
                          task.id
                        )
                      }
                      className="opacity-30 transition hover:text-red-500 hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              )}
            </section>
          )
        )}
      </div>
    </div>
  );
}

function PriorityColumn({
  title,
  description,
  tasks,
  emptyMessage,
  badgeClass,
  dotColor,
  darkMode,
  border,
  className,
  toggleTaskById,
  deleteTask,
  setSelectedTask,
  setIsEditModalOpen,
}: any) {
  return (
    <section className={`rounded-[28px] border p-5 shadow-sm ${className} ${border}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
            <h3 className="text-[15px] font-[700]">{title}</h3>
          </div>
          <p className={`mt-1 text-xs ${darkMode ? "text-white/40" : "text-[#666661]/40"}`}>
            {description}
          </p>
        </div>

        <span className={`rounded-full px-2.5 py-1 text-[10px] font-[900] ${badgeClass}`}>
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 && (
          <div
            className={`rounded-2xl border border-dashed p-5 text-sm ${
              darkMode
                ? "border-white/10 text-white/35"
                : "border-black/10 text-[#666661]/35"
            }`}
          >
            {emptyMessage}
          </div>
        )}

        {tasks.map((task: any) => (
          <CompactTaskCard
            key={task.id}
            task={task}
            darkMode={darkMode}
            border={border}
            toggleTaskById={toggleTaskById}
            deleteTask={deleteTask}
            setSelectedTask={setSelectedTask}
            setIsEditModalOpen={setIsEditModalOpen}
          />
        ))}
      </div>
    </section>
  );
}

function CompactTaskCard({
  task,
  darkMode,
  border,
  toggleTaskById,
  deleteTask,
  setSelectedTask,
  setIsEditModalOpen,
}: any) {
  const visibleDueDate = task.dueDate || task.suggestedDueDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 transition hover:scale-[1.005] ${border} ${getPriorityRowClass(
        task.priority,
        darkMode
      )}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => toggleTaskById(task.id, e)}
          className="mt-0.5 opacity-70 transition hover:opacity-100"
        >
          <Circle size={18} className={darkMode ? "text-white/25" : "text-[#666661]/25"} />
        </button>

        <div className="min-w-0 flex-1">
          <p
            onClick={() => {
              setSelectedTask(task);
              setIsEditModalOpen(true);
            }}
            className="cursor-pointer text-sm font-[700] leading-5 hover:opacity-70"
          >
            {task.title}
          </p>

          <p className={`mt-1 text-[11px] ${darkMode ? "text-white/38" : "text-[#666661]/38"}`}>
            {task.category}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-[700] ${getPriorityClass(task.priority)}`}>
              {task.priority}
            </span>

            <DateBadge task={task} visibleDueDate={visibleDueDate} darkMode={darkMode} />

            {hasFollowUpTag(task) && <FollowUpTag darkMode={darkMode} />}
          </div>
        </div>

        <button
          onClick={() => deleteTask(task.id)}
          className="opacity-25 transition hover:text-red-500 hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}

function PriorityListGroup({
  title,
  description,
  tasks,
  emptyMessage,
  badgeClass,
  dotColor,
  darkMode,
  border,
  className,
  toggleTaskById,
  deleteTask,
  setSelectedTask,
  setIsEditModalOpen,
}: any) {
  return (
    <section className={`rounded-[28px] border shadow-sm ${className} ${border}`}>
      <div className={`flex items-center justify-between border-b px-5 py-4 ${border}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
            <h3 className="text-[15px] font-[700]">{title}</h3>
          </div>

          <p className={`mt-1 text-xs ${darkMode ? "text-white/40" : "text-[#666661]/40"}`}>
            {description}
          </p>
        </div>

        <span className={`rounded-full px-2.5 py-1 text-[10px] font-[900] ${badgeClass}`}>
          {tasks.length}
        </span>
      </div>

      <TaskRows
        tasks={tasks}
        emptyMessage={emptyMessage}
        darkMode={darkMode}
        border={border}
        toggleTaskById={toggleTaskById}
        deleteTask={deleteTask}
        setSelectedTask={setSelectedTask}
        setIsEditModalOpen={setIsEditModalOpen}
      />
    </section>
  );
}

function AirtablePriorityGroup({
  title,
  description,
  tasks,
  dotColor,
  darkMode,
  border,
  toggleTaskById,
  deleteTask,
  setSelectedTask,
  setIsEditModalOpen,
}: any) {
  return (
    <section
      className={`overflow-hidden rounded-[20px] border border-l-[3px] shadow-sm ${
        title === "High"
          ? "border-l-red-500"
          : title === "Medium"
          ? "border-l-orange-500"
          : "border-l-emerald-500"
      } ${
        darkMode
          ? "border-y-white/[0.09] border-r-white/[0.09] bg-[#171717]"
          : "border-y-black/[0.07] border-r-black/[0.07] bg-white"
      }`}
    >
      <div className={`flex items-center justify-between border-b px-6 py-5 ${border}`}>
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: dotColor }} />
            <h3 className="text-[15px] font-[700] sm:text-[16px]">{title}</h3>
          </div>

          <p className={`mt-1 text-[11px] sm:text-[12px] ${darkMode ? "text-white/55" : "text-[#666661]/45"}`}>
            {description}
          </p>
        </div>

        <div className={`flex h-8 min-w-8 items-center justify-center rounded-full px-3 text-xs font-[700] ${
          darkMode ? "bg-white/10 text-white/70" : "bg-black/[0.04] text-[#666661]/60"
        }`}>
          {tasks.length}
        </div>
      </div>

      {tasks.map((task: any) => (
        <div
          key={task.id}
          className={`group flex min-h-[64px] flex-col items-start gap-3 border-b px-5 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-4 sm:px-6 ${
            task.completed ? "bg-black/[0.025] dark:bg-white/[0.035]" : ""
          } ${border}`}
        >
          <button
            onClick={(e) => toggleTaskById(task.id, e)}
            className="opacity-60 hover:opacity-100"
          >
            {task.completed ? (
              <CheckCircle2 size={22} className="text-emerald-500" />
            ) : (
              <Circle size={22} />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p
              onClick={() => {
                setSelectedTask(task);
                setIsEditModalOpen(true);
              }}
              className={`cursor-pointer truncate text-[13px] font-[700] sm:text-[14px] ${
                task.completed
                  ? darkMode
                    ? "text-white/55 line-through decoration-white/45"
                    : "text-[#666661]/45 line-through decoration-black/45"
                  : darkMode
                  ? "text-white"
                  : "text-[#666661]"
              }`}
            >
              {task.title}
            </p>

            {hasFollowUpTag(task) && (
              <div className="mt-1.5">
                <FollowUpTag darkMode={darkMode} />
              </div>
            )}

            <p
            className={`mt-1 text-[11px] sm:text-[12px] ${
              task.completed
                ? darkMode
                  ? "text-white/42"
                  : "text-[#666661]/35"
                : darkMode
                ? "text-white/48"
                : "text-[#666661]/40"
            }`}
            >
              {task.category} • {task.priority}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-start gap-3 text-[12px] font-[700] sm:w-auto sm:justify-end sm:gap-5 sm:text-[13px] sm:font-[700]">
            {task.dueDate && (
              <div className={`flex items-center gap-1.5 ${
                darkMode ? "text-white/70" : "text-[#666661]/65"
              }`}>
                <Calendar size={14} />
                <span>{formatDueDate(task.dueDate)}</span>
              </div>
            )}

            <div className={`flex items-center gap-1.5 ${
              task.priority === "High"
                ? "text-red-500"
                : task.priority === "Medium"
                ? "text-orange-500"
                : "text-emerald-500"
            }`}>
              <span className="text-[12px]">●</span>
              <span>{task.priority}</span>
            </div>
          </div>

          <button
            onClick={() => deleteTask(task.id)}
            className="opacity-30 transition hover:text-red-500 hover:opacity-100"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </section>
  );
}







function UpcomingView({
  darkMode,
  border,
  className,
  themeColor,
  viewMode,
  setViewMode,
  todayTasks,
  tomorrowTasks,
  laterTasks,
  noDateTasks,
  toggleTaskById,
  deleteTask,
  acceptSuggestedDateById,
  setSelectedTask,
  setIsEditModalOpen,
  manualFocusTaskIds = [],
  toggleFocusTask,
}: any) {
  const totalScheduled =
    todayTasks.length +
    tomorrowTasks.length +
    laterTasks.length;

  const groups = [
    {
      title: "Today",
      description:
        "Work that needs attention now.",
      tasks: todayTasks,
      emptyMessage:
        "Nothing due today.",
      dotColor: themeColor,
    },
    {
      title: "Tomorrow",
      description:
        "Tasks coming up next.",
      tasks: tomorrowTasks,
      emptyMessage:
        "Nothing scheduled for tomorrow.",
      dotColor: "#f59e0b",
    },
    {
      title: "Later",
      description:
        "Future scheduled work.",
      tasks: laterTasks,
      emptyMessage:
        "No later tasks yet.",
      dotColor: "#3b82f6",
    },
    {
      title: "No Date",
      description:
        "Tasks that still need a date.",
      tasks: noDateTasks,
      emptyMessage:
        "Every task has a date.",
      dotColor: "#71717a",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[28px] font-[700] tracking-[-0.04em] sm:text-[32px]">
            Upcoming
          </h2>

          <p
            className={`mt-2 text-[13px] sm:text-sm ${
              darkMode
                ? "text-white/55"
                : "text-[#666661]/45"
            }`}
          >
            Tasks grouped by manual due dates and
            Momentuhm-suggested dates.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div
            className={`rounded-2xl border px-4 py-3 text-xs font-[700] ${className} ${border}`}
          >
            {totalScheduled} scheduled task
            {totalScheduled === 1
              ? ""
              : "s"}
          </div>

          <div
            className={`flex rounded-2xl border p-1 ${className} ${border}`}
          >
            <button
              type="button"
              onClick={() =>
                setViewMode("calendar")
              }
              className={`h-9 rounded-xl px-4 text-xs font-[700] transition ${
                viewMode === "calendar"
                  ? "text-white"
                  : darkMode
                  ? "text-white/55 hover:text-white"
                  : "text-[#666661]/45 hover:text-[#666661]"
              }`}
              style={
                viewMode === "calendar"
                  ? {
                      backgroundColor:
                        themeColor,
                    }
                  : undefined
              }
            >
              Calendar
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode("list")
              }
              className={`h-9 rounded-xl px-4 text-xs font-[700] transition ${
                viewMode === "list"
                  ? "text-white"
                  : darkMode
                  ? "text-white/55 hover:text-white"
                  : "text-[#666661]/45 hover:text-[#666661]"
              }`}
              style={
                viewMode === "list"
                  ? {
                      backgroundColor:
                        themeColor,
                    }
                  : undefined
              }
            >
              List
            </button>
          </div>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <UpcomingCalendarView
          darkMode={darkMode}
          border={border}
          className={className}
          themeColor={themeColor}
          todayTasks={todayTasks}
          tomorrowTasks={tomorrowTasks}
          laterTasks={laterTasks}
          noDateTasks={noDateTasks}
          toggleTaskById={toggleTaskById}
          deleteTask={deleteTask}
          acceptSuggestedDateById={
            acceptSuggestedDateById
          }
          setSelectedTask={
            setSelectedTask
          }
          setIsEditModalOpen={
            setIsEditModalOpen
          }
          manualFocusTaskIds={
            manualFocusTaskIds
          }
          toggleFocusTask={
            toggleFocusTask
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <UpcomingGroup
              key={group.title}
              {...group}
              darkMode={darkMode}
              border={border}
              className={className}
              toggleTaskById={
                toggleTaskById
              }
              deleteTask={
                deleteTask
              }
              acceptSuggestedDateById={
                acceptSuggestedDateById
              }
              setSelectedTask={
                setSelectedTask
              }
              setIsEditModalOpen={
                setIsEditModalOpen
              }
              manualFocusTaskIds={
                manualFocusTaskIds
              }
              toggleFocusTask={
                toggleFocusTask
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingCalendarView({
  darkMode,
  border,
  className,
  themeColor,
  todayTasks,
  tomorrowTasks,
  laterTasks,
  noDateTasks,
  toggleTaskById,
  deleteTask,
  acceptSuggestedDateById,
  setSelectedTask,
  setIsEditModalOpen,
  manualFocusTaskIds = [],
  toggleFocusTask,
}: any) {
  const calendarDays = [
    {
      title: "Today",
      dateLabel:
        formatDueDate(
          getTodayDate()
        ),
      tasks: todayTasks,
      dotColor: themeColor,
      emptyMessage:
        "No tasks today.",
    },
    {
      title: "Tomorrow",
      dateLabel:
        formatDueDate(
          getTomorrowDate()
        ),
      tasks: tomorrowTasks,
      dotColor: "#f59e0b",
      emptyMessage:
        "Nothing tomorrow.",
    },
    {
      title: "Later",
      dateLabel: "Future",
      tasks: laterTasks,
      dotColor: "#3b82f6",
      emptyMessage:
        "No future tasks.",
    },
    {
      title: "No Date",
      dateLabel: "Unscheduled",
      tasks: noDateTasks,
      dotColor: "#71717a",
      emptyMessage:
        "Everything is scheduled.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
      {calendarDays.map((day) => (
        <section
          key={day.title}
          className={`min-h-[320px] rounded-[28px] border p-4 shadow-sm xl:min-h-[420px] ${className} ${border}`}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      day.dotColor,
                  }}
                />

                <h3 className="text-[15px] font-[700]">
                  {day.title}
                </h3>
              </div>

              <p
                className={`mt-1 text-xs ${
                  darkMode
                    ? "text-white/40"
                    : "text-[#666661]/40"
                }`}
              >
                {day.dateLabel}
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-[900] ${
                darkMode
                  ? "bg-white/[0.06] text-white/50"
                  : "bg-black/[0.04] text-[#666661]/50"
              }`}
            >
              {day.tasks.length}
            </span>
          </div>

          <div className="space-y-2">
            {day.tasks.length === 0 && (
              <div
                className={`rounded-2xl border border-dashed p-4 text-sm ${
                  darkMode
                    ? "border-white/10 text-white/35"
                    : "border-black/10 text-[#666661]/35"
                }`}
              >
                {day.emptyMessage}
              </div>
            )}

            {day.tasks.map(
              (task: any) => (
                <UpcomingCalendarTaskCard
                  key={task.id}
                  task={task}
                  darkMode={darkMode}
                  border={border}
                  toggleTaskById={
                    toggleTaskById
                  }
                  deleteTask={
                    deleteTask
                  }
                  acceptSuggestedDateById={
                    acceptSuggestedDateById
                  }
                  setSelectedTask={
                    setSelectedTask
                  }
                  setIsEditModalOpen={
                    setIsEditModalOpen
                  }
                  manualFocusTaskIds={
                    manualFocusTaskIds
                  }
                  toggleFocusTask={
                    toggleFocusTask
                  }
                />
              )
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function UpcomingCalendarTaskCard({
  task,
  darkMode,
  border,
  toggleTaskById,
  deleteTask,
  acceptSuggestedDateById,
  setSelectedTask,
  setIsEditModalOpen,
  manualFocusTaskIds = [],
  toggleFocusTask,
}: any) {
  const visibleDueDate =
    task.dueDate ||
    task.suggestedDueDate;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className={`group/task rounded-2xl border p-3 transition hover:scale-[1.01] ${border} ${
        darkMode
          ? "hover:bg-white/[0.04]"
          : "hover:bg-black/[0.02]"
      }`}
    >
      <div className="mb-3 flex items-start gap-2">
        <button
          type="button"
          onClick={(event) =>
            toggleTaskById(
              task.id,
              event
            )
          }
          className="mt-0.5 opacity-70 transition hover:opacity-100"
        >
          <Circle
            size={17}
            className={
              darkMode
                ? "text-white/25"
                : "text-[#666661]/25"
            }
          />
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              setSelectedTask(task);
              setIsEditModalOpen(true);
            }}
            className="block w-full text-left text-sm font-[700] leading-5 hover:opacity-70"
          >
            {task.title}
          </button>

          <div
            className={`mt-1 flex min-w-0 items-center gap-1.5 text-[11px] ${
              darkMode
                ? "text-white/38"
                : "text-[#666661]/38"
            }`}
          >
            <span className="truncate">
              {task.category === "-"
                ? "-"
                : task.category ||
                  "No category"}
            </span>

            <InlineFocusAction
              taskId={task.id}
              manualFocusTaskIds={
                manualFocusTaskIds
              }
              toggleFocusTask={
                toggleFocusTask
              }
              darkMode={darkMode}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            deleteTask(task.id)
          }
          className="opacity-25 transition hover:text-red-500 hover:opacity-100"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex h-7 items-center rounded-full px-3 text-[11px] font-[700] tracking-[-0.01em] ${getPriorityClass(
            task.priority
          )}`}
        >
          {task.priority}
        </span>

        <DateBadge
          task={task}
          visibleDueDate={
            visibleDueDate
          }
          darkMode={darkMode}
        />

        {hasFollowUpTag(task) && (
          <FollowUpTag
            darkMode={darkMode}
          />
        )}

        {task.suggestedDueDate &&
          !task.dueDate &&
          acceptSuggestedDateById && (
            <button
              type="button"
              onClick={() =>
                acceptSuggestedDateById(
                  task.id
                )
              }
              className={`rounded-full px-2.5 py-1 text-[10px] font-[700] transition hover:scale-[1.03] ${
                darkMode
                  ? "bg-white/[0.06] text-white/55 hover:text-white"
                  : "bg-black/[0.04] text-[#666661]/55 hover:text-[#666661]"
              }`}
            >
              Accept
            </button>
          )}
      </div>
    </motion.div>
  );
}

function UpcomingGroup({
  title,
  description,
  tasks,
  emptyMessage,
  dotColor,
  darkMode,
  border,
  className,
  toggleTaskById,
  deleteTask,
  acceptSuggestedDateById,
  setSelectedTask,
  setIsEditModalOpen,
  manualFocusTaskIds = [],
  toggleFocusTask,
}: any) {
  return (
    <section
      className={`rounded-[28px] border shadow-sm ${className} ${border}`}
    >
      <div
        className={`flex items-center justify-between border-b px-5 py-4 ${border}`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  dotColor,
              }}
            />

            <h3 className="text-[15px] font-[700]">
              {title}
            </h3>
          </div>

          <p
            className={`mt-1 text-xs ${
              darkMode
                ? "text-white/40"
                : "text-[#666661]/40"
            }`}
          >
            {description}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-[900] ${
            darkMode
              ? "bg-white/[0.06] text-white/50"
              : "bg-black/[0.04] text-[#666661]/50"
          }`}
        >
          {tasks.length}
        </span>
      </div>

      <TaskRows
        tasks={tasks}
        emptyMessage={
          emptyMessage
        }
        darkMode={darkMode}
        border={border}
        toggleTaskById={
          toggleTaskById
        }
        deleteTask={
          deleteTask
        }
        acceptSuggestedDateById={
          acceptSuggestedDateById
        }
        setSelectedTask={
          setSelectedTask
        }
        setIsEditModalOpen={
          setIsEditModalOpen
        }
        manualFocusTaskIds={
          manualFocusTaskIds
        }
        toggleFocusTask={
          toggleFocusTask
        }
      />
    </section>
  );
}

function TaskRows({
  tasks,
  emptyMessage,
  darkMode,
  border,
  toggleTaskById,
  deleteTask,
  acceptSuggestedDateById,
  setSelectedTask,
  setIsEditModalOpen,
  manualFocusTaskIds = [],
  toggleFocusTask,
}: any) {
  return (
    <div>
      {tasks.length === 0 && (
        <div
          className={`p-5 text-sm ${
            darkMode
              ? "text-white/35"
              : "text-[#666661]/35"
          }`}
        >
          {emptyMessage}
        </div>
      )}

      {tasks.map((task: any) => {
        const visibleDueDate =
          task.dueDate ||
          task.suggestedDueDate;

        return (
          <motion.div
            key={task.id}
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className={`group/task flex min-h-[72px] flex-col items-start gap-3 border-b px-5 py-4 transition-colors last:border-none sm:flex-row sm:items-center sm:gap-4 ${border} ${getPriorityRowClass(
              task.priority,
              darkMode
            )}`}
          >
            <div className="flex w-full min-w-0 items-start gap-3 sm:w-auto sm:flex-1 sm:items-center">
              <button
                type="button"
                onClick={(event) =>
                  toggleTaskById(
                    task.id,
                    event
                  )
                }
                className="mt-0.5 shrink-0 opacity-70 transition hover:opacity-100 sm:mt-0"
              >
                <Circle
                  size={18}
                  className={
                    darkMode
                      ? "text-white/25"
                      : "text-[#666661]/25"
                  }
                />
              </button>

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(
                      task
                    );

                    setIsEditModalOpen(
                      true
                    );
                  }}
                  className="block w-full text-left text-[15px] font-[700] leading-5 tracking-[-0.015em] hover:opacity-70 sm:truncate"
                >
                  {task.title}
                </button>

                <div
                  className={`mt-1 flex min-w-0 items-center gap-1.5 text-[10.5px] font-[650] sm:mt-1.5 sm:text-[11px] ${
                    darkMode
                      ? "text-white/38"
                      : "text-[#666661]/38"
                  }`}
                >
                  <span className="truncate">
                    {task.category === "-"
                      ? "-"
                      : task.category ||
                        "No category"}
                  </span>

                  <InlineFocusAction
                    taskId={task.id}
                    manualFocusTaskIds={
                      manualFocusTaskIds
                    }
                    toggleFocusTask={
                      toggleFocusTask
                    }
                    darkMode={darkMode}
                  />

                  <span
                    aria-hidden="true"
                    className="opacity-40"
                  >
                    ·
                  </span>

                  <span className="shrink-0">
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <DateBadge
                task={task}
                visibleDueDate={
                  visibleDueDate
                }
                darkMode={darkMode}
              />

              {hasFollowUpTag(task) && (
                <FollowUpTag
                  darkMode={
                    darkMode
                  }
                />
              )}

              {task.suggestedDueDate &&
                !task.dueDate &&
                acceptSuggestedDateById && (
                  <button
                    type="button"
                    onClick={() =>
                      acceptSuggestedDateById(
                        task.id
                      )
                    }
                    className={`rounded-full px-3 py-1 text-[11px] font-[700] transition hover:scale-[1.03] ${
                      darkMode
                        ? "bg-white/[0.06] text-white/55 hover:text-white"
                        : "bg-black/[0.04] text-[#666661]/55 hover:text-[#666661]"
                    }`}
                  >
                    Accept
                  </button>
                )}

              <span
                className={`inline-flex h-7 items-center rounded-full px-3 text-[11px] font-[700] tracking-[-0.01em] ${getPriorityClass(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>

              <button
                type="button"
                onClick={() =>
                  deleteTask(
                    task.id
                  )
                }
                className="opacity-35 transition hover:text-red-500 hover:opacity-100"
              >
                <Trash2
                  size={16}
                />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function InboxView({
  darkMode,
  inboxTasks,
  enableAppSuggestions,
  toggleTaskById,
  deleteTask,
  scheduleTaskById,
  setSelectedTask,
  setIsEditModalOpen,
  manualFocusTaskIds = [],
  toggleFocusTask,
}: any) {
  const panelBorder = darkMode
    ? "border-white/[0.10]"
    : "border-[#DDDDE3]";

  const rowBorder = darkMode
    ? "border-white/[0.08]"
    : "border-[#E8E9ED]";

  const panelSurface = darkMode
    ? "bg-[#14171B]"
    : "bg-white";

  const secondarySurface =
    darkMode
      ? "bg-white/[0.025]"
      : "bg-[#FAFAFB]";

  const primaryText = darkMode
    ? "text-white"
    : "text-[#17191F]";

  const secondaryText = darkMode
    ? "text-white/86"
    : "text-[#252933]";

  const mutedText = darkMode
    ? "text-white/48"
    : "text-[#6B6F7B]";

  const openTaskEditor = (
    task: any
  ) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const getPriorityMeta = (
    priority?: string
  ) => {
    if (priority === "High") {
      return {
        label: "High",
        className: darkMode
          ? "border-red-400/20 bg-red-400/10 text-red-300"
          : "border-red-200 bg-red-50 text-red-600",
      };
    }

    if (
      priority === "Medium" ||
      priority === "Med"
    ) {
      return {
        label: "Medium",
        className: darkMode
          ? "border-orange-400/20 bg-orange-400/10 text-orange-300"
          : "border-orange-200 bg-orange-50 text-orange-600",
      };
    }

    return {
      label: "Low",
      className: darkMode
        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
        : "border-emerald-200 bg-emerald-50 text-emerald-600",
    };
  };

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className={`text-[28px] font-[760] leading-none tracking-[-0.045em] ${primaryText}`}
          >
            Inbox
          </h1>

          <p
            className={`mt-2 text-[13px] font-[500] leading-5 ${mutedText}`}
          >
            Captured tasks that still
            need a clear date or review.
          </p>
        </div>

        <div
          className={`inline-flex h-10 shrink-0 items-center rounded-[9px] border px-3.5 text-[11px] font-[650] ${panelBorder} ${panelSurface} ${secondaryText}`}
        >
          {inboxTasks.length} item
          {inboxTasks.length === 1
            ? ""
            : "s"}{" "}
          to review
        </div>
      </header>

      <section
        aria-label="Tasks needing review"
        className={`overflow-hidden rounded-[14px] border shadow-[0_1px_2px_rgba(15,23,42,0.02)] ${panelBorder} ${panelSurface}`}
      >
        <header
          className={`flex min-h-[68px] items-center justify-between gap-4 border-b px-4 py-3.5 sm:px-5 ${rowBorder} ${secondarySurface}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border ${
                darkMode
                  ? "border-white/[0.10] bg-white/[0.04] text-white/55"
                  : "border-[#DDDDE3] bg-white text-[#5F6572]"
              }`}
            >
              <Calendar
                size={16}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <h2
                className={`text-[17px] font-[720] tracking-[-0.025em] ${primaryText}`}
              >
                Needs review
              </h2>

              <p
                className={`mt-1 text-[11px] font-[500] ${mutedText}`}
              >
                These tasks do not yet have
                a confirmed or suggested
                date.
              </p>
            </div>
          </div>

          <span
            className={`flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-2.5 text-[10px] font-[700] ${
              darkMode
                ? "bg-white/[0.07] text-white/60"
                : "bg-[#F0F1F4] text-[#59606C]"
            }`}
          >
            {inboxTasks.length}
          </span>
        </header>

        {inboxTasks.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center px-6 py-12 text-center">
            <div className="max-w-[360px]">
              <div
                className={`mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] border ${
                  darkMode
                    ? "border-white/[0.10] bg-white/[0.04] text-white/55"
                    : "border-[#DDDDE3] bg-[#F7F8FA] text-[#5F6572]"
                }`}
              >
                <CheckCircle2
                  size={19}
                  strokeWidth={1.7}
                />
              </div>

              <h3
                className={`mt-4 text-[16px] font-[700] ${primaryText}`}
              >
                Your inbox is clear
              </h3>

              <p
                className={`mt-2 text-[12px] font-[500] leading-5 ${mutedText}`}
              >
                Every active task has either a
                confirmed date or a Momentuhm
                suggestion.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {inboxTasks.map(
              (task: any) => {
                const priority =
                  getPriorityMeta(
                    task.priority
                  );

                return (
                  <motion.div
                    key={task.id}
                    layout="position"
                    initial={{
                      opacity: 0,
                      y: 5,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.18,
                      ease: [
                        0.16,
                        1,
                        0.3,
                        1,
                      ],
                    }}
                    className={`group/task grid grid-cols-1 gap-4 border-b px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5 ${rowBorder} ${
                      darkMode
                        ? "hover:bg-white/[0.025]"
                        : "hover:bg-[#FBFBFC]"
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <button
                        type="button"
                        onClick={(event) =>
                          toggleTaskById(
                            task.id,
                            event
                          )
                        }
                        aria-label={`Complete ${task.title}`}
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition active:scale-95"
                      >
                        <span
                          aria-hidden="true"
                          className={`h-4 w-4 rounded-[4px] border ${
                            darkMode
                              ? "border-white/42"
                              : "border-[#9297A1]"
                          }`}
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() =>
                            openTaskEditor(
                              task
                            )
                          }
                          title={task.title}
                          className={`block max-w-full text-left text-[13px] font-[650] leading-5 tracking-[-0.015em] transition hover:opacity-70 ${secondaryText}`}
                        >
                          {task.title}
                        </button>

                        <div
                          className={`mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-[500] ${mutedText}`}
                        >
                          <span className="truncate">
                            {task.category === "-"
                              ? "-"
                              : task.category ||
                                "No category"}
                          </span>

                          <InlineFocusAction
                            taskId={
                              task.id
                            }
                            manualFocusTaskIds={
                              manualFocusTaskIds
                            }
                            toggleFocusTask={
                              toggleFocusTask
                            }
                            darkMode={
                              darkMode
                            }
                          />

                          <span
                            aria-hidden="true"
                            className="opacity-45"
                          >
                            ·
                          </span>

                          <span className="shrink-0">
                            Needs a date
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-[6px] border px-2 py-1 text-[9.5px] font-[650] ${priority.className}`}
                          >
                            {priority.label}
                          </span>

                          {hasFollowUpTag(
                            task
                          ) && (
                            <span
                              className={`rounded-[6px] border px-2 py-1 text-[9.5px] font-[600] ${
                                darkMode
                                  ? "border-amber-300/15 bg-amber-300/[0.07] text-amber-200/80"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              }`}
                            >
                              Follow-up
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {enableAppSuggestions && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              scheduleTaskById(
                                task.id,
                                getTodayDate()
                              )
                            }
                            className={`h-9 rounded-[8px] border px-3 text-[10px] font-[650] transition ${
                              darkMode
                                ? "border-white/[0.10] text-white/58 hover:bg-white/[0.06] hover:text-white"
                                : "border-[#DDDDE3] bg-white text-[#5F6572] hover:bg-[#F4F5F7] hover:text-[#252933]"
                            }`}
                          >
                            Today
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              scheduleTaskById(
                                task.id,
                                getTomorrowDate()
                              )
                            }
                            className={`h-9 rounded-[8px] border px-3 text-[10px] font-[650] transition ${
                              darkMode
                                ? "border-white/[0.10] text-white/58 hover:bg-white/[0.06] hover:text-white"
                                : "border-[#DDDDE3] bg-white text-[#5F6572] hover:bg-[#F4F5F7] hover:text-[#252933]"
                            }`}
                          >
                            Tomorrow
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          openTaskEditor(
                            task
                          )
                        }
                        className={`h-9 rounded-[8px] px-3.5 text-[10px] font-[700] transition active:scale-[0.98] ${
                          darkMode
                            ? "bg-white text-[#181818] hover:bg-white/90"
                            : "bg-[#20232B] text-white hover:bg-[#30343D]"
                        }`}
                      >
                        Review
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteTask(
                            task.id
                          )
                        }
                        aria-label={`Delete ${task.title}`}
                        title="Delete task"
                        className={`flex h-9 w-9 items-center justify-center rounded-[8px] border transition ${
                          darkMode
                            ? "border-white/[0.08] text-white/35 hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-300"
                            : "border-[#E1E2E6] text-[#8A8F99] hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        <Trash2
                          size={14}
                          strokeWidth={1.7}
                        />
                      </button>
                    </div>
                  </motion.div>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function MobileTodayAppView({
  darkMode,
  setDarkMode,
  themeColor,
  border,
  prioritizedTasks,
  completedToday,
completionPercent,
taskTabTotalCount,
taskTabCompletedCount,
newTask,
  setNewTask,
  newTaskWhy,
  setNewTaskWhy,
  addTask,
  setIsExtractModalOpen,
  toggleTaskById,
  setSelectedTask,
  setIsEditModalOpen,
  manualFocusTaskIds = [],
  archiveCompletedToday,
  restoreCompletedTask,
  anchorTaskListSoon = () => {},
  userFirstName = "",
  refreshLatestStatus = async () => {},
  isRefreshingStatus = false,
  }: any) {
  const [sortMode, setSortMode] =
    useState<SortMode>("date");

  const [groupMode, setGroupMode] =
    useState<MobileGroupMode>("category");

  const [workspaceMode, setWorkspaceMode] =
    useState<"tasks" | "focus">("tasks");

  const [isCaptureOpen, setIsCaptureOpen] =
    useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedGroupMode =
      window.localStorage.getItem(
        MOBILE_GROUP_MODE_KEY
      );

    if (
      savedGroupMode === "category" ||
      savedGroupMode === "priority" ||
      savedGroupMode === "date"
    ) {
      setGroupMode(savedGroupMode);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const openTasks = () => {
      setWorkspaceMode("tasks");
    };

    const openFocus = () => {
      setWorkspaceMode("focus");
    };

    const openCapture = () => {
      setWorkspaceMode("tasks");
      setIsCaptureOpen(true);

      window.setTimeout(() => {
        document
          .getElementById(
            "mobile-quick-capture"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }, 100);
    };

    window.addEventListener(
      "momentuhm:open-tasks",
      openTasks
    );

    window.addEventListener(
      "momentuhm:open-focus",
      openFocus
    );

    window.addEventListener(
      "momentuhm:open-capture",
      openCapture
    );

    return () => {
      window.removeEventListener(
        "momentuhm:open-tasks",
        openTasks
      );

      window.removeEventListener(
        "momentuhm:open-focus",
        openFocus
      );

      window.removeEventListener(
        "momentuhm:open-capture",
        openCapture
      );
    };
  }, []);

  const changeGroupMode = (
    nextMode: MobileGroupMode
  ) => {
    setGroupMode(nextMode);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        MOBILE_GROUP_MODE_KEY,
        nextMode
      );
    }

    anchorTaskListSoon();
  };

  const sortedTasks = useMemo(() => {
    const tasks = [...prioritizedTasks];

    const comparePinned = (
      taskA: any,
      taskB: any
    ) => {
      const pinnedA = Boolean(taskA.pinned);
      const pinnedB = Boolean(taskB.pinned);

      if (pinnedA === pinnedB) return 0;

      return pinnedA ? -1 : 1;
    };

    const compareDates = (
      taskA: any,
      taskB: any
    ) => {
      const dateA = getTaskDate(taskA);
      const dateB = getTaskDate(taskB);

      if (!dateA && !dateB) {
        return (
          (taskB.score || 0) -
          (taskA.score || 0)
        );
      }

      if (!dateA) return 1;
      if (!dateB) return -1;

      const dateDifference =
        dateA.localeCompare(dateB);

      if (dateDifference !== 0) {
        return dateDifference;
      }

      return (
        (taskB.score || 0) -
        (taskA.score || 0)
      );
    };

    if (sortMode === "priority") {
      const priorityRank: Record<
        string,
        number
      > = {
        High: 3,
        Medium: 2,
        Med: 2,
        Low: 1,
      };

      return tasks.sort(
        (taskA, taskB) => {
          const pinnedDifference =
            comparePinned(taskA, taskB);

          if (pinnedDifference !== 0) {
            return pinnedDifference;
          }

          const priorityDifference =
            (priorityRank[
              taskB.priority
            ] || 0) -
            (priorityRank[
              taskA.priority
            ] || 0);

          if (priorityDifference !== 0) {
            return priorityDifference;
          }

          return compareDates(
            taskA,
            taskB
          );
        }
      );
    }

    return tasks.sort(
      (taskA, taskB) => {
        const pinnedDifference =
          comparePinned(taskA, taskB);

        return pinnedDifference !== 0
          ? pinnedDifference
          : compareDates(
              taskA,
              taskB
            );
      }
    );
  }, [prioritizedTasks, sortMode]);

  const groupedTasks = useMemo(() => {
    if (groupMode === "priority") {
      return [
        "High",
        "Medium",
        "Low",
      ]
        .map((priority) => ({
          key: `priority:${priority}`,
          title: priority,
          tasks: sortedTasks.filter(
            (task: any) => {
              const normalizedPriority =
                task.priority === "Med"
                  ? "Medium"
                  : task.priority;

              return (
                normalizedPriority ===
                priority
              );
            }
          ),
        }))
        .filter(
          (group) =>
            group.tasks.length > 0
        );
    }

    if (groupMode === "date") {
      const dateGroups = new Map<
        string,
        {
          key: string;
          title: string;
          order: number;
          tasks: any[];
        }
      >();

      sortedTasks.forEach((task: any) => {
        const date = getTaskDate(task);

        let key = "date:no-date";
        let title = "No date";
        let order = 5;

        if (date && isOverdue(date)) {
          key = "date:overdue";
          title = "Overdue";
          order = 1;
        } else if (date && isToday(date)) {
          key = "date:today";
          title = "Today";
          order = 2;
        } else if (
          date &&
          isTomorrow(date)
        ) {
          key = "date:tomorrow";
          title = "Tomorrow";
          order = 3;
        } else if (date) {
          key = "date:later";
          title = "Later";
          order = 4;
        }

        if (!dateGroups.has(key)) {
          dateGroups.set(key, {
            key,
            title,
            order,
            tasks: [],
          });
        }

        dateGroups
          .get(key)
          ?.tasks.push(task);
      });

      return Array.from(
        dateGroups.values()
      )
        .sort(
          (groupA, groupB) =>
            groupA.order -
            groupB.order
        )
        .map(
          ({
            key,
            title,
            tasks,
          }) => ({
            key,
            title,
            tasks,
          })
        );
    }

    const categoryGroups =
      new Map<string, any[]>();

    sortedTasks.forEach((task: any) => {
      const category =
        task.category || "No category";

      const existingTasks =
        categoryGroups.get(category) || [];

      categoryGroups.set(category, [
        ...existingTasks,
        task,
      ]);
    });

    return Array.from(
      categoryGroups.entries()
    ).map(
      ([category, tasks]) => ({
        key: `category:${category}`,
        title: category,
        tasks,
      })
    );
  }, [groupMode, sortedTasks]);

  const focusTasks =
    manualFocusTaskIds.length > 0
      ? manualFocusTaskIds
          .map((taskId: string) =>
            prioritizedTasks.find(
              (task: any) =>
                task.id === taskId
            )
          )
          .filter(Boolean)
      : prioritizedTasks.slice(0, 3);

  const currentHour =
    new Date().getHours();

  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
      ? "Good afternoon"
      : "Good evening";

  const greetingWithName = `${greeting}${
    userFirstName
      ? `, ${userFirstName}.`
      : "."
  }`;

  const openTask = (task: any) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const submitTask = () => {
    if (!newTask.trim()) return;
  
    setIsCaptureOpen(false);
    void addTask();
  };

  const getStatusMeta = (task: any) => {
    const status = normalizeTaskStatus(
      task.completed
        ? "Done"
        : task.status
    );
  
    if (status === "Done") {
      return {
        label: "Done",
        className: darkMode
          ? "border-[#315B3B] bg-[#1D3525] text-[#81C995]"
          : "border-[#CEEAD6] bg-[#E6F4EA] text-[#137333]",
      };
    }
  
    if (status === "Waiting") {
      return {
        label: "Paused",
        className: darkMode
          ? "border-[#765C24] bg-[#3D321B] text-[#FDD663]"
          : "border-[#FDE293] bg-[#FEF7E0] text-[#B06000]",
      };
    }
  
    if (status === "In progress") {
      return {
        label: "In progress",
        className: darkMode
          ? "border-[#315577] bg-[#1D344A] text-[#8AB4F8]"
          : "border-[#D2E3FC] bg-[#E8F0FE] text-[#1967D2]",
      };
    }
  
    return {
      label: "Not started",
      className: darkMode
        ? "border-white/[0.12] bg-white/[0.05] text-white/58"
        : "border-[#DADCE0] bg-[#F1F3F4] text-[#5F6368]",
    };
  };

  const canvasClass = darkMode
    ? "bg-[#101114] text-[#F1F3F4]"
    : "bg-[#F8F9FA] text-[#202124]";

  const panelClass = darkMode
    ? "border-white/[0.09] bg-[#17181C]"
    : "border-[#DADCE0] bg-white shadow-[0_1px_2px_rgba(60,64,67,0.08)]";

  const dividerClass = darkMode
    ? "border-white/[0.075]"
    : "border-[#E8EAED]";

  const mutedTextClass = darkMode
    ? "text-white/46"
    : "text-[#5F6368]";

  return (
    <div
    className={`min-h-screen w-full min-w-0 max-w-full overflow-x-hidden pb-4 sm:hidden ${canvasClass}`}
  >
  <header className="relative pb-3 pt-1 text-center">
<button
  type="button"
  data-testid="refresh-status-button"
  onClick={() => {
    void refreshLatestStatus();
  }}
  disabled={isRefreshingStatus}
  aria-label={
    isRefreshingStatus
      ? "Refreshing latest status"
      : "Refresh latest status"
  }
  title={
    isRefreshingStatus
      ? "Refreshing..."
      : "Refresh status"
  }
  className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border transition active:scale-95 disabled:cursor-wait ${
    darkMode
      ? "border-white/[0.10] bg-[#17181C] text-white/58 hover:bg-white/[0.07] hover:text-white"
      : "border-[#DADCE0] bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED] hover:text-[#202124]"
  }`}
>
  <RotateCcw
    size={14}
    strokeWidth={1.8}
    className={
      isRefreshingStatus
        ? "animate-spin"
        : ""
    }
  />
</button>

<button
  type="button"
  role="switch"
    aria-checked={darkMode}
    aria-label={
      darkMode
        ? "Switch to light mode"
        : "Switch to dark mode"
    }
    title={
      darkMode
        ? "Switch to light mode"
        : "Switch to dark mode"
    }
    onClick={() =>
      setDarkMode(
        (previous: boolean) => !previous
      )
    }
    className={`absolute right-0 top-0 inline-flex h-8 w-[58px] items-center justify-between rounded-full border p-[3px] transition-colors duration-200 ${
      darkMode
        ? "border-white/[0.10] bg-[#17181C]"
        : "border-[#DADCE0] bg-[#F1F3F4]"
    }`}
  >
    <span
      aria-hidden="true"
      className={`absolute left-[3px] top-[3px] h-6 w-6 rounded-full shadow-[0_1px_3px_rgba(60,64,67,0.28)] transition-transform duration-200 ease-out ${
        darkMode
          ? "translate-x-[26px] bg-white"
          : "translate-x-0 bg-[#202124]"
      }`}
    />

    <Sun
      aria-hidden="true"
      size={13}
      strokeWidth={1.9}
      className={`relative z-10 ml-[5px] transition-colors ${
        darkMode
          ? "text-white/35"
          : "text-white"
      }`}
    />

    <Moon
      aria-hidden="true"
      size={13}
      strokeWidth={1.9}
      className={`relative z-10 mr-[5px] transition-colors ${
        darkMode
          ? "text-[#202124]"
          : "text-[#5F6368]"
      }`}
    />
  </button>

  <p
    className={`px-16 text-[13px] font-[650] tracking-[-0.015em] ${
      darkMode
        ? "text-white/88"
        : "text-[#3C4043]"
    }`}
  >
    Momentuhm.app
  </p>

        <h1 className="mt-4 text-[22px] font-[720] leading-tight tracking-[-0.042em]">
          {greetingWithName}
        </h1>

        <div
id="momentuhm-tour-progress-mobile"
className="mt-3 grid grid-cols-3 gap-2"
>
          {[
         {
          label: "Tasks",
          value: taskTabTotalCount,
          color: darkMode
            ? "#8AB4F8"
            : "#1A73E8",
        },
        {
          label: "Completed",
          value: taskTabCompletedCount,
          color: darkMode
            ? "#81C995"
            : "#188038",
        },
        {
          label: "Progress",
          value: `${completionPercent}%`,
          color: darkMode
            ? "#C58AF9"
            : "#8430CE",
        },
          ].map((metric) => (
            <div
              key={metric.label}
              className={`flex min-h-[62px] flex-col items-center justify-center rounded-[10px] border px-2 ${panelClass}`}
            >
              <p
                className="text-[20px] font-[700] leading-none tracking-[-0.04em]"
                style={{
                  color: metric.color,
                }}
              >
                {metric.value}
              </p>

              <p
                className={`mt-2 text-[9px] font-[650] uppercase tracking-[0.055em] ${mutedTextClass}`}
              >
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </header>

      <div
        id="Momentuhm-mobile-workspace-anchor"
        className="scroll-mt-4"
      />

      {workspaceMode === "tasks" ? (
        <>
          <section
            id="Momentuhm-mobile-task-list-anchor"
            aria-label="Today tasks"
            className={`mt-1 scroll-mt-4 overflow-hidden rounded-[12px] border ${panelClass}`}
          >
            <header
              className={`border-b px-3 py-3 ${dividerClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[18px] font-[700] leading-none tracking-[-0.032em]">
                    Today
                  </h2>

                  <p
                    className={`mt-1.5 text-[10.5px] font-[500] ${mutedTextClass}`}
                  >
                    Your active tasks
                  </p>
                </div>

                <label className="relative shrink-0">
                  <span className="sr-only">
                    Sort mobile tasks
                  </span>

                  <select
                    value={sortMode}
                    onChange={(event) => {
                      setSortMode(
                        event.target
                          .value as SortMode
                      );

                      anchorTaskListSoon();
                    }}
                    className={`h-8 appearance-none rounded-[7px] border pl-2.5 pr-7 text-[10px] font-[600] outline-none ${
                      darkMode
                        ? "border-white/[0.10] bg-[#17181C] text-white/72"
                        : "border-[#DADCE0] bg-white text-[#3C4043]"
                    }`}
                  >
                    <option value="date">
                      Sort: Date
                    </option>

                    <option value="priority">
                      Sort: Priority
                    </option>
                  </select>

                  <ChevronDown
                    size={12}
                    className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${mutedTextClass}`}
                  />
                </label>
              </div>

              <div
                className={`mt-3 grid grid-cols-3 rounded-[9px] border p-[3px] ${
                  darkMode
                    ? "border-white/[0.08] bg-white/[0.035]"
                    : "border-[#DADCE0] bg-[#F8F9FA]"
                }`}
              >
                {[
                  {
                    value:
                      "category" as MobileGroupMode,
                    label: "Category",
                  },
                  {
                    value:
                      "priority" as MobileGroupMode,
                    label: "Priority",
                  },
                  {
                    value:
                      "date" as MobileGroupMode,
                    label: "Due",
                  },
                ].map((option) => {
                  const isActive =
                    groupMode === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        changeGroupMode(
                          option.value
                        )
                      }
                      aria-pressed={isActive}
                      className={`h-8 rounded-[7px] text-[10px] font-[620] transition active:scale-[0.98] ${
                        isActive
                          ? darkMode
                            ? "bg-[#303134] text-[#F1F3F4] shadow-[0_1px_2px_rgba(0,0,0,0.28)]"
                            : "bg-white text-[#202124] shadow-[0_1px_2px_rgba(60,64,67,0.18)]"
                          : darkMode
                          ? "text-white/44 hover:text-white/72"
                          : "text-[#5F6368] hover:text-[#202124]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </header>

            <div
              className={`p-2 ${
                darkMode
                  ? "bg-[#111216]"
                  : "bg-[#F8F9FA]"
              }`}
            >
              {groupedTasks.length === 0 ? (
                <div
                  className={`rounded-[9px] border border-dashed px-5 py-10 text-center text-[12px] font-[500] ${
                    darkMode
                      ? "border-white/[0.10] text-white/38"
                      : "border-[#DADCE0] text-[#5F6368]"
                  }`}
                >
                  No active tasks yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {groupedTasks.map(
                    (group) => (
                      <section
                        key={group.key}
                        aria-label={group.title}
                        className={`overflow-hidden rounded-[9px] border ${panelClass}`}
                      >
                        <header
                          className={`flex min-h-[32px] items-center justify-between gap-3 border-b px-2.5 ${
                            darkMode
                              ? "border-white/[0.075] bg-white/[0.025]"
                              : "border-[#E8EAED] bg-[#F8F9FA]"
                          }`}
                        >
                          <h3
                            className={`truncate text-[10px] font-[650] ${
                              darkMode
                                ? "text-white/72"
                                : "text-[#3C4043]"
                            }`}
                          >
                            {group.title}
                          </h3>

                          <span
                            className={`text-[9px] font-[600] tabular-nums ${mutedTextClass}`}
                          >
                            {group.tasks.length}
                          </span>
                        </header>

                        <div>
                          {group.tasks.map(
                            (task: any) => {
                              const status =
                              getStatusMeta(task);
                            
                            const dateMetadata = task.dueDate
                              ? `Due ${formatDueDate(task.dueDate)}`
                              : task.suggestedDueDate
                              ? `Suggested ${formatDueDate(
                                  task.suggestedDueDate
                                )}`
                              : "";
                            
                            const metadata = [
                              groupMode !== "category"
                                ? task.category || "No category"
                                : "",
                              dateMetadata,
                            ]
                              .filter(Boolean)
                              .join(" · ");

                              return (
                                <motion.div
                                  key={task.id}
                                  data-testid="mobile-task-row"
                                  data-task-id={task.id}
                                  data-task-title={task.title}
                                  data-task-completed={String(Boolean(task.completed))}
                                  layout="position"
                                  initial={{
                                    opacity: 0,
                                    y: 4,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    y: 0,
                                  }}
                                  transition={{
                                    duration: 0.18,
                                    ease: [
                                      0.16, 1, 0.3,
                                      1,
                                    ],
                                  }}
                                  className={`grid min-h-[54px] grid-cols-[30px_minmax(0,1fr)_auto] items-start gap-1.5 border-b px-2.5 py-2.5 last:border-b-0 ${dividerClass}`}
                                >
                                  <button
                                    type="button"
                                    data-testid="mobile-complete-task-button"
                                    data-task-id={task.id}
                                    data-task-title={task.title}
                                    onClick={(
                                      event
                                    ) =>
                                      toggleTaskById(
                                        task.id,
                                        event
                                      )
                                    }
                                    aria-label={`Complete ${task.title}`}
                                    className="flex h-8 w-8 -translate-x-1 -translate-y-1 items-center justify-center rounded-full transition active:scale-95"
                                  >
                                    <span
                                      aria-hidden="true"
                                      className={`h-[15px] w-[15px] rounded-[3px] border ${
                                        darkMode
                                          ? "border-white/38"
                                          : "border-[#80868B]"
                                      }`}
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openTask(
                                        task
                                      )
                                    }
                                    className="min-w-0 text-left"
                                  >
                                    <p
                                      className={`line-clamp-2 text-[12px] font-[560] leading-[16px] tracking-[-0.012em] ${
                                        darkMode
                                          ? "text-[#F1F3F4]"
                                          : "text-[#202124]"
                                      }`}
                                    >
                                      {
                                        task.title
                                      }
                                    </p>

                                    {metadata && (
                                      <p
                                        className={`mt-1 truncate text-[9.5px] font-[500] ${mutedTextClass}`}
                                      >
                                        {metadata}
                                      </p>
                                    )}
                                  </button>

                                  <span
                                    className={`mt-0.5 whitespace-nowrap rounded-[5px] border px-2 py-1 text-[8.5px] font-[650] leading-none ${status.className}`}
                                  >
                                    {status.label}
                                  </span>
                                </motion.div>
                              );
                            }
                          )}
                        </div>
                      </section>
                    )
                  )}
                </div>
              )}
            </div>
          </section>

          <section
            id="mobile-quick-capture"
            aria-label="Add a task"
            className={`mt-3 scroll-mt-24 overflow-hidden rounded-[12px] border ${panelClass}`}
          >
            <button
              type="button"
              onClick={() =>
                setIsCaptureOpen(
                  (previous) =>
                    !previous
                )
              }
              aria-expanded={isCaptureOpen}
              className="flex min-h-[54px] w-full items-center justify-between gap-4 px-3 text-left"
            >
              <div className="min-w-0">
                <p className="text-[12px] font-[650]">
                  Add a task
                </p>

                <p
                  className={`mt-1 text-[9.5px] font-[500] ${mutedTextClass}`}
                >
                  Capture something without
                  leaving Today.
                </p>
              </div>

              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                  darkMode
                    ? "bg-white/[0.06] text-white/65"
                    : "bg-[#F1F3F4] text-[#5F6368]"
                } ${
                  isCaptureOpen
                    ? "rotate-45"
                    : ""
                }`}
              >
                <Plus
                  size={17}
                  strokeWidth={1.8}
                />
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isCaptureOpen && (
                <motion.form
                  initial={{
                    opacity: 0,
                    y: -6,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -4,
                  }}
                  transition={{
                    duration: 0.16,
                  }}
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitTask();
                  }}
                  className={`min-w-0 max-w-full overflow-hidden border-t p-3 ${dividerClass}`}
                >
                 <div
  className={`group h-10 w-full min-w-0 overflow-hidden rounded-[10px] border transition-all duration-150 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/15 ${
    darkMode
      ? "border-white/[0.12] bg-white/[0.035]"
      : "border-[#DADCE0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
  }`}
>
  <input
    data-testid="mobile-task-input"
    autoFocus
    value={newTask}
    onChange={(event) =>
      setNewTask(
        event.target.value
      )
    }
    placeholder="What needs to get done?"
    className={`h-[53.333px] w-[133.333%] origin-left -translate-y-[8px] scale-75 border-0 bg-transparent px-4 py-0 text-[16px] font-[560] leading-[53.333px] outline-none ${
      darkMode
        ? "text-white placeholder:text-white/30"
        : "text-[#202124] placeholder:text-[#8A9099]"
    }`}
  />
</div>

<div
  className={`group mt-2 h-10 w-full min-w-0 overflow-hidden rounded-[10px] border transition-all duration-150 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/15 ${
    darkMode
      ? "border-white/[0.12] bg-white/[0.035]"
      : "border-[#DADCE0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
  }`}
>
  <input
    value={newTaskWhy}
    onChange={(event) =>
      setNewTaskWhy(
        event.target.value
      )
    }
    placeholder="Optional context"
    className={`h-[53.333px] w-[133.333%] origin-left -translate-y-[8px] scale-75 border-0 bg-transparent px-4 py-0 text-[16px] font-[520] leading-[53.333px] outline-none ${
      darkMode
        ? "text-white placeholder:text-white/30"
        : "text-[#202124] placeholder:text-[#8A9099]"
    }`}
  />
</div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setIsExtractModalOpen(
                          true
                        )
                      }
                      className={`h-9 rounded-[8px] border px-3 text-[10px] font-[600] ${
                        darkMode
                          ? "border-white/[0.10] text-white/58"
                          : "border-[#DADCE0] text-[#5F6368]"
                      }`}
                    >
                      Extract from text
                    </button>

                    <button
                      type="submit"
                      data-testid="mobile-add-task-button"
                      disabled={
                        !newTask.trim()
                      }
                      className="h-9 rounded-[8px] px-4 text-[10px] font-[650] text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
                      style={{
                        backgroundColor:
                          themeColor,
                      }}
                    >
                      Add task
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </section>

          {completedToday.length > 0 && (
          <CompletedTodaySection
          sectionId="Momentuhm-mobile-completed-anchor"
          completedToday={
            completedToday
          }
          restoreCompletedTask={
            restoreCompletedTask
          }
          archiveCompletedToday={
            archiveCompletedToday
          }
          setSelectedTask={
            setSelectedTask
          }
          setIsEditModalOpen={
            setIsEditModalOpen
          }
          darkMode={darkMode}
          border={border}
        />
          )}
        </>
      ) : (
        <section
id="momentuhm-tour-focus-mobile"
aria-label="Focus tasks"
className={`mt-1 overflow-hidden rounded-[12px] border ${panelClass}`}
>
          <header
            className={`flex items-start justify-between gap-3 border-b px-3 py-3 ${dividerClass}`}
          >
            <div>
              <h2 className="text-[18px] font-[700] leading-none tracking-[-0.032em]">
                Focus
              </h2>

              <p
                className={`mt-1.5 text-[10.5px] font-[500] ${mutedTextClass}`}
              >
                Work through what matters now.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setWorkspaceMode("tasks")
              }
              className={`h-8 shrink-0 rounded-[8px] border px-3 text-[10px] font-[600] ${
                darkMode
                  ? "border-white/[0.10] text-white/58"
                  : "border-[#DADCE0] text-[#5F6368]"
              }`}
            >
              Back to Today
            </button>
          </header>

          <div
            className={`p-2 ${
              darkMode
                ? "bg-[#111216]"
                : "bg-[#F8F9FA]"
            }`}
          >
            {focusTasks.length === 0 ? (
              <div
                className={`rounded-[9px] border border-dashed px-5 py-10 text-center ${
                  darkMode
                    ? "border-white/[0.10] text-white/38"
                    : "border-[#DADCE0] text-[#5F6368]"
                }`}
              >
                <Target
                  size={24}
                  strokeWidth={1.7}
                  className="mx-auto mb-3 opacity-60"
                />

                <p className="text-[12px] font-[600]">
                  Your focus stack is empty.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {focusTasks.map(
                  (
                    task: any,
                    index: number
                  ) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() =>
                        openTask(task)
                      }
                      className={`grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 rounded-[9px] border px-2.5 py-2.5 text-left ${panelClass}`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-[650] ${
                          darkMode
                            ? "bg-[#303134] text-[#F1F3F4]"
                            : "bg-[#E8F0FE] text-[#1967D2]"
                        }`}
                      >
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[12px] font-[560] leading-[16px]">
                          {task.title}
                        </p>

                        <p
                          className={`mt-1 truncate text-[9.5px] font-[500] ${mutedTextClass}`}
                        >
                          {task.category ||
                            "No category"}
                        </p>
                      </div>

                      <span
className={`whitespace-nowrap rounded-[5px] border px-2 py-1 text-[8.5px] font-[650] leading-none ${
  getStatusMeta(task).className
}`}
>
{getStatusMeta(task).label}
</span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function QuickTutorial({
  isOpen,
  stepIndex,
  setStepIndex,
  darkMode,
  onSkip,
  onFinish,
}: {
  isOpen: boolean;
  stepIndex: number;
  setStepIndex: React.Dispatch<
    React.SetStateAction<number>
  >;
  darkMode: boolean;
  onSkip: () => void;
  onFinish: () => void;
}) {
  const [
    spotlightRect,
    setSpotlightRect,
  ] = useState<TutorialSpotlightRect | null>(
    null
  );

  const [
    typedTaskTitle,
    setTypedTaskTitle,
  ] = useState("");

  const [
    showSmartSuggestions,
    setShowSmartSuggestions,
  ] = useState(false);

  const step =
    QUICK_TUTORIAL_STEPS[stepIndex] ||
    QUICK_TUTORIAL_STEPS[0];

  const isFirstStep = stepIndex === 0;

  const isLastStep =
    stepIndex ===
    QUICK_TUTORIAL_STEPS.length - 1;

    const shouldPlaceTutorialOnLeft =
step.id === "focus" ||
step.id === "help";

  const goToPreviousStep = () => {
    setStepIndex((currentStep) =>
      Math.max(0, currentStep - 1)
    );
  };

  const goToNextStep = () => {
    if (isLastStep) {
      onFinish();
      return;
    }

    setStepIndex((currentStep) =>
      Math.min(
        QUICK_TUTORIAL_STEPS.length - 1,
        currentStep + 1
      )
    );
  };

  /*
   * Simulate a task being typed and then analyzed.
   * This is fixed preview data and does not call AI.
   */
  useEffect(() => {
    if (
      !isOpen ||
      step.id !== "smart-assist"
    ) {
      setTypedTaskTitle("");
      setShowSmartSuggestions(false);
      return;
    }

    let currentCharacter = 0;
    let suggestionTimer:
      | number
      | undefined;

    setTypedTaskTitle("");
    setShowSmartSuggestions(false);

    const typingTimer =
      window.setInterval(() => {
        currentCharacter += 1;

        setTypedTaskTitle(
          TUTORIAL_SMART_TASK.slice(
            0,
            currentCharacter
          )
        );

        if (
          currentCharacter >=
          TUTORIAL_SMART_TASK.length
        ) {
          window.clearInterval(typingTimer);

          suggestionTimer =
            window.setTimeout(() => {
              setShowSmartSuggestions(true);
            }, 350);
        }
      }, 32);

    return () => {
      window.clearInterval(typingTimer);

      if (
        suggestionTimer !== undefined
      ) {
        window.clearTimeout(
          suggestionTimer
        );
      }
    };
  }, [isOpen, step.id]);

  /*
   * Keyboard navigation.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onSkip();
        return;
      }

      if (
        event.key === "ArrowLeft" &&
        !isFirstStep
      ) {
        goToPreviousStep();
        return;
      }

      if (event.key === "ArrowRight") {
        goToNextStep();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    isOpen,
    isFirstStep,
    isLastStep,
    stepIndex,
    onSkip,
    onFinish,
  ]);

  /*
   * Open the correct mobile workspace and spotlight
   * the real interface element connected to the step.
   */
  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === "undefined") {
      return;
    }

    let revealTimer:
      | number
      | undefined;

    let measureTimer:
      | number
      | undefined;

    const isMobile =
      window.matchMedia(
        "(max-width: 639px)"
      ).matches;

    const selector = isMobile
      ? step.mobileSelector
      : step.desktopSelector;

    const prepareMobileWorkspace = () => {
      if (!isMobile) return;

      if (step.id === "focus") {
        window.dispatchEvent(
          new Event(
            "momentuhm:open-focus"
          )
        );

        return;
      }

      if (step.id !== "welcome") {
        window.dispatchEvent(
          new Event(
            "momentuhm:open-tasks"
          )
        );
      }
    };

    const measureSpotlight = () => {
      if (!selector) {
        setSpotlightRect(null);
        return;
      }

      const target =
        document.querySelector<HTMLElement>(
          selector
        );

      if (!target) {
        setSpotlightRect(null);
        return;
      }

      const targetRect =
        target.getBoundingClientRect();

      if (
        targetRect.width <= 0 ||
        targetRect.height <= 0
      ) {
        setSpotlightRect(null);
        return;
      }

      const padding = isMobile ? 6 : 10;

      const left = Math.max(
        8,
        targetRect.left - padding
      );

      const top = Math.max(
        8,
        targetRect.top - padding
      );

      const right = Math.min(
        window.innerWidth - 8,
        targetRect.right + padding
      );

      const bottom = Math.min(
        window.innerHeight - 8,
        targetRect.bottom + padding
      );

      setSpotlightRect({
        top,
        left,
        width: Math.max(
          0,
          right - left
        ),
        height: Math.max(
          0,
          bottom - top
        ),
      });
    };

    const revealTarget = () => {
      prepareMobileWorkspace();

      revealTimer =
        window.setTimeout(() => {
          if (!selector) {
            setSpotlightRect(null);
            return;
          }

          const target =
            document.querySelector<HTMLElement>(
              selector
            );

          if (!target) {
            setSpotlightRect(null);
            return;
          }

          target.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });

          measureSpotlight();

          measureTimer =
            window.setTimeout(
              measureSpotlight,
              420
            );
        }, isMobile ? 120 : 40);
    };

    setSpotlightRect(null);
    revealTarget();

    window.addEventListener(
      "resize",
      measureSpotlight
    );

    window.addEventListener(
      "scroll",
      measureSpotlight,
      true
    );

    return () => {
      if (revealTimer !== undefined) {
        window.clearTimeout(
          revealTimer
        );
      }

      if (measureTimer !== undefined) {
        window.clearTimeout(
          measureTimer
        );
      }

      window.removeEventListener(
        "resize",
        measureSpotlight
      );

      window.removeEventListener(
        "scroll",
        measureSpotlight,
        true
      );
    };
  }, [
    isOpen,
    step.id,
    step.desktopSelector,
    step.mobileSelector,
  ]);

  if (!isOpen) return null;

  const surfaceClass = darkMode
    ? "border-white/[0.13] bg-[#202124] text-[#F1F3F4]"
    : "border-[#DADCE0] bg-white text-[#202124]";

  const panelClass = darkMode
    ? "border-white/[0.10] bg-white/[0.035]"
    : "border-[#DADCE0] bg-[#F8F9FA]";

  const elevatedPanelClass = darkMode
    ? "border-white/[0.11] bg-[#17181C]"
    : "border-[#DADCE0] bg-white";

  const mutedTextClass = darkMode
    ? "text-white/48"
    : "text-[#5F6368]";

  const secondaryTextClass = darkMode
    ? "text-white/68"
    : "text-[#3C4043]";

  const previewBadgeClass = darkMode
    ? "border-white/[0.10] bg-white/[0.05] text-white/55"
    : "border-[#DADCE0] bg-[#F1F3F4] text-[#5F6368]";

    const renderStepIcon = () => {
      if (
        step.id === "smart-assist" ||
        step.id === "clipboard" ||
        step.id === "extract" ||
        step.id === "focus" ||
        step.id ===
          "daily-intelligence" ||
        step.id === "insights"
      ) {
        return (
          <Sparkles
            size={18}
            strokeWidth={1.8}
          />
        );
      }
    
      if (step.id === "control") {
        return (
          <PencilLine
            size={18}
            strokeWidth={1.8}
          />
        );
      }
    
      if (step.id === "help") {
        return (
          <HelpCircle
            size={18}
            strokeWidth={1.8}
          />
        );
      }
    
      return (
        <Lightbulb
          size={18}
          strokeWidth={1.8}
        />
      );
    };

  const renderStepDemo = () => {
    switch (step.id) {
      case "welcome":
        return (
          <div
            className={`rounded-[14px] border p-4 ${panelClass}`}
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                {
                  label: "Capture",
                  description:
                    "Add tasks naturally",
                  icon: Plus,
                },
                {
                  label: "Clarify",
                  description:
                    "Get AI suggestions",
                  icon: Sparkles,
                },
                {
                  label: "Focus",
                  description:
                    "Choose next moves",
                  icon: Target,
                },
                {
                  label: "Complete",
                  description:
                    "Track progress",
                  icon: Check,
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.label}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index * 0.08,
                    }}
                    className={`rounded-[10px] border p-3 ${elevatedPanelClass}`}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.8}
                      className={
                        mutedTextClass
                      }
                    />

                    <p className="mt-3 text-[11px] font-[700]">
                      {item.label}
                    </p>

                    <p
                      className={`mt-1 text-[9.5px] font-[500] leading-4 ${mutedTextClass}`}
                    >
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            <div
              className={`mt-3 flex items-start gap-3 rounded-[10px] border px-3 py-3 ${elevatedPanelClass}`}
            >
              <Sparkles
                size={16}
                strokeWidth={1.8}
                className="mt-0.5 shrink-0"
              />

              <p
                className={`text-[11px] font-[500] leading-5 ${secondaryTextClass}`}
              >
                Momentuhm helps at each stage,
                while keeping every decision
                editable.
              </p>
            </div>
          </div>
        );

      case "smart-assist":
        return (
          <div
            className={`overflow-hidden rounded-[14px] border ${elevatedPanelClass}`}
          >
            <div
              className={`flex items-center justify-between border-b px-4 py-3 ${
                darkMode
                  ? "border-white/[0.08]"
                  : "border-[#E8EAED]"
              }`}
            >
              <div>
                <p className="text-[11px] font-[700]">
                  New task
                </p>

                <p
                  className={`mt-0.5 text-[9.5px] font-[500] ${mutedTextClass}`}
                >
                  AI task assistance
                </p>
              </div>

              <span
                className={`rounded-full border px-2 py-1 text-[8.5px] font-[700] uppercase tracking-[0.08em] ${previewBadgeClass}`}
              >
                Preview
              </span>
            </div>

            <div className="p-4">
              <div
                className={`flex min-h-[50px] items-center gap-3 rounded-[10px] border px-3 ${panelClass}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${previewBadgeClass}`}
                >
                  <Plus
                    size={15}
                    strokeWidth={1.8}
                  />
                </span>

                <p
                  className={`min-w-0 text-[12px] font-[550] ${secondaryTextClass}`}
                >
                  {typedTaskTitle}

                  {!showSmartSuggestions && (
                    <motion.span
                      animate={{
                        opacity: [1, 0],
                      }}
                      transition={{
                        duration: 0.65,
                        repeat: Infinity,
                      }}
                      className="ml-0.5"
                    >
                      |
                    </motion.span>
                  )}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {!showSmartSuggestions ? (
                  <motion.div
                    key="analyzing"
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    className={`mt-3 flex items-center gap-2 rounded-[9px] border px-3 py-2.5 ${panelClass}`}
                  >
                    <Sparkles
                      size={13}
                      strokeWidth={1.8}
                      className="animate-pulse"
                    />

                    <p
                      className={`text-[10px] font-[600] ${mutedTextClass}`}
                    >
                      Momentuhm is organizing
                      this task…
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="suggestions"
                    initial={{
                      opacity: 0,
                      y: 6,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="mt-3"
                  >
                    <div className="flex flex-wrap gap-2">
                      {[
                        "High priority",
                        "Due tomorrow",
                        "Major Projects",
                      ].map(
                        (
                          suggestion,
                          index
                        ) => (
                          <motion.span
                            key={
                              suggestion
                            }
                            initial={{
                              opacity: 0,
                              scale: 0.94,
                            }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                            }}
                            transition={{
                              delay:
                                index *
                                0.09,
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-[7px] border px-2.5 py-1.5 text-[9.5px] font-[650] ${previewBadgeClass}`}
                          >
                            <Sparkles
                              size={10}
                              strokeWidth={1.8}
                              className="opacity-60"
                            />

                            {suggestion}
                          </motion.span>
                        )
                      )}
                    </div>

                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: 0.3,
                      }}
                      className={`mt-3 rounded-[10px] border px-3 py-3 ${panelClass}`}
                    >
                      <p
                        className={`text-[8.5px] font-[750] uppercase tracking-[0.11em] ${mutedTextClass}`}
                      >
                        Why it matters
                      </p>

                      <p
                        className={`mt-1.5 text-[10.5px] font-[550] leading-4 ${secondaryTextClass}`}
                      >
                        Completing this early keeps
                        the client decision from
                        being blocked.
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );

      case "clipboard":
        return (
          <div
            className={`overflow-hidden rounded-[14px] border shadow-[0_14px_40px_rgba(0,0,0,0.14)] ${elevatedPanelClass}`}
          >
            <div
              className={`flex items-start justify-between gap-4 border-b px-4 py-4 ${
                darkMode
                  ? "border-white/[0.08]"
                  : "border-[#E8EAED]"
              }`}
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border ${previewBadgeClass}`}
                >
                  <Sparkles
                    size={15}
                    strokeWidth={1.8}
                  />
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-[8.5px] font-[750] uppercase tracking-[0.12em] ${mutedTextClass}`}
                  >
                    Clipboard Assist
                  </p>

                  <p className="mt-1 text-[15px] font-[720] tracking-[-0.025em]">
                    3 possible tasks found
                  </p>

                  <p
                    className={`mt-1 text-[9.5px] font-[500] ${mutedTextClass}`}
                  >
                    Review before anything is added.
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full border px-2 py-1 text-[8px] font-[700] uppercase tracking-[0.08em] ${previewBadgeClass}`}
              >
                Demo
              </span>
            </div>

            <div
              className={`border-b px-4 py-3 ${
                darkMode
                  ? "border-white/[0.08] bg-white/[0.02]"
                  : "border-[#E8EAED] bg-[#F8F9FA]"
              }`}
            >
              <p
                className={`text-[8.5px] font-[700] uppercase tracking-[0.1em] ${mutedTextClass}`}
              >
                Copied text
              </p>

              <p
                className={`mt-1.5 line-clamp-2 text-[9.5px] font-[500] leading-4 ${secondaryTextClass}`}
              >
                {TUTORIAL_CLIPBOARD_TEXT}
              </p>
            </div>

            <div>
              {TUTORIAL_CLIPBOARD_TASKS.map(
                (task, index) => (
                  <motion.div
                    key={task.title}
                    initial={{
                      opacity: 0,
                      x: -8,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay:
                        0.08 +
                        index * 0.08,
                    }}
                    className={`flex items-start gap-3 border-b px-4 py-3 last:border-b-0 ${
                      darkMode
                        ? "border-white/[0.08]"
                        : "border-[#E8EAED]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] border ${
                        darkMode
                          ? "border-white bg-white text-[#202124]"
                          : "border-[#202124] bg-[#202124] text-white"
                      }`}
                    >
                      <Check
                        size={11}
                        strokeWidth={2.4}
                      />
                    </span>

                    <div className="min-w-0">
                      <p
                        className={`text-[10.5px] font-[650] leading-4 ${secondaryTextClass}`}
                      >
                        {task.title}
                      </p>

                      <p
                        className={`mt-1 text-[8.5px] font-[550] ${mutedTextClass}`}
                      >
                        {task.meta}
                      </p>
                    </div>
                  </motion.div>
                )
              )}
            </div>

            <div
              className={`flex items-center justify-between gap-3 border-t px-4 py-3 ${
                darkMode
                  ? "border-white/[0.08] bg-white/[0.02]"
                  : "border-[#E8EAED] bg-[#F8F9FA]"
              }`}
            >
              <p
                className={`text-[8.5px] font-[500] ${mutedTextClass}`}
              >
                3 of 3 selected
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled
                  className={`h-8 rounded-[7px] border px-3 text-[9px] font-[650] ${previewBadgeClass}`}
                >
                  Dismiss
                </button>

                <button
                  type="button"
                  disabled
                  className={`h-8 rounded-[7px] px-3 text-[9px] font-[700] ${
                    darkMode
                      ? "bg-white text-[#202124]"
                      : "bg-[#202124] text-white"
                  }`}
                >
                  Add selected (3)
                </button>
              </div>
            </div>
          </div>
        );

      case "extract":
        return (
          <div
            className={`rounded-[14px] border p-3 sm:p-4 ${panelClass}`}
          >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_30px_minmax(0,1.1fr)] sm:items-center">
              <div
                className={`rounded-[11px] border p-3 ${elevatedPanelClass}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-[700]">
                    Meeting notes
                  </p>

                  <span
                    className={`rounded-full border px-2 py-1 text-[7.5px] font-[700] uppercase tracking-[0.08em] ${previewBadgeClass}`}
                  >
                    Source
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {TUTORIAL_EXTRACT_SOURCE_LINES.map(
                    (line) => (
                      <div
                        key={line}
                        className={`flex items-start gap-2 text-[9.5px] font-[500] leading-4 ${secondaryTextClass}`}
                      >
                        <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-current opacity-45" />

                        <span>{line}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="hidden items-center justify-center sm:flex">
                <ChevronRight
                  size={18}
                  strokeWidth={1.8}
                  className={
                    mutedTextClass
                  }
                />
              </div>

              <div className="space-y-2">
                {TUTORIAL_EXTRACTED_TASKS.map(
                  (task, index) => (
                    <motion.div
                      key={task.title}
                      initial={{
                        opacity: 0,
                        x: 8,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        delay:
                          index * 0.1,
                      }}
                      className={`flex items-start gap-2.5 rounded-[9px] border px-3 py-2.5 ${elevatedPanelClass}`}
                    >
                      <span
                        className={`mt-0.5 flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full ${
                          darkMode
                            ? "bg-white text-[#202124]"
                            : "bg-[#202124] text-white"
                        }`}
                      >
                        <Check
                          size={10}
                          strokeWidth={2.3}
                        />
                      </span>

                      <div className="min-w-0">
                        <p
                          className={`text-[9.5px] font-[650] leading-4 ${secondaryTextClass}`}
                        >
                          {task.title}
                        </p>

                        <p
                          className={`mt-0.5 text-[8px] font-[550] ${mutedTextClass}`}
                        >
                          {task.meta}
                        </p>
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            </div>

            <div
              className={`mt-3 flex items-center gap-2 rounded-[9px] border px-3 py-2.5 ${elevatedPanelClass}`}
            >
              <Sparkles
                size={13}
                strokeWidth={1.8}
              />

              <p
                className={`text-[9px] font-[550] leading-4 ${mutedTextClass}`}
              >
                Nothing is added until the user
                reviews and confirms the extracted
                tasks.
              </p>
            </div>
          </div>
        );

      case "focus":
        return (
          <div
            className={`overflow-hidden rounded-[14px] border ${elevatedPanelClass}`}
          >
            <div
              className={`flex items-center justify-between border-b px-4 py-3 ${
                darkMode
                  ? "border-white/[0.08]"
                  : "border-[#E8EAED]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Target
                  size={15}
                  strokeWidth={1.8}
                />

                <div>
                  <p className="text-[11px] font-[700]">
                    AI Focus stack
                  </p>

                  <p
                    className={`mt-0.5 text-[8.5px] font-[500] ${mutedTextClass}`}
                  >
                    Strongest next actions
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full border px-2 py-1 text-[8px] font-[700] uppercase tracking-[0.08em] ${previewBadgeClass}`}
              >
                AI Mode
              </span>
            </div>

            <div className="p-3">
              {TUTORIAL_FOCUS_TASKS.map(
                (task, index) => (
                  <motion.div
                    key={task.title}
                    initial={{
                      opacity: 0,
                      y: 7,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index * 0.1,
                    }}
                    className={`mb-2 grid grid-cols-[28px_minmax(0,1fr)] gap-2 rounded-[10px] border px-3 py-3 last:mb-0 ${panelClass}`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-[700] ${
                        darkMode
                          ? "bg-white text-[#202124]"
                          : "bg-[#202124] text-white"
                      }`}
                    >
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <p
                        className={`text-[10.5px] font-[650] leading-4 ${secondaryTextClass}`}
                      >
                        {task.title}
                      </p>

                      <p
                        className={`mt-1 text-[8.5px] font-[550] leading-4 ${mutedTextClass}`}
                      >
                        {task.reason}
                      </p>
                    </div>
                  </motion.div>
                )
              )}
            </div>

            <div
              className={`border-t px-4 py-3 ${
                darkMode
                  ? "border-white/[0.08] bg-white/[0.02]"
                  : "border-[#E8EAED] bg-[#F8F9FA]"
              }`}
            >
              <p
                className={`text-[9px] font-[550] leading-4 ${mutedTextClass}`}
              >
                Momentuhm considers priority,
                deadlines, dependencies, and impact.
                The Focus stack can still be changed
                manually.
              </p>
            </div>
          </div>
        );

      case "daily-intelligence":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Tasks",
                  value: "12",
                },
                {
                  label: "Completed",
                  value: "5",
                },
                {
                  label: "Progress",
                  value: "42%",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className={`rounded-[10px] border px-2 py-3 text-center ${elevatedPanelClass}`}
                >
                  <p className="text-[17px] font-[720] leading-none">
                    {metric.value}
                  </p>

                  <p
                    className={`mt-2 text-[7.5px] font-[700] uppercase tracking-[0.06em] ${mutedTextClass}`}
                  >
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>

            <div
              className={`rounded-[12px] border p-3 ${elevatedPanelClass}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border ${previewBadgeClass}`}
                >
                  <Sunrise
                    size={14}
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <p
                    className={`text-[8px] font-[750] uppercase tracking-[0.1em] ${mutedTextClass}`}
                  >
                    Morning brief
                  </p>

                  <p
                    className={`mt-1.5 text-[10px] font-[600] leading-4 ${secondaryTextClass}`}
                  >
                    Start with the client budget.
                    It has the clearest deadline and
                    external dependency.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div
                className={`rounded-[11px] border p-3 ${panelClass}`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={13}
                    strokeWidth={1.8}
                  />

                  <p
                    className={`text-[8px] font-[750] uppercase tracking-[0.09em] ${mutedTextClass}`}
                  >
                    Progress insight
                  </p>
                </div>

                <p
                  className={`mt-2 text-[10px] font-[650] ${secondaryTextClass}`}
                >
                  Strong momentum. Keep moving.
                </p>
              </div>

              <div
                className={`rounded-[11px] border p-3 ${panelClass}`}
              >
                <div className="flex items-center gap-2">
                  <Clock3
                    size={13}
                    strokeWidth={1.8}
                  />

                  <p
                    className={`text-[8px] font-[750] uppercase tracking-[0.09em] ${mutedTextClass}`}
                  >
                    Time awareness
                  </p>
                </div>

                <p
                  className={`mt-2 text-[10px] font-[650] ${secondaryTextClass}`}
                >
                  4h 20m left in your day
                </p>
              </div>
            </div>
          </div>
        );

      case "control":
        return (
          <div
            className={`overflow-hidden rounded-[14px] border ${elevatedPanelClass}`}
          >
            <div
              className={`border-b px-4 py-3 ${
                darkMode
                  ? "border-white/[0.08]"
                  : "border-[#E8EAED]"
              }`}
            >
              <p
                className={`text-[8px] font-[750] uppercase tracking-[0.11em] ${mutedTextClass}`}
              >
                Example task
              </p>

              <p className="mt-1.5 text-[13px] font-[700] tracking-[-0.02em]">
                Prepare the quarterly client review
              </p>
            </div>

            <div>
              {TUTORIAL_CONTROL_FIELDS.map(
                (field) => (
                  <div
                    key={field.label}
                    className={`grid grid-cols-[96px_minmax(0,1fr)_36px] items-center gap-2 border-b px-4 py-2.5 last:border-b-0 ${
                      darkMode
                        ? "border-white/[0.08]"
                        : "border-[#E8EAED]"
                    }`}
                  >
                    <p
                      className={`text-[8.5px] font-[600] ${mutedTextClass}`}
                    >
                      {field.label}
                    </p>

                    <p
                      className={`truncate text-[9.5px] font-[650] ${secondaryTextClass}`}
                    >
                      {field.value}
                    </p>

                    <span
                      className={`text-right text-[8px] font-[700] ${mutedTextClass}`}
                    >
                      Edit
                    </span>
                  </div>
                )
              )}
            </div>

            <div
              className={`flex items-start gap-3 border-t px-4 py-3 ${
                darkMode
                  ? "border-white/[0.08] bg-white/[0.02]"
                  : "border-[#E8EAED] bg-[#F8F9FA]"
              }`}
            >
              <PencilLine
                size={14}
                strokeWidth={1.8}
                className="mt-0.5 shrink-0"
              />

              <p
                className={`text-[9px] font-[550] leading-4 ${mutedTextClass}`}
              >
                AI organizes the first draft. The
                user makes the final decision.
              </p>
            </div>
          </div>
        );


        case "insights":
return (
  <div className="space-y-3">
    {/* Sample-data notice */}
    <div
      className={`flex items-start justify-between gap-4 rounded-[11px] border px-3.5 py-3 ${panelClass}`}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border ${previewBadgeClass}`}
        >
          <TrendingUp
            size={14}
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-[700]">
            Execution overview
          </p>

          <p
            className={`mt-1 text-[9px] font-[500] leading-4 ${mutedTextClass}`}
          >
            A preview of the patterns
            Momentuhm can identify after
            enough work is completed.
          </p>
        </div>
      </div>

      <span
        className={`shrink-0 rounded-full border px-2 py-1 text-[7.5px] font-[700] uppercase tracking-[0.08em] ${previewBadgeClass}`}
      >
        Sample data
      </span>
    </div>

    {/* Summary metrics */}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {TUTORIAL_INSIGHT_METRICS.map(
        (metric, index) => (
          <motion.div
            key={metric.label}
            initial={{
              opacity: 0,
              y: 6,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay:
                index * 0.07,
            }}
            className={`rounded-[10px] border px-3 py-3 ${elevatedPanelClass}`}
          >
            <p
              className={`truncate text-[7.5px] font-[700] uppercase tracking-[0.07em] ${mutedTextClass}`}
            >
              {metric.label}
            </p>

            <p className="mt-2 truncate text-[17px] font-[730] leading-none tracking-[-0.04em]">
              {metric.value}
            </p>
          </motion.div>
        )
      )}
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      {/* Category patterns */}
      <div
        className={`rounded-[12px] border p-3.5 ${elevatedPanelClass}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-[700]">
              Where effort goes
            </p>

            <p
              className={`mt-0.5 text-[8px] font-[500] ${mutedTextClass}`}
            >
              Completed work by category
            </p>
          </div>

          <LayoutGrid
            size={14}
            strokeWidth={1.7}
            className={
              mutedTextClass
            }
          />
        </div>

        <div className="mt-3 space-y-2.5">
          {TUTORIAL_INSIGHT_CATEGORIES.map(
            (
              category,
              index
            ) => (
              <motion.div
                key={
                  category.label
                }
                initial={{
                  opacity: 0,
                  x: -6,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay:
                    0.12 +
                    index * 0.07,
                }}
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span
                    className={`truncate text-[8.5px] font-[600] ${secondaryTextClass}`}
                  >
                    {
                      category.label
                    }
                  </span>

                  <span
                    className={`shrink-0 text-[8.5px] font-[700] ${secondaryTextClass}`}
                  >
                    {
                      category.percentage
                    }
                    %
                  </span>
                </div>

                <div
                  className={`h-[5px] overflow-hidden rounded-full ${
                    darkMode
                      ? "bg-white/[0.09]"
                      : "bg-[#E8EAED]"
                  }`}
                >
                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: `${category.percentage}%`,
                    }}
                    transition={{
                      duration: 0.65,
                      delay:
                        0.15 +
                        index *
                          0.07,
                      ease: [
                        0.16,
                        1,
                        0.3,
                        1,
                      ],
                    }}
                    className={`h-full rounded-full ${
                      darkMode
                        ? "bg-white/72"
                        : "bg-[#3C4043]"
                    }`}
                  />
                </div>
              </motion.div>
            )
          )}
        </div>
      </div>

      {/* Productivity timing */}
      <div
        className={`rounded-[12px] border p-3.5 ${elevatedPanelClass}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-[700]">
              Productivity rhythm
            </p>

            <p
              className={`mt-0.5 text-[8px] font-[500] ${mutedTextClass}`}
            >
              Completions by time of day
            </p>
          </div>

          <Clock3
            size={14}
            strokeWidth={1.7}
            className={
              mutedTextClass
            }
          />
        </div>

        <div className="mt-4 flex h-[82px] items-end justify-between gap-2">
          {TUTORIAL_INSIGHT_RHYTHM.map(
            (
              bucket,
              index
            ) => (
              <div
                key={bucket.label}
                className="flex min-w-0 flex-1 flex-col items-center justify-end"
              >
                <div className="flex h-[64px] w-full items-end justify-center">
                  <motion.div
                    initial={{
                      height: 0,
                    }}
                    animate={{
                      height:
                        bucket.height,
                    }}
                    transition={{
                      duration: 0.65,
                      delay:
                        0.1 +
                        index *
                          0.06,
                      ease: [
                        0.16,
                        1,
                        0.3,
                        1,
                      ],
                    }}
                    className={`w-full max-w-[16px] rounded-t-[4px] ${
                      index === 1
                        ? darkMode
                          ? "bg-violet-300"
                          : "bg-violet-600"
                        : darkMode
                        ? "bg-white/22"
                        : "bg-[#DADCE0]"
                    }`}
                  />
                </div>

                <span
                  className={`mt-1 text-[6.5px] font-[650] ${mutedTextClass}`}
                >
                  {bucket.label}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>

    {/* AI recommendation */}
    <motion.div
      initial={{
        opacity: 0,
        y: 6,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: 0.42,
      }}
      className={`rounded-[12px] border p-3.5 ${
        darkMode
          ? "border-violet-300/15 bg-violet-300/[0.065]"
          : "border-violet-200 bg-violet-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border ${
            darkMode
              ? "border-violet-300/15 bg-violet-300/[0.08] text-violet-200"
              : "border-violet-200 bg-white text-violet-700"
          }`}
        >
          <Sparkles
            size={14}
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0">
          <p
            className={`text-[8px] font-[750] uppercase tracking-[0.1em] ${
              darkMode
                ? "text-violet-200/60"
                : "text-violet-700/65"
            }`}
          >
            AI recommendation
          </p>

          <p
            className={`mt-1.5 text-[10px] font-[600] leading-4 ${
              darkMode
                ? "text-violet-100/90"
                : "text-violet-900"
            }`}
          >
            Protect late-morning time
            for Major Projects. That is
            where your strongest
            completion pattern appears.
          </p>
        </div>
      </div>
    </motion.div>
  </div>
);

      case "help":
        return (
          <div
            className={`rounded-[14px] border p-4 ${panelClass}`}
          >
            <div
              className={`rounded-[12px] border p-4 text-center ${elevatedPanelClass}`}
            >
              <div
                className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border ${previewBadgeClass}`}
              >
                <Check
                  size={18}
                  strokeWidth={2}
                />
              </div>

              <p className="mt-3 text-[13px] font-[700]">
                Tour complete
              </p>

              <p
className={`mx-auto mt-1.5 max-w-[340px] text-[9.5px] font-[500] leading-4 ${mutedTextClass}`}
>
You have seen task assistance,
Clipboard Assist, extraction, AI
Focus, daily intelligence,
editable suggestions, and
performance Insights.
</p>

              <div
                className={`mx-auto mt-4 inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[9.5px] font-[650] ${previewBadgeClass}`}
              >
                <HelpCircle
                  size={13}
                  strokeWidth={1.8}
                />

                How it works
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
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
        duration: 0.2,
      }}
      className="fixed inset-0 z-[260]"
    >
      {/* Dimmed backdrop and spotlight */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
      >
        {!spotlightRect && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
        )}

        {spotlightRect && (
          <motion.div
            initial={false}
            animate={{
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
            }}
            transition={{
              duration: 0.28,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="pointer-events-none absolute rounded-[16px] border-2 border-white"
            style={{
              boxShadow:
                "0 0 0 9999px rgba(0, 0, 0, 0.64), 0 12px 46px rgba(0, 0, 0, 0.22)",
            }}
          />
        )}
      </div>

      <motion.section
        key={step.id}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-tutorial-title"
        aria-describedby="quick-tutorial-description"
        initial={{
          opacity: 0,
          y: 14,
          scale: 0.985,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 8,
          scale: 0.99,
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 32,
          mass: 0.86,
        }}
        className={`absolute bottom-[88px] left-1/2 z-10 flex max-h-[calc(100vh-112px)] w-[calc(100%_-_24px)] max-w-[720px] -translate-x-1/2 flex-col overflow-hidden rounded-[18px] border shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:bottom-6 sm:max-h-[calc(100vh-48px)] sm:w-[calc(100vw-48px)] sm:translate-x-0 ${
          shouldPlaceTutorialOnLeft
            ? "sm:left-6 sm:right-auto"
            : "sm:left-auto sm:right-6"
        } ${surfaceClass}`}
      >
        {/* Header */}
        <header
          className={`flex shrink-0 items-center justify-between border-b px-5 py-3.5 ${
            darkMode
              ? "border-white/[0.09]"
              : "border-[#E8EAED]"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-[9px] font-[700] uppercase tracking-[0.12em] ${mutedTextClass}`}
            >
              {stepIndex + 1} of{" "}
              {QUICK_TUTORIAL_STEPS.length}
            </span>

            {stepIndex > 0 &&
              stepIndex <
                QUICK_TUTORIAL_STEPS.length -
                  1 && (
                <span
                  className={`rounded-full border px-2 py-1 text-[7.5px] font-[700] uppercase tracking-[0.08em] ${previewBadgeClass}`}
                >
                  Interactive preview
                </span>
              )}
          </div>

          <button
            type="button"
            onClick={onSkip}
            className={`text-[10px] font-[650] transition ${
              darkMode
                ? "text-white/48 hover:text-white"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            Skip tour
          </button>
        </header>

        {/* Scrollable tutorial body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-5 md:grid-cols-[210px_minmax(0,1fr)] md:items-start">
            <div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-[10px] border ${
                  darkMode
                    ? "border-white/[0.10] bg-white/[0.05] text-white/72"
                    : "border-[#DADCE0] bg-[#F1F3F4] text-[#3C4043]"
                }`}
              >
                {renderStepIcon()}
              </div>

              <p
                className={`mt-4 text-[9px] font-[700] uppercase tracking-[0.13em] ${mutedTextClass}`}
              >
                {step.eyebrow}
              </p>

              <h2
                id="quick-tutorial-title"
                className="mt-1.5 text-[21px] font-[740] leading-[27px] tracking-[-0.04em]"
              >
                {step.title}
              </h2>

              <p
                id="quick-tutorial-description"
                className={`mt-2 text-[11.5px] font-[500] leading-5 ${mutedTextClass}`}
              >
                {step.description}
              </p>
            </div>

            <div className="min-w-0">
              {renderStepDemo()}
            </div>
          </div>

          {/* Progress */}
          <div className="mt-5 flex gap-1.5">
            {QUICK_TUTORIAL_STEPS.map(
              (
                tutorialStep,
                index
              ) => (
                <span
                  key={tutorialStep.id}
                  aria-hidden="true"
                  className={`h-1.5 flex-1 rounded-full transition ${
                    index <= stepIndex
                      ? darkMode
                        ? "bg-white"
                        : "bg-[#202124]"
                      : darkMode
                      ? "bg-white/[0.12]"
                      : "bg-[#DADCE0]"
                  }`}
                />
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <footer
          className={`flex shrink-0 items-center justify-between gap-3 border-t px-5 py-3.5 ${
            darkMode
              ? "border-white/[0.09] bg-white/[0.025]"
              : "border-[#E8EAED] bg-[#F8F9FA]"
          }`}
        >
          <button
            type="button"
            onClick={goToPreviousStep}
            disabled={isFirstStep}
            className={`h-9 rounded-[8px] border px-3.5 text-[10px] font-[650] transition ${
              isFirstStep
                ? "invisible"
                : darkMode
                ? "border-white/[0.10] text-white/62 hover:bg-white/[0.06] hover:text-white"
                : "border-[#DADCE0] bg-white text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]"
            }`}
          >
            Back
          </button>

          <button
            type="button"
            autoFocus
            onClick={goToNextStep}
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-[8px] px-4 text-[10px] font-[700] transition active:scale-[0.98] ${
              darkMode
                ? "bg-white text-[#202124] hover:bg-white/90"
                : "bg-[#202124] text-white hover:bg-[#303134]"
            }`}
          >
            {isLastStep
              ? "Start using Momentuhm"
              : isFirstStep
              ? "Show me how"
              : "Next"}

            {!isLastStep && (
              <ChevronRight
                size={14}
                strokeWidth={1.9}
              />
            )}
          </button>
        </footer>
      </motion.section>
    </motion.div>
  );
}

function ClipboardAssistPrompt({
  text,
  darkMode,
  loading,
  error,
  extractedTasks = [],
  onClose,
  onAddAsIs,
  onToggleTask,
  onAddSelected,
  onAddAsSubtasks,
}: any) {
  const [
    parentTaskName,
    setParentTaskName,
  ] = useState("");

  const [
    showSubtaskComposer,
    setShowSubtaskComposer,
  ] = useState(false);

  const preview = normalizeClipboardText(text);

  const clippedPreview =
    preview.length > 360
      ? `${preview.slice(0, 360).trim()}...`
      : preview;

  const selectedCount = extractedTasks.filter(
    (task: any) => task.selected
  ).length;

  const hasTasks = extractedTasks.length > 0;

  const panelBorder = darkMode
    ? "border-white/[0.12]"
    : "border-[#D4D4CF]";

  const rowBorder = darkMode
    ? "border-white/[0.08]"
    : "border-[#E8E9ED]";

  const panelSurface = darkMode
    ? "bg-[#171717] text-white"
    : "bg-white text-[#181818]";

  const secondarySurface = darkMode
    ? "bg-white/[0.035]"
    : "bg-[#FAFAFB]";

  const mutedText = darkMode
    ? "text-white/48"
    : "text-[#6B6F7B]";

  const getPriorityClass = (priority: string) => {
    if (priority === "High") {
      return darkMode
        ? "border-red-400/20 bg-red-400/10 text-red-300"
        : "border-red-200 bg-red-50 text-red-600";
    }

    if (priority === "Medium" || priority === "Med") {
      return darkMode
        ? "border-orange-400/20 bg-orange-400/10 text-orange-300"
        : "border-orange-200 bg-orange-50 text-orange-600";
    }

    return darkMode
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : "border-emerald-200 bg-emerald-50 text-emerald-600";
  };

  return (
    <motion.div
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
        duration: 0.18,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="pointer-events-none fixed inset-0 z-[193] flex items-center justify-center p-4 sm:p-6"
    >
      <motion.section
        role="dialog"
        aria-modal="false"
        aria-labelledby="clipboard-assist-title"
        initial={{
          opacity: 0,
          y: 16,
          scale: 0.985,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 10,
          scale: 0.99,
        }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 34,
          mass: 0.82,
        }}
        className={`pointer-events-auto flex max-h-[82vh] w-full max-w-[660px] flex-col overflow-hidden rounded-[16px] border shadow-[0_24px_80px_rgba(0,0,0,0.22)] ${panelBorder} ${panelSurface}`}
      >
        {/* Header */}
        <header
          className={`flex shrink-0 items-start justify-between gap-5 border-b px-5 py-5 sm:px-6 ${rowBorder}`}
        >
          <div className="flex min-w-0 items-start gap-3.5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] border ${
                darkMode
                  ? "border-white/[0.10] bg-white/[0.05] text-white"
                  : "border-[#DDDDE3] bg-[#F7F8FA] text-[#252933]"
              }`}
            >
              <Sparkles
                size={17}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p
                className={`text-[9px] font-[750] uppercase tracking-[0.14em] ${mutedText}`}
              >
                Clipboard Assist
              </p>

              <h2
                id="clipboard-assist-title"
                className={`mt-1 text-[20px] font-[750] leading-tight tracking-[-0.04em] ${
                  darkMode
                    ? "text-white"
                    : "text-[#17191F]"
                }`}
              >
                {loading
                  ? "Reading copied text"
                  : hasTasks
                  ? `${extractedTasks.length} possible task${
                      extractedTasks.length === 1 ? "" : "s"
                    } found`
                  : "Save copied text"}
              </h2>

              <p
                className={`mt-1.5 max-w-[510px] text-[12px] font-[500] leading-5 ${mutedText}`}
              >
                {loading
                  ? "Momentuhm is checking the copied content for useful action items."
                  : hasTasks
                  ? "Review the suggested tasks and select the ones you want to add."
                  : "No clear action items were found. You can still save the copied content as one task."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Clipboard Assist"
            title="Close"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border transition ${
              darkMode
                ? "border-white/[0.10] text-white/48 hover:bg-white/[0.06] hover:text-white"
                : "border-[#DDDDE3] text-[#6B6F7B] hover:bg-[#F4F5F7] hover:text-[#252933]"
            }`}
          >
            <X
              size={17}
              strokeWidth={1.7}
            />
          </button>
        </header>

        {/* Loading state */}
        {loading && (
          <section className="px-5 py-5 sm:px-6">
            <div
              className={`overflow-hidden rounded-[11px] border ${panelBorder} ${secondarySurface}`}
            >
              <div className="flex items-center gap-3 px-4 py-4">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border ${
                    darkMode
                      ? "border-white/[0.10] bg-white/[0.04]"
                      : "border-[#DDDDE3] bg-white"
                  }`}
                >
                  <Sparkles
                    size={14}
                    strokeWidth={1.7}
                    className={
                      darkMode
                        ? "text-white/60"
                        : "text-[#5F6572]"
                    }
                  />
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-[12px] font-[650] ${
                      darkMode
                        ? "text-white/82"
                        : "text-[#252933]"
                    }`}
                  >
                    Extracting possible tasks
                  </p>

                  <p
                    className={`mt-1 text-[11px] font-[500] ${mutedText}`}
                  >
                    This normally takes only a moment.
                  </p>
                </div>
              </div>

              <div
                className={`relative h-[2px] overflow-hidden ${
                  darkMode
                    ? "bg-white/[0.08]"
                    : "bg-black/[0.07]"
                }`}
              >
                <motion.div
                  className={`absolute inset-y-0 w-1/3 ${
                    darkMode
                      ? "bg-white"
                      : "bg-[#181818]"
                  }`}
                  initial={{
                    x: "-110%",
                  }}
                  animate={{
                    x: "330%",
                  }}
                  transition={{
                    duration: 1.15,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {/* Extracted tasks */}
        {!loading && hasTasks && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {extractedTasks.map((task: any) => {
              const priorityLabel =
                task.priority === "Medium" ||
                task.priority === "Med"
                  ? "Medium"
                  : task.priority;

              return (
                <motion.button
                  key={task.id}
                  type="button"
                  layout
                  aria-pressed={task.selected}
                  onClick={() => onToggleTask(task.id)}
                  initial={{
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -4,
                  }}
                  transition={{
                    duration: 0.18,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`flex w-full items-start gap-3 border-b px-5 py-4 text-left transition last:border-b-0 sm:px-6 ${
                    darkMode
                      ? "border-white/[0.08] hover:bg-white/[0.025]"
                      : "border-[#E8E9ED] hover:bg-[#FBFBFC]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border transition ${
                      task.selected
                        ? darkMode
                          ? "border-white bg-white text-[#181818]"
                          : "border-[#181818] bg-[#181818] text-white"
                        : darkMode
                        ? "border-white/38 text-transparent"
                        : "border-[#9297A1] text-transparent"
                    }`}
                  >
                    <Check
                      size={12}
                      strokeWidth={2.4}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[13px] font-[650] leading-5 tracking-[-0.015em] ${
                        darkMode
                          ? "text-white/90"
                          : "text-[#20232B]"
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-[6px] border px-2 py-1 text-[10px] font-[650] ${getPriorityClass(
                          task.priority
                        )}`}
                      >
                        {priorityLabel}
                      </span>

                      <span
                        className={`rounded-[6px] border px-2 py-1 text-[10px] font-[600] ${
                          darkMode
                            ? "border-white/[0.10] bg-white/[0.04] text-white/55"
                            : "border-[#DDDDE3] bg-[#F7F8FA] text-[#5F6572]"
                        }`}
                      >
                        {task.category || "No category"}
                      </span>

                      {task.suggestedDueDate && (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-1 text-[10px] font-[600] ${
                            darkMode
                              ? "border-white/[0.10] bg-white/[0.04] text-white/55"
                              : "border-[#DDDDE3] bg-[#F7F8FA] text-[#5F6572]"
                          }`}
                        >
                          <Calendar
                            size={11}
                            strokeWidth={1.7}
                          />

                          {formatDueDate(
                            task.suggestedDueDate
                          )}
                        </span>
                      )}

                      {hasFollowUpTag(task) && (
                        <span
                          className={`rounded-[6px] border px-2 py-1 text-[10px] font-[600] ${
                            darkMode
                              ? "border-white/[0.10] text-white/50"
                              : "border-[#DDDDE3] text-[#5F6572]"
                          }`}
                        >
                          Follow-up
                        </span>
                      )}
                    </div>

                    {task.reason && (
                      <p
                        className={`mt-2 line-clamp-2 text-[11px] font-[500] leading-4 ${mutedText}`}
                      >
                        {task.reason}
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Copied-text fallback */}
        {!loading && !hasTasks && (
          <section className="px-5 py-5 sm:px-6">
            <div
              className={`rounded-[11px] border ${panelBorder} ${secondarySurface}`}
            >
              <div
                className={`border-b px-4 py-3 text-[10px] font-[700] uppercase tracking-[0.12em] ${rowBorder} ${mutedText}`}
              >
                Copied text
              </div>

              <p
                className={`max-h-[150px] overflow-y-auto px-4 py-3 text-[12px] font-[500] leading-5 ${
                  darkMode
                    ? "text-white/68"
                    : "text-[#4F5562]"
                }`}
              >
                {clippedPreview}
              </p>
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <div className="px-5 pb-4 sm:px-6">
            <div
              className={`rounded-[9px] border px-3 py-2.5 text-[11px] font-[600] leading-4 ${
                darkMode
                  ? "border-red-400/20 bg-red-400/10 text-red-300"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {error}
            </div>
          </div>
        )}

        {/* Footer */}
       
       {/* Footer */}
<footer
  className={`shrink-0 border-t ${rowBorder} ${secondarySurface}`}
>
  {hasTasks &&
    showSubtaskComposer && (
      <div
        className={`border-b px-5 py-3.5 sm:px-6 ${rowBorder}`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="clipboard-parent-task-name"
              className={`mb-1.5 block text-[10px] font-[700] uppercase tracking-[0.08em] ${mutedText}`}
            >
              Parent task name
            </label>

            <input
              id="clipboard-parent-task-name"
              autoFocus
              value={
                parentTaskName
              }
              onChange={(
                event
              ) => {
                setParentTaskName(
                  event.target.value
                );
              }}
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                    "Enter" &&
                  parentTaskName.trim() &&
                  selectedCount > 0
                ) {
                  event.preventDefault();

                  onAddAsSubtasks(
                    parentTaskName
                  );
                }

                if (
                  event.key ===
                  "Escape"
                ) {
                  event.preventDefault();

                  setShowSubtaskComposer(
                    false
                  );
                }
              }}
              placeholder="For example: Prepare for All Hands"
              className={`h-10 w-full rounded-[8px] border px-3 text-[12px] font-[550] outline-none transition ${
                darkMode
                  ? "border-white/[0.14] bg-white/[0.04] text-white placeholder:text-white/30 focus:border-white/[0.30]"
                  : "border-[#C9CBD1] bg-white text-[#252933] placeholder:text-[#80868B] focus:border-[#8F939C]"
              }`}
            />
          </div>

          <button
            type="button"
            onClick={() =>
              onAddAsSubtasks(
                parentTaskName
              )
            }
            disabled={
              !parentTaskName.trim() ||
              selectedCount === 0
            }
            className={`mt-auto inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[8px] px-3.5 text-[11px] font-[700] transition ${
              !parentTaskName.trim() ||
              selectedCount === 0
                ? "cursor-not-allowed opacity-30"
                : darkMode
                ? "bg-white text-[#181818] hover:bg-white/90"
                : "bg-[#181818] text-white hover:bg-[#2A2A2A]"
            }`}
          >
            <ListChecks
              size={14}
              strokeWidth={1.9}
            />

            Create with subtasks

            <span className="opacity-55">
              ({selectedCount})
            </span>
          </button>
        </div>

        <p
          className={`mt-2 text-[10px] font-[500] ${mutedText}`}
        >
          The selected items will become
          subtasks instead of separate
          tasks.
        </p>
      </div>
    )}

  <div className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <p
      className={`text-[11px] font-[500] ${mutedText}`}
    >
      {loading
        ? "You can add the full copied text immediately."
        : hasTasks
        ? `${selectedCount} of ${extractedTasks.length} selected`
        : "Save the full content as one task."}
    </p>

    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className={`h-9 rounded-[8px] border px-3.5 text-[11px] font-[650] transition ${
          darkMode
            ? "border-white/[0.10] text-white/58 hover:bg-white/[0.06] hover:text-white"
            : "border-[#DDDDE3] bg-white text-[#5F6572] hover:bg-[#F4F5F7] hover:text-[#252933]"
        }`}
      >
        Dismiss
      </button>

      <button
        type="button"
        onClick={onAddAsIs}
        className={`h-9 rounded-[8px] border px-3.5 text-[11px] font-[650] transition ${
          darkMode
            ? "border-white/[0.12] bg-white/[0.05] text-white/72 hover:bg-white/[0.08] hover:text-white"
            : "border-[#CFCFC9] bg-white text-[#353A45] hover:bg-[#F4F5F7]"
        }`}
      >
        Add copied text
      </button>

      {hasTasks && (
        <>
          <button
            type="button"
            onClick={() =>
              setShowSubtaskComposer(
                (previous) =>
                  !previous
              )
            }
            disabled={
              selectedCount === 0
            }
            aria-expanded={
              showSubtaskComposer
            }
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border px-3.5 text-[11px] font-[700] transition ${
              selectedCount === 0
                ? "cursor-not-allowed opacity-30"
                : showSubtaskComposer
                ? darkMode
                  ? "border-violet-300/25 bg-violet-300/10 text-violet-200"
                  : "border-violet-200 bg-violet-50 text-violet-700"
                : darkMode
                ? "border-white/[0.12] text-white/68 hover:bg-white/[0.06]"
                : "border-[#CFCFC9] bg-white text-[#353A45] hover:bg-[#F4F5F7]"
            }`}
          >
            <ListChecks
              size={13}
              strokeWidth={1.9}
            />

            Group as subtasks
          </button>

          <button
            type="button"
            onClick={
              onAddSelected
            }
            disabled={
              selectedCount === 0
            }
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-[8px] px-3.5 text-[11px] font-[700] transition ${
              selectedCount === 0
                ? "cursor-not-allowed opacity-30"
                : darkMode
                ? "bg-white text-[#181818] hover:bg-white/90"
                : "bg-[#181818] text-white hover:bg-[#2A2A2A]"
            }`}
          >
            <Plus
              size={13}
              strokeWidth={2}
            />

            Add separately

            <span className="opacity-55">
              ({selectedCount})
            </span>
          </button>
        </>
      )}
    </div>
  </div>
</footer>

      </motion.section>
    </motion.div>
  );
}

function DueTasksReminderPopup({
  tasks,
  themeColor,
  darkMode,
  timeRemainingLabel,
  onClose,
  onViewAll,
  onOpenTask,
}: any) {
  const getPriorityMeta = (
    priority?: string
  ) => {
    if (priority === "High") {
      return {
        label: "High",
        dotClass: darkMode
          ? "bg-red-300"
          : "bg-red-500",
        textClass: darkMode
          ? "text-red-300"
          : "text-red-600",
      };
    }

    if (
      priority === "Medium" ||
      priority === "Med"
    ) {
      return {
        label: "Medium",
        dotClass: darkMode
          ? "bg-amber-300"
          : "bg-amber-500",
        textClass: darkMode
          ? "text-amber-300"
          : "text-amber-700",
      };
    }

    return {
      label: "Low",
      dotClass: darkMode
        ? "bg-emerald-300"
        : "bg-emerald-500",
      textClass: darkMode
        ? "text-emerald-300"
        : "text-emerald-700",
    };
  };

  const panelSurface = darkMode
    ? "border-white/[0.11] bg-[#17181C] text-[#F1F3F4]"
    : "border-[#DADCE0] bg-white text-[#202124]";

  const rowBorder = darkMode
    ? "border-white/[0.08]"
    : "border-[#E8EAED]";

  const secondarySurface = darkMode
    ? "bg-white/[0.025]"
    : "bg-[#F8F9FA]";

  const iconSurface = darkMode
    ? "border-white/[0.10] bg-white/[0.055] text-white/72"
    : "border-[#DADCE0] bg-[#F1F3F4] text-[#3C4043]";

  const mutedText = darkMode
    ? "text-white/48"
    : "text-[#5F6368]";

  const primaryTextColor =
    getAccessibleTextColor(themeColor);

  return (
    <motion.div
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
        duration: 0.18,
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={onClose}
      className="fixed inset-0 z-[194] flex items-center justify-center bg-black/30 p-3 backdrop-blur-[4px] sm:p-6"
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="due-reminder-title"
        initial={{
          opacity: 0,
          y: 14,
          scale: 0.985,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 10,
          scale: 0.99,
        }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 34,
          mass: 0.82,
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
        className={`relative flex max-h-[86vh] w-full max-w-[540px] flex-col overflow-hidden rounded-[18px] border shadow-[0_24px_80px_rgba(0,0,0,0.22)] ${panelSurface}`}
      >
        {/* Subtle theme accent */}
        <div
          aria-hidden="true"
          className="h-[3px] w-full shrink-0"
          style={{
            backgroundColor: themeColor,
          }}
        />

        {/* Header */}
        <header
          className={`flex shrink-0 items-start justify-between gap-4 border-b px-5 py-5 sm:px-6 ${rowBorder}`}
        >
          <div className="flex min-w-0 items-start gap-3.5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border ${iconSurface}`}
            >
              <Clock3
                size={18}
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <p
                className={`text-[9px] font-[700] uppercase tracking-[0.14em] ${mutedText}`}
              >
                Day reminder
              </p>

              <h2
                id="due-reminder-title"
                className="mt-1 text-[20px] font-[730] leading-tight tracking-[-0.04em]"
              >
                {timeRemainingLabel
                  ? `${timeRemainingLabel} in your day`
                  : "Time is running short"}
              </h2>

              <p
                className={`mt-1.5 text-[12px] font-[500] leading-5 ${mutedText}`}
              >
                These tasks are still due
                today.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close due-task reminder"
            title="Close"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border transition ${
              darkMode
                ? "border-white/[0.10] text-white/45 hover:bg-white/[0.06] hover:text-white"
                : "border-[#DADCE0] text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]"
            }`}
          >
            <X
              size={17}
              strokeWidth={1.7}
            />
          </button>
        </header>

        {/* Task list */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tasks.map((task: any) => {
            const priority =
              getPriorityMeta(
                task.priority
              );

            return (
              <button
                key={task.id}
                type="button"
                onClick={() =>
                  onOpenTask(task)
                }
                className={`grid w-full grid-cols-[10px_minmax(0,1fr)_auto_16px] items-center gap-3 border-b px-5 py-3.5 text-left transition last:border-b-0 sm:px-6 ${
                  darkMode
                    ? "border-white/[0.08] hover:bg-white/[0.035]"
                    : "border-[#E8EAED] hover:bg-[#F8F9FA]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 rounded-full ${priority.dotClass}`}
                />

                <div className="min-w-0">
                  <p
                    title={task.title}
                    className={`truncate text-[12.5px] font-[630] leading-5 tracking-[-0.012em] ${
                      darkMode
                        ? "text-white/88"
                        : "text-[#202124]"
                    }`}
                  >
                    {task.title}
                  </p>

                  <div
                    className={`mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] font-[520] ${mutedText}`}
                  >
                    <span className="truncate">
                      {task.category ||
                        "No category"}
                    </span>

                    <span
                      aria-hidden="true"
                      className="opacity-45"
                    >
                      •
                    </span>

                    <span
                      className={`shrink-0 ${priority.textClass}`}
                    >
                      {priority.label}
                    </span>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-[6px] border px-2 py-1 text-[9px] font-[650] ${
                    darkMode
                      ? "border-white/[0.10] bg-white/[0.045] text-white/58"
                      : "border-[#DADCE0] bg-[#F1F3F4] text-[#5F6368]"
                  }`}
                >
                  Today
                </span>

                <ChevronRight
                  size={14}
                  strokeWidth={1.7}
                  className={mutedText}
                />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <footer
          className={`flex shrink-0 items-center justify-between gap-4 border-t px-5 py-4 sm:px-6 ${rowBorder} ${secondarySurface}`}
        >
          <div className="min-w-0">
            <p
              className={`text-[11px] font-[650] ${
                darkMode
                  ? "text-white/70"
                  : "text-[#3C4043]"
              }`}
            >
              {tasks.length} task
              {tasks.length === 1
                ? ""
                : "s"}{" "}
              due today
            </p>

            <p
              className={`mt-0.5 truncate text-[10px] font-[500] ${mutedText}`}
            >
              Focus on the most important
              next step.
            </p>
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[9px] px-4 text-[11px] font-[700] shadow-[0_1px_2px_rgba(60,64,67,0.22)] transition hover:brightness-[0.96] active:scale-[0.98]"
            style={{
              backgroundColor:
                themeColor,
              color: primaryTextColor,
            }}
          >
            View tasks

            <ChevronRight
              size={14}
              strokeWidth={1.8}
            />
          </button>
        </footer>
      </motion.section>
    </motion.div>
  );
}

function ExtractTasksModal({
  extractInput,
  setExtractInput,
  extractLoading,
  extractError,
  extractedTasks,
  setIsExtractModalOpen,
  extractTasksFromText,
  toggleExtractedTask,
  addSelectedExtractedTasks,
  darkMode,
}: any) {
  const selectedCount = extractedTasks.filter(
    (task: any) => task.selected
  ).length;

  const closeModal = () => {
    setIsExtractModalOpen(false);
  };

  const handleExtract = () => {
    if (!extractInput.trim() || extractLoading) return;

    void extractTasksFromText();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      onClick={closeModal}
      className="fixed inset-0 z-[195] flex items-center justify-center bg-black/25 p-4 backdrop-blur-[3px] sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{
          duration: 0.2,
          ease: [0.16, 1, 0.3, 1],
        }}
        onClick={(event) => event.stopPropagation()}
        className={`flex max-h-[88vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[16px] border shadow-[0_24px_70px_rgba(0,0,0,0.15)] ${
          darkMode
            ? "border-white/[0.10] bg-[#181818] text-white"
            : "border-[#DEDED9] bg-white text-[#181818]"
        }`}
      >
        {/* Header */}
        <header
          className={`flex items-start justify-between gap-6 border-b px-6 py-5 sm:px-7 ${
            darkMode ? "border-white/[0.08]" : "border-[#E7E7E3]"
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles
                size={14}
                strokeWidth={1.6}
                className={
                  darkMode ? "text-white/42" : "text-[#181818]/42"
                }
              />

              <p
                className={`text-[10px] font-[700] uppercase tracking-[0.16em] ${
                  darkMode ? "text-white/38" : "text-[#6F6F6A]"
                }`}
              >
                Momentuhm Capture
              </p>
            </div>

            <h2
              className={`mt-2 text-[25px] font-[750] leading-none tracking-[-0.045em] ${
                darkMode ? "text-white" : "text-[#181818]"
              }`}
            >
              Extract action items
            </h2>

            <p
              className={`mt-2 max-w-[540px] text-[13px] font-[500] leading-5 ${
                darkMode ? "text-white/42" : "text-[#6F6F6A]"
              }`}
            >
              Paste an email, message, or meeting note. Momentuhm will identify
              the useful actions.
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label="Close extract action items"
            className={`flex h-8 w-8 shrink-0 items-center justify-center transition ${
              darkMode
                ? "text-white/38 hover:text-white"
                : "text-[#181818]/38 hover:text-[#181818]"
            }`}
          >
            <X size={18} strokeWidth={1.6} />
          </button>
        </header>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <section className="px-6 py-5 sm:px-7">
            <div className="mb-2 flex items-center justify-between gap-4">
              <label
                className={`text-[10px] font-[700] uppercase tracking-[0.14em] ${
                  darkMode ? "text-white/35" : "text-[#6F6F6A]"
                }`}
              >
                Source text
              </label>

              <span
                className={`hidden text-[10px] font-[500] sm:block ${
                  darkMode ? "text-white/68" : "text-[#6F6F6A]"
                }`}
              >
                Ctrl / ⌘ + Enter
              </span>
            </div>

            <textarea
              autoFocus
              value={extractInput}
              onChange={(event) => setExtractInput(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  (event.metaKey || event.ctrlKey)
                ) {
                  event.preventDefault();
                  handleExtract();
                }
              }}
              placeholder="Paste text here..."
              className={`min-h-[180px] w-full resize-none rounded-[10px] border px-4 py-3 text-[13px] font-[500] leading-6 outline-none transition ${
                darkMode
                  ? "border-white/[0.10] bg-transparent text-white placeholder:text-white/25 focus:border-white/[0.25]"
                  : "border-[#DEDED9] bg-transparent text-[#181818] placeholder:text-[#AAA9A4] focus:border-[#999994]"
              }`}
            />

            {extractError && (
              <div
                className={`mt-3 border-l-2 px-3 py-2 text-[12px] font-[600] leading-5 ${
                  darkMode
                    ? "border-white/35 text-white/60"
                    : "border-[#181818]/35 text-[#555550]"
                }`}
              >
                {extractError}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-4">
              <p
                className={`hidden text-[11px] font-[500] sm:block ${
                  darkMode ? "text-white/28" : "text-[#6F6F6A]"
                }`}
              >
                You can review everything before adding it.
              </p>

              <button
                type="button"
                onClick={handleExtract}
                disabled={!extractInput.trim() || extractLoading}
                className={`ml-auto flex h-10 items-center gap-2 rounded-[10px] px-4 text-[12px] font-[700] transition ${
                  !extractInput.trim() || extractLoading
                    ? "cursor-not-allowed opacity-25"
                    : darkMode
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-[#181818] text-white hover:bg-[#2A2A2A]"
                }`}
              >
                <Sparkles size={14} strokeWidth={1.7} />

                {extractLoading ? "Extracting…" : "Extract action items"}
              </button>
            </div>
          </section>

          {/* Extracted results */}
          {extractedTasks.length > 0 && (
            <section
              className={`border-t ${
                darkMode ? "border-white/[0.08]" : "border-[#E7E7E3]"
              }`}
            >
              <div className="flex items-center justify-between gap-4 px-6 py-4 sm:px-7">
                <div>
                  <h3
                    className={`text-[13px] font-[700] ${
                      darkMode ? "text-white" : "text-[#181818]"
                    }`}
                  >
                    Suggested tasks
                  </h3>

                  <p
                    className={`mt-1 text-[11px] font-[500] ${
                      darkMode ? "text-white/35" : "text-[#6F6F6A]"
                    }`}
                  >
                    Select the actions you want to add.
                  </p>
                </div>

                <span
                  className={`text-[11px] font-[600] ${
                    darkMode ? "text-white/42" : "text-[#6F6F6A]"
                  }`}
                >
                  {selectedCount} of {extractedTasks.length}
                </span>
              </div>

              <div
                className={`border-t ${
                  darkMode ? "border-white/[0.08]" : "border-[#E7E7E3]"
                }`}
              >
                {extractedTasks.map((task: any) => {
                  const visibleDate = task.suggestedDueDate
                    ? formatDueDate(task.suggestedDueDate)
                    : "";

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => toggleExtractedTask(task.id)}
                      className={`flex w-full items-start gap-3 border-b px-6 py-3.5 text-left transition last:border-b-0 sm:px-7 ${
                        darkMode
                          ? "border-white/[0.07] hover:bg-white/[0.025]"
                          : "border-[#EEEEEA] hover:bg-black/[0.015]"
                      }`}
                    >
                      <span className="mt-0.5 shrink-0">
                        {task.selected ? (
                          <CheckCircle2
                            size={18}
                            strokeWidth={1.8}
                            className={
                              darkMode
                                ? "text-white"
                                : "text-[#181818]"
                            }
                          />
                        ) : (
                          <Circle
                            size={18}
                            strokeWidth={1.4}
                            className={
                              darkMode
                                ? "text-white/25"
                                : "text-[#181818]/25"
                            }
                          />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[13px] font-[650] leading-5 ${
                            darkMode ? "text-white/88" : "text-[#181818]"
                          }`}
                        >
                          {task.title}
                        </p>

                        <div
                          className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-[600] ${
                            darkMode ? "text-white/35" : "text-[#6F6F6A]"
                          }`}
                        >
                          <span>{task.category}</span>
                          <span>·</span>
                          <span>
                            {task.priority === "Medium"
                              ? "Mid"
                              : task.priority}
                          </span>

                          {visibleDate && (
                            <>
                              <span>·</span>
                              <span>{visibleDate}</span>
                            </>
                          )}

                          {hasFollowUpTag(task) && (
                            <>
                              <span>·</span>
                              <span>Follow-up</span>
                            </>
                          )}
                        </div>

                        {task.reason && (
                          <p
                            className={`mt-1.5 line-clamp-2 text-[11px] font-[500] leading-4 ${
                              darkMode ? "text-white/30" : "text-[#6F6F6A]"
                            }`}
                          >
                            {task.reason}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        {extractedTasks.length > 0 && (
          <footer
            className={`flex items-center justify-between gap-4 border-t px-6 py-4 sm:px-7 ${
              darkMode ? "border-white/[0.08]" : "border-[#E7E7E3]"
            }`}
          >
            <button
              type="button"
              onClick={closeModal}
              className={`h-9 text-[12px] font-[600] transition ${
                darkMode
                  ? "text-white/42 hover:text-white"
                  : "text-[#6F6F6A] hover:text-[#181818]"
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={addSelectedExtractedTasks}
              disabled={selectedCount === 0}
              className={`flex h-10 items-center gap-2 rounded-[10px] px-4 text-[12px] font-[700] transition ${
                selectedCount === 0
                  ? "cursor-not-allowed opacity-25"
                  : darkMode
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-[#181818] text-white hover:bg-[#2A2A2A]"
              }`}
            >
              <Plus size={14} strokeWidth={1.8} />
              Add selected
              <span className="opacity-55">({selectedCount})</span>
            </button>
          </footer>
        )}
      </motion.div>
    </motion.div>
  );
}

function SuggestionsReviewModal({
  tasks,
  darkMode,
  setIsSuggestionsModalOpen,
  acceptSuggestedDateById,
  acceptAllSuggestedDates,
  setSelectedTask,
  setIsEditModalOpen,
}: any) {
  const closeModal = () => {
    setIsSuggestionsModalOpen(false);
  };

  const openTaskEditor = (task: any) => {
    setSelectedTask(task);
    setIsSuggestionsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const panelBorder = darkMode
    ? "border-white/[0.12]"
    : "border-[#D4D4CF]";

  const rowBorder = darkMode
    ? "border-white/[0.08]"
    : "border-[#E8E9ED]";

  const panelSurface = darkMode
    ? "bg-[#171717] text-white"
    : "bg-white text-[#181818]";

  const secondarySurface = darkMode
    ? "bg-white/[0.035]"
    : "bg-[#FAFAFB]";

  const mutedText = darkMode
    ? "text-white/48"
    : "text-[#6B6F7B]";

  return (
    <motion.div
    initial={{ opacity: 0 }}
    animate={{
      opacity: 1,
      pointerEvents: "auto",
    }}
    exit={{
      opacity: 0,
      pointerEvents: "none",
    }}
    transition={{
      duration: 0.18,
      ease: [0.16, 1, 0.3, 1],
    }}
    onClick={closeModal}
    className="fixed inset-0 z-[190] flex items-center justify-center bg-black/30 p-3 backdrop-blur-[3px] sm:p-6"
  >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="suggestions-modal-title"
        initial={{
          opacity: 0,
          y: 16,
          scale: 0.985,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 10,
          scale: 0.99,
        }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 34,
          mass: 0.82,
        }}
        onClick={(event) => event.stopPropagation()}
        className={`flex max-h-[88vh] w-full max-w-[820px] flex-col overflow-hidden rounded-[16px] border shadow-[0_24px_80px_rgba(0,0,0,0.18)] ${panelBorder} ${panelSurface}`}
      >
        {/* Header */}
        <header
          className={`flex shrink-0 items-start justify-between gap-5 border-b px-5 py-5 sm:px-6 ${rowBorder}`}
        >
          <div className="flex min-w-0 items-start gap-3.5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] border ${
                darkMode
                  ? "border-white/[0.10] bg-white/[0.05] text-white"
                  : "border-[#DDDDE3] bg-[#F7F8FA] text-[#252933]"
              }`}
            >
              <Sparkles size={17} strokeWidth={1.7} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="suggestions-modal-title"
                  className={`text-[22px] font-[750] leading-tight tracking-[-0.04em] ${
                    darkMode ? "text-white" : "text-[#17191F]"
                  }`}
                >
                  Review suggested dates
                </h2>

                {tasks.length > 0 && (
                  <span
                    className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-[700] ${
                      darkMode
                        ? "bg-white/[0.08] text-white/60"
                        : "bg-[#F0F1F4] text-[#59606C]"
                    }`}
                  >
                    {tasks.length}
                  </span>
                )}
              </div>

              <p
                className={`mt-1.5 max-w-[560px] text-[12px] font-[500] leading-5 ${mutedText}`}
              >
                Momentuhm found tasks that may need a confirmed due date.
                Accept the suggestion or open the task to adjust it.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label="Close suggested dates"
            title="Close"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border transition ${
              darkMode
                ? "border-white/[0.10] text-white/48 hover:bg-white/[0.06] hover:text-white"
                : "border-[#DDDDE3] text-[#6B6F7B] hover:bg-[#F4F5F7] hover:text-[#252933]"
            }`}
          >
            <X size={17} strokeWidth={1.7} />
          </button>
        </header>

        {/* Summary actions */}
        {tasks.length > 0 && (
          <div
            className={`flex shrink-0 flex-col gap-3 border-b px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${rowBorder} ${secondarySurface}`}
          >
            <p className={`text-[11px] font-[500] ${mutedText}`}>
              Accepting a date moves it from a suggestion to the task’s
              confirmed due date.
            </p>

            <button
              type="button"
              onClick={acceptAllSuggestedDates}
              className={`inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[8px] px-3.5 text-[11px] font-[700] transition ${
                darkMode
                  ? "bg-white text-[#181818] hover:bg-white/90"
                  : "bg-[#181818] text-white hover:bg-[#2A2A2A]"
              }`}
            >
              <Check size={14} strokeWidth={2} />
              Accept all dates
            </button>
          </div>
        )}

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center px-6 py-12 text-center">
              <div className="max-w-[360px]">
                <div
                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] border ${
                    darkMode
                      ? "border-white/[0.10] bg-white/[0.04] text-white/55"
                      : "border-[#DDDDE3] bg-[#F7F8FA] text-[#5F6572]"
                  }`}
                >
                  <Check size={19} strokeWidth={1.8} />
                </div>

                <h3
                  className={`mt-4 text-[16px] font-[700] ${
                    darkMode ? "text-white" : "text-[#17191F]"
                  }`}
                >
                  Everything is reviewed
                </h3>

                <p
                  className={`mt-2 text-[12px] font-[500] leading-5 ${mutedText}`}
                >
                  There are no remaining date suggestions. New suggestions
                  will appear here when a task sounds time-sensitive.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {tasks.map((task: any) => {
                const priorityLabel =
                  task.priority === "Medium" ||
                  task.priority === "Med"
                    ? "Medium"
                    : task.priority;

                const priorityClass =
                  task.priority === "High"
                    ? darkMode
                      ? "border-red-400/20 bg-red-400/10 text-red-300"
                      : "border-red-200 bg-red-50 text-red-600"
                    : task.priority === "Medium" ||
                      task.priority === "Med"
                    ? darkMode
                      ? "border-orange-400/20 bg-orange-400/10 text-orange-300"
                      : "border-orange-200 bg-orange-50 text-orange-600"
                    : darkMode
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-600";

                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{
                      opacity: 0,
                      y: 5,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -4,
                    }}
                    transition={{
                      duration: 0.18,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={`grid grid-cols-1 gap-4 border-b px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_148px] sm:items-center sm:px-6 ${rowBorder}`}
                  >
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => openTaskEditor(task)}
                        className={`block max-w-full text-left text-[13px] font-[680] leading-5 tracking-[-0.015em] transition hover:opacity-70 ${
                          darkMode
                            ? "text-white/90"
                            : "text-[#20232B]"
                        }`}
                      >
                        {task.title}
                      </button>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-[6px] border px-2 py-1 text-[10px] font-[650] ${priorityClass}`}
                        >
                          {priorityLabel}
                        </span>

                        <span
                          className={`rounded-[6px] border px-2 py-1 text-[10px] font-[600] ${
                            darkMode
                              ? "border-white/[0.10] bg-white/[0.04] text-white/55"
                              : "border-[#DDDDE3] bg-[#F7F8FA] text-[#5F6572]"
                          }`}
                        >
                          {task.category || "No category"}
                        </span>

                        {task.suggestedDueDate && (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-1 text-[10px] font-[650] ${
                              darkMode
                                ? "border-white/[0.12] bg-white/[0.05] text-white/72"
                                : "border-[#CFCFC9] bg-white text-[#353A45]"
                            }`}
                          >
                            <Calendar
                              size={11}
                              strokeWidth={1.8}
                            />
                            {formatDueDate(
                              task.suggestedDueDate
                            )}
                          </span>
                        )}

                        {hasFollowUpTag(task) && (
                          <span
                            className={`rounded-[6px] border px-2 py-1 text-[10px] font-[600] ${
                              darkMode
                                ? "border-white/[0.10] text-white/50"
                                : "border-[#DDDDE3] text-[#5F6572]"
                            }`}
                          >
                            Follow-up
                          </span>
                        )}
                      </div>

                      {(task.aiReason ||
                        task.whyThisMatters) && (
                        <p
                          className={`mt-2.5 line-clamp-2 max-w-[570px] text-[11px] font-[500] leading-4 ${mutedText}`}
                        >
                          {task.aiReason ||
                            task.whyThisMatters}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                      <button
                        type="button"
                        onClick={() =>
                          acceptSuggestedDateById(task.id)
                        }
                        className={`inline-flex h-9 items-center justify-center gap-2 rounded-[8px] px-3 text-[11px] font-[700] transition ${
                          darkMode
                            ? "bg-white text-[#181818] hover:bg-white/90"
                            : "bg-[#181818] text-white hover:bg-[#2A2A2A]"
                        }`}
                      >
                        <Check
                          size={13}
                          strokeWidth={2}
                        />
                        Accept date
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openTaskEditor(task)
                        }
                        className={`inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border px-3 text-[11px] font-[650] transition ${
                          darkMode
                            ? "border-white/[0.10] text-white/58 hover:bg-white/[0.06] hover:text-white"
                            : "border-[#DDDDE3] text-[#5F6572] hover:bg-[#F4F5F7] hover:text-[#252933]"
                        }`}
                      >
                        <PencilLine
                          size={13}
                          strokeWidth={1.7}
                        />
                        Edit task
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer
          className={`flex shrink-0 items-center justify-between gap-4 border-t px-5 py-3.5 sm:px-6 ${rowBorder} ${secondarySurface}`}
        >
          <p className={`text-[11px] font-[500] ${mutedText}`}>
            {tasks.length === 0
              ? "No suggestions need attention."
              : `${tasks.length} suggestion${
                  tasks.length === 1 ? "" : "s"
                } remaining`}
          </p>

          <button
            type="button"
            onClick={closeModal}
            className={`h-9 rounded-[8px] border px-3.5 text-[11px] font-[650] transition ${
              darkMode
                ? "border-white/[0.10] text-white/58 hover:bg-white/[0.06] hover:text-white"
                : "border-[#DDDDE3] bg-white text-[#5F6572] hover:bg-[#F4F5F7] hover:text-[#252933]"
            }`}
          >
            Review later
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}



function EditTaskModal({
  selectedTask,
  setSelectedTask,
  setIsEditModalOpen,
  saveTaskChanges,
  updateTaskSubtasksImmediately,
  deleteTaskEverywhere,
  restoreCompletedTask,
  categories,
  darkMode,
  manualFocusTaskIds = [],
  setManualFocusTaskIds = () => {},
}: any) {
  const priorityOptions: Priority[] = ["Low", "Medium", "High"];
  const statusOptions: TaskStatus[] = [
    "Not started",
    "In progress",
    "Waiting",
    "Done",
  ];

  const [newStepTitle, setNewStepTitle] = useState("");
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepTitle, setEditingStepTitle] = useState("");

const [mobileEditTab, setMobileEditTab] =
  useState<"details" | "steps">(
    "details"
  );

  const stepProgress = getSubtaskProgress(selectedTask);

const isTaskInFocus = manualFocusTaskIds.includes(
  selectedTask.id
);

const isFocusStackFull =
  !isTaskInFocus && manualFocusTaskIds.length >= 3;

const toggleTaskFocus = () => {
  setManualFocusTaskIds((previous: string[]) => {
    if (previous.includes(selectedTask.id)) {
      return previous.filter(
        (taskId) => taskId !== selectedTask.id
      );
    }

    if (previous.length >= 3) {
      return previous;
    }

    return [...previous, selectedTask.id];
  });
};

  const closeWithoutSaving = () => {
    setIsEditModalOpen(false);
    setSelectedTask(null);
  };

  const saveAndClose = () => {
    if (!selectedTask?.title?.trim()) return;
  
    saveTaskChanges(selectedTask);
  };
  
  const moveTaskToBacklog = () => {
    if (!selectedTask?.id) {
      return;
    }
  
    saveTaskChanges({
      ...selectedTask,
  
      isBacklog: true,
      moveToBacklog: true,
  
      /*
       * Moving to Backlog removes scheduling information.
       * This happens only after an explicit user action.
       */
      dueDate: undefined,
      suggestedDueDate: undefined,
  
      aiReason:
        "You manually moved this task to Backlog.",
  
      aiConfidence: 1,
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeWithoutSaving();
      }

      if (
        event.key === "Enter" &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        saveAndClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedTask]);

  const parseSubtaskList = (value: string) => {
    return value
      .split(/\r\n?|\n/)
      .map((line) =>
        line
          .trim()
          /*
           * Removes common bullet and numbered-list prefixes:
           * - Task
           * • Task
           * 1. Task
           * 1) Task
           * (1) Task
           */
          .replace(
            /^(?:[-*•‣◦–—]\s*|\d+[.)]\s*|\(\d+\)\s*)/,
            ""
          )
          /*
           * Also supports checklist formatting:
           * [ ] Task
           * [x] Task
           * - [ ] Task
           */
          .replace(/^\[[ xX]\]\s*/, "")
          .trim()
      )
      .filter(Boolean);
  };
  
  /*
 * Update the modal immediately and also update categories.
 *
 * Updating categories triggers the existing database
 * persistence effect, so subtasks no longer depend on
 * the Save changes button.
 */
const persistSelectedTaskSubtasks = (
  nextSubtasks: Subtask[]
) => {
  const nextTask = {
    ...selectedTask,

    subtasks:
      nextSubtasks,
  };

  setSelectedTask(
    nextTask
  );

  updateTaskSubtasksImmediately(
    selectedTask.id,
    nextSubtasks
  );
};

const appendSubtasksToSelectedTask = (
  titles: string[]
) => {
  const newSubtasks: Subtask[] =
    titles.map((title) => ({
      id:
        crypto.randomUUID(),

      title,

      completed: false,

      createdAt:
        new Date().toISOString(),
    }));

  persistSelectedTaskSubtasks([
    ...getTaskSubtasks(
      selectedTask
    ),

    ...newSubtasks,
  ]);
};

const addStepToSelectedTask = () => {
  const titles =
    parseSubtaskList(
      newStepTitle
    );

  if (
    titles.length === 0
  ) {
    return;
  }

  appendSubtasksToSelectedTask(
    titles
  );

  setNewStepTitle("");
};

const toggleSelectedStep = (
  stepId: string
) => {
  const nextSubtasks =
    getTaskSubtasks(
      selectedTask
    ).map((step) =>
      step.id === stepId
        ? {
            ...step,

            completed:
              !step.completed,
          }
        : step
    );

  persistSelectedTaskSubtasks(
    nextSubtasks
  );
};

const deleteSelectedStep = (
  stepId: string
) => {
  const nextSubtasks =
    getTaskSubtasks(
      selectedTask
    ).filter(
      (step) =>
        step.id !== stepId
    );

  persistSelectedTaskSubtasks(
    nextSubtasks
  );

  if (
    editingStepId === stepId
  ) {
    setEditingStepId(null);
    setEditingStepTitle("");
  }
};

const startEditingStep = (
  step: Subtask
) => {
  setEditingStepId(
    step.id
  );

  setEditingStepTitle(
    step.title
  );
};

const cancelEditingStep = () => {
  setEditingStepId(null);
  setEditingStepTitle("");
};

const saveEditedStep = () => {
  const title =
    editingStepTitle.trim();

  if (
    !editingStepId ||
    !title
  ) {
    cancelEditingStep();
    return;
  }

  const nextSubtasks =
    getTaskSubtasks(
      selectedTask
    ).map((step) =>
      step.id ===
      editingStepId
        ? {
            ...step,

            title,
          }
        : step
    );

  persistSelectedTaskSubtasks(
    nextSubtasks
  );

  cancelEditingStep();
};

  const restoreTask = () => {
    restoreCompletedTask(selectedTask.id);
    setIsEditModalOpen(false);
    setSelectedTask(null);
  };

  const deleteTask = () => {
    const confirmed = window.confirm(
      `Delete "${selectedTask.title}" permanently?`
    );

    if (!confirmed) return;

    deleteTaskEverywhere(selectedTask.id);
  };

  const fieldLabelClass = `mb-2 block text-[10px] font-[750] uppercase tracking-[0.14em] ${
    darkMode ? "text-white/55" : "text-[#6F6F6A]"
  }`;

  const fieldClass = `w-full border px-3 text-[13px] font-[550] outline-none transition ${
    darkMode
      ? "border-white/[0.24] bg-[#171717] text-white placeholder:text-white/40 hover:border-white/[0.38] focus:border-white/[0.70]"
      : "border-[#A8A8A2] bg-white text-[#181818] placeholder:text-[#777772] hover:border-[#777772] focus:border-[#181818]"
  }`;

  const mutedTextClass = darkMode
    ? "text-white/55"
    : "text-[#6F6F6A]";

  const dividerClass = darkMode
    ? "border-white/[0.12]"
    : "border-[#D4D4CF]";

  return (
    <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{
    duration: 0.28,
    ease: [0.22, 1, 0.36, 1],
  }}
  onClick={closeWithoutSaving}
      className="fixed inset-0 z-[200] flex h-[100dvh] max-h-[100dvh] w-full items-stretch justify-center overflow-hidden bg-black/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
    >
    <motion.div
  role="dialog"
  aria-modal="true"
  aria-labelledby="edit-task-modal-title"
  data-testid="edit-task-modal"
  initial={{
    opacity: 0,
    x: "0%",
    y: "32vh",
    scaleX: 0.12,
    scaleY: 0.04,
    skewY: 0,
    clipPath: "inset(88% 44% 0% 44% round 18px)",
    filter: "blur(5px)",
  }}
  animate={{
    opacity: 1,
    x: "0%",
    y: "0vh",
    scaleX: 1,
    scaleY: 1,
    skewY: 0,
    clipPath: "inset(0% 0% 0% 0% round 10px)",
    filter: "blur(0px)",
  }}
  exit={{
    opacity: 0,
    x: "0%",
    y: "32vh",
    scaleX: 0.12,
    scaleY: 0.04,
    skewY: 0,
    clipPath: "inset(88% 44% 0% 44% round 18px)",
    filter: "blur(5px)",
  }}
  transition={{
    opacity: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  
    x: {
      type: "spring",
      stiffness: 125,
      damping: 23,
      mass: 1.05,
    },
  
    y: {
      type: "spring",
      stiffness: 112,
      damping: 22,
      mass: 1.08,
    },
  
    scaleX: {
      type: "spring",
      stiffness: 132,
      damping: 22,
      mass: 1.05,
    },
  
    scaleY: {
      type: "spring",
      stiffness: 105,
      damping: 21,
      mass: 1.12,
    },
  
    skewY: {
      duration: 0.58,
      ease: [0.22, 1, 0.36, 1],
    },
  
    clipPath: {
      duration: 0.65,
      ease: [0.16, 1, 0.3, 1],
    },
  
    filter: {
      duration: 0.46,
      ease: "easeOut",
    },
  }}
  style={{
    transformOrigin: "50% 100%",
  }}
  onClick={(event) => event.stopPropagation()}
  className={`will-change-[transform,clip-path,filter] flex h-full max-h-none w-full flex-col overflow-hidden border shadow-[0_24px_80px_rgba(0,0,0,0.20)] sm:h-auto sm:max-h-[92vh] sm:max-w-[1120px] sm:rounded-[10px] ${
          darkMode
            ? "border-white/[0.14] bg-[#151515] text-white"
            : "border-[#CFCFCA] bg-[#FAFAF8] text-[#181818]"
        }`}
      >
        {/* Header */}
        <header
  className={`relative flex shrink-0 items-start justify-between gap-4 border-b px-4 py-4 sm:gap-6 sm:px-7 sm:py-5 ${dividerClass}`}
>
<div className="min-w-0 pr-10 sm:pr-0">
            <h2
              id="edit-task-modal-title"
              className={`translate-y-[7px] whitespace-nowrap text-[22px] font-[750] leading-none tracking-[-0.045em] sm:translate-y-0 sm:text-[24px] ${
                darkMode ? "text-white" : "text-[#181818]"
              }`}
            >
              Edit Task
            </h2>

            <p
  className={`mt-2 hidden text-[12px] font-[500] leading-5 sm:block ${mutedTextClass}`}
>
  Edit the task details on the left. Break execution into steps on
  the right.
</p>
          </div>

          <div className="flex shrink-0 items-start gap-3">
  {!selectedTask.completed && (
    <div className="hidden items-center gap-3 sm:flex">
      <button
        type="button"
        data-testid="move-task-to-backlog-button"
        onClick={moveTaskToBacklog}
        disabled={Boolean(
          selectedTask.isBacklog
        )}
        aria-label="Move task to backlog"
        title={
          selectedTask.isBacklog
            ? "This task is already in Backlog"
            : "Move to Backlog"
        }
        className={`inline-flex h-9 items-center justify-center gap-2 rounded-[7px] border bg-transparent px-3 text-[11px] font-[700] transition disabled:cursor-not-allowed disabled:opacity-35 ${
          darkMode
            ? "border-white/[0.20] text-white/72 hover:border-white/40 hover:bg-white/[0.06] hover:text-white"
            : "border-[#B8B8B2] text-[#555550] hover:border-[#777772] hover:bg-black/[0.035] hover:text-[#181818]"
        }`}
      >
        <List
          size={13}
          strokeWidth={1.8}
        />

        Move to backlog
      </button>

      <button
        type="button"
        data-testid="mark-task-complete-button"
        onClick={() =>
          saveTaskChanges({
            ...selectedTask,
            statusBeforeCompletion:
              getRestorableTaskStatus(
                selectedTask.status
              ),
            status: "Done",
            completed: true,
            completedAt:
              selectedTask.completedAt ||
              new Date().toISOString(),
          })
        }
        className={`inline-flex h-9 items-center justify-center gap-2 rounded-[7px] border bg-transparent px-3 text-[11px] font-[700] transition ${
          darkMode
            ? "border-white/[0.20] text-white/72 hover:border-white/40 hover:bg-white/[0.06] hover:text-white"
            : "border-[#B8B8B2] text-[#555550] hover:border-[#777772] hover:bg-black/[0.035] hover:text-[#181818]"
        }`}
      >
        <Check
          size={13}
          strokeWidth={2}
        />

        Mark this complete
      </button>
    </div>
  )}

  <button
    type="button"
    data-testid="close-task-edit-button"
    onClick={closeWithoutSaving}
    aria-label="Close edit task"
    title="Close"
    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:rounded-[6px] ${
      darkMode
        ? "bg-white/[0.06] text-white/55 hover:bg-white/[0.10] hover:text-white sm:bg-transparent"
        : "bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED] hover:text-[#202124] sm:bg-transparent"
    }`}
  >
    <X
      size={18}
      strokeWidth={1.7}
    />
  </button>
</div>
        </header>

        {/* Mobile modal tabs */}
<div
  role="tablist"
  aria-label="Edit task sections"
  className={`grid shrink-0 grid-cols-2 border-b sm:hidden ${dividerClass}`}
>
  <button
    type="button"
    role="tab"
    aria-selected={
      mobileEditTab === "details"
    }
    onClick={() =>
      setMobileEditTab("details")
    }
    className={`relative flex h-12 items-center justify-center text-[12px] font-[700] transition ${
      mobileEditTab === "details"
        ? darkMode
          ? "text-violet-300"
          : "text-violet-700"
        : mutedTextClass
    }`}
  >
    Details

    {mobileEditTab === "details" && (
      <span
        aria-hidden="true"
        className={`absolute bottom-0 left-6 right-6 h-[2px] rounded-full ${
          darkMode
            ? "bg-violet-300"
            : "bg-violet-600"
        }`}
      />
    )}
  </button>

  <button
    type="button"
    role="tab"
    aria-selected={
      mobileEditTab === "steps"
    }
    onClick={() =>
      setMobileEditTab("steps")
    }
    className={`relative flex h-12 items-center justify-center gap-1.5 text-[12px] font-[700] transition ${
      mobileEditTab === "steps"
        ? darkMode
          ? "text-violet-300"
          : "text-violet-700"
        : mutedTextClass
    }`}
  >
    Steps

    <span
      className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-[700] ${
        darkMode
          ? "bg-white/[0.08] text-white/60"
          : "bg-[#EEEAFB] text-violet-700"
      }`}
    >
      {stepProgress.total}
    </span>

    {mobileEditTab === "steps" && (
      <span
        aria-hidden="true"
        className={`absolute bottom-0 left-6 right-6 h-[2px] rounded-full ${
          darkMode
            ? "bg-violet-300"
            : "bg-violet-600"
        }`}
      />
    )}
  </button>
</div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="grid min-h-full grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_1px_minmax(0,1.05fr)]">
            {/* Task details */}
            {/* Task details */}
<section
  className={`px-4 py-5 sm:block sm:px-7 sm:py-6 ${
    mobileEditTab === "details"
      ? "block"
      : "hidden"
  }`}
>
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label
                    htmlFor="task-title"
                    className={fieldLabelClass}
                  >
                    Title
                  </label>

                  <input
                    id="task-title"
                    data-testid="task-title-input"
                    value={selectedTask.title || ""}
                    onChange={(event) =>
                      setSelectedTask({
                        ...selectedTask,
                        title: event.target.value,
                      })
                    }
                    placeholder="What needs to get done?"
                    className={`h-11 rounded-[7px] ${fieldClass}`}
                  />
                </div>

                {/* Priority and status */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <fieldset>
                    <legend className={fieldLabelClass}>
                      Priority
                    </legend>

                    <div
                      className={`grid h-11 grid-cols-3 overflow-hidden rounded-[7px] border ${
                        darkMode
                          ? "border-white/[0.24]"
                          : "border-[#A8A8A2]"
                      }`}
                    >
                      {priorityOptions.map((priority, index) => {
                        const isActive =
                          selectedTask.priority === priority;

                        return (
                          <button
                            key={priority}
                            type="button"
                            data-testid={`task-priority-${priority.toLowerCase()}`}
                            aria-pressed={isActive}
                            onClick={() =>
                              setSelectedTask({
                                ...selectedTask,
                                priority,
                              })
                            }
                            className={`border-r text-[11px] font-[700] transition last:border-r-0 ${dividerClass} ${
                              isActive
                                ? darkMode
                                  ? "bg-white text-[#181818]"
                                  : "bg-[#181818] text-white"
                                : darkMode
                                ? "bg-transparent text-white/55 hover:bg-white/[0.05] hover:text-white"
                                : "bg-transparent text-[#6F6F6A] hover:bg-black/[0.035] hover:text-[#181818]"
                            }`}
                          >
                            {priority === "Medium"
                              ? "Mid"
                              : priority}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className={fieldLabelClass}>
                      Status
                    </legend>

                    <div
                      className={`grid h-11 grid-cols-4 overflow-hidden rounded-[7px] border ${
                        darkMode
                          ? "border-white/[0.24]"
                          : "border-[#A8A8A2]"
                      }`}
                    >

{statusOptions.map((status) => {
const currentStatus =
  normalizeTaskStatus(
    selectedTask.status
  );

const isActive =
  currentStatus === status;

return (
  <button
    key={status}
    type="button"
    data-testid={`task-status-${status.toLowerCase().replace(/\s+/g, "-")}`}
    aria-pressed={isActive}
    onClick={() =>
      setSelectedTask({
        ...selectedTask,
        status,
      })
    }
    className={`border-r px-1 text-[9.5px] font-[700] leading-[12px] transition last:border-r-0 ${dividerClass} ${
      isActive
        ? darkMode
          ? "bg-white text-[#181818]"
          : "bg-[#181818] text-white"
        : darkMode
        ? "bg-transparent text-white/55 hover:bg-white/[0.05] hover:text-white"
        : "bg-transparent text-[#6F6F6A] hover:bg-black/[0.035] hover:text-[#181818]"
    }`}
  >
    {getTaskStatusLabel(status)}
  </button>
);
})}

                    </div>
                  </fieldset>
                </div>


{/* Focus mode */}
<div
  className={`flex items-center justify-between gap-4 rounded-[7px] border px-3 py-3 ${
    darkMode
      ? "border-white/[0.24] bg-[#171717]"
      : "border-[#A8A8A2] bg-white"
  }`}
>
  <div className="min-w-0">
    <div className="flex items-center gap-2">
      <Target
        size={15}
        strokeWidth={1.7}
        className={
          isTaskInFocus
            ? darkMode
              ? "text-emerald-300"
              : "text-emerald-600"
            : darkMode
            ? "text-white/55"
            : "text-[#6F6F6A]"
        }
      />

      <p
        className={`text-[12px] font-[700] ${
          darkMode ? "text-white" : "text-[#181818]"
        }`}
      >
        Focus mode
      </p>
    </div>

    <p
      className={`mt-1 text-[11px] font-[500] leading-4 ${
        darkMode
          ? "text-white/55"
          : "text-[#6F6F6A]"
      }`}
    >
      {isTaskInFocus
        ? "This task is currently in your Focus stack."
        : isFocusStackFull
        ? "Your Focus stack already contains three tasks."
        : "Add this task to your current Focus stack."}
    </p>
  </div>

  <button
    type="button"
    data-testid="toggle-task-focus-button"
    onClick={toggleTaskFocus}
    disabled={isFocusStackFull}
    aria-pressed={isTaskInFocus}
    className={`h-9 shrink-0 rounded-[7px] border px-3 text-[11px] font-[700] transition ${
      isFocusStackFull
        ? "cursor-not-allowed opacity-35"
        : isTaskInFocus
        ? darkMode
          ? "border-red-300/20 bg-red-300/[0.08] text-red-200 hover:bg-red-300/[0.12]"
          : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
        : darkMode
        ? "border-white bg-white text-[#181818] hover:bg-white/90"
        : "border-[#181818] bg-[#181818] text-white hover:bg-[#2A2A2A]"
    }`}
  >
    {isTaskInFocus
      ? "Remove"
      : isFocusStackFull
      ? "Focus stack full"
      : "Add to focus"}
  </button>
</div>


{/* Pin task */}
<div
className={`flex items-center justify-between gap-4 rounded-[7px] border px-3 py-3 ${
  darkMode
    ? "border-white/[0.24] bg-[#171717]"
    : "border-[#A8A8A2] bg-white"
}`}
>
<div className="min-w-0">
  <div className="flex items-center gap-2">
    <Star
      size={15}
      strokeWidth={1.7}
      fill={selectedTask.pinned ? "currentColor" : "none"}
      className={
        selectedTask.pinned
          ? darkMode
            ? "text-white"
            : "text-[#181818]"
          : darkMode
          ? "text-white/55"
          : "text-[#6F6F6A]"
      }
    />

    <p
      className={`text-[12px] font-[700] ${
        darkMode ? "text-white" : "text-[#181818]"
      }`}
    >
      Pin task
    </p>
  </div>

  <p
    className={`mt-1 text-[11px] font-[500] leading-4 ${
      darkMode
        ? "text-white/55"
        : "text-[#6F6F6A]"
    }`}
  >
    {selectedTask.pinned
      ? "This task will stay above other tasks."
      : "Keep this task at the top of your list."}
  </p>
</div>

<button
  type="button"
  data-testid="toggle-task-pin-button"
  onClick={() =>
    setSelectedTask({
      ...selectedTask,
      pinned: !selectedTask.pinned,
    })
  }
  aria-pressed={Boolean(selectedTask.pinned)}
  className={`h-9 shrink-0 rounded-[7px] border px-3 text-[11px] font-[700] transition ${
    selectedTask.pinned
      ? darkMode
        ? "border-white bg-white text-[#181818]"
        : "border-[#181818] bg-[#181818] text-white"
      : darkMode
      ? "border-white/[0.24] text-white/65 hover:bg-white/[0.06] hover:text-white"
      : "border-[#A8A8A2] text-[#6F6F6A] hover:bg-black/[0.035] hover:text-[#181818]"
  }`}
>
  {selectedTask.pinned ? "Pinned" : "Pin to top"}
</button>
</div>
                {/* Date and category */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="task-due-date"
                      className={fieldLabelClass}
                    >
                      Due date
                    </label>

                    <input
                      id="task-due-date"
                      data-testid="task-due-date-input"
                      type="date"
                      value={
                        selectedTask.dueDate ||
                        selectedTask.suggestedDueDate ||
                        ""
                      }
                      onChange={(event) =>
                        setSelectedTask({
                          ...selectedTask,
                          dueDate: event.target.value || undefined,
                          suggestedDueDate: undefined,
                          aiReason: event.target.value
                            ? "You manually scheduled this task."
                            : undefined,
                          aiConfidence: event.target.value ? 1 : 0,
                        })
                      }
                      style={{
                        colorScheme: darkMode
                          ? "dark"
                          : "light",
                      }}
                      className={`h-11 rounded-[7px] ${fieldClass}`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="task-category"
                      className={fieldLabelClass}
                    >
                      Category
                    </label>

                    <div className="relative">
                    <select
id="task-category"
data-testid="task-category-select"
value={selectedTask.category || "-"}
onChange={(event) =>
  setSelectedTask({
    ...selectedTask,
    category: event.target.value,
  })
}
className={`h-11 appearance-none rounded-[7px] pr-10 ${fieldClass}`}
>
{selectedTask.category === "-" && (
  <option
    value="-"
    disabled
    hidden
  >
    -
  </option>
)}

{categories
  .filter(
    (category: any) =>
      category.title !== "-"
  )
  .map((category: any) => (
    <option
      key={category.id}
      value={category.title}
    >
      {category.title}
    </option>
  ))}
</select>

                      <ChevronDown
                        aria-hidden="true"
                        size={15}
                        strokeWidth={1.6}
                        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
                          darkMode
                            ? "text-white/55"
                            : "text-[#6F6F6A]"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Why */}
                <div>
                  <label
                    htmlFor="task-why"
                    className={fieldLabelClass}
                  >
                    Why it matters
                  </label>

                  <textarea
                    id="task-why"
                    data-testid="task-why-textarea"
                    value={selectedTask.whyThisMatters || ""}
                    onChange={(event) =>
                      setSelectedTask({
                        ...selectedTask,
                        whyThisMatters: event.target.value,
                      })
                    }
                    placeholder="Impact, outcome, or consequence..."
                    className={`min-h-[78px] resize-none rounded-[7px] py-3 leading-5 ${fieldClass}`}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="task-notes"
                    className={fieldLabelClass}
                  >
                    Notes
                  </label>

                  <textarea
                    id="task-notes"
                    data-testid="task-notes-textarea"
                    value={selectedTask.notes || ""}
                    onChange={(event) =>
                      setSelectedTask({
                        ...selectedTask,
                        notes: event.target.value,
                      })
                    }
                    placeholder="Add context, links, blockers, or anything useful..."
                    className={`min-h-[94px] resize-none rounded-[7px] py-3 leading-5 ${fieldClass}`}
                  />
                </div>

                {/* AI interpretation */}
                {selectedTask.aiReason &&
                  selectedTask.aiReason !==
                    "You manually scheduled this task." && (
                    <div
                      className={`border-t pt-5 ${dividerClass}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p
                          className={`text-[10px] font-[750] uppercase tracking-[0.14em] ${mutedTextClass}`}
                        >
                          Momentuhm interpretation
                        </p>

                        {typeof selectedTask.aiConfidence ===
                          "number" && (
                          <span
                            className={`text-[10px] font-[650] ${mutedTextClass}`}
                          >
                            {Math.round(
                              selectedTask.aiConfidence * 100
                            )}
                            % confidence
                          </span>
                        )}
                      </div>

                      <p
                        className={`mt-2 text-[12px] font-[500] leading-5 ${mutedTextClass}`}
                      >
                        {selectedTask.aiReason}
                      </p>

                      <p
                        className={`mt-3 text-[10px] font-[650] ${mutedTextClass}`}
                      >
                        {selectedTask.priority === "Medium"
                          ? "Mid"
                          : selectedTask.priority}{" "}
                        priority
                        {selectedTask.suggestedDueDate
                          ? ` · Suggested ${formatDueDate(
                              selectedTask.suggestedDueDate
                            )}`
                          : selectedTask.dueDate
                          ? ` · Due ${formatDueDate(
                              selectedTask.dueDate
                            )}`
                          : ""}
                        {hasFollowUpTag(selectedTask)
                          ? " · Follow-up"
                          : ""}
                      </p>
                    </div>
                  )}
              </div>
            </section>

            {/* Desktop divider */}
            <div
              aria-hidden="true"
              className={`hidden border-l lg:block ${dividerClass}`}
            />

           {/* Subtasks */}
<section
  className={`px-4 py-5 sm:block sm:px-7 sm:py-6 lg:border-t-0 ${
    mobileEditTab === "steps"
      ? "block"
      : "hidden"
  } ${
    darkMode
      ? "border-white/[0.12]"
      : "border-[#D4D4CF]"
  }`}
>
              {/* Subtask header */}
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ListChecks
                      size={17}
                      strokeWidth={1.6}
                      className={mutedTextClass}
                    />

                    <h3
                      className={`text-[13px] font-[750] uppercase tracking-[0.08em] ${
                        darkMode ? "text-white" : "text-[#181818]"
                      }`}
                    >
                      Subtasks
                    </h3>
                  </div>

                  <p
                    className={`mt-2 text-[11px] font-[500] leading-5 ${mutedTextClass}`}
                  >
                    Big tasks become lighter when the next step is clear.
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p
                    className={`text-[11px] font-[700] ${
                      darkMode ? "text-white" : "text-[#181818]"
                    }`}
                  >
                    {stepProgress.completed} / {stepProgress.total}
                  </p>

                  <p
                    className={`mt-1 text-[10px] font-[600] ${mutedTextClass}`}
                  >
                    {stepProgress.percent}%
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div
                role="progressbar"
                aria-label="Subtask progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={stepProgress.percent}
                className={`mt-4 h-[2px] w-full ${
                  darkMode
                    ? "bg-white/[0.12]"
                    : "bg-[#DEDED9]"
                }`}
              >
                <div
                  className={`h-full transition-[width] duration-500 ${
                    darkMode ? "bg-white" : "bg-[#181818]"
                  }`}
                  style={{
                    width: `${stepProgress.percent}%`,
                  }}
                />
              </div>

              {/* Add subtask */}
              <div className="mt-5 grid grid-cols-[minmax(0,1fr)_72px] gap-2">
              <input
data-testid="subtask-input"
aria-label="New subtask"
value={newStepTitle}
onChange={(event) =>
  setNewStepTitle(event.target.value)
}
onPaste={(event) => {
  const pastedText =
    event.clipboardData.getData("text");

  const pastedSubtasks =
    parseSubtaskList(pastedText);

  /*
   * A normal single-line paste continues behaving
   * like an ordinary input paste.
   */
  if (pastedSubtasks.length < 2) {
    return;
  }

  /*
   * Prevent the browser from converting the full list
   * into one input value.
   */
  event.preventDefault();

  appendSubtasksToSelectedTask(
    pastedSubtasks
  );
}}
onKeyDown={(event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addStepToSelectedTask();
  }
}}
placeholder="Add or paste a list of subtasks..."
className={`h-11 rounded-[7px] ${fieldClass}`}
/>

                <button
                  type="button"
                  data-testid="add-subtask-button"
                  onClick={addStepToSelectedTask}
                  disabled={!newStepTitle.trim()}
                  className={`h-11 rounded-[7px] border text-[12px] font-[700] transition ${
                    !newStepTitle.trim()
                      ? "cursor-not-allowed opacity-35"
                      : darkMode
                      ? "border-white bg-white text-[#181818] hover:bg-white/90"
                      : "border-[#181818] bg-[#181818] text-white hover:bg-[#2A2A2A]"
                  }`}
                >
                  Add
                </button>
              </div>

              {/* Empty state */}
              {stepProgress.subtasks.length === 0 ? (
                <div
                  className={`mt-5 flex min-h-[170px] items-center justify-center border px-5 text-center ${
                    darkMode
                      ? "border-white/[0.14]"
                      : "border-[#D4D4CF]"
                  }`}
                >
                  <div>
                    <List
                      size={20}
                      strokeWidth={1.4}
                      className={`mx-auto ${mutedTextClass}`}
                    />

                    <p
                      className={`mt-3 text-[12px] font-[650] ${
                        darkMode ? "text-white" : "text-[#181818]"
                      }`}
                    >
                      No steps yet.
                    </p>

                    <p
                      className={`mt-1 text-[11px] font-[500] leading-5 ${mutedTextClass}`}
                    >
                      Add the first step to break this task down.
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`mt-5 border ${
                    darkMode
                      ? "border-white/[0.14]"
                      : "border-[#D4D4CF]"
                  }`}
                >
                  {stepProgress.subtasks.map(
                    (step: Subtask, index: number) => (
                      <div
                        key={step.id}
                        data-testid="subtask-row"
                        data-subtask-id={step.id}
                        data-subtask-title={step.title}
                        className={`grid min-h-[54px] grid-cols-[36px_minmax(0,1fr)_34px_34px] items-center gap-2 border-b px-2 last:border-b-0 ${dividerClass}`}
                      >
                        <button
                          type="button"
                          data-testid="toggle-subtask-button"
                          data-subtask-id={step.id}
                          onClick={() =>
                            toggleSelectedStep(step.id)
                          }
                          aria-label={
                            step.completed
                              ? `Mark ${step.title} incomplete`
                              : `Complete ${step.title}`
                          }
                          className={`flex h-8 w-8 items-center justify-center rounded-[5px] transition ${
                            darkMode
                              ? "text-white/55 hover:bg-white/[0.06] hover:text-white"
                              : "text-[#6F6F6A] hover:bg-black/[0.04] hover:text-[#181818]"
                          }`}
                        >
                          {step.completed ? (
                            <span
                              className={`flex h-[18px] w-[18px] items-center justify-center border ${
                                darkMode
                                  ? "border-white bg-white text-[#181818]"
                                  : "border-[#181818] bg-[#181818] text-white"
                              }`}
                            >
                              <Check
                                size={12}
                                strokeWidth={2.4}
                              />
                            </span>
                          ) : (
                            <span
                              className={`h-[18px] w-[18px] border ${
                                darkMode
                                  ? "border-white/55"
                                  : "border-[#777772]"
                              }`}
                            />
                          )}
                        </button>

                        {editingStepId === step.id ? (
                          <input
                            autoFocus
                            data-testid="edit-subtask-input"
                            data-subtask-id={step.id}
                            value={editingStepTitle}
                            onChange={(event) =>
                              setEditingStepTitle(
                                event.target.value
                              )
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                saveEditedStep();
                              }

                              if (event.key === "Escape") {
                                event.stopPropagation();
                                cancelEditingStep();
                              }
                            }}
                            onBlur={saveEditedStep}
                            className={`h-9 rounded-[6px] ${fieldClass}`}
                          />
                        ) : (
                          <button
                            type="button"
                            data-testid="subtask-title-button"
                            data-subtask-id={step.id}
                            onClick={() =>
                              startEditingStep(step)
                            }
                            className={`min-w-0 py-3 text-left text-[12px] font-[550] leading-5 ${
                              step.completed
                                ? darkMode
                                  ? "text-white/40 line-through decoration-white/30"
                                  : "text-[#777772] line-through decoration-black/25"
                                : darkMode
                                ? "text-white/82"
                                : "text-[#181818]"
                            }`}
                          >
                            {step.title}
                          </button>
                        )}

                        <button
                          type="button"
                          data-testid="edit-subtask-button"
                          data-subtask-id={step.id}
                          onClick={() =>
                            startEditingStep(step)
                          }
                          aria-label={`Edit ${step.title}`}
                          title="Edit subtask"
                          className={`flex h-8 w-8 items-center justify-center rounded-[5px] transition ${
                            darkMode
                              ? "text-white/45 hover:bg-white/[0.06] hover:text-white"
                              : "text-[#777772] hover:bg-black/[0.04] hover:text-[#181818]"
                          }`}
                        >
                          <PencilLine
                            size={14}
                            strokeWidth={1.6}
                          />
                        </button>

                        <button
                          type="button"
                          data-testid="delete-subtask-button"
                          data-subtask-id={step.id}
                          onClick={() =>
                            deleteSelectedStep(step.id)
                          }
                          aria-label={`Delete ${step.title}`}
                          title="Delete subtask"
                          className={`flex h-8 w-8 items-center justify-center rounded-[5px] transition ${
                            darkMode
                              ? "text-white/40 hover:bg-white/[0.06] hover:text-white"
                              : "text-[#777772] hover:bg-black/[0.04] hover:text-[#181818]"
                          }`}
                        >
                          <Trash2
                            size={14}
                            strokeWidth={1.6}
                          />
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              {stepProgress.allComplete && (
                <p
                  className={`mt-4 border-l-2 pl-3 text-[11px] font-[550] leading-5 ${
                    darkMode
                      ? "border-white/45 text-white/60"
                      : "border-[#777772] text-[#555550]"
                  }`}
                >
                  All subtasks are complete. Mark the parent task complete when
                  the full outcome is achieved.
                </p>
              )}
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer
          className={`flex shrink-0 flex-col-reverse gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-4 ${dividerClass}`}
        >
          <div className="hidden items-center gap-4 sm:flex">
            {selectedTask.completed && (
              <button
                type="button"
                data-testid="restore-task-from-modal-button"
                onClick={restoreTask}
                className={`flex h-10 items-center gap-2 text-[12px] font-[650] transition ${
                  darkMode
                    ? "text-white/55 hover:text-white"
                    : "text-[#6F6F6A] hover:text-[#181818]"
                }`}
              >
                <RotateCcw size={14} strokeWidth={1.7} />
                Restore task
              </button>
            )}

            <button
              type="button"
              data-testid="delete-task-button"
              onClick={deleteTask}
              className={`flex h-10 items-center gap-2 text-[12px] font-[650] transition ${
                darkMode
                  ? "text-white/45 hover:text-white"
                  : "text-[#777772] hover:text-[#181818]"
              }`}
            >
              <Trash2 size={14} strokeWidth={1.6} />
              Delete task
            </button>
          </div>

          <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
            <button
              type="button"
              data-testid="cancel-task-edit-button"
              onClick={closeWithoutSaving}
              className={`hidden h-10 rounded-[7px] px-4 text-[12px] font-[650] transition sm:block ${
                darkMode
                  ? "text-white/55 hover:bg-white/[0.06] hover:text-white"
                  : "text-[#6F6F6A] hover:bg-black/[0.035] hover:text-[#181818]"
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              data-testid="save-task-changes-button"
              onClick={saveAndClose}
              disabled={!selectedTask?.title?.trim()}
              className={`h-12 w-full rounded-[10px] px-5 text-[13px] font-[700] transition active:scale-[0.99] sm:h-10 sm:w-auto sm:min-w-[76px] sm:rounded-[7px] sm:text-[12px] ${
                !selectedTask?.title?.trim()
                  ? "cursor-not-allowed opacity-35"
                  : darkMode
                  ? "bg-white text-[#181818] hover:bg-white/90"
                  : "bg-[#181818] text-white hover:bg-[#2A2A2A]"
              }`}
            >
               Save changes
            </button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
}
