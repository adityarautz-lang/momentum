import { NextResponse } from "next/server";

type ExtractedTask = {
  title: string;
  priority: "Low" | "Medium" | "High";
  suggestedDueDate: string | null;
  category: string;
  notes: string;
  status: "Active" | "Waiting" | "Someday";
  reason: string;
  confidence: number;
  tags: string[];
};

const taskExtractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    tasks: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: {
            type: "string",
            description: "A short, clear action item title.",
          },
          priority: {
            type: "string",
            enum: ["Low", "Medium", "High"],
          },
          suggestedDueDate: {
            type: ["string", "null"],
            description:
              "A date in YYYY-MM-DD format if clearly implied, otherwise null.",
          },
          category: {
            type: "string",
            description:
              "Best matching category from the provided category list.",
          },
          notes: {
            type: "string",
            description:
              "Useful context from the pasted text. Keep it short.",
          },
          status: {
            type: "string",
            enum: ["Active", "Waiting", "Someday"],
          },
          reason: {
            type: "string",
            description:
              "Brief explanation for why this was extracted as a task.",
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
          },
          tags: {
            type: "array",
            items: {
              type: "string",
              enum: ["follow-up"],
            },
            description:
              "Task tags. Use ['follow-up'] only when the task is a follow-up with another person or external party. Otherwise use an empty array.",
          },
        },
        required: [
          "title",
          "priority",
          "suggestedDueDate",
          "category",
          "notes",
          "status",
          "reason",
          "confidence",
          "tags",
        ],
      },
    },
  },
  required: ["tasks"],
};

function getOutputText(data: any) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  const output = data.output || [];

  for (const item of output) {
    const content = item.content || [];

    for (const part of content) {
      if (part.type === "output_text" && typeof part.text === "string") {
        return part.text;
      }
    }
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const { text, categories, today } = await request.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Text is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const categoryList =
      Array.isArray(categories) && categories.length > 0
        ? categories.join(", ")
        : "Small Wins, Major Projects, Sustaining, Self Growth";

    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: `
You extract practical action items for a calm task-planning app called Veira.

Rules:
- Extract only clear or strongly implied action items.
- Do not create tasks from general background information.
- Do not invent deadlines.
- If a due date is clearly implied, return suggestedDueDate in YYYY-MM-DD format.
- If timing is vague or not actionable, use null.
- Use the provided current date for relative dates.
- Use one of the provided categories when possible.
- Keep titles short and action-oriented.
- Prefer verbs like Submit, Review, Call, Book, Prepare, Send, Follow up, Pay, Buy, Schedule.
- Return no more than 8 tasks.
- If there are no real action items, return an empty tasks array.

Tag rules:
- Allowed tags: ["follow-up"].
- Add "follow-up" when the task is about checking back with another person, team, manager, client, stakeholder, colleague, vendor, or external party.
- Add "follow-up" when the user needs to ask, remind, ping, nudge, chase, confirm, get approval, get a response, or continue a previous conversation.
- Add "follow-up" even if the exact words "follow up" are not used.
- Do not add "follow-up" for generic personal reminders unless another person or external party is involved.
- If no tag applies, return an empty array: [].
`.trim(),
          },
          {
            role: "user",
            content: `
Current date: ${today || "unknown"}

Available categories:
${categoryList}

Pasted text:
${text}
`.trim(),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "veira_task_extraction",
            strict: true,
            schema: taskExtractionSchema,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Failed to extract tasks from pasted text.",
        },
        { status: response.status }
      );
    }

    const outputText = getOutputText(data);

    if (!outputText) {
      return NextResponse.json({ tasks: [] });
    }

    const parsed = JSON.parse(outputText);

    const tasks: ExtractedTask[] = Array.isArray(parsed.tasks)
      ? parsed.tasks.map((task: any) => ({
          ...task,
          tags: Array.isArray(task.tags)
            ? task.tags.filter((tag: string) => tag === "follow-up")
            : [],
        }))
      : [];

    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract tasks.",
      },
      { status: 500 }
    );
  }
}