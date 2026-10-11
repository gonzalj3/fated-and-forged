import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { arcadeRequest } from "@/lib/arcade";

type CheckoutResult = { checkoutId: string; checkoutUrl: string };

export async function POST(request: Request) {
  try {
    const body = await request.json() as { lines?: { productId?: string; quantity?: number }[] };
    if (!Array.isArray(body.lines) || body.lines.length < 1 || body.lines.length > 10) return NextResponse.json({ error: "Choose at least one piece" }, { status: 400 });
    const lines = body.lines.map((line) => ({ productId: String(line.productId || ""), quantity: Number(line.quantity) }));
    if (lines.some((line) => !line.productId || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 10)) return NextResponse.json({ error: "Invalid bag" }, { status: 400 });
    const result = await arcadeRequest<CheckoutResult>("/checkouts/create", { requestId: `fated-checkout-${randomUUID()}`, lines, dropShip: true });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout is unavailable" }, { status: 502 });
  }
}
