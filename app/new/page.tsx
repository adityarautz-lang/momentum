"use client";

import {
  useEffect,
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

const RAW_MESSAGE =
  "Need to finish the deck, reply to Rhea, book the dentist, send the budget by Thursday, and figure out what to do first.";

const EXTRACTED_TASKS = [
  { title: "Send the revised budget", meta: "Due Thursday", tone: "hot" },
  { title: "Finish the project deck", meta: "45 min", tone: "violet" },
  { title: "Reply to Rhea", meta: "10 min", tone: "yellow" },
  { title: "Book the dentist", meta: "Personal", tone: "green" },
];

const FOCUS_TASKS = [
  {
    title: "Send the revised budget",
    reason: "Deadline + someone else is waiting",
    time: "25 min",
  },
  {
    title: "Finish the project deck",
    reason: "Highest-impact work left today",
    time: "45 min",
  },
  {
    title: "Reply to Rhea",
    reason: "Quick follow-up that closes a loop",
    time: "10 min",
  },
];

const SCENARIOS = [
  {
    tag: "THE GROUP CHAT",
    title: "One message. Six hidden tasks.",
    copy: "Paste the whole thing. Momentuhm separates the actions before you add anything.",
    accent: "coral",
  },
  {
    tag: "THE SUNDAY SCARIES",
    title: "Everything feels equally urgent.",
    copy: "See what is due, what is blocking someone, and what can realistically fit today.",
    accent: "yellow",
  },
  {
    tag: "THE BUSY DAY",
    title: "A lot got done. Nothing moved.",
    copy: "Track meaningful progress, not just the number of tiny boxes you checked.",
    accent: "green",
  },
  {
    tag: "THE BRAIN DUMP",
    title: "Your notes are not a plan yet.",
    copy: "Turn rough thoughts into editable tasks with dates, priority, context, and a clear first step.",
    accent: "violet",
  },
];

const FEATURE_CARDS = [
  {
    icon: ClipboardCheck,
    eyebrow: "Clipboard Assist",
    title: "Copy chaos. Paste actions.",
    copy: "Momentuhm detects useful work inside messages, emails, meeting notes, and long brain dumps.",
    className: "featureWide",
  },
  {
    icon: Target,
    eyebrow: "Focus stack",
    title: "A shorter list you can actually start.",
    copy: "Your strongest next tasks are ranked using urgency, impact, dependencies, and time left.",
    className: "featureTall",
  },
  {
    icon: Sparkles,
    eyebrow: "Smart Assist",
    title: "Rough task in. Useful structure out.",
    copy: "Get an editable first draft of the priority, timing, category, and why the task matters.",
    className: "featureStandard",
  },
  {
    icon: Layers3,
    eyebrow: "Tasks + backlog",
    title: "Keep now separate from not now.",
    copy: "Move non-active work out of sight without losing it or pretending it no longer matters.",
    className: "featureStandard",
  },
  {
    icon: TrendingUp,
    eyebrow: "Progress intelligence",
    title: "See momentum without gamifying your life.",
    copy: "Understand what moved, what stalled, and how your attention is being used across the day.",
    className: "featureWide",
  },
];

type AutoStepOptions = {
  count: number;
  interval?: number;
  threshold?: number;
};

function useAutoStep({
  count,
  interval = 1700,
  threshold = 0.25,
}: AutoStepOptions) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: threshold });
  const reducedMotion = Boolean(useReducedMotion());
  const [step, setStep] = useState(reducedMotion ? count - 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      setStep(count - 1);
      return;
    }

    if (!inView) return;

    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % count);
    }, interval);

    return () => window.clearInterval(timer);
  }, [count, inView, interval, reducedMotion]);

  return { ref, step, reducedMotion };
}

