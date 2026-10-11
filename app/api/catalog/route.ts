import { NextResponse } from "next/server";
import productArchive from "@/data/arcade-products.json";
import { extendCatalogWithArchive, presentArchivedProduct } from "@/lib/store-catalog";

export const dynamic = "force-static";

export function GET() {
  try {
    const products = extendCatalogWithArchive(productArchive).map((definition) => {
      const archived = productArchive.find((product) => product.productId === definition.productId);
      if (!archived) throw new Error(`Missing archived product ${definition.productId}`);
      return presentArchivedProduct(definition, archived);
    });
    return NextResponse.json({ products }, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load the atelier" }, { status: 502 });
  }
}
