"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

/* ------------------------------------------------ */
/* Event Types */
/* ------------------------------------------------ */

export type PlanningEventType =
  | "priority_suggested"
  | "priority_suggestion_overridden"
  | "priority_suggestion_accepted"
  | "priority_overridden"
  | "date_suggested"
  | "date_suggestion_accepted"
  | "date_suggestion_overridden"
  | "manual_date_assigned"
  | "task_deferred"
  | "task_completed"
  | "task_completion_reversed"
  | "focus_plan_generated"
  | "focus_plan_accepted"
  | "focus_plan_modified";

export type PlanningEventContext = {
  title?: string;
  category?: string;
  priority?: string;
  dueDate?: string | null;
  suggestedDueDate?: string | null;
  createdAt?: string;
  deferCount?: number;
  source?: string;
  taskIds?: string[];
};

export type PlanningEvent = {
  id: string;
  type: PlanningEventType;
  occurredAt: string;

  taskId?: string;

  previousValue?: string | null;
  suggestedValue?: string | null;
  finalValue?: string | null;

  context?: PlanningEventContext;
};

export type NewPlanningEvent = Omit<
  PlanningEvent,
  "id" | "occurredAt"
> & {
  occurredAt?: string;
};

/* ------------------------------------------------ */
/* User Profile */
/* ------------------------------------------------ */

export type CompletionPeriod =
  | "morning"
  | "afternoon"
  | "evening";

export type UserPlanningProfile = {
  version: number;
  totalEvents: number;

  priorityPatterns: {
    suggestionCount: number;
    acceptedCount: number;
    overrideCount: number;
    acceptanceRate: number;
    highToMediumCount: number;
    mediumToHighCount: number;
    commonOverridesByCategory: Record<
      string,
      number
    >;
  };

  datePatterns: {
    suggestionCount: number;
    acceptedCount: number;
    overrideCount: number;
    acceptanceRate: number;
    movedEarlierCount: number;
    movedLaterCount: number;
    averageDaysMovedEarlier: number;
    averageDaysMovedLater: number;
  };

  executionPatterns: {
    completionCount: number;
    completionReversalCount: number;
    deferralCount: number;
    averageDeferralsPerCompletedTask: number;
    strongestCompletionPeriod:
      | CompletionPeriod
      | null;
  };

  promptInstructions: string[];
  updatedAt: string;
};

/* ------------------------------------------------ */
/* Empty Profile */
/* ------------------------------------------------ */

export const createEmptyPlanningProfile =
  (): UserPlanningProfile => ({
    version: 1,
    totalEvents: 0,

    priorityPatterns: {
      suggestionCount: 0,
      acceptedCount: 0,
      overrideCount: 0,
      acceptanceRate: 0,
      highToMediumCount: 0,
      mediumToHighCount: 0,
      commonOverridesByCategory: {},
    },

    datePatterns: {
      suggestionCount: 0,
      acceptedCount: 0,
      overrideCount: 0,
      acceptanceRate: 0,
      movedEarlierCount: 0,
      movedLaterCount: 0,
      averageDaysMovedEarlier: 0,
      averageDaysMovedLater: 0,
    },

    executionPatterns: {
      completionCount: 0,
      completionReversalCount: 0,
      deferralCount: 0,
      averageDeferralsPerCompletedTask: 0,
      strongestCompletionPeriod: null,
    },

    promptInstructions: [],
    updatedAt: new Date().toISOString(),
  });

/* ------------------------------------------------ */
/* Internal Helpers */
/* ------------------------------------------------ */

const isValidDate = (
  value?: string | null
) => {
  if (!value) return false;

  const date = new Date(
    `${value}T00:00:00`
  );

  return !Number.isNaN(
    date.getTime()
  );
};

export const getDifferenceInCalendarDays = (
  earlierDate?: string | null,
  laterDate?: string | null
) => {
  if (
    !isValidDate(earlierDate) ||
    !isValidDate(laterDate)
  ) {
    return 0;
  }

  const earlier = new Date(
    `${earlierDate}T00:00:00`
  );

  const later = new Date(
    `${laterDate}T00:00:00`
  );

  return Math.round(
    (later.getTime() -
      earlier.getTime()) /
      (1000 * 60 * 60 * 24)
  );
};

const getCompletionPeriod = (
  occurredAt: string
): CompletionPeriod => {
  const date = new Date(occurredAt);

  if (Number.isNaN(date.getTime())) {
    return "afternoon";
  }

  const hour = date.getHours();

  if (hour < 12) {
    return "morning";
  }

  if (hour < 17) {
    return "afternoon";
  }

  return "evening";
};

