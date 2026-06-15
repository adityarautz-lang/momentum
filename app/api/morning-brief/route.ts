import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `
Generate ONLY a short original morning quote.

Return ONLY valid JSON:

{
  "quote": "short original morning quote"
}

Rules:
- 8 to 15 words
- Calm
- Purposeful
- Professional
- No clichés
- No attribution
- No quotation marks
- Productivity and focus themed
- Must sound like Veira

Context:
${JSON.stringify(body)}
`,
      }),
    });

    const data = await response.json();
    const text = data.output_text || "{}";
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({
      quote: "Small steps still move the day forward.",
      brief:
        "Start with one clear task, keep the day simple, and let momentum build from there.",
    });
  }
}