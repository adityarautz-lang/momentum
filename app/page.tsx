"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Inter } from "next/font/google";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "@/components/Sidebar";
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
Target,
  Trash2,
  TrendingUp,
Eye,
ChevronDown,
ChevronRight,
Check,
X,
} from "lucide-react";


type TaskTag = "follow-up";

type SortMode = "veira" | "date" | "priority";
type GroupMode = "none" | "category" | "priority" | "date";
type MobileGroupMode = "category" | "priority" | "date";

const MOBILE_GROUP_MODE_KEY = "veira-mobile-group-mode";

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



const getTimeRemainingInDay = (dayEndTime: string) => {
  const now = new Date();
  const [hours, minutes] = dayEndTime.split(":").map(Number);

  const endTime = new Date();
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

  const totalMinutes = Math.floor(difference / 1000 / 60);
  const hoursLeft = Math.floor(totalMinutes / 60);
  const minutesLeft = totalMinutes % 60;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const totalDayDuration = endTime.getTime() - startOfDay.getTime();
  const elapsed = now.getTime() - startOfDay.getTime();

  const percentLeft = Math.max(
    0,
    Math.min(100, Math.round(100 - (elapsed / totalDayDuration) * 100))
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
    return "This looks like an admin or official task, so Veira suggests handling it soon.";
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
    return "This sounds time-sensitive or submission-based, so Veira moved it higher.";
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
    return "This may depend on another person or available slots, so Veira suggests doing it early.";
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
    return "This involves communication with someone else, so Veira suggests not leaving it open too long.";
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
    return "This looks like an errand or purchase, so Veira suggests scheduling it soon.";
  }

  if (priority === "High") {
    return "This was classified as high priority, so Veira kept it near the top.";
  }

  if (priority === "Medium") {
    return "This looks useful but not immediately critical.";
  }

  return "This looks less urgent, so Veira placed it lower for now.";
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
const getPriorityClass = (priority: Priority) => {
  if (priority === "High") {
    return "border border-red-500/15 bg-red-500/[0.08] text-red-500 dark:border-red-300/15 dark:bg-red-400/[0.10] dark:text-red-200";
  }

  if (priority === "Medium") {
    return "border border-amber-500/15 bg-amber-500/[0.08] text-amber-600 dark:border-amber-300/15 dark:bg-amber-300/[0.09] dark:text-amber-200";
  }

  return "border border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-600 dark:border-emerald-300/15 dark:bg-emerald-300/[0.09] dark:text-emerald-200";
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
const CLIPBOARD_HANDLED_KEY = "veira-last-handled-clipboard-text";

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
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-[850] tracking-[-0.01em] ${
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
const [todayTaskSortMode, setTodayTaskSortMode] = useState<SortMode>("veira");
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
const [dailyBoostCount, setDailyBoostCount] = useState(0);
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
      document.getElementById("veira-mobile-task-list-anchor") ||
      document.getElementById("veira-task-list-anchor")
    );
  }

  return taskListRef.current || document.getElementById("veira-task-list-anchor");
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

  const todayDate = getTodayDate();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const dayTimeRemaining = useMemo(() => {
    currentTime;
    return getTimeRemainingInDay(dayEndTime);
  }, [currentTime, dayEndTime]);

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
          ["veira", "date", "priority"].includes(parsed.todayTaskSortMode)
            ? (parsed.todayTaskSortMode as SortMode)
            : "veira"
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
        setDayEndTime(parsed.dayEndTime || "18:00");
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
        todayTaskSortMode === "veira" &&
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

const dueReminderKey = `veira-due-reminder-${todayDate}-${dayEndTime}`;

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
        setClipboardExtractError("Veira could not extract tasks from this text.");
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
const boostCacheKey = `momentum-boost-${boostCacheDate}`;
const boostCountKey = `momentum-boost-count-${boostCacheDate}`;


/* ------------------------------------------------ */
/* Load Veira Boost Cache */
/* ------------------------------------------------ */

useEffect(() => {
  if (!isLoaded) return;

  const cachedBoost = localStorage.getItem(boostCacheKey);
  const cachedCount = localStorage.getItem(boostCountKey);

  if (cachedBoost) {
    try {
      const parsed = JSON.parse(cachedBoost);

      if (parsed?.message && parsed?.taskKey) {
        setBoostMessage(parsed.message);
        setLastBoostTaskKey(parsed.taskKey);
      }
    } catch (error) {
      console.error("Failed to load cached boost:", error);
    }
  }

  setDailyBoostCount(Number(cachedCount || 0));
}, [isLoaded, boostCacheKey, boostCountKey]);

/* ------------------------------------------------ */
/* Automatic Veira Boost */
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

  if (completedToday.length === 1) {
    const firstWinMessage =
      "Nice — first win logged. Momentum is starting to build.";

    setBoostMessage(firstWinMessage);
    setLastBoostTaskKey(completedBoostTaskKey);
    setBoostLoading(false);

    localStorage.setItem(
      boostCacheKey,
      JSON.stringify({
        message: firstWinMessage,
        taskKey: completedBoostTaskKey,
        generatedAt: new Date().toISOString(),
        source: "local",
      })
    );

    return;
  }

  if (completedBoostTaskKey === lastBoostTaskKey) return;

  if (dailyBoostCount >= 3) {
    const cappedMessage = `You’ve completed ${completedToday.length} tasks today. That is strong progress — and momentum is already visible.`;

    setBoostMessage(cappedMessage);
    setLastBoostTaskKey(completedBoostTaskKey);
    setBoostLoading(false);

    localStorage.setItem(
      boostCacheKey,
      JSON.stringify({
        message: cappedMessage,
        taskKey: completedBoostTaskKey,
        generatedAt: new Date().toISOString(),
        source: "local-cap",
      })
    );

    return;
  }

  const timeout = setTimeout(async () => {
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate boost.");
      }

      const nextBoostMessage =
        data.boost || "Nice work — you made visible progress today.";

      const nextBoostCount = dailyBoostCount + 1;

      setBoostMessage(nextBoostMessage);
      setLastBoostTaskKey(completedBoostTaskKey);
      setDailyBoostCount(nextBoostCount);

      localStorage.setItem(
        boostCacheKey,
        JSON.stringify({
          message: nextBoostMessage,
          taskKey: completedBoostTaskKey,
          generatedAt: new Date().toISOString(),
          source: "ai",
        })
      );

      localStorage.setItem(boostCountKey, String(nextBoostCount));
    } catch (error) {
      console.error(error);

      const fallbackMessage = `Nice work — you’ve completed ${
        completedTaskTitles.length
      } task${
        completedTaskTitles.length === 1 ? "" : "s"
      } today. Keep building momentum.`;

      setBoostMessage(fallbackMessage);
      setLastBoostTaskKey(completedBoostTaskKey);

      localStorage.setItem(
        boostCacheKey,
        JSON.stringify({
          message: fallbackMessage,
          taskKey: completedBoostTaskKey,
          generatedAt: new Date().toISOString(),
          source: "fallback",
        })
      );
    } finally {
      setBoostLoading(false);
    }
  }, 3000);

  return () => clearTimeout(timeout);
}, [
  isLoaded,
  selectedView,
  completedBoostTaskKey,
  completedToday,
  lastBoostTaskKey,
  dailyBoostCount,
  boostCacheKey,
  boostCountKey,
]);


  /* ------------------------------------------------ */
  /* Theme Classes */
  /* ------------------------------------------------ */

  const glass = darkMode
  ? "bg-[#171717] border border-[#05AD98]/16"
  : "bg-white/82 backdrop-blur-2xl";

  const strongerGlass = darkMode
  ? "bg-[#171717] border-white/[0.055] shadow-[0_24px_80px_rgba(0,0,0,0.32)]"
  : "bg-white/95 border-[#BBBFBF]/35 shadow-[0_12px_36px_rgba(17,24,39,0.045)] backdrop-blur-2xl";

const input = darkMode
    ? "bg-[#1f1f21] text-white placeholder:text-white/35 border border-[#05AD98]/18 focus:border-[#05AD98]/70"
  : "bg-white text-[#111111] placeholder:text-[#878787] border border-[#BBBFBF]/45 focus:border-[#05AD98]/55";

  const border = darkMode ? "border-white/[0.055]" : "border-[#BBBFBF]/35";

const modalSelect = darkMode
  ? "bg-[#1f1f21] text-white border border-white/[0.08]"
  : "bg-white text-black border border-[#BBBFBF]/45";

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
                "Veira reviewed this task with your reason in mind.",
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
                "Veira reviewed this task.",
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
    const initialWhy = manualWhy || "Veira is finding why this matters...";
  
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
    const sourceText = (sourceTextOverride ?? extractInput).trim();

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
          "Veira could not connect to the AI service. Please try again."
        );
      }
  
      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Veira could not extract tasks right now."
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

    anchorTaskListSoon();
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
    anchorTaskListSoon();
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
            aiReason: "You accepted Veira's app-suggested date.",
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
            aiReason: "You accepted Veira's app-suggested date.",
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
      "Reset all Veira data? This will delete active tasks, completed tasks, and archived items."
    );

    if (!confirmed) return;

    setCategories(initialCategories);
    setArchive([]);
    setCompletedToday([]);
    setManualFocusTaskIds([]);
    setSelectedCategory(initialCategories[0].title);
    setSelectedView("today");
    setTodayTaskSortMode("veira");
    setTodayTaskGroupMode("none");
    setThemeColor(DEFAULT_THEME_COLOR);
    setDarkMode(false);
    
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(MOBILE_GROUP_MODE_KEY);
    }

    setArchiveToast("Veira data reset");

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
  className={`${fontClass} min-h-screen w-full overflow-x-hidden transition-colors duration-500 ${
    darkMode
? "bg-[#111111] text-white"
: "bg-[#f6f8f8] text-[#111111]"
    }`}
  >
    {darkMode && (
  <>
   <div className="pointer-events-none fixed inset-0 z-0 bg-[#111111]" />
    
  </>
)}

<FirecrackerLayer firecrackers={firecrackers} themeColor={themeColor} />
<Toast message={archiveToast} darkMode={darkMode} />

<div className="relative z-10 flex min-h-screen w-full overflow-x-hidden">
      <Sidebar
  darkMode={darkMode}
  setDarkMode={setDarkMode}
  selectedView={selectedView}
  setSelectedView={setSelectedView}
  themeColor={themeColor}
  inboxCount={inboxTasks.length}
/>

<div className="min-w-0 flex-1 overflow-x-hidden px-4 pb-28 pt-5 sm:px-6 sm:pb-28 sm:pt-6 lg:pl-[284px] lg:pb-16 lg:pt-6 xl:px-10 xl:py-8 xl:pl-[300px]">
<div className="mx-auto w-full max-w-[1400px] overflow-x-hidden">
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
             setDarkMode={setDarkMode}
             border={border}
             className={strongerGlass}
             themeColor={themeColor}
             setThemeColor={setThemeColor}
             userRole={userRole}
             setUserRole={setUserRole}
             input={input}
             enableAppSuggestions={enableAppSuggestions}
                setEnableAppSuggestions={setEnableAppSuggestions}
                enableAutoPriority={enableAutoPriority}
                setEnableAutoPriority={setEnableAutoPriority}
                enableClipboardAssist={enableClipboardAssist}
                setEnableClipboardAssist={setEnableClipboardAssist}
                upcomingViewMode={upcomingViewMode}
                setUpcomingViewMode={setUpcomingViewMode}
                priorityViewMode={priorityViewMode}
                setPriorityViewMode={setPriorityViewMode}
                archiveCount={archive.length}
                clearArchive={clearArchive}
                resetAppData={resetAppData}
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

  {showClipboardPrompt && clipboardCandidate && (
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
 />
  )}
</AnimatePresence>