const average = (
  numbers: number[]
) => {
  if (numbers.length === 0) {
    return 0;
  }

  const total = numbers.reduce(
    (sum, number) =>
      sum + number,
    0
  );

  return Number(
    (
      total / numbers.length
    ).toFixed(1)
  );
};

const percentage = (
  numerator: number,
  denominator: number
) => {
  if (denominator === 0) {
    return 0;
  }

  return Math.round(
    (numerator / denominator) *
      100
  );
};

/* ------------------------------------------------ */
/* Profile Compiler */
/* ------------------------------------------------ */

export const buildUserPlanningProfile = (
  events: PlanningEvent[]
): UserPlanningProfile => {
  const prioritySuggestions =
    events.filter(
      (event) =>
        event.type ===
        "priority_suggested"
    );

  const priorityAcceptances =
    events.filter(
      (event) =>
        event.type ===
        "priority_suggestion_accepted"
    );

  const priorityOverrides =
    events.filter(
      (event) =>
        event.type ===
          "priority_suggestion_overridden" ||
        /*
         * Keep compatibility with any older saved
         * memory that used the previous event name.
         */
        event.type ===
          "priority_overridden"
    );

  const dateSuggestions =
    events.filter(
      (event) =>
        event.type ===
        "date_suggested"
    );

  const dateAcceptances =
    events.filter(
      (event) =>
        event.type ===
        "date_suggestion_accepted"
    );

  const dateOverrides =
    events.filter(
      (event) =>
        event.type ===
        "date_suggestion_overridden"
    );

  const completionEvents =
    events.filter(
      (event) =>
        event.type ===
        "task_completed"
    );

  const completionReversals =
    events.filter(
      (event) =>
        event.type ===
        "task_completion_reversed"
    );

  const deferralEvents =
    events.filter(
      (event) =>
        event.type ===
        "task_deferred"
    );

  const earlierMovements: number[] =
    [];

  const laterMovements: number[] =
    [];

  dateOverrides.forEach(
    (event) => {
      const difference =
        getDifferenceInCalendarDays(
          event.suggestedValue,
          event.finalValue
        );

      if (difference < 0) {
        earlierMovements.push(
          Math.abs(difference)
        );
      }

      if (difference > 0) {
        laterMovements.push(
          difference
        );
      }
    }
  );

  const commonOverridesByCategory =
    priorityOverrides.reduce<
      Record<string, number>
    >((counts, event) => {
      const category =
        event.context?.category ||
        "No category";

      counts[category] =
        (counts[category] || 0) +
        1;

      return counts;
    }, {});

  const completionPeriods =
    completionEvents.reduce<
      Record<
        CompletionPeriod,
        number
      >
    >(
      (counts, event) => {
        const period =
          getCompletionPeriod(
            event.occurredAt
          );

        counts[period] += 1;

        return counts;
      },
      {
        morning: 0,
        afternoon: 0,
        evening: 0,
      }
    );

  let strongestCompletionPeriod:
    | CompletionPeriod
    | null = null;

  if (completionEvents.length >= 3) {
    strongestCompletionPeriod =
      (
        Object.entries(
          completionPeriods
        ).sort(
          (first, second) =>
            second[1] - first[1]
        )[0]?.[0] as
          | CompletionPeriod
          | undefined
      ) || null;
  }

  const highToMediumCount =
    priorityOverrides.filter(
      (event) =>
        event.suggestedValue ===
          "High" &&
        event.finalValue ===
          "Medium"
    ).length;

  const mediumToHighCount =
    priorityOverrides.filter(
      (event) =>
        event.suggestedValue ===
          "Medium" &&
        event.finalValue ===
          "High"
    ).length;

  const promptInstructions:
    string[] = [];

  /*
   * Require repeated behaviour before
   * converting evidence into instructions.
   */
  if (highToMediumCount >= 3) {
    promptInstructions.push(
      "The user frequently changes High-priority suggestions to Medium. Reserve High priority for clear urgency, meaningful consequences, or blocking risk."
    );
  }

  if (mediumToHighCount >= 3) {
    promptInstructions.push(
      "The user frequently changes Medium-priority suggestions to High. Give greater weight to impact, external commitments, and work that blocks other people."
    );
  }

  if (
    earlierMovements.length >= 3
  ) {
    promptInstructions.push(
      `The user often moves suggested dates earlier by approximately ${average(
        earlierMovements
      )} day(s). Consider adding an earlier planning buffer where appropriate.`
    );
  }

  if (
    laterMovements.length >= 3
  ) {
    promptInstructions.push(
      `The user often moves suggested dates later by approximately ${average(
        laterMovements
      )} day(s). Avoid overly aggressive scheduling when deadlines allow flexibility.`
    );
  }

  if (deferralEvents.length >= 3) {
    promptInstructions.push(
      "The user has deferred several tasks. Avoid overloading the plan and identify work at risk of repeated postponement."
    );
  }

  if (
    strongestCompletionPeriod
  ) {
    promptInstructions.push(
      `The user completes the most recorded work during the ${strongestCompletionPeriod}. Prefer that period for meaningful work when timing is relevant.`
    );
  }

  return {
    version: 1,
    totalEvents: events.length,

    priorityPatterns: {
      suggestionCount:
        prioritySuggestions.length,

      acceptedCount:
        priorityAcceptances.length,

      overrideCount:
        priorityOverrides.length,

      acceptanceRate: percentage(
        priorityAcceptances.length,
        prioritySuggestions.length
      ),

      highToMediumCount,
      mediumToHighCount,
      commonOverridesByCategory,
    },

    datePatterns: {
      suggestionCount:
        dateSuggestions.length,

      acceptedCount:
        dateAcceptances.length,

      overrideCount:
        dateOverrides.length,

      acceptanceRate: percentage(
        dateAcceptances.length,
        dateSuggestions.length
      ),

      movedEarlierCount:
        earlierMovements.length,

      movedLaterCount:
        laterMovements.length,

      averageDaysMovedEarlier:
        average(
          earlierMovements
        ),

      averageDaysMovedLater:
        average(
          laterMovements
        ),
    },

    executionPatterns: {
      completionCount:
        completionEvents.length,

      completionReversalCount:
        completionReversals.length,

      deferralCount:
        deferralEvents.length,

      averageDeferralsPerCompletedTask:
        completionEvents.length === 0
          ? 0
          : Number(
              (
                deferralEvents.length /
                completionEvents.length
              ).toFixed(2)
            ),

      strongestCompletionPeriod,
    },

    promptInstructions,

    updatedAt:
      new Date().toISOString(),
  };
};

