import { NextResponse } from "next/server";
import { getProduct } from "@/lib/arcade";
import { catalog, presentProduct } from "@/lib/store-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await Promise.all(catalog.map(async (definition) => presentProduct(definition, await getProduct(definition.productId))));
    return NextResponse.json({ products }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load the atelier" }, { status: 502 });
  }
}
