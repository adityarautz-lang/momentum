"use client";

import { useEffect, useMemo, useState } from "react";
import { Inter } from "next/font/google";
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
  ListChecks,
  Moon,
  Plus,
  Send,
  Sparkles,
  Sun,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";


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
    return "border border-red-500/15 bg-red-500/[0.08] text-red-500 dark:border-red-300/10 dark:bg-red-300/[0.08] dark:text-red-200";
  }

  if (priority === "Medium") {
    return "border border-amber-500/15 bg-amber-500/[0.08] text-amber-600 dark:border-amber-300/10 dark:bg-amber-300/[0.08] dark:text-amber-200";
  }

  return "border border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-600 dark:border-emerald-300/10 dark:bg-emerald-300/[0.08] dark:text-emerald-200";
};

const getPriorityRowClass = (priority: Priority, darkMode: boolean) => {
  if (darkMode) {
    return "bg-white/[0.035] hover:bg-white/[0.055]";
  }

  return "bg-white hover:bg-[#faf9f6]";
};

/* ------------------------------------------------ */
/* Component */
/* ------------------------------------------------ */

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [archive, setArchive] = useState<any[]>([]);
  const [completedToday, setCompletedToday] = useState<any[]>([]);
  const [themeColor] = useState("#A78BFA");
  const [darkMode, setDarkMode] = useState(false);
  const [selectedView, setSelectedView] = useState("today");
  const [priorityViewMode, setPriorityViewMode] =
  useState<"cards" | "list">("list");
  const [upcomingViewMode, setUpcomingViewMode] = useState<
    "calendar" | "list"
  >("calendar");
  const [enableAppSuggestions, setEnableAppSuggestions] = useState(true);
  const [enableAutoPriority, setEnableAutoPriority] = useState(true);
  const [archiveToast, setArchiveToast] = useState("");
  const [firecrackers, setFirecrackers] = useState<Firecracker[]>([]);
  const [newTask, setNewTask] = useState("");
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
const [currentTime, setCurrentTime] = useState(new Date());
const [isLoaded, setIsLoaded] = useState(false);

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
    const saved = loadState();

    if (saved) {
      const parsed: any = saved;

      setCategories(parsed.categories || initialCategories);
      setDarkMode(parsed.darkMode || false);
      setPriorityViewMode(parsed.priorityViewMode || "cards");
      setUpcomingViewMode(parsed.upcomingViewMode || "calendar");
      setEnableAppSuggestions(parsed.enableAppSuggestions ?? true);
      setEnableAutoPriority(parsed.enableAutoPriority ?? true);
      setArchive(parsed.archive || []);
      setCompletedToday(parsed.completedToday || []);
      setDayEndTime(parsed.dayEndTime || "18:00");

      if (parsed.categories && parsed.categories.length > 0) {
        setSelectedCategory(parsed.categories[0].title);
      } else {
        setSelectedCategory(initialCategories[0].title);
      }
    } else {
      setCategories(initialCategories);
      setSelectedCategory(initialCategories[0].title);
    }

    setIsLoaded(true);
  }, []);

  /* ------------------------------------------------ */
  /* Persist */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (!isLoaded) return;

    saveState({
      categories,
      darkMode,
      themeColor,
      priorityViewMode,
      upcomingViewMode,
      enableAppSuggestions,
      enableAutoPriority,
      archive,
      completedToday,
      dayEndTime,
    } as any);
  }, [
    categories,
    darkMode,
    themeColor,
    priorityViewMode,
    upcomingViewMode,
    enableAppSuggestions,
    enableAutoPriority,
    archive,
    completedToday,
    dayEndTime,
    isLoaded,
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

  const highPriorityCount = allTasks.filter(
    (task) => task.priority === "High"
  ).length;

  const dueSoonCount = allTasks.filter(
    (task) =>
      task.dueDate === todayDate ||
      task.suggestedDueDate === todayDate ||
      task.dueDate === getTomorrowDate() ||
      task.suggestedDueDate === getTomorrowDate()
  ).length;

  const completionPercent =
  allTasks.length === 0
    ? 0
    : Math.round((completedToday.length / allTasks.length) * 100);

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
      "Nice — first win logged. Veira is starting to build.";

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
  ? "bg-white/[0.06] backdrop-blur-2xl"
  : "bg-white/80 backdrop-blur-2xl";

  const strongerGlass = darkMode
  ? "bg-[#2b3039] border-white/[0.09] shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
  : "bg-white/95 border-white shadow-[0_12px_36px_rgba(17,24,39,0.045)] backdrop-blur-2xl";

const input = darkMode
  ? "bg-white/[0.07] text-white placeholder:text-white/35 border border-white/[0.06]"
  : "bg-white/90 text-[#171717] placeholder:text-[#171717]/35 border border-black/[0.06]";

const border = darkMode ? "border-white/[0.075]" : "border-black/[0.045]";

    const modalSelect = darkMode
    ? "bg-[#171a20] text-white"
    : "bg-white text-black border border-black/[0.08]";

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

  /* ------------------------------------------------ */
  /* Add Task */
  /* ------------------------------------------------ */
  const addTask = () => {
    if (!newTask.trim()) return;
  
    const title = newTask.trim();
    const whyThisMatters = newTaskWhy.trim();
  
    const categoryTitle =
      selectedCategory || categories[0]?.title || "Small Wins";
  
    const priority: Priority = enableAutoPriority ? inferPriority(title) : "Medium";
  
    const suggestedDueDate = enableAppSuggestions
      ? suggestDueDate(title)
      : undefined;
  
    const taskId = crypto.randomUUID();
  
    const taskToAdd = {
      id: taskId,
      title,
      whyThisMatters,
      priority,
      dueDate: undefined,
      suggestedDueDate,
      notes: "",
      status: "Active",
      aiReason: whyThisMatters
        ? `This matters because: ${whyThisMatters}`
        : enableAppSuggestions
        ? getAppSuggestionReason(title, priority)
        : "App suggestions are turned off.",
      aiConfidence: whyThisMatters ? 0.9 : suggestedDueDate ? 0.82 : 0,
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
  
    if (enableAppSuggestions) {
      void improveTaskWithAI(taskId, title, whyThisMatters);
    }
  };


  const extractTasksFromText = async () => {
    if (!extractInput.trim()) {
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
          text: extractInput,
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
          .map((task) => ({
            id: crypto.randomUUID(),
            title: task.title,
            priority: task.priority,
            dueDate: undefined,
            suggestedDueDate: task.suggestedDueDate || undefined,
            notes: task.notes,
            status: task.status,
            aiReason: task.reason,
            aiConfidence: task.confidence,
            completed: false,
            createdAt: new Date().toISOString(),
          }));
  
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
                suggestedDueDate:
                  updatedTask.dueDate
                    ? undefined
                    : updatedTask.suggestedDueDate ||
                      (enableAppSuggestions ? suggestDueDate(title) : undefined),
                notes: updatedTask.notes || "",
                status: updatedTask.status || "Active",
                aiReason:
                  updatedTask.aiReason ||
                  (enableAppSuggestions
                    ? getAppSuggestionReason(title, priority)
                    : "App suggestions are turned off."),
                aiConfidence: updatedTask.aiConfidence || 0.72,
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
    setSelectedCategory(initialCategories[0].title);
    setSelectedView("today");

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
    ? "bg-[#1f232b] text-white"
    : "bg-[#f7f5f1] text-[#111111]"
    }`}
  >
      <FirecrackerLayer firecrackers={firecrackers} themeColor={themeColor} />
      <Toast message={archiveToast} darkMode={darkMode} />

      <div className="flex min-h-screen w-full overflow-x-hidden">
      <Sidebar
  darkMode={darkMode}
  setDarkMode={setDarkMode}
  selectedView={selectedView}
  setSelectedView={setSelectedView}
  themeColor={themeColor}
  inboxCount={inboxTasks.length}
/>

<div className="min-w-0 flex-1 overflow-x-hidden px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-[120px] lg:pl-[284px] lg:pt-6 xl:px-10 xl:py-8 xl:pl-[300px]">
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
                enableAppSuggestions={enableAppSuggestions}
                setEnableAppSuggestions={setEnableAppSuggestions}
                enableAutoPriority={enableAutoPriority}
                setEnableAutoPriority={setEnableAutoPriority}
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
   input={input}
   modalSelect={modalSelect}
   glass={glass}
   strongerGlass={strongerGlass}
   border={border}
 />
  )}
</AnimatePresence>
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
}: any) {
  return (
    <>
    <section
  className={`relative z-[120] mb-5 hidden overflow-visible rounded-[30px] border px-5 py-4 sm:block sm:rounded-[34px] sm:px-6 sm:py-5 ${strongerGlass} ${border}`}
>
  <div className="flex items-start justify-between gap-5">
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-[24px] font-[700] leading-tight tracking-[-0.05em]">
          Today&apos;s Momentum
        </h1>

        <span
          className={`rounded-full px-3 py-1 text-[11px] font-[900] ${
            darkMode
              ? "bg-white/[0.06] text-white/50"
              : "bg-black/[0.035] text-black/45"
          }`}
        >
          {formatDateLong()}
        </span>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-[900] transition hover:scale-[1.02] ${
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
        className={`mt-1.5 text-sm font-[700] ${
          darkMode ? "text-white/42" : "text-black/42"
        }`}
      >
        {allTasks.length} tasks · {completedToday.length} completed ·{" "}
        {completionPercent}% progress
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CompactMetric
          label="High"
          value={highPriorityCount}
          color="#ef4444"
          darkMode={darkMode}
        />

        <CompactMetric
          label="Due soon"
          value={dueSoonCount}
          color="#f59e0b"
          darkMode={darkMode}
        />

        <CompactMetric
          label="Completed"
          value={`${completionPercent}%`}
          color="#10b981"
          darkMode={darkMode}
        />

        <CompactMetric
          label="Streak"
          value="4 Day"
          color={themeColor}
          darkMode={darkMode}
        />
      </div>
    </div>

    <DayTimeLeftCard
      dayEndTime={dayEndTime}
      setDayEndTime={setDayEndTime}
      dayTimeRemaining={dayTimeRemaining}
      darkMode={darkMode}
      themeColor={themeColor}
    />
  </div>

  {completedToday.length > 0 && (
    <div
      className={`mt-4 rounded-[22px] border px-4 py-3 ${
        darkMode
          ? "border-white/[0.07] bg-white/[0.035]"
          : "border-black/[0.045] bg-black/[0.018]"
      }`}
    >
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p
            className="text-[11px] font-[900] uppercase tracking-[0.16em]"
            style={{ color: themeColor }}
          >
            AI Veira Boost
          </p>

          <p className="mt-1 truncate text-[15px] font-[700] tracking-[-0.025em]">
            {boostLoading
              ? "Reading your wins..."
              : `Great start — ${completedToday.length} tasks completed today.`}
          </p>
        </div>

        <p
          className={`min-w-0 truncate text-xs font-[700] xl:max-w-[620px] ${
            darkMode ? "text-white/45" : "text-black/45"
          }`}
        >
          {boostLoading
            ? "Your boost will update after a short pause."
            : boostMessage ||
              "Your completed tasks are turning into visible progress."}
        </p>
      </div>
    </div>
  )}
</section>

     
      <section
  className={`relative z-[10] mb-5 overflow-hidden rounded-[24px] border p-4 sm:mb-6 sm:rounded-[36px] sm:p-6 ${    darkMode
  ? "border-white/[0.09] bg-[#2b3039] shadow-[0_18px_54px_rgba(0,0,0,0.32)]"
  : "border-white bg-white/95 shadow-[0_14px_42px_rgba(17,24,39,0.045)]"
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
    <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4 sm:items-center">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[18px] font-[700] tracking-[-0.035em] sm:text-[22px]">
          <Send size={16} style={{ color: themeColor }} />
          Quick Capture
        </h2>

        <p
          className={`mt-1 text-[11px] font-[700] sm:text-xs ${
            darkMode ? "text-white/42" : "text-black/38"
          }`}
        >
          Veira will organize it for you
        </p>
      </div>
    </div>

    <div
  className={`flex min-h-12 overflow-hidden rounded-[18px] border sm:min-h-14 sm:rounded-[22px] ${
    darkMode
  ? "border-white/[0.09] bg-[#1f232b] focus-within:border-violet-300/45"
  : "border-black/[0.06] bg-white focus-within:border-violet-400/55"
  }`}
>
  <input
    value={newTask}
    onChange={(e) => setNewTask(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") addTask();
    }}
    placeholder="Capture anything..."
    className={`h-12 min-w-0 flex-[1.05] bg-transparent px-4 text-sm font-[750] outline-none sm:h-14 sm:px-5 ${
      darkMode
        ? "text-white placeholder:text-white/35"
        : "text-black placeholder:text-black/35"
    }`}
  />

  <div
    className={`my-3 w-px shrink-0 ${
      darkMode ? "bg-white/[0.08]" : "bg-black/[0.06]"
    }`}
  />

  <input
    value={newTaskWhy}
    onChange={(e) => setNewTaskWhy(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") addTask();
    }}
    placeholder="Why this matters..."
    className={`h-12 min-w-0 flex-1 bg-transparent px-4 text-sm font-[750] outline-none sm:h-14 sm:px-5 ${
      darkMode
        ? "text-white placeholder:text-white/35"
        : "text-black placeholder:text-black/35"
    }`}
  />

  <button
    onClick={addTask}
    className="m-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] text-white shadow-[0_14px_30px_rgba(124,58,237,0.20)] transition hover:-translate-y-0.5 active:scale-[0.98] sm:h-11 sm:w-11 sm:rounded-[18px]"
    style={{
      background: `linear-gradient(135deg, ${themeColor}, #7c3aed)`,
    }}
  >
    <Send size={16} />
  </button>
</div>

    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        onClick={() => setIsExtractModalOpen(true)}
        className={`rounded-full border px-3 py-1.5 text-[11px] font-[900] transition hover:scale-[1.02] sm:text-xs ${
          darkMode
            ? "border-violet-300/15 bg-violet-300/10 text-violet-200"
            : "border-violet-500/15 bg-violet-500/[0.08] text-violet-600"
        }`}
      >
        Extract from text
      </button>

      {[
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
      ))}
    </div>
  </div>
</section>


<div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,1fr)]">
  <div className="order-2 xl:order-1">
    <TaskListPanel
      title="Veira Prioritized for You"
      description="Veira lines up your tasks based on intent, urgency, and priority"
      tasks={prioritizedTasks}
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
    />
  </div>

  <div className="order-1 xl:order-2">
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
    </>
  );
}