/* ------------------------------------------------ */
/* Hook */
/* ------------------------------------------------ */

type UseMomentuhmMemoryOptions = {
  initialEvents?: PlanningEvent[];
};

export const useMomentuhmMemory = (
  options: UseMomentuhmMemoryOptions = {}
) => {
  const [planningEvents, setPlanningEvents] =
    useState<PlanningEvent[]>(
      Array.isArray(
        options.initialEvents
      )
        ? options.initialEvents
        : []
    );

  /*
   * The profile is derived from events.
   * We do not maintain duplicate profile state.
   */
  const userPlanningProfile =
    useMemo(
      () =>
        buildUserPlanningProfile(
          planningEvents
        ),
      [planningEvents]
    );

  const recordPlanningEvent =
    useCallback(
      (
        event: NewPlanningEvent
      ) => {
        const nextEvent:
          PlanningEvent = {
          ...event,

          id:
            crypto.randomUUID(),

          occurredAt:
            event.occurredAt ||
            new Date().toISOString(),
        };

        setPlanningEvents(
          (previousEvents) => [
            ...previousEvents,
            nextEvent,
          ]
        );

        return nextEvent;
      },
      []
    );

  const loadMemory = useCallback(
    (savedEvents: unknown) => {
      if (
        !Array.isArray(savedEvents)
      ) {
        setPlanningEvents([]);
        return;
      }

      const validEvents =
        savedEvents.filter(
          (
            event
          ): event is PlanningEvent =>
            Boolean(
              event &&
                typeof event ===
                  "object" &&
                "id" in event &&
                "type" in event &&
                "occurredAt" in
                  event
            )
        );

      setPlanningEvents(
        validEvents
      );
    },
    []
  );

  const forgetTaskMemory =
  useCallback(
    (taskId: string) => {
      setPlanningEvents(
        (previousEvents) =>
          previousEvents.filter(
            (event) => {
              if (
                event.taskId ===
                taskId
              ) {
                return false;
              }

              if (
                event.context
                  ?.taskIds?.includes(
                    taskId
                  )
              ) {
                return false;
              }

              return true;
            }
          )
      );
    },
    []
  );

const resetMemory =
  useCallback(() => {
    setPlanningEvents([]);
  }, []);

return {
  planningEvents,
  userPlanningProfile,
  recordPlanningEvent,
  loadMemory,
  forgetTaskMemory,
  resetMemory,
};
};