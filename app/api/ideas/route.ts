import { NextResponse } from "next/server";
import { generateIdeas } from "@/lib/llmService";
import { fallbackIdeas } from "@/lib/fallbackContent";
import { IdeaRequestSchema } from "@/lib/validation";
import { clientKeyFrom, isRateLimited } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (isRateLimited(`ideas:${clientKeyFrom(req)}`)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = IdeaRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const ideas = await generateIdeas(parsed.data.brief, parsed.data.focusArea);
    return NextResponse.json({ ideas, source: "ai" });
  } catch (err) {
    console.error("generateIdeas failed, serving fallback:", err);
    return NextResponse.json({ ideas: fallbackIdeas(parsed.data.brief), source: "fallback" });
  }
}
