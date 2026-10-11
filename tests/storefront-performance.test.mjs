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
const celestialClient = read("lib/celestial-client.ts");
const layout = read("app/layout.tsx");
const nextConfig = read("next.config.ts");
const { extendCatalogWithArchive, isAllowedProductCandidate, isProductCollection, productCollections } = await import("../lib/store-catalog.ts");
const { extractExifDate, extractPhotoMetadata } = await import("../lib/photo-memory.ts");
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

test("photo metadata supplies the exact capture time, UTC offset, and GPS position", () => {
  const bytes = Buffer.alloc(252);
  bytes.set([0xff, 0xd8, 0xff, 0xe1]);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setUint16(4, 248); bytes.write("Exif\0\0", 6, "ascii"); bytes.write("II", 12, "ascii");
  view.setUint16(14, 42, true); view.setUint32(16, 8, true); view.setUint16(20, 2, true);
  view.setUint16(22, 0x8769, true); view.setUint16(24, 4, true); view.setUint32(26, 1, true); view.setUint32(30, 50, true);
  view.setUint16(34, 0x8825, true); view.setUint16(36, 4, true); view.setUint32(38, 1, true); view.setUint32(42, 100, true); view.setUint32(46, 0, true);
  view.setUint16(62, 2, true);
  view.setUint16(64, 0x9003, true); view.setUint16(66, 2, true); view.setUint32(68, 20, true); view.setUint32(72, 160, true);
  view.setUint16(76, 0x9011, true); view.setUint16(78, 2, true); view.setUint32(80, 7, true); view.setUint32(84, 180, true); view.setUint32(88, 0, true);
  view.setUint16(112, 4, true);
  view.setUint16(114, 1, true); view.setUint16(116, 2, true); view.setUint32(118, 2, true); bytes.write("N\0", 122, "ascii");
  view.setUint16(126, 2, true); view.setUint16(128, 5, true); view.setUint32(130, 3, true); view.setUint32(134, 188, true);
  view.setUint16(138, 3, true); view.setUint16(140, 2, true); view.setUint32(142, 2, true); bytes.write("W\0", 146, "ascii");
  view.setUint16(150, 4, true); view.setUint16(152, 5, true); view.setUint32(154, 3, true); view.setUint32(158, 212, true); view.setUint32(162, 0, true);
  bytes.write("2026:10:11 21:30:00\0", 172, "ascii"); bytes.write("-07:00\0", 192, "ascii");
  [[37, 1], [46, 1], [2964, 100]].forEach(([n, d], index) => { view.setUint32(200 + index * 8, n, true); view.setUint32(204 + index * 8, d, true); });
  [[122, 1], [25, 1], [984, 100]].forEach(([n, d], index) => { view.setUint32(224 + index * 8, n, true); view.setUint32(228 + index * 8, d, true); });
  const metadata = extractPhotoMetadata(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  assert.equal(metadata.capturedAt, "2026-10-11T21:30:00");
  assert.equal(metadata.timezoneOffset, "-07:00");
  assert.ok(Math.abs(metadata.latitude - 37.7749) < 0.0001);
  assert.ok(Math.abs(metadata.longitude - -122.4194) < 0.0001);
});

test("memory reveal calculates the historical sky locally before showing the product", () => {
  assert.equal(zodiacForDate("2026-03-20"), "Pisces");
  assert.equal(zodiacForDate("2026-03-21"), "Aries");
  assert.equal(zodiacForDate("2026-10-11"), "Libra");
  assert.match(storefront, /<HistoricalSky date=\{memoryDate\}/);
  assert.match(storefront, /memory-product-reveal/);
  assert.match(storefront, /MEMORY_PRODUCTS_KEY/);
  assert.match(celestialClient, /projection: "airy"/);
  assert.match(celestialClient, /follow: "zenith"/);
  assert.match(celestialClient, /celestial\.skyview/);
  assert.doesNotMatch(celestialClient, /fetch\(|https?:\/\//);
  for (const asset of ["d3.min.js", "d3.geo.projection.min.js", "celestial.min.js", "data/stars.6.json", "data/constellations.lines.json"]) {
    assert.equal(existsSync(new URL(`public/celestial/${asset}`, root)), true, `missing local sky asset ${asset}`);
  }
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
    capturedTime: "21:30",
    timezoneOffset: "-07:00",
    latitude: 37.7749,
    longitude: -122.4194,
    palette: ["#112233", "#445566", "#778899", "#aabbcc"],
  });
  assert.ok(prompt.length <= 1_000);
  assert.match(prompt, /2026-10-11/);
  assert.match(prompt, /37\.7749, -122\.4194/);
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
  assert.match(nextConfig, /\/celestial\/:path\*/);
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
