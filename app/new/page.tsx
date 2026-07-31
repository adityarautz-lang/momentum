"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Focus,
  GripVertical,
  Layers3,
  ListChecks,
  Menu,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

import styles from "./landing.module.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const HERO_TASK = "Prepare the quarterly client review";

const CLIPBOARD_SOURCE =
  "Please send the revised budget by Thursday, book the vendor review, and follow up with Maya next week.";

const CLIPBOARD_TASKS = [
  {
    title: "Send the revised budget",
    meta: "High priority - Thursday",
  },
  {
    title: "Book the vendor review",
    meta: "Medium priority - Tomorrow",
  },
  {
    title: "Follow up with Maya",
    meta: "Medium priority - Next week",
  },
];

const FOCUS_TASKS = [
  {
    title: "Send revised client budget",
    reason: "Deadline and external dependency",
    priority: "High",
  },
  {
    title: "Review launch risks",
    reason: "Could block the release",
    priority: "High",
  },
  {
    title: "Book vendor review",
    reason: "Depends on another person's availability",
    priority: "Medium",
  },
];

const PRODUCT_MODULES = [
  {
    icon: Sparkles,
    title: "Smart task assistance",
    description:
      "Turn a rough task into a useful first draft with priority, timing, category, and context.",
  },
  {
    icon: ClipboardCheck,
    title: "Clipboard Assist",
    description:
      "Detect actionable work inside copied messages, emails, and notes before anything is added.",
  },
  {
    icon: Target,
    title: "Focus stack",
    description:
      "Surface the strongest next moves using urgency, impact, dependencies, and the time left today.",
  },
  {
    icon: TrendingUp,
    title: "Progress intelligence",
    description:
      "See completion patterns, useful momentum, and where your time is actually going.",
  },
  {
    icon: Layers3,
    title: "Tasks and backlog",
    description:
      "Keep current commitments visible while moving non-active work out of the way without losing it.",
  },
  {
    icon: ShieldCheck,
    title: "You stay in control",
    description:
      "Every AI suggestion remains editable. Momentuhm prepares the draft; you make the decision.",
  },
];

type DemoControllerOptions = {
  stepCount: number;
  durations: number[];
  initialStep?: number;
  finalStep?: number;
  threshold?: number;
};

function useDemoController({
  stepCount,
  durations,
  initialStep = 0,
  finalStep = stepCount - 1,
  threshold = 0.3,
}: DemoControllerOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(containerRef, {
    amount: threshold,
    margin: "-8% 0px -8% 0px",
  });
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [step, setStep] = useState(
    prefersReducedMotion ? finalStep : initialStep
  );
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setStep(finalStep);
      return;
    }

    if (inView && !wasVisibleRef.current) {
      setStep(initialStep);
    }

    wasVisibleRef.current = inView;
  }, [finalStep, inView, initialStep, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion || !inView) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setStep((currentStep) => (currentStep + 1) % stepCount);
    }, durations[step] ?? 1200);

    return () => window.clearTimeout(timeout);
  }, [durations, inView, prefersReducedMotion, step, stepCount]);

  return {
    containerRef,
    step,
    prefersReducedMotion,
  };
}

function useTypewriter(
  text: string,
  active: boolean,
  speed = 34
) {
  const [typedText, setTypedText] = useState(active ? "" : text);

  useEffect(() => {
    if (!active) {
      setTypedText("");
      return;
    }

    let index = 0;
    setTypedText("");

    const interval = window.setInterval(() => {
      index += 1;
      setTypedText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(interval);
      }
    }, speed);

    return () => window.clearInterval(interval);
  }, [active, speed, text]);

  return typedText;
}

function LogoMark() {
  return (
    <span className={styles.logoMark} aria-hidden="true">
      <span className={styles.logoMarkInner}>
        <Zap size={15} strokeWidth={2.2} />
      </span>
    </span>
  );
}

function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="Momentuhm home">
      <LogoMark />
      <span>Momentuhm</span>
    </Link>
  );
}

