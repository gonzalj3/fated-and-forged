import { NextResponse } from "next/server";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MAX_IMAGE_DATA_URL_LENGTH = 6_000_000;

type DeepSeekResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Photo analysis is not configured" }, { status: 503 });
    }

    const body = await request.json() as Record<string, unknown>;
    const imageDataUrl = String(body.imageDataUrl || "");
    if (!/^data:image\/(jpeg|png|webp);base64,/i.test(imageDataUrl) || imageDataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return NextResponse.json({ error: "Choose a JPG, PNG, or WebP photo under 12 MB" }, { status: 400 });
    }

    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-flash",
        thinking: { type: "disabled" },
        max_tokens: 220,
        temperature: 0.2,
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this photograph in 2-4 concise sentences for a jewelry designer. State the visible people or subjects, setting, action, mood, colors, shapes, and meaningful objects. Suggest visual motifs that could become an elegant ring or necklace. Do not identify people or infer sensitive traits. Return only the description.",
            },
            { type: "image_url", image_url: { url: imageDataUrl, detail: "low" } },
          ],
        }],
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null) as DeepSeekResponse | null;
    const description = data?.choices?.[0]?.message?.content?.trim();
    if (!response.ok || !description) {
      throw new Error(data?.error?.message || `DeepSeek photo analysis failed (${response.status})`);
    }

    return NextResponse.json({ description: description.slice(0, 1_200), model: "deepseek-flash" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not analyze this photo" }, { status: 502 });
  }
}
