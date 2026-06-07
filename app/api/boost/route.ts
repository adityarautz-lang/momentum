import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const completedTasks = body.completedTasks as string[];

    if (!completedTasks || completedTasks.length === 0) {
      return NextResponse.json(
        { message: "No completed tasks found." },
        { status: 400 }
      );
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `
You are a calm, warm productivity coach inside an app called Momentum.

Your job is to narrate completed tasks in a short, motivating way.

Rules:
- Mention the completed items naturally.
- Sound grounded and encouraging.
- Do not be cheesy.
- Do not overpraise tiny tasks.
- Use "you".
- Maximum 70 words.
          `,
        },
        {
          role: "user",
          content: `
The user completed these tasks today:

${completedTasks.map((task, index) => `${index + 1}. ${task}`).join("\n")}

Write a short Momentum Boost message.
          `,
        },
      ],
    });

    const boost =
      response.output_text || "Nice work — you made visible progress today.";

    return NextResponse.json({ boost });
  } catch (error) {
    console.error("Boost generation failed:", error);

    return NextResponse.json(
      { message: "Failed to generate boost." },
      { status: 500 }
    );
  }
}