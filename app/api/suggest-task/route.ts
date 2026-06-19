import { NextResponse } from "next/server";

type RequestBody = {
  title: string;
  categories: string[];
  today: string;
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as RequestBody;
    const title = String(body.title || "").trim();
    const categories = Array.isArray(body.categories) ? body.categories : [];
    const today = String(body.today || "");

    if (!title) {
      return NextResponse.json(
        { error: "Task title is required." },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are Veira, a calm execution assistant. Your job is to interpret a captured task and suggest practical planning metadata. Return only valid JSON.",
          },
          {
            role: "user",
            content: `
Today is ${today}.

Available categories:
${categories.map((category) => `- ${category}`).join("\n")}

Task:
${title}

Return JSON only with this exact shape:
{
  "priority": "Low" | "Medium" | "High",
  "suggestedDueDate": "YYYY-MM-DD" | null,
  "category": string,
  "status": "Active" | "Waiting" | "Someday",
  "notes": string,
  "reason": string,
  "confidence": number,
  "tags": string[]
}

Rules:
- suggestedDueDate must be a real calendar date in YYYY-MM-DD format, or null.
- Use null if there is not enough evidence for a useful date.
- Do not over-schedule vague ideas.
- If the task involves another person, booking, submitting, paying, renewing, travel, paperwork, or a deadline, suggest a near-term date.
- Pick one of the available categories exactly.
- Keep notes short.
- reason should explain the suggestion in plain language.
- confidence should be between 0 and 1.

Tag rules:
- Allowed tags: ["follow-up"].
- Add "follow-up" when the task is about checking back with another person, team, manager, client, stakeholder, colleague, vendor, or external party.
- Add "follow-up" when the user needs to ask, remind, ping, nudge, chase, confirm, get approval, get a response, or continue a previous conversation.
- Add "follow-up" even if the exact words "follow up" are not used.
- Do not add "follow-up" for generic personal reminders unless another person or external party is involved.
- If no tag applies, return an empty array: [].
            `.trim(),
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "OpenAI request failed." },
        { status: response.status }
      );
    }

    const text =
      data.output?.[0]?.content?.[0]?.text ||
      data.output_text ||
      "";

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      suggestion: {
        priority: ["Low", "Medium", "High"].includes(parsed.priority)
          ? parsed.priority
          : "Medium",
        suggestedDueDate: parsed.suggestedDueDate || null,
        category: categories.includes(parsed.category)
          ? parsed.category
          : categories[0] || "Small Wins",
        status: ["Active", "Waiting", "Someday"].includes(parsed.status)
          ? parsed.status
          : "Active",
        notes: String(parsed.notes || ""),
        reason: String(parsed.reason || ""),
        confidence:
          typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.filter((tag: string) => tag === "follow-up")
          : [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to suggest task metadata.",
      },
      { status: 500 }
    );
  }
}