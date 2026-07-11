"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Inter } from "next/font/google";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "@/components/Sidebar";
import SettingsView from "@/components/SettingsView";
import Toast from "@/components/Toast";
import FirecrackerLayer from "@/components/Firecracker";

import type { Category, Firecracker, Priority } from "@/types";
import { loadState, saveState } from "@/utils/storage";




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
} from "lucide-react";


type TaskTag = "follow-up";

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
  status: "Active" | "Waiting" | "Someday";
  reason: string;
  confidence: number;
  tags: TaskTag[];
};

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

const initialCategories: Category[] = [
  {
    id: crypto.randomUUID(),
    title: "Small Wins",
    tasks: [],
  },
  {
    id: crypto.randomUUID(),
    title: "Major Projects",
    tasks: [],
  },
  {
    id: crypto.randomUUID(),
    title: "Sustaining",
    tasks: [],
  },
  {
    id: crypto.randomUUID(),
    title: "Self Growth",
    tasks: [],
  },
];

/* ------------------------------------------------ */
/* Helper Functions */
/* ------------------------------------------------ */

const getTodayDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
    .trim();

  if (!cleaned) return "";

  const firstSentence =
    cleaned.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || cleaned;

  const words = firstSentence.split(/\s+/);

  if (words.length <= 18) {
    return firstSentence;
  }

  return `${words.slice(0, 18).join(" ").replace(/[,:;–—-]+$/, "")}…`;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [archive, setArchive] = useState<any[]>([]);
  const [completedToday, setCompletedToday] = useState<any[]>([]);
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
const [manualFocusTaskIds, setManualFocusTaskIds] = useState<string[]>([]);
const [isLoaded, setIsLoaded] = useState(false);
const taskListRef = useRef<HTMLElement | null>(null);
const lastClipboardTextRef = useRef("");
const clipboardCheckInFlightRef = useRef(false);
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
  window.innerWidth < 640 ? 18 : window.innerWidth < 1024 ? 148 : 32;
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

  const todayDate = getTodayDate();

  useEffect(() => {
    const refreshCurrentTime = () => {
      setCurrentTime(new Date());
    };
  
    refreshCurrentTime();
  
    const timer = window.setInterval(
      refreshCurrentTime,
      30000
    );
  
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshCurrentTime();
      }
    };
  
    window.addEventListener("focus", refreshCurrentTime);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
  
    return () => {
      window.clearInterval(timer);
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
  
  const dayTimeRemaining = useMemo(() => {
    return getTimeRemainingInDay(
      dayEndTime,
      currentTime
    );
  }, [dayEndTime, currentTime]);

  /* ------------------------------------------------ */
  /* Load State */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (!isUserLoaded) return;
  
    const loadUserState = async () => {
      if (!user?.id) {
        setCategories(initialCategories);
        setSelectedCategory(initialCategories[0].title);
        setThemeColor(DEFAULT_THEME_COLOR);
        setIsLoaded(true);
        return;
      }
  
      const saved = await loadState(user.id);
  
      if (saved) {
        const parsed: any = saved;
  
        setCategories(parsed.categories || initialCategories);
        setDarkMode(parsed.darkMode ?? false);
setThemeColor(parsed.themeColor || DEFAULT_THEME_COLOR);

setTodayTaskSortMode(
  ["date", "priority"].includes(parsed.todayTaskSortMode)
    ? (parsed.todayTaskSortMode as SortMode)
    : "date"
);

        setTodayTaskGroupMode(
          ["none", "category", "priority", "date"].includes(
            parsed.todayTaskGroupMode
          )
            ? (parsed.todayTaskGroupMode as GroupMode)
            : "none"
        );

        setPriorityViewMode(parsed.priorityViewMode || "cards");
        setUpcomingViewMode(parsed.upcomingViewMode || "calendar");
        setEnableAppSuggestions(parsed.enableAppSuggestions ?? true);
        setEnableAutoPriority(parsed.enableAutoPriority ?? true);
        setEnableClipboardAssist(parsed.enableClipboardAssist ?? true);
        setArchive(parsed.archive || []);
        setCompletedToday(parsed.completedToday || []);
        setDayEndTime(
          normalizeDayEndTime(parsed.dayEndTime)
        );
        setUserRole(parsed.userRole || "");
        setManualFocusTaskIds(parsed.manualFocusTaskIds || []);
  
        if (parsed.categories && parsed.categories.length > 0) {
          setSelectedCategory(parsed.categories[0].title);
        } else {
          setSelectedCategory(initialCategories[0].title);
        }
      } else {
        setCategories(initialCategories);
        setSelectedCategory(initialCategories[0].title);
        setThemeColor(DEFAULT_THEME_COLOR);
      }
  
      setIsLoaded(true);
    };
  
    void loadUserState();
  }, [isUserLoaded, user?.id]);

  /* ------------------------------------------------ */
  /* Persist */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (!isLoaded) return;
  
    if (!user?.id) return;
  
    const hasAnyUserData =
      categories.some((category) => category.tasks.length > 0) ||
      completedToday.length > 0 ||
      archive.length > 0;
  
      if (
        !hasAnyUserData &&
        themeColor === DEFAULT_THEME_COLOR &&
        darkMode === false &&
        todayTaskSortMode === "date" &&
        todayTaskGroupMode === "none" &&
        enableAppSuggestions === true &&
        enableAutoPriority === true &&
        enableClipboardAssist === true &&
        dayEndTime === "18:00" &&
        userRole === ""
      ) return;
  
    void saveState(user.id, {
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
      completedToday,
      dayEndTime,
      userRole,
      manualFocusTaskIds,
    } as any);
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
    completedToday,
    dayEndTime,
    userRole,
    manualFocusTaskIds,
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

const completionPercent =
  allTasks.length === 0
    ? 0
    : Math.round(
        (allTasks.filter((task) => task.completed).length / allTasks.length) *
          100
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
  if (todayTasks.length === 0) return;
  if (dayTimeRemaining.isOver) return;
  if (dayTimeRemaining.minutesLeft > 120 || dayTimeRemaining.minutesLeft <= 0) return;

  const dismissed = localStorage.getItem(dueReminderKey) === "dismissed";

  if (dismissed) return;

  setShowDueReminderPopup(true);
}, [
  isLoaded,
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
  setTodayTaskGroupMode("date");
  setTodayTaskSortMode("date");
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
              "Small Wins",
            notes: String(task.notes || ""),
            status: ["Active", "Waiting", "Someday"].includes(task.status)
              ? task.status
              : "Active",
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
  enableClipboardAssist,
  isExtractModalOpen,
  isEditModalOpen,
  showClipboardPrompt,
]);

