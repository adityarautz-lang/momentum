"use client";

import { useEffect, useMemo, useState } from "react";
import { Mulish } from "next/font/google";
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
  Zap,
} from "lucide-react";

/* ------------------------------------------------ */
/* Font */
/* ------------------------------------------------ */

const mulish = Mulish({
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
    return "This looks like an admin or official task, so Momentum suggests handling it soon.";
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
    return "This sounds time-sensitive or submission-based, so Momentum moved it higher.";
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
    return "This may depend on another person or available slots, so Momentum suggests doing it early.";
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
    return "This involves communication with someone else, so Momentum suggests not leaving it open too long.";
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
    return "This looks like an errand or purchase, so Momentum suggests scheduling it soon.";
  }

  if (priority === "High") {
    return "This was classified as high priority, so Momentum kept it near the top.";
  }

  if (priority === "Medium") {
    return "This looks useful but not immediately critical.";
  }

  return "This looks less urgent, so Momentum placed it lower for now.";
};

const scoreTask = (task: any) => {
  let score = 0;
  const title = String(task.title || "").toLowerCase();

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

  lowValueWords.forEach((word) => {
    if (title.includes(word)) score -= 3;
  });

  if (task.priority === "High") score += 25;
  if (task.priority === "Medium") score += 12;
  if (task.priority === "Low") score += 3;
  if (task.dueDate) score += 18;
  if (task.suggestedDueDate) score += 10;

  return score;
};

const getPriorityClass = (priority: Priority) => {
  if (priority === "High") {
    return "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300";
  }

  if (priority === "Medium") {
    return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300";
  }

  return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300";
};

