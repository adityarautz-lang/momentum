import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = String(body.title || "").trim();
    const role = String(body.role || "professional").trim();

    if (!title) {
      return NextResponse.json(
        { error: "Task title is required." },
        { status: 400 }
      );
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are Veira, a premium productivity assistant.

Generate exactly 3 reasons why a task matters.

Rules:
- Make suggestions role-aware.
- Be outcome-focused, not motivational.
- Keep each reason under 120 characters.
- Avoid generic phrases like "improve productivity".
- Do not repeat the task title.
- Return JSON only in this shape:
{
  "suggestions": ["reason 1", "reason 2", "reason 3"]
}
          `,
        },
        {
          role: "user",
          content: JSON.stringify({
            role,
            task: title,
          }),
        },
      ],
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .map((item: unknown) => String(item).trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

    return NextResponse.json({
      suggestions,
    });
  } catch (error) {
    console.error("why-matters error:", error);

    return NextResponse.json(
      { error: "Failed to generate why-this-matters suggestions." },
      { status: 500 }
    );
  }
}