<style jsx global>{`
  .veira-mobile-category-tabs {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .veira-mobile-category-tabs::-webkit-scrollbar {
    display: none;
  }

  @keyframes veiraNewTaskGlow {
    0% {
      background-color: ${themeColor}26;
      box-shadow: 0 0 0 1px ${themeColor}55, 0 18px 45px ${themeColor}20;
    }
    42% {
      background-color: ${themeColor}18;
      box-shadow: 0 0 0 1px ${themeColor}35, 0 14px 34px ${themeColor}16;
    }
    72% {
      background-color: ${themeColor}10;
      box-shadow: 0 0 0 1px ${themeColor}22, 0 10px 26px ${themeColor}10;
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
}: any) {
  const [showMorningBrief, setShowMorningBrief] = useState(false);
  const [morningBrief, setMorningBrief] = useState({
    quote: "Small steps still move the day forward.",
  });
  
  useEffect(() => {
    const now = new Date();
    const morningBriefKey = `veira-morning-brief-${getTodayDate()}`;
  
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
          quote:
            data.quote || "Small steps still move the day forward.",
        };
  
        setMorningBrief(nextBrief);
        setShowMorningBrief(true);
        localStorage.setItem(morningBriefKey, JSON.stringify(nextBrief));
      } catch {
        setShowMorningBrief(true);
      }
    };
  
    void loadMorningBrief();
  }, [dueSoonCount, highPriorityCount, completedToday.length, prioritizedTasks.length]);

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
/>

      <div className="hidden sm:block">
  <section
  className={`relative z-[120] mb-5 hidden overflow-visible rounded-[30px] border px-5 py-4 sm:block sm:rounded-[34px] sm:px-6 sm:py-3 ${strongerGlass} ${border}`}
>
<div className="relative pr-[300px]">
    <div className="min-w-0 flex-1">
    <div
  className="mb-3 h-1.5 w-[220px] rounded-full"
  style={{ backgroundColor: themeColor }}
/>

<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-[24px] font-[700] leading-tight tracking-[-0.05em]">
          Today&apos;s Momentum
        </h1>

        <span
          className={`rounded-full px-3 py-1 text-[11px] font-[700] ${
            darkMode
              ? "bg-white/[0.06] text-white/50"
              : "bg-black/[0.035] text-black/45"
          }`}
        >
          {formatDateLong()}
        </span>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`hidden h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-[700] transition hover:scale-[1.02] ${
            darkMode
              ? "bg-white/[0.06] text-white/55 hover:text-white"
              : "bg-black/[0.035] text-black/50 hover:text-black"
          }`}
        >
          {darkMode ? <Sun size={13} /> : <Moon size={13} />}
          {darkMode ? "Light" : "Dark"}
        </button>
      </div>

      <p
        className={`mt-1.5 text-sm font-[500] ${
          darkMode ? "text-white/42" : "text-black/42"
        }`}
      >
        {allTasks.length} tasks · {completedToday.length} completed ·{" "}
        {completionPercent}% progress
      </p>

     
      {showMorningBrief && (
<div
  className={`mt-4 rounded-[22px] border px-4 py-3 ${
          darkMode
            ? "border-white/[0.07] bg-white/[0.035]"
            : "border-black/[0.045] bg-black/[0.018]"
        }`}
      >
        {/* <p
          className="text-[11px] font-[900] uppercase tracking-[0.16em]"
          style={{ color: themeColor }}
        >
          Morning Brief
        </p> */}

<p
  className="mt-1 text-[16px] font-[700] tracking-[-0.035em]"
  style={{ color: themeColor }}
>
  Good morning! {morningBrief.quote}
</p>

<p
  className={`mt-2 text-sm font-[600] ${
    darkMode ? "text-white/50" : "text-black/50"
  }`}
>
You have {dueSoonCount} task{dueSoonCount === 1 ? "" : "s"} needing attention today, including {highPriorityCount} high-priority item{highPriorityCount === 1 ? "" : "s"}. Your focus stack is ready.
</p>
      </div>
      )}
    </div>



    <div className="absolute right-0 top-0 z-[400]">
  <DayTimeLeftCard
    dayEndTime={dayEndTime}
    setDayEndTime={setDayEndTime}
    dayTimeRemaining={dayTimeRemaining}
    darkMode={darkMode}
    themeColor={themeColor}
  />
</div>
  </div>

  {completedToday.length > 0 && (
    <div
      className={`mt-4 rounded-[22px] border px-4 py-3 ${
        darkMode
          ? "border-white/[0.07] bg-white/[0.035]"
          : "border-black/[0.045] bg-black/[0.018]"
      }`}
    >
      <p
        className="text-[11px] font-[900] uppercase tracking-[0.16em]"
        style={{ color: themeColor }}
      >
        AI Veira Boost
      </p>

      <p
        className={`mt-1 max-w-[980px] text-[15px] font-[700] leading-6 tracking-[-0.025em] ${
          darkMode ? "text-white/58" : "text-black/58"
        }`}
      >
        {boostLoading
          ? "Reading your wins..."
          : boostMessage ||
            "Your completed tasks are turning into visible progress."}
      </p>
    </div>
  )}
</section>



     
<section
  className={`relative z-[10] mb-4 overflow-hidden rounded-[26px] border px-4 py-4 sm:mb-4 sm:rounded-[34px] sm:px-6 sm:py-5 ${
    darkMode
      ? "border-white/[0.08] bg-[#171717] shadow-[0_18px_54px_rgba(0,0,0,0.30)]"
      : "border-[#BBBFBF]/32 bg-white/95 shadow-[0_18px_54px_rgba(17,24,39,0.055)] backdrop-blur-2xl"
  }`}
>
  <div
    className="pointer-events-none absolute left-0 top-0 h-1 w-full"
    style={{
      background: `linear-gradient(90deg, ${themeColor}, transparent)`,
    }}
  />

  <div
    className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full opacity-[0.14] blur-3xl"
    style={{
      backgroundColor: themeColor,
    }}
  />

  <div className="relative">
  <div className="mb-2 flex items-start justify-between gap-3 sm:mb-3 sm:items-center">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[18px] font-[700] tracking-[-0.035em] sm:text-[22px]">
          <Send size={16} style={{ color: themeColor }} />
          Quick Capture
        </h2>

        <p
            className={`mt-0.5 text-[11px] font-[700] sm:text-xs ${
            darkMode ? "text-white/42" : "text-black/38"
          }`}
        >
          Veira will organize it for you
        </p>
      </div>
    </div>

    <div
  className={`flex min-h-[54px] overflow-hidden rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all duration-200 focus-within:shadow-[0_16px_40px_rgba(17,24,39,0.08)] ${
    darkMode
      ? "border-white/[0.09] bg-[#1f1f21] focus-within:border-[#05AD98]/60"
      : "border-[#BBBFBF]/42 bg-white focus-within:border-[#05AD98]/55"
  }`}
>
  <input
    value={newTask}
    onChange={(e) => setNewTask(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") addTask();
    }}
    placeholder="Capture anything..."
    className={`h-[54px] min-w-0 flex-1 bg-transparent px-5 text-[13px] font-[750] tracking-[-0.02em] outline-none sm:px-6 sm:text-sm ${
      darkMode
        ? "text-white placeholder:text-white/35"
        : "text-black placeholder:text-black/35"
    }`}
  />

<div
  className={`my-4 w-px shrink-0 ${
    darkMode ? "bg-white/[0.07]" : "bg-black/[0.055]"
  }`}
/>

  <input
    value={newTaskWhy}
    onChange={(e) => setNewTaskWhy(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") addTask();
    }}
    placeholder="Optional context..."
    className={`h-[54px] min-w-0 flex-1 bg-transparent px-5 text-[13px] font-[750] tracking-[-0.02em] outline-none sm:px-6 sm:text-sm ${
      darkMode
        ? "text-white placeholder:text-white/35"
        : "text-black placeholder:text-black/35"
    }`}
  />

<button
  onClick={addTask}
  className="m-1.5 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-white transition hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.98]"
  style={{
    backgroundColor: themeColor,
    boxShadow: `0 16px 34px ${themeColor}36`,
  }}
>
  <Send size={16} />
</button>
</div>

    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        onClick={() => setIsExtractModalOpen(true)}

        style={{
          "--theme-border": `${themeColor}40`,
          "--theme-soft": `${themeColor}18`,
          color: themeColor,
        } as React.CSSProperties}

        className={`rounded-full border px-3 py-1.5 text-[11px] font-[700] transition hover:scale-[1.02] sm:text-xs ${
          darkMode
        ? "border-[color:var(--theme-border)] bg-[color:var(--theme-soft)]"
: "border-[color:var(--theme-border)] bg-[color:var(--theme-soft)]"
        }`}
      >
        Extract from text
      </button>

      {/* {[
        "Submit insurance claim next week",
        "Buy birthday gift for mom",
        "Book dentist appointment",
      ].map((example, index) => (
        <button
          key={example}
          onClick={() => {
            setNewTask(example);
          
            if (example === "Submit insurance claim next week") {
              setNewTaskWhy("Avoid delay in claim approval.");
            }
          
            if (example === "Buy birthday gift for mom") {
              setNewTaskWhy("Make sure it arrives before her birthday.");
            }
          
            if (example === "Book dentist appointment") {
              setNewTaskWhy("Prevent the issue from getting worse.");
            }
          }}
          className={`rounded-full border px-3 py-1.5 text-[11px] font-[700] transition hover:scale-[1.02] sm:text-xs ${
            index > 0 ? "hidden sm:inline-flex" : "inline-flex"
          } ${
            darkMode
              ? "border-white/[0.08] bg-white/[0.045] text-white/48 hover:text-white"
              : "border-black/[0.06] bg-white text-black/45 hover:text-black/70"
          }`}
        >
          {example}
        </button>
      ))} */}
    </div>
  </div>
</section>


<div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-[minmax(0,11fr)_minmax(360px,9fr)]">

<div className="order-1 xl:order-1">
  <TaskListPanel
  title="Veira Prioritized for You"
  description="Veira lines up your tasks based on intent, urgency, & priority"
  tasks={prioritizedTasks}
sortMode={taskSortMode}
setSortMode={setTaskSortMode}
groupMode={taskGroupMode}
setGroupMode={setTaskGroupMode}
darkMode={darkMode}
  border={border}
  className={strongerGlass}
  themeColor={themeColor}
  toggleTaskById={toggleTaskById}
  suggestingTaskIds={suggestingTaskIds}
  deleteTask={deleteTask}
  acceptSuggestedDateById={acceptSuggestedDateById}
  setSelectedTask={setSelectedTask}
  setIsEditModalOpen={setIsEditModalOpen}
  emptyMessage="Add a task below. Veira will organize it for you."
  ranked
  draggableTasks
  manualFocusTaskIds={manualFocusTaskIds}
  setManualFocusTaskIds={setManualFocusTaskIds}
togglePinTask={togglePinTask}
selectWhySuggestion={selectWhySuggestion}
taskListRef={taskListRef}
anchorTaskListSoon={anchorTaskListSoon}
newlyAddedTaskIds={newlyAddedTaskIds}
/>
  </div>

  <div className="order-2 xl:order-2">
  <FocusModePanel
  prioritizedTasks={prioritizedTasks}
  completedToday={completedToday}
  darkMode={darkMode}
  border={border}
  strongerGlass={strongerGlass}
  themeColor={themeColor}
  toggleTaskById={toggleTaskById}
  setSelectedTask={setSelectedTask}
  setIsEditModalOpen={setIsEditModalOpen}
  manualFocusTaskIds={manualFocusTaskIds}
  setManualFocusTaskIds={setManualFocusTaskIds}
  />
  </div>
</div>

      <CompletedTodaySection
  completedToday={completedToday}
  restoreCompletedTask={restoreCompletedTask}
  archiveCompletedToday={archiveCompletedToday}
  themeColor={themeColor}
  darkMode={darkMode}
  glass={glass}
  strongerGlass={strongerGlass}
  border={border}
/>
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
}: any) {
  const [mobileGroupMode, setMobileGroupMode] =
  useState<MobileGroupMode>("category");
  const [selectedChip, setSelectedChip] = useState("");
  const [showAllMobileTasks, setShowAllMobileTasks] = useState(false);
  const [isMobileTimePickerOpen, setIsMobileTimePickerOpen] = useState(false);

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

const mobileGroupTabs = useMemo(() => {
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
      style={{ color: darkMode ? "#FFFFFF" : "#1F2937" }}
    >
      Veira
    </p>

    <p
      className="mt-1.5 whitespace-nowrap text-[9px] font-[800] uppercase leading-none tracking-[0.04em]"
      style={{ color: darkMode ? "#FFFFFF" : "#1F2937" }}
    >
      Focus. Prioritize. Move forward.
    </p>
  </div>
</div>

    <div
      className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-[11px] font-[850] ${
        darkMode
          ? "border-white/[0.08] bg-white/[0.045] text-white/48"
          : "border-black/[0.06] bg-white text-black/45"
      }`}
    >
      <Sparkles size={13} style={{ color: themeColor }} />
      Today
    </div>
  </div>

  <div>
    <p className="text-[18px] font-[900] tracking-[-0.04em]">
      {greeting} 👋
    </p>

    <p
      className={
        darkMode
          ? "mt-1 text-xs font-[700] text-white/42"
          : "mt-1 text-xs font-[700] text-black/42"
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
                  className="h-9 rounded-[14px] border border-white/[0.14] bg-white text-[12px] font-[900] text-[#111827] outline-none"
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
                  className="h-9 rounded-[14px] border border-white/[0.14] bg-white text-[12px] font-[900] text-[#111827] outline-none"
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
                  className="h-9 rounded-[14px] border border-white/[0.14] bg-white text-[12px] font-[900] text-[#111827] outline-none"
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

            <p className={darkMode ? "text-[11px] font-[700] text-white/40" : "text-[11px] font-[700] text-black/40"}>
              Veira will organize it for you
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
                : "text-black placeholder:text-black/32"
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
                  : "text-black placeholder:text-black/32"
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
  id="veira-mobile-task-list-anchor"
  className={`mb-4 scroll-mt-5 overflow-hidden rounded-[28px] border p-4 shadow-[0_18px_50px_rgba(17,24,39,0.06)] ${
    darkMode
      ? "border-white/[0.08] bg-[#171717]"
      : "border-black/[0.06] bg-white"
  }`}
>
       <div className="mb-4 flex items-start justify-between gap-3">
  <div className="min-w-0">
    <h2 className="flex items-center gap-2 text-[20px] font-[900] leading-tight tracking-[-0.055em]">
      Veira Prioritized for You
      <Sparkles size={16} style={{ color: themeColor }} />
    </h2>

    <p
      className={`mt-1.5 text-[13px] font-[750] leading-5 tracking-[-0.02em] ${
        darkMode ? "text-white/45" : "text-black/48"
      }`}
    >
      Top moves based on intent, urgency, and priority.
    </p>
  </div>
</div>

<div className="mb-3 flex items-center justify-between gap-3">
  <span
    className={`shrink-0 text-[10px] font-[850] uppercase tracking-[0.14em] ${
      darkMode ? "text-white/32" : "text-black/32"
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
              : "text-black/45"
          }`}
          style={isActive ? { backgroundColor: themeColor } : undefined}
        >
          {option.label}
        </button>
      );
    })}
  </div>
</div>