function TaskListPanel({
  title,
  description,
  tasks,
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
}: any) {
  const [showAllTasks, setShowAllTasks] = useState(false);

  const defaultVisibleTaskCount = 6;

const visibleTasks = showAllTasks
  ? tasks
  : tasks.slice(0, defaultVisibleTaskCount);

const hiddenTaskCount = Math.max(tasks.length - defaultVisibleTaskCount, 0);

  return (
    <section
    className={`min-w-0 self-start overflow-hidden rounded-[24px] border p-4 sm:rounded-[36px] sm:p-6 ${className} ${border}`}
  >
      <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div>
        <h2 className="flex items-center gap-2 text-[18px] font-[900] tracking-[-0.035em] sm:text-[16px] sm:font-[700] sm:tracking-normal">
            {title}
            <Sparkles size={16} style={{ color: themeColor }} />
          </h2>

          <p
            className={`mt-1 text-[12px] leading-5 sm:text-xs ${
              darkMode ? "text-white/40" : "text-black/40"
            }`}
          >
            {description}
          </p>
        </div>

        <button
  className={`w-fit rounded-full px-3 py-1 text-[11px] font-[700] sm:text-xs sm:font-[700] ${
            darkMode
              ? "bg-white/[0.06] text-white/55"
              : "bg-black/[0.04] text-black/55"
          }`}
        >
          Why this order?
        </button>
      </div>

      <div className="space-y-0 sm:space-y-3">
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

  return (
    <motion.div
  key={task.id}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  className={`group overflow-hidden border-b last:border-b-0 sm:overflow-visible sm:border-b-0 ${border}`}
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
              backgroundColor: index < 3 ? "#f59e0b" : themeColor,
            }}
          >
            {index + 1}
          </span>
        )}

        <button
          onClick={() => {
            setSelectedTask(task);
            setIsEditModalOpen(true);
          }}
          title={task.title}
          className="min-w-0 flex-1 truncate text-left text-[13px] font-[850] tracking-[-0.02em] transition hover:opacity-70"
        >
          {task.title}
        </button>

        {isSuggesting && (
          <Sparkles
            size={13}
            className="shrink-0 animate-pulse"
            style={{ color: themeColor }}
          />
        )}
      </div>

      {/* Desktop/tablet full row */}
      <div
  className={`hidden min-h-[72px] min-w-0 items-center gap-4 rounded-[22px] border p-4 transition-all duration-200 hover:-translate-y-0.5 sm:flex ${border} ${getPriorityRowClass(
    task.priority,
    darkMode
  )} ${
    darkMode
      ? "hover:shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
      : "hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
  }`}
