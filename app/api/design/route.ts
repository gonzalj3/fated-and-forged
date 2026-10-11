import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { arcadeRequest } from "@/lib/arcade";

const RING_CATEGORY = "23f9c1bf-2fb5-4412-85ba-91cfcf4cba50";
const NECKLACE_CATEGORY = "cb985ad9-3fe0-4163-8aea-3555dbdfaac9";
const signs = new Set(["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]);
const materials = new Set(["14k Gold Vermeil", "925 Sterling Silver", "14k Yellow Gold", "14k Rose Gold", "14k White Gold"]);

type Job = { jobId: string; kind: string; status: "running" | "succeeded" | "failed"; error: { message: string } | null };

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const signOne = String(body.signOne || "");
    const signTwo = String(body.signTwo || "");
    const collection = String(body.collection || "");
    const story = String(body.story || "").trim();
    const material = String(body.material || "");
    if (!signs.has(signOne) || !signs.has(signTwo) || !materials.has(material) || !["engagement", "kinky"].includes(collection) || story.length < 10 || story.length > 350) return NextResponse.json({ error: "Please complete every design detail" }, { status: 400 });

    const prompt = collection === "engagement"
      ? `A refined ${material} dainty diamond engagement ring for a ${signOne} and ${signTwo} couple. Translate their shared energy into subtle celestial details: ${story}. Elegant, manufacturable, durable, low-profile, romantic and wearable.`
      : `A refined ${material} pendant necklace for a ${signOne} and ${signTwo} couple. Translate their private after-dark chemistry into subtle lock, link, collar or constellation-inspired geometry: ${story}. Sensual but discreet, elegant, manufacturable and wearable.`;
    const result = await arcadeRequest<Job>("/patterns/create", { requestId: `fated-custom-${randomUUID()}`, prompt, categoryId: collection === "engagement" ? RING_CATEGORY : NECKLACE_CATEGORY });
    return NextResponse.json({ ...result, collection, signs: `${signOne} × ${signTwo}` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start the design" }, { status: 502 });
  }
}
