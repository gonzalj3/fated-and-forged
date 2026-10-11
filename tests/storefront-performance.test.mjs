import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const products = JSON.parse(read("data/arcade-products.json"));
const storefront = read("app/storefront.tsx");
const catalog = read("lib/store-catalog.ts");
const catalogRoute = read("app/api/catalog/route.ts");
const photoAnalysisRoute = read("app/api/analyze-photo/route.ts");
const memoryDesignRoute = read("app/api/memory-design/route.ts");
const layout = read("app/layout.tsx");
const nextConfig = read("next.config.ts");
const { extendCatalogWithArchive, isAllowedProductCandidate, isProductCollection, productCollections } = await import("../lib/store-catalog.ts");
const { extractExifDate } = await import("../lib/photo-memory.ts");
const { zodiacForDate } = await import("../lib/zodiac.ts");
const { buildMemoryPrompt } = await import("../lib/memory-prompt.ts");

test("bracelet collection is absent from the live storefront", () => {
  assert.doesNotMatch(storefront, /bracelet/i);
  assert.doesNotMatch(catalogRoute, /bracelet/i);
});

test("Everyday Stars is accepted while bracelets are rejected from every collection", () => {
  assert.equal(isAllowedProductCandidate({ collection: "everyday-stars", productType: "birth-chart stacking ring" }), true);
  assert.equal(products.length, 57);
  assert.equal(products.filter((product) => product.collection === "everyday-stars").length, 20);
  const expandedCatalog = extendCatalogWithArchive(products);
  assert.equal(expandedCatalog.length, 57);
  assert.equal(expandedCatalog.filter((product) => product.collection === "everyday-stars").length, 20);
  for (const product of products) {
    assert.equal(isProductCollection(product.collection), true);
    assert.equal(isAllowedProductCandidate({ collection: product.collection, productType: `${product.name} ${product.slug}` }), true);
  }
  for (const collection of productCollections) {
    assert.equal(isAllowedProductCandidate({ collection, productType: "bracelet" }), false);
  }
});

test("photo DateTimeOriginal metadata becomes the memory date", () => {
  const bytes = Buffer.alloc(76);
  bytes.set([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x48, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00]);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setUint16(20, 1, true);
  view.setUint16(22, 0x8769, true); view.setUint16(24, 4, true); view.setUint32(26, 1, true); view.setUint32(30, 26, true);
  view.setUint32(34, 0, true); view.setUint16(38, 1, true);
  view.setUint16(40, 0x9003, true); view.setUint16(42, 2, true); view.setUint32(44, 20, true); view.setUint32(48, 44, true);
  view.setUint32(52, 0, true); bytes.write("2026:10:11 14:30:00\0", 56, "ascii");
  assert.equal(extractExifDate(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)), "2026-10-11");
});

test("memory reveal uses the constellation for the captured date", () => {
  assert.equal(zodiacForDate("2026-03-20"), "Pisces");
  assert.equal(zodiacForDate("2026-03-21"), "Aries");
  assert.equal(zodiacForDate("2026-10-11"), "Libra");
  assert.match(storefront, /<DateConstellation date=\{memoryDate\}/);
  assert.match(storefront, /memory-product-reveal/);
  assert.match(storefront, /MEMORY_PRODUCTS_KEY/);
});

test("photo analysis runs automatically without revealing its description", () => {
  assert.doesNotMatch(storefront, /Analyze with DeepSeek|What DeepSeek sees/);
  assert.match(storefront, /await analyzeMemoryPhoto\(imageDataUrl\)/);
  assert.match(storefront, /fetch\("\/api\/analyze-photo"/);
  assert.match(storefront, /visualDescription/);
  assert.match(photoAnalysisRoute, /deepseek-flash/);
  assert.match(photoAnalysisRoute, /thinking: \{ type: "disabled" \}/);
  assert.match(photoAnalysisRoute, /detail: "low"/);
  assert.match(photoAnalysisRoute, /process\.env\.DEEPSEEK_API_KEY/);
  assert.doesNotMatch(photoAnalysisRoute, /sk-[a-z0-9]/i);
  assert.match(memoryDesignRoute, /visualDescription/);
  assert.doesNotMatch(memoryDesignRoute, /imageDataUrl/);
});

test("Arcade memory prompts never exceed 1000 characters", () => {
  const prompt = buildMemoryPrompt({
    material: "14k Yellow Gold",
    jewelryType: "necklace",
    memory: "memory ".repeat(200),
    visualDescription: "scene ".repeat(300),
    capturedAt: "2026-10-11",
    palette: ["#112233", "#445566", "#778899", "#aabbcc"],
  });
  assert.ok(prompt.length <= 1_000);
  assert.match(prompt, /2026-10-11/);
});

test("every catalog product has a lightweight local WebP", () => {
  let totalBytes = 0;
  for (const product of products) {
    const assetPath = new URL(`public/products/${product.slug}.webp`, root);
    assert.equal(existsSync(assetPath), true, `missing ${product.slug}.webp`);
    const bytes = statSync(assetPath).size;
    assert.ok(bytes <= 200_000, `${product.slug}.webp is ${bytes} bytes`);
    totalBytes += bytes;
    assert.equal(product.localAsset, `/products/${product.slug}.webp`);
  }
  assert.ok(totalBytes <= 1_500_000, `optimized catalog is ${totalBytes} bytes`);
  assert.match(catalog, /`\/products\/\$\{definition\.slug\}\.webp`/);
});

test("the hero image is preloaded and receives high fetch priority", () => {
  assert.match(layout, /rel="preload"/);
  assert.match(layout, /href="\/products\/solar-orbit-ring\.webp"/);
  assert.match(storefront, /fetchPriority=\{priority \? "high" : "auto"\}/);
  assert.match(storefront, /loading=\{priority \? "eager" : "lazy"\}/);
  assert.match(storefront, /decoding="async"/);
});

test("storefront reads are fully static and never fan out to Arcade", () => {
  assert.doesNotMatch(storefront, /fetch\("\/api\/catalog/);
  assert.match(storefront, /productArchive/);
  assert.match(storefront, /extendCatalogWithArchive\(productArchive\)/);
  assert.match(storefront, /presentArchivedProduct\(definition, archived\)/);
  assert.doesNotMatch(catalogRoute, /getProduct|@\/lib\/arcade/);
  assert.match(catalogRoute, /s-maxage=86400/);
  assert.match(catalogRoute, /stale-while-revalidate=604800/);
});

test("Vercel product assets receive immutable browser caching", () => {
  assert.match(nextConfig, /\/products\/:path\*/);
  assert.match(nextConfig, /max-age=31536000/);
  assert.match(nextConfig, /immutable/);
});

test("TLA+ model records the loading safety and progress properties", () => {
  const spec = read("specs/ImageLoading.tla");
  const config = read("specs/ImageLoading.cfg");
  assert.match(spec, /NoBracelets/);
  assert.match(spec, /HeroRequestedAtFirstPaint/);
  assert.match(spec, /LoadedImagesNeverRegress/);
  assert.match(spec, /OffscreenImagesEventuallyRequested/);
  assert.match(config, /INVARIANT NoBracelets/);
  assert.match(config, /PROPERTY OffscreenImagesEventuallyRequested/);
});