function DemoWindow({
  children,
  label = "Live product preview",
  className = "",
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`${styles.demoWindow} ${className}`}>
      <div className={styles.demoWindowTopbar}>
        <div className={styles.windowDots} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className={styles.windowLabel}>
          <span className={styles.liveDot} />
          {label}
        </div>
        <div className={styles.windowStatus}>Momentuhm</div>
      </div>
      {children}
    </div>
  );
}

function MiniPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "violet" | "red" | "orange" | "green" | "blue";
}) {
  return (
    <span className={`${styles.miniPill} ${styles[`miniPill_${tone}`]}`}>
      {children}
    </span>
  );
}

function HeroProductDemo() {
  const durations = useMemo(
    () => [650, 1850, 900, 850, 1200, 1850],
    []
  );
  const { containerRef, step, prefersReducedMotion } = useDemoController({
    stepCount: 6,
    durations,
    finalStep: 5,
    threshold: 0.2,
  });

  const typingActive = step >= 1 || prefersReducedMotion;
  const typedTask = useTypewriter(
    HERO_TASK,
    typingActive,
    prefersReducedMotion ? 1 : 31
  );

  const showThinking = step === 2;
  const showSuggestions = step >= 3 || prefersReducedMotion;
  const showTask = step >= 4 || prefersReducedMotion;
  const showFocus = step >= 5 || prefersReducedMotion;

  return (
    <div ref={containerRef} className={styles.heroDemoWrap}>
      <div className={styles.heroDemoGlow} aria-hidden="true" />
      <DemoWindow label="Demo" className={styles.heroWindow}>
        <div className={styles.heroAppShell}>
          <aside className={styles.heroSidebar}>
            <div className={styles.sidebarBrandLine}>
              <LogoMark />
              <span>Momentuhm</span>
            </div>

            <div className={styles.sidebarNav}>
              <div className={`${styles.sidebarItem} ${styles.sidebarItemActive}`}>
                <ListChecks size={15} />
                Today
              </div>
              <div className={styles.sidebarItem}>
                <Target size={15} />
                Focus
              </div>
              <div className={styles.sidebarItem}>
                <CalendarDays size={15} />
                Upcoming
              </div>
            </div>

            <div className={styles.sidebarSpacer} />
            <div className={styles.sidebarHint}>
              <Sparkles size={14} />
              AI suggestions are editable
            </div>
          </aside>

          <div className={styles.heroWorkspace}>
            <div className={styles.workspaceHeader}>
              <div>
                <p className={styles.workspaceEyebrow}>Friday, Jul 31</p>
                <h3>Good evening.</h3>
                <p>One clear step at a time.</p>
              </div>

              <div className={styles.heroMetrics}>
                <div>
                  <strong>5</strong>
                  <span>Tasks</span>
                </div>
                <div>
                  <strong>2</strong>
                  <span>Done</span>
                </div>
                <div>
                  <strong>40%</strong>
                  <span>Progress</span>
                </div>
              </div>
            </div>

            <div className={styles.heroColumns}>
              <section className={styles.planningColumn}>
                <div className={styles.captureBox}>
                  <button type="button" tabIndex={-1} aria-hidden="true">
                    <Plus size={17} />
                  </button>
                  <div className={styles.captureText}>
                    {typedTask || (
                      <span className={styles.placeholderText}>
                        Add a task. Momentuhm will organize it.
                      </span>
                    )}
                    {typingActive && typedTask.length < HERO_TASK.length && (
                      <span className={styles.typingCaret} />
                    )}
                  </div>
                  <Sparkles size={16} className={styles.captureSparkle} />
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {showThinking && (
                    <motion.div
                      key="thinking"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={styles.thinkingRow}
                    >
                      <span className={styles.thinkingOrb}>
                        <Sparkles size={13} />
                      </span>
                      <span>Momentuhm is organizing this task...</span>
                      <span className={styles.thinkingDots}>
                        <i />
                        <i />
                        <i />
                      </span>
                    </motion.div>
                  )}

                  {showSuggestions && !showTask && (
                    <motion.div
                      key="suggestions"
                      initial={{ opacity: 0, y: 10, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={styles.suggestionPanel}
                    >
                      <div className={styles.suggestionHeader}>
                        <span>
                          <Sparkles size={13} />
                          Suggested structure
                        </span>
                        <MiniPill tone="violet">AI draft</MiniPill>
                      </div>

                      <div className={styles.suggestionGrid}>
                        <div>
                          <span>Priority</span>
                          <strong>High</strong>
                        </div>
                        <div>
                          <span>Due</span>
                          <strong>Tomorrow</strong>
                        </div>
                        <div>
                          <span>Category</span>
                          <strong>Project Delivery</strong>
                        </div>
                      </div>

                      <p>
                        Completing this early keeps the client decision from
                        being blocked.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={styles.taskPanel}>
                  <div className={styles.taskPanelHeader}>
                    <div>
                      <strong>Tasks</strong>
                      <span>4 active</span>
                    </div>
                    <MiniPill>Sorted by date</MiniPill>
                  </div>

                  <AnimatePresence initial={false}>
                    {showTask && (
                      <motion.div
                        key="hero-new-task"
                        initial={{ opacity: 0, y: -10, backgroundColor: "#f3edff" }}
                        animate={{ opacity: 1, y: 0, backgroundColor: "#ffffff" }}
                        transition={{ duration: 0.55 }}
                        className={styles.taskRow}
                      >
                        <span className={styles.taskCheckbox} />
                        <div className={styles.taskContent}>
                          <strong>{HERO_TASK}</strong>
                          <span>Product / Project Delivery</span>
                        </div>
                        <MiniPill tone="red">High</MiniPill>
                        <span className={styles.taskDue}>Tomorrow</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={`${styles.taskRow} ${styles.taskRowMuted}`}>
                    <span className={styles.taskCheckbox} />
                    <div className={styles.taskContent}>
                      <strong>Review launch risks</strong>
                      <span>Planning & Prioritization</span>
                    </div>
                    <MiniPill tone="orange">Medium</MiniPill>
                    <span className={styles.taskDue}>Today</span>
                  </div>

                  <div className={`${styles.taskRow} ${styles.taskRowMuted}`}>
                    <span className={styles.taskCheckbox} />
                    <div className={styles.taskContent}>
                      <strong>Send revised client budget</strong>
                      <span>Communication & Follow-ups</span>
                    </div>
                    <MiniPill tone="red">High</MiniPill>
                    <span className={styles.taskDue}>Today</span>
                  </div>
                </div>
              </section>

              <aside className={styles.focusColumn}>
                <div className={styles.focusHeader}>
                  <span className={styles.focusIcon}>
                    <Target size={16} />
                  </span>
                  <div>
                    <p>AI Focus</p>
                    <h4>Your strongest next moves</h4>
                  </div>
                </div>

                <div className={styles.focusStack}>
                  <AnimatePresence initial={false}>
                    {showFocus && (
                      <motion.div
                        key="focus-added"
                        initial={{ opacity: 0, x: 18, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        className={`${styles.focusTask} ${styles.focusTaskActive}`}
                      >
                        <span className={styles.focusNumber}>1</span>
                        <div>
                          <strong>{HERO_TASK}</strong>
                          <span>Client decision dependency</span>
                        </div>
                        <ChevronRight size={15} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={styles.focusTask}>
                    <span className={styles.focusNumber}>{showFocus ? 2 : 1}</span>
                    <div>
                      <strong>Send revised client budget</strong>
                      <span>Deadline and external dependency</span>
                    </div>
                    <ChevronRight size={15} />
                  </div>

                  <div className={styles.focusTask}>
                    <span className={styles.focusNumber}>{showFocus ? 3 : 2}</span>
                    <div>
                      <strong>Review launch risks</strong>
                      <span>Could block the release</span>
                    </div>
                    <ChevronRight size={15} />
                  </div>
                </div>

                <div className={styles.dayCard}>
                  <div>
                    <Clock3 size={15} />
                    <span>Time left today</span>
                  </div>
                  <strong>1h 45m</strong>
                  <div className={styles.dayProgress}>
                    <span />
                  </div>
                  <p>Keep the stack intentionally small.</p>
                </div>
              </aside>
            </div>
          </div>
        </div>
        </DemoWindow>

        <div className={styles.demoFlow} aria-label="Momentuhm planning flow">
  <div className={styles.demoFlowItem}>
    <span className={styles.demoFlowIcon}>
      <Sparkles size={15} />
    </span>

    <div>
      <strong>Structure</strong>
      <small>Priority, date and context</small>
    </div>
  </div>

  <span className={styles.demoFlowArrow} aria-hidden="true">
    →
  </span>

  <div className={styles.demoFlowItem}>
    <span className={styles.demoFlowIcon}>
      <Target size={15} />
    </span>

    <div>
      <strong>Focus</strong>
      <small>The strongest next moves</small>
    </div>
  </div>

  <span className={styles.demoFlowArrow} aria-hidden="true">
    →
  </span>

  <div className={styles.demoFlowItem}>
    <span className={styles.demoFlowIcon}>
      <TrendingUp size={15} />
    </span>

    <div>
      <strong>Progress</strong>
      <small>Updates as work is completed</small>
    </div>
  </div>
</div>

<div className={styles.demoCaption}>
  <span className={styles.liveDot} />
  Live interface demonstration
</div>
    </div>
  );
}

function SmartAssistDemo() {
  const durations = useMemo(() => [700, 1750, 850, 1700], []);
  const { containerRef, step, prefersReducedMotion } = useDemoController({
    stepCount: 4,
    durations,
    finalStep: 3,
  });
  const typing = step >= 1 || prefersReducedMotion;
  const typedTask = useTypewriter(
    HERO_TASK,
    typing,
    prefersReducedMotion ? 1 : 30
  );
  const showAnalysis = step === 2;
  const showResult = step >= 3 || prefersReducedMotion;

  return (
    <div ref={containerRef} className={styles.featureDemo}>
      <div className={styles.miniCapture}>
        <span className={styles.capturePlus}>
          <Plus size={16} />
        </span>
        <span className={styles.miniCaptureText}>
          {typedTask || "Add a task..."}
          {typing && typedTask.length < HERO_TASK.length && (
            <span className={styles.typingCaret} />
          )}
        </span>
        <Sparkles size={15} />
      </div>

      <div className={styles.miniDemoStage}>
        <AnimatePresence mode="wait" initial={false}>
          {showAnalysis && (
            <motion.div
              key="smart-thinking"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={styles.smartThinking}
            >
              <span className={styles.thinkingOrb}>
                <Sparkles size={12} />
              </span>
              Momentuhm is finding useful structure...
            </motion.div>
          )}

          {showResult && (
            <motion.div
              key="smart-result"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={styles.smartResult}
            >
              <div className={styles.smartResultHeader}>
                <span>Suggested details</span>
                <MiniPill tone="violet">Editable</MiniPill>
              </div>
              <div className={styles.smartResultRows}>
                <div>
                  <span>Priority</span>
                  <MiniPill tone="red">High</MiniPill>
                </div>
                <div>
                  <span>Due date</span>
                  <strong>Tomorrow</strong>
                </div>
                <div>
                  <span>Category</span>
                  <strong>Project Delivery</strong>
                </div>
              </div>
              <p>Completing this early keeps the client decision moving.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ClipboardAssistDemo() {
  const durations = useMemo(() => [850, 1100, 1300, 1650], []);
  const { containerRef, step, prefersReducedMotion } = useDemoController({
    stepCount: 4,
    durations,
    finalStep: 3,
  });
  const showSource = step >= 1 || prefersReducedMotion;
  const showTasks = step >= 2 || prefersReducedMotion;
  const showGrouped = step >= 3 || prefersReducedMotion;

  return (
    <div ref={containerRef} className={styles.featureDemo}>
      <div className={styles.clipboardHeader}>
        <span className={styles.featureDemoIcon}>
          <ClipboardCheck size={16} />
        </span>
        <div>
          <strong>Clipboard Assist</strong>
          <span>{showTasks ? "3 possible tasks found" : "Watching for useful copied text"}</span>
        </div>
        <MiniPill tone="violet">Preview</MiniPill>
      </div>

      <AnimatePresence initial={false}>
        {showSource && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={styles.clipboardSource}
          >
            <span>Copied text</span>
            <p>{CLIPBOARD_SOURCE}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.clipboardTasks}>
        <AnimatePresence initial={false}>
          {showTasks &&
            CLIPBOARD_TASKS.map((task, index) => (
              <motion.div
                key={task.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.09 }}
                className={styles.clipboardTask}
              >
                <span className={styles.selectedCheckbox}>
                  <Check size={11} />
                </span>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.meta}</span>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {showGrouped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.groupResult}
          >
            <div>
              <Layers3 size={15} />
              <span>
                <strong>Client follow-up bundle</strong>
                <small>Created with 3 subtasks</small>
              </span>
            </div>
            <CheckCircle2 size={18} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FocusStackDemo() {
  const durations = useMemo(() => [900, 900, 900, 1500], []);
  const { containerRef, step, prefersReducedMotion } = useDemoController({
    stepCount: 4,
    durations,
    finalStep: 3,
  });
  const visibleCount = prefersReducedMotion ? 3 : Math.min(step, 3);

  return (
    <div ref={containerRef} className={styles.featureDemo}>
      <div className={styles.focusDemoTop}>
        <div>
          <span className={styles.featureDemoIcon}>
            <Target size={16} />
          </span>
          <div>
            <strong>Focus stack</strong>
            <span>Keep the day intentionally small</span>
          </div>
        </div>
        <MiniPill>{visibleCount}/3</MiniPill>
      </div>

      <div className={styles.focusDemoList}>
        <AnimatePresence initial={false}>
          {FOCUS_TASKS.slice(0, visibleCount).map((task, index) => (
            <motion.div
              layout
              key={task.title}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className={styles.focusDemoTask}
            >
              <GripVertical size={14} className={styles.grip} />
              <span className={styles.focusRank}>{index + 1}</span>
              <div>
                <strong>{task.title}</strong>
                <span>{task.reason}</span>
              </div>
              <MiniPill tone={task.priority === "High" ? "red" : "orange"}>
                {task.priority}
              </MiniPill>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className={styles.focusDemoFooter}>
        <BrainCircuit size={15} />
        <p>
          Ranked using impact, urgency, dependencies, and remaining time.
        </p>
      </div>
    </div>
  );
}

function ProgressDemo() {
  const durations = useMemo(() => [900, 900, 900, 1700], []);
  const { containerRef, step, prefersReducedMotion } = useDemoController({
    stepCount: 4,
    durations,
    finalStep: 3,
  });
  const completed = prefersReducedMotion ? 4 : Math.min(step + 1, 4);
  const total = 5;
  const percentage = Math.round((completed / total) * 100);

  return (
    <div ref={containerRef} className={styles.featureDemo}>
      <div className={styles.progressMetrics}>
        <div>
          <span>Tasks</span>
          <strong>5</strong>
        </div>
        <div>
          <span>Completed</span>
          <motion.strong key={completed} initial={{ y: 6 }} animate={{ y: 0 }}>
            {completed}
          </motion.strong>
        </div>
        <div>
          <span>Progress</span>
          <motion.strong key={percentage} initial={{ y: 6 }} animate={{ y: 0 }}>
            {percentage}%
          </motion.strong>
        </div>
      </div>

      <div className={styles.progressBarLarge}>
        <motion.span
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className={styles.completionList}>
        {["Send revised budget", "Review launch risks", "Confirm launch owner", "Book vendor review"].map(
          (task, index) => {
            const isDone = index < completed;

            return (
              <motion.div
                key={task}
                animate={{ opacity: isDone ? 1 : 0.46 }}
                className={styles.completionRow}
              >
                <span className={isDone ? styles.doneCheckbox : styles.emptyCheckbox}>
                  {isDone && <Check size={11} />}
                </span>
                <span className={isDone ? styles.completedText : ""}>{task}</span>
                {isDone && <small>Done</small>}
              </motion.div>
            );
          }
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={completed}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.momentumMessage}
        >
          <TrendingUp size={15} />
          <span>
            {percentage >= 80
              ? "Excellent momentum. Finish strong."
              : percentage >= 60
              ? "Great progress. Keep moving."
              : "A clear start is already progress."}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FeatureCard({
  number,
  eyebrow,
  title,
  description,
  children,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <article className={styles.featureCard}>
      <div className={styles.featureCardCopy}>
        <div className={styles.featureCardMeta}>
          <span>{number}</span>
          <p>{eyebrow}</p>
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className={styles.featureCardDemo}>{children}</div>
    </article>
  );
}

function PlanningEngineSection() {
  const [activeSignal, setActiveSignal] = useState(0);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(sectionRef, { amount: 0.35 });
  const reduceMotion = Boolean(useReducedMotion());

  const signals = useMemo(
    () => [
      {
        icon: CalendarDays,
        label: "Timing",
        detail: "Tomorrow",
      },
      {
        icon: Zap,
        label: "Urgency",
        detail: "High",
      },
      {
        icon: Layers3,
        label: "Dependency",
        detail: "Client decision",
      },
      {
        icon: Clock3,
        label: "Capacity",
        detail: "1h 45m left",
      },
    ],
    []
  );

  useEffect(() => {
    if (!inView || reduceMotion) {
      if (reduceMotion) setActiveSignal(signals.length - 1);
      return;
    }

    const interval = window.setInterval(() => {
      setActiveSignal((current) => (current + 1) % signals.length);
    }, 1100);

    return () => window.clearInterval(interval);
  }, [inView, reduceMotion, signals.length]);

  return (
    <section id="why" className={styles.engineSection}>
      <div className={styles.sectionShell}>
        <div className={styles.engineGrid}>
          <div className={styles.engineCopy}>
            <span className={styles.sectionEyebrow}>A planning layer, not another list</span>
            <h2>Momentuhm helps decide what deserves attention now.</h2>
            <p>
              Traditional task managers store work. Momentuhm adds a practical
              reasoning layer: it reads timing, urgency, dependencies, impact,
              and the capacity left in your day.
            </p>

            <div className={styles.enginePoints}>
              <div>
                <CheckCircle2 size={17} />
                <span>Suggestions are transparent and editable.</span>
              </div>
              <div>
                <CheckCircle2 size={17} />
                <span>No task is moved or completed without your action.</span>
              </div>
              <div>
                <CheckCircle2 size={17} />
                <span>The system learns from your planning decisions over time.</span>
              </div>
            </div>
          </div>

          <div ref={sectionRef} className={styles.engineConsole}>
            <div className={styles.engineConsoleTop}>
              <span>
                <BrainCircuit size={16} />
                Planning engine
              </span>
              <MiniPill tone="green">Active</MiniPill>
            </div>

            <div className={styles.engineTask}>
              <span className={styles.engineTaskIcon}>
                <ListChecks size={16} />
              </span>
              <div>
                <span>Task under review</span>
                <strong>{HERO_TASK}</strong>
              </div>
            </div>

            <div className={styles.signalGrid}>
              {signals.map((signal, index) => {
                const Icon = signal.icon;
                const active = reduceMotion || index <= activeSignal;

                return (
                  <motion.div
                    key={signal.label}
                    animate={{
                      opacity: active ? 1 : 0.35,
                      borderColor: active ? "rgba(174, 130, 255, 0.42)" : "rgba(255, 255, 255, 0.08)",
                    }}
                    className={styles.signalCard}
                  >
                    <Icon size={15} />
                    <span>{signal.label}</span>
                    <strong>{active ? signal.detail : "Reading..."}</strong>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              animate={{ opacity: activeSignal >= signals.length - 1 || reduceMotion ? 1 : 0.35 }}
              className={styles.engineDecision}
            >
              <div>
                <Sparkles size={16} />
                <span>Suggested action</span>
              </div>
              <strong>Add to Focus and schedule for tomorrow</strong>
              <p>
                This task has a near-term dependency and can unblock a client decision.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  return (
    <header className={styles.siteHeader}>
      <div className={styles.headerInner}>
        <Brand />

        <nav className={styles.desktopNav} aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#why">Why Momentuhm</a>
        </nav>

        <div className={styles.headerActions}>
          <Link href="/sign-in" className={styles.signInLink}>
            Sign in
          </Link>
          <Link href="/sign-up" className={styles.headerCta}>
            Start free
            <ArrowRight size={15} />
          </Link>
        </div>

        <button
          type="button"
          className={styles.mobileMenuButton}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((current) => !current)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.mobileMenu}
          >
            <nav aria-label="Mobile navigation">
              <a href="#how-it-works" onClick={() => setMobileOpen(false)}>
                How it works
              </a>
              <a href="#features" onClick={() => setMobileOpen(false)}>
                Features
              </a>
              <a href="#why" onClick={() => setMobileOpen(false)}>
                Why Momentuhm
              </a>
              <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                Sign in
              </Link>
              <Link href="/sign-up" className={styles.mobileCta}>
                Start free <ArrowRight size={15} />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default function LandingPage() {
  return (
    <main className={`${inter.className} ${styles.page}`}>
      <Header />

      <section className={styles.heroSection}>
        <div className={styles.heroBackdrop} aria-hidden="true">
          <span className={styles.heroOrbOne} />
          <span className={styles.heroOrbTwo} />
          <span className={styles.heroGrid} />
        </div>

        <div className={styles.sectionShell}>
          <div className={styles.heroCopy}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={styles.heroEyebrow}
            >
              <span className={styles.eyebrowIcon}>
                <Sparkles size={14} />
              </span>
              AI planning that keeps you in control
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
            >
              Turn scattered work into a clear next move.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.11 }}
              className={styles.heroLead}
            >
              Momentuhm organizes tasks, extracts actions from copied text,
              builds a focused plan, and helps you understand your progress -
              without taking control away from you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.17 }}
              className={styles.heroActions}
            >
              <Link href="/sign-up" className={styles.primaryCta}>
                Start planning free
                <ArrowRight size={17} />
              </Link>
              <a href="#how-it-works" className={styles.secondaryCta}>
  Watch live demos
  <ChevronRight size={17} />
</a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className={styles.heroProof}
            >
              <span>
                <Check size={14} /> No credit card
              </span>
              <span>
                <Check size={14} /> Suggestions stay editable
              </span>
              <span>
                <Check size={14} /> Works on desktop and mobile
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroProductDemo />
          </motion.div>
        </div>
      </section>

      <section className={styles.workflowStrip} aria-label="Momentuhm workflow">
        <div className={styles.sectionShell}>
          <p>From capture to completion</p>
          <div className={styles.workflowSteps}>
            {[
              ["01", "Capture"],
              ["02", "Organize"],
              ["03", "Focus"],
              ["04", "Complete"],
              ["05", "Learn"],
            ].map(([number, label], index) => (
              <div key={label} className={styles.workflowStep}>
                <span>{number}</span>
                <strong>{label}</strong>
                {index < 4 && <ChevronRight size={14} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className={styles.featuresSection}>
        <div className={styles.sectionShell}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionEyebrow}>See the product work</span>
            <h2>Not screenshots. Not recorded videos. Live interface demos.</h2>
            <p>
              Each preview below is built from the same kind of React state,
              timing, and interface patterns used inside Momentuhm.
            </p>
          </div>

          <div className={styles.featureGrid}>
            <FeatureCard
              number="01"
              eyebrow="Smart Assist"
              title="Add a rough task. Get useful structure."
              description="Momentuhm prepares a sensible first draft with priority, timing, category, and why the task matters."
            >
              <SmartAssistDemo />
            </FeatureCard>

            <FeatureCard
              number="02"
              eyebrow="Clipboard Assist"
              title="Copied text becomes actionable work."
              description="Separate tasks from an email or message, review them, or group the actions beneath one parent task."
            >
              <ClipboardAssistDemo />
            </FeatureCard>

            <FeatureCard
              number="03"
              eyebrow="AI Focus"
              title="Find the strongest next moves."
              description="Build a small execution stack using urgency, impact, dependencies, and the time remaining in your day."
            >
              <FocusStackDemo />
            </FeatureCard>

            <FeatureCard
              number="04"
              eyebrow="Daily intelligence"
              title="See progress without turning work into noise."
              description="Understand completion, momentum, and the shape of your day in a way that helps the next decision."
            >
              <ProgressDemo />
            </FeatureCard>
          </div>
        </div>
      </section>

      <PlanningEngineSection />

      <section id="features" className={styles.modulesSection}>
        <div className={styles.sectionShell}>
          <div className={styles.modulesHeading}>
            <div>
              <span className={styles.sectionEyebrow}>One connected workflow</span>
              <h2>Everything needed to move from open loops to finished work.</h2>
            </div>
            <p>
              Momentuhm is designed around a simple system: capture clearly,
              choose deliberately, execute a small stack, and learn from what
              actually gets completed.
            </p>
          </div>

          <div className={styles.moduleGrid}>
            {PRODUCT_MODULES.map((module, index) => {
              const Icon = module.icon;

              return (
                <motion.article
                  key={module.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.04, duration: 0.45 }}
                  className={styles.moduleCard}
                >
                  <span className={styles.moduleIcon}>
                    <Icon size={19} />
                  </span>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.controlSection}>
        <div className={styles.sectionShell}>
          <div className={styles.controlCard}>
            <div className={styles.controlCopy}>
              <span className={styles.sectionEyebrow}>Human judgment stays central</span>
              <h2>AI prepares. You decide.</h2>
              <p>
                Change the priority, date, category, reasoning, Focus placement,
                or any other detail. Suggestions are there to reduce planning
                effort, not to silently run your day.
              </p>
              <Link href="/sign-up" className={styles.textLink}>
                Try the planning workflow
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className={styles.controlVisual}>
              <div className={styles.editPanel}>
                <div className={styles.editPanelTop}>
                  <span>Edit task</span>
                  <X size={15} />
                </div>
                {[
                  ["Priority", "High"],
                  ["Due date", "Tomorrow"],
                  ["Category", "Project Delivery"],
                  ["Why it matters", "Client decision dependency"],
                  ["Focus", "Included"],
                ].map(([label, value], index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.08 + index * 0.06 }}
                    className={styles.editRow}
                  >
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <ChevronRight size={14} />
                  </motion.div>
                ))}
                <div className={styles.editActions}>
                  <button type="button" tabIndex={-1}>Cancel</button>
                  <button type="button" tabIndex={-1}>Save changes</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.finalCtaSection}>
        <div className={styles.sectionShell}>
          <div className={styles.finalCtaCard}>
            <div className={styles.finalCtaGlow} aria-hidden="true" />
            <div className={styles.finalCtaContent}>
              <span className={styles.finalCtaIcon}>
                <Sparkles size={20} />
              </span>
              <h2>Give the day a clearer shape.</h2>
              <p>
                Capture what is open, let Momentuhm prepare the structure, and
                choose the next move with less planning friction.
              </p>
              <div className={styles.finalCtaActions}>
                <Link href="/sign-up" className={styles.primaryCtaLight}>
                  Start free
                  <ArrowRight size={17} />
                </Link>
                <Link href="/sign-in" className={styles.secondaryCtaDark}>
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.sectionShell}>
          <div className={styles.footerTop}>
            <div>
              <Brand />
              <p>Clearer planning. Smaller focus. Better momentum.</p>
            </div>
            <div className={styles.footerLinks}>
              <div>
                <strong>Product</strong>
                <a href="#how-it-works">How it works</a>
                <a href="#features">Features</a>
                <a href="#why">Why Momentuhm</a>
              </div>
              <div>
                <strong>Account</strong>
                <Link href="/sign-in">Sign in</Link>
                <Link href="/sign-up">Create account</Link>
              </div>
              <div>
                <strong>Legal</strong>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 Momentuhm. All rights reserved.</span>
            <span>Built for deliberate work.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
