import { NextResponse } from "next/server";
import { generateVendorBrief } from "@/lib/llmService";
import { fallbackVendorBrief } from "@/lib/fallbackContent";
import { VendorBriefRequestSchema } from "@/lib/validation";
import { vendorCategoriesFor } from "@/lib/vendorChecklist";
import { clientKeyFrom, isRateLimited } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (isRateLimited(`vendor-brief:${clientKeyFrom(req)}`)) {
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

  const parsed = VendorBriefRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const category = vendorCategoriesFor(parsed.data.brief.eventType).find(
    (c) => c.id === parsed.data.vendorCategoryId
  );
  if (!category) {
    return NextResponse.json({ error: "Unknown vendor category." }, { status: 400 });
  }

  try {
    const result = await generateVendorBrief(
      parsed.data.brief,
      category.label,
      category.baseQuestions
    );
    return NextResponse.json({ ...result, source: "ai" });
  } catch (err) {
    console.error("generateVendorBrief failed, serving fallback:", err);
    return NextResponse.json({ ...fallbackVendorBrief(category.label), source: "fallback" });
  }
}