function LogoMark() {
  return (
    <span className={styles.logoMark} aria-hidden="true">
      <span className={styles.logoBolt}>
        <Zap size={15} strokeWidth={2.4} />
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

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Brand />

        <nav className={styles.desktopNav} aria-label="Primary navigation">
          <a href="#how">How it works</a>
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
          className={styles.menuButton}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.mobileMenu}
          >
            <nav aria-label="Mobile navigation">
              <a href="#how" onClick={() => setMenuOpen(false)}>
                How it works
              </a>
              <a href="#features" onClick={() => setMenuOpen(false)}>
                Features
              </a>
              <a href="#why" onClick={() => setMenuOpen(false)}>
                Why Momentuhm
              </a>
              <Link href="/sign-in" onClick={() => setMenuOpen(false)}>
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

function BrowserFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.browserFrame}>
      <div className={styles.browserBar}>
        <div className={styles.browserDots} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className={styles.browserStatus}>
          <span className={styles.liveDot} />
          Live product flow
        </div>
        <span className={styles.browserBrand}>Momentuhm</span>
      </div>
      {children}
    </div>
  );
}

function HeroDemo() {
  const { ref, step, reducedMotion } = useAutoStep({
    count: 4,
    interval: 1850,
    threshold: 0.18,
  });

  const activeStep = reducedMotion ? 3 : step;

  return (
    <div ref={ref} className={styles.heroVisualWrap}>
      <span className={styles.heroSticker}>18 tabs open</span>
      <span className={styles.heroDoodle} aria-hidden="true">
        ↓
      </span>

      <BrowserFrame>
        <div className={styles.heroDemo}>
          <div className={styles.demoSidebar}>
            <div className={styles.demoBrandLine}>
              <LogoMark />
              <strong>Momentuhm</strong>
            </div>
            <div className={styles.demoNavItemActive}>
              <ListChecks size={15} /> Today
            </div>
            <div className={styles.demoNavItem}>
              <Target size={15} /> Focus
            </div>
            <div className={styles.demoNavItem}>
              <CalendarDays size={15} /> Upcoming
            </div>
            <div className={styles.demoSidebarNote}>
              <Sparkles size={14} />
              <span>Suggestions stay editable.</span>
            </div>
          </div>

          <div className={styles.demoCanvas}>
            <div className={styles.demoCanvasTop}>
              <div>
                <span>Tuesday, 6:42 PM</span>
                <h3>Let&apos;s clear the fog.</h3>
              </div>
              <div className={styles.demoProgressPill}>
                <TrendingUp size={14} />
                <span>3 useful moves</span>
              </div>
            </div>

            <div className={styles.demoColumns}>
              <section className={styles.chaosPanel}>
                <div className={styles.panelLabel}>
                  <span>01</span>
                  Drop in the mess
                </div>

                <motion.div
                  animate={{
                    borderColor:
                      activeStep === 0 ? "#17171a" : "rgba(23, 23, 26, 0.15)",
                    boxShadow:
                      activeStep === 0
                        ? "5px 5px 0 rgba(23, 23, 26, 1)"
                        : "0 0 0 rgba(23, 23, 26, 0)",
                  }}
                  className={styles.messageCard}
                >
                  <div className={styles.messageMeta}>
                    <span>Copied message</span>
                    <ClipboardCheck size={15} />
                  </div>
                  <p>{RAW_MESSAGE}</p>
                </motion.div>

                <div className={styles.looseNotes} aria-hidden="true">
                  <span className={styles.looseNoteOne}>Dentist!</span>
                  <span className={styles.looseNoteTwo}>Deck due?</span>
                  <span className={styles.looseNoteThree}>Reply today</span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {activeStep === 1 && (
                    <motion.div
                      key="reading"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={styles.aiReading}
                    >
                      <span className={styles.aiOrb}>
                        <Sparkles size={14} />
                      </span>
                      <div>
                        <strong>Finding the actual work…</strong>
                        <span>Dates, dependencies, quick wins</span>
                      </div>
                      <span className={styles.loadingDots}>
                        <i />
                        <i />
                        <i />
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              <section className={styles.planPanel}>
                <div className={styles.panelLabel}>
                  <span>02</span>
                  Get a plan you can start
                </div>

                <div className={styles.extractedList}>
                  {EXTRACTED_TASKS.map((task, index) => {
                    const visible = activeStep >= 2 || reducedMotion;

                    return (
                      <motion.div
                        key={task.title}
                        initial={false}
                        animate={{
                          opacity: visible ? 1 : 0.23,
                          y: visible ? 0 : 8,
                        }}
                        transition={{ delay: visible ? index * 0.07 : 0 }}
                        className={styles.extractedTask}
                      >
                        <span className={styles.taskCheckbox} />
                        <div>
                          <strong>{task.title}</strong>
                          <span>{task.meta}</span>
                        </div>
                        <span
                          className={`${styles.taskTone} ${styles[`taskTone_${task.tone}`]}`}
                        />
                      </motion.div>
                    );
                  })}
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    opacity: activeStep >= 3 ? 1 : 0.24,
                    scale: activeStep >= 3 ? 1 : 0.98,
                  }}
                  className={styles.startHereCard}
                >
                  <div className={styles.startHereHeader}>
                    <span>
                      <Target size={15} /> Start here
                    </span>
                    <small>25 min</small>
                  </div>
                  <strong>Send the revised budget</strong>
                  <p>It is due first and blocks someone else&apos;s work.</p>
                  <div className={styles.startAction}>
                    Begin task
                    <ArrowRight size={14} />
                  </div>
                </motion.div>
              </section>
            </div>
          </div>
        </div>
      </BrowserFrame>

      <div className={styles.demoStepRail} aria-label="Demo progress">
        {["Paste", "Understand", "Organize", "Start"].map((label, index) => (
          <div
            key={label}
            className={index === activeStep ? styles.demoStepActive : styles.demoStep}
          >
            <span>{index + 1}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScenarioCard({
  tag,
  title,
  copy,
  accent,
  index,
}: {
  tag: string;
  title: string;
  copy: string;
  accent: string;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ delay: index * 0.06, duration: 0.45 }}
      className={`${styles.scenarioCard} ${styles[`scenario_${accent}`]}`}
    >
      <span className={styles.scenarioNumber}>0{index + 1}</span>
      <div>
        <span className={styles.scenarioTag}>{tag}</span>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
    </motion.article>
  );
}

function ProblemSection() {
  return (
    <section id="why" className={styles.problemSection}>
      <div className={styles.shell}>
        <div className={styles.problemHeading}>
          <div>
            <span className={styles.sectionKicker}>THE REAL BLOCKER</span>
            <h2>
              Procrastination often starts <em>before</em> the work does.
            </h2>
          </div>
          <p>
            When ten things feel urgent, your brain keeps negotiating instead of
            beginning. Momentuhm narrows the field until one useful action is
            obvious.
          </p>
        </div>

        <div className={styles.scenarioGrid}>
          {SCENARIOS.map((scenario, index) => (
            <ScenarioCard key={scenario.title} {...scenario} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ClipboardFlow() {
  const { ref, step, reducedMotion } = useAutoStep({ count: 3, interval: 1800 });
  const activeStep = reducedMotion ? 2 : step;

  return (
    <div ref={ref} className={styles.clipboardFlow}>
      <div className={styles.clipboardSourceCard}>
        <div className={styles.clipboardCardTop}>
          <span>Copied from a message</span>
          <ClipboardCheck size={16} />
        </div>
        <p>
          “Can you update the numbers before Thursday, ask Dev about the missing
          file, and schedule the review for next week?”
        </p>
        <motion.span
          animate={{ width: activeStep >= 1 ? "100%" : "18%" }}
          className={styles.scanLine}
        />
      </div>

      <div className={styles.flowArrow} aria-hidden="true">
        <ArrowRight size={23} />
      </div>

      <div className={styles.clipboardResultCard}>
        <div className={styles.clipboardResultTop}>
          <div>
            <span className={styles.aiOrbSmall}>
              <Sparkles size={13} />
            </span>
            <div>
              <strong>3 tasks found</strong>
              <span>Review before adding</span>
            </div>
          </div>
          <span className={styles.editableBadge}>Editable</span>
        </div>

        {[
          ["Update the numbers", "Thursday"],
          ["Ask Dev for the missing file", "Dependency"],
          ["Schedule the review", "Next week"],
        ].map(([title, meta], index) => (
          <motion.div
            key={title}
            initial={false}
            animate={{
              opacity: activeStep >= 1 ? 1 : 0.22,
              x: activeStep >= 1 ? 0 : 12,
            }}
            transition={{ delay: index * 0.08 }}
            className={styles.clipboardResultRow}
          >
            <span className={styles.checkedBox}>
              <Check size={11} />
            </span>
            <div>
              <strong>{title}</strong>
              <span>{meta}</span>
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={false}
          animate={{ opacity: activeStep >= 2 ? 1 : 0.2 }}
          className={styles.clipboardActions}
        >
          <button type="button" tabIndex={-1}>
            Group as subtasks
          </button>
          <button type="button" tabIndex={-1}>
            Add selected
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function HowSection() {
  return (
    <section id="how" className={styles.howSection}>
      <div className={styles.shell}>
        <div className={styles.howTop}>
          <div>
            <span className={styles.sectionKicker}>FROM MESS TO MOTION</span>
            <h2>Paste it. Shape it. Start it.</h2>
          </div>
          <p>
            Momentuhm does not ask you to build a perfect productivity system.
            Give it what you already have, then make the final call.
          </p>
        </div>

        <div className={styles.howGrid}>
          <div className={styles.howSteps}>
            {[
              {
                number: "01",
                icon: ClipboardCheck,
                title: "Capture the messy version",
                copy: "Paste a message, add a rough task, or dump the whole list exactly as it exists in your head.",
              },
              {
                number: "02",
                icon: BrainCircuit,
                title: "Let Momentuhm find the shape",
                copy: "AI extracts actions, suggests useful details, and spots deadlines or dependencies you might miss.",
              },
              {
                number: "03",
                icon: Target,
                title: "Choose one useful place to begin",
                copy: "Review the focus stack, edit anything you disagree with, and start without another planning session.",
              },
            ].map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: index * 0.08 }}
                  className={styles.howStep}
                >
                  <span className={styles.howStepNumber}>{item.number}</span>
                  <span className={styles.howStepIcon}>
                    <Icon size={19} />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <ClipboardFlow />
        </div>
      </div>
    </section>
  );
}

function FocusSection() {
  const { ref, step, reducedMotion } = useAutoStep({ count: 4, interval: 1450 });
  const visibleCount = reducedMotion ? 3 : Math.min(step, 3);

  return (
    <section className={styles.focusSection}>
      <div className={styles.focusNoise} aria-hidden="true" />
      <div className={styles.shell}>
        <div className={styles.focusGrid}>
          <div className={styles.focusCopy}>
            <span className={styles.darkKicker}>SMALL ON PURPOSE</span>
            <h2>Your focus list should not look like your entire life.</h2>
            <p>
              A long list creates guilt. A short, reasoned stack creates motion.
              Momentuhm shows the few tasks that deserve attention now—and why.
            </p>

            <div className={styles.focusChecks}>
              <div>
                <CheckCircle2 size={18} />
                Ranked using urgency, impact, dependencies, and capacity
              </div>
              <div>
                <CheckCircle2 size={18} />
                Reorder, remove, or replace any suggestion
              </div>
              <div>
                <CheckCircle2 size={18} />
                Nothing is completed or moved without you
              </div>
            </div>
          </div>

          <div ref={ref} className={styles.focusConsole}>
            <div className={styles.focusConsoleTop}>
              <div>
                <span className={styles.focusConsoleIcon}>
                  <Focus size={17} />
                </span>
                <div>
                  <span>Today&apos;s focus</span>
                  <strong>Do less. Move more.</strong>
                </div>
              </div>
              <span className={styles.capacityPill}>
                <Clock3 size={13} /> 1h 20m
              </span>
            </div>

            <div className={styles.focusList}>
              <AnimatePresence initial={false}>
                {FOCUS_TASKS.slice(0, visibleCount).map((task, index) => (
                  <motion.div
                    layout
                    key={task.title}
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={`${styles.focusTask} ${
                      index === 0 ? styles.focusTaskFirst : ""
                    }`}
                  >
                    <GripVertical size={15} className={styles.gripIcon} />
                    <span className={styles.focusRank}>{index + 1}</span>
                    <div>
                      <strong>{task.title}</strong>
                      <span>{task.reason}</span>
                    </div>
                    <small>{task.time}</small>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className={styles.focusConsoleFooter}>
              <div>
                <span>Capacity used</span>
                <strong>{visibleCount === 0 ? 0 : visibleCount === 1 ? 31 : visibleCount === 2 ? 87 : 100}%</strong>
              </div>
              <div className={styles.capacityBar}>
                <motion.span
                  animate={{
                    width:
                      visibleCount === 0
                        ? "0%"
                        : visibleCount === 1
                        ? "31%"
                        : visibleCount === 2
                        ? "87%"
                        : "100%",
                  }}
                />
              </div>
              <p>Enough to make progress. Small enough to begin.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureVisual({ title }: { title: string }) {
  if (title === "Copy chaos. Paste actions.") {
    return (
      <div className={styles.featureClipboardVisual}>
        <div className={styles.featureMessageBubble}>
          Can you update the deck, message Aisha, and book the room for Friday?
        </div>
        <div className={styles.featureExtractedMini}>
          {["Update the deck", "Message Aisha", "Book the room"].map((task) => (
            <div key={task}>
              <span className={styles.checkedBox}>
                <Check size={10} />
              </span>
              {task}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (title === "A shorter list you can actually start.") {
    return (
      <div className={styles.featureFocusVisual}>
        {FOCUS_TASKS.map((task, index) => (
          <div key={task.title}>
            <span>{index + 1}</span>
            <div>
              <strong>{task.title}</strong>
              <small>{task.time}</small>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (title === "Rough task in. Useful structure out.") {
    return (
      <div className={styles.featureAssistVisual}>
        <div className={styles.roughTaskRow}>
          <Plus size={15} />
          <span>sort presentation thing</span>
          <Sparkles size={15} />
        </div>
        <div className={styles.assistDetails}>
          <div>
            <span>Priority</span>
            <strong>High</strong>
          </div>
          <div>
            <span>Due</span>
            <strong>Tomorrow</strong>
          </div>
          <p>Finish the presentation outline before tomorrow&apos;s team review.</p>
        </div>
      </div>
    );
  }

  if (title === "Keep now separate from not now.") {
    return (
      <div className={styles.featureBacklogVisual}>
        <div>
          <span>NOW</span>
          <strong>3 tasks</strong>
        </div>
        <ArrowRight size={18} />
        <div>
          <span>NOT NOW</span>
          <strong>Backlog</strong>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.featureProgressVisual}>
      <div className={styles.progressNumbers}>
        <div>
          <span>Finished</span>
          <strong>6</strong>
        </div>
        <div>
          <span>Meaningful</span>
          <strong>4</strong>
        </div>
        <div>
          <span>Momentum</span>
          <strong>↑</strong>
        </div>
      </div>
      <div className={styles.progressLine}>
        <span />
      </div>
      <p>
        You moved two high-impact tasks before spending time on low-value work.
      </p>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className={styles.featuresSection}>
      <div className={styles.shell}>
        <div className={styles.featuresHeading}>
          <div>
            <span className={styles.sectionKicker}>BUILT FOR REAL-LIFE CHAOS</span>
            <h2>Not another perfect system you have to maintain.</h2>
          </div>
          <p>
            Momentuhm meets you where the work already is, then helps you turn it
            into something clear, editable, and possible today.
          </p>
        </div>

        <div className={styles.bentoGrid}>
          {FEATURE_CARDS.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.05, duration: 0.45 }}
                className={`${styles.featureCard} ${styles[feature.className]}`}
              >
                <div className={styles.featureCardCopy}>
                  <span className={styles.featureIcon}>
                    <Icon size={19} />
                  </span>
                  <span className={styles.featureEyebrow}>{feature.eyebrow}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                </div>
                <FeatureVisual title={feature.title} />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ControlSection() {
  const [activeChoice, setActiveChoice] = useState("High");

  return (
    <section className={styles.controlSection}>
      <div className={styles.shell}>
        <div className={styles.controlCard}>
          <div className={styles.controlCopy}>
            <span className={styles.sectionKicker}>HELPFUL AI. ZERO AUTOPILOT.</span>
            <h2>Momentuhm prepares the draft. You keep the final say.</h2>
            <p>
              Change the priority, due date, category, explanation, or focus
              placement. The AI should reduce planning friction—not quietly run
              your day.
            </p>

            <div className={styles.controlPrinciples}>
              <span>
                <ShieldCheck size={16} /> Suggestions are visible
              </span>
              <span>
                <CheckCircle2 size={16} /> Every detail stays editable
              </span>
            </div>
          </div>

          <div className={styles.controlVisual}>
            <span className={styles.controlSticker}>your call</span>
            <div className={styles.editCard}>
              <div className={styles.editCardTop}>
                <div>
                  <span>Edit task</span>
                  <strong>Finish the project deck</strong>
                </div>
                <X size={16} />
              </div>

              <div className={styles.editSection}>
                <span className={styles.editLabel}>PRIORITY</span>
                <div className={styles.choiceRow}>
                  {["Low", "Medium", "High"].map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={
                        activeChoice === choice ? styles.choiceActive : styles.choice
                      }
                      onClick={() => setActiveChoice(choice)}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.editRows}>
                {[
                  ["Due date", "Tomorrow"],
                  ["Category", "Project work"],
                  ["Why it matters", "Team review is blocked"],
                  ["Focus stack", "Included"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <ChevronRight size={14} />
                  </div>
                ))}
              </div>

              <div className={styles.editFooter}>
                <button type="button" tabIndex={-1}>
                  Cancel
                </button>
                <button type="button" tabIndex={-1}>
                  Save my changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className={styles.finalSection}>
      <div className={styles.shell}>
        <div className={styles.finalCard}>
          <div className={styles.finalBurst} aria-hidden="true" />
          <span className={styles.finalSticker}>No perfect mood required</span>
          <div className={styles.finalCopy}>
            <span className={styles.finalIcon}>
              <Zap size={21} />
            </span>
            <h2>Start before motivation shows up.</h2>
            <p>
              Give Momentuhm the messy list. Get back one clear place to begin.
            </p>
            <div className={styles.finalActions}>
              <Link href="/sign-up" className={styles.finalPrimary}>
                Build my plan
                <ArrowRight size={17} />
              </Link>
              <Link href="/sign-in" className={styles.finalSecondary}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.shell}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Brand />
            <p>Less deciding. More starting. Better momentum.</p>
          </div>

          <div className={styles.footerLinks}>
            <div>
              <strong>Product</strong>
              <a href="#how">How it works</a>
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
          <span>Built for the days your brain has too many tabs open.</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className={`${inter.className} ${styles.page}`}>
      <Header />

      <section className={styles.heroSection}>
        <div className={styles.heroBackground} aria-hidden="true">
          <span className={styles.heroOrbOne} />
          <span className={styles.heroOrbTwo} />
          <span className={styles.heroGrid} />
        </div>

        <div className={styles.shell}>
          <div className={styles.heroGridLayout}>
            <div className={styles.heroCopy}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className={styles.heroEyebrow}
              >
                <span>
                  <Sparkles size={14} />
                </span>
                For days when everything feels important
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05 }}
              >
                Too much to do.
                <br />
                No clue where to <em>start?</em>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className={styles.heroLead}
              >
                Drop in your tasks, messages, and messy notes. Momentuhm turns
                the chaos into a focused plan and shows you what deserves your
                attention first—without taking control away from you.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                className={styles.heroActions}
              >
                <Link href="/sign-up" className={styles.primaryCta}>
                  Build my plan
                  <ArrowRight size={17} />
                </Link>
                <a href="#how" className={styles.secondaryCta}>
                  Watch the chaos clear
                  <ChevronRight size={17} />
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.22 }}
                className={styles.heroProof}
              >
                <span>
                  <Check size={14} /> Free to start
                </span>
                <span>
                  <Check size={14} /> No credit card
                </span>
                <span>
                  <Check size={14} /> Every suggestion editable
                </span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            >
              <HeroDemo />
            </motion.div>
          </div>
        </div>
      </section>

      <section className={styles.marqueeSection} aria-label="Momentuhm inputs">
        <div className={styles.marqueeTrack}>
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1}>
              <span>MESSAGES</span>
              <i>✦</i>
              <span>EMAILS</span>
              <i>✦</i>
              <span>ROUGH TASKS</span>
              <i>✦</i>
              <span>BRAIN DUMPS</span>
              <i>✦</i>
              <span>ACTUAL NEXT STEPS</span>
              <i>✦</i>
            </div>
          ))}
        </div>
      </section>

      <ProblemSection />
      <HowSection />
      <FocusSection />
      <FeaturesSection />
      <ControlSection />
      <FinalCta />
      <Footer />
    </main>
  );
}
