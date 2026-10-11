import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { arcadeRequest } from "@/lib/arcade";
import { buildMemoryPrompt } from "@/lib/memory-prompt";

const categories = {
  ring: "23f9c1bf-2fb5-4412-85ba-91cfcf4cba50",
  necklace: "cb985ad9-3fe0-4163-8aea-3555dbdfaac9",
} as const;
const materials = new Set(["14k Gold Vermeil", "925 Sterling Silver", "14k Yellow Gold", "14k Rose Gold", "14k White Gold"]);

type Job = { jobId: string; kind: string; status: "running" | "succeeded" | "failed"; error: { message: string } | null };

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const memory = String(body.memory || "").trim();
    const capturedAt = String(body.capturedAt || "");
    const material = String(body.material || "");
    const jewelryType = String(body.jewelryType || "") as keyof typeof categories;
    const visualDescription = String(body.visualDescription || "").trim();
    const palette = Array.isArray(body.palette) ? body.palette.map(String).filter((color) => /^#[0-9a-f]{6}$/i.test(color)).slice(0, 5) : [];

    if (memory.length < 10 || memory.length > 500 || !/^\d{4}-\d{2}-\d{2}$/.test(capturedAt) || !materials.has(material) || !Object.hasOwn(categories, jewelryType) || palette.length === 0) {
      return NextResponse.json({ error: "Please add a photo, its date, and the memory you want to preserve" }, { status: 400 });
    }

    const prompt = buildMemoryPrompt({ material, jewelryType, memory, visualDescription, capturedAt, palette });
    const result = await arcadeRequest<Job>("/patterns/create", {
      requestId: `fated-memory-${randomUUID()}`,
      prompt,
      categoryId: categories[jewelryType],
    });
    return NextResponse.json({ ...result, collection: "everyday-stars", capturedAt, palette });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not turn this memory into jewelry" }, { status: 502 });
  }
}