const getPriorityRowClass = (priority: Priority, darkMode: boolean) => {
  if (priority === "High") {
    return darkMode
      ? "bg-red-500/[0.07] hover:bg-red-500/[0.11]"
      : "bg-red-50/70 hover:bg-red-100/70";
  }

  if (priority === "Medium") {
    return darkMode
      ? "bg-amber-500/[0.07] hover:bg-amber-500/[0.11]"
      : "bg-amber-50/70 hover:bg-amber-100/70";
  }

  return darkMode
    ? "bg-emerald-500/[0.07] hover:bg-emerald-500/[0.11]"
    : "bg-emerald-50/70 hover:bg-emerald-100/70";
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
  const [priorityViewMode, setPriorityViewMode] = useState<"cards" | "list">(
    "cards"
  );
  const [upcomingViewMode, setUpcomingViewMode] = useState<
    "calendar" | "list"
  >("calendar");
  const [enableAppSuggestions, setEnableAppSuggestions] = useState(true);
  const [enableAutoPriority, setEnableAutoPriority] = useState(true);
  const [archiveToast, setArchiveToast] = useState("");
  const [firecrackers, setFirecrackers] = useState<Firecracker[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategoryTitle, setEditingCategoryTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const todayDate = getTodayDate();

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
    return [...allTasks].sort((a, b) => b.score - a.score);
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
    allTasks.length + completedToday.length === 0
      ? 0
      : Math.round(
          (completedToday.length / (allTasks.length + completedToday.length)) *
            100
        );

  const suggestedDateCount = allTasks.filter(
    (task) => !task.dueDate && task.suggestedDueDate
  ).length;

  const highPriorityTasks = prioritizedTasks.filter(
    (task) => task.priority === "High"
  );

  const mediumPriorityTasks = prioritizedTasks.filter(
    (task) => task.priority === "Medium"
  );

  const lowPriorityTasks = prioritizedTasks.filter(
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

  const todayTasks = upcomingTasks.filter((task) => isToday(getTaskDate(task)));

  const tomorrowTasks = upcomingTasks.filter((task) =>
    isTomorrow(getTaskDate(task))
  );

  const laterTasks = upcomingTasks.filter((task) => isLater(getTaskDate(task)));

  const noDateTasks = upcomingTasks.filter((task) => !getTaskDate(task));

  const inboxTasks = prioritizedTasks.filter(
    (task) => !task.dueDate && !task.suggestedDueDate
  );

  /* ------------------------------------------------ */
  /* Theme Classes */
  /* ------------------------------------------------ */

  const glass = darkMode
  ? "bg-white/[0.055] backdrop-blur-2xl"
  : "bg-white backdrop-blur-2xl";

    const strongerGlass = darkMode
    ? "bg-white/[0.065] border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
    : "bg-white border-black/[0.05] shadow-[0_24px_70px_rgba(15,23,42,0.08)]";

    const input = darkMode
    ? "bg-white/[0.07] text-white placeholder:text-white/35 border border-white/[0.06]"
    : "bg-white text-[#171717] placeholder:text-[#171717]/35 border border-black/[0.08]";

    const border = darkMode ? "border-white/[0.075]" : "border-black/[0.07]";

    const modalSelect = darkMode
    ? "bg-[#171a20] text-white"
    : "bg-white text-black border border-black/[0.08]";

  const fontClass = mulish.className;

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

  /* ------------------------------------------------ */
  /* Add Task */
  /* ------------------------------------------------ */

  const addTask = () => {
    if (!newTask.trim()) return;

    const title = newTask.trim();
    const categoryTitle =
      selectedCategory || categories[0]?.title || "Small Wins";

    const priority: Priority = enableAutoPriority ? inferPriority(title) : "Medium";

    const suggestedDueDate = enableAppSuggestions
      ? suggestDueDate(title)
      : undefined;

    const taskToAdd = {
      id: crypto.randomUUID(),
      title,
      priority,
      dueDate: undefined,
      suggestedDueDate,
      aiReason: enableAppSuggestions
        ? getAppSuggestionReason(title, priority)
        : "App suggestions are turned off.",
      aiConfidence: suggestedDueDate ? 0.82 : 0,
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
  };

  /* ------------------------------------------------ */
  /* Toggle Task */
  /* ------------------------------------------------ */

  const toggleTaskById = (taskId: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();

    triggerFirecracker(rect.left + rect.width / 2, rect.top + rect.height / 2);

    const categoryWithTask = categories.find((category) =>
      category.tasks.some((task: any) => task.id === taskId)
    );

    if (!categoryWithTask) return;

    const taskToComplete = categoryWithTask.tasks.find(
      (task: any) => task.id === taskId
    );

    if (!taskToComplete) return;

    const completedTask = {
      ...taskToComplete,
      completed: true,
      completedAt: new Date().toISOString(),
      category: categoryWithTask.title,
    };

    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryWithTask.id) {
          return category;
        }

        return {
          ...category,
          tasks: category.tasks.filter((task: any) => task.id !== taskId),
        };
      })
    );

    setCompletedToday((prev) => [completedTask, ...prev]);
  };

  /* ------------------------------------------------ */
  /* Restore Completed Task */
  /* ------------------------------------------------ */

  const restoreCompletedTask = (taskId: string) => {
    const taskToRestore = completedToday.find((task) => task.id === taskId);

    if (!taskToRestore) return;

    const categoryTitle =
      taskToRestore.category || selectedCategory || categories[0]?.title;

    const restoredTask = {
      id: taskToRestore.id,
      title: taskToRestore.title,
      priority: taskToRestore.priority,
      dueDate: taskToRestore.dueDate,
      suggestedDueDate: taskToRestore.suggestedDueDate,
      aiReason: taskToRestore.aiReason,
      aiConfidence: taskToRestore.aiConfidence,
      completed: false,
      createdAt: taskToRestore.createdAt || new Date().toISOString(),
    };

    setCategories((prev) =>
      prev.map((category) => {
        if (category.title !== categoryTitle) {
          return category;
        }

        return {
          ...category,
          tasks: [restoredTask, ...category.tasks],
        };
      })
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
            aiReason: "You accepted Momentum's app-suggested date.",
            aiConfidence: 1,
          };
        }),
      }))
    );
  };

  /* ------------------------------------------------ */
  /* Save Task Changes */
  /* ------------------------------------------------ */

  const saveTaskChanges = (updatedTask: any) => {
    if (!updatedTask?.title?.trim()) return;

    const title = updatedTask.title.trim();
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
                priority,
                dueDate: updatedTask.dueDate || undefined,
                suggestedDueDate:
                  updatedTask.suggestedDueDate ||
                  (enableAppSuggestions ? suggestDueDate(title) : undefined),
                aiReason:
                  updatedTask.aiReason ||
                  (enableAppSuggestions
                    ? getAppSuggestionReason(title, priority)
                    : "App suggestions are turned off."),
                aiConfidence: updatedTask.aiConfidence || 0.72,
                completed: false,
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

    setArchive((prev) => [...completedToday, ...prev]);
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
      "Reset all Momentum data? This will delete active tasks, completed tasks, and archived items."
    );

    if (!confirmed) return;

    setCategories(initialCategories);
    setArchive([]);
    setCompletedToday([]);
    setSelectedCategory(initialCategories[0].title);
    setSelectedView("today");

    setArchiveToast("Momentum data reset");

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
    return <main className="min-h-screen bg-[#f5f5f3]" />;
  }

  return (
    <main
  className={`${fontClass} min-h-screen w-full overflow-x-hidden transition-colors duration-500 ${
      darkMode
        ? "bg-[radial-gradient(circle_at_top_right,_rgba(167,139,250,0.18),_transparent_32%),linear-gradient(135deg,_#080b12_0%,_#111827_48%,_#0b0f17_100%)] text-white"
        : "bg-white text-black"
    }`}
  >
      <FirecrackerLayer firecrackers={firecrackers} themeColor={themeColor} />
      <Toast message={archiveToast} darkMode={darkMode} />

      <div className="flex min-h-screen w-full overflow-x-hidden">
      <div className="hidden lg:flex">
          <Sidebar
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            selectedView={selectedView}
            setSelectedView={setSelectedView}
            themeColor={themeColor}
            inboxCount={inboxTasks.length}
          />
        </div>

        <div className="min-w-0 flex-1 overflow-x-hidden px-4 pb-32 pt-4 sm:px-6 sm:py-6 xl:px-10 xl:py-8">
        <div className="mx-auto w-full max-w-[1440px] overflow-x-hidden">
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
                newTask={newTask}
                setNewTask={setNewTask}
                addTask={addTask}
                toggleTaskById={toggleTaskById}
                deleteTask={deleteTask}
                acceptSuggestedDateById={acceptSuggestedDateById}
                setSelectedTask={setSelectedTask}
                setIsEditModalOpen={setIsEditModalOpen}
                archiveCompletedToday={archiveCompletedToday}
                restoreCompletedTask={restoreCompletedTask}
              />
            )}

            {selectedView === "priorities" && (
              <PrioritiesView
                darkMode={darkMode}
                border={border}
                className={strongerGlass}
                themeColor={themeColor}
                viewMode={priorityViewMode}
                setViewMode={setPriorityViewMode}
                highPriorityTasks={highPriorityTasks}
                mediumPriorityTasks={mediumPriorityTasks}
                lowPriorityTasks={lowPriorityTasks}
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

            {[
              "goals",
              "routines",
              "calendar",
              "review",
              "insights",
            ].includes(selectedView) && (
              <PlaceholderView
                selectedView={selectedView}
                darkMode={darkMode}
                border={border}
                className={strongerGlass}
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
        {isEditModalOpen && selectedTask && (
          <EditTaskModal
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            setIsEditModalOpen={setIsEditModalOpen}
            saveTaskChanges={saveTaskChanges}
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
  newTask,
  setNewTask,
  addTask,
  toggleTaskById,
  deleteTask,
  acceptSuggestedDateById,
  setSelectedTask,
  setIsEditModalOpen,
  archiveCompletedToday,
  restoreCompletedTask,
}: any) {
  return (
    <>
     <div
  className={`mb-5 rounded-[26px] border p-4 sm:mb-8 sm:rounded-[36px] sm:p-6 ${strongerGlass} ${border}`}
>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div>
          <h1 className="text-[24px] font-[800] leading-[1.12] tracking-[-0.045em] sm:text-[32px]">
              Hello! Let&apos;s build some Momentum.
            </h1>

            <p
              className={`mt-2 text-sm ${
                darkMode ? "text-white/45" : "text-black/45"
              }`}
            >
              {allTasks.length} active tasks · {dueSoonCount} due soon ·{" "}
              {completedToday.length} completed today
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <div className={`rounded-2xl px-4 py-3 text-xs font-[700] ${glass}`}>
              {formatDateLong()}
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-[700] transition hover:-translate-y-0.5 ${glass}`}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              {darkMode ? "Light" : "Dark"}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-5 gap-1 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          className={strongerGlass}
          border={border}
          icon={<ListChecks size={18} />}
          label="Tasks Today"
          value={allTasks.length}
          themeColor={themeColor}
        />

        <StatCard
          className={strongerGlass}
          border={border}
          icon={<Flame size={18} />}
          label="High Priority"
          value={highPriorityCount}
          themeColor="#ef4444"
        />

        <StatCard
          className={strongerGlass}
          border={border}
          icon={<Clock3 size={18} />}
          label="Due Soon"
          value={dueSoonCount}
          themeColor="#f59e0b"
        />

        <StatCard
          className={strongerGlass}
          border={border}
          icon={<TrendingUp size={18} />}
          label="Completed"
          value={`${completionPercent}%`}
          themeColor="#10b981"
        />

        <StatCard
          className={strongerGlass}
          border={border}
          icon={<Zap size={18} />}
          label="Streak"
          value="4 Day"
          themeColor={themeColor}
        />
      </div>

      <section
  className={`mb-5 rounded-[26px] border p-4 sm:mb-6 sm:rounded-[36px] sm:p-6 ${strongerGlass} ${border}`}
>
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <h2 className="text-[19px] font-[800] sm:text-[21px]">
            Quick Capture
          </h2>

          <span
            className={`text-xs ${
              darkMode ? "text-white/40" : "text-black/40"
            }`}
          >
            Momentum will organize it for you
          </span>
        </div>

        <div className="flex gap-2 sm:gap-3">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
            }}
           placeholder="Capture anything..."
            className={`h-[52px] min-w-0 flex-1 rounded-[20px] border border-rose-200/70 px-4 text-sm font-[650] outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-200/45 dark:border-rose-400/35 dark:focus:border-rose-300 dark:focus:ring-rose-500/15 sm:h-14 sm:rounded-[22px] sm:px-5 ${
              darkMode
                ? "bg-white/[0.07] text-white placeholder:text-white/35"
                : "bg-white text-black placeholder:text-black/35"
            }`}
          />

          <button
            onClick={addTask}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[20px] text-white shadow-[0_14px_35px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 active:scale-[0.98] sm:h-14 sm:w-14 sm:rounded-[22px]"
            style={{
              backgroundColor: themeColor,
            }}
          >
            <Send size={18} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "Submit insurance claim next week",
            "Buy birthday gift for mom",
            "Book dentist appointment",
          ].map((example) => (
            <button
              key={example}
              onClick={() => setNewTask(example)}
              className={`rounded-full border px-3 py-1.5 text-xs font-[650] transition hover:scale-[1.02] ${border} ${
                darkMode ? "text-white/50" : "text-black/50"
              }`}
            >
              {example}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.85fr]">
        <TaskListPanel
          title="Momentum Prioritized for You"
          description="Momentum lines up your tasks based on intent, urgency, and priority."
          tasks={prioritizedTasks}
          darkMode={darkMode}
          border={border}
          className={strongerGlass}
          themeColor={themeColor}
          toggleTaskById={toggleTaskById}
          deleteTask={deleteTask}
          acceptSuggestedDateById={acceptSuggestedDateById}
          setSelectedTask={setSelectedTask}
          setIsEditModalOpen={setIsEditModalOpen}
          emptyMessage="Add a task below. Momentum will organize it for you."
          ranked
        />

        <section
          className={`rounded-[28px] border p-5 sm:rounded-[36px] sm:p-6 ${strongerGlass} ${border}`}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-[800]">
              Momentum Assistant
              <Sparkles size={16} style={{ color: themeColor }} />
            </h2>

            <span
              className="rounded-full px-2 py-1 text-[10px] font-[800] text-white"
              style={{
                backgroundColor: themeColor,
              }}
            >
              BETA
            </span>
          </div>

          <p
            className={`mb-5 text-sm leading-6 ${
              darkMode ? "text-white/45" : "text-black/45"
            }`}
          >
            Momentum reviewed your task titles and arranged them so you can
            start with the most important work first.
          </p>

          <div className="space-y-4">
            <AssistantItem
              darkMode={darkMode}
              icon={<Calendar size={17} />}
              title="Tasks dated for you"
              description={`${suggestedDateCount} task${
                suggestedDateCount === 1 ? "" : "s"
              } have Momentum suggestions`}
              color="#8b5cf6"
            />

            <AssistantItem
              darkMode={darkMode}
              icon={<Lightbulb size={17} />}
              title="Focus suggestion"
              description={
                prioritizedTasks[0]
                  ? `Start with ${prioritizedTasks[0].title}`
                  : "Add a task and Momentum will suggest where to start"
              }
              color="#3b82f6"
            />

            <AssistantItem
              darkMode={darkMode}
              icon={<Target size={17} />}
              title="Priority check"
              description={`${highPriorityCount} high-priority item${
                highPriorityCount === 1 ? "" : "s"
              } currently need attention`}
              color="#ef4444"
            />
          </div>

          <button
            className={`mt-6 h-11 w-full rounded-2xl border text-sm font-[800] transition hover:scale-[1.01] ${border}`}
            style={{
              color: themeColor,
            }}
          >
            Review Momentum Suggestions
          </button>
        </section>
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
  deleteTask,
  acceptSuggestedDateById,
  setSelectedTask,
  setIsEditModalOpen,
  ranked = false,
}: any) {
  return (
    <section
      className={`rounded-[28px] border p-4 sm:rounded-[36px] sm:p-6 ${className} ${border}`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-[800]">
            {title}
            <Sparkles size={16} style={{ color: themeColor }} />
          </h2>

          <p
            className={`mt-1 text-xs ${
              darkMode ? "text-white/40" : "text-black/40"
            }`}
          >
            {description}
          </p>
        </div>

        <button
          className={`w-fit rounded-full px-3 py-1 text-xs font-[700] ${
            darkMode
              ? "bg-white/[0.06] text-white/55"
              : "bg-black/[0.04] text-black/55"
          }`}
        >
          Why this order?
        </button>
      </div>

      <div className="space-y-2">
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

        {tasks.map((task: any, index: number) => {
          const visibleDueDate = task.dueDate || task.suggestedDueDate;

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group flex min-h-[76px] flex-col items-start gap-3 rounded-[22px] border p-4 transition-all duration-200 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:gap-4 sm:rounded-[24px] ${border} ${getPriorityRowClass(
                task.priority,
                darkMode
              )} ${
                darkMode
                  ? "hover:shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
                  : "hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
              }`}
            >
              <div className="flex w-full min-w-0 items-start gap-3 sm:w-auto sm:flex-1 sm:items-center sm:gap-4">
                <button
                  onClick={(e) => toggleTaskById(task.id, e)}
                  className="mt-0.5 shrink-0 opacity-70 transition hover:opacity-100 sm:mt-0"
                >
                  <Circle
                    size={19}
                    className={darkMode ? "text-white/25" : "text-black/25"}
                  />
                </button>

                {ranked && (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-[800] text-white"
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
                    className="cursor-pointer text-[15px] font-[700] leading-5 tracking-[-0.015em] hover:opacity-70 sm:truncate"
                  >
                    {task.title}
                  </p>

                  <p
                    className={`mt-1.5 truncate text-[11px] font-[650] ${
                      darkMode ? "text-white/38" : "text-black/38"
                    }`}
                  >
                    {task.category} · {task.priority}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                <DateBadge
                  task={task}
                  visibleDueDate={visibleDueDate}
                  darkMode={darkMode}
                />

                {task.suggestedDueDate &&
                  !task.dueDate &&
                  acceptSuggestedDateById && (
                    <button
                      onClick={() => acceptSuggestedDateById(task.id)}
                      className={`rounded-full px-3 py-1 text-[11px] font-[800] transition hover:scale-[1.03] ${
                        darkMode
                          ? "bg-white/[0.06] text-white/55 hover:text-white"
                          : "bg-black/[0.04] text-black/55 hover:text-black"
                      }`}
                    >
                      Accept
                    </button>
                  )}

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-[800] ${getPriorityClass(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-35 transition hover:!opacity-100 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-35"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}
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
    <div className="mt-8">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-3">
          <h2
            className="text-[13px] font-[800] uppercase tracking-[0.14em]"
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
          className={`flex h-10 items-center gap-3 rounded-2xl px-4 text-sm font-[700] transition sm:px-5 ${
            completedToday.length === 0 ? "pointer-events-none opacity-30" : ""
          } ${glass}`}
        >
          Archive All
        </button>
      </div>

      <div className={`overflow-hidden rounded-3xl border ${strongerGlass} ${border}`}>
        {completedToday.length === 0 && (
          <div className="p-6 text-sm opacity-40">Nothing completed yet.</div>
        )}

        {completedToday.map((task: any) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex min-h-[72px] items-center justify-between gap-4 border-b px-4 py-3 last:border-none sm:px-5 ${border}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <CheckCircle2 size={18} className="shrink-0 text-green-500" />

              <div className="min-w-0">
                <p className="truncate text-[14px] font-[650]">{task.title}</p>

                <p className="truncate text-[11px] opacity-40">
                  {task.category}
                  {task.dueDate ? ` • Due ${formatDueDate(task.dueDate)}` : ""}
                </p>
              </div>
            </div>

            <button
              onClick={() => restoreCompletedTask(task.id)}
              className={`h-9 shrink-0 rounded-xl px-3 text-xs font-[800] transition hover:scale-[1.02] ${
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
  darkMode={archive.length < 0}
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

      <div className={`overflow-hidden rounded-3xl border ${strongerGlass} ${border}`}>
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

      <div className={`overflow-hidden rounded-3xl border ${strongerGlass} ${border}`}>
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
        <h2 className="text-[28px] font-[800] tracking-[-0.04em] sm:text-[32px]">
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
    className={`flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-[18px] border px-1.5 text-center transition-all duration-200 hover:-translate-y-0.5 sm:min-h-[96px] sm:flex-row sm:justify-start sm:gap-4 sm:rounded-[22px] sm:px-5 sm:text-left ${className} ${border}`}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] sm:h-10 sm:w-10 sm:rounded-2xl"
        style={{
          backgroundColor: themeColor,
        }}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[18px] font-[800] leading-none tracking-[-0.04em] sm:text-[24px]">
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
        <p className="text-sm font-[800]">{title}</p>
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

function DateBadge({ task, visibleDueDate, darkMode }: any) {
  if (visibleDueDate) {
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-[10px] font-[800] tracking-[-0.01em] ${
          task.dueDate
            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300"
        }`}
      >
        {task.dueDate
          ? `Due ${formatDueDate(task.dueDate)}`
          : `Momentum suggested ${formatDueDate(task.suggestedDueDate)}`}
      </span>
    );
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-[800] tracking-[-0.01em] ${
        darkMode
          ? "bg-white/[0.06] text-white/35"
          : "bg-black/[0.04] text-black/35"
      }`}
    >
      No date
    </span>
  );
}

function PlaceholderView({ selectedView, darkMode, border, className }: any) {
  const viewLabels: Record<string, string> = {
    goals: "Goals",
    routines: "Routines",
    calendar: "Calendar",
    review: "Review",
    insights: "Insights",
  };

  const descriptions: Record<string, string> = {
    goals: "Longer-term outcomes that your tasks can connect to.",
    routines: "Recurring systems like morning reset, workouts, and weekly review.",
    calendar: "A calendar-style view for due dates and focus blocks.",
    review: "Daily and weekly reflections to understand what moved forward.",
    insights: "Personal analytics for progress, consistency, and task patterns.",
  };

  const title = viewLabels[selectedView] || "Coming Soon";
  const description =
    descriptions[selectedView] || "This section will be built in the next phase.";

  return (
    <div>
      <PageHeader title={title} description={description} darkMode={darkMode} />

      <section className={`rounded-[28px] border p-8 shadow-sm ${className} ${border}`}>
        <p className={`text-sm ${darkMode ? "text-white/40" : "text-black/40"}`}>
          This view is connected in navigation. We will build it after the Today
          dashboard is stable.
        </p>
      </section>
    </div>
  );
}

function PrioritiesView({
  darkMode,
  border,
  className,
  themeColor,
  viewMode,
  setViewMode,
  highPriorityTasks,
  mediumPriorityTasks,
  lowPriorityTasks,
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
          <h2 className="text-[28px] font-[800] tracking-[-0.04em] sm:text-[32px]">
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
            className={`rounded-2xl border px-4 py-3 text-xs font-[800] ${className} ${border}`}
          >
            {totalTasks} active task{totalTasks === 1 ? "" : "s"}
          </div>

          <div className={`flex rounded-2xl border p-1 ${className} ${border}`}>
            <button
              onClick={() => setViewMode("cards")}
              className={`h-9 rounded-xl px-4 text-xs font-[800] transition ${
                viewMode === "cards"
                  ? "text-white"
                  : darkMode
                  ? "text-white/45 hover:text-white"
                  : "text-black/45 hover:text-black"
              }`}
              style={viewMode === "cards" ? { backgroundColor: themeColor } : undefined}
            >
              Cards
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`h-9 rounded-xl px-4 text-xs font-[800] transition ${
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

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {priorityGroups.map((group) => (
            <PriorityColumn
              key={group.key}
              {...group}
              darkMode={darkMode}
              border={border}
              className={className}
              toggleTaskById={toggleTaskById}
              deleteTask={deleteTask}
              setSelectedTask={setSelectedTask}
              setIsEditModalOpen={setIsEditModalOpen}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {priorityGroups.map((group) => (
            <PriorityListGroup
              key={group.key}
              {...group}
              darkMode={darkMode}
              border={border}
              className={className}
              toggleTaskById={toggleTaskById}
              deleteTask={deleteTask}
              setSelectedTask={setSelectedTask}
              setIsEditModalOpen={setIsEditModalOpen}
            />
          ))}
        </div>
      )}
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
            <h3 className="text-[15px] font-[800]">{title}</h3>
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
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-[800] ${getPriorityClass(task.priority)}`}>
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
            <h3 className="text-[15px] font-[800]">{title}</h3>
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
        description="Control how Momentum looks, suggests, and organizes your tasks."
        darkMode={darkMode}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SettingsCard
          title="Appearance"
          description="Choose how Momentum looks."
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
          description="Control how much Momentum helps organize new tasks."
          darkMode={darkMode}
          border={border}
          className={className}
        >
          <SettingsRow
            title="Suggested dates"
            description="Let Momentum suggest dates from task titles."
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
            description="Let Momentum classify new tasks as High, Medium, or Low."
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
              className={`h-10 rounded-xl px-4 text-xs font-[800] transition ${
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
            title="Reset Momentum"
            description="Delete active tasks, completed tasks, and archived items."
            darkMode={darkMode}
          >
            <button
              onClick={resetAppData}
              className="h-10 rounded-xl bg-red-500/10 px-4 text-xs font-[800] text-red-500 transition hover:scale-[1.02]"
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
        <h3 className="text-[16px] font-[800]">{title}</h3>

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
        <p className="text-sm font-[800]">{title}</p>

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
            className={`h-9 rounded-xl px-4 text-xs font-[800] transition ${
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
          <h2 className="text-[28px] font-[800] tracking-[-0.04em] sm:text-[32px]">
            Upcoming
          </h2>

          <p className={`mt-2 text-sm ${darkMode ? "text-white/45" : "text-black/45"}`}>
            Tasks grouped by manual due dates and Momentum-suggested dates.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div
            className={`rounded-2xl border px-4 py-3 text-xs font-[800] ${className} ${border}`}
          >
            {totalScheduled} scheduled task{totalScheduled === 1 ? "" : "s"}
          </div>

          <div className={`flex rounded-2xl border p-1 ${className} ${border}`}>
            <button
              onClick={() => setViewMode("calendar")}
              className={`h-9 rounded-xl px-4 text-xs font-[800] transition ${
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
              className={`h-9 rounded-xl px-4 text-xs font-[800] transition ${
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

                <h3 className="text-[15px] font-[800]">{day.title}</h3>
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
          className={`rounded-full px-2.5 py-1 text-[10px] font-[800] ${getPriorityClass(
            task.priority
          )}`}
        >
          {task.priority}
        </span>

        <DateBadge task={task} visibleDueDate={visibleDueDate} darkMode={darkMode} />

        {task.suggestedDueDate && !task.dueDate && acceptSuggestedDateById && (
          <button
            onClick={() => acceptSuggestedDateById(task.id)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-[800] transition hover:scale-[1.03] ${
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
            <h3 className="text-[15px] font-[800]">{title}</h3>
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
                  className={`mt-1.5 truncate text-[11px] font-[650] ${
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
                  className={`rounded-full px-3 py-1 text-[11px] font-[800] transition hover:scale-[1.03] ${
                    darkMode
                      ? "bg-white/[0.06] text-white/55 hover:text-white"
                      : "bg-black/[0.04] text-black/55 hover:text-black"
                  }`}
                >
                  Accept
                </button>
              )}

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-[800] ${getPriorityClass(
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
          <h2 className="text-[28px] font-[800] tracking-[-0.04em] sm:text-[32px]">
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
          className={`rounded-2xl border px-4 py-3 text-xs font-[800] ${className} ${border}`}
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

              <h3 className="text-[15px] font-[800]">Needs Review</h3>
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
              Momentum suggestion.
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
                  className={`rounded-full px-3 py-1 text-[11px] font-[800] ${getPriorityClass(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>

                {enableAppSuggestions && (
                  <>
                    <button
                      onClick={() => scheduleTaskById(task.id, getTodayDate())}
                      className={`h-9 rounded-xl px-3 text-xs font-[800] transition hover:scale-[1.02] ${
                        darkMode
                          ? "bg-white/[0.06] text-white/55 hover:text-white"
                          : "bg-black/[0.04] text-black/55 hover:text-black"
                      }`}
                    >
                      Today
                    </button>

                    <button
                      onClick={() => scheduleTaskById(task.id, getTomorrowDate())}
                      className={`h-9 rounded-xl px-3 text-xs font-[800] transition hover:scale-[1.02] ${
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
                  className="h-9 rounded-xl px-3 text-xs font-[800] text-white transition hover:scale-[1.02]"
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
      className={`fixed bottom-3 left-3 right-3 z-[160] grid grid-cols-5 rounded-[24px] border p-2 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl lg:hidden ${
        darkMode
        ? "border-white/[0.08] bg-[#111827]/90"
        : "border-black/[0.08] bg-white/95"
      }`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = selectedView === item.key;

        return (
          <button
            key={item.key}
            onClick={() => setSelectedView(item.key)}
            className={`relative flex flex-col items-center justify-center gap-1 rounded-[18px] py-2 text-[10px] font-[800] transition ${
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

function EditTaskModal({
  selectedTask,
  setSelectedTask,
  setIsEditModalOpen,
  saveTaskChanges,
  categories,
  themeColor,
  input,
  modalSelect,
  glass,
  strongerGlass,
  border,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-6"
      onClick={() => setIsEditModalOpen(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24, filter: "blur(12px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.92, y: 16, filter: "blur(8px)" }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[92vh] w-full max-w-[600px] overflow-y-auto rounded-[28px] border p-5 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-3xl sm:rounded-[36px] sm:p-6 ${strongerGlass} ${border}`}
      >
        <div className="mb-6">
          <h2 className="mb-1 text-[25px] font-[800] tracking-[-0.04em] sm:text-[28px]">
            Edit Task
          </h2>
          <p className="text-sm opacity-40">
            Manual changes always override Momentum suggestions.
          </p>
        </div>

        <div className="space-y-4">
          <input
            value={selectedTask.title}
            onChange={(e) =>
              setSelectedTask({ ...selectedTask, title: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTaskChanges(selectedTask);
            }}
            className={`h-12 w-full rounded-2xl px-4 outline-none ${input}`}
          />

          <select
            value={selectedTask.category}
            onChange={(e) =>
              setSelectedTask({ ...selectedTask, category: e.target.value })
            }
            className={`h-12 w-full rounded-2xl px-4 outline-none ${modalSelect}`}
          >
            {categories.map((category: any) => (
              <option key={category.id} value={category.title}>
                {category.title}
              </option>
            ))}
          </select>

          <select
            value={selectedTask.priority}
            onChange={(e) =>
              setSelectedTask({
                ...selectedTask,
                priority: e.target.value as Priority,
              })
            }
            className={`h-12 w-full rounded-2xl px-4 outline-none ${modalSelect}`}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <input
            type="date"
            value={selectedTask.dueDate || ""}
            onChange={(e) =>
              setSelectedTask({ ...selectedTask, dueDate: e.target.value })
            }
            className={`h-12 w-full rounded-2xl px-4 outline-none ${modalSelect}`}
          />

          {selectedTask.suggestedDueDate && (
            <div className={`rounded-2xl border p-4 text-sm ${border}`}>
              <p className="mb-1 font-[800]">Momentum suggestion</p>
              <p className="opacity-50">
                Suggested date: {formatDueDate(selectedTask.suggestedDueDate)}
              </p>
              <p className="mt-2 opacity-50">{selectedTask.aiReason}</p>
            </div>
          )}

<div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedTask(null);
              }}
              className={`h-12 flex-1 rounded-2xl font-[700] ${glass}`}
            >
              Cancel
            </button>

            <button
              onClick={() => saveTaskChanges(selectedTask)}
              className="h-12 flex-1 rounded-2xl font-[700] text-white"
              style={{ backgroundColor: themeColor }}
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}