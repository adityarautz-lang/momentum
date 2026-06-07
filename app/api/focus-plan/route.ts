import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const tasks = body.tasks || [];
    const today = body.today;
    const completedTodayCount = body.completedTodayCount || 0;

    if (!tasks.length) {
      return NextResponse.json(
        { message: "No active tasks available." },
        { status: 400 }
      );
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `
You are the focus-planning engine inside a productivity app called Momentum.

Your job is to choose the best 3 tasks for the user to focus on next.

Important:
- Do not simply choose the earliest due dates.
- Consider priority, urgency, likely real-world consequences, blockers, admin burden, effort, and momentum value.
- Prefer tasks that reduce risk, unlock other work, or create meaningful progress.
- Return only valid JSON.
- Do not include markdown.
- Do not invent task IDs.
- Use only task IDs provided by the user.

Return this exact JSON shape:
{
  "focusTaskIds": ["task-id-1", "task-id-2", "task-id-3"],
  "summary": "One short sentence explaining the overall focus strategy.",
  "reasons": {
    "task-id-1": "Short reason for why this task is ranked here.",
    "task-id-2": "Short reason for why this task is ranked here.",
    "task-id-3": "Short reason for why this task is ranked here."
  }
}
          `,
        },
        {
          role: "user",
          content: JSON.stringify({
            today,
            completedTodayCount,
            tasks,
          }),
        },
      ],
    });

    const raw = response.output_text || "{}";

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { message: "AI returned invalid focus JSON." },
        { status: 500 }
      );
    }

    const validTaskIds = new Set(tasks.map((task: any) => task.id));

    const focusTaskIds = (parsed.focusTaskIds || [])
      .filter((taskId: string) => validTaskIds.has(taskId))
      .slice(0, 3);

    if (focusTaskIds.length === 0) {
      return NextResponse.json(
        { message: "AI did not return valid task IDs." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      focusTaskIds,
      summary:
        parsed.summary ||
        "Momentum selected the strongest next tasks based on urgency and impact.",
      reasons: parsed.reasons || {},
    });
  } catch (error) {
    console.error("Focus plan generation failed:", error);

    return NextResponse.json(
      { message: "Failed to generate focus plan." },
      { status: 500 }
    );
  }
}