<div className="veira-mobile-category-tabs -mx-1 mb-3 flex overflow-x-auto px-1 pb-0">
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
              : "text-[#111827]"
            : darkMode
            ? "text-white/42"
            : "text-black/45"
        }`}
      >
        <span>{chip.label}</span>

        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-[850] ${
            isActive
              ? "text-white"
              : darkMode
              ? "bg-white/[0.07] text-white/45"
              : "bg-black/[0.045] text-black/45"
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
                  : "border-black/[0.08] text-black/35"
              }`}
            >
              No tasks here yet.
            </div>
          )}

          {visibleTasks.map((task: any, index: number) => {
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
                      className={darkMode ? "text-white/30" : "text-black/30"}
                    />
                  </button>

                  <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-[900] text-white"
                    style={{
                      backgroundColor: index < 3 ? themeColor : "#9ca3af",
                    }}
                  >
                    {index + 1}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setIsEditModalOpen(true);
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
               <p
  className={`text-[15.5px] font-[700] leading-[21px] tracking-[-0.025em] ${
    darkMode ? "text-white/90" : "text-[#111827]"
  }`}
>
  {task.title}
</p>

<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
  <span
    className={
      darkMode
        ? "text-[12px] font-[600] text-white/45"
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
          ? "text-[12px] font-[600] text-white/45"
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
        ? "bg-white/[0.06] text-white/45"
        : "bg-black/[0.04] text-black/45"
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
        : "bg-black/[0.04] text-black/38 hover:text-red-500"
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
                : "border-black/[0.06] bg-black/[0.025] text-black/50"
            }`}
          >
            {showAllMobileTasks ? "Show less" : `Show ${hiddenCount} more`}
          </button>
        )}
      </section>

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

            <p className={darkMode ? "mt-1 text-xs font-[700] text-white/42" : "mt-1 text-xs font-[700] text-black/42"}>
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
                  : "border-black/[0.08] text-black/35"
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
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-[900] text-white"
                style={{ backgroundColor: themeColor }}
              >
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-[900] tracking-[-0.02em]">
                  {task.title}
                </p>

                <p className={darkMode ? "mt-1 text-[10px] font-[800] text-white/38" : "mt-1 text-[10px] font-[800] text-black/38"}>
                  {task.category} ·{" "}
                  {task.priority === "Medium" ? "Mid" : task.priority}
                </p>
              </div>

              <Eye size={15} className={darkMode ? "text-white/35" : "text-black/35"} />
            </button>
          ))}
        </div>
      </section>

      <section className="mb-2">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2
              className="text-[11px] font-[900] uppercase tracking-[0.18em]"
              style={{ color: themeColor }}
            >
              Completed Today
            </h2>

            <span
              className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-[900] text-white"
              style={{ backgroundColor: themeColor }}
            >
              {completedToday.length}
            </span>
          </div>

          <button
            onClick={archiveCompletedToday}
            className={`text-xs font-[900] ${
              completedToday.length === 0
                ? "pointer-events-none opacity-30"
                : darkMode
                ? "text-white/48"
                : "text-black/42"
            }`}
          >
            Archive All
          </button>
        </div>

        <div
          className={`overflow-hidden rounded-[24px] border ${
            darkMode
              ? "border-white/[0.08] bg-[#171717]"
              : "border-black/[0.06] bg-white"
          }`}
        >
          {completedToday.length === 0 && (
            <div className={darkMode ? "p-5 text-sm font-[700] text-white/35" : "p-5 text-sm font-[700] text-black/35"}>
              Nothing completed yet.
            </div>
          )}

          {completedToday.map((task: any) => (
            <div
              key={task.id}
              className={darkMode ? "flex items-center gap-3 border-b border-white/[0.07] px-4 py-3 last:border-b-0" : "flex items-center gap-3 border-b border-black/[0.055] px-4 py-3 last:border-b-0"}
            >
              <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-[850]">{task.title}</p>
                <p className={darkMode ? "mt-0.5 text-[10px] font-[750] text-white/35" : "mt-0.5 text-[10px] font-[750] text-black/35"}>
                  {task.category}
                </p>
              </div>

              <button
                onClick={() => restoreCompletedTask(task.id)}
                className={darkMode ? "rounded-full bg-white/[0.06] px-3 py-1.5 text-[10px] font-[900] text-white/50" : "rounded-full bg-black/[0.04] px-3 py-1.5 text-[10px] font-[900] text-black/50"}
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TaskListPanel({
  title,
  description,
  tasks,
sortMode = "veira",
setSortMode = () => {},
groupMode = "none",
setGroupMode = () => {},
emptyMessage,
  darkMode,
  border,
  className,
  themeColor,
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
}: any) {
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [expandedWhyTaskId, setExpandedWhyTaskId] = useState<string | null>(null);
  const whyDropdownRef = useRef<HTMLDivElement | null>(null);
  
  const defaultVisibleTaskCount = 6;

  const priorityRank: Record<string, number> = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  const sortedTasks = useMemo(() => {
    const nextTasks = [...tasks];

    if (sortMode === "date") {
      return nextTasks.sort((a, b) => {
        const dateA = getTaskDate(a);
        const dateB = getTaskDate(b);

        if (!dateA && !dateB) return b.score - a.score;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateA.localeCompare(dateB);
      });
    }

    if (sortMode === "priority") {
      return nextTasks.sort((a, b) => {
        const priorityDiff =
          (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);

        if (priorityDiff !== 0) return priorityDiff;

        const dateA = getTaskDate(a);
        const dateB = getTaskDate(b);

        if (!dateA && !dateB) return b.score - a.score;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateA.localeCompare(dateB);
      });
    }

    return nextTasks;
  }, [tasks, sortMode]);

  const categoryGroupOrder: Record<string, number> = {};

  sortedTasks.forEach((task: any) => {
    const categoryTitle = task.category || "No Category";

    if (categoryGroupOrder[categoryTitle] === undefined) {
      categoryGroupOrder[categoryTitle] = Object.keys(categoryGroupOrder).length;
    }
  });

  const getTaskGroupMeta = (task: any) => {
    if (groupMode === "category") {
      const categoryTitle = task.category || "No Category";

      return {
        key: `category:${categoryTitle}`,
        title: categoryTitle,
        description: "Category",
        order: categoryGroupOrder[categoryTitle] ?? 999,
        dotColor: themeColor,
      };
    }

    if (groupMode === "priority") {
      const normalizedPriority =
        task.priority === "Med" ? "Medium" : task.priority || "Low";

      const priorityMeta: Record<
        string,
        {
          key: string;
          title: string;
          description: string;
          order: number;
          dotColor: string;
        }
      > = {
        High: {
          key: "priority:high",
          title: "High",
          description: "Highest attention",
          order: 0,
          dotColor: "#ef4444",
        },
        Medium: {
          key: "priority:medium",
          title: "Mid",
          description: "Useful, but less urgent",
          order: 1,
          dotColor: "#f97316",
        },
        Low: {
          key: "priority:low",
          title: "Low",
          description: "Keep visible",
          order: 2,
          dotColor: "#10b981",
        },
      };

      return priorityMeta[normalizedPriority] || priorityMeta.Low;
    }

    if (groupMode === "date") {
      const date = getTaskDate(task);

      if (!date) {
        return {
          key: "date:no-date",
          title: "No date",
          description: "Needs scheduling",
          order: 9999999999999,
          dotColor: "#71717a",
        };
      }

      if (isOverdue(date)) {
        return {
          key: "date:overdue",
          title: "Overdue",
          description: "Past due",
          order: 0,
          dotColor: "#ef4444",
        };
      }

      if (isToday(date)) {
        return {
          key: "date:today",
          title: "Today",
          description: formatDueDate(date),
          order: 1,
          dotColor: themeColor,
        };
      }

      if (isTomorrow(date)) {
        return {
          key: "date:tomorrow",
          title: "Tomorrow",
          description: formatDueDate(date),
          order: 2,
          dotColor: "#f59e0b",
        };
      }

      return {
        key: `date:${date}`,
        title: formatDueDate(date),
        description: "Scheduled date",
        order: 3 + new Date(`${date}T00:00:00`).getTime(),
        dotColor: "#3b82f6",
      };
    }

    return {
      key: "none",
      title: "",
      description: "",
      order: 0,
      dotColor: themeColor,
    };
  };

  const displayTasks =
    groupMode === "none"
      ? sortedTasks
      : sortedTasks
          .map((task: any, index: number) => ({
            task,
            index,
          }))
          .sort((a, b) => {
            const groupA = getTaskGroupMeta(a.task);
            const groupB = getTaskGroupMeta(b.task);

            if (groupA.order !== groupB.order) {
              return groupA.order - groupB.order;
            }

            return a.index - b.index;
          })
          .map(({ task }) => task);

  const groupCounts = displayTasks.reduce<Record<string, number>>(
    (acc, task: any) => {
      if (groupMode === "none") return acc;

      const groupKey = getTaskGroupMeta(task).key;
      acc[groupKey] = (acc[groupKey] || 0) + 1;

      return acc;
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

  const addTaskToFocus = (taskId: string) => {
    if (!setManualFocusTaskIds) return;

    setManualFocusTaskIds((prev: string[]) => {
      if (prev.includes(taskId)) return prev;
      if (prev.length >= 3) return prev;

      return [...prev, taskId];
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        whyDropdownRef.current &&
        !whyDropdownRef.current.contains(event.target as Node)
      ) {
        setExpandedWhyTaskId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <section
  id="veira-task-list-anchor"
  ref={taskListRef}
  className={`scroll-mt-[148px] min-w-0 self-start overflow-hidden rounded-[24px] border p-4 sm:rounded-[36px] sm:px-6 sm:py-5 lg:scroll-mt-8 ${className} ${border}`}
>
      <div className="mb-0 flex flex-col gap-2 sm:mb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[18px] font-[900] tracking-[-0.035em] sm:text-[16px] sm:font-[700] sm:tracking-normal">
            {title}
            <Sparkles size={16} style={{ color: themeColor }} />
          </h2>

          <p
  className="mt-1 text-[12px] font-[700] leading-5 sm:text-xs"
  style={{
    color: themeColor,
  }}
>
  {description}
</p>
        </div>

        {ranked && (
          <div className="flex w-full shrink-0 flex-col gap-1 sm:w-auto sm:items-end">
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
              <span
                className={`shrink-0 text-[10px] font-[700] tracking-[0.12em] ${
                  darkMode ? "text-white/35" : "text-black/35"
                }`}
              >
                Group by
              </span>

              <div
                className={`flex max-w-full overflow-x-auto rounded-[14px] border p-0.5 ${
                  darkMode
                    ? "border-white/[0.08] bg-white/[0.04]"
                    : "border-black/[0.06] bg-black/[0.025]"
                }`}
              >
                {[
                  { label: "None", value: "none" },
                  { label: "Category", value: "category" },
                  { label: "Priority", value: "priority" },
                  { label: "Due date", value: "date" },
                ].map((option) => {
                  const isActive = groupMode === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setGroupMode(option.value as GroupMode);
                        setShowAllTasks(false);
                        anchorTaskListSoon();
                      }}
                      className={`h-7 shrink-0 rounded-[11px] px-2 text-[10px] font-[900] transition ${
                        isActive
                          ? "text-white"
                          : darkMode
                          ? "text-white/45 hover:text-white"
                          : "text-black/45 hover:text-black"
                      }`}
                      style={
                        isActive ? { backgroundColor: themeColor } : undefined
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
              <span
                className={`shrink-0 text-[10px] font-[700] tracking-[0.12em] ${
                  darkMode ? "text-white/35" : "text-black/35"
                }`}
              >
                Sort by
              </span>

              <div
                className={`flex rounded-[14px] border p-0.5 ${
                  darkMode
                    ? "border-white/[0.08] bg-white/[0.04]"
                    : "border-black/[0.06] bg-black/[0.025]"
                }`}
              >
                {[
                  { label: "Veira", value: "veira" },
                  { label: "Date", value: "date" },
                  { label: "Priority", value: "priority" },
                ].map((option) => {
                  const isActive = sortMode === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortMode(option.value as SortMode);
                        setShowAllTasks(false);
                        anchorTaskListSoon();
                      }}
                      className={`h-7 rounded-[11px] px-2.5 text-[10px] font-[900] transition ${
                        isActive
                          ? "text-white"
                          : darkMode
                          ? "text-white/45 hover:text-white"
                          : "text-black/45 hover:text-black"
                      }`}
                      style={
                        isActive ? { backgroundColor: themeColor } : undefined
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={groupMode === "none" ? "space-y-0 sm:space-y-3" : "space-y-0"}>
        {tasks.length === 0 && (
          <div
            className={`rounded-2xl border border-dashed p-8 text-center text-sm ${
              darkMode
                ? "border-white/10 text-white/40"
                : "border-black/10 text-black/40"
            }`}
          >
            {emptyMessage}
          </div>
        )}

        {visibleTasks.map((task: any, index: number) => {
          const isSuggesting = suggestingTaskIds.includes(task.id);
          const visibleDueDate = task.dueDate || task.suggestedDueDate;
          const visibleDueDateParts = formatDueDateParts(visibleDueDate);
          
          const rankIndex = sortedTasks.findIndex(
            (candidate: any) => candidate.id === task.id
          );
          
          const rankDisplay = rankIndex >= 0 ? rankIndex + 1 : index + 1;
          
          const groupMeta = getTaskGroupMeta(task);
          const previousTask = index > 0 ? visibleTasks[index - 1] : null;
          const previousGroupKey = previousTask
            ? getTaskGroupMeta(previousTask).key
            : "";
          
          const shouldShowGroupHeader =
            groupMode !== "none" && groupMeta.key !== previousGroupKey;
          
          const isGrouped = groupMode !== "none";
          
          const groupAccent =
            groupMode === "priority" ? groupMeta.dotColor : themeColor;
          
          const currentGroupCount = groupCounts[groupMeta.key] || 0;
          
          const groupLabel =
            groupMode === "category"
              ? "Category"
              : groupMode === "priority"
              ? "Priority"
              : "Due date";

          const isNewlyAdded = newlyAddedTaskIds.includes(task.id);
          
          const taskPanelClass = isGrouped
            ? `relative hidden min-h-[78px] min-w-0 items-center gap-4 overflow-visible rounded-none border-0 px-1 py-3 transition-colors duration-150 sm:flex ${
                draggableTasks ? "cursor-grab active:cursor-grabbing" : ""
              } ${
                manualFocusTaskIds.includes(task.id)
                  ? "rounded-[18px] border border-[color:var(--theme-color)] bg-[color:var(--theme-soft)] px-3"
                  : darkMode
                  ? "hover:bg-white/[0.025]"
                  : "hover:bg-black/[0.012]"
              } ${isNewlyAdded ? "animate-[veiraNewTaskGlow_5s_ease-out]" : ""}`
            : `relative hidden min-h-[72px] min-w-0 items-center gap-4 overflow-hidden rounded-[22px] border p-4 transition-all duration-200 hover:-translate-y-0.5 sm:flex ${
                task.dueDate && isOverdue(task.dueDate)
                  ? darkMode
                    ? "border-red-400/35 shadow-[0_14px_35px_rgba(239,68,68,0.10)]"
                    : "border-red-400/35 bg-red-50/25 shadow-[0_14px_35px_rgba(239,68,68,0.08)]"
                  : ""
              } ${draggableTasks ? "cursor-grab active:cursor-grabbing" : ""} ${
                manualFocusTaskIds.includes(task.id)
                  ? "border-[color:var(--theme-color)] bg-[color:var(--theme-soft)]"
                  : `${
                      darkMode ? "border-white/[0.07]" : border
                    } ${
                      darkMode
                        ? "bg-[#1a1a1a] hover:bg-[#222222]"
                        : "bg-white hover:bg-[#f6f8f8]"
                    }`
              } ${
                darkMode
                  ? "hover:shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
                  : "hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
              } ${isNewlyAdded ? "animate-[veiraNewTaskGlow_2.2s_ease-out]" : ""}`;
          
          return (
            <div key={task.id} className="contents">
           
           {shouldShowGroupHeader && (
  <motion.div
    layout="position"
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
      layout: {
        duration: 1.05,
        ease: [0.16, 1, 0.3, 1],
      },
    }}
    className={index === 0 ? "pt-0" : "pt-3"}
  >
    {index === 0 && (
      <div className="mb-1.5 px-1">
        <span
          className="inline-flex rounded-[8px] px-2.5 py-1 text-[9px] font-[900] uppercase tracking-[0.16em]"
          style={{
            color: themeColor,
            backgroundColor: `${themeColor}${darkMode ? "16" : "12"}`,
          }}
        >
          {groupLabel}
        </span>
      </div>
    )}

    <div className="mb-1.5 flex items-center gap-2 px-1">
      <span
        className="h-[3px] w-4 shrink-0 rounded-full"
        style={{ backgroundColor: groupAccent }}
      />

      <span className="truncate text-[13px] font-[900] leading-none tracking-[-0.025em]">
        {groupMeta.title}
      </span>

      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-[900] ${
          darkMode
            ? "bg-white/[0.07] text-white/45"
            : "bg-black/[0.045] text-black/45"
        }`}
      >
        {currentGroupCount}
      </span>
    </div>

    <div
      className="h-px w-full"
      style={{
        background: darkMode
          ? `linear-gradient(90deg, ${groupAccent}70, rgba(255,255,255,0.055), transparent)`
          : `linear-gradient(90deg, ${groupAccent}60, rgba(0,0,0,0.055), transparent)`,
      }}
    />
  </motion.div>
)}

             <motion.div
  layout="position"
  initial={{ opacity: 0, y: -10, scale: 0.985 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{
    opacity: { duration: 0.26 },
    y: {
      duration: 0.62,
      ease: [0.16, 1, 0.3, 1],
    },
    scale: {
      duration: 0.62,
      ease: [0.16, 1, 0.3, 1],
    },
    layout: {
      duration: 1.15,
      ease: [0.16, 1, 0.3, 1],
    },
  }}
  className={`group overflow-hidden will-change-transform sm:overflow-visible ${
                  isGrouped
                    ? `border-b last:border-b-0 ${border}`
                    : `border-b last:border-b-0 sm:border-b-0 ${border}`
                }`}
              >
                {/* Mobile compact row */}
                <div className="flex min-h-[44px] items-center gap-3 px-1 py-2 sm:hidden">
                  <button
                    onClick={(e) => toggleTaskById(task.id, e)}
                    className="shrink-0 opacity-70 transition hover:opacity-100"
                  >
                    <Circle
                      size={18}
                      className={darkMode ? "text-white/28" : "text-black/28"}
                    />
                  </button>

                  {ranked && (
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-[900] text-white"
                      style={{
                        backgroundColor: isGrouped
  ? "#878787"
  : rankDisplay <= 3
  ? themeColor
  : "#878787",
                      }}
                    >
                      {rankDisplay}
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setIsEditModalOpen(true);
                    }}
                    title={task.title}
                    className="min-w-0 flex-1 whitespace-normal break-words text-left text-[13px] font-[850] leading-[17px] tracking-[-0.02em] transition hover:opacity-70"
                  >
                    {task.title}
                  </button>

                  {hasFollowUpTag(task) && <FollowUpTag darkMode={darkMode} />}

                  {isSuggesting && (
                    <Sparkles
                      size={13}
                      className="shrink-0 animate-pulse"
                      style={{ color: themeColor }}
                    />
                  )}

                  <button
                    onClick={() => addTaskToFocus(task.id)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
                      manualFocusTaskIds.includes(task.id)
                        ? "bg-[#05AD98]/15 text-[#05AD98]"
                        : darkMode
                        ? "bg-white/[0.06] text-white/45"
                        : "bg-black/[0.04] text-black/45"
                    }`}
                  >
                    <Eye size={15} />
                  </button>
                </div>

                {/* Desktop/tablet full row */}
                <div
                  draggable={draggableTasks}
                  style={
                    {
                      "--theme-color": `${themeColor}55`,
                      "--theme-soft": `${themeColor}18`,
                    } as React.CSSProperties
                  }
                  onDragStart={(event) => {
                    if (!draggableTasks) return;

                    event.dataTransfer.setData("text/plain", task.id);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  className={taskPanelClass}
                >
                  <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_250px] gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <button
                        onClick={(e) => toggleTaskById(task.id, e)}
                        className="shrink-0 opacity-70 transition hover:opacity-100"
                      >
                        <Circle
                          size={19}
                          className={
                            darkMode ? "text-white/25" : "text-black/25"
                          }
                        />
                      </button>

                      {ranked && (
                        <div
                          className="mt-[2px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-[700] text-white"
                          style={{
                            backgroundColor: isGrouped
                              ? "#878787"
                              : rankDisplay <= 3
                              ? themeColor
                              : "#878787",
                          }}
                        >
                          {rankDisplay}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p
                          onClick={() => {
                            setSelectedTask(task);
                            setIsEditModalOpen(true);
                          }}
                          title={task.title}
                          className="block min-w-0 cursor-pointer whitespace-normal break-words text-[15px] font-[700] leading-5 tracking-[-0.015em] hover:opacity-70"
                        >
                          {task.title}
                        </p>

                        <div
                          className={`mt-1.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-[650] ${
                            darkMode ? "text-white/38" : "text-black/38"
                          }`}
                        >
                          <span className="truncate">
                            {task.category} · {task.priority}
                            {task.whyThisMatters ? " · Context added" : ""}
                            {isSuggesting ? " · Veira thinking..." : ""}
                          </span>

                          {hasFollowUpTag(task) && (
                            <span
                              className="inline-flex shrink-0 items-center gap-0.5 rounded-full font-[850]"
                              style={{ color: themeColor }}
                            >
                              <ChevronRight size={12} />
                              Follow-up
                            </span>
                          )}
                        </div>

                        {Array.isArray(task.whySuggestions) &&
                          task.whySuggestions.length > 0 && (
                            <div
                              ref={
                                expandedWhyTaskId === task.id
                                  ? whyDropdownRef
                                  : null
                              }
                              className="mt-2 w-full max-w-full sm:w-[calc(100%+166px)] sm:max-w-[calc(100%+166px)]"
                            >
                              <button
                                onClick={() =>
                                  setExpandedWhyTaskId(
                                    expandedWhyTaskId === task.id
                                      ? null
                                      : task.id
                                  )
                                }
                                className={`flex w-full max-w-full items-stretch gap-0 overflow-hidden rounded-[18px] border text-left transition ${
                                  darkMode
                                    ? "border-white/[0.07] bg-white/[0.035] hover:bg-white/[0.055]"
                                    : "border-black/[0.05] bg-black/[0.018] hover:bg-black/[0.03]"
                                }`}
                              >
                                <span
                                  className="flex shrink-0 items-center justify-center gap-1.5 border-r px-3 text-[10px] font-[900] uppercase tracking-[0.13em]"
                                  style={{
                                    color: darkMode
                                      ? "rgba(255,255,255,0.86)"
                                      : themeColor,
                                    borderColor: darkMode
                                      ? "rgba(255,255,255,0.08)"
                                      : "rgba(0,0,0,0.06)",
                                  }}
                                >
                                  <Sparkles size={12} />
                                  Why
                                </span>

                                <span
                                  className={`min-w-0 flex-1 whitespace-normal break-words px-3 py-2 text-[12px] leading-4 ${
                                    darkMode
                                      ? "text-white/48"
                                      : "text-black/48"
                                  }`}
                                >
                                  {task.whyThisMatters}
                                </span>

                                <span
                                  className={`flex shrink-0 items-center justify-center border-l px-3 transition ${
                                    expandedWhyTaskId === task.id
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                  style={{
                                    borderColor: darkMode
                                      ? "rgba(255,255,255,0.08)"
                                      : "rgba(0,0,0,0.06)",
                                  }}
                                >
                                  <ChevronDown size={13} className="opacity-45" />
                                </span>
                              </button>

                              {expandedWhyTaskId === task.id && (
                                <div className="mt-2 w-full max-w-full space-y-1.5">
                                  {task.whySuggestions.map(
                                    (
                                      suggestion: string,
                                      suggestionIndex: number
                                    ) => {
                                      const isSelected =
                                        task.whyThisMatters === suggestion;

                                      return (
                                        <button
                                          key={suggestion}
                                          onClick={() => {
                                            selectWhySuggestion(
                                              task.id,
                                              suggestion,
                                              suggestionIndex
                                            );
                                            setExpandedWhyTaskId(null);
                                          }}
                                          className={`flex w-full items-center justify-between gap-3 rounded-[14px] border px-3 py-2 text-left text-[11px] font-[700] transition ${
                                            isSelected
                                              ? "text-white"
                                              : darkMode
                                              ? "border-white/[0.07] bg-[#111111] text-white/55 hover:text-white"
                                              : "border-black/[0.06] bg-white text-black/55 hover:text-black"
                                          }`}
                                          style={
                                            isSelected
                                              ? {
                                                  backgroundColor: themeColor,
                                                  borderColor: themeColor,
                                                }
                                              : undefined
                                          }
                                        >
                                          <span>{suggestion}</span>
                                          {isSelected && <Check size={13} />}
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>

                    <div
  className={`relative flex ${
    isGrouped ? "min-h-[72px]" : "min-h-[88px]"
  } flex-col items-end justify-start`}
>
                      <div className="flex items-center justify-end gap-2">
                        <div className="grid w-[150px] shrink-0 grid-cols-[62px_76px] items-start gap-3">
                          <div className="flex h-10 w-[62px] items-start justify-start gap-1.5">
                            {visibleDueDate ? (
                              <>
                                <Calendar
                                  size={13}
                                  className={`mt-[3px] shrink-0 ${
                                    darkMode
                                      ? "text-white/55"
                                      : "text-black/48"
                                  }`}
                                />

                                <span
                                  className={`flex min-w-0 flex-col text-left leading-none ${
                                    darkMode
                                      ? "text-white/70"
                                      : "text-black/65"
                                  }`}
                                >
                                  <span className="text-[16px] font-[900] tracking-[-0.04em]">
                                    {visibleDueDateParts.day}
                                  </span>

                                  <span className="mt-1 text-[13px] font-[800] tracking-[-0.03em]">
                                    {visibleDueDateParts.month}
                                  </span>
                                </span>
                              </>
                            ) : (
                              <span className="block h-10 w-[62px]" />
                            )}
                          </div>

                          <div
                            className={`flex h-10 w-[76px] items-start justify-start gap-1.5 pt-[4px] ${
                              task.priority === "High"
                                ? "text-red-500"
                                : task.priority === "Medium"
                                ? "text-orange-500"
                                : "text-emerald-500"
                            }`}
                          >
                            <span className="mt-[4px] text-[12px] leading-none">
                              ●
                            </span>

                            <span className="text-[16px] font-[900] leading-none tracking-[-0.03em]">
                              {task.priority === "Medium" ||
                              task.priority === "Med"
                                ? "Mid"
                                : task.priority}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => addTaskToFocus(task.id)}
                          title={
                            manualFocusTaskIds.includes(task.id)
                              ? "Already in focus"
                              : "Add to focus"
                          }
                         className="flex h-8 w-8 items-center justify-center rounded-full opacity-100 transition hover:scale-110"
                          style={{
                            color: manualFocusTaskIds.includes(task.id)
                              ? themeColor
                              : darkMode
                              ? "rgba(255,255,255,0.45)"
                              : "rgba(0,0,0,0.45)",
                            backgroundColor: manualFocusTaskIds.includes(task.id)
                              ? `${themeColor}18`
                              : darkMode
                              ? "rgba(255,255,255,0.055)"
                              : "rgba(0,0,0,0.04)",
                          }}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => togglePinTask(task.id)}
                          title={task.pinned ? "Pinned" : "Pin to top"}
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition hover:scale-110 ${
                            task.pinned ? "opacity-100" : "opacity-55 hover:opacity-100"
                          }`}
                          style={{ color: task.pinned ? themeColor : undefined }}
                        >
                          <Star
                            size={16}
                            fill={task.pinned ? themeColor : "none"}
                          />
                        </button>

                        <button
                          onClick={() => deleteTask(task.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full opacity-45 transition hover:scale-110 hover:opacity-100 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {task.dueDate && isOverdue(task.dueDate) && (
                        <div className="pointer-events-none absolute bottom-0 right-0">
                          <div className="relative">
                            <span
                              className={`absolute -top-[13px] right-1 text-[9px] font-[900] leading-none tracking-[0.02em] ${
                                darkMode ? "text-red-300/80" : "text-red-600/75"
                              }`}
                            >
                              {getOverdueDays(task.dueDate)}d
                            </span>

                            <span
                              className={`relative inline-flex items-center rounded-[7px] border-2 px-3 py-1.5 text-[11px] font-[900] uppercase tracking-[0.14em] shadow-[0_8px_22px_rgba(185,28,28,0.14)] ${
                                darkMode
                                  ? "border-red-300/70 bg-red-500/[0.06] text-red-300"
                                  : "border-red-600/70 bg-white/50 text-red-600"
                              }`}
                            >
                              OVERDUE

                              <span className="pointer-events-none absolute inset-[3px] rounded-[4px] border border-red-500/25" />

                              <span className="pointer-events-none absolute left-1.5 top-1 h-0.5 w-2 rounded-full bg-red-500/45" />
                              <span className="pointer-events-none absolute bottom-1.5 left-3 h-0.5 w-3 rounded-full bg-red-500/35" />
                              <span className="pointer-events-none absolute right-2 top-2 h-0.5 w-2.5 rounded-full bg-red-500/35" />
                              <span className="pointer-events-none absolute bottom-1 right-3 h-0.5 w-2 rounded-full bg-red-500/30" />

                              <span className="pointer-events-none absolute left-2 top-1/2 h-1 w-1 rounded-full bg-red-500/30" />
                              <span className="pointer-events-none absolute right-4 top-1/2 h-1 w-1 rounded-full bg-red-500/25" />
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}

        {hiddenTaskCount > 0 && (
          <button
            onClick={() => setShowAllTasks((prev) => !prev)}
            className={`mt-3 flex h-10 w-full items-center justify-center rounded-[16px] border text-xs font-[900] transition hover:scale-[1.005] sm:mt-4 sm:h-12 sm:rounded-[20px] sm:text-sm ${border} ${
              darkMode
                ? "bg-white/[0.035] text-white/55 hover:bg-white/[0.06] hover:text-white"
                : "bg-black/[0.025] text-black/50 hover:bg-black/[0.04] hover:text-black"
            }`}
          >
            {showAllTasks ? "Show less" : `Show ${hiddenTaskCount} more`}
          </button>
        )}
      </div>
    </section>
  );
}

function CompletedTodaySection({
  completedToday,
  restoreCompletedTask,
  archiveCompletedToday,
  themeColor,
  darkMode,
  glass,
  strongerGlass,
  border,
}: any) {
  return (
    <div className="mt-6 sm:mt-8">
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <div className="flex items-center gap-3">
          <h2
            className="text-[11px] font-[900] uppercase tracking-[0.16em] sm:text-[13px] sm:font-[700] sm:tracking-[0.14em]"
            style={{ color: themeColor }}
          >
            Completed Today
          </h2>

          <div
            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white"
            style={{ backgroundColor: themeColor }}
          >
            {completedToday.length}
          </div>
        </div>

        <button
          onClick={archiveCompletedToday}
          className={`flex h-9 items-center gap-2 rounded-[16px] px-3 text-xs font-[900] transition sm:h-10 sm:gap-3 sm:rounded-2xl sm:px-5 sm:text-sm sm:font-[700] ${
            completedToday.length === 0 ? "pointer-events-none opacity-30" : ""
          } ${glass}`}
        >
          Archive All
        </button>
      </div>

      <div className={`overflow-hidden rounded-[24px] border sm:rounded-3xl ${strongerGlass} ${border}`}>
        {completedToday.length === 0 && (
          <div className="p-6 text-sm opacity-40">Nothing completed yet.</div>
        )}

        {completedToday.map((task: any) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex min-h-[60px] items-center justify-between gap-3 border-b px-4 py-3 last:border-none sm:min-h-[72px] sm:gap-4 sm:px-5 ${border}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <CheckCircle2 size={18} className="shrink-0 text-green-500" />

              <div className="min-w-0">
              <p className="truncate text-[13px] font-[700] sm:text-[14px] sm:font-[650]">{task.title}</p>

              <p className="truncate text-[10.5px] opacity-40 sm:text-[11px]">
                  {task.category}
                  {task.dueDate ? ` • Due ${formatDueDate(task.dueDate)}` : ""}
                </p>
              </div>
            </div>

            <button
              onClick={() => restoreCompletedTask(task.id)}
              className={`h-8 shrink-0 rounded-[14px] px-3 text-[11px] font-[900] transition hover:scale-[1.02] sm:h-9 sm:rounded-xl sm:text-xs sm:font-[700] ${
                darkMode
                  ? "bg-white/[0.06] text-white/55 hover:text-white"
                  : "bg-black/[0.04] text-black/55 hover:text-black"
              }`}
            >
              Restore
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ArchiveView({
  archive,
  clearArchive,
  glass,
  strongerGlass,
  border,
  darkMode,
}: any) {
  return (
    <div>
<PageHeader
  title="Archived Items"
  description="Completed work saved for reference."
  darkMode={darkMode}
>
        <button
          onClick={clearArchive}
          disabled={archive.length === 0}
          className={`h-11 rounded-2xl px-5 text-sm font-[700] transition ${
            archive.length === 0
              ? "cursor-not-allowed opacity-30"
              : "hover:scale-[1.02] active:scale-[0.98]"
          } ${glass}`}
        >
          Clear All
        </button>
      </PageHeader>

      <div className={`overflow-hidden rounded-[24px] border sm:rounded-3xl ${strongerGlass} ${border}`}>

        {archive.length === 0 && (
          <div className="p-10 text-sm opacity-50">No archived items yet.</div>
        )}

        {archive.map((task: any) => (
          <div
            key={task.id}
            className={`flex min-h-[88px] flex-col items-start justify-between gap-3 border-b px-5 py-4 last:border-none sm:flex-row sm:items-center sm:gap-4 sm:px-6 ${border}`}
          >
            <div className="min-w-0">
              <p className="mb-1 truncate text-[15px] font-[700]">
                {task.title}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs opacity-50">
                <span>{task.category}</span>
                {task.dueDate && <span>Due {formatDueDate(task.dueDate)}</span>}
                <span>{new Date(task.completedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="shrink-0 text-xs opacity-40">Archived</div>
          </div>
        ))}
      </div>
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
            darkMode ? "text-white/45" : "text-black/45"
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
            darkMode ? "text-white/42" : "text-black/42"
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
          darkMode ? "text-white/38" : "text-black/38"
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [currentHourRaw, currentMinuteRaw] = dayEndTime.split(":").map(Number);
  const period = currentHourRaw >= 12 ? "PM" : "AM";

  const displayHour =
    currentHourRaw === 0 ? 12 : currentHourRaw > 12 ? currentHourRaw - 12 : currentHourRaw;

  const displayMinute = String(currentMinuteRaw).padStart(2, "0");

  const hourOptions = Array.from({ length: 12 }, (_, index) => index + 1);
  const minuteOptions = Array.from({ length: 12 }, (_, index) =>
    String(index * 5).padStart(2, "0")
  );

  const updateEndTime = (
    nextHour: number,
    nextMinute: string,
    nextPeriod: "AM" | "PM"
  ) => {
    let hour24 = nextHour;

    if (nextPeriod === "AM" && nextHour === 12) hour24 = 0;
    if (nextPeriod === "PM" && nextHour !== 12) hour24 = nextHour + 12;

    setDayEndTime(`${String(hour24).padStart(2, "0")}:${nextMinute}`);
  };

  const selectClass = `h-10 w-full appearance-none rounded-[14px] border px-3 text-sm font-[800] outline-none transition focus:ring-4 focus:ring-[#05AD98]/15 ${
    darkMode
      ? "border-white/[0.09] bg-[#1f1f21] text-white"
      : "border-black/[0.08] bg-white text-black"
  }`;

  return (
    <div ref={pickerRef} className="relative z-[500] w-[250px]">
      <div className="flex items-center justify-end gap-3">
        <div className="text-right">
          <p className="text-[15px] font-[600] leading-none tracking-[-0.035em]">
            {dayTimeRemaining.label}
          </p>

          <p
            className={`mt-1 text-[10px] font-[700] ${
              darkMode ? "text-white/38" : "text-black/38"
            }`}
          >
            Ends {displayHour}:{displayMinute} {period}
          </p>
        </div>

        <button
          onClick={() => setIsPickerOpen((prev) => !prev)}
          className={`rounded-full px-3 py-1.5 text-[10px] font-[900] transition hover:scale-[1.02] ${
            darkMode
              ? "bg-white/[0.06] text-white/60 hover:text-white"
              : "bg-black/[0.04] text-black/60 hover:text-black"
          }`}
        >
          Edit
        </button>
      </div>

      <div
        className="mt-2 ml-auto h-1 w-[150px] rounded-full"
        style={{ backgroundColor: themeColor }}
      />

{isPickerOpen && (
  <div
    className={`absolute right-0 top-[calc(100%+10px)] z-[600] w-[280px] rounded-[20px] border p-3 shadow-[0_20px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl ${
            darkMode
              ? "border-white/[0.09] bg-[#171717]/95"
              : "border-black/[0.08] bg-white/95"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-[900] uppercase tracking-[0.14em] opacity-45">
              Set day end
            </p>

            <button
              onClick={() => setIsPickerOpen(false)}
              className="rounded-full px-3 py-1.5 text-[10px] font-[900] text-white"
              style={{ backgroundColor: themeColor }}
            >
              Done
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="mb-2 text-[10px] font-[600] uppercase tracking-[0.12em] opacity-35">
                Hrs
              </p>
              <select
                value={displayHour}
                onChange={(e) =>
                  updateEndTime(Number(e.target.value), displayMinute, period)
                }
                className={selectClass}
              >
                {hourOptions.map((hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-[700] uppercase tracking-[0.12em] opacity-35">
                Min
              </p>
              <select
                value={displayMinute}
                onChange={(e) =>
                  updateEndTime(displayHour, e.target.value, period)
                }
                className={selectClass}
              >
                {minuteOptions.map((minute) => (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-[900] uppercase tracking-[0.12em] opacity-35">
                Mode
              </p>
              <select
                value={period}
                onChange={(e) =>
                  updateEndTime(
                    displayHour,
                    displayMinute,
                    e.target.value as "AM" | "PM"
                  )
                }
                className={selectClass}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
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
    setManualFocusTaskIds((prev: string[]) =>
      prev.filter((taskId) =>
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

    setManualFocusTaskIds((prev: string[]) => {
      if (prev.includes(taskId)) return prev;
      if (prev.length >= 3) return prev;
      return [...prev, taskId];
    });

    setFocusIndex(0);
  };

  const removeFocusTask = (taskId: string) => {
    if (isManualMode) {
      setManualFocusTaskIds((prev: string[]) =>
        prev.filter((id) => id !== taskId)
      );

      setFocusIndex(0);
      return;
    }

    setFocusPlan((prev: any) => {
      if (!prev?.focusTaskIds) return prev;

      const nextFocusTaskIds = prev.focusTaskIds.filter(
        (id: string) => id !== taskId
      );

      const nextReasons = { ...(prev.reasons || {}) };
      delete nextReasons[taskId];

      const nextPlan = {
        ...prev,
        focusTaskIds: nextFocusTaskIds,
        reasons: nextReasons,
      };

      if (nextFocusTaskIds.length === 0) {
        localStorage.removeItem(focusCacheKey);
        return null;
      }

      localStorage.setItem(focusCacheKey, JSON.stringify(nextPlan));
      return nextPlan;
    });

    setFocusIndex(0);
  };

  const clearFocusStack = () => {
    setManualFocusTaskIds([]);
    setFocusPlan(null);
    setFocusIndex(0);
    localStorage.removeItem(focusCacheKey);
  };

  const moveNext = () => {
    if (activeFocusTasks.length === 0) return;

    setFocusIndex((prev) => {
      if (prev >= activeFocusTasks.length - 1) return 0;
      return prev + 1;
    });
  };

  const getTaskReason = (taskId: string) => {
    if (isManualMode) {
      return "You manually added this to your focus stack.";
    }

    return (
      focusPlan?.reasons?.[taskId] ||
      "Veira selected this as one of the strongest next moves."
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
        throw new Error("Veira could not pick focus tasks.");
      }

      const nextFocusPlan = {
        focusTaskIds: validTaskIds.slice(0, 3),
        reasons: data.reasons || {},
        summary:
          data.summary ||
          "Veira selected the strongest next moves from your active tasks.",
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
            "Fallback pick: this task is near the top of your prioritized list.",
          ])
        ),
        summary:
          "Veira used a fallback stack because AI focus planning was unavailable.",
        generatedAt: new Date().toISOString(),
        source: "fallback",
      };

      setFocusPlan(fallbackFocusPlan);
      setManualFocusTaskIds([]);
      localStorage.setItem(focusCacheKey, JSON.stringify(fallbackFocusPlan));
      setFocusIndex(0);
      setFocusError("AI focus was unavailable. Fallback stack used.");
    } finally {
      setFocusLoading(false);
    }
  };

  return (
    <section
    className={`relative min-w-0 self-start overflow-hidden rounded-[24px] border p-4 sm:rounded-[36px] sm:p-6 ${
      darkMode
      ? "bg-[#171717] border-white/[0.055] shadow-[0_24px_80px_rgba(0,0,0,0.38)]"
      : `${strongerGlass} ${border}`
    }`}
  >
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:gap-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[18px] font-[800] tracking-[-0.035em] sm:text-[20px]">
              Focus Mode
              <Sparkles size={15} style={{ color: themeColor }} />
            </h2>

            <p
              className={`mt-1.5 max-w-md text-[12px] leading-5 sm:mt-2 sm:text-sm sm:leading-6 ${
                darkMode ? "text-white/64" : "text-black/45"
              }`}
            >
              Drag up to 3 tasks here, or let Veira choose them.
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-[900] ${
              darkMode
                ? "border-white/[0.16] bg-white/[0.06] text-white/75"
                : "bg-black/[0.04] text-black/45"
            }`}
          >
            {isManualMode ? "Manual" : "AI Mode"}
          </span>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragOver(false);

            const taskId = event.dataTransfer.getData("text/plain");
            addManualFocusTask(taskId);
          }}
          className={`rounded-[22px] border p-4 transition sm:rounded-[26px] sm:p-5 ${
            isDragOver
              ? darkMode
                ? "border-white/[0.24] bg-white/[0.08]"
                : "border-[#05AD98] bg-[#05AD98]/10"
              : darkMode
              ? "border-white/[0.055] bg-[#111111]"
              : "border-black/[0.04] bg-white/65"
          }`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p
                className="text-[11px] font-[900] uppercase tracking-[0.16em]"
                style={{ color: themeColor }}
              >
                Focus Stack
              </p>

              <p
                className={`mt-1 text-xs font-[700] ${
                  darkMode ? "text-white/48" : "text-black/40"
                }`}
              >
                {activeFocusTasks.length > 0
                  ? `${activeFocusTasks.length} selected`
                  : "Drop tasks here to build your stack."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeFocusTasks.length > 0 && (
                <button
                  onClick={clearFocusStack}
                  className={`rounded-[13px] border px-3 py-1.5 text-[10px] font-[900] transition hover:scale-[1.02] ${
                    darkMode
                      ? "border-white/[0.07] bg-[#111111] text-white/58 hover:text-white"
                      : "bg-black/[0.04] text-black/45 hover:text-black"
                  }`}
                >
                  Clear
                </button>
              )}

              <button
                onClick={computeFocusStack}
                disabled={focusLoading || prioritizedTasks.length === 0}
                className={`rounded-[13px] border px-3 py-1.5 text-[10px] font-[900] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 ${
                  darkMode
                    ? "border-white/[0.14] bg-[#111111] text-white/70 hover:border-[#05AD98]/50 hover:text-white"
                    : "bg-black/[0.04] text-black/45 hover:text-black"
                }`}
              >
                {focusLoading
                  ? "Thinking..."
                  : activeFocusTasks.length > 0
                  ? "Use AI"
                  : "Compute"}
              </button>
            </div>
          </div>

          {focusError && (
            <p className="mb-3 rounded-2xl border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-xs font-[700] text-white/65">
              {focusError}
            </p>
          )}

          {activeFocusTasks.length === 0 ? (
            <div
              className={`flex min-h-[220px] items-center justify-center rounded-[22px] border border-dashed text-center ${
                darkMode
                  ? "border-white/[0.14] bg-[#111111] text-white/35"
                  : "border-black/[0.07] bg-black/[0.015] text-black/35"
              }`}
            >
              <div className="max-w-xs px-5">
                <h3 className="text-[19px] font-[900] tracking-[-0.04em] text-current">
                  Build your focus stack.
                </h3>

                <p className="mt-2 text-sm font-[700] leading-6 opacity-80">
                  Drag tasks from the left list, or press Compute to let Veira
                  choose your top 3.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {activeFocusTasks.map((task: any, index: number) => {
                const isCurrent = currentTask && task.id === currentTask.id;
                const visibleDueDate = task.dueDate || task.suggestedDueDate;

                return (
                 <div
  key={task.id}
  onClick={() => setFocusIndex(index)}
  style={
    isCurrent
      ? {
          "--theme-border": `${themeColor}70`,
          "--theme-soft": `${themeColor}14`,
        } as React.CSSProperties
      : undefined
  }
                    className={`group cursor-pointer rounded-[20px] border px-3 py-3 transition hover:scale-[1.005] sm:px-4 ${
                      isCurrent
                        ? darkMode
                         ? "border-[color:var(--theme-border)] bg-[color:var(--theme-soft)]"
: "border-[color:var(--theme-border)] bg-[color:var(--theme-soft)]"
                        : darkMode
                        ? "border-white/[0.12] bg-[#111111]"
                        : "border-black/[0.045] bg-white/70"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-[900] text-white"
                        style={{
                          backgroundColor: isCurrent
                            ? themeColor
                            : darkMode
                            ? "#334155"
                            : "#a1a1aa",
                        }}
                      >
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedTask(task);
                            setIsEditModalOpen(true);
                          }}
                          title={task.title}
                          className="truncate text-[15px] font-[900] tracking-[-0.025em] hover:opacity-70"
                        >
                          {task.title}
                        </p>

                        <p
                          className={`mt-1 truncate text-[11px] font-[700] ${
                            darkMode ? "text-white/48" : "text-black/38"
                          }`}
                        >
                          {task.priority}
                          {visibleDueDate &&
                            ` · ${formatDueDate(visibleDueDate)}`}
                        </p>
                      </div>

                      {isCurrent && (
                        <span
                          className="hidden shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-[900] sm:inline-flex"
                          style={{
                            color: darkMode
                              ? "rgba(255,255,255,0.72)"
                              : "#111111",
                            backgroundColor: darkMode
                              ? "rgba(255,255,255,0.06)"
                              : "#ffffff",
                            borderColor: darkMode
                              ? "rgba(255,255,255,0.12)"
                              : "#BBBFBF",
                          }}
                        >
                          Now
                        </span>
                      )}

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          removeFocusTask(task.id);
                        }}
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-[900] opacity-70 transition hover:scale-[1.03] hover:opacity-100 ${
                          darkMode
                            ? "bg-white/[0.06] text-white/58 hover:text-white"
                            : "bg-black/[0.05] text-black/50"
                        }`}
                      >
                        Remove
                      </button>
                    </div>

                    {isCurrent && (
                      <div className="mt-4">
                        <p
                          className={`text-[12px] leading-5 sm:text-sm sm:leading-6 ${
                            darkMode ? "text-white/52" : "text-black/45"
                          }`}
                        >
                          {getTaskReason(task.id)}
                        </p>

                        <div className="mt-4 grid grid-cols-[1fr_0.72fr] gap-2 sm:gap-3">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleTaskById(task.id, event);
                            }}
                            className="h-11 rounded-[17px] text-xs font-[900] text-white shadow-[0_16px_34px_rgba(0,0,0,0.22)] transition hover:scale-[1.01] sm:h-12 sm:rounded-2xl"
                            style={{ backgroundColor: themeColor }}
                          >
                            Complete
                          </button>

                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              moveNext();
                            }}
                            className={`h-11 rounded-[18px] border text-sm font-[900] transition hover:scale-[1.01] sm:h-12 sm:rounded-2xl ${
                              darkMode
                                ? "border-white/[0.12] bg-[#111111] text-white/82"
                                : border
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {activeFocusTasks.length < 3 && (
                <div
                  className={`flex h-[58px] items-center justify-center rounded-[18px] border border-dashed text-xs font-[900] ${
                    darkMode
                      ? "border-white/[0.12] bg-[#111111] text-white/28"
                      : "border-black/[0.06] bg-black/[0.015] text-black/28"
                  }`}
                >
                  Drop task #{activeFocusTasks.length + 1}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
          : "border-black/[0.06] bg-black/[0.025] text-black/35"
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
              darkMode ? "text-white/45" : "text-black/45"
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
          <p className={`mt-1 text-xs ${darkMode ? "text-white/40" : "text-black/40"}`}>
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
                : "border-black/10 text-black/35"
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
          <Circle size={18} className={darkMode ? "text-white/25" : "text-black/25"} />
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

          <p className={`mt-1 text-[11px] ${darkMode ? "text-white/38" : "text-black/38"}`}>
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

          <p className={`mt-1 text-xs ${darkMode ? "text-white/40" : "text-black/40"}`}>
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

          <p className={`mt-1 text-[11px] sm:text-[12px] ${darkMode ? "text-white/45" : "text-black/45"}`}>
            {description}
          </p>
        </div>

        <div className={`flex h-8 min-w-8 items-center justify-center rounded-full px-3 text-xs font-[700] ${
          darkMode ? "bg-white/10 text-white/70" : "bg-black/[0.04] text-black/60"
        }`}>
          {tasks.length}
        </div>
      </div>

      {tasks.map((task: any) => (
        <div
          key={task.id}
          className={`group flex min-h-[64px] items-center gap-4 border-b px-6 py-3.5 last:border-b-0 ${
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
                    : "text-black/45 line-through decoration-black/45"
                  : darkMode
                  ? "text-white"
                  : "text-black"
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
                  : "text-black/35"
                : darkMode
                ? "text-white/48"
                : "text-black/40"
            }`}
            >
              {task.category} • {task.priority}
            </p>
          </div>

          <div className="flex items-center gap-3 text-[12px] font-[700] sm:gap-5 sm:text-[13px] sm:font-[700]">
            {task.dueDate && (
              <div className={`flex items-center gap-1.5 ${
                darkMode ? "text-white/70" : "text-black/65"
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

function SettingsView({
  darkMode,
  setDarkMode,
  border,
  className,
  themeColor,
setThemeColor,
userRole,
setUserRole,
input,
enableAppSuggestions,
  setEnableAppSuggestions,
  enableAutoPriority,
  setEnableAutoPriority,
enableClipboardAssist,
setEnableClipboardAssist,
  upcomingViewMode,
  setUpcomingViewMode,
  priorityViewMode,
  setPriorityViewMode,
  archiveCount,
  clearArchive,
  resetAppData,
}: any) {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Control how Veira looks, suggests, and organizes your tasks."
        darkMode={darkMode}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SettingsCard
          title="Appearance"
          description="Choose how Veira looks."
          darkMode={darkMode}
          border={border}
          className={`hidden ${className}`}
        >
          <SettingsRow
            title="Theme"
            description="Switch between light and dark mode."
            darkMode={darkMode}
          >
            <SegmentedControl
              value={darkMode ? "dark" : "light"}
              options={[
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
              ]}
              onChange={(value: string) => setDarkMode(value === "dark")}
              themeColor={themeColor}
              darkMode={darkMode}
              border={border}
            />
          </SettingsRow>
          </SettingsCard>

          <SettingsCard
  title="Theme Color"
  description="Choose the accent color used across Veira."
  darkMode={darkMode}
  border={border}
  className={className}
>
  <div className="grid grid-cols-6 gap-3 sm:grid-cols-8 lg:grid-cols-10">
    {[
           "#2FB7A7", // Veira Teal
           "#0E95A8", // Deep Teal
         
           "#2563EB", // Calm Blue
           "#7C3AED", // Deep Violet
           "#059669", // Emerald
         
           "#D97706", // Burnt Amber
           "#C2410C", // Terracotta
           "#BE185D", // Raspberry
         
           "#334155", // Blue Slate
           "#6D5D6E", // Muted Plum
           "#1F2937", // Charcoal Navy
           "#4B5563", // Soft Graphite
           "#D72246", // Reddish Pink
    ].map((color) => {
      const isActive = themeColor === color;

      return (
        <button
          key={color}
          onClick={() => setThemeColor(color)}
          className={`relative h-8 w-8 rounded-full transition hover:scale-110 ${
            isActive ? "scale-110" : "opacity-90"
          }`}
          style={{ backgroundColor: color }}
        >
          {isActive && (
            <span
              className={`absolute inset-[-5px] rounded-full border ${
                darkMode ? "border-white/70" : "border-black/35"
              }`}
            />
          )}
        </button>
      );
    })}
  </div>
</SettingsCard>

<SettingsCard
  title="Work Context"
  description="Help Veira make task reasoning specific to your work."
  darkMode={darkMode}
  border={border}
  className={className}
>
  <SettingsRow
    title="Your role"
    description="Used by AI to suggest stronger reasons why each task matters."
    darkMode={darkMode}
  >
    <input
      value={userRole}
      onChange={(e) => setUserRole(e.target.value)}
      placeholder="Director of Engineering"
      className={`h-11 w-full rounded-2xl px-4 text-sm font-[700] outline-none sm:w-[260px] ${input}`}
    />
  </SettingsRow>
</SettingsCard>

<SettingsCard
  title="App Suggestions"
          description="Control how much Veira helps organize new tasks."
          darkMode={darkMode}
          border={border}
          className={className}
        >
          <SettingsRow
            title="Suggested dates"
            description="Let Veira suggest dates from task titles."
            darkMode={darkMode}
          >
            <ToggleSwitch
              checked={enableAppSuggestions}
              onChange={setEnableAppSuggestions}
              themeColor={themeColor}
              darkMode={darkMode}
            />
          </SettingsRow>

          <SettingsRow
            title="Auto priority"
            description="Let Veira classify new tasks as High, Medium, or Low."
            darkMode={darkMode}
          >
            <ToggleSwitch
              checked={enableAutoPriority}
              onChange={setEnableAutoPriority}
              themeColor={themeColor}
              darkMode={darkMode}
            />
          </SettingsRow>

          <SettingsRow
            title="Clipboard Assist"
            description="When you return to Veira, check copied text and automatically suggest tasks from it."
            darkMode={darkMode}
          >
            <ToggleSwitch
              checked={enableClipboardAssist}
              onChange={setEnableClipboardAssist}
              themeColor={themeColor}
              darkMode={darkMode}
            />
          </SettingsRow>
        </SettingsCard>

        <SettingsCard
          title="Default Views"
          description="Choose your preferred planning layouts."
          darkMode={darkMode}
          border={border}
          className={className}
        >
          <SettingsRow
            title="Upcoming view"
            description="Choose Calendar or List as the default upcoming layout."
            darkMode={darkMode}
          >
            <SegmentedControl
              value={upcomingViewMode}
              options={[
                { label: "Calendar", value: "calendar" },
                { label: "List", value: "list" },
              ]}
              onChange={setUpcomingViewMode}
              themeColor={themeColor}
              darkMode={darkMode}
              border={border}
            />
          </SettingsRow>

          <SettingsRow
            title="Priorities view"
            description="Choose Cards or List as the default priorities layout."
            darkMode={darkMode}
          >
            <SegmentedControl
              value={priorityViewMode}
              options={[
                { label: "Cards", value: "cards" },
                { label: "List", value: "list" },
              ]}
              onChange={setPriorityViewMode}
              themeColor={themeColor}
              darkMode={darkMode}
              border={border}
            />
          </SettingsRow>
        </SettingsCard>

        <SettingsCard
          title="Data"
          description="Manage local app data stored in this browser."
          darkMode={darkMode}
          border={border}
          className={className}
        >
          <SettingsRow
            title="Archive"
            description={`${archiveCount} archived item${archiveCount === 1 ? "" : "s"} saved.`}
            darkMode={darkMode}
          >
            <button
              onClick={clearArchive}
              disabled={archiveCount === 0}
              className={`h-10 rounded-xl px-4 text-xs font-[700] transition ${
                archiveCount === 0
                  ? "cursor-not-allowed opacity-30"
                  : darkMode
                  ? "bg-white/[0.06] text-white/60 hover:text-white"
                  : "bg-black/[0.04] text-black/60 hover:text-black"
              }`}
            >
              Clear archive
            </button>
          </SettingsRow>

          <SettingsRow
            title="Reset Veira"
            description="Delete active tasks, completed tasks, and archived items."
            darkMode={darkMode}
          >
            <button
              onClick={resetAppData}
              className="h-10 rounded-xl bg-red-500/10 px-4 text-xs font-[700] text-red-500 transition hover:scale-[1.02]"
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
  children,
  darkMode,
  border,
  className,
}: any) {
  return (
    <section className={`rounded-[28px] border p-5 shadow-sm ${className} ${border}`}>
      <div className="mb-5">
        <h3 className="text-[16px] font-[700]">{title}</h3>

        <p className={`mt-1 text-xs ${darkMode ? "text-white/40" : "text-black/40"}`}>
          {description}
        </p>
      </div>

      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SettingsRow({ title, description, children, darkMode }: any) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-[700]">{title}</p>

        <p className={`mt-1 text-xs ${darkMode ? "text-white/38" : "text-black/38"}`}>
          {description}
        </p>
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, themeColor, darkMode }: any) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex h-7 w-12 items-center rounded-full p-1 transition ${
        checked ? "" : darkMode ? "bg-white/[0.08]" : "bg-black/[0.08]"
      }`}
      style={
        checked
          ? {
              backgroundColor: themeColor,
            }
          : undefined
      }
    >
      <span
        className={`h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SegmentedControl({
  value,
  options,
  onChange,
  themeColor,
  darkMode,
  border,
}: any) {
  return (
    <div className={`flex rounded-2xl border p-1 ${border}`}>
      {options.map((option: any) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`h-9 rounded-xl px-4 text-xs font-[700] transition ${
              isActive
                ? "text-white"
                : darkMode
                ? "text-white/45 hover:text-white"
                : "text-black/45 hover:text-black"
            }`}
            style={
              isActive
                ? {
                    backgroundColor: themeColor,
                  }
                : undefined
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
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

          <p className={`mt-2 text-[13px] sm:text-sm ${darkMode ? "text-white/45" : "text-black/45"}`}>
            Tasks grouped by manual due dates and Veira-suggested dates.
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
                  ? "text-white/45 hover:text-white"
                  : "text-black/45 hover:text-black"
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
                  ? "text-white/45 hover:text-white"
                  : "text-black/45 hover:text-black"
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
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
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

              <p className={`mt-1 text-xs ${darkMode ? "text-white/40" : "text-black/40"}`}>
                {day.dateLabel}
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-[900] ${
                darkMode
                  ? "bg-white/[0.06] text-white/50"
                  : "bg-black/[0.04] text-black/50"
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
                    : "border-black/10 text-black/35"
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
            className={darkMode ? "text-white/25" : "text-black/25"}
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
              darkMode ? "text-white/38" : "text-black/38"
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
                : "bg-black/[0.04] text-black/55 hover:text-black"
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

          <p className={`mt-1 text-xs ${darkMode ? "text-white/40" : "text-black/40"}`}>
            {description}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-[900] ${
            darkMode
              ? "bg-white/[0.06] text-white/50"
              : "bg-black/[0.04] text-black/50"
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
        <div className={`p-5 text-sm ${darkMode ? "text-white/35" : "text-black/35"}`}>
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
                <Circle size={18} className={darkMode ? "text-white/25" : "text-black/25"} />
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
                    darkMode ? "text-white/38" : "text-black/38"
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
                      : "bg-black/[0.04] text-black/55 hover:text-black"
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
              darkMode ? "text-white/45" : "text-black/45"
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
                darkMode ? "text-white/40" : "text-black/40"
              }`}
            >
              These tasks do not have a manual or suggested date yet.
            </p>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-[900] ${
              darkMode
                ? "bg-white/[0.06] text-white/50"
                : "bg-black/[0.04] text-black/50"
            }`}
          >
            {inboxTasks.length}
          </span>
        </div>

        <div>
          {inboxTasks.length === 0 && (
            <div
              className={`p-8 text-sm ${
                darkMode ? "text-white/35" : "text-black/35"
              }`}
            >
              Your inbox is clear. Every active task has either a date or a
              Veira suggestion.
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
                    className={darkMode ? "text-white/25" : "text-black/25"}
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
                      darkMode ? "text-white/38" : "text-black/38"
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
                          : "bg-black/[0.04] text-black/55 hover:text-black"
                      }`}
                    >
                      Today
                    </button>

                    <button
                      onClick={() => scheduleTaskById(task.id, getTomorrowDate())}
                      className={`h-9 rounded-xl px-3 text-xs font-[700] transition hover:scale-[1.02] ${
                        darkMode
                          ? "bg-white/[0.06] text-white/55 hover:text-white"
                          : "bg-black/[0.04] text-black/55 hover:text-black"
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
      document
        .getElementById("mobile-focus-card")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          : "border-black/[0.07] bg-white/[0.92] text-black"
      }`}
    >
      <button
        onClick={goToToday}
        className={`flex flex-col items-center justify-center gap-1 rounded-[20px] py-2 text-[10px] font-[900] ${
          selectedView === "today"
            ? "text-white"
            : darkMode
            ? "text-white/45"
            : "text-black/45"
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
          darkMode ? "text-white/45" : "text-black/45"
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
            ? "text-white/45"
            : "text-black/45"
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
                ? "bg-white text-black"
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
            darkMode ? "text-white/45" : "text-black/45"
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
  themeColor,
  darkMode,
  loading,
  error,
  extractedTasks,
  onClose,
  onAddAsIs,
  onToggleTask,
  onAddSelected,
}: any) {
  const preview = normalizeClipboardText(text);
  const clippedPreview =
    preview.length > 220 ? `${preview.slice(0, 220)}...` : preview;

  const selectedCount = extractedTasks.filter((task: any) => task.selected).length;
  const hasTasks = extractedTasks.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 360, damping: 32, mass: 0.85 }}
      className="pointer-events-none fixed inset-0 z-[193] flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className={`pointer-events-auto relative w-full max-w-[560px] overflow-hidden rounded-[28px] border p-4 shadow-[0_28px_90px_rgba(15,23,42,0.22)] backdrop-blur-2xl sm:p-5 ${
          darkMode
            ? "border-white/[0.10] bg-[#171717]/96 text-white"
            : "border-[#BBBFBF]/45 bg-white/96 text-[#111827]"
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition hover:scale-105 ${
            darkMode
              ? "bg-white/[0.06] text-white/45 hover:text-white"
              : "bg-black/[0.035] text-black/42 hover:text-black"
          }`}
        >
          <X size={15} />
        </button>

        <div className="relative pr-8">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: themeColor }}
            >
              <Sparkles size={18} />
            </div>

            <div>
              <p
                className="text-[10px] font-[900] uppercase tracking-[0.16em]"
                style={{ color: themeColor }}
              >
                Clipboard Assist
              </p>

              <h3 className="mt-1 text-[18px] font-[900] leading-tight tracking-[-0.04em]">
                {loading
                  ? "Reading copied text..."
                  : hasTasks
                  ? `Veira found ${extractedTasks.length} task${
                      extractedTasks.length === 1 ? "" : "s"
                    }`
                  : "Do you want to add this as a task?"}
              </h3>

              <p className={`mt-1 text-xs font-[700] ${darkMode ? "text-white/42" : "text-black/42"}`}>
  {loading
    ? "Looking for possible action items..."
    : hasTasks
    ? "Review and add the useful ones."
    : "No clear action items were found, but you can still save the copied text."}
</p>
            </div>
          </div>

          {loading && (
            <div className={`mt-4 rounded-[18px] border px-4 py-4 text-sm font-[800] ${
              darkMode
                ? "border-white/[0.08] bg-white/[0.045] text-white/55"
                : "border-black/[0.06] bg-black/[0.018] text-black/55"
            }`}>
              Veira is extracting possible tasks...
            </div>
          )}

          {!loading && hasTasks && (
            <div className="mt-4 max-h-[280px] space-y-2 overflow-y-auto">
              {extractedTasks.map((task: any) => (
                <button
                  key={task.id}
                  onClick={() => onToggleTask(task.id)}
                  className={`flex w-full items-start gap-3 rounded-[18px] border p-3 text-left transition ${
                    darkMode
                      ? "border-white/[0.08] bg-white/[0.04]"
                      : "border-black/[0.06] bg-black/[0.018]"
                  }`}
                >
                  {task.selected ? (
                    <CheckCircle2 size={18} style={{ color: themeColor }} />
                  ) : (
                    <Circle size={18} className={darkMode ? "text-white/30" : "text-black/30"} />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-[900] leading-5">
                      {task.title}
                    </p>

                    <p className={`mt-1 text-[10px] font-[800] ${
                      darkMode ? "text-white/38" : "text-black/38"
                    }`}>
                      {task.category} ·{" "}
                      {task.priority === "Medium" ? "Mid" : task.priority}
                      {task.suggestedDueDate
                        ? ` · ${formatDueDate(task.suggestedDueDate)}`
                        : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && !hasTasks && (
            <div
              className={`mt-4 max-h-[112px] overflow-hidden rounded-[18px] border px-3 py-2.5 text-[12px] font-[650] leading-5 ${
                darkMode
                  ? "border-white/[0.08] bg-white/[0.045] text-white/54"
                  : "border-black/[0.06] bg-black/[0.018] text-black/54"
              }`}
            >
              {clippedPreview}
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-[800] text-red-500">
              {error}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={onClose}
              className={`h-10 rounded-[15px] px-3 text-xs font-[900] ${
                darkMode
                  ? "bg-white/[0.06] text-white/48 hover:text-white"
                  : "bg-black/[0.04] text-black/46 hover:text-black"
              }`}
            >
              Dismiss
            </button>

            <button
              onClick={onAddAsIs}
              className={`h-10 rounded-[15px] border px-3.5 text-xs font-[900] ${
                darkMode
                  ? "border-white/[0.10] bg-white/[0.04] text-white/62 hover:text-white"
                  : "border-black/[0.07] bg-white text-black/58 hover:text-black"
              }`}
            >
              Add as is
            </button>

            {hasTasks && (
              <button
                onClick={onAddSelected}
                className="h-10 rounded-[15px] px-4 text-xs font-[900] text-white"
                style={{ backgroundColor: themeColor }}
              >
                Add selected ({selectedCount})
              </button>
            )}
          </div>
        </div>
      </div>
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
          stiffness: 360,
          damping: 32,
          mass: 0.85,
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
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.035] text-black/45 transition hover:scale-105 hover:text-black"
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
              <h2 className="text-[22px] font-[900] leading-tight tracking-[-0.045em] text-[#111827]">
                2 hours left in your day
              </h2>

              <p className="mt-1 text-sm font-[700] text-black/48">
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
                    <p className="truncate text-[13px] font-[850] leading-5 tracking-[-0.018em] text-[#111827]">
                      {task.title}
                    </p>

                    <p className="mt-0.5 truncate text-[10.5px] font-[750] text-black/36">
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
            <p className="text-sm font-[750] text-black/50">
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
  themeColor,
  darkMode,
  glass,
  strongerGlass,
  border,
}: any) {
  const selectedCount = extractedTasks.filter((task: any) => task.selected).length;

  const closeModal = () => {
    setIsExtractModalOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[195] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md sm:p-6"
      onClick={closeModal}
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.84,
          y: 18,
          transformOrigin: "50% 48%",
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          transformOrigin: "50% 48%",
        }}
        exit={{
          opacity: 0,
          scale: 0.88,
          y: 14,
          transformOrigin: "50% 48%",
        }}
        transition={{
          type: "spring",
          stiffness: 520,
          damping: 38,
          mass: 0.8,
        }}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[92vh] w-full max-w-[860px] overflow-hidden rounded-[34px] border shadow-[0_35px_140px_rgba(0,0,0,0.38)] backdrop-blur-3xl ${strongerGlass} ${border}`}
      >
        <div className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: themeColor }}
          />

          <div className={`relative border-b px-5 py-5 sm:px-7 sm:py-6 ${border}`}>
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_14px_34px_rgba(0,0,0,0.22)]"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Sparkles size={19} />
                  </div>

                  <div>
                    <p className="text-[11px] font-[900] uppercase tracking-[0.16em] opacity-35">
                    Veira Capture
                    </p>

                    <h2 className="text-[27px] font-[900] tracking-[-0.05em] sm:text-[31px]">
                      Extract Action Items
                    </h2>
                  </div>
                </div>

                <p className="max-w-xl text-sm leading-6 opacity-45">
                  Paste notes, emails, chats, or meeting snippets. Veira will
                  pull out likely tasks for you to review.
                </p>
              </div>

              <button
                onClick={closeModal}
                className={`h-10 shrink-0 rounded-2xl px-4 text-sm font-[700] transition hover:scale-[1.02] ${glass}`}
              >
                Close
              </button>
            </div>
          </div>

          <div className="max-h-[calc(92vh-185px)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            <div className="space-y-5">
              <section>
                <label className="mb-2 block text-xs font-[900] uppercase tracking-[0.14em] opacity-40">
                  Paste source text
                </label>

                <textarea
                  value={extractInput}
                  onChange={(event) => setExtractInput(event.target.value)}
                  className={`min-h-[170px] w-full resize-none rounded-[26px] px-4 py-4 text-sm leading-6 outline-none transition focus:ring-4 focus:ring-[#05AD98]/15 ${darkMode
                    ? "bg-white/[0.07] text-white placeholder:text-white/35 border border-white/[0.06]"
                    : "bg-white text-black placeholder:text-black/35 border border-black/[0.08]"
                  }`}
                  placeholder="Paste an email, Slack message, meeting note, or paragraph..."
                />
              </section>

              {extractError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-[700] text-red-500">
                  {extractError}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={extractTasksFromText}
                  disabled={extractLoading}
                  className="h-12 rounded-2xl px-5 text-sm font-[900] text-white shadow-[0_16px_36px_rgba(0,0,0,0.20)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: themeColor }}
                >
                  {extractLoading ? "Extracting..." : "Extract Action Items"}
                </button>

                {extractedTasks.length > 0 && (
                  <button
                    onClick={addSelectedExtractedTasks}
                    className={`h-12 rounded-2xl px-5 text-sm font-[900] transition hover:scale-[1.01] ${glass}`}
                  >
                    Add Selected ({selectedCount})
                  </button>
                )}
              </div>

              {extractedTasks.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-[13px] font-[900]">
                      Review extracted tasks
                    </h3>

                    <span className="text-xs font-[700] opacity-40">
                      {selectedCount} selected
                    </span>
                  </div>

                  <div className="space-y-3">
                    {extractedTasks.map((task: any) => (
                      <div
                        key={task.id}
                        className={`rounded-[24px] border p-4 ${border} ${
                          darkMode ? "bg-white/[0.035]" : "bg-black/[0.015]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleExtractedTask(task.id)}
                            className="mt-0.5 shrink-0"
                          >
                            {task.selected ? (
                              <CheckCircle2
                                size={20}
                                style={{ color: themeColor }}
                              />
                            ) : (
                              <Circle
                                size={20}
                                className={
                                  darkMode ? "text-white/30" : "text-black/30"
                                }
                              />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-[900] leading-6">
                              {task.title}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-[900] ${getPriorityClass(
                                  task.priority
                                )}`}
                              >
                                {task.priority}
                              </span>

                              {task.suggestedDueDate && (
                                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-[900] text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                                  Suggested{" "}
                                  {formatDueDate(task.suggestedDueDate)}
                                </span>
                              )}

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-[900] ${
                                  darkMode
                                    ? "bg-white/[0.06] text-white/45"
                                    : "bg-black/[0.04] text-black/45"
                                }`}
                              >
                                {task.category}
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-[900] ${
                                  darkMode
                                    ? "bg-white/[0.06] text-white/45"
                                    : "bg-black/[0.04] text-black/45"
                                }`}
                              >
                                {Math.round(task.confidence * 100)}%
                              </span>

                              {hasFollowUpTag(task) && <FollowUpTag darkMode={darkMode} />}
                            </div>

                            {task.notes && (
                              <p
                                className={`mt-3 text-sm leading-6 ${
                                  darkMode
                                    ? "text-white/45"
                                    : "text-black/45"
                                }`}
                              >
                                {task.notes}
                              </p>
                            )}

                            {task.reason && (
                              <p
                                className={`mt-2 text-xs leading-5 ${
                                  darkMode
                                    ? "text-white/35"
                                    : "text-black/35"
                                }`}
                              >
                                {task.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SuggestionsReviewModal({
  tasks,
  darkMode,
  themeColor,
  glass,
  strongerGlass,
  border,
  setIsSuggestionsModalOpen,
  acceptSuggestedDateById,
  acceptAllSuggestedDates,
  setSelectedTask,
  setIsEditModalOpen,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[190] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-6"
      onClick={() => setIsSuggestionsModalOpen(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 24, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.94, y: 16, filter: "blur(8px)" }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[88vh] w-full max-w-[760px] overflow-hidden rounded-[28px] border shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-3xl sm:rounded-[36px] ${strongerGlass} ${border}`}
      >
        <div className={`border-b p-5 sm:p-6 ${border}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div
                className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white"
                style={{ backgroundColor: themeColor }}
              >
                <Sparkles size={18} />
              </div>

              <h2 className="text-[25px] font-[700] tracking-[-0.04em] sm:text-[30px]">
                Review Veira Suggestions
              </h2>

              <p
                className={`mt-2 max-w-xl text-sm leading-6 ${
                  darkMode ? "text-white/45" : "text-black/45"
                }`}
              >
                Veira found tasks that look time-sensitive. Review the
                suggested dates before they become part of your plan.
              </p>
            </div>

            <button
              onClick={() => setIsSuggestionsModalOpen(false)}
              className={`h-10 rounded-2xl px-4 text-sm font-[700] ${glass}`}
            >
              Close
            </button>
          </div>

          {tasks.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={acceptAllSuggestedDates}
                className="h-11 rounded-2xl px-5 text-sm font-[700] text-white transition hover:scale-[1.01]"
                style={{ backgroundColor: themeColor }}
              >
                Accept All Suggested Dates
              </button>

              <button
                onClick={() => setIsSuggestionsModalOpen(false)}
                className={`h-11 rounded-2xl px-5 text-sm font-[700] ${glass}`}
              >
                Review Later
              </button>
            </div>
          )}
        </div>

        <div className="max-h-[56vh] overflow-y-auto p-4 sm:p-5">
          {tasks.length === 0 ? (
            <div
              className={`rounded-[24px] border border-dashed p-8 text-center ${border}`}
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                style={{ backgroundColor: themeColor }}
              >
                <CheckCircle2 size={20} />
              </div>

              <h3 className="text-lg font-[700]">No suggestions to review</h3>

              <p
                className={`mx-auto mt-2 max-w-sm text-sm leading-6 ${
                  darkMode ? "text-white/40" : "text-black/40"
                }`}
              >
                Veira will show suggestions here when a task sounds like it
                needs a date.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task: any) => (
                <div
                  key={task.id}
                  className={`rounded-[24px] border p-4 ${border} ${
                    darkMode ? "bg-white/[0.035]" : "bg-black/[0.015]"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[15px] font-[700] leading-6">
                        {task.title}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                       className={`inline-flex h-7 items-center rounded-full px-3 text-[11px] font-[700] tracking-[-0.01em] ${getPriorityClass(
                        task.priority
                      )}`}
                        >
                          {task.priority}
                        </span>

                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-[700] text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                          Suggested {formatDueDate(task.suggestedDueDate)}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-[700] ${
                            darkMode
                              ? "bg-white/[0.06] text-white/40"
                              : "bg-black/[0.04] text-black/40"
                          }`}
                        >
                          {task.category}
                        </span>
                      </div>

                      <p
                        className={`mt-3 text-sm leading-6 ${
                          darkMode ? "text-white/45" : "text-black/45"
                        }`}
                      >
                        {task.aiReason ||
                          "Veira thinks this task may need attention soon."}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:w-[150px]">
                      <button
                        onClick={() => acceptSuggestedDateById(task.id)}
                        className="h-10 rounded-2xl px-4 text-xs font-[700] text-white transition hover:scale-[1.02]"
                        style={{ backgroundColor: themeColor }}
                      >
                        Accept Date
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setIsEditModalOpen(true);
                          setIsSuggestionsModalOpen(false);
                        }}
                        className={`h-10 rounded-2xl px-4 text-xs font-[700] ${glass}`}
                      >
                        Edit Task
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}




function EditTaskModal({
  selectedTask,
  setSelectedTask,
  setIsEditModalOpen,
  saveTaskChanges,
  completeTaskFromModal,
  deleteTaskEverywhere,
  restoreCompletedTask,
  categories,
  themeColor,
  darkMode,
  input,
  modalSelect,
  glass,
  strongerGlass,
  border,
}: any) {
  const closeModal = () => {
    if (selectedTask?.title?.trim()) {
      saveTaskChanges(selectedTask);
      return;
    }

    setIsEditModalOpen(false);
    setSelectedTask(null);
  };

  const priorityOptions: Priority[] = ["Low", "Medium", "High"];
  const statusOptions = ["Active", "Waiting", "Someday"];

  const [newStepTitle, setNewStepTitle] = useState("");

  const stepProgress = getSubtaskProgress(selectedTask);

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
  };

  const fieldLabel = `mb-1.5 block text-[10px] font-[900] uppercase tracking-[0.16em] ${
    darkMode ? "text-white/38" : "text-slate-500"
  }`;

  const fieldClass = darkMode
    ? "border-white/[0.08] bg-[#1f1f21] text-white placeholder:text-white/32"
    : "border-slate-200 bg-white text-[#111827] placeholder:text-slate-400";

  const panelClass = darkMode
    ? "border-white/[0.08] bg-white/[0.035]"
    : "border-slate-200 bg-white/75";

  const softPanelClass = darkMode
    ? "border-white/[0.08] bg-[#111111]/80"
    : "border-slate-200 bg-white/90";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 backdrop-blur-md sm:p-6"
      onClick={closeModal}
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.86,
          y: 18,
          transformOrigin: "50% 48%",
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          transformOrigin: "50% 48%",
        }}
        exit={{
          opacity: 0,
          scale: 0.9,
          y: 14,
          transformOrigin: "50% 48%",
        }}
        transition={{
          type: "spring",
          stiffness: 520,
          damping: 38,
          mass: 0.8,
        }}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[94vh] w-full max-w-[1280px] overflow-hidden rounded-[34px] border shadow-[0_35px_140px_rgba(0,0,0,0.38)] backdrop-blur-3xl ${strongerGlass} ${border}`}
      >
        <div className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -right-28 -top-28 h-64 w-64 rounded-full opacity-[0.12] blur-3xl"
            style={{ backgroundColor: themeColor }}
          />

          <div
            className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full opacity-[0.08] blur-3xl"
            style={{ backgroundColor: themeColor }}
          />

          <div className="relative px-6 pb-3 pt-5 sm:px-8 sm:pt-6">
            <div className="flex items-start justify-between gap-5">
              <div className="flex min-w-0 items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-white shadow-[0_16px_36px_rgba(0,0,0,0.18)]"
                  style={{
                    backgroundColor: themeColor,
                    boxShadow: `0 18px 36px ${themeColor}26`,
                  }}
                >
                  <Sparkles size={20} />
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-[11px] font-[900] uppercase tracking-[0.24em] ${
                      darkMode ? "text-white/35" : "text-slate-400"
                    }`}
                  >
                    Veira Task
                  </p>

                  <h2 className="mt-0.5 text-[26px] font-[900] leading-none tracking-[-0.06em] sm:text-[30px]">
                    Edit Task
                  </h2>

                  <p
  className={`mt-3 max-w-[720px] text-[13px] font-[650] leading-5 ${
    darkMode ? "text-white/45" : "text-slate-500"
  }`}
>
                    Edit the task details on the left. Break execution into
                    steps on the right.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center">
  <button
    onClick={closeModal}
    className="h-11 rounded-full px-6 text-sm font-[900] text-white shadow-[0_18px_38px_rgba(0,0,0,0.18)] transition hover:scale-[1.02]"
    style={{ backgroundColor: themeColor }}
  >
    Done
  </button>
</div>
            </div>
          </div>

          <div className="relative max-h-[calc(94vh-132px)] overflow-y-auto px-6 pb-5 sm:px-8 sm:pb-6">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Left column */}
              <section className={`rounded-[28px] border p-4 sm:p-5 ${panelClass}`}>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={fieldLabel}>Title</label>

                    <input
                      value={selectedTask.title}
                      onChange={(e) =>
                        setSelectedTask({
                          ...selectedTask,
                          title: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTaskChanges(selectedTask);
                      }}
                      className={`h-12 w-full rounded-[22px] border px-4 text-[13px] font-[800] outline-none transition focus:ring-4 focus:ring-[#05AD98]/15 ${fieldClass}`}
                      placeholder="What needs to get done?"
                    />
                  </div>

                  <div>
                    <label className={fieldLabel}>Why it matters</label>

                    <input
                      value={selectedTask.whyThisMatters || ""}
                      onChange={(e) =>
                        setSelectedTask({
                          ...selectedTask,
                          whyThisMatters: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTaskChanges(selectedTask);
                      }}
                      className={`h-12 w-full rounded-[22px] border px-4 text-[13px] font-[800] outline-none transition focus:ring-4 focus:ring-[#05AD98]/15 ${fieldClass}`}
                      placeholder="Impact, outcome, or consequence..."
                    />
                  </div>

                  <div>
                    <label className={fieldLabel}>Priority</label>

                    <div
                      className={`grid h-12 grid-cols-3 gap-1 rounded-[22px] border p-1 ${softPanelClass}`}
                    >
                      {priorityOptions.map((priority) => {
                        const isActive = selectedTask.priority === priority;

                        return (
                          <button
                            key={priority}
                            onClick={() =>
                              setSelectedTask({
                                ...selectedTask,
                                priority,
                              })
                            }
                            className={`rounded-[17px] text-xs font-[900] transition ${
                              isActive
                                ? "text-white shadow-[0_16px_34px_rgba(0,0,0,0.18)]"
                                : darkMode
                                ? "text-white/42 hover:text-white"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                            style={
                              isActive
                                ? {
                                    backgroundColor:
                                      priority === "High"
                                        ? "#ef4444"
                                        : priority === "Medium"
                                        ? "#f59e0b"
                                        : "#10b981",
                                  }
                                : undefined
                            }
                          >
                            {priority === "Medium" ? "Mid" : priority}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>Status</label>

                    <div
                      className={`grid h-12 grid-cols-3 gap-1 rounded-[22px] border p-1 ${softPanelClass}`}
                    >
                      {statusOptions.map((status) => {
                        const isActive =
                          (selectedTask.status || "Active") === status;

                        return (
                          <button
                            key={status}
                            onClick={() =>
                              setSelectedTask({
                                ...selectedTask,
                                status,
                              })
                            }
                            className={`rounded-[17px] text-xs font-[900] transition ${
                              isActive
                                ? "text-white shadow-[0_16px_34px_rgba(0,0,0,0.18)]"
                                : darkMode
                                ? "text-white/42 hover:text-white"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                            style={
                              isActive
                                ? {
                                    backgroundColor: themeColor,
                                  }
                                : undefined
                            }
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>Due date</label>

                    <div className="relative">
                      <input
                        type="date"
                        value={
                          selectedTask.dueDate ||
                          selectedTask.suggestedDueDate ||
                          ""
                        }
                        onChange={(e) =>
                          setSelectedTask({
                            ...selectedTask,
                            dueDate: e.target.value || undefined,
                            suggestedDueDate: undefined,
                            aiReason: e.target.value
                              ? "You manually scheduled this task."
                              : undefined,
                            aiConfidence: e.target.value ? 1 : 0,
                          })
                        }
                        className={`h-12 w-full rounded-[22px] border px-4 pr-11 text-sm font-[800] outline-none transition focus:ring-4 focus:ring-[#05AD98]/15 ${fieldClass}`}
                      />

                      <Calendar
                        size={17}
                        className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${
                          darkMode ? "text-white/45" : "text-slate-500"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>Category</label>

                    <div className="relative">
                      <select
                        value={selectedTask.category}
                        onChange={(e) =>
                          setSelectedTask({
                            ...selectedTask,
                            category: e.target.value,
                          })
                        }
                        className={`h-12 w-full appearance-none rounded-[22px] border px-4 pr-11 text-sm font-[800] outline-none transition focus:ring-4 focus:ring-[#05AD98]/15 ${fieldClass}`}
                      >
                        {categories.map((category: any) => (
                          <option key={category.id} value={category.title}>
                            {category.title}
                          </option>
                        ))}
                      </select>

                      <ChevronDown
                        size={18}
                        className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${
                          darkMode ? "text-white/45" : "text-slate-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <label className={fieldLabel}>Notes</label>

                  <textarea
                    value={selectedTask.notes || ""}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        notes: e.target.value,
                      })
                    }
                    className={`min-h-[88px] w-full resize-none rounded-[22px] border px-4 py-3 text-[13px] font-[650] leading-5 outline-none transition focus:ring-4 focus:ring-[#05AD98]/15 ${fieldClass}`}
                    placeholder="Add context, links, blockers, or anything useful..."
                  />
                </div>

                {selectedTask.aiReason &&
                  selectedTask.aiReason !==
                    "You manually scheduled this task." && (
                    <section
                      className={`mt-5 rounded-[26px] border p-4 ${softPanelClass}`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <Sparkles
                            size={18}
                            className="mt-0.5 shrink-0 text-blue-500"
                          />

                          <div>
                            <p className="text-sm font-[900] uppercase tracking-[0.06em]">
                              Veira&apos;s suggestion
                            </p>

                            <p
                              className={`mt-1 text-xs font-[700] ${
                                darkMode ? "text-white/40" : "text-slate-500"
                              }`}
                            >
                              This is how Veira interpreted the task.
                            </p>
                          </div>
                        </div>

                        <span
                          className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-[900] text-white"
                          style={{ backgroundColor: themeColor }}
                        >
                          {Math.round((selectedTask.aiConfidence || 0) * 100)}%
                          confidence
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 pl-8">
                        <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-[900] text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                          {selectedTask.suggestedDueDate
                            ? `Suggested ${formatDueDate(
                                selectedTask.suggestedDueDate
                              )}`
                            : selectedTask.dueDate
                            ? `Due ${formatDueDate(selectedTask.dueDate)}`
                            : "No date suggested"}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1.5 text-[11px] font-[900] ${
                            selectedTask.priority === "High"
                              ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300"
                              : selectedTask.priority === "Medium"
                              ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                          }`}
                        >
                          {selectedTask.priority === "Medium"
                            ? "Mid"
                            : selectedTask.priority}{" "}
                          priority
                        </span>

                        {hasFollowUpTag(selectedTask) && (
                          <FollowUpTag darkMode={darkMode} />
                        )}
                      </div>

                      <p
                        className={`mt-4 pl-8 text-sm font-[650] leading-6 ${
                          darkMode ? "text-white/48" : "text-slate-500"
                        }`}
                      >
                        {selectedTask.aiReason ||
                          "Veira thinks this task may need attention soon."}
                      </p>
                    </section>
                  )}
              </section>

              {/* Right column */}
              <section className={`rounded-[28px] border p-4 sm:p-5 ${panelClass}`}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <List size={21} style={{ color: themeColor }} />

                      <h3 className="text-[13px] font-[650] uppercase tracking-[0.08em]">
                        Subtask
                      </h3>
                    </div>

                    <p
                      className={`mt-2 text-[12px] font-[650] leading-5 ${
                        darkMode ? "text-white/45" : "text-slate-500"
                      }`}
                    >
                      Big tasks become lighter when the next step is clear.
                      
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 text-[18px]">
                    <span
                      className={`text-sm font-[800] ${
                        darkMode ? "text-white/48" : "text-slate-500"
                      }`}
                    >
                      {stepProgress.completed} / {stepProgress.total} 
                    </span>

                    <div
                      className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(${themeColor} ${
                          stepProgress.percent * 3.6
                        }deg, ${
                          darkMode
                            ? "rgba(255,255,255,0.10)"
                            : "rgb(226 232 240)"
                        } 0deg)`,
                      }}
                    >
                      <div
                        className={`flex h-[40px] w-[40px] items-center justify-center rounded-full text-[12px] font-[900] ${
                          darkMode
                            ? "bg-[#171717] text-white"
                            : "bg-white text-slate-950"
                        }`}
                      >
                        {stepProgress.percent}%
                      </div>
                    </div>
                  </div>
                </div>

                <div
  className={`mb-4 h-1.5 overflow-hidden rounded-full ${
                    darkMode ? "bg-white/[0.08]" : "bg-slate-200"
                  }`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${stepProgress.percent}%`,
                      backgroundColor: themeColor,
                    }}
                  />
                </div>

                <div className="mb-4 grid grid-cols-[minmax(0,1fr)_100px] gap-3">
                  <input
                    value={newStepTitle}
                    onChange={(e) => setNewStepTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addStepToSelectedTask();
                      }
                    }}
                    className={`h-12 min-w-0 rounded-[22px] border px-4 text-sm font-[800] outline-none transition focus:ring-4 focus:ring-[#05AD98]/15 ${fieldClass}`}
                    placeholder="Add a subtask..."
                  />

                  <button
                    onClick={addStepToSelectedTask}
                    className="flex h-12 items-center justify-center gap-2 rounded-[20px] text-[10px] text-sm font-[700] text-white shadow-[0_18px_38px_rgba(0,0,0,0.18)] transition hover:scale-[1.02]"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Plus size={15} />
                    Add
                  </button>
                </div>

                {stepProgress.subtasks.length === 0 ? (
                  <div
                    className={`rounded-[24px] border border-dashed px-4 py-10 text-center text-sm font-[800] ${
                      darkMode
                        ? "border-white/[0.10] text-white/35"
                        : "border-slate-200 text-slate-400"
                    }`}
                  >
                    No steps yet. Add the first step to break this task down.
                  </div>
                ) : (
                  <div
                    className={`overflow-hidden rounded-[24px] border ${softPanelClass}`}
                  >
                    {stepProgress.subtasks.map((step) => (
                      <div
                        key={step.id}
                        className={`group/step grid min-h-[52px] grid-cols-[30px_minmax(0,1fr)_64px_30px] items-center gap-2.5 border-b px-3 last:border-b-0 ${
                          darkMode
                            ? "border-white/[0.07]"
                            : "border-slate-200"
                        }`}
                      >
                        <button
                          onClick={() => toggleSelectedStep(step.id)}
                          className="flex h-8 w-8 items-center justify-center transition hover:scale-110"
                        >
                          {step.completed ? (
                            <span
                              className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-white"
                              style={{ backgroundColor: themeColor }}
                            >
                              <Check size={14} strokeWidth={3} />
                            </span>
                          ) : (
                            <Circle
                              size={22}
                              className={
                                darkMode ? "text-white/32" : "text-slate-400"
                              }
                            />
                          )}
                        </button>

                        <p
                          className={`min-w-0 truncate text-[12px] font-[500] ${
                            step.completed
                              ? darkMode
                                ? "text-white/38 line-through decoration-white/25"
                                : "text-slate-400 line-through decoration-slate-300"
                              : darkMode
                              ? "text-white/78"
                              : "text-slate-950"
                          }`}
                        >
                          {step.title}
                        </p>

                        {step.completed ? (
                          <span
                            className={`justify-self-end rounded-full px-2.5 py-0.5 text-[10px] font-[900] ${
                              darkMode
                                ? "bg-emerald-400/[0.10] text-emerald-200"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            Done
                          </span>
                        ) : (
                          <span
                            className={`justify-self-end text-sm font-[700] text-[10px] ${
                              darkMode ? "text-white/28" : "text-slate-400"
                            }`}
                          >
                            -
                          </span>
                        )}

                        <button
                          onClick={() => deleteSelectedStep(step.id)}
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition hover:scale-110 hover:text-red-500 ${
                            darkMode
                              ? "text-white/35 hover:bg-white/[0.06]"
                              : "text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {stepProgress.allComplete && (
                  <div
                    className={`mt-4 rounded-[20px] border px-4 py-3 ${
                      darkMode
                        ? "border-[#05AD98]/20 bg-[#05AD98]/10"
                        : "border-[#05AD98]/20 bg-[#05AD98]/[0.08]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{
                          color: themeColor,
                          backgroundColor: `${themeColor}18`,
                        }}
                      >
                        <Sparkles size={15} />
                      </div>

                      <div>
                        <p
                          className="text-[13px] font-[900]"
                          style={{ color: darkMode ? "white" : "#064E4A" }}
                        >
                          All steps are done?
                        </p>

                        <p
                          className={`mt-0.5 text-[12px] font-[650] leading-5 ${
                            darkMode ? "text-white/55" : "text-teal-700"
                          }`}
                        >
                          Mark the parent task complete when the full outcome is
                          achieved.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}