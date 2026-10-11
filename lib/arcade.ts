const ARCADE_BASE_URL = "https://platform.arcade.ai/v1";

export async function arcadeRequest<T>(path: string, body: unknown): Promise<T> {
  const apiKey = process.env.ARCADE_API_KEY;
  if (!apiKey) throw new Error("Arcade is not configured");

  const response = await fetch(`${ARCADE_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "fated-and-forged/0.1 (SF Tech Week hackathon)",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data === "object" && "message" in data ? String(data.message) : `Arcade request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export type ArcadeProduct = {
  productId: string;
  title: string;
  categoryId: string;
  maker: { makerId: string; name: string };
  selections: Record<string, string>;
  selectionLabel: string;
  imageUrl: string;
  images: { url: string }[];
  description: string | null;
  patternId: string;
  unitPrice: { amount: string; currency: string } | null;
};

export async function getProduct(productId: string) {
  return arcadeRequest<ArcadeProduct>("/products/get", { productId, quantity: 1 });
}