useEffect(() => {
  if (enableClipboardAssist) return;

  setClipboardCandidate("");
  setShowClipboardPrompt(false);
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
const boostCacheKey = `momentum-boost-v2-${boostCacheDate}`;

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
          "Return exactly one encouraging sentence with a maximum of 18 words. Do not list tasks or use headings.",
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
    setSuggestingTaskIds((prev) => [...prev, taskId]);
  
    try {
      const response = await fetch("/api/suggest-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          whyThisMatters,
          categories: categories.map((category) => category.title),
          today: getTodayDate(),
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to suggest task details.");
      }
  
      const suggestion = data.suggestion;
  
      setCategories((prev) =>
        prev.map((category) => ({
          ...category,
          tasks: category.tasks.map((task: any) => {
            if (task.id !== taskId) {
              return task;
            }
  
            return {
              ...task,
              whyThisMatters: task.whyThisMatters || whyThisMatters,
              priority: suggestion.priority || task.priority,
              suggestedDueDate: suggestion.suggestedDueDate || task.suggestedDueDate,
              status: suggestion.status || task.status || "Active",
              notes: suggestion.notes || task.notes || "",
              tags: normalizeTaskTags(suggestion.tags || task.tags),
              aiReason:
                suggestion.reason ||
                task.aiReason ||
                "Momentuhm reviewed this task with your reason in mind.",
              aiConfidence:
                typeof suggestion.confidence === "number"
                  ? suggestion.confidence
                  : task.aiConfidence || 0.7,
            };
          }),
        }))
      );
  
      if (
        suggestion.category &&
        categories.some((category) => category.title === suggestion.category)
      ) {
        setCategories((prev) => {
          const taskToMove = prev
            .flatMap((category) =>
              category.tasks.map((task: any) => ({
                ...task,
                categoryTitle: category.title,
              }))
            )
            .find((task: any) => task.id === taskId);
  
          if (!taskToMove) return prev;
          if (taskToMove.categoryTitle === suggestion.category) return prev;
  
          const cleanedCategories = prev.map((category) => ({
            ...category,
            tasks: category.tasks.filter((task: any) => task.id !== taskId),
          }));
  
          return cleanedCategories.map((category) => {
            if (category.title !== suggestion.category) {
              return category;
            }
  
            const movedTask = {
              ...taskToMove,
              whyThisMatters: taskToMove.whyThisMatters || whyThisMatters,
              priority: suggestion.priority || taskToMove.priority,
              suggestedDueDate:
                suggestion.suggestedDueDate || taskToMove.suggestedDueDate,
              status: suggestion.status || taskToMove.status || "Active",
              notes: suggestion.notes || taskToMove.notes || "",
              tags: normalizeTaskTags(suggestion.tags || taskToMove.tags),
              aiReason:
                suggestion.reason ||
                taskToMove.aiReason ||
                "Momentuhm reviewed this task.",
              aiConfidence:
                typeof suggestion.confidence === "number"
                  ? suggestion.confidence
                  : taskToMove.aiConfidence || 0.7,
            };
  
            delete movedTask.categoryTitle;
  
            return {
              ...category,
              tasks: [movedTask, ...category.tasks],
            };
          });
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSuggestingTaskIds((prev) => prev.filter((id) => id !== taskId));
    }
  };

  const generateWhySuggestions = async (title: string) => {
    const response = await fetch("/api/why-matters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        role: userRole || "professional",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate why suggestions.");
    }

    return Array.isArray(data.suggestions) ? data.suggestions : [];
  };

  const selectWhySuggestion = (taskId: string, suggestion: string, index: number) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        tasks: category.tasks.map((task: any) =>
          task.id === taskId
            ? {
                ...task,
                whyThisMatters: suggestion,
                selectedWhyIndex: index,
                aiReason: suggestion,
              }
            : task
        ),
      }))
    );
  };

  /* ------------------------------------------------ */
  /* Add Task */
  /* ------------------------------------------------ */
  const addTask = async () => {
    if (!newTask.trim()) return;
  
    const title = newTask.trim();
    const manualWhy = newTaskWhy.trim();
  
    const categoryTitle =
      selectedCategory || categories[0]?.title || "Small Wins";
  
    const priority: Priority = enableAutoPriority ? inferPriority(title) : "Medium";
  
    const suggestedDueDate = enableAppSuggestions
      ? suggestDueDate(title)
      : undefined;
  
    const taskId = crypto.randomUUID();
    const initialWhy = manualWhy || "Momentuhm is finding why this matters...";
  
    const taskToAdd = {
      id: taskId,
      title,
      whyThisMatters: initialWhy,
      whySuggestions: manualWhy ? [manualWhy] : [],
      selectedWhyIndex: 0,
      priority,
      dueDate: undefined,
      suggestedDueDate,
      notes: "",
      status: "Active",
      tags: [],
      subtasks: [],
      aiReason: initialWhy,
      aiConfidence: manualWhy ? 0.95 : 0.5,
      completed: false,
      createdAt: new Date().toISOString(),
    };
  
    setCategories((prev) =>
      prev.map((category) => {
        if (category.title === categoryTitle) {
          return {
            ...category,
            tasks: [taskToAdd, ...category.tasks],
          };
        }
  
        return category;
      })
    );
  
    setNewTask("");
    setNewTaskWhy("");
    
    anchorTaskListSoon();
  
    try {
      if (!manualWhy) {
        setSuggestingTaskIds((prev) => [...prev, taskId]);

        const whySuggestions = await generateWhySuggestions(title);
        const bestWhy =
          whySuggestions[0] ||
          "This task may support meaningful progress on active work.";

        setCategories((prev) =>
          prev.map((category) => ({
            ...category,
            tasks: category.tasks.map((task: any) =>
              task.id === taskId
                ? {
                    ...task,
                    whyThisMatters: bestWhy,
                    whySuggestions,
                    selectedWhyIndex: 0,
                    aiReason: bestWhy,
                    aiConfidence: 0.86,
                  }
                : task
            ),
          }))
        );
      }
      if (enableAppSuggestions) {
        await improveTaskWithAI(taskId, title, manualWhy);
        markTaskAsNew(taskId);
      } else {
        markTaskAsNew(taskId);
      }
    } catch (error) {
      console.error(error);

      setCategories((prev) =>
        prev.map((category) => ({
          ...category,
          tasks: category.tasks.map((task: any) =>
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
                  selectedWhyIndex: 0,
                  aiReason:
                    "This may deserve attention because it could unblock future work.",
                  aiConfidence: 0.6,
                }
              : task
          ),
        }))
      );
    } finally {
      setSuggestingTaskIds((prev) => prev.filter((id) => id !== taskId));
    }
  };


  const extractTasksFromText = async (sourceTextOverride?: string) => {
    const rawSourceText =
      typeof sourceTextOverride === "string"
        ? sourceTextOverride
        : extractInput;
  
    const sourceText = rawSourceText.trim();

    if (!sourceText) {
      setExtractError("Paste some text first.");
      return;
    }
  
    setExtractLoading(true);
    setExtractError("");
    setExtractedTasks([]);
  
    try {
      const response = await fetch("/api/extract-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sourceText,
          categories: categories.map((category) => category.title),
          today: getTodayDate(),
        }),
      });
  
      const responseText = await response.text();
  
      let data: any = null;
  
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.error("Extract API returned non-JSON response:", responseText);
  
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
            "Small Wins",
          notes: String(task.notes || ""),
          status: ["Active", "Waiting", "Someday"].includes(task.status)
            ? task.status
            : "Active",
          reason: String(task.reason || ""),
          confidence:
            typeof task.confidence === "number" ? task.confidence : 0.7,
          tags: normalizeTaskTags(task.tags),
        })
      );
  
      setExtractedTasks(normalizedTasks);
  
      if (normalizedTasks.length === 0) {
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
  
 const dismissClipboardCandidate = () => {
  setShowClipboardPrompt(false);
  setClipboardCandidate("");
  setClipboardExtractedTasks([]);
  setClipboardExtractError("");
  setClipboardExtractLoading(false);
};



  const addClipboardCandidateAsTask = () => {
    const sourceText = clipboardCandidate.trim();

    if (!sourceText) {
      dismissClipboardCandidate();
      return;
    }

    const title = getClipboardTaskTitle(sourceText);
    const categoryTitle = selectedCategory || categories[0]?.title || "Small Wins";
    const priority: Priority = enableAutoPriority ? inferPriority(title) : "Medium";
    const suggestedDueDate = enableAppSuggestions
      ? suggestDueDate(title)
      : undefined;
    const normalizedText = normalizeClipboardText(sourceText);

    const taskToAdd = {
      id: crypto.randomUUID(),
      title,
      whyThisMatters: "Captured from clipboard.",
      whySuggestions: ["Captured from clipboard."],
      selectedWhyIndex: 0,
      priority,
      dueDate: undefined,
      suggestedDueDate,
      notes: normalizedText === title ? "" : sourceText,
      status: "Active",
      tags: [],
      subtasks: [],
      aiReason: "Added directly from copied text.",
      aiConfidence: 1,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setCategories((prev) => {
      const targetCategoryTitle = prev.some(
        (category) => category.title === categoryTitle
      )
        ? categoryTitle
        : prev[0]?.title;

      if (!targetCategoryTitle) return prev;

      return prev.map((category) => {
        if (category.title !== targetCategoryTitle) return category;

        return {
          ...category,
          tasks: [taskToAdd, ...category.tasks],
        };
      });
    });

    markTaskAsNew(taskToAdd.id);

    setArchiveToast("Copied text added as task");

    setTimeout(() => {
      setArchiveToast("");
    }, 5000);

    dismissClipboardCandidate();
    setSelectedView("today");
    anchorTaskListSoon();
  };

  const toggleClipboardExtractedTask = (taskId: string) => {
    setClipboardExtractedTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              selected: !task.selected,
            }
          : task
      )
    );
  };
  
  const addSelectedClipboardExtractedTasks = () => {
    const selectedTasks = clipboardExtractedTasks.filter((task) => task.selected);
  
    if (selectedTasks.length === 0) {
      setClipboardExtractError("Select at least one task to add.");
      return;
    }
  
    setCategories((prev) =>
      prev.map((category) => {
        const tasksForCategory = selectedTasks
          .filter((task) => task.category === category.title)
          .map((task) => {
            const newId = crypto.randomUUID();
            markTaskAsNew(newId);

            return {
              id: newId,
              title: task.title,
              priority: task.priority,
              dueDate: undefined,
              suggestedDueDate: task.suggestedDueDate || undefined,
              notes: task.notes,
              status: task.status,
              whyThisMatters: task.reason || "",
              whySuggestions: task.reason ? [task.reason] : [],
              selectedWhyIndex: 0,
              aiReason: task.reason,
              aiConfidence: task.confidence,
              tags: normalizeTaskTags(task.tags),
              subtasks: [],
              completed: false,
              createdAt: new Date().toISOString(),
            };
          });
  
        if (tasksForCategory.length === 0) return category;
  
        return {
          ...category,
          tasks: [...tasksForCategory, ...category.tasks],
        };
      })
    );
  
    setArchiveToast(
      `${selectedTasks.length} task${
        selectedTasks.length === 1 ? "" : "s"
      } added from clipboard`
    );
  
    setTimeout(() => {
      setArchiveToast("");
    }, 2200);
  
    dismissClipboardCandidate();
    setSelectedView("today");
    anchorTaskListSoon();
  };

  const toggleExtractedTask = (taskId: string) => {
    setExtractedTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              selected: !task.selected,
            }
          : task
      )
    );
  };
  
  const addSelectedExtractedTasks = () => {
    const selectedTasks = extractedTasks.filter((task) => task.selected);
  
    if (selectedTasks.length === 0) {
      setExtractError("Select at least one task to add.");
      return;
    }
  
    setCategories((prev) =>
      prev.map((category) => {
        const tasksForCategory = selectedTasks
          .filter((task) => task.category === category.title)
          .map((task) => {
            const newId = crypto.randomUUID();
            markTaskAsNew(newId);

            return {
              id: newId,
              title: task.title,
              priority: task.priority,
              dueDate: undefined,
              suggestedDueDate: task.suggestedDueDate || undefined,
              notes: task.notes,
              status: task.status,
              whyThisMatters: task.reason || "",
              whySuggestions: task.reason ? [task.reason] : [],
              selectedWhyIndex: 0,
              aiReason: task.reason,
              aiConfidence: task.confidence,
              tags: normalizeTaskTags(task.tags),
              subtasks: [],
              completed: false,
              createdAt: new Date().toISOString(),
            };
          });
  
        if (tasksForCategory.length === 0) {
          return category;
        }
  
        return {
          ...category,
          tasks: [...tasksForCategory, ...category.tasks],
        };
      })
    );
  
    setArchiveToast(
      `${selectedTasks.length} extracted task${
        selectedTasks.length === 1 ? "" : "s"
      } added`
    );
  
    setTimeout(() => {
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

  const toggleTaskById = (taskId: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
  
    triggerFirecracker(rect.left + rect.width / 2, rect.top + rect.height / 2);
  
    const taskWithCategory = categories
      .flatMap((category) =>
        category.tasks.map((task: any) => ({
          ...task,
          category: category.title,
        }))
      )
      .find((task: any) => task.id === taskId);
  
    if (!taskWithCategory) return;
  
    const isAlreadyCompleted = Boolean(taskWithCategory.completed);
  
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        tasks: category.tasks.map((task: any) =>
          task.id === taskId
            ? {
                ...task,
                completed: !isAlreadyCompleted,
                completedAt: isAlreadyCompleted
                  ? undefined
                  : new Date().toISOString(),
              }
            : task
        ),
      }))
    );
  
    if (isAlreadyCompleted) {
      setCompletedToday((prev) => prev.filter((task) => task.id !== taskId));
      anchorTaskListSoon();
      return;
    }
  
    setCompletedToday((prev) => [
      {
        ...taskWithCategory,
        completed: true,
        completedAt: new Date().toISOString(),
      },
      ...prev.filter((task) => task.id !== taskId),
    ]);
    
    anchorCompletedSectionSoon();
  };

  /* ------------------------------------------------ */
  /* Restore Completed Task */
  /* ------------------------------------------------ */

  const restoreCompletedTask = (taskId: string) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        tasks: category.tasks.map((task: any) =>
          task.id === taskId
            ? {
                ...task,
                completed: false,
                completedAt: undefined,
              }
            : task
        ),
      }))
    );
  
    setCompletedToday((prev) => prev.filter((task) => task.id !== taskId));
    anchorTaskListSoon();
  };


  const togglePinTask = (taskId: string) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        tasks: category.tasks.map((task: any) =>
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

  /* ------------------------------------------------ */
  /* Delete Task */
  /* ------------------------------------------------ */

  const deleteTask = (taskId: string) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        tasks: category.tasks.filter((task: any) => task.id !== taskId),
      }))
    );
  };

  const deleteTaskEverywhere = (taskId: string) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        tasks: category.tasks.filter((task: any) => task.id !== taskId),
      }))
    );
  
    setCompletedToday((prev) => prev.filter((task) => task.id !== taskId));
    setArchive((prev) => prev.filter((task) => task.id !== taskId));
  
    setIsEditModalOpen(false);
    setSelectedTask(null);
  };
  
  const completeTaskFromModal = (taskId: string) => {
    const taskWithCategory = categories
      .flatMap((category) =>
        category.tasks.map((task: any) => ({
          ...task,
          category: category.title,
        }))
      )
      .find((task: any) => task.id === taskId);
  
    if (!taskWithCategory) return;
  
    const completedAt = new Date().toISOString();
  
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        tasks: category.tasks.map((task: any) =>
          task.id === taskId
            ? {
                ...task,
                completed: true,
                completedAt,
              }
            : task
        ),
      }))
    );
  
    setCompletedToday((prev) => [
      {
        ...taskWithCategory,
        completed: true,
        completedAt,
      },
      ...prev.filter((task) => task.id !== taskId),
    ]);
  
    setIsEditModalOpen(false);
    setSelectedTask(null);
    anchorCompletedSectionSoon();
  };

  /* ------------------------------------------------ */
  /* Schedule Task */
  /* ------------------------------------------------ */

  const scheduleTaskById = (taskId: string, dueDate: string) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        tasks: category.tasks.map((task: any) => {
          if (task.id !== taskId) {
            return task;
          }

          return {
            ...task,
            dueDate,
            suggestedDueDate: undefined,
            aiReason: "You manually scheduled this task.",
            aiConfidence: 1,
          };
        }),
      }))
    );
  };

  /* ------------------------------------------------ */
  /* Accept Suggested Date */
  /* ------------------------------------------------ */

  const acceptSuggestedDateById = (taskId: string) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        tasks: category.tasks.map((task: any) => {
          if (task.id !== taskId) {
            return task;
          }

          if (!task.suggestedDueDate) {
            return task;
          }

          return {
            ...task,
            dueDate: task.suggestedDueDate,
            suggestedDueDate: undefined,
            aiReason: "You accepted Momentuhm's app-suggested date.",
            aiConfidence: 1,
          };
        }),
      }))
    );
  };

  const acceptAllSuggestedDates = () => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        tasks: category.tasks.map((task: any) => {
          if (task.dueDate || !task.suggestedDueDate) {
            return task;
          }
  
          return {
            ...task,
            dueDate: task.suggestedDueDate,
            suggestedDueDate: undefined,
            aiReason: "You accepted Momentuhm's app-suggested date.",
            aiConfidence: 1,
          };
        }),
      }))
    );
  
    setIsSuggestionsModalOpen(false);
  };

  /* ------------------------------------------------ */
  /* Save Task Changes */
  /* ------------------------------------------------ */

  const saveTaskChanges = (updatedTask: any) => {
    if (!updatedTask?.title?.trim()) return;

    const title = updatedTask.title.trim();
const whyThisMatters = String(updatedTask.whyThisMatters || "").trim();
const priority: Priority = updatedTask.priority || inferPriority(title);

    setCategories((prev) => {
      const cleanedCategories = prev.map((category) => ({
        ...category,
        tasks: category.tasks.filter((task: any) => task.id !== updatedTask.id),
      }));

      return cleanedCategories.map((category) => {
        if (category.title === updatedTask.category) {
          return {
            ...category,
            tasks: [
              {
                id: updatedTask.id,
                title,
                whyThisMatters,
                priority,
                dueDate: updatedTask.dueDate || undefined,
                suggestedDueDate: updatedTask.dueDate
                ? undefined
                : enableAppSuggestions
                ? suggestDueDate(title)
                : undefined,
                notes: updatedTask.notes || "",
                status: updatedTask.status || "Active",
                aiReason:
                  updatedTask.aiReason ||
                  (enableAppSuggestions
                    ? getAppSuggestionReason(title, priority)
                    : "App suggestions are turned off."),
                aiConfidence: updatedTask.aiConfidence || 0.72,
                tags: normalizeTaskTags(updatedTask.tags),
                subtasks: getTaskSubtasks(updatedTask),
                whySuggestions: updatedTask.whySuggestions || [],
                selectedWhyIndex: updatedTask.selectedWhyIndex || 0,
                completed: Boolean(updatedTask.completed),
completedAt: updatedTask.completedAt,
pinned: Boolean(updatedTask.pinned),
createdAt: updatedTask.createdAt || new Date().toISOString(),
              },
              ...category.tasks,
            ],
          };
        }

        return category;
      });
    });

    setIsEditModalOpen(false);
    setSelectedTask(null);
  };

  /* ------------------------------------------------ */
  /* Archive Completed Today */
  /* ------------------------------------------------ */

  const archiveCompletedToday = () => {
    if (completedToday.length === 0) return;
  
    const completedIds = completedToday.map((task) => task.id);
  
    setArchive((prev) => [...completedToday, ...prev]);
  
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        tasks: category.tasks.filter(
          (task: any) => !completedIds.includes(task.id)
        ),
      }))
    );
  
    setCompletedToday([]);
  
    setArchiveToast(
      `${completedToday.length} completed item${
        completedToday.length > 1 ? "s" : ""
      } archived`
    );
  
    setTimeout(() => {
      setArchiveToast("");
    }, 2200);
  };

  const clearArchive = () => {
    if (archive.length === 0) return;

    const confirmed = window.confirm("Clear all archived items permanently?");
    if (!confirmed) return;

    setArchive([]);
    setArchiveToast("Archived items cleared");

    setTimeout(() => {
      setArchiveToast("");
    }, 2200);
  };

  /* ------------------------------------------------ */
  /* Reset App Data */
  /* ------------------------------------------------ */

  const resetAppData = () => {
    const confirmed = window.confirm(
      "Reset all Momentuhm data? This will delete active tasks, completed tasks, and archived items."
    );

    if (!confirmed) return;

    setCategories(initialCategories);
    setArchive([]);
    setCompletedToday([]);
    setManualFocusTaskIds([]);
    setSelectedCategory(initialCategories[0].title);
    setSelectedView("today");
    setTodayTaskSortMode("date");
    setTodayTaskGroupMode("none");
    setThemeColor(DEFAULT_THEME_COLOR);
    setDarkMode(false);
    
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(MOBILE_GROUP_MODE_KEY);
    }

    setArchiveToast("Momentuhm data reset");

    setTimeout(() => {
      setArchiveToast("");
    }, 2200);
  };

  /* ------------------------------------------------ */
  /* Category Actions */
  /* ------------------------------------------------ */

  const addCategory = () => {
    if (!newCategory.trim()) return;

    const categoryToAdd: Category = {
      id: crypto.randomUUID(),
      title: newCategory.trim(),
      tasks: [],
    };

    setCategories((prev) => [...prev, categoryToAdd]);
    setSelectedCategory(categoryToAdd.title);
    setNewCategory("");
  };

  const renameCategory = (categoryId: string) => {
    if (!editingCategoryTitle.trim()) return;

    const oldCategory = categories.find((category) => category.id === categoryId);
    if (!oldCategory) return;

    const newTitle = editingCategoryTitle.trim();

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

    const confirmed = window.confirm(
      `Delete "${categoryToDelete.title}" and all tasks inside it?`
    );

    if (!confirmed) return;

    const remainingCategories = categories.filter(
      (category) => category.id !== categoryId
    );

    setCategories(remainingCategories);

    if (selectedCategory === categoryToDelete.title) {
      setSelectedCategory(remainingCategories[0]?.title || "");
    }

    if (editingCategoryId === categoryId) {
      setEditingCategoryId(null);
      setEditingCategoryTitle("");
    }
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
  setDarkMode={setDarkMode}
  selectedView={selectedView}
  setSelectedView={setSelectedView}
  themeColor={themeColor}
  inboxCount={inboxTasks.length}
  pendingSuggestionCount={suggestionReviewTasks.length}
  onOpenSuggestedDates={() =>
    setIsSuggestionsModalOpen(true)
  }
/>

<div className="relative z-10 min-h-screen w-full overflow-x-hidden">
  <div className="w-full min-w-0 overflow-x-hidden px-3 pb-28 pt-5 sm:px-5 sm:pb-28 sm:pt-[96px] md:px-6 lg:pl-[276px] lg:pr-6 2xl:pb-16 2xl:pr-8">
    <div className="w-full min-w-0 overflow-x-hidden">
            {selectedView === "today" && (
            <TodayView
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            themeColor={themeColor}
            glass={glass}
            strongerGlass={strongerGlass}
            border={border}
            allTasks={allTasks}
            prioritizedTasks={prioritizedTasks}
taskSortMode={todayTaskSortMode}
setTaskSortMode={setTodayTaskSortMode}
taskGroupMode={todayTaskGroupMode}
setTaskGroupMode={setTodayTaskGroupMode}
highPriorityCount={highPriorityCount}
            dueSoonCount={dueSoonCount}
            completionPercent={completionPercent}
            suggestedDateCount={suggestedDateCount}
            completedToday={completedToday}
            boostMessage={boostMessage}
            boostLoading={boostLoading}
            dayEndTime={dayEndTime}
            setDayEndTime={setDayEndTime}
            dayTimeRemaining={dayTimeRemaining}
            newTask={newTask}
setNewTask={setNewTask}
newTaskWhy={newTaskWhy}
setNewTaskWhy={setNewTaskWhy}
addTask={addTask}
            toggleTaskById={toggleTaskById}
            deleteTask={deleteTask}
            acceptSuggestedDateById={acceptSuggestedDateById}
            setSelectedTask={setSelectedTask}
            setIsEditModalOpen={setIsEditModalOpen}
            setIsSuggestionsModalOpen={setIsSuggestionsModalOpen}
            setIsExtractModalOpen={setIsExtractModalOpen}
            setExtractInput={setExtractInput}
            archiveCompletedToday={archiveCompletedToday}
            restoreCompletedTask={restoreCompletedTask}
            suggestingTaskIds={suggestingTaskIds}
            manualFocusTaskIds={manualFocusTaskIds}
            setManualFocusTaskIds={setManualFocusTaskIds}
togglePinTask={togglePinTask}
            selectWhySuggestion={selectWhySuggestion}
            taskListRef={taskListRef}
            anchorTaskListSoon={anchorTaskListSoon}
newlyAddedTaskIds={newlyAddedTaskIds}
userFirstName={user?.firstName || ""}
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
            setViewMode={setPriorityViewMode}
            highPriorityTasks={highPriorityTasks}
            mediumPriorityTasks={mediumPriorityTasks}
            lowPriorityTasks={lowPriorityTasks}
            completedToday={completedToday}
            archiveCompletedToday={archiveCompletedToday}
            restoreCompletedTask={restoreCompletedTask}
            toggleTaskById={toggleTaskById}
            deleteTask={deleteTask}
            setSelectedTask={setSelectedTask}
            setIsEditModalOpen={setIsEditModalOpen}
          />
            )}

            {selectedView === "upcoming" && (
              <UpcomingView
                darkMode={darkMode}
                border={border}
                className={strongerGlass}
                themeColor={themeColor}
                viewMode={upcomingViewMode}
                setViewMode={setUpcomingViewMode}
                todayTasks={todayTasks}
                tomorrowTasks={tomorrowTasks}
                laterTasks={laterTasks}
                noDateTasks={noDateTasks}
                toggleTaskById={toggleTaskById}
                deleteTask={deleteTask}
                acceptSuggestedDateById={acceptSuggestedDateById}
                setSelectedTask={setSelectedTask}
                setIsEditModalOpen={setIsEditModalOpen}
              />
            )}

            {selectedView === "inbox" && (
              <InboxView
                darkMode={darkMode}
                border={border}
                className={strongerGlass}
                themeColor={themeColor}
                inboxTasks={inboxTasks}
                enableAppSuggestions={enableAppSuggestions}
                toggleTaskById={toggleTaskById}
                deleteTask={deleteTask}
                scheduleTaskById={scheduleTaskById}
                setSelectedTask={setSelectedTask}
                setIsEditModalOpen={setIsEditModalOpen}
              />
            )}

            {selectedView === "archive" && (
             <ArchiveView
             archive={archive}
             clearArchive={clearArchive}
             glass={glass}
             strongerGlass={strongerGlass}
             border={border}
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
    setUserRole={setUserRole}
    enableAppSuggestions={enableAppSuggestions}
    setEnableAppSuggestions={setEnableAppSuggestions}
    enableAutoPriority={enableAutoPriority}
    setEnableAutoPriority={setEnableAutoPriority}
    enableClipboardAssist={enableClipboardAssist}
    setEnableClipboardAssist={setEnableClipboardAssist}
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

<AnimatePresence>
  {showDueReminderPopup && todayTasks.length > 0 && (
    <DueTasksReminderPopup
      tasks={todayTasks}
      themeColor={themeColor}
      onClose={closeDueReminderPopup}
      onViewAll={viewDueReminderTasks}
      onOpenTask={openDueReminderTask}
    />
  )}

{CLIPBOARD_ASSIST_ENABLED_FOR_TESTING &&
  showClipboardPrompt &&
  clipboardCandidate && (
    <ClipboardAssistPrompt
   text={clipboardCandidate}
   themeColor={themeColor}
   darkMode={darkMode}
   loading={clipboardExtractLoading}
   error={clipboardExtractError}
   extractedTasks={clipboardExtractedTasks}
   onClose={dismissClipboardCandidate}
   onAddAsIs={addClipboardCandidateAsTask}
   onToggleTask={toggleClipboardExtractedTask}
   onAddSelected={addSelectedClipboardExtractedTasks}
 />
  )}

{isExtractModalOpen && (
  <ExtractTasksModal
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
   selectedTask={selectedTask}
   setSelectedTask={setSelectedTask}
   setIsEditModalOpen={setIsEditModalOpen}
   saveTaskChanges={saveTaskChanges}
   completeTaskFromModal={completeTaskFromModal}
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
   setManualFocusTaskIds={setManualFocusTaskIds}
 />
  )}
</AnimatePresence>


<style jsx global>{`
  html {
    scrollbar-gutter: stable;
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
/* Views */
/* ------------------------------------------------ */

function TodayView({
  darkMode,
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
  deleteTask,
  acceptSuggestedDateById,
  setSelectedTask,
  setIsEditModalOpen,
  setIsSuggestionsModalOpen,
  setIsExtractModalOpen,
  setExtractInput,
  archiveCompletedToday,
  restoreCompletedTask,
  suggestingTaskIds,
  manualFocusTaskIds,
  setManualFocusTaskIds,
  togglePinTask,
  selectWhySuggestion,
  taskListRef,
  anchorTaskListSoon,
  newlyAddedTaskIds,
  userFirstName,
}: any) {
  const [showMorningBrief, setShowMorningBrief] = useState(false);
  const taskInputRef = useRef<HTMLInputElement | null>(null);

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
    const pastedText = event.clipboardData.getData("text").trim();
    const shouldExtract = pastedText.includes("\n") || pastedText.length >= 120;

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

  const insightText = boostLoading
    ? "Creating today’s insight..."
    : completedToday.length > 0
    ? boostMessage || "You’re building momentum. Keep it going."
    : showMorningBrief
    ? formatSingleLineInsight(morningBrief.quote)
    : "You’re building momentum. Keep it going.";

  return (
    <>
      <MobileTodayAppView
        darkMode={darkMode}
        themeColor={themeColor}
        strongerGlass={strongerGlass}
        border={border}
        allTasks={allTasks}
        prioritizedTasks={prioritizedTasks}
        completedToday={completedToday}
        completionPercent={completionPercent}
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
                        className={`mt-1.5 line-clamp-2 text-[13px] font-[500] leading-5 ${mutedText}`}
                      >
                        {insightText}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: "Tasks",
                        value: allTasks.length,
                        valueClass: darkMode ? "text-blue-300" : "text-blue-600",
                      },
                      {
                        label: "Completed",
                        value: completedToday.length,
                        valueClass: darkMode ? "text-emerald-300" : "text-emerald-600",
                      },
                      {
                        label: "Progress",
                        value: `${completionPercent}%`,
                        valueClass: darkMode ? "text-violet-300" : "text-violet-600",
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
              <section className="relative mb-5">
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

              <TaskListPanel
                title="Today"
                description="Your active tasks"
                tasks={prioritizedTasks}
                sortMode={taskSortMode}
                setSortMode={setTaskSortMode}
                groupMode={taskGroupMode}
                setGroupMode={setTaskGroupMode}
                darkMode={darkMode}
                border={border}
                className={strongerGlass}
                themeColor="#181818"
                toggleTaskById={toggleTaskById}
                suggestingTaskIds={suggestingTaskIds}
                deleteTask={deleteTask}
                acceptSuggestedDateById={acceptSuggestedDateById}
                setSelectedTask={setSelectedTask}
                setIsEditModalOpen={setIsEditModalOpen}
                emptyMessage="Add a task. Momentuhm will organize it for you."
                ranked
                draggableTasks
                manualFocusTaskIds={manualFocusTaskIds}
                setManualFocusTaskIds={setManualFocusTaskIds}
                togglePinTask={togglePinTask}
                selectWhySuggestion={selectWhySuggestion}
                taskListRef={taskListRef}
                anchorTaskListSoon={anchorTaskListSoon}
                newlyAddedTaskIds={newlyAddedTaskIds}
                onFocusCapture={() => taskInputRef.current?.focus()}
              />

              <CompletedTodaySection
                sectionId="Momentuhm-desktop-completed-anchor"
                completedToday={completedToday}
                restoreCompletedTask={restoreCompletedTask}
                archiveCompletedToday={archiveCompletedToday}
                darkMode={darkMode}
                border={border}
              />
            </section>

            {/* Right: focus execution */}
            <aside
  aria-label="Focus workspace"
  className={`min-w-0 self-start rounded-[14px] border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] xl:p-6 ${dashboardBorder} ${dashboardSurface}`}
>
              <FocusModePanel
                prioritizedTasks={prioritizedTasks}
                completedToday={completedToday}
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

function MobileTodayAppView({
  darkMode,
  themeColor,
  strongerGlass,
  border,
  allTasks,
  prioritizedTasks,
  completedToday,
  completionPercent,
  dayTimeRemaining,
  dayEndTime,
  setDayEndTime,
  newTask,
  setNewTask,
  newTaskWhy,
  setNewTaskWhy,
  addTask,
  setIsExtractModalOpen,
  toggleTaskById,
  deleteTask,
  setSelectedTask,
  setIsEditModalOpen,
  manualFocusTaskIds,
  setManualFocusTaskIds,
  archiveCompletedToday,
  restoreCompletedTask,
  anchorTaskListSoon = () => {},
userFirstName = "",
}: any) {
  const [mobileGroupMode, setMobileGroupMode] =
  useState<MobileGroupMode>("category");
  const [selectedChip, setSelectedChip] = useState("");
  const [showAllMobileTasks, setShowAllMobileTasks] = useState(false);
  const [isMobileTimePickerOpen, setIsMobileTimePickerOpen] = useState(false);
  const [mobileWorkspaceMode, setMobileWorkspaceMode] =
    useState<"tasks" | "focus">("tasks");

    useEffect(() => {
      if (typeof window === "undefined") return;
    
      const openTasksWorkspace = () => {
        setMobileWorkspaceMode("tasks");
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
  if (typeof window === "undefined") return;

  const openFocusWorkspace = () => {
    setMobileWorkspaceMode("focus");

    window.setTimeout(() => {
      document
        .getElementById("Momentuhm-mobile-workspace-anchor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  window.addEventListener("momentuhm:open-focus", openFocusWorkspace);

  return () => {
    window.removeEventListener("momentuhm:open-focus", openFocusWorkspace);
  };
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;

  const savedMobileGroupMode = window.localStorage.getItem(
    MOBILE_GROUP_MODE_KEY
  );

  if (
    savedMobileGroupMode === "category" ||
    savedMobileGroupMode === "priority" ||
    savedMobileGroupMode === "date"
  ) {
    setMobileGroupMode(savedMobileGroupMode);
  }
}, []);

const changeMobileGroupMode = (nextMode: MobileGroupMode) => {
  setMobileGroupMode(nextMode);
  setSelectedChip("");
  setShowAllMobileTasks(false);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(MOBILE_GROUP_MODE_KEY, nextMode);
  }

  anchorTaskListSoon();
};

const getMobileDateGroup = (task: any) => {
  const date = getTaskDate(task);

  if (!date) {
    return {
      key: "date:no-date",
      label: "No date",
      order: 5,
    };
  }

  if (isOverdue(date)) {
    return {
      key: "date:overdue",
      label: "Overdue",
      order: 1,
    };
  }

  if (isToday(date)) {
    return {
      key: "date:today",
      label: "Today",
      order: 2,
    };
  }

  if (isTomorrow(date)) {
    return {
      key: "date:tomorrow",
      label: "Tomorrow",
      order: 3,
    };
  }

  return {
    key: "date:later",
    label: "Later",
    order: 4,
  };
};

const mobileGroupTabs = useMemo((): any[] => {
  if (mobileGroupMode === "priority") {
    const priorityOrder = ["High", "Medium", "Low"];

    return priorityOrder
      .map((priority) => {
        const count = prioritizedTasks.filter(
          (task: any) => task.priority === priority
        ).length;

        return {
          key: `priority:${priority}`,
          label: priority === "Medium" ? "Mid" : priority,
          count,
          order: priorityOrder.indexOf(priority),
        };
      })
      .filter((tab) => tab.count > 0);
  }

  if (mobileGroupMode === "date") {
    const dateGroups = prioritizedTasks.reduce(
      (acc: Record<string, any>, task: any) => {
        const group = getMobileDateGroup(task);
    
        if (!acc[group.key]) {
          acc[group.key] = {
            ...group,
            count: 0,
          };
        }
    
        acc[group.key].count += 1;
        return acc;
      },
      {} as Record<string, any>
    );

    return Object.values(dateGroups).sort((a: any, b: any) => a.order - b.order);
  }

  const categoryGroups = prioritizedTasks.reduce(
    (acc: Record<string, any>, task: any) => {
      const category = task.category || "No Category";
  
      if (!acc[category]) {
        const label =
          category === "Major Projects"
            ? "Projects"
            : category === "Small Wins"
            ? "Wins"
            : category === "Self Growth"
            ? "Growth"
            : category;
  
        acc[category] = {
          key: `category:${category}`,
          label,
          category,
          count: 0,
          order: Object.keys(acc).length,
        };
      }
  
      acc[category].count += 1;
      return acc;
    },
    {} as Record<string, any>
  );

  return Object.values(categoryGroups).sort((a: any, b: any) => a.order - b.order);
}, [mobileGroupMode, prioritizedTasks]);

const activeChip = selectedChip || mobileGroupTabs[0]?.key || "";

useEffect(() => {
  if (mobileGroupTabs.length === 0) {
    if (selectedChip) setSelectedChip("");
    return;
  }

  const selectedStillExists = mobileGroupTabs.some(
    (tab: any) => tab.key === selectedChip
  );

  if (!selectedChip || !selectedStillExists) {
    setSelectedChip(mobileGroupTabs[0].key);
  }
}, [mobileGroupTabs, selectedChip]);

const filteredTasks = activeChip
  ? prioritizedTasks.filter((task: any) => {
      if (mobileGroupMode === "priority") {
        return `priority:${task.priority}` === activeChip;
      }

      if (mobileGroupMode === "date") {
        return getMobileDateGroup(task).key === activeChip;
      }

      return `category:${task.category || "No Category"}` === activeChip;
    })
  : prioritizedTasks;

  const visibleTasks = showAllMobileTasks
    ? filteredTasks
    : filteredTasks.slice(0, 4);

  const hiddenCount = Math.max(filteredTasks.length - 4, 0);

  const focusTasks =
    manualFocusTaskIds.length > 0
      ? manualFocusTaskIds
          .map((taskId: string) =>
            prioritizedTasks.find((task: any) => task.id === taskId)
          )
          .filter(Boolean)
      : prioritizedTasks.slice(0, 3);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const mobileEndTimeParts = (() => {
      const [hours, minutes] = dayEndTime.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
      return {
        hour: displayHour,
        minute: String(minutes).padStart(2, "0"),
        period,
        label: `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`,
      };
    })();
  
    const displayEndTime = mobileEndTimeParts.label;
  
    const mobileHourOptions = Array.from({ length: 12 }, (_, index) => index + 1);
    const mobileMinuteOptions = Array.from({ length: 12 }, (_, index) =>
      String(index * 5).padStart(2, "0")
    );
  
    const updateMobileEndTime = (
      nextHour: number,
      nextMinute: string,
      nextPeriod: "AM" | "PM"
    ) => {
      let hour24 = nextHour;
  
      if (nextPeriod === "AM" && nextHour === 12) hour24 = 0;
      if (nextPeriod === "PM" && nextHour !== 12) hour24 = nextHour + 12;
  
      setDayEndTime(`${String(hour24).padStart(2, "0")}:${nextMinute}`);
    };

  const addTaskToFocus = (taskId: string) => {
    setManualFocusTaskIds((prev: string[]) => {
      if (prev.includes(taskId)) return prev;
      if (prev.length >= 3) return prev;

      return [...prev, taskId];
    });
  };

  return (
    <div className="sm:hidden">
      <div className="mb-5">
  <div className="mb-4 flex items-center justify-between gap-4">
  <div className="flex items-center gap-3">
  <div
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
    style={{
      backgroundColor: darkMode ? "#FFFFFF" : "#1F2937",
      color: darkMode ? "#1F2937" : "#FFFFFF",
    }}
  >
    <svg
      width="27"
      height="27"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7.5 18.6L14.2 25.2L29 10.3"
        stroke="currentColor"
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M24.8 10.4H29V14.6"
        stroke="currentColor"
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />

      <path
        d="M6.5 10.2H15.5"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity="0.35"
      />

      <path
        d="M4.8 14.2H10.8"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity="0.22"
      />
    </svg>
  </div>

  <div className="min-w-0">
    <p
      className="text-[25px] font-[900] leading-none tracking-[-0.055em]"
      style={{ color: darkMode ? "#FFFFFF" : "#000000" }}
    >
      Momentuhm
    </p>

    <p
      className="mt-1.5 whitespace-nowrap text-[9px] font-[800] uppercase leading-none tracking-[0.04em]"
      style={{ color: darkMode ? "#FFFFFF" : "#000000" }}
    >
      Focus. Prioritize. Move forward.
    </p>
  </div>
</div>

    <div
      className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-[11px] font-[850] ${
        darkMode
          ? "border-white/[0.08] bg-white/[0.045] text-white/48"
          : "border-black/[0.06] bg-white text-[#666661]/45"
      }`}
    >
      <Sparkles size={13} style={{ color: themeColor }} />
      Today
    </div>
  </div>

  <div>
  <p className="text-[18px] font-[900] tracking-[-0.04em]">
  {greeting}
  {userFirstName ? `, ${userFirstName}` : ""} 👋
</p>

    <p
      className={
        darkMode
          ? "mt-1 text-xs font-[700] text-white/42"
          : "mt-1 text-xs font-[700] text-[#666661]/42"
      }
    >
      Let&apos;s make today count.
    </p>
  </div>
</div>

    

<section
        className="relative mb-4 overflow-hidden rounded-[26px] px-4 py-3.5 text-white shadow-[0_18px_48px_rgba(17,24,39,0.16)]"
        style={{
          background: `linear-gradient(135deg, ${themeColor}, ${themeColor}CC)`,
        }}
      >
        <div className="pointer-events-none absolute -right-10 -top-16 h-32 w-32 rounded-full bg-white/18 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-12 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[24px] font-[950] leading-none tracking-[-0.065em]">
                {dayTimeRemaining.shortLabel}
              </p>

              <button
                onClick={() => setIsMobileTimePickerOpen((prev) => !prev)}
                className="mt-1 inline-flex items-center gap-1.5 rounded-full text-[11px] font-[850] text-white/78 active:scale-[0.98]"
              >
                Ends {displayEndTime}
                <ChevronDown
                  size={13}
                  className={`transition ${
                    isMobileTimePickerOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <button
              onClick={() => setIsMobileTimePickerOpen((prev) => !prev)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.18] transition active:scale-95"
              title="Edit day end time"
            >
              <Clock3 size={17} />
            </button>
          </div>

          {isMobileTimePickerOpen && (
            <div className="mt-3 rounded-[20px] border border-white/[0.14] bg-white/[0.12] p-2.5 backdrop-blur-xl">
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={mobileEndTimeParts.hour}
                  onChange={(e) =>
                    updateMobileEndTime(
                      Number(e.target.value),
                      mobileEndTimeParts.minute,
                      mobileEndTimeParts.period as "AM" | "PM"
                    )
                  }
                  className="h-9 rounded-[14px] border border-white/[0.14] bg-white text-[12px] font-[900] text-[#666661] outline-none"
                >
                  {mobileHourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, "0")}
                    </option>
                  ))}
                </select>

                <select
                  value={mobileEndTimeParts.minute}
                  onChange={(e) =>
                    updateMobileEndTime(
                      mobileEndTimeParts.hour,
                      e.target.value,
                      mobileEndTimeParts.period as "AM" | "PM"
                    )
                  }
                  className="h-9 rounded-[14px] border border-white/[0.14] bg-white text-[12px] font-[900] text-[#666661] outline-none"
                >
                  {mobileMinuteOptions.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>

                <select
                  value={mobileEndTimeParts.period}
                  onChange={(e) =>
                    updateMobileEndTime(
                      mobileEndTimeParts.hour,
                      mobileEndTimeParts.minute,
                      e.target.value as "AM" | "PM"
                    )
                  }
                  className="h-9 rounded-[14px] border border-white/[0.14] bg-white text-[12px] font-[900] text-[#666661] outline-none"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              <button
                onClick={() => setIsMobileTimePickerOpen(false)}
                className="mt-2 h-8 w-full rounded-[14px] bg-white/[0.18] text-[11px] font-[900] text-white"
              >
                Done
              </button>
            </div>
          )}

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.22]">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${dayTimeRemaining.percentLeft}%` }}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="flex h-[56px] flex-col items-center justify-center rounded-[18px] bg-white/[0.13] px-3 py-2 text-center">
              <p className="text-[15px] font-[950] leading-none">
                {allTasks.length}
              </p>
              <p className="mt-0.5 text-[9.5px] font-[850] text-white/70">
                Tasks
              </p>
            </div>

            <div className="flex h-[56px] flex-col items-center justify-center rounded-[18px] bg-white/[0.13] px-3 py-2 text-center">
              <p className="text-[15px] font-[950] leading-none">
                {completedToday.length}
              </p>
              <p className="mt-0.5 text-[9.5px] font-[850] text-white/70">
                Done
              </p>
            </div>

            <div className="flex h-[56px] flex-col items-center justify-center rounded-[18px] bg-white/[0.13] px-3 py-2 text-center">
              <p className="text-[15px] font-[950] leading-none">
                {completionPercent}%
              </p>
              <p className="mt-0.5 text-[9.5px] font-[850] text-white/70">
                Progress
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="mobile-quick-capture"
        className={`mb-4 rounded-[28px] border p-4 shadow-[0_18px_50px_rgba(17,24,39,0.06)] ${
          darkMode
            ? "border-white/[0.08] bg-[#171717]"
            : "border-black/[0.06] bg-white"
        }`}
      >
        <div className="mb-3 flex items-center gap-2">
          <Send size={16} style={{ color: themeColor }} />

          <div>
            <h2 className="text-[17px] font-[900] tracking-[-0.04em]">
              Quick Capture
            </h2>

            <p className={darkMode ? "text-[11px] font-[700] text-white/40" : "text-[11px] font-[700] text-[#666661]/40"}>
              Momentuhm will organize it for you
            </p>
          </div>
        </div>

        <div
          className={`overflow-hidden rounded-[24px] border ${
            darkMode
              ? "border-white/[0.08] bg-white/[0.04]"
              : "border-black/[0.06] bg-black/[0.018]"
          }`}
        >
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
            }}
            placeholder="Capture anything..."
            className={`h-12 w-full bg-transparent px-4 text-[13px] font-[800] outline-none ${
              darkMode
                ? "text-white placeholder:text-white/32"
                : "text-[#666661] placeholder:text-[#666661]/32"
            }`}
          />

          <div className={darkMode ? "h-px bg-white/[0.07]" : "h-px bg-black/[0.055]"} />

          <div className="grid grid-cols-[minmax(0,1fr)_46px] items-center">
            <input
              value={newTaskWhy}
              onChange={(e) => setNewTaskWhy(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
              }}
              placeholder="Optional context..."
              className={`h-12 min-w-0 bg-transparent px-4 text-[13px] font-[800] outline-none ${
                darkMode
                  ? "text-white placeholder:text-white/32"
                  : "text-[#666661] placeholder:text-[#666661]/32"
              }`}
            />

            <button
              onClick={addTask}
              className="mr-1 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-[0_14px_28px_rgba(17,24,39,0.16)]"
              style={{ backgroundColor: themeColor }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsExtractModalOpen(true)}
          className="mt-3 rounded-full border px-3 py-1.5 text-[11px] font-[900]"
          style={{
            color: themeColor,
            borderColor: `${themeColor}30`,
            backgroundColor: `${themeColor}10`,
          }}
        >
          Extract from text ✨
        </button>
      </section>

      <section
        id="Momentuhm-mobile-workspace-anchor"
        className={`mb-4 flex items-center justify-between border-b pb-3 ${
          darkMode ? "border-white/[0.08]" : "border-black/[0.07]"
        }`}
      >
        <div>
          <p
            className={`text-[10px] font-[850] uppercase tracking-[0.14em] ${
              darkMode ? "text-white/32" : "text-[#666661]/32"
            }`}
          >
            Workspace
          </p>
          <p
            className={`mt-1 text-[12px] font-[650] ${
              darkMode ? "text-white/55" : "text-[#666661]/45"
            }`}
          >
            {mobileWorkspaceMode === "tasks"
              ? "Plan and organize your day."
              : "Work through what matters now."}
          </p>
        </div>

        <div
          className={`flex rounded-[12px] border p-1 ${
            darkMode
              ? "border-white/[0.08] bg-white/[0.04]"
              : "border-black/[0.06] bg-black/[0.025]"
          }`}
        >
          {[
            { label: "Tasks", value: "tasks" },
            { label: "Focus", value: "focus" },
          ].map((option) => {
            const isActive = mobileWorkspaceMode === option.value;

            return (
              <button
                key={option.value}
                onClick={() =>
                  setMobileWorkspaceMode(option.value as "tasks" | "focus")
                }
                className={`h-8 rounded-[9px] px-3 text-[11px] font-[850] transition ${
                  isActive
                    ? darkMode
                      ? "bg-white text-black"
                      : "bg-white text-[#181818] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                    : darkMode
                    ? "text-white/42"
                    : "text-[#666661]/42"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      {mobileWorkspaceMode === "tasks" && (
      <section
  id="Momentuhm-mobile-task-list-anchor"
  className={`mb-4 scroll-mt-5 overflow-hidden rounded-[28px] border p-4 shadow-[0_18px_50px_rgba(17,24,39,0.06)] ${
    darkMode
      ? "border-white/[0.08] bg-[#171717]"
      : "border-black/[0.06] bg-white"
  }`}
>
       <div className="mb-4 flex items-start justify-between gap-3">
  <div className="min-w-0">
    <h2 className="flex items-center gap-2 text-[20px] font-[900] leading-tight tracking-[-0.055em]">
      Momentuhm prioritized for You
      <Sparkles size={16} style={{ color: themeColor }} />
    </h2>

    <p
      className={`mt-1.5 text-[13px] font-[750] leading-5 tracking-[-0.02em] ${
        darkMode ? "text-white/55" : "text-[#666661]/48"
      }`}
    >
      Top moves based on intent, urgency, and priority.
    </p>
  </div>
</div>

<div className="mb-3 flex items-center justify-between gap-3">
  <span
    className={`shrink-0 text-[10px] font-[850] uppercase tracking-[0.14em] ${
      darkMode ? "text-white/32" : "text-[#666661]/32"
    }`}
  >
    Group by
  </span>

  <div
    className={`flex shrink-0 rounded-full border p-0.5 ${
      darkMode
        ? "border-white/[0.08] bg-white/[0.045]"
        : "border-black/[0.06] bg-black/[0.025]"
    }`}
  >
    {[
      { label: "Category", value: "category" },
      { label: "Priority", value: "priority" },
      { label: "Due", value: "date" },
    ].map((option) => {
      const isActive = mobileGroupMode === option.value;

      return (
        <button
          key={option.value}
          onClick={() => {
            changeMobileGroupMode(option.value as MobileGroupMode);
          }}
          className={`h-7 rounded-full px-3 text-[10px] font-[850] transition active:scale-[0.98] ${
            isActive
              ? "text-white"
              : darkMode
              ? "text-white/42"
              : "text-[#666661]/45"
          }`}
          style={isActive ? { backgroundColor: themeColor } : undefined}
        >
          {option.label}
        </button>
      );
    })}
  </div>
</div>

<div className="Momentuhm-mobile-category-tabs -mx-1 mb-3 flex overflow-x-auto px-1 pb-0">
  {mobileGroupTabs.map((chip: any) => {
    const isActive = activeChip === chip.key;

    return (
      <button
        key={chip.key}
        onClick={() => {
          setSelectedChip(chip.key);
          setShowAllMobileTasks(false);
          anchorTaskListSoon();
        }}
        className={`relative flex h-10 shrink-0 items-center gap-1.5 px-3 text-[12px] font-[850] tracking-[-0.025em] transition active:scale-[0.98] ${
          isActive
            ? darkMode
              ? "text-white"
              : "text-[#666661]"
            : darkMode
            ? "text-white/42"
            : "text-[#666661]/45"
        }`}
      >
        <span>{chip.label}</span>

        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-[850] ${
            isActive
              ? "text-white"
              : darkMode
              ? "bg-white/[0.07] text-white/55"
              : "bg-black/[0.045] text-[#666661]/45"
          }`}
          style={
            isActive
              ? {
                  backgroundColor: themeColor,
                }
              : undefined
          }
        >
          {chip.count}
        </span>

        <span
          className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-full transition ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundColor: themeColor }}
        />
      </button>
    );
  })}
