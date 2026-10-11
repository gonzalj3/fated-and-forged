import { NextResponse } from "next/server";
import { getProduct } from "@/lib/arcade";
import { braceletConcepts, catalog, presentBraceletConcept, presentProduct } from "@/lib/store-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pricedProducts = await Promise.all(catalog.map(async (definition) => presentProduct(definition, await getProduct(definition.productId))));
    const products = [...pricedProducts, ...braceletConcepts.map(presentBraceletConcept)];
    return NextResponse.json({ products }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load the atelier" }, { status: 502 });
  }
}
