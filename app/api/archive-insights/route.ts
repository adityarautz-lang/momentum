import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ArchiveInsightRequest = {
  totalClosed?: number;
  closedLastSevenDays?: number;
  averagePerDay?: string | number;
  topCategory?: string;
  categoryBreakdown?: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
  taskTypeBreakdown?: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
  productivityRhythm?: Array<{
    label: string;
    count: number;
  }>;
  peakProductivityPeriod?: string;
  currentStreak?: number;
  longestStreak?: number;
  recentTasks?: Array<{
    title: string;
    category: string;
    priority: string;
    completedAt: string | null;
  }>;
};

const readOutputText = (responseData: any) => {
  if (
    typeof responseData?.output_text ===
    "string"
  ) {
    return responseData.output_text;
  }

  const outputItems = Array.isArray(
    responseData?.output
  )
    ? responseData.output
    : [];

  for (const outputItem of outputItems) {
    const contentItems = Array.isArray(
      outputItem?.content
    )
      ? outputItem.content
      : [];

    for (const contentItem of contentItems) {
      if (
        contentItem?.type ===
          "output_text" &&
        typeof contentItem?.text ===
          "string"
      ) {
        return contentItem.text;
      }
    }
  }

  return "";
};

export async function POST(
  request: Request
) {
  try {
    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      (await request.json()) as ArchiveInsightRequest;

    const totalClosed = Math.max(
      0,
      Number(body.totalClosed || 0)
    );

    if (totalClosed < 5) {
      return NextResponse.json(
        {
          error:
            "At least five archived tasks are required.",
        },
        {
          status: 400,
        }
      );
    }

    const analyticsPayload = {
      totalClosed,
      closedLastSevenDays: Math.max(
        0,
        Number(
          body.closedLastSevenDays || 0
        )
      ),
      averagePerDay:
        body.averagePerDay || "0.0",
      topCategory:
        body.topCategory || "Unknown",
      categoryBreakdown: Array.isArray(
        body.categoryBreakdown
      )
        ? body.categoryBreakdown.slice(
            0,
            6
          )
        : [],
      taskTypeBreakdown: Array.isArray(
        body.taskTypeBreakdown
      )
        ? body.taskTypeBreakdown.slice(
            0,
            6
          )
        : [],
      productivityRhythm: Array.isArray(
        body.productivityRhythm
      )
        ? body.productivityRhythm
        : [],
      peakProductivityPeriod:
        body.peakProductivityPeriod ||
        "Unknown",
      currentStreak: Math.max(
        0,
        Number(body.currentStreak || 0)
      ),
      longestStreak: Math.max(
        0,
        Number(body.longestStreak || 0)
      ),
      recentTasks: Array.isArray(
        body.recentTasks
      )
        ? body.recentTasks
            .slice(0, 40)
            .map((task) => ({
              title: String(
                task.title || ""
              ).slice(0, 160),
              category: String(
                task.category ||
                  "No category"
              ).slice(0, 80),
              priority: String(
                task.priority ||
                  "No priority"
              ).slice(0, 30),
              completedAt:
                task.completedAt || null,
            }))
        : [],
    };

    const openAIResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          model:
            process.env.OPENAI_MODEL ||
            "gpt-5.6",
          store: false,
          max_output_tokens: 280,
          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text: [
                    "You are the analytics layer inside Momentuhm, a task and focus application.",
                    "Interpret the supplied completion data and identify the user's strongest execution pattern.",
                    "Use only the supplied information.",
                    "Do not invent task counts, percentages, dates, habits, motivations, or personal traits.",
                    "Do not diagnose the user.",
                    "Keep the language practical, concise, professional, and encouraging.",
                    "Do not use emojis.",
                    "The headline must contain no more than 8 words.",
                    "The summary must contain no more than 35 words.",
                    "The recommendation must contain no more than 25 words.",
                  ].join(" "),
                },
              ],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: JSON.stringify(
                    analyticsPayload
                  ),
                },
              ],
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "archive_focus_insight",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  headline: {
                    type: "string",
                  },
                  summary: {
                    type: "string",
                  },
                  recommendation: {
                    type: "string",
                  },
                },
                required: [
                  "headline",
                  "summary",
                  "recommendation",
                ],
              },
            },
          },
        }),
      }
    );

    const responseData =
      await openAIResponse.json();

    if (!openAIResponse.ok) {
      console.error(
        "Archive insights API error:",
        responseData
      );

      return NextResponse.json(
        {
          error:
            responseData?.error
              ?.message ||
            "The AI insight could not be generated.",
        },
        {
          status: 502,
        }
      );
    }

    const outputText =
      readOutputText(responseData);

    if (!outputText) {
      throw new Error(
        "The AI response was empty."
      );
    }

    const parsedInsight =
      JSON.parse(outputText);

    return NextResponse.json({
      insight: {
        headline: String(
          parsedInsight.headline || ""
        ).trim(),
        summary: String(
          parsedInsight.summary || ""
        ).trim(),
        recommendation: String(
          parsedInsight.recommendation ||
            ""
        ).trim(),
      },
    });
  } catch (error) {
    console.error(
      "Failed to create archive insight:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Momentuhm could not analyze the archive.",
      },
      {
        status: 500,
      }
    );
  }
}
