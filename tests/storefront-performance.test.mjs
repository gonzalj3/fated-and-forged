import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const products = JSON.parse(read("data/arcade-products.json"));
const storefront = read("app/storefront.tsx");
const catalog = read("lib/store-catalog.ts");
const catalogRoute = read("app/api/catalog/route.ts");
const layout = read("app/layout.tsx");

test("bracelet collection is absent from the live storefront", () => {
  assert.doesNotMatch(storefront, /bracelet/i);
  assert.doesNotMatch(catalog, /bracelet/i);
  assert.doesNotMatch(catalogRoute, /bracelet/i);
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
  assert.match(storefront, /`\/products\/\$\{product\.slug\}\.webp`/);
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
  assert.match(storefront, /productId: archived\.productId/);
  assert.doesNotMatch(catalogRoute, /getProduct|@\/lib\/arcade/);
  assert.match(catalogRoute, /s-maxage=86400/);
  assert.match(catalogRoute, /stale-while-revalidate=604800/);
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