</div>

        <div className="space-y-2">
          {visibleTasks.length === 0 && (
            <div
              className={`rounded-[22px] border border-dashed p-6 text-center text-sm font-[700] ${
                darkMode
                  ? "border-white/[0.10] text-white/35"
                  : "border-black/[0.08] text-[#666661]/35"
              }`}
            >
              No tasks here yet.
            </div>
          )}

{visibleTasks.map((task: any) => {
            const visibleDueDate = task.dueDate || task.suggestedDueDate;
            const priorityColor =
              task.priority === "High"
                ? "#ef4444"
                : task.priority === "Medium"
                ? "#f97316"
                : "#10b981";

            return (
              <motion.div
                key={task.id}
                layout="position"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-[22px] border p-3 ${
                  darkMode
                    ? "border-white/[0.08] bg-white/[0.04]"
                    : "border-black/[0.055] bg-white shadow-[0_10px_28px_rgba(17,24,39,0.045)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={(e) => toggleTaskById(task.id, e)}
                    className="mt-1 shrink-0"
                  >
                    <Circle
                      size={20}
                      className={darkMode ? "text-white/30" : "text-[#666661]/30"}
                    />
                  </button>

                 

                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setIsEditModalOpen(true);
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
               <p
  className={`text-[15.5px] font-[700] leading-[21px] tracking-[-0.025em] ${
    darkMode ? "text-white/90" : "text-[#666661]"
  }`}
>
  {task.title}
</p>

<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
  <span
    className={
      darkMode
        ? "text-[12px] font-[600] text-white/55"
        : "text-[12px] font-[600] text-slate-500"
    }
  >
    {task.category}
  </span>

  <span
    className="h-1.5 w-1.5 rounded-full"
    style={{ backgroundColor: priorityColor }}
  />

  <span
    className="text-[12px] font-[600]"
    style={{ color: priorityColor }}
  >
    {task.priority === "Medium" ? "Mid" : task.priority}
  </span>

  {visibleDueDate && (
    <span
      className={
        darkMode
          ? "text-[12px] font-[600] text-white/55"
          : "text-[12px] font-[600] text-slate-500"
      }
    >
      · {formatDueDate(visibleDueDate)}
    </span>
  )}
</div>

                    {hasFollowUpTag(task) && (
                      <div className="mt-2">
                        <FollowUpTag darkMode={darkMode} />
                      </div>
                    )}
                  </button>

                  <div className="flex shrink-0 flex-col gap-2">
  <button
    onClick={() => addTaskToFocus(task.id)}
    className={`flex h-8 w-8 items-center justify-center rounded-full transition active:scale-95 ${
      manualFocusTaskIds.includes(task.id)
        ? "text-white"
        : darkMode
        ? "bg-white/[0.06] text-white/55"
        : "bg-black/[0.04] text-[#666661]/45"
    }`}
    style={
      manualFocusTaskIds.includes(task.id)
        ? { backgroundColor: themeColor }
        : undefined
    }
    title="Add to focus"
  >
    <Eye size={15} />
  </button>

  <button
    onClick={() => {
      const confirmed = window.confirm("Delete this task?");
      if (!confirmed) return;

      deleteTask(task.id);
    }}
    className={`flex h-8 w-8 items-center justify-center rounded-full transition active:scale-95 ${
      darkMode
        ? "bg-white/[0.06] text-white/38 hover:text-red-300"
        : "bg-black/[0.04] text-[#666661]/38 hover:text-red-500"
    }`}
    title="Delete task"
  >
    <Trash2 size={15} />
  </button>
</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAllMobileTasks((prev) => !prev)}
            className={`mt-3 h-11 w-full rounded-[18px] border text-xs font-[900] ${
              darkMode
                ? "border-white/[0.08] bg-white/[0.04] text-white/50"
                : "border-black/[0.06] bg-black/[0.025] text-[#666661]/50"
            }`}
          >
            {showAllMobileTasks ? "Show less" : `Show ${hiddenCount} more`}
          </button>
        )}
      </section>
      )}

      {mobileWorkspaceMode === "focus" && (
      <section
        id="mobile-focus-card"
        className={`mb-4 rounded-[28px] border p-4 shadow-[0_18px_50px_rgba(17,24,39,0.06)] ${
          darkMode
            ? "border-white/[0.08] bg-[#171717]"
            : "border-black/[0.06] bg-white"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-[18px] font-[900] tracking-[-0.045em]">
              Focus Now
              <Sparkles size={15} style={{ color: themeColor }} />
            </h2>

            <p className={darkMode ? "mt-1 text-xs font-[700] text-white/42" : "mt-1 text-xs font-[700] text-[#666661]/42"}>
              Your strongest next moves.
            </p>
          </div>

          <span
            className="rounded-full px-3 py-1.5 text-[10px] font-[900]"
            style={{
              color: themeColor,
              backgroundColor: `${themeColor}12`,
            }}
          >
            AI Mode
          </span>
        </div>

        <div className="space-y-2">
          {focusTasks.length === 0 && (
            <div
              className={`rounded-[22px] border border-dashed px-4 py-8 text-center ${
                darkMode
                  ? "border-white/[0.10] text-white/35"
                  : "border-black/[0.08] text-[#666661]/35"
              }`}
            >
              <Target size={26} className="mx-auto mb-3 opacity-55" />
              <p className="text-sm font-[900]">Build your focus stack.</p>
              <p className="mt-1 text-xs font-[700] opacity-70">
                Add tasks from the list above.
              </p>
            </div>
          )}

          {focusTasks.map((task: any, index: number) => (
            <button
              key={task.id}
              onClick={() => {
                setSelectedTask(task);
                setIsEditModalOpen(true);
              }}
              className={`flex w-full items-center gap-3 rounded-[20px] border p-3 text-left ${
                darkMode
                  ? "border-white/[0.08] bg-white/[0.04]"
                  : "border-black/[0.055] bg-black/[0.018]"
              }`}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-[800] text-white"
                style={{ backgroundColor: themeColor }}
              >
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-[900] tracking-[-0.02em]">
                  {task.title}
                </p>

                <p className={darkMode ? "mt-1 text-[10px] font-[800] text-white/38" : "mt-1 text-[10px] font-[800] text-[#666661]/38"}>
                  {task.category} ·{" "}
                  {task.priority === "Medium" ? "Mid" : task.priority}
                </p>
              </div>

              <Eye size={15} className={darkMode ? "text-white/35" : "text-[#666661]/35"} />
            </button>
          ))}
        </div>
      </section>
      )}

{mobileWorkspaceMode === "tasks" && (
  <CompletedTodaySection
  sectionId="Momentuhm-mobile-completed-anchor"
  completedToday={completedToday}
  restoreCompletedTask={restoreCompletedTask}
  archiveCompletedToday={archiveCompletedToday}
  darkMode={darkMode}
  border={border}
/>
)}
    </div>
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
  const [showAllTasks, setShowAllTasks] = useState(false);
  const defaultVisibleTaskCount = 15;

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

  const addTaskToFocus = (taskId: string) => {
    if (!setManualFocusTaskIds) return;

    setManualFocusTaskIds((previous: string[]) => {
      if (previous.includes(taskId) || previous.length >= 3) return previous;
      return [...previous, taskId];
    });
  };

  return (
    <section
      id="Momentuhm-task-list-anchor"
      ref={taskListRef}
      aria-label={description || title}
      className={`w-full min-w-0 scroll-mt-[148px] overflow-hidden rounded-[12px] border lg:scroll-mt-8 ${cardBorder}`}
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

            <button
              type="button"
              aria-label="Task list options"
              className={`flex h-9 w-9 items-center justify-center rounded-[8px] border transition ${
                darkMode
                  ? "border-white/[0.10] text-white/48 hover:bg-white/[0.06] hover:text-white"
                  : "border-[#DDDDE3] text-[#676D79] hover:bg-[#F4F5F7] hover:text-[#252933]"
              }`}
            >
              <MoreVertical size={16} strokeWidth={1.8} />
            </button>
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
            const isFocused = manualFocusTaskIds.includes(task.id);
            const isNewlyAdded = newlyAddedTaskIds.includes(task.id);
            const priorityLabel =
              task.priority === "Medium" || task.priority === "Med"
                ? "Medium"
                : task.priority;
            const statusLabel = isFocused
              ? "In progress"
              : isTaskOverdue
              ? "Overdue"
              : task.status === "Active"
              ? "Not started"
              : task.status || "Not started";

            const dueLabel = !visibleDueDate
              ? "—"
              : isToday(visibleDueDate)
              ? "Today"
              : isTomorrow(visibleDueDate)
              ? "Tomorrow"
              : formatDueDate(visibleDueDate);

            const dueClass = isTaskOverdue
              ? "text-red-500"
              : isToday(visibleDueDate)
              ? "text-red-500"
              : isTomorrow(visibleDueDate)
              ? "text-orange-500"
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

            const statusPill = isFocused
              ? darkMode
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-600"
              : isTaskOverdue
              ? darkMode
                ? "border-red-400/20 bg-red-400/10 text-red-300"
                : "border-red-200 bg-red-50 text-red-600"
              : darkMode
              ? "border-white/[0.10] bg-white/[0.04] text-white/58"
              : "border-[#DDDDE3] bg-[#F6F7F9] text-[#5F6572]";

            return (
              <div key={task.id} className="contents">
                {shouldShowGroupHeader && (
                  <div
                    className={`col-span-6 flex min-h-[34px] items-center gap-2 border-b px-3 text-[11px] font-[700] ${rowBorder} ${
                      darkMode ? "bg-white/[0.035] text-white/62" : "bg-[#F4F5F7] text-[#565C68]"
                    }`}
                  >
                    <span>{groupMeta.title}</span>
                    <span className="opacity-45">{groupCounts[groupMeta.key] || 0}</span>
                  </div>
                )}

<motion.div
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
    onClick={() => openTask(task)}
    title={task.title}
    className={`block w-full truncate text-left text-[13px] font-[650] leading-5 tracking-[-0.015em] transition hover:opacity-70 ${
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
        {task.category || "No category"}
      </span>

      {task.pinned && (
        <>
          <span aria-hidden="true">•</span>
          <span>Pinned</span>
        </>
      )}

      {suggestingTaskIds.includes(task.id) && (
        <Sparkles
          size={9}
          className="shrink-0 animate-pulse"
        />
      )}
    </div>
  )}

  {groupMode === "category" &&
    (task.pinned || suggestingTaskIds.includes(task.id)) && (
      <div
        className={`mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] font-[500] ${mutedText}`}
      >
        {task.pinned && <span>Pinned</span>}

        {suggestingTaskIds.includes(task.id) && (
          <Sparkles
            size={9}
            className="shrink-0 animate-pulse"
          />
        )}
      </div>
    )}
</div>

                  <div className={`flex items-center justify-center border-l px-1 text-center text-[10.5px] font-[600] ${rowBorder} ${dueClass}`}>
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
                      onClick={() => {
                        if (isFocused) {
                          openTask(task);
                        } else {
                          addTaskToFocus(task.id);
                        }
                      }}
                      title={isFocused ? "Open focused task" : "Add to focus"}
                      className={`max-w-full truncate rounded-[6px] border px-2 py-1 text-[10px] font-[650] ${statusPill}`}
                    >
                      {statusLabel}
                    </button>
                  </div>

                  <div className={`flex items-center justify-center border-l ${rowBorder}`}>
                    <button
                      type="button"
                      onClick={() => openTask(task)}
                      aria-label={`Open ${task.title}`}
                      title="Open task"
                      className={`flex h-8 w-7 items-center justify-center transition ${
                        darkMode ? "text-white/38 hover:text-white" : "text-[#747986] hover:text-[#252933]"
                      }`}
                    >
                      <MoreVertical size={15} strokeWidth={1.8} />
                    </button>
                  </div>
                </motion.div>
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
  darkMode,
  border,
}: any) {
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const defaultVisibleCount = 3;

  const visibleCompletedTasks = showAllCompleted
    ? completedToday
    : completedToday.slice(0, defaultVisibleCount);

  const hiddenCompletedCount = Math.max(
    completedToday.length - defaultVisibleCount,
    0
  );

  const formatCompletedTime = (completedAt?: string) => {
    if (!completedAt) return "";
    const date = new Date(completedAt);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
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
                darkMode ? "text-white" : "text-[#17191F]"
              }`}
            >
              Completed today
            </h2>
            <span
              className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-[700] ${
                darkMode ? "bg-white/[0.07] text-white/58" : "bg-[#F0F1F4] text-[#59606C]"
              }`}
            >
              {completedToday.length}
            </span>
          </div>
          <p className={`mt-1.5 text-[11px] font-[500] ${mutedText}`}>
            Well done! Keep the momentum going.
          </p>
        </div>

        <button
          type="button"
          onClick={archiveCompletedToday}
          disabled={completedToday.length === 0}
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
        <div className={`px-4 py-8 text-[12px] font-[500] ${mutedText}`}>
          Nothing completed yet.
        </div>
      ) : (
        <div role="list">
          <AnimatePresence initial={false}>
            {visibleCompletedTasks.map((task: any) => {
              const completedTime = formatCompletedTime(task.completedAt);

              return (
                <motion.div
                  key={task.id}
                  role="listitem"
                  layout="position"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`grid min-h-[48px] grid-cols-[28px_minmax(0,1fr)_auto_34px] items-center gap-2 border-b px-3 last:border-b-0 ${rowBorder}`}
                >
                  <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check size={12} strokeWidth={2.3} />
                  </span>

                  <div className="min-w-0 py-2">
                    <p
                      title={task.title}
                      className={`truncate text-[12px] font-[550] line-through ${
                        darkMode
                          ? "text-white/55 decoration-white/30"
                          : "text-[#5D626E] decoration-black/25"
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className={`mt-0.5 truncate text-[10px] font-[500] ${mutedText}`}>
                      {task.category || "No category"}
                    </p>
                  </div>

                  <time
                    dateTime={task.completedAt}
                    className={`whitespace-nowrap text-[10px] font-[500] tabular-nums ${mutedText}`}
                  >
                    {completedTime}
                  </time>

                  <button
                    type="button"
                    onClick={() => restoreCompletedTask(task.id)}
                    aria-label={`Restore ${task.title}`}
                    title="Restore task"
                    className={`flex h-8 w-8 items-center justify-center transition ${
                      darkMode ? "text-white/38 hover:text-white" : "text-[#747986] hover:text-[#252933]"
                    }`}
                  >
                    <RotateCcw size={14} strokeWidth={1.7} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {(hiddenCompletedCount > 0 || completedToday.length > 0) && (
        <div className={`flex min-h-[42px] items-center justify-center border-t px-3 ${rowBorder}`}>
          {hiddenCompletedCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowAllCompleted((previous) => !previous)}
              className={`inline-flex items-center gap-1.5 text-[11px] font-[600] ${mutedText}`}
            >
              {showAllCompleted ? "Show less" : `Show ${hiddenCompletedCount} more`}
              <ChevronDown
                size={12}
                className={`transition ${showAllCompleted ? "rotate-180" : ""}`}
              />
            </button>
          ) : (
            <p className={`text-center text-[10.5px] font-[500] ${mutedText}`}>
              You’ve completed {completedToday.length} task{completedToday.length === 1 ? "" : "s"} today. Amazing work! 💜
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
}: any) {
  const [groupBy, setGroupBy] = useState<
    "date" | "priority"
  >("date");

  const getArchiveDate = (task: any) => {
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

  const getLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(date.getDate()).padStart(
      2,
      "0"
    );

    return `${year}-${month}-${day}`;
  };

  const getDateGroupLabel = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const comparisonDate = new Date(date);
    comparisonDate.setHours(0, 0, 0, 0);

    const differenceInDays = Math.round(
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

    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !==
        today.getFullYear()
          ? "numeric"
          : undefined,
    });
  };

  const archiveStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /*
     * Includes today and the previous six days.
     * This avoids ambiguity around calendar weeks.
     */
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 6
    );

    const itemsClosedLastSevenDays =
      archive.filter((task: any) => {
        const completedDate =
          getArchiveDate(task);

        return (
          completedDate &&
          completedDate >= sevenDaysAgo
        );
      }).length;

      const categoryCounts: Record<string, number> = (
        Array.isArray(archive) ? archive : []
      ).reduce(
        (
          counts: Record<string, number>,
          task: any
        ) => {
          const category =
            task.category || "No category";
      
          counts[category] =
            (counts[category] || 0) + 1;
      
          return counts;
        },
        {} as Record<string, number>
      );
      
      const topCategoryEntry = (
        Object.entries(categoryCounts) as Array<
          [string, number]
        >
      ).sort(
        ([, countA], [, countB]) =>
          countB - countA
      )[0];

    return {
      totalClosed: archive.length,
      itemsClosedLastSevenDays,
      averagePerDay:
        itemsClosedLastSevenDays === 0
          ? "0.0"
          : (
              itemsClosedLastSevenDays / 7
            ).toFixed(1),
      topCategory:
        topCategoryEntry?.[0] || "—",
    };
  }, [archive]);

  const groupedArchive = useMemo(() => {
    const sortedArchive = [...archive].sort(
      (a: any, b: any) => {
        const dateA = getArchiveDate(a);
        const dateB = getArchiveDate(b);

        return (
          (dateB?.getTime() || 0) -
          (dateA?.getTime() || 0)
        );
      }
    );

    if (groupBy === "priority") {
      const priorityOrder = [
        "High",
        "Medium",
        "Low",
        "No priority",
      ];

      return priorityOrder
        .map((priority) => {
          const items = sortedArchive.filter(
            (task: any) => {
              const taskPriority =
                task.priority || "No priority";

              return taskPriority === priority;
            }
          );

          return {
            key: `priority:${priority}`,
            title: priority,
            items,
          };
        })
        .filter((group) => group.items.length > 0);
    }

    const dateGroups = new Map<
      string,
      {
        key: string;
        title: string;
        items: any[];
      }
    >();

    sortedArchive.forEach((task: any) => {
      const completedDate =
        getArchiveDate(task);

      const key = completedDate
        ? getLocalDateKey(completedDate)
        : "unknown-date";

      const title = completedDate
        ? getDateGroupLabel(completedDate)
        : "Date unavailable";

      if (!dateGroups.has(key)) {
        dateGroups.set(key, {
          key: `date:${key}`,
          title,
          items: [],
        });
      }

      dateGroups.get(key)?.items.push(task);
    });

    return Array.from(dateGroups.values());
  }, [archive, groupBy]);

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
      {/* Header */}
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1
              className={`text-[28px] font-[760] leading-none tracking-[-0.045em] ${
                darkMode
                  ? "text-white"
                  : "text-[#17191F]"
              }`}
            >
              Archived items
            </h1>

            <span
              className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[11px] font-[700] ${
                darkMode
                  ? "bg-white/[0.08] text-white/62"
                  : "bg-[#F0F1F4] text-[#59606C]"
              }`}
            >
              {archive.length}
            </span>
          </div>

          <p
            className={`mt-2 text-[13px] font-[500] ${mutedText}`}
          >
            Review completed work and understand
            your execution patterns.
          </p>
        </div>

        <button
          type="button"
          onClick={clearArchive}
          disabled={archive.length === 0}
          className={`h-10 shrink-0 rounded-[9px] border px-4 text-[12px] font-[650] transition ${
            archive.length === 0
              ? "cursor-not-allowed opacity-30"
              : darkMode
              ? "border-white/[0.10] text-white/62 hover:bg-white/[0.06] hover:text-white"
              : "border-[#DDDDE3] bg-white text-[#555B67] hover:bg-[#F4F5F7] hover:text-[#252933]"
          }`}
        >
          Clear archive
        </button>
      </header>

      {/* Completion statistics */}
      <section className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Total closed",
            value: archiveStats.totalClosed,
            description:
              "All archived tasks",
            icon: CheckCircle2,
          },
          {
            label: "Closed last 7 days",
            value:
              archiveStats.itemsClosedLastSevenDays,
            description:
              "Recent completion volume",
            icon: Calendar,
          },
          {
            label: "Average per day",
            value: archiveStats.averagePerDay,
            description:
              "Across the last 7 days",
            icon: TrendingUp,
          },
          {
            label: "Top category",
            value: archiveStats.topCategory,
            description:
              "Most completed work",
            icon: LayoutGrid,
          },
        ].map((stat) => {
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
                    title={String(stat.value)}
                    className={`mt-3 truncate text-[24px] font-[740] leading-none tracking-[-0.045em] ${
                      darkMode
                        ? "text-white"
                        : "text-[#17191F]"
                    }`}
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

      {/* Archive history */}
      <section
        className={`overflow-hidden rounded-[14px] border ${panelBorder} ${panelSurface}`}
      >
        <div
          className={`flex min-h-[68px] flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${rowBorder}`}
        >
          <div>
            <h2
              className={`text-[17px] font-[720] tracking-[-0.025em] ${
                darkMode
                  ? "text-white"
                  : "text-[#17191F]"
              }`}
            >
              Completion history
            </h2>

            <p
              className={`mt-1 text-[11px] font-[500] ${mutedText}`}
            >
              Group completed work by completion
              date or task priority.
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
                  event.target.value as
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

        {archive.length === 0 ? (
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
                className={`mt-4 text-[16px] font-[700] ${
                  darkMode
                    ? "text-white"
                    : "text-[#17191F]"
                }`}
              >
                No archived work yet
              </h3>

              <p
                className={`mt-2 text-[12px] font-[500] leading-5 ${mutedText}`}
              >
                Completed tasks will appear here
                after they are archived.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {groupedArchive.map((group) => (
              <section key={group.key}>
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
                    {group.items.length}
                  </span>
                </div>

                <AnimatePresence
                  initial={false}
                  mode="popLayout"
                >
                  {group.items.map(
                    (task: any) => {
                      const completedDate =
                        getArchiveDate(task);

                      const priorityLabel =
                        task.priority === "Medium" ||
                        task.priority === "Med"
                          ? "Medium"
                          : task.priority ||
                            "No priority";

                      return (
                        <motion.div
                          key={task.id}
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
                              0.16, 1, 0.3, 1,
                            ],
                          }}
                          className={`grid min-h-[68px] grid-cols-1 gap-3 border-b px-4 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5 ${rowBorder}`}
                        >
                          <div className="min-w-0">
                            <p
                              title={task.title}
                              className={`truncate text-[13px] font-[650] tracking-[-0.015em] ${
                                darkMode
                                  ? "text-white/88"
                                  : "text-[#20232B]"
                              }`}
                            >
                              {task.title}
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
                              {priorityLabel}
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
                                      month: "short",
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
            ))}
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
  themeColor,
  input,
  glass,
  strongerGlass,
  border,
}: any) {
  return (
    <div>
      <PageHeader
  title="Categories"
  description="Organize your tasks into working areas."
  darkMode={darkMode}
/>

      <div className={`mb-8 rounded-3xl border p-4 sm:p-5 ${strongerGlass} ${border}`}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCategory();
            }}
            placeholder="Create new category"
            className={`h-12 flex-1 rounded-2xl px-4 outline-none ${input}`}
          />

          <button
            onClick={addCategory}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl px-5 font-[700] text-white"
            style={{ backgroundColor: themeColor }}
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

      <div className={`overflow-hidden rounded-[24px] border sm:rounded-3xl ${strongerGlass} ${border}`}>
        {categories.map((category: any) => (
          <div
            key={category.id}
            className={`flex min-h-[72px] flex-col items-start justify-between gap-3 border-b px-5 py-3 last:border-none sm:flex-row sm:items-center sm:gap-4 sm:px-6 ${border}`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <LayoutGrid size={18} className="shrink-0" />

              {editingCategoryId === category.id ? (
                <input
                  autoFocus
                  value={editingCategoryTitle}
                  onChange={(e) => setEditingCategoryTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") renameCategory(category.id);
                    if (e.key === "Escape") {
                      setEditingCategoryId(null);
                      setEditingCategoryTitle("");
                    }
                  }}
                  className={`h-10 max-w-[320px] flex-1 rounded-xl px-3 outline-none ${input}`}
                />
              ) : (
                <div className="min-w-0">
                  <p
                    onClick={() => {
                      setEditingCategoryId(category.id);
                      setEditingCategoryTitle(category.title);
                    }}
                    className="cursor-pointer truncate text-[15px] font-[700] transition hover:opacity-70"
                  >
                    {category.title}
                  </p>

                  <p className="mt-1 text-xs opacity-40">
                    {category.tasks.length} tasks
                  </p>
                </div>
              )}
            </div>

            <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
              {editingCategoryId === category.id ? (
                <>
                  <button
                    onClick={() => renameCategory(category.id)}
                    className="h-9 rounded-xl px-4 text-sm font-[700] text-white"
                    style={{ backgroundColor: themeColor }}
                  >
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setEditingCategoryId(null);
                      setEditingCategoryTitle("");
                    }}
                    className={`h-9 rounded-xl px-4 text-sm font-[700] ${glass}`}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl opacity-35 transition hover:bg-red-500/10 hover:text-red-500 hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
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
          completedTodayCount: completedToday.length,
          tasks: prioritizedTasks.slice(0, 15).map((task: any) => ({
            id: task.id,
            title: task.title,
            whyThisMatters: task.whyThisMatters || "",
            priority: task.priority,
            dueDate: task.dueDate || null,
            suggestedDueDate: task.suggestedDueDate || null,
            category: task.category,
            score: task.score || 0,
            aiReason: task.aiReason || "",
            status: task.status || "Active",
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

  const dayProgress = Math.round(
    (completedToday.length /
      Math.max(1, completedToday.length + prioritizedTasks.length)) *
      100
  );

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
            className={`text-[24px] font-[760] leading-none tracking-[-0.045em] ${
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

                <button
                  type="button"
                  onClick={() => setFocusIndex(index)}
                  title={task.title}
                  className={`min-w-0 truncate text-left text-[12px] font-[600] ${
                    darkMode ? "text-white/84" : "text-[#282C35]"
                  }`}
                >
                  {task.title}
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
            disabled={!currentTask}
            onClick={openCurrentTask}
            className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-[10px] border px-2 text-center text-[11px] font-[600] transition disabled:cursor-not-allowed disabled:opacity-35 ${cardBorder} ${
              darkMode ? "hover:bg-white/[0.04]" : "hover:bg-[#FAFAFB]"
            }`}
          >
            <Calendar size={21} className="text-violet-500" strokeWidth={1.9} />
            <span>Schedule focus time</span>
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
          className={darkMode ? "shrink-0 text-violet-300" : "shrink-0 text-violet-600"}
          strokeWidth={1.7}
        />
        <div className="min-w-0">
          <h3
            className={`text-[15px] font-[700] ${
              darkMode ? "text-white" : "text-[#20232B]"
            }`}
          >
            Keep going{completedToday.length > 0 ? " — you’re moving! 💪" : "! 💪"}
          </h3>
          <p className={`mt-1.5 text-[12px] font-[500] ${mutedText}`}>
            You’ve got {prioritizedTasks.length} more task{prioritizedTasks.length === 1 ? "" : "s"} to complete today.
          </p>
        </div>
      </section>
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
  glass,
  strongerGlass,
  themeColor,
  viewMode,
  setViewMode,
  highPriorityTasks,
  mediumPriorityTasks,
  lowPriorityTasks,
  completedToday,
  archiveCompletedToday,
  restoreCompletedTask,
  toggleTaskById,
  deleteTask,
  setSelectedTask,
  setIsEditModalOpen,
}: any) {
  const totalTasks =
    highPriorityTasks.length + mediumPriorityTasks.length + lowPriorityTasks.length;

  const priorityGroups = [
    {
      key: "high",
      title: "High",
      description: "Handle these first.",
      tasks: highPriorityTasks,
      emptyMessage: "No high-priority tasks.",
      badgeClass: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300",
      dotColor: "#ef4444",
    },
    {
      key: "medium",
      title: "Medium",
      description: "Useful work, but less urgent.",
      tasks: mediumPriorityTasks,
      emptyMessage: "No medium-priority tasks.",
      badgeClass:
        "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
      dotColor: "#f59e0b",
    },
    {
      key: "low",
      title: "Low",
      description: "Keep visible, but do later.",
      tasks: lowPriorityTasks,
      emptyMessage: "No low-priority tasks.",
      badgeClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
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
              darkMode ? "text-white/55" : "text-[#666661]/45"
            }`}
          >
            Your active tasks grouped by importance.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div
            className={`rounded-2xl border px-4 py-3 text-xs font-[700] ${className} ${border}`}
          >
            {totalTasks} active task{totalTasks === 1 ? "" : "s"}
          </div>

      
        </div>
      </div>

      <div className="space-y-6">
  {priorityGroups.map((group) => (
    <AirtablePriorityGroup
      key={group.key}
      {...group}
      darkMode={darkMode}
      border={border}
      toggleTaskById={toggleTaskById}
      deleteTask={deleteTask}
      setSelectedTask={setSelectedTask}
      setIsEditModalOpen={setIsEditModalOpen}
    />
  ))}
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
}: any) {
  const totalScheduled =
    todayTasks.length + tomorrowTasks.length + laterTasks.length;

  const groups = [
    {
      title: "Today",
      description: "Work that needs attention now.",
      tasks: todayTasks,
      emptyMessage: "Nothing due today.",
      dotColor: themeColor,
    },
    {
      title: "Tomorrow",
      description: "Tasks coming up next.",
      tasks: tomorrowTasks,
      emptyMessage: "Nothing scheduled for tomorrow.",
      dotColor: "#f59e0b",
    },
    {
      title: "Later",
      description: "Future scheduled work.",
      tasks: laterTasks,
      emptyMessage: "No later tasks yet.",
      dotColor: "#3b82f6",
    },
    {
      title: "No Date",
      description: "Tasks that still need a date.",
      tasks: noDateTasks,
      emptyMessage: "Every task has a date.",
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

          <p className={`mt-2 text-[13px] sm:text-sm ${darkMode ? "text-white/55" : "text-[#666661]/45"}`}>
            Tasks grouped by manual due dates and Momentuhm-suggested dates.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div
            className={`rounded-2xl border px-4 py-3 text-xs font-[700] ${className} ${border}`}
          >
            {totalScheduled} scheduled task{totalScheduled === 1 ? "" : "s"}
          </div>

          <div className={`flex rounded-2xl border p-1 ${className} ${border}`}>
            <button
              onClick={() => setViewMode("calendar")}
              className={`h-9 rounded-xl px-4 text-xs font-[700] transition ${
                viewMode === "calendar"
                  ? "text-white"
                  : darkMode
                  ? "text-white/55 hover:text-white"
                  : "text-[#666661]/45 hover:text-[#666661]"
              }`}
              style={viewMode === "calendar" ? { backgroundColor: themeColor } : undefined}
            >
              Calendar
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`h-9 rounded-xl px-4 text-xs font-[700] transition ${
                viewMode === "list"
                  ? "text-white"
                  : darkMode
                  ? "text-white/55 hover:text-white"
                  : "text-[#666661]/45 hover:text-[#666661]"
              }`}
              style={viewMode === "list" ? { backgroundColor: themeColor } : undefined}
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
          acceptSuggestedDateById={acceptSuggestedDateById}
          setSelectedTask={setSelectedTask}
          setIsEditModalOpen={setIsEditModalOpen}
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
              toggleTaskById={toggleTaskById}
              deleteTask={deleteTask}
              acceptSuggestedDateById={acceptSuggestedDateById}
              setSelectedTask={setSelectedTask}
              setIsEditModalOpen={setIsEditModalOpen}
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
}: any) {
  const calendarDays = [
    {
      title: "Today",
      dateLabel: formatDueDate(getTodayDate()),
      tasks: todayTasks,
      dotColor: themeColor,
      emptyMessage: "No tasks today.",
    },
    {
      title: "Tomorrow",
      dateLabel: formatDueDate(getTomorrowDate()),
      tasks: tomorrowTasks,
      dotColor: "#f59e0b",
      emptyMessage: "Nothing tomorrow.",
    },
    {
      title: "Later",
      dateLabel: "Future",
      tasks: laterTasks,
      dotColor: "#3b82f6",
      emptyMessage: "No future tasks.",
    },
    {
      title: "No Date",
      dateLabel: "Unscheduled",
      tasks: noDateTasks,
      dotColor: "#71717a",
      emptyMessage: "Everything is scheduled.",
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
                    backgroundColor: day.dotColor,
                  }}
                />

                <h3 className="text-[15px] font-[700]">{day.title}</h3>
              </div>

              <p className={`mt-1 text-xs ${darkMode ? "text-white/40" : "text-[#666661]/40"}`}>
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

            {day.tasks.map((task: any) => (
              <UpcomingCalendarTaskCard
                key={task.id}
                task={task}
                darkMode={darkMode}
                border={border}
                toggleTaskById={toggleTaskById}
                deleteTask={deleteTask}
                acceptSuggestedDateById={acceptSuggestedDateById}
                setSelectedTask={setSelectedTask}
                setIsEditModalOpen={setIsEditModalOpen}
              />
            ))}
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
}: any) {
  const visibleDueDate = task.dueDate || task.suggestedDueDate;

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
      className={`rounded-2xl border p-3 transition hover:scale-[1.01] ${border} ${
        darkMode ? "hover:bg-white/[0.04]" : "hover:bg-black/[0.02]"
      }`}
    >
      <div className="mb-3 flex items-start gap-2">
        <button
          onClick={(e) => toggleTaskById(task.id, e)}
          className="mt-0.5 opacity-70 transition hover:opacity-100"
        >
          <Circle
            size={17}
            className={darkMode ? "text-white/25" : "text-[#666661]/25"}
          />
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

          <p
            className={`mt-1 text-[11px] ${
              darkMode ? "text-white/38" : "text-[#666661]/38"
            }`}
          >
            {task.category}
          </p>
        </div>

        <button
          onClick={() => deleteTask(task.id)}
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

        <DateBadge task={task} visibleDueDate={visibleDueDate} darkMode={darkMode} />

        {hasFollowUpTag(task) && <FollowUpTag darkMode={darkMode} />}

        {task.suggestedDueDate && !task.dueDate && acceptSuggestedDateById && (
          <button
            onClick={() => acceptSuggestedDateById(task.id)}
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
        emptyMessage={emptyMessage}
        darkMode={darkMode}
        border={border}
        toggleTaskById={toggleTaskById}
        deleteTask={deleteTask}
        acceptSuggestedDateById={acceptSuggestedDateById}
        setSelectedTask={setSelectedTask}
        setIsEditModalOpen={setIsEditModalOpen}
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
}: any) {
  return (
    <div>
      {tasks.length === 0 && (
        <div className={`p-5 text-sm ${darkMode ? "text-white/35" : "text-[#666661]/35"}`}>
          {emptyMessage}
        </div>
      )}

      {tasks.map((task: any) => {
       const visibleDueDate = task.dueDate || task.suggestedDueDate;

        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex min-h-[72px] flex-col items-start gap-3 border-b px-5 py-4 transition-colors last:border-none sm:flex-row sm:items-center sm:gap-4 ${border} ${getPriorityRowClass(
              task.priority,
              darkMode
            )}`}
          >
            <div className="flex w-full min-w-0 items-start gap-3 sm:w-auto sm:flex-1 sm:items-center">
              <button
                onClick={(e) => toggleTaskById(task.id, e)}
                className="mt-0.5 shrink-0 opacity-70 transition hover:opacity-100 sm:mt-0"
              >
                <Circle size={18} className={darkMode ? "text-white/25" : "text-[#666661]/25"} />
              </button>

              <div className="min-w-0 flex-1">
                <p
                  onClick={() => {
                    setSelectedTask(task);
                    setIsEditModalOpen(true);
                  }}
                  className="cursor-pointer text-[15px] font-[700] leading-5 tracking-[-0.015em] hover:opacity-70 sm:truncate"
                >
                  {task.title}
                </p>

                <p
                  className={`mt-1 truncate text-[10.5px] font-[700] sm:mt-1.5 sm:text-[11px] sm:font-[650] ${
                    darkMode ? "text-white/38" : "text-[#666661]/38"
                  }`}
                >
                  {task.category} · {task.priority}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <DateBadge task={task} visibleDueDate={visibleDueDate} darkMode={darkMode} />

              {hasFollowUpTag(task) && <FollowUpTag darkMode={darkMode} />}

              {task.suggestedDueDate && !task.dueDate && acceptSuggestedDateById && (
                <button
                  onClick={() => acceptSuggestedDateById(task.id)}
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
                onClick={() => deleteTask(task.id)}
                className="opacity-35 transition hover:text-red-500 hover:opacity-100"
              >
                <Trash2 size={16} />
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
  border,
  className,
  themeColor,
  inboxTasks,
  enableAppSuggestions,
  toggleTaskById,
  deleteTask,
  scheduleTaskById,
  setSelectedTask,
  setIsEditModalOpen,
}: any) {
  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[28px] font-[700] tracking-[-0.04em] sm:text-[32px]">
            Inbox
          </h2>

          <p
            className={`mt-2 text-sm ${
              darkMode ? "text-white/55" : "text-[#666661]/45"
            }`}
          >
            Captured tasks that still need a clear date or review.
          </p>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-[700] ${className} ${border}`}
        >
          {inboxTasks.length} item{inboxTasks.length === 1 ? "" : "s"} to review
        </div>
      </div>

      <section className={`rounded-[28px] border shadow-sm ${className} ${border}`}>
        <div
          className={`flex items-center justify-between gap-4 border-b px-5 py-4 ${border}`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: themeColor,
                }}
              />

              <h3 className="text-[15px] font-[700]">Needs Review</h3>
            </div>

            <p
              className={`mt-1 text-xs ${
                darkMode ? "text-white/40" : "text-[#666661]/40"
              }`}
            >
              These tasks do not have a manual or suggested date yet.
            </p>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-[900] ${
              darkMode
                ? "bg-white/[0.06] text-white/50"
                : "bg-black/[0.04] text-[#666661]/50"
            }`}
          >
            {inboxTasks.length}
          </span>
        </div>

        <div>
          {inboxTasks.length === 0 && (
            <div
              className={`p-8 text-sm ${
                darkMode ? "text-white/35" : "text-[#666661]/35"
              }`}
            >
              Your inbox is clear. Every active task has either a date or a
              Momentuhm suggestion.
            </div>
          )}

          {inboxTasks.map((task: any) => (
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
              className={`flex min-h-[82px] flex-col items-start gap-3 border-b px-5 py-4 last:border-none sm:flex-row sm:items-center sm:gap-4 ${border} ${
                darkMode ? "hover:bg-white/[0.04]" : "hover:bg-black/[0.02]"
              }`}
            >
              <div className="flex w-full min-w-0 items-start gap-3 sm:w-auto sm:flex-1 sm:items-center">
                <button
                  onClick={(e) => toggleTaskById(task.id, e)}
                  className="mt-0.5 shrink-0 opacity-70 transition hover:opacity-100 sm:mt-0"
                >
                  <Circle
                    size={18}
                    className={darkMode ? "text-white/25" : "text-[#666661]/25"}
                  />
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    onClick={() => {
                      setSelectedTask(task);
                      setIsEditModalOpen(true);
                    }}
                    className="cursor-pointer text-[15px] font-[700] leading-5 tracking-[-0.015em] hover:opacity-70 sm:truncate"
                  >
                    {task.title}
                  </p>

                  <p
                    className={`mt-1 truncate text-[11px] ${
                      darkMode ? "text-white/38" : "text-[#666661]/38"
                    }`}
                  >
                    {task.category} · Needs date
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                {hasFollowUpTag(task) && <FollowUpTag darkMode={darkMode} />}

                <span
                 className={`inline-flex h-7 items-center rounded-full px-3 text-[11px] font-[700] tracking-[-0.01em] ${getPriorityClass(
                  task.priority
                )}`}
                >
                  {task.priority}
                </span>

                {enableAppSuggestions && (
                  <>
                    <button
                      onClick={() => scheduleTaskById(task.id, getTodayDate())}
                      className={`h-9 rounded-xl px-3 text-xs font-[700] transition hover:scale-[1.02] ${
                        darkMode
                          ? "bg-white/[0.06] text-white/55 hover:text-white"
                          : "bg-black/[0.04] text-[#666661]/55 hover:text-[#666661]"
                      }`}
                    >
                      Today
                    </button>

                    <button
                      onClick={() => scheduleTaskById(task.id, getTomorrowDate())}
                      className={`h-9 rounded-xl px-3 text-xs font-[700] transition hover:scale-[1.02] ${
                        darkMode
                          ? "bg-white/[0.06] text-white/55 hover:text-white"
                          : "bg-black/[0.04] text-[#666661]/55 hover:text-[#666661]"
                      }`}
                    >
                      Tomorrow
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setSelectedTask(task);
                    setIsEditModalOpen(true);
                  }}
                  className="h-9 rounded-xl px-3 text-xs font-[700] text-white transition hover:scale-[1.02]"
                  style={{
                    backgroundColor: themeColor,
                  }}
                >
                  Review
                </button>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-35 transition hover:text-red-500 hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MobileBottomNav({
  selectedView,
  setSelectedView,
  inboxCount,
  darkMode,
  themeColor,
}: any) {
  const goToToday = () => {
    setSelectedView("today");
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 80);
  };

  const goToFocus = () => {
    setSelectedView("today");

    window.setTimeout(() => {
      window.dispatchEvent(new Event("momentuhm:open-focus"));
    }, 120);
  };

  const goToCapture = () => {
    setSelectedView("today");
    window.setTimeout(() => {
      document
        .getElementById("mobile-quick-capture")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  };

  return (
    <nav
      className={`fixed bottom-4 left-4 right-4 z-[180] grid h-[72px] grid-cols-5 items-center rounded-[28px] border px-2 shadow-[0_22px_70px_rgba(17,24,39,0.22)] backdrop-blur-2xl lg:hidden ${
        darkMode
          ? "border-white/[0.10] bg-[#0b1113]/92 text-white"
          : "border-black/[0.07] bg-white/[0.92] text-[#666661]"
      }`}
    >
      <button
        onClick={goToToday}
        className={`flex flex-col items-center justify-center gap-1 rounded-[20px] py-2 text-[10px] font-[900] ${
          selectedView === "today"
            ? "text-white"
            : darkMode
            ? "text-white/55"
            : "text-[#666661]/45"
        }`}
        style={
          selectedView === "today"
            ? {
                backgroundColor: themeColor,
              }
            : undefined
        }
      >
        <ListChecks size={18} />
        Today
      </button>

      <button
        onClick={goToFocus}
        className={`flex flex-col items-center justify-center gap-1 rounded-[20px] py-2 text-[10px] font-[900] ${
          darkMode ? "text-white/55" : "text-[#666661]/45"
        }`}
      >
        <Target size={18} />
        Focus
      </button>

      <button
        onClick={goToCapture}
        className="mx-auto flex h-14 w-14 -translate-y-4 items-center justify-center rounded-full text-white shadow-[0_18px_44px_rgba(17,24,39,0.24)] transition active:scale-95"
        style={{
          backgroundColor: themeColor,
        }}
      >
        <Plus size={24} />
      </button>

      <button
        onClick={() => setSelectedView("inbox")}
        className={`relative flex flex-col items-center justify-center gap-1 rounded-[20px] py-2 text-[10px] font-[900] ${
          selectedView === "inbox"
            ? "text-white"
            : darkMode
            ? "text-white/55"
            : "text-[#666661]/45"
        }`}
        style={
          selectedView === "inbox"
            ? {
                backgroundColor: themeColor,
              }
            : undefined
        }
      >
        <Calendar size={18} />
        Inbox

        {inboxCount ? (
          <span
            className={`absolute right-3 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-[900] ${
              selectedView === "inbox"
                ? "bg-white text-[#666661]"
                : "bg-red-500 text-white"
            }`}
          >
            {inboxCount}
          </span>
        ) : null}
      </button>

      <div className="flex flex-col items-center justify-center gap-1 rounded-[20px] py-2">
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              userButtonAvatarBox: "h-7 w-7",

              userButtonPopoverCard:
                "w-[280px] rounded-[16px] border border-[#05AD98]/35 bg-[#171717] p-2 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]",

              userButtonPopoverMain: "bg-[#171717] text-white",

              userButtonPopoverActions: "bg-[#171717]",

              userButtonPopoverActionButton:
                "h-10 rounded-[10px] px-3 text-white hover:bg-white/[0.08]",

              userButtonPopoverActionButtonText:
                "text-[13px] font-[700] text-white",

              userButtonPopoverActionButtonIcon: "text-white/60",

              userButtonPopoverFooter: "hidden",

              userPreviewMainIdentifier: "text-sm font-[800] text-white",

              userPreviewSecondaryIdentifier:
                "text-xs font-[600] text-white/55",

              userPreviewAvatarBox: "h-8 w-8",
            },
          }}
        />

        <span
          className={`text-[10px] font-[900] ${
            darkMode ? "text-white/55" : "text-[#666661]/45"
          }`}
        >
          Account
        </span>
      </div>
    </nav>
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
}: any) {
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
        <footer
          className={`flex shrink-0 flex-col gap-3 border-t px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${rowBorder} ${secondarySurface}`}
        >
          <p className={`text-[11px] font-[500] ${mutedText}`}>
            {loading
              ? "You can add the full copied text immediately."
              : hasTasks
              ? `${selectedCount} of ${extractedTasks.length} selected`
              : "Save the full content as one task."}
          </p>

          <div className="flex items-center justify-end gap-2">
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
              <button
                type="button"
                onClick={onAddSelected}
                disabled={selectedCount === 0}
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
                Add selected
                <span className="opacity-55">
                  ({selectedCount})
                </span>
              </button>
            )}
          </div>
        </footer>
      </motion.section>
    </motion.div>
  );
}

function DueTasksReminderPopup({
  tasks,
  themeColor,
  onClose,
  onViewAll,
  onOpenTask,
}: any) {
  const getPopupPriorityColor = (priority?: string) => {
    if (priority === "High") return "#ef4444";
    if (priority === "Medium" || priority === "Med") return "#f97316";
    return "#10b981";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[194] flex items-center justify-center bg-black/25 p-4 backdrop-blur-[3px] sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.92,
          y: 18,
          filter: "blur(8px)",
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
        }}
        exit={{
          opacity: 0,
          scale: 0.94,
          y: 12,
          filter: "blur(6px)",
        }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 28,
          mass: 0.9,
        }}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[520px] overflow-hidden rounded-[30px] border border-[#BBBFBF]/45 bg-white shadow-[0_30px_100px_rgba(17,24,39,0.18)]"
      >
        <div
          className="absolute left-0 top-0 h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${themeColor}, ${themeColor}55, transparent)`,
          }}
        />

        <div
          className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: themeColor }}
        />

        <div className="relative p-5 sm:p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.035] text-[#666661]/45 transition hover:scale-105 hover:text-[#666661]"
          >
            <X size={17} />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
              style={{
                color: themeColor,
                backgroundColor: `${themeColor}14`,
                boxShadow: `0 16px 34px ${themeColor}18`,
              }}
            >
              <Clock3 size={25} strokeWidth={2.4} />
            </div>

            <div className="min-w-0">
              <h2 className="text-[22px] font-[900] leading-tight tracking-[-0.045em] text-[#666661]">
                2 hours left in your day
              </h2>

              <p className="mt-1 text-sm font-[700] text-[#666661]/48">
                Here are your tasks due today
              </p>
            </div>
          </div>

          <div className="mt-5 max-h-[310px] overflow-y-auto rounded-[22px] border border-black/[0.06] bg-white">
            {tasks.map((task: any) => {
              const priorityColor = getPopupPriorityColor(task.priority);

              return (
                <button
                  key={task.id}
                  onClick={() => onOpenTask(task)}
                  className="flex w-full items-center gap-3 border-b border-black/[0.055] px-4 py-3 text-left transition last:border-b-0 hover:bg-black/[0.018]"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: priorityColor }}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-[850] leading-5 tracking-[-0.018em] text-[#666661]">
                      {task.title}
                    </p>

                    <p className="mt-0.5 truncate text-[10.5px] font-[750] text-[#666661]/36">
                      {task.category} ·{" "}
                      {task.priority === "Medium" || task.priority === "Med"
                        ? "Mid"
                        : task.priority}
                    </p>
                  </div>

                  <span
                    className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-[900]"
                    style={{
                      color: themeColor,
                      borderColor: `${themeColor}2B`,
                      backgroundColor: `${themeColor}10`,
                    }}
                  >
                    Today
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-sm font-[750] text-[#666661]/50">
              {tasks.length} task{tasks.length === 1 ? "" : "s"} due today
            </p>

            <button
              onClick={onViewAll}
              className="h-12 rounded-[18px] px-5 text-sm font-[900] text-white shadow-[0_18px_38px_rgba(0,0,0,0.18)] transition hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: themeColor,
                boxShadow: `0 18px 38px ${themeColor}30`,
              }}
            >
              View all tasks
            </button>
          </div>
        </div>
      </motion.div>
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
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
  deleteTaskEverywhere,
  restoreCompletedTask,
  categories,
  darkMode,
  manualFocusTaskIds = [],
  setManualFocusTaskIds = () => {},
}: any) {
  const priorityOptions: Priority[] = ["Low", "Medium", "High"];
  const statusOptions = ["Active", "Waiting", "Someday"];

  const [newStepTitle, setNewStepTitle] = useState("");
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepTitle, setEditingStepTitle] = useState("");

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

  const addStepToSelectedTask = () => {
    const title = newStepTitle.trim();

    if (!title) return;

    setSelectedTask({
      ...selectedTask,
      subtasks: [
        ...getTaskSubtasks(selectedTask),
        {
          id: crypto.randomUUID(),
          title,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    setNewStepTitle("");
  };

  const toggleSelectedStep = (stepId: string) => {
    setSelectedTask({
      ...selectedTask,
      subtasks: getTaskSubtasks(selectedTask).map((step) =>
        step.id === stepId
          ? {
              ...step,
              completed: !step.completed,
            }
          : step
      ),
    });
  };

  const deleteSelectedStep = (stepId: string) => {
    setSelectedTask({
      ...selectedTask,
      subtasks: getTaskSubtasks(selectedTask).filter(
        (step) => step.id !== stepId
      ),
    });

    if (editingStepId === stepId) {
      setEditingStepId(null);
      setEditingStepTitle("");
    }
  };

  const startEditingStep = (step: Subtask) => {
    setEditingStepId(step.id);
    setEditingStepTitle(step.title);
  };

  const cancelEditingStep = () => {
    setEditingStepId(null);
    setEditingStepTitle("");
  };

  const saveEditedStep = () => {
    const title = editingStepTitle.trim();

    if (!editingStepId || !title) {
      cancelEditingStep();
      return;
    }

    setSelectedTask({
      ...selectedTask,
      subtasks: getTaskSubtasks(selectedTask).map((step) =>
        step.id === editingStepId
          ? {
              ...step,
              title,
            }
          : step
      ),
    });

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
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 p-3 backdrop-blur-[2px] sm:p-6"
    >
     <motion.div
  role="dialog"
  aria-modal="true"
  aria-labelledby="edit-task-modal-title"
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
        className={`will-change-[transform,clip-path,filter] flex max-h-[92vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-[10px] border shadow-[0_24px_80px_rgba(0,0,0,0.20)] ${
          darkMode
            ? "border-white/[0.14] bg-[#151515] text-white"
            : "border-[#CFCFCA] bg-[#FAFAF8] text-[#181818]"
        }`}
      >
        {/* Header */}
        <header
          className={`flex shrink-0 items-start justify-between gap-6 border-b px-5 py-5 sm:px-7 ${dividerClass}`}
        >
          <div className="min-w-0">
            <h2
              id="edit-task-modal-title"
              className={`text-[24px] font-[750] leading-none tracking-[-0.045em] ${
                darkMode ? "text-white" : "text-[#181818]"
              }`}
            >
              Edit Task
            </h2>

            <p
              className={`mt-2 text-[12px] font-[500] leading-5 ${mutedTextClass}`}
            >
              Edit the task details on the left. Break execution into steps on
              the right.
            </p>
          </div>

          <button
            type="button"
            onClick={closeWithoutSaving}
            aria-label="Close edit task"
            title="Close"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] transition ${
              darkMode
                ? "text-white/55 hover:bg-white/[0.07] hover:text-white"
                : "text-[#6F6F6A] hover:bg-black/[0.04] hover:text-[#181818]"
            }`}
          >
            <X size={18} strokeWidth={1.6} />
          </button>
        </header>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid min-h-full grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_1px_minmax(0,1.05fr)]">
            {/* Task details */}
            <section className="px-5 py-5 sm:px-7 sm:py-6">
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
                      className={`grid h-11 grid-cols-3 overflow-hidden rounded-[7px] border ${
                        darkMode
                          ? "border-white/[0.24]"
                          : "border-[#A8A8A2]"
                      }`}
                    >
                      {statusOptions.map((status) => {
                        const isActive =
                          (selectedTask.status || "Active") === status;

                        return (
                          <button
                            key={status}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() =>
                              setSelectedTask({
                                ...selectedTask,
                                status,
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
                            {status}
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
                        value={
                          selectedTask.category ||
                          categories[0]?.title ||
                          ""
                        }
                        onChange={(event) =>
                          setSelectedTask({
                            ...selectedTask,
                            category: event.target.value,
                          })
                        }
                        className={`h-11 appearance-none rounded-[7px] pr-10 ${fieldClass}`}
                      >
                        {categories.map((category: any) => (
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
              className={`border-t px-5 py-5 sm:px-7 sm:py-6 lg:border-t-0 ${
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
                  aria-label="New subtask"
                  value={newStepTitle}
                  onChange={(event) =>
                    setNewStepTitle(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addStepToSelectedTask();
                    }
                  }}
                  placeholder="Add a subtask..."
                  className={`h-11 rounded-[7px] ${fieldClass}`}
                />

                <button
                  type="button"
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
                        className={`grid min-h-[54px] grid-cols-[36px_minmax(0,1fr)_34px_34px] items-center gap-2 border-b px-2 last:border-b-0 ${dividerClass}`}
                      >
                        <button
                          type="button"
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
          className={`flex shrink-0 flex-col-reverse gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 ${dividerClass}`}
        >
          <div className="flex items-center gap-4">
            {selectedTask.completed && (
              <button
                type="button"
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

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeWithoutSaving}
              className={`h-10 rounded-[7px] px-4 text-[12px] font-[650] transition ${
                darkMode
                  ? "text-white/55 hover:bg-white/[0.06] hover:text-white"
                  : "text-[#6F6F6A] hover:bg-black/[0.035] hover:text-[#181818]"
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveAndClose}
              disabled={!selectedTask?.title?.trim()}
              className={`h-10 min-w-[76px] rounded-[7px] px-5 text-[12px] font-[700] transition ${
                !selectedTask?.title?.trim()
                  ? "cursor-not-allowed opacity-35"
                  : darkMode
                  ? "bg-white text-[#181818] hover:bg-white/90"
                  : "bg-[#181818] text-white hover:bg-[#2A2A2A]"
              }`}
            >
              Done
            </button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
}