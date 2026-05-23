"use client";

import {
  useEffect,
  useState,
  useRef,
} from "react";

import { Plus_Jakarta_Sans } from "next/font/google";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import Sidebar from "@/components/Sidebar";

import Toast from "@/components/Toast";

import FirecrackerLayer from "@/components/Firecracker";

import type {
  AppState,
  Category,
  Firecracker,
  Priority,
} from "@/types";

import {
  loadState,
  saveState,
} from "@/utils/storage";

import {
  CheckCircle2,
  Circle,
  LayoutGrid,
  Plus,
  Trash2,
} from "lucide-react";

/* ------------------------------------------------ */
/* Font */
/* ------------------------------------------------ */

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
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
/* Component */
/* ------------------------------------------------ */

export default function Home() {
  /* ------------------------------------------------ */
  /* State */
  /* ------------------------------------------------ */

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [archive, setArchive] =
    useState<any[]>([]);

  const [completedToday, setCompletedToday] =
    useState<any[]>([]);

  const [themeColor, setThemeColor] =
    useState("#A78BFA");

  const [darkMode, setDarkMode] =
    useState(false);

  const [showThemePicker, setShowThemePicker] =
    useState(false);

  const [showCategoryMenu, setShowCategoryMenu] =
    useState(false);

  const [showPriorityMenu, setShowPriorityMenu] =
    useState(false);

  const [selectedView, setSelectedView] =
    useState("current");

  const [archiveToast, setArchiveToast] =
    useState("");

  const [firecrackers, setFirecrackers] =
    useState<Firecracker[]>([]);

  const [newTask, setNewTask] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("");

  const [selectedPriority, setSelectedPriority] =
    useState<Priority>("Low");

  const [newCategory, setNewCategory] =
    useState("");

  const [editingTaskId, setEditingTaskId] =
    useState<string | null>(null);

  const [editingText, setEditingText] =
    useState("");

  const [editingPriorityId, setEditingPriorityId] =
    useState<string | null>(null);

  const [isLoaded, setIsLoaded] =
    useState(false);

  /* ------------------------------------------------ */
  /* Refs */
  /* ------------------------------------------------ */

  const categoryMenuRef =
    useRef<HTMLDivElement>(null);

    const priorityMenuRef =
    useRef<HTMLDivElement>(null);
  
  const themePickerRef =
    useRef<HTMLDivElement>(null);

  /* ------------------------------------------------ */
  /* Load State */
  /* ------------------------------------------------ */

  useEffect(() => {
    const saved = loadState();

    if (saved) {
      const parsed: any = saved;

      setCategories(parsed.categories);
      setDarkMode(parsed.darkMode);
      setThemeColor(parsed.themeColor);
      setArchive(parsed.archive);

      setCompletedToday(
        parsed.completedToday || []
      );

      if (
        parsed.categories &&
        parsed.categories.length > 0
      ) {
        setSelectedCategory(
          parsed.categories[0].title
        );
      }
    } else {
      setCategories(initialCategories);

      setSelectedCategory(
        initialCategories[0].title
      );
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
      archive,
      completedToday,
    } as any);
  }, [
    categories,
    darkMode,
    themeColor,
    archive,
    completedToday,
    isLoaded,
  ]);

  /* ------------------------------------------------ */
  /* Outside Click */
  /* ------------------------------------------------ */

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(
          event.target as Node
        )
      ) {
        setShowCategoryMenu(false);
      }

      if (
        priorityMenuRef.current &&
        !priorityMenuRef.current.contains(
          event.target as Node
        )
      ) {
        setShowPriorityMenu(false);
      }
      
      if (
        themePickerRef.current &&
        !themePickerRef.current.contains(
          event.target as Node
        )
      ) {
        setShowThemePicker(false);
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
  }, []);

  /* ------------------------------------------------ */
  /* Firecracker */
  /* ------------------------------------------------ */

  const triggerFirecracker = (
    x: number,
    y: number
  ) => {
    const id = crypto.randomUUID();

    setFirecrackers((prev) => [
      ...prev,
      { id, x, y },
    ]);

    setTimeout(() => {
      setFirecrackers((prev) =>
        prev.filter((f) => f.id !== id)
      );
    }, 1000);
  };

  /* ------------------------------------------------ */
  /* Add Task */
  /* ------------------------------------------------ */

  const addTask = () => {
    if (!newTask.trim()) return;

    setCategories((prev) =>
      prev.map((category) => {
        if (
          category.title ===
          selectedCategory
        ) {
          return {
            ...category,

            tasks: [
              {
                id: crypto.randomUUID(),
                title: newTask.trim(),
                priority:
                  selectedPriority,
                completed: false,
              },

              ...category.tasks,
            ],
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

  const toggleTask = (
    categoryIndex: number,
    taskIndex: number,
    e: React.MouseEvent
  ) => {
    const rect =
      e.currentTarget.getBoundingClientRect();

    triggerFirecracker(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );

    const task =
      categories[categoryIndex].tasks[
        taskIndex
      ];

    const completedTask = {
      ...task,

      completedAt:
        new Date().toISOString(),

      category:
        categories[categoryIndex].title,
    };

    setCompletedToday((prev) => [
      completedTask,
      ...prev,
    ]);

    setCategories((prev) =>
      prev.map((category, cIndex) => {
        if (
          cIndex !== categoryIndex
        )
          return category;

        return {
          ...category,

          tasks:
            category.tasks.filter(
              (_, tIndex) =>
                tIndex !== taskIndex
            ),
        };
      })
    );
  };

  /* ------------------------------------------------ */
  /* Edit Task */
  /* ------------------------------------------------ */

  const updateTaskTitle = (
    taskId: string,
    value: string
  ) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,

        tasks:
          category.tasks.map(
            (task) =>
              task.id ===
              taskId
                ? {
                    ...task,
                    title: value,
                  }
                : task
          ),
      }))
    );
  };

  const updateTaskPriority = (
    taskId: string,
    priority: Priority
  ) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,

        tasks:
          category.tasks.map(
            (task) =>
              task.id ===
              taskId
                ? {
                    ...task,
                    priority,
                  }
                : task
          ),
      }))
    );
  };

  const deleteTask = (
    taskId: string
  ) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,

        tasks:
          category.tasks.filter(
            (task) =>
              task.id !== taskId
          ),
      }))
    );
  };

  /* ------------------------------------------------ */
  /* Archive Completed Today */
  /* ------------------------------------------------ */

  const archiveCompletedToday = () => {
    if (completedToday.length === 0)
      return;

    setArchive((prev) => [
      ...completedToday,
      ...prev,
    ]);

    setCompletedToday([]);

    setArchiveToast(
      `${completedToday.length} completed item${
        completedToday.length > 1
          ? "s"
          : ""
      } archived`
    );

    setTimeout(() => {
      setArchiveToast("");
    }, 2200);
  };

  /* ------------------------------------------------ */
  /* Add Category */
  /* ------------------------------------------------ */

  const addCategory = () => {
    if (!newCategory.trim())
      return;

    const categoryToAdd: Category =
      {
        id: crypto.randomUUID(),

        title:
          newCategory.trim(),

        tasks: [],
      };

    setCategories((prev) => [
      ...prev,
      categoryToAdd,
    ]);

    setSelectedCategory(
      categoryToAdd.title
    );

    setNewCategory("");
  };

  /* ------------------------------------------------ */
  /* Theme Classes */
  /* ------------------------------------------------ */

  const glass = darkMode
    ? "bg-white/[0.05]"
    : "bg-white/75";

  const input = darkMode
    ? "bg-white/[0.06] text-white"
    : "bg-[#f7f7f5] text-black";

  const border = darkMode
    ? "border-white/[0.06]"
    : "border-black/[0.04]";

  /* ------------------------------------------------ */
  /* Loading */
  /* ------------------------------------------------ */

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-[#f5f5f3]" />
    );
  }

  return (
    <main
      className={`${jakarta.className} min-h-screen transition-colors duration-500 ${
        darkMode
          ? "bg-[#0f1115] text-white"
          : "bg-[#f5f5f3] text-black"
      }`}
    >
      <FirecrackerLayer
        firecrackers={
          firecrackers
        }
        themeColor={themeColor}
      />

      <Toast
        message={archiveToast}
        darkMode={darkMode}
      />

      <div className="flex">
      <Sidebar
  darkMode={darkMode}
  setDarkMode={setDarkMode}
  selectedView={selectedView}
  setSelectedView={setSelectedView}
  themeColor={themeColor}
  setThemeColor={setThemeColor}
  showThemePicker={showThemePicker}
  setShowThemePicker={setShowThemePicker}
  themePickerRef={themePickerRef}
/>

        <div className="flex-1 px-8 py-8">
          {/* Current View */}
          {selectedView ===
            "current" && (
            <>
              {/* Quick Add */}
             {/* Quick Add */}
<div
  className={`p-4 rounded-3xl mb-8 ${glass}`}
>
  <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_180px_120px] gap-3">
    {/* Task Input */}
    <input
      value={newTask}
      onChange={(e) =>
        setNewTask(
          e.target.value
        )
      }
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          addTask();
        }
      }}
      placeholder="What do you want to get done?"
      className={`h-11 px-4 rounded-2xl outline-none transition-all ${input}`}
    />

    {/* Category Selector */}
    <div
      className="relative"
      ref={categoryMenuRef}
    >
      <button
        onClick={() => {
          setShowPriorityMenu(
            false
          );

          setShowCategoryMenu(
            !showCategoryMenu
          );
        }}
        className={`h-11 w-full px-4 rounded-2xl flex items-center justify-between transition-all ${input}`}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor:
                themeColor,
            }}
          />

          <span className="text-sm font-[500]">
            {selectedCategory}
          </span>
        </div>

        <span className="opacity-40 text-xs">
          ▼
        </span>
      </button>

      <AnimatePresence>
        {showCategoryMenu && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -8,
              scale: 0.96,
            }}
            transition={{
              duration: 0.18,
            }}
            className={`absolute top-14 left-0 w-full rounded-3xl p-2 z-50 backdrop-blur-2xl border shadow-[0_10px_40px_rgba(0,0,0,0.16)] ${glass} ${border}`}
          >
            {categories.map(
              (category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(
                      category.title
                    );

                    setShowCategoryMenu(
                      false
                    );
                  }}
                  className={`w-full h-11 px-4 rounded-2xl flex items-center justify-between text-left transition ${
                    selectedCategory ===
                    category.title
                      ? "bg-white/10"
                      : "hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          themeColor,
                      }}
                    />

                    <span className="text-sm font-[500]">
                      {
                        category.title
                      }
                    </span>
                  </div>

                  {selectedCategory ===
                    category.title && (
                    <span>
                      ✓
                    </span>
                  )}
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Priority Selector */}
    <div
      className="relative"
      ref={priorityMenuRef}
    >
      <button
        onClick={() => {
          setShowCategoryMenu(
            false
          );

          setShowPriorityMenu(
            !showPriorityMenu
          );
        }}
        className={`h-11 w-full px-4 rounded-2xl flex items-center justify-between transition-all ${input}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              selectedPriority ===
              "High"
                ? "bg-red-500"
                : selectedPriority ===
                  "Medium"
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
          />

          <span className="text-sm font-[500]">
            {selectedPriority}
          </span>
        </div>

        <span className="opacity-40 text-xs">
          ▼
        </span>
      </button>

      <AnimatePresence>
        {showPriorityMenu && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -8,
              scale: 0.96,
            }}
            transition={{
              duration: 0.18,
            }}
            className={`absolute top-14 left-0 w-full rounded-3xl p-2 z-50 backdrop-blur-2xl border shadow-[0_10px_40px_rgba(0,0,0,0.16)] ${glass} ${border}`}
          >
            {[
              "Low",
              "Medium",
              "High",
            ].map((priority) => (
              <button
                key={priority}
                onClick={() => {
                  setSelectedPriority(
                    priority as Priority
                  );

                  setShowPriorityMenu(
                    false
                  );
                }}
                className={`w-full h-11 px-4 rounded-2xl flex items-center justify-between text-left transition ${
                  selectedPriority ===
                  priority
                    ? "bg-white/10"
                    : "hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      priority ===
                      "High"
                        ? "bg-red-500"
                        : priority ===
                          "Medium"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />

                  <span className="text-sm font-[500]">
                    {priority}
                  </span>
                </div>

                {selectedPriority ===
                  priority && (
                  <span>
                    ✓
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Add Button */}
    <button
      onClick={addTask}
      className="h-11 rounded-2xl text-white font-[600] transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        backgroundColor:
          themeColor,
      }}
    >
      Add
    </button>
  </div>
</div>

              {/* Categories */}
              <div className="space-y-8">
                {categories.map(
                  (
                    category,
                    categoryIndex
                  ) => (
                    <div
                      key={category.id}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <h2
                          className="text-[13px] uppercase tracking-[0.14em] font-[700]"
                          style={{
                            color:
                              themeColor,
                          }}
                        >
                          {
                            category.title
                          }
                        </h2>

                        <div
                          className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center"
                          style={{
                            backgroundColor:
                              themeColor,
                          }}
                        >
                          {
                            category.tasks
                              .length
                          }
                        </div>
                      </div>

                      <div
                        className={`rounded-3xl overflow-hidden ${glass}`}
                      >
                        {category.tasks.map(
                          (
                            task,
                            taskIndex
                          ) => (
                            <motion.div
                              key={
                                task.id
                              }
                              className={`h-[60px] px-5 flex items-center justify-between border-b last:border-none ${border}`}
                            >
                              {/* Left */}
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={(
                                    e
                                  ) =>
                                    toggleTask(
                                      categoryIndex,
                                      taskIndex,
                                      e
                                    )
                                  }
                                >
                                  <Circle
                                    size={
                                      20
                                    }
                                    className={
                                      darkMode
                                        ? "text-white/20"
                                        : "text-gray-300"
                                    }
                                  />
                                </button>

                                {editingTaskId ===
                                task.id ? (
                                  <input
                                    autoFocus
                                    value={
                                      editingText
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      setEditingText(
                                        e
                                          .target
                                          .value
                                      )
                                    }
                                    onBlur={() => {
                                      updateTaskTitle(
                                        task.id,
                                        editingText
                                      );

                                      setEditingTaskId(
                                        null
                                      );
                                    }}
                                    onKeyDown={(
                                      e
                                    ) => {
                                      if (
                                        e.key ===
                                        "Enter"
                                      ) {
                                        updateTaskTitle(
                                          task.id,
                                          editingText
                                        );

                                        setEditingTaskId(
                                          null
                                        );
                                      }

                                      if (
                                        e.key ===
                                        "Escape"
                                      ) {
                                        setEditingTaskId(
                                          null
                                        );
                                      }
                                    }}
                                    className="bg-transparent outline-none text-[14px] font-[500]"
                                  />
                                ) : (
                                  <p
                                    onClick={() => {
                                      setEditingTaskId(
                                        task.id
                                      );

                                      setEditingText(
                                        task.title
                                      );
                                    }}
                                    className="text-[14px] font-[500] cursor-text"
                                  >
                                    {
                                      task.title
                                    }
                                  </p>
                                )}
                              </div>

                              {/* Right */}
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setEditingPriorityId(
                                        editingPriorityId ===
                                          task.id
                                          ? null
                                          : task.id
                                      )
                                    }
                                    className={`text-xs px-3 py-1 rounded-full font-[600] ${
                                      task.priority ===
                                      "High"
                                        ? "bg-red-50 text-red-500"
                                        : task.priority ===
                                          "Medium"
                                        ? "bg-amber-50 text-amber-600"
                                        : "bg-emerald-50 text-emerald-600"
                                    }`}
                                  >
                                    {
                                      task.priority
                                    }
                                  </button>

                                  <AnimatePresence>
                                    {editingPriorityId ===
                                      task.id && (
                                      <motion.div
                                        initial={{
                                          opacity: 0,
                                          y: -6,
                                          scale: 0.96,
                                        }}
                                        animate={{
                                          opacity: 1,
                                          y: 0,
                                          scale: 1,
                                        }}
                                        exit={{
                                          opacity: 0,
                                          y: -6,
                                          scale: 0.96,
                                        }}
                                        className={`absolute top-10 right-0 w-[120px] p-2 rounded-2xl backdrop-blur-2xl border z-50 ${glass} ${border}`}
                                      >
                                        {[
                                          "Low",
                                          "Medium",
                                          "High",
                                        ].map(
                                          (
                                            priority
                                          ) => (
                                            <button
                                              key={
                                                priority
                                              }
                                              onClick={() => {
                                                updateTaskPriority(
                                                  task.id,
                                                  priority as Priority
                                                );

                                                setEditingPriorityId(
                                                  null
                                                );
                                              }}
                                              className="w-full h-9 rounded-xl text-sm hover:bg-white/[0.06]"
                                            >
                                              {
                                                priority
                                              }
                                            </button>
                                          )
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                <button
                                  onClick={() =>
                                    deleteTask(
                                      task.id
                                    )
                                  }
                                  className="opacity-30 hover:opacity-100 transition"
                                >
                                  <Trash2
                                    size={
                                      16
                                    }
                                  />
                                </button>
                              </div>
                            </motion.div>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Completed Today */}
              <div className="mt-14">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2
                      className="text-[13px] uppercase tracking-[0.14em] font-[700]"
                      style={{
                        color:
                          themeColor,
                      }}
                    >
                      Completed Today
                    </h2>

                    <div
                      className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center"
                      style={{
                        backgroundColor:
                          themeColor,
                      }}
                    >
                      {
                        completedToday.length
                      }
                    </div>
                  </div>

                  <button
                    onClick={
                      archiveCompletedToday
                    }
                    className={`h-10 px-5 rounded-2xl flex items-center gap-3 text-sm font-[600] transition ${
                      completedToday.length ===
                      0
                        ? "opacity-30 pointer-events-none"
                        : ""
                    } ${glass}`}
                  >
                    Archive All
                  </button>
                </div>

                <div
                  className={`rounded-3xl overflow-hidden ${glass}`}
                >
                  {completedToday.length ===
                    0 && (
                    <div className="p-6 text-sm opacity-40">
                      Nothing completed
                      yet.
                    </div>
                  )}

                  {completedToday.map(
                    (task) => (
                      <motion.div
                        key={
                          task.id
                        }
                        initial={{
                          opacity: 0,
                          y: 10,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className={`h-[60px] px-5 flex items-center justify-between border-b last:border-none ${border}`}
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2
                            size={18}
                            className="text-green-500"
                          />

                          <div>
                            <p className="text-[14px] font-[500]">
                              {
                                task.title
                              }
                            </p>

                            <p className="text-[11px] opacity-40">
                              {
                                task.category
                              }
                            </p>
                          </div>
                        </div>

                        <div className="text-xs opacity-40">
                          Done
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              </div>
            </>
          )}

          {/* Archive View */}
          {selectedView ===
            "archive" && (
            <div>
              <h2 className="text-[32px] font-[700] mb-8">
                Archived Items
              </h2>

              <div
                className={`rounded-3xl overflow-hidden ${glass}`}
              >
                {archive.length ===
                  0 && (
                  <div className="p-10 opacity-50 text-sm">
                    No archived items
                    yet.
                  </div>
                )}

                {archive.map(
                  (task) => (
                    <div
                      key={
                        task.id
                      }
                      className={`min-h-[88px] px-6 py-4 flex items-center justify-between border-b last:border-none ${border}`}
                    >
                      <div>
                        <p className="text-[15px] font-[600] mb-1">
                          {
                            task.title
                          }
                        </p>

                        <div className="flex items-center gap-3 text-xs opacity-50">
                          <span>
                            {
                              task.category
                            }
                          </span>

                          <span>
                            {new Date(
                              task.completedAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs opacity-40">
                        Archived
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Categories View */}
          {selectedView ===
            "categories" && (
            <div>
              <h2 className="text-[32px] font-[700] mb-8">
                Categories
              </h2>

              <div
                className={`p-5 rounded-3xl mb-8 ${glass}`}
              >
                <div className="flex gap-3">
                  <input
                    value={
                      newCategory
                    }
                    onChange={(
                      e
                    ) =>
                      setNewCategory(
                        e.target
                          .value
                      )
                    }
                    placeholder="Create new category"
                    className={`flex-1 h-12 px-4 rounded-2xl outline-none ${input}`}
                  />

                  <button
                    onClick={
                      addCategory
                    }
                    className="h-12 px-5 rounded-2xl text-white flex items-center gap-2"
                    style={{
                      backgroundColor:
                        themeColor,
                    }}
                  >
                    <Plus
                      size={18}
                    />

                    Add
                  </button>
                </div>
              </div>

              <div
                className={`rounded-3xl overflow-hidden ${glass}`}
              >
                {categories.map(
                  (
                    category
                  ) => (
                    <div
                      key={
                        category.id
                      }
                      className={`h-[72px] px-6 flex items-center justify-between border-b last:border-none ${border}`}
                    >
                      <div className="flex items-center gap-4">
                        <LayoutGrid
                          size={18}
                        />

                        <p className="text-[15px] font-[600]">
                          {
                            category.title
                          }
                        </p>
                      </div>

                      <div className="text-sm opacity-50">
                        {
                          category
                            .tasks
                            .length
                        }{" "}
                        tasks
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}