>
        <div className="flex w-full min-w-0 flex-1 items-center gap-4 overflow-hidden">
          <button
            onClick={(e) => toggleTaskById(task.id, e)}
            className="shrink-0 opacity-70 transition hover:opacity-100"
          >
            <Circle
              size={19}
              className={darkMode ? "text-white/25" : "text-black/25"}
            />
          </button>

          {ranked && (
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-[700] text-white"
              style={{
                backgroundColor: index < 3 ? "#f59e0b" : themeColor,
              }}
            >
              {index + 1}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p
              onClick={() => {
                setSelectedTask(task);
                setIsEditModalOpen(true);
              }}
              title={task.title}
              className="block max-w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-[700] leading-5 tracking-[-0.015em] hover:opacity-70"
            >
              {task.title}
            </p>

            <p
              className={`mt-1.5 truncate text-[11px] font-[650] ${
                darkMode ? "text-white/38" : "text-black/38"
              }`}
            >
             {task.category} · {task.priority}
             {task.whyThisMatters ? " · Context added" : ""}
{isSuggesting ? " · Veira thinking..." : ""}
            </p>
          </div>
        </div>

        <div className="flex w-auto items-center justify-end gap-2">
          <div className="flex items-center gap-5 text-[13px] font-[700]">
            {visibleDueDate && (
              <div
                className={`flex items-center gap-1.5 ${
                  darkMode ? "text-white/70" : "text-black/65"
                }`}
              >
                <Calendar size={14} />
                <span>{formatDueDate(visibleDueDate)}</span>
              </div>
            )}

            <div
              className={`flex items-center gap-1.5 ${
                task.priority === "High"
                  ? "text-red-500"
                  : task.priority === "Medium"
                  ? "text-orange-500"
                  : "text-emerald-500"
              }`}
            >
              <span className="text-[12px]">●</span>
              <span>{task.priority}</span>
            </div>
          </div>

          <button
            onClick={() => deleteTask(task.id)}
            className="opacity-0 transition hover:!opacity-100 hover:text-red-500 sm:group-hover:opacity-35"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
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
        <h2 className="text-[28px] font-[700] tracking-[-0.04em] sm:text-[32px]">
          {title}
        </h2>

        <p
          className={`mt-2 text-sm ${
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

  const [currentHourRaw, currentMinuteRaw] = dayEndTime.split(":").map(Number);

  const period = currentHourRaw >= 12 ? "PM" : "AM";

  const displayHour =
    currentHourRaw === 0
      ? 12
      : currentHourRaw > 12
      ? currentHourRaw - 12
      : currentHourRaw;

  const displayMinute = String(currentMinuteRaw).padStart(2, "0");

  const hourOptions = [5, 6, 7, 8, 9, 10, 11, 12];
  const minuteOptions = ["00", "15", "30", "45"];

  const updateEndTime = (
    nextHour: number,
    nextMinute: string,
    nextPeriod: "AM" | "PM"
  ) => {
    let hour24 = nextHour;

    if (nextPeriod === "AM" && nextHour === 12) {
      hour24 = 0;
    }

    if (nextPeriod === "PM" && nextHour !== 12) {
      hour24 = nextHour + 12;
    }

    setDayEndTime(`${String(hour24).padStart(2, "0")}:${nextMinute}`);
  };

  return (
    <div className="relative z-[300]">
      <div
        className={`w-[190px] shrink-0 rounded-[22px] border p-3 ${
          darkMode
            ? "border-white/[0.08] bg-white/[0.045]"
            : "border-black/[0.05] bg-white/75"
        }`}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-[14px] text-white"
              style={{ backgroundColor: themeColor }}
            >
              <Clock3 size={15} />
            </div>

            <div>
              <p className="text-[10px] font-[900] uppercase tracking-[0.14em] opacity-40">
                Day Left
              </p>

              <p className="text-[16px] font-[900] tracking-[-0.04em]">
                {dayTimeRemaining.label}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`mb-2 h-2 overflow-hidden rounded-full ${
            darkMode ? "bg-white/[0.08]" : "bg-black/[0.06]"
          }`}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${dayTimeRemaining.percentLeft}%`,
              backgroundColor: dayTimeRemaining.isOver ? "#71717a" : themeColor,
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[10px] font-[700] ${
              darkMode ? "text-white/38" : "text-black/38"
            }`}
          >
            Ends at
          </span>

          <button
            onClick={() => setIsPickerOpen((prev) => !prev)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-[11px] px-2.5 text-[11px] font-[900] transition hover:scale-[1.02] ${
              darkMode
                ? "bg-white/[0.07] text-white hover:bg-white/[0.10]"
                : "bg-black/[0.035] text-black hover:bg-black/[0.06]"
            }`}
          >
            {displayHour}:{displayMinute} {period}
            <Clock3 size={11} className="opacity-45" />
          </button>
        </div>
      </div>

      {isPickerOpen && (
        <div
        className={`absolute right-0 top-[calc(100%+10px)] z-[300] w-[250px] rounded-[22px] border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl ${
            darkMode
              ? "border-white/[0.10] bg-[#171717]/95"
              : "border-black/[0.08] bg-white/95"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-[900] uppercase tracking-[0.14em] opacity-45">
              Set day end
            </p>

            <button
              onClick={() => setIsPickerOpen(false)}
              className={`rounded-full px-2 py-1 text-[10px] font-[900] ${
                darkMode
                  ? "bg-white/[0.07] text-white/55 hover:text-white"
                  : "bg-black/[0.04] text-black/45 hover:text-black"
              }`}
            >
              Done
            </button>
          </div>

          <div className="grid grid-cols-[1fr_1fr_0.8fr] gap-2">
            <div>
              <p className="mb-2 text-[10px] font-[700] uppercase tracking-[0.12em] opacity-35">
                Hour
              </p>

              <div className="grid grid-cols-2 gap-1.5">
                {hourOptions.map((hour) => {
                  const isActive = displayHour === hour;

                  return (
                    <button
                      key={hour}
                      onClick={() =>
                        updateEndTime(hour, displayMinute, period as "AM" | "PM")
                      }
                      className={`h-9 rounded-[12px] text-xs font-[900] transition ${
                        isActive
                          ? "text-white shadow-[0_10px_26px_rgba(0,0,0,0.18)]"
                          : darkMode
                          ? "bg-white/[0.055] text-white/55 hover:text-white"
                          : "bg-black/[0.035] text-black/55 hover:text-black"
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: themeColor,
                            }
                          : undefined
                      }
                    >
                      {hour}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-[900] uppercase tracking-[0.12em] opacity-35">
                Min
              </p>

              <div className="grid grid-cols-2 gap-1.5">
                {minuteOptions.map((minute) => {
                  const isActive = displayMinute === minute;

                  return (
                    <button
                      key={minute}
                      onClick={() =>
                        updateEndTime(displayHour, minute, period as "AM" | "PM")
                      }
                      className={`h-9 rounded-[12px] text-xs font-[900] transition ${
                        isActive
                          ? "text-white shadow-[0_10px_26px_rgba(0,0,0,0.18)]"
                          : darkMode
                          ? "bg-white/[0.055] text-white/55 hover:text-white"
                          : "bg-black/[0.035] text-black/55 hover:text-black"
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: themeColor,
                            }
                          : undefined
                      }
                    >
                      {minute}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-[900] uppercase tracking-[0.12em] opacity-35">
                Mode
              </p>

              <div className="space-y-1.5">
                {(["AM", "PM"] as const).map((option) => {
                  const isActive = period === option;

                  return (
                    <button
                      key={option}
                      onClick={() =>
                        updateEndTime(displayHour, displayMinute, option)
                      }
                      className={`h-9 w-full rounded-[12px] text-xs font-[900] transition ${
                        isActive
                          ? "text-white shadow-[0_10px_26px_rgba(0,0,0,0.18)]"
                          : darkMode
                          ? "bg-white/[0.055] text-white/55 hover:text-white"
                          : "bg-black/[0.035] text-black/55 hover:text-black"
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: themeColor,
                            }
                          : undefined
                      }
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
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
}: any) {
  const [focusIndex, setFocusIndex] = useState(0);
  const [focusLoading, setFocusLoading] = useState(false);
  const [focusError, setFocusError] = useState("");
  const [focusPlan, setFocusPlan] = useState<any>(null);

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
  
      setFocusPlan({
        ...parsed,
        focusTaskIds: validTaskIds,
      });
  
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
    localStorage.removeItem(focusCacheKey);
  }, [prioritizedTasks.length, focusCacheKey]);

  const focusTasks =
    focusPlan?.focusTaskIds
      ?.map((taskId: string) =>
        prioritizedTasks.find((task: any) => task.id === taskId)
      )
      .filter(Boolean) || [];

  const currentTask = focusTasks[focusIndex] || focusTasks[0];

  const getTaskReason = (taskId: string) => {
    return (
      focusPlan?.reasons?.[taskId] ||
      "Veira selected this as one of the strongest next moves."
    );
  };

  const moveNext = () => {
    if (focusTasks.length === 0) return;

    setFocusIndex((prev) => {
      if (prev >= focusTasks.length - 1) return 0;
      return prev + 1;
    });
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
      localStorage.setItem(focusCacheKey, JSON.stringify(fallbackFocusPlan));
      
      setFocusIndex(0);
      setFocusError("AI focus was unavailable. Fallback stack used.");
    } finally {
      setFocusLoading(false);
    }
  };

  return (
    <section
    className={`relative self-start overflow-hidden rounded-[24px] border p-4 sm:rounded-[36px] sm:p-6 ${strongerGlass} ${border}`}
  >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full opacity-[0.14] blur-3xl"
        style={{ backgroundColor: themeColor }}
      />

      <div className="relative">
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:gap-4">
  <div className="min-w-0">
    <h2 className="flex items-center gap-2 text-[18px] font-[700] tracking-[-0.035em] sm:text-[18px]">
      Focus Mode
      <Sparkles size={15} style={{ color: themeColor }} />
    </h2>

    <p
      className={`mt-1.5 max-w-md text-[12px] leading-5 sm:mt-2 sm:text-sm sm:leading-6 ${
        darkMode ? "text-white/45" : "text-black/45"
      }`}
    >
      Compute your 3-task execution stack.
    </p>
  </div>

  <span
    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-[900] sm:px-3 sm:py-1.5 ${
      darkMode
        ? "bg-white/[0.07] text-white/55"
        : "bg-black/[0.04] text-black/45"
    }`}
  >
    AI
  </span>
</div>

        {!focusPlan ? (
         <div
         className={`rounded-[22px] border p-4 sm:rounded-[26px] sm:p-5 ${
           darkMode
             ? "border-white/[0.08] bg-white/[0.04]"
             : "border-black/[0.04] bg-white/65"
         }`}
       >
         <h3 className="text-[19px] font-[700] leading-tight tracking-[-0.04em] sm:text-[22px]">
           Build your focus stack.
         </h3>
       
         <p
           className={`mt-2 text-[12px] leading-5 sm:mt-3 sm:text-sm sm:leading-6 ${
             darkMode ? "text-white/45" : "text-black/45"
           }`}
         >
           Veira will choose the 3 strongest tasks to work through next.
         </p>
       
         <button
           onClick={computeFocusStack}
           disabled={focusLoading || prioritizedTasks.length === 0}
           className="mt-4 h-11 w-full rounded-[18px] text-sm font-[900] text-white shadow-[0_14px_30px_rgba(0,0,0,0.14)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 sm:mt-5 sm:h-12 sm:rounded-2xl"
           style={{ backgroundColor: themeColor }}
         >
           {focusLoading ? "Computing..." : "Compute Focus Stack"}
         </button>
       
         {prioritizedTasks.length === 0 && (
           <p className="mt-3 text-center text-xs font-[700] opacity-40">
             Add a task first.
           </p>
         )}
       </div>
        ) : (
          <>
           <div
  className={`mb-4 rounded-[22px] border p-4 sm:mb-5 sm:rounded-[26px] sm:p-5 ${
    darkMode
      ? "border-white/[0.08] bg-white/[0.04]"
      : "border-black/[0.04] bg-white/65"
  }`}
>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p
                  className="text-[11px] font-[900] uppercase tracking-[0.16em]"
                  style={{ color: themeColor }}
                >
                  Current Focus
                </p>

                <button
                  onClick={computeFocusStack}
                  disabled={focusLoading}
                  className={`rounded-full px-3 py-1 text-[10px] font-[900] transition hover:scale-[1.02] disabled:opacity-40 ${
                    darkMode
                      ? "bg-white/[0.06] text-white/50"
                      : "bg-black/[0.04] text-black/45"
                  }`}
                >
                  {focusLoading ? "Thinking..." : "Recompute"}
                </button>
              </div>

              <h3
                onClick={() => {
                  setSelectedTask(currentTask);
                  setIsEditModalOpen(true);
                }}
                title={currentTask?.title}
                className="cursor-pointer text-[19px] font-[900] leading-tight tracking-[-0.04em] hover:opacity-75 sm:text-[23px] sm:tracking-[-0.045em]"
              >
                {currentTask?.title}
              </h3>

              <div
                className={`mt-3 flex flex-wrap items-center gap-3 text-sm font-[750] ${
                  darkMode ? "text-white/55" : "text-black/50"
                }`}
              >
                <span
                  className={`inline-flex items-center gap-2 ${
                    currentTask?.priority === "High"
                      ? "text-red-500"
                      : currentTask?.priority === "Medium"
                      ? "text-orange-500"
                      : "text-emerald-500"
                  }`}
                >
                  <span className="text-[12px]">●</span>
                  {currentTask?.priority}
                </span>

                {(currentTask?.dueDate || currentTask?.suggestedDueDate) && (
                  <span className="inline-flex items-center gap-2">
                    <Calendar size={15} />
                    {formatDueDate(
                      currentTask.dueDate || currentTask.suggestedDueDate
                    )}
                  </span>
                )}
              </div>

              <p
               className={`mt-3 text-[12px] leading-5 sm:mt-4 sm:text-sm sm:leading-6 ${
                darkMode ? "text-white/45" : "text-black/45"
              }`}
              >
                {getTaskReason(currentTask?.id)}
              </p>

              <div className="mt-4 grid grid-cols-[1fr_0.72fr] gap-2 sm:mt-5 sm:gap-3">
                <button
                  onClick={(event) => toggleTaskById(currentTask.id, event)}
                  className="h-11 rounded-[18px] text-sm font-[900] text-white shadow-[0_14px_30px_rgba(0,0,0,0.14)] transition hover:scale-[1.01] sm:h-12 sm:rounded-2xl"
                  style={{ backgroundColor: themeColor }}
                >
                  Complete
                </button>

                <button
                  onClick={moveNext}
                  className={`h-11 rounded-[18px] border text-sm font-[900] transition hover:scale-[1.01] sm:h-12 sm:rounded-2xl ${border}`}
                >
                  Next
                </button>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-[900] tracking-[-0.03em]">
                  Focus Stack
                </h3>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-[700] ${
                    darkMode
                      ? "bg-white/[0.06] text-white/45"
                      : "bg-black/[0.04] text-black/40"
                  }`}
                >
                  {focusTasks.length}
                </span>
              </div>

              {focusError && (
                <p className="mb-3 rounded-2xl bg-orange-500/10 px-3 py-2 text-xs font-[700] text-orange-500">
                  {focusError}
                </p>
              )}

              <div className="space-y-2">
                {focusTasks.map((task: any, index: number) => {
                  const isCurrent = task.id === currentTask.id;

                  return (
                    <button
                      key={task.id}
                      onClick={() => setFocusIndex(index)}
                      className={`flex min-h-[54px] w-full items-center gap-2 rounded-[16px] border px-3 py-2.5 text-left transition hover:scale-[1.005] sm:min-h-[60px] sm:gap-3 sm:rounded-[18px] sm:py-3 ${
                        isCurrent
                          ? "border-violet-400/50 bg-violet-500/[0.055]"
                          : `${border} ${
                              darkMode ? "bg-white/[0.025]" : "bg-white/60"
                            }`
                      }`}
                    >
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-[900] text-white sm:h-7 sm:w-7 sm:text-xs"
                        style={{
                          backgroundColor: isCurrent ? themeColor : "#a1a1aa",
                        }}
                      >
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-[900]">
                          {task.title}
                        </p>

                        <p
                          className={`mt-0.5 text-[11px] font-[700] ${
                            darkMode ? "text-white/35" : "text-black/35"
                          }`}
                        >
                          {task.priority}
                          {(task.dueDate || task.suggestedDueDate) &&
                            ` · ${formatDueDate(
                              task.dueDate || task.suggestedDueDate
                            )}`}
                        </p>
                      </div>

                      {isCurrent && (
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-[900]"
                          style={{
                            color: themeColor,
                            backgroundColor: `${themeColor}18`,
                          }}
                        >
                          Now
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
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
            : "border-violet-500/15 bg-violet-500/[0.08] text-violet-600 dark:border-violet-300/10 dark:bg-violet-300/[0.08] dark:text-violet-200"
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
          ? "border-y-white/[0.08] border-r-white/[0.08] bg-[#171717]"
          : "border-y-black/[0.07] border-r-black/[0.07] bg-white"
      }`}
    >
      <div className={`flex items-center justify-between border-b px-6 py-5 ${border}`}>
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: dotColor }} />
            <h3 className="text-[16px] font-[700]">{title}</h3>
          </div>

          <p className={`mt-1 text-[12px] ${darkMode ? "text-white/45" : "text-black/45"}`}>
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
              className={`cursor-pointer truncate text-[14px] font-[700] ${
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

            <p
             className={`mt-1 text-[12px] ${
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
  enableAppSuggestions,
  setEnableAppSuggestions,
  enableAutoPriority,
  setEnableAutoPriority,
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
          className={className}
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

          <p className={`mt-2 text-sm ${darkMode ? "text-white/45" : "text-black/45"}`}>
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
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 24);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const items = [
    {
      key: "today",
      label: "Today",
      icon: ListChecks,
    },
    {
      key: "inbox",
      label: "Inbox",
      icon: Calendar,
      count: inboxCount,
    },
    {
      key: "upcoming",
      label: "Plan",
      icon: Clock3,
    },
    {
      key: "priorities",
      label: "Priority",
      icon: Flame,
    },
    {
      key: "settings",
      label: "Settings",
      icon: Target,
    },
  ];

  return (
    <nav
    className={`fixed left-3 right-3 top-3 z-[160] grid grid-cols-5 rounded-[24px] border p-2 backdrop-blur-2xl transition-all duration-300 lg:hidden ${
      hasScrolled
  ? darkMode
    ? "border-white/[0.035] bg-[#111827]/22 shadow-[0_10px_34px_rgba(0,0,0,0.10)]"
    : "border-white/25 bg-white/22 shadow-[0_10px_34px_rgba(17,24,39,0.045)]"
  : darkMode
        ? "border-white/[0.08] bg-[#111827]/90 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
        : "border-black/[0.08] bg-white/95 shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
    }`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = selectedView === item.key;

        return (
          <button
            key={item.key}
            onClick={() => setSelectedView(item.key)}
            className={`relative flex flex-col items-center justify-center gap-1 rounded-[18px] py-2 text-[10px] font-[700] transition ${
              isActive
                ? "text-white"
                : darkMode
                ? "text-white/45"
                : "text-black/45"
            }`}
            style={
              isActive
                ? {
                    backgroundColor: themeColor,
                  }
                : undefined
            }
          >
            <Icon size={16} />

            <span>{item.label}</span>

            {item.count ? (
              <span
                className={`absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-[900] ${
                  isActive ? "bg-white text-black" : "bg-red-500 text-white"
                }`}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
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
                  className={`min-h-[170px] w-full resize-none rounded-[26px] px-4 py-4 text-sm leading-6 outline-none transition focus:ring-4 focus:ring-violet-500/15 ${darkMode
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
                    <h3 className="text-sm font-[900]">
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
  input,
  modalSelect,
  glass,
  strongerGlass,
  border,
}: any) {
  const isCompleted = Boolean(selectedTask.completed);

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

  return (
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md sm:p-6"
    onClick={closeModal}
  >
     <motion.div
  initial={{
    opacity: 0,
    scale: 0.82,
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
    scale: 0.86,
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
  className={`max-h-[92vh] w-full max-w-[760px] overflow-hidden rounded-[34px] border shadow-[0_35px_140px_rgba(0,0,0,0.38)] backdrop-blur-3xl ${strongerGlass} ${border}`}
>
        <div className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: themeColor }}
          />

          <div
            className="pointer-events-none absolute -left-20 top-20 h-40 w-40 rounded-full opacity-10 blur-3xl"
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
                    Veira Task
                    </p>

                    <h2 className="text-[27px] font-[900] tracking-[-0.05em] sm:text-[31px]">
                      Edit Task
                    </h2>
                  </div>
                </div>

                <p className="max-w-xl text-sm leading-6 opacity-45">
                  Refine the task, adjust the plan, and keep Veira aligned
                  with how you actually want to execute.
                </p>
              </div>

              <button
  onClick={closeModal}
  className={`h-10 shrink-0 rounded-2xl px-4 text-sm font-[700] transition hover:scale-[1.02] ${glass}`}
>
  Done
</button>
            </div>
          </div>

          <div className="relative max-h-[calc(92vh-180px)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            <div className="space-y-6">
            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
  <div>
    <label className="mb-2 block text-xs font-[900] uppercase tracking-[0.14em] opacity-40">
      Title
    </label>

    <input
      value={selectedTask.title}
      onChange={(e) =>
        setSelectedTask({ ...selectedTask, title: e.target.value })
      }
      onKeyDown={(e) => {
        if (e.key === "Enter") saveTaskChanges(selectedTask);
      }}
      className={`h-14 w-full rounded-[22px] px-4 text-[15px] font-[750] tracking-[-0.01em] outline-none transition focus:ring-4 ${input} ${
        selectedTask.title?.trim()
          ? "focus:ring-violet-500/15"
          : "focus:ring-red-500/15"
      }`}
      placeholder="What needs to get done?"
    />
  </div>

  <div>
    <label className="mb-2 block text-xs font-[900] uppercase tracking-[0.14em] opacity-40">
      Why this matters
    </label>

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
      className={`h-14 w-full rounded-[22px] px-4 text-[15px] font-[750] tracking-[-0.01em] outline-none transition focus:ring-4 focus:ring-violet-500/15 ${input}`}
      placeholder="Impact, outcome, or consequence..."
    />
  </div>
</section>

              <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-[900] uppercase tracking-[0.14em] opacity-40">
                    Priority
                  </label>

                  <div className={`grid grid-cols-3 gap-2 rounded-[22px] border p-1.5 ${border}`}>
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
                          className={`h-11 rounded-[17px] text-xs font-[900] transition ${
                            isActive
                              ? "text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
                              : "opacity-45 hover:opacity-80"
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
                          {priority}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-[900] uppercase tracking-[0.14em] opacity-40">
                    Status
                  </label>

                  <div className={`grid grid-cols-3 gap-2 rounded-[22px] border p-1.5 ${border}`}>
                    {statusOptions.map((status) => {
                      const isActive = (selectedTask.status || "Active") === status;

                      return (
                        <button
                          key={status}
                          onClick={() =>
                            setSelectedTask({
                              ...selectedTask,
                              status,
                            })
                          }
                          className={`h-11 rounded-[17px] text-xs font-[900] transition ${
                            isActive
                              ? "text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
                              : "opacity-45 hover:opacity-80"
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
              </section>

              <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-[900] uppercase tracking-[0.14em] opacity-40">
                    Due date
                  </label>

                  <input
                    type="date"
                    value={selectedTask.dueDate || ""}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        dueDate: e.target.value || undefined,
                        suggestedDueDate: e.target.value
                          ? undefined
                          : selectedTask.suggestedDueDate,
                      })
                    }
                    className={`h-14 w-full rounded-[22px] px-4 text-sm font-[700] outline-none transition focus:ring-4 focus:ring-violet-500/15 ${modalSelect}`}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-[900] uppercase tracking-[0.14em] opacity-40">
                    Category
                  </label>

                  <select
                    value={selectedTask.category}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        category: e.target.value,
                      })
                    }
                    className={`h-14 w-full rounded-[22px] px-4 text-sm font-[700] outline-none transition focus:ring-4 focus:ring-violet-500/15 ${modalSelect}`}
                  >
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.title}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <section>
                <label className="mb-2 block text-xs font-[900] uppercase tracking-[0.14em] opacity-40">
                  Notes
                </label>

                <textarea
                  value={selectedTask.notes || ""}
                  onChange={(e) =>
                    setSelectedTask({ ...selectedTask, notes: e.target.value })
                  }
                  className={`min-h-[120px] w-full resize-none rounded-[24px] px-4 py-4 text-sm leading-6 outline-none transition focus:ring-4 focus:ring-violet-500/15 ${input}`}
                  placeholder="Add context, links, blockers, or anything useful..."
                />
              </section>

              {selectedTask.suggestedDueDate && (
                <section className={`rounded-[26px] border p-4 ${border}`}>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-[900]">Veira’s read</p>
                      <p className="mt-1 text-xs leading-5 opacity-45">
                        This is how Veira interpreted the task.
                      </p>
                    </div>

                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-[900] text-white"
                      style={{ backgroundColor: themeColor }}
                    >
                      {Math.round((selectedTask.aiConfidence || 0) * 100)}%
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-[900] text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                      Suggested {formatDueDate(selectedTask.suggestedDueDate)}
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
                      {selectedTask.priority} priority
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 opacity-50">
                    {selectedTask.aiReason ||
                      "Veira thinks this task may need attention soon."}
                  </p>
                </section>
              )}
            </div>
          </div>

          <div className={`relative border-t px-5 py-4 sm:px-7 ${border}`}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
              <button
                onClick={() => deleteTaskEverywhere(selectedTask.id)}
                className="h-12 rounded-2xl bg-red-500/10 text-sm font-[900] text-red-500 transition hover:scale-[1.01]"
              >
                Delete
              </button>

              {isCompleted ? (
                <button
                  onClick={() => {
                    restoreCompletedTask(selectedTask.id);
                    closeModal();
                  }}
                  className={`h-12 rounded-2xl text-sm font-[900] transition hover:scale-[1.01] ${glass}`}
                >
                  Restore
                </button>
              ) : (
                <button
                  onClick={() => completeTaskFromModal(selectedTask.id)}
                  className={`h-12 rounded-2xl text-sm font-[900] transition hover:scale-[1.01] ${glass}`}
                >
                  Complete
                </button>
              )}

              <button
                onClick={() => saveTaskChanges(selectedTask)}
                className="h-12 rounded-2xl text-sm font-[900] text-white shadow-[0_16px_36px_rgba(0,0,0,0.20)] transition hover:scale-[1.01]"
                style={{ backgroundColor: themeColor }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}