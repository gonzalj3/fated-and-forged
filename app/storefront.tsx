"use client";

import { ArrowDown, ArrowRight, Asterisk, Camera, Check, LoaderCircle, Menu, Minus, Plus, ShoppingBag, Sparkles, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import productArchive from "@/data/arcade-products.json";
import { extendCatalogWithArchive, presentArchivedProduct, type ProductCollection } from "@/lib/store-catalog";
import { extractExifDate } from "@/lib/photo-memory";
import { zodiacForDate, type ZodiacSign } from "@/lib/zodiac";

type Product = {
  productId: string; slug: string; name: string; subtitle: string;
  collection: ProductCollection; signs: string; imageUrl: string;
  images: { url: string }[]; material: string; maker: string;
  description: string; price: { amount: string; currency: string } | null;
  availability?: "priced";
};
type CartLine = Product & { quantity: number };
type CheckoutResponse = { checkoutUrl?: string };
type DesignResponse = { jobId?: string; error?: string };
type PhotoAnalysisResponse = { description?: string; error?: string };
type DesignJobResponse = {
  status?: "running" | "succeeded" | "failed";
  error?: string | { message?: string };
  product?: {
    productId: string;
    imageUrl: string;
    images?: { url: string }[];
    selections?: Record<string, string>;
    maker?: { name?: string };
    description?: string | null;
    unitPrice: Product["price"];
  };
};

const fallbackProducts = extendCatalogWithArchive(productArchive).map((definition) => {
  const archived = productArchive.find((product) => product.productId === definition.productId);
  if (!archived) throw new Error(`Missing archived product data for ${definition.slug}`);
  return presentArchivedProduct(definition, archived);
}) as Product[];

const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const collectionLabels: Record<ProductCollection, string> = { engagement: "The Proposal", kinky: "After Dark", "everyday-stars": "Everyday Stars" };
const collectionFilters = ["all", "engagement", "kinky", "everyday-stars"] as const;
const MEMORY_PRODUCTS_KEY = "fated-and-forged-memory-products";
const constellationPoints: Record<ZodiacSign, Array<[number, number]>> = {
  Aries: [[12, 42], [28, 34], [44, 37], [61, 22], [84, 27]],
  Taurus: [[10, 18], [26, 30], [42, 34], [57, 50], [72, 38], [90, 46]],
  Gemini: [[18, 14], [24, 49], [43, 37], [59, 18], [67, 51], [84, 40]],
  Cancer: [[12, 31], [30, 22], [46, 37], [65, 43], [86, 31]],
  Leo: [[10, 48], [27, 37], [43, 42], [55, 24], [73, 18], [88, 31]],
  Virgo: [[10, 20], [25, 34], [40, 18], [53, 40], [70, 29], [88, 47]],
  Libra: [[12, 39], [30, 21], [49, 28], [68, 18], [87, 38]],
  Scorpio: [[9, 20], [24, 31], [39, 23], [53, 39], [69, 34], [85, 49], [92, 30]],
  Sagittarius: [[9, 49], [28, 39], [44, 20], [61, 35], [78, 15], [88, 31]],
  Capricorn: [[10, 20], [27, 31], [41, 49], [58, 39], [73, 18], [89, 26]],
  Aquarius: [[8, 25], [24, 37], [40, 25], [57, 40], [73, 28], [91, 38]],
  Pisces: [[10, 20], [27, 32], [43, 47], [58, 33], [75, 43], [91, 25]],
};

function money(price: Product["price"]) {
  if (!price) return "Pricing…";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: price.currency, maximumFractionDigits: 0 }).format(Number(price.amount));
}

function ProductArtwork({ product, priority = false }: { product: Product; priority?: boolean }) {
  if (product.imageUrl) return <img src={product.imageUrl} alt={`${product.name}, ${product.material}`} className="product-image" width={1024} height={1024} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" />;
  return <div className="placeholder-art" aria-label="Arcade product render in progress"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><Sparkles size={28} strokeWidth={1} /><span>Arcade is crafting this render</span></div>;
}

function DateConstellation({ date }: { date: string }) {
  const sign = zodiacForDate(date);
  const points = constellationPoints[sign];
  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  return <div className="memory-constellation memory-stage" aria-live="polite">
    <p className="eyebrow">The sky on your date</p>
    <svg viewBox="0 0 100 64" role="img" aria-label={`${sign} constellation`}>
      <polyline points={line} />
      {points.map(([x, y], index) => <circle key={`${x}-${y}`} cx={x} cy={y} r={index % 3 === 0 ? 2.1 : 1.35} />)}
    </svg>
    <h2 id="memory-title">{sign}</h2>
    <p>{date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Your captured date"}</p>
    <span><LoaderCircle className="spin" size={16} /> Arcade is translating this memory into metal</span>
  </div>;
}

function isStoredMemoryProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<Product>;
  return typeof product.productId === "string" && typeof product.imageUrl === "string" && product.collection === "everyday-stars" && product.slug?.startsWith("memory-") === true;
}

async function extractPhotoPalette(imageUrl: string) {
  const image = new Image();
  image.src = imageUrl;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return ["#8b5e6e"];
  context.drawImage(image, 0, 0, 48, 48);
  const pixels = context.getImageData(0, 0, 48, 48).data;
  const buckets = new Map<string, number>();
  for (let index = 0; index < pixels.length; index += 16) {
    if (pixels[index + 3] < 180) continue;
    const red = Math.round(pixels[index] / 32) * 32;
    const green = Math.round(pixels[index + 1] / 32) * 32;
    const blue = Math.round(pixels[index + 2] / 32) * 32;
    if ((red > 224 && green > 224 && blue > 224) || (red < 32 && green < 32 && blue < 32)) continue;
    const color = `#${[red, green, blue].map((value) => Math.min(value, 255).toString(16).padStart(2, "0")).join("")}`;
    buckets.set(color, (buckets.get(color) || 0) + 1);
  }
  const palette = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([color]) => color);
  return palette.length ? palette : ["#8b5e6e"];
}

async function preparePhotoForVision(imageUrl: string) {
  const image = new Image();
  image.src = imageUrl;
  await image.decode();
  const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the photo");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [activeCollection, setActiveCollection] = useState<"all" | ProductCollection>("all");
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memoryPreview, setMemoryPreview] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [memoryDateNote, setMemoryDateNote] = useState("");
  const [memoryPalette, setMemoryPalette] = useState<string[]>([]);
  const [memoryImageDataUrl, setMemoryImageDataUrl] = useState("");
  const [visualDescription, setVisualDescription] = useState("");
  const [visionState, setVisionState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [visionMessage, setVisionMessage] = useState("");
  const [memoryState, setMemoryState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [memoryMessage, setMemoryMessage] = useState("");
  const [memoryProduct, setMemoryProduct] = useState<Product | null>(null);
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "error">("idle");
  const [designState, setDesignState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [designMessage, setDesignMessage] = useState("");

  const visibleProducts = useMemo(() => activeCollection === "all" ? products : products.filter((product) => product.collection === activeCollection), [products, activeCollection]);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price?.amount || 0) * item.quantity, 0);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(MEMORY_PRODUCTS_KEY) || "[]") as unknown;
      if (!Array.isArray(stored)) return;
      const savedProducts = stored.filter(isStoredMemoryProduct);
      setProducts((current) => [...savedProducts, ...current.filter((product) => !savedProducts.some((saved) => saved.productId === product.productId))]);
    } catch { /* Ignore invalid browser storage. */ }
  }, []);

  function addToCart(product: Product) {
    setCart((current) => { const found = current.find((item) => item.productId === product.productId); return found ? current.map((item) => item.productId === product.productId ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }]; });
    setSelected(null); setCartOpen(true);
  }
  function changeQuantity(productId: string, delta: number) { setCart((current) => current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0)); }
  async function checkout() {
    setCheckoutState("loading");
    try { const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: cart.map(({ productId, quantity }) => ({ productId, quantity })) }) }); const data = await response.json() as CheckoutResponse; if (!response.ok || !data.checkoutUrl) throw new Error(); window.location.href = data.checkoutUrl; } catch { setCheckoutState("error"); }
  }
  async function submitDesign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setDesignState("loading"); setDesignMessage("");
    const details = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    try {
      const response = await fetch("/api/design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(details) });
      const data = await response.json() as DesignResponse;
      if (!response.ok || !data.jobId) throw new Error(data.error || "Could not start the design");
      for (let attempt = 0; attempt < 45; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        const jobResponse = await fetch(`/api/job?jobId=${encodeURIComponent(data.jobId)}`);
        const job = await jobResponse.json() as DesignJobResponse;
        const jobError = typeof job.error === "string" ? job.error : job.error?.message;
        if (!jobResponse.ok || job.status === "failed") throw new Error(jobError || "Arcade could not manufacture this design");
        if (job.status === "succeeded" && job.product) {
          const custom: Product = { productId: job.product.productId, slug: `custom-${job.product.productId}`, name: "Your Celestial One-of-One", subtitle: "Generated from your chemistry", collection: details.collection as ProductCollection, signs: `${details.signOne} × ${details.signTwo}`, imageUrl: job.product.imageUrl, images: job.product.images || [], material: job.product.selections?.material || details.material, maker: job.product.maker?.name || "Arcade maker network", description: job.product.description || details.story, price: job.product.unitPrice };
          setProducts((current) => [custom, ...current]);
          setActiveCollection("all");
          setDesignState("done");
          setDesignMessage(`Arcade created and priced your ${details.collection === "engagement" ? "ring" : "necklace"}. It is now the first piece in the atelier below.`);
          return;
        }
      }
      throw new Error("Your design is still being crafted. Keep this page open and try again in a moment.");
    } catch (error) { setDesignState("error"); setDesignMessage(error instanceof Error ? error.message : "Could not start the design."); }
  }

  async function selectMemoryPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 12_000_000) {
      setMemoryState("error"); setMemoryMessage("Choose a JPG, PNG, or WebP image under 12 MB."); return;
    }
    try {
      const exifDate = extractExifDate(await file.arrayBuffer());
      const fallbackDate = file.lastModified ? new Date(file.lastModified).toISOString().slice(0, 10) : "";
      if (memoryPreview) URL.revokeObjectURL(memoryPreview);
      const preview = URL.createObjectURL(file);
      setMemoryPreview(preview);
      setMemoryDate(exifDate || fallbackDate);
      setMemoryDateNote(exifDate ? "Capture date found in photo metadata" : "No EXIF capture date found—please check the suggested file date");
      const [palette, imageDataUrl] = await Promise.all([extractPhotoPalette(preview), preparePhotoForVision(preview)]);
      setMemoryPalette(palette);
      setMemoryImageDataUrl(imageDataUrl);
      setVisualDescription(""); setVisionState("idle"); setVisionMessage("");
      setMemoryProduct(null); setMemoryState("idle"); setMemoryMessage("");
    } catch {
      setMemoryState("error"); setMemoryMessage("We could not read that photo. Try another image.");
    }
  }

  async function analyzeMemoryPhoto() {
    if (!memoryImageDataUrl) { setVisionState("error"); setVisionMessage("Choose a photo first."); return; }
    setVisionState("loading"); setVisionMessage("");
    try {
      const response = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: memoryImageDataUrl }),
      });
      const data = await response.json() as PhotoAnalysisResponse;
      if (!response.ok || !data.description) throw new Error(data.error || "Could not analyze this photo");
      setVisualDescription(data.description);
      setVisionState("done");
    } catch (error) {
      setVisionState("error");
      setVisionMessage(error instanceof Error ? error.message : "Could not analyze this photo");
    }
  }

  async function submitMemoryDesign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!memoryPreview || memoryPalette.length === 0) { setMemoryState("error"); setMemoryMessage("Add a photo before creating the piece."); return; }
    setMemoryState("loading"); setMemoryMessage("");
    const details = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    try {
      const response = await fetch("/api/memory-design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...details, capturedAt: memoryDate, palette: memoryPalette, visualDescription }) });
      const data = await response.json() as DesignResponse;
      if (!response.ok || !data.jobId) throw new Error(data.error || "Could not start the memory design");
      for (let attempt = 0; attempt < 45; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        const jobResponse = await fetch(`/api/job?jobId=${encodeURIComponent(data.jobId)}`);
        const job = await jobResponse.json() as DesignJobResponse;
        const jobError = typeof job.error === "string" ? job.error : job.error?.message;
        if (!jobResponse.ok || job.status === "failed") throw new Error(jobError || "Arcade could not manufacture this memory");
        if (job.status === "succeeded" && job.product) {
          const custom: Product = { productId: job.product.productId, slug: `memory-${job.product.productId}`, name: "Your Memory, Forged", subtitle: `Captured ${memoryDate}`, collection: "everyday-stars", signs: zodiacForDate(memoryDate), imageUrl: job.product.imageUrl, images: job.product.images || [], material: job.product.selections?.material || details.material, maker: job.product.maker?.name || "Arcade maker network", description: job.product.description || details.memory, price: job.product.unitPrice };
          setProducts((current) => [custom, ...current]);
          setMemoryProduct(custom);
          try {
            const stored = JSON.parse(localStorage.getItem(MEMORY_PRODUCTS_KEY) || "[]") as unknown;
            const savedProducts = Array.isArray(stored) ? stored.filter(isStoredMemoryProduct) : [];
            localStorage.setItem(MEMORY_PRODUCTS_KEY, JSON.stringify([custom, ...savedProducts.filter((product) => product.productId !== custom.productId)].slice(0, 12)));
          } catch { /* The product still remains in this session if storage is unavailable. */ }
          setActiveCollection("all"); setMemoryState("done");
          setMemoryMessage("Arcade created and priced a one-of-one piece from your memory, photo palette, and date.");
          return;
        }
      }
      throw new Error("Your memory is still being crafted. Keep this page open and try again in a moment.");
    } catch (error) { setMemoryState("error"); setMemoryMessage(error instanceof Error ? error.message : "Could not start the memory design."); }
  }

  function showMemoryInStorefront() {
    setMemoryOpen(false);
    setActiveCollection("all");
    requestAnimationFrame(() => document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" }));
  }

  return <main>
    <div className="announcement">Generated by Arcade — Made to order by independent artisans</div>
    <header className="site-header">
      <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button>
      <a href="#top" className="brand" aria-label="Fated and Forged home"><span>FATED</span><i>×</i><span>FORGED</span></a>
      <nav className={menuOpen ? "nav-open" : ""} aria-label="Primary navigation">
        <a href="#shop" onClick={() => { setActiveCollection("engagement"); setMenuOpen(false); }}>The Proposal</a><a href="#shop" onClick={() => { setActiveCollection("kinky"); setMenuOpen(false); }}>After Dark</a><a href="#shop" onClick={() => { setActiveCollection("everyday-stars"); setMenuOpen(false); }}>Everyday Stars</a><a href="#story" onClick={() => setMenuOpen(false)}>Our story</a><button onClick={() => { setMemoryOpen(true); setMenuOpen(false); }}>Photo → jewelry</button><button onClick={() => { setDesignOpen(true); setMenuOpen(false); }}>Design yours</button>
      </nav>
      <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Open cart with ${cartCount} items`}><ShoppingBag size={19} strokeWidth={1.5} /><span>Bag</span><b>{cartCount}</b></button>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow"><Asterisk size={13} /> Jewelry for two bodies, one orbit</p>
        <h1>Your chemistry,<br /><em>cast in metal.</em></h1>
        <p className="hero-lede">Fine jewelry imagined from your star signs, shared mythology, and private language—then made on demand by world-class artisans.</p>
        <div className="hero-actions"><button className="primary-button" onClick={() => setDesignOpen(true)}>Design with your signs <Sparkles size={16} /></button><button className="primary-button photo-primary" onClick={() => setMemoryOpen(true)}>Create from a photo <Camera size={16} /></button><a href="#shop" className="text-link">Shop the collection <ArrowDown size={15} /></a></div>
        <div className="hero-note"><span>01</span><p>No inventory. No sameness.<br />Every piece begins with a prompt.</p></div>
      </div>
      <div className="hero-visual" aria-label="Celestial jewelry composition">
        <div className="zodiac-wheel">{signs.map((sign, index) => <span key={sign} style={{ "--i": index } as React.CSSProperties}>{sign.slice(0, 2)}</span>)}<div className="wheel-center"><i>F&amp;F</i><small>YOUR<br />ORBIT</small></div></div>
        <div className="hero-product-card"><span className="card-index">THE FIRST DROP / 01</span><ProductArtwork product={products[0]} priority /><div><b>{products[0].name}</b><span>{products[0].signs}</span></div></div>
      </div>
    </section>

    <section className="manifesto" id="story"><p>Not your birth chart on a charm.</p><h2>We translate the tension between two people into an object worth keeping.</h2><div className="manifesto-details"><span>Designed with AI</span><span>Made by hand</span><span>Priced instantly</span><span>Shipped on demand</span></div></section>

    <section className="shop-section" id="shop">
      <div className="shop-heading"><div><p className="eyebrow"><Asterisk size={13} /> The first drop</p><h2>Choose your constellation.</h2></div><div className="collection-tabs" role="tablist" aria-label="Filter products">{collectionFilters.map((collection) => <button key={collection} className={activeCollection === collection ? "active" : ""} onClick={() => setActiveCollection(collection)}>{collection === "all" ? "All pieces" : collectionLabels[collection]}</button>)}</div></div>
      <div className="product-grid">{visibleProducts.map((product) => <article className="product-card" key={product.productId}><button className="product-art" onClick={() => setSelected(product)} aria-label={`View ${product.name}`}><ProductArtwork product={product} /><span className="product-collection">{collectionLabels[product.collection]}</span><span className="quick-view">View piece <ArrowRight size={15} /></span></button><div className="product-info"><div><h3>{product.name}</h3><p>{product.signs}</p></div><span>{money(product.price)}</span></div><p className="product-subtitle">{product.subtitle}</p></article>)}</div>
    </section>

    <section className="two-worlds"><article className="world world-light"><span>01 / ENGAGEMENT</span><h2>The promise,<br />reimagined.</h2><p>Quietly symbolic settings built around the way your signs attract, challenge, and steady each other.</p><button onClick={() => { setActiveCollection("engagement"); document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" }); }}>Enter the collection <ArrowRight size={16} /></button></article><article className="world world-dark"><span>02 / AFTER DARK</span><h2>Codes only<br />you two know.</h2><p>Collars, locks, links, and celestial symbols rendered as elegant daily jewelry. Suggestive, never obvious.</p><button onClick={() => { setActiveCollection("kinky"); document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" }); }}>Enter the collection <ArrowRight size={16} /></button></article></section>

    <section className="design-section"><div className="design-orbit">SCORPIO <span>+</span> TAURUS</div><div><p className="eyebrow"><Asterisk size={13} /> The couple’s atelier</p><h2>What if your story<br />became the jewelry?</h2><p>Choose your path: design from your shared astrology, or turn a photograph and the memory behind it into a one-of-one piece.</p><div className="atelier-actions"><button className="primary-button inverse" onClick={() => setDesignOpen(true)}>Design with the stars <Sparkles size={16} /></button><button className="primary-button memory-button" onClick={() => setMemoryOpen(true)}>Forge a memory <Camera size={16} /></button></div></div></section>

    <footer><div className="footer-brand"><span>FATED</span><i>×</i><span>FORGED</span></div><p>Jewelry made for the space between you.</p><div className="footer-meta"><span>Made on demand with Arcade</span><span>© 2026 Fated & Forged</span><a href="https://www.arcade.ai" target="_blank" rel="noreferrer">About Arcade ↗</a></div></footer>

    {selected && <div className="modal-backdrop" onMouseDown={() => setSelected(null)}><section className="product-modal" role="dialog" aria-modal="true" aria-label={selected.name} onMouseDown={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setSelected(null)} aria-label="Close"><X /></button><div className="modal-art"><ProductArtwork product={selected} priority /></div><div className="modal-copy"><p className="eyebrow"><Asterisk size={13} /> {collectionLabels[selected.collection]} collection</p><h2>{selected.name}</h2><p className="modal-signs">{selected.signs}</p><p className="modal-description">{selected.description}</p><dl><div><dt>Material</dt><dd>{selected.material}</dd></div><div><dt>Made by</dt><dd>{selected.maker}</dd></div><div><dt>Production</dt><dd>Made to order</dd></div></dl><div className="modal-buy"><strong>{money(selected.price)}</strong><button className="primary-button" onClick={() => addToCart(selected)}>Add to bag <ArrowRight size={16} /></button></div></div></section></div>}

    {cartOpen && <div className="drawer-backdrop" onMouseDown={() => setCartOpen(false)}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag" onMouseDown={(event) => event.stopPropagation()}><div className="drawer-header"><h2>Your orbit</h2><button className="close-button" onClick={() => setCartOpen(false)} aria-label="Close"><X /></button></div>{cart.length === 0 ? <div className="empty-cart"><ShoppingBag className="empty-cart-icon" strokeWidth={1} /><h3>Nothing in orbit yet.</h3><p>Choose a piece that feels written for you.</p><button className="primary-button" onClick={() => setCartOpen(false)}>Explore the drop</button></div> : <><div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item.productId}><div className="cart-thumb"><ProductArtwork product={item} /></div><div><h3>{item.name}</h3><p>{item.material}</p><div className="quantity"><button onClick={() => changeQuantity(item.productId, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.productId, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div></div><strong>{money(item.price)}</strong></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cartTotal)}</strong></div><p>Shipping and taxes calculated by Arcade at checkout.</p>{checkoutState === "error" && <p className="error-text">Checkout couldn’t be created. Please try again.</p>}<button className="primary-button checkout-button" onClick={checkout} disabled={checkoutState === "loading"}>{checkoutState === "loading" ? <LoaderCircle className="spin" size={18} /> : "Checkout with Arcade"}<ArrowRight size={17} /></button></div></>}</aside></div>}

    {designOpen && <div className="modal-backdrop" onMouseDown={() => setDesignOpen(false)}><section className="design-modal" role="dialog" aria-modal="true" aria-labelledby="design-title" onMouseDown={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setDesignOpen(false)} aria-label="Close"><X /></button><p className="eyebrow"><Sparkles size={13} /> Powered by Arcade</p><h2 id="design-title">Design your chemistry.</h2><p>Give us the celestial ingredients. Arcade will generate a real piece and return a guaranteed manufacturing price.</p>{designState === "done" ? <div className="design-success"><Check /><h3>Your stars are aligning.</h3><p>{designMessage}</p><button className="primary-button" onClick={() => setDesignOpen(false)}>Back to the atelier</button></div> : <form onSubmit={submitDesign}><div className="form-row"><label>Your sign<select name="signOne" required defaultValue=""><option value="" disabled>Select</option>{signs.map((sign) => <option key={sign}>{sign}</option>)}</select></label><span>×</span><label>Their sign<select name="signTwo" required defaultValue=""><option value="" disabled>Select</option>{signs.map((sign) => <option key={sign}>{sign}</option>)}</select></label></div><label>What are we making?<select name="collection" required defaultValue="engagement"><option value="engagement">An engagement ring</option><option value="kinky">An after-dark necklace</option><option value="everyday-stars">An Everyday Stars necklace</option></select></label><label>Your shared energy<textarea name="story" required minLength={10} maxLength={350} placeholder="Magnetic, playful, a little dangerous. We met at midnight in New Orleans…" /></label><label>Material<select name="material" required defaultValue="14k Gold Vermeil"><option>14k Gold Vermeil</option><option>925 Sterling Silver</option><option>14k Yellow Gold</option><option>14k Rose Gold</option><option>14k White Gold</option></select></label>{designState === "error" && <p className="error-text">{designMessage}</p>}<button className="primary-button design-submit" disabled={designState === "loading"}>{designState === "loading" ? <><LoaderCircle className="spin" size={18} /> Casting your prompt…</> : <>Generate my piece <Sparkles size={16} /></>}</button><small>Generation usually takes a few minutes. No purchase is made.</small></form>}</section></div>}

    {memoryOpen && <div className="modal-backdrop" onMouseDown={() => setMemoryOpen(false)}><section className={`design-modal memory-modal ${memoryState === "done" ? "memory-modal-reveal" : ""}`} role="dialog" aria-modal="true" aria-labelledby="memory-title" onMouseDown={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setMemoryOpen(false)} aria-label="Close"><X /></button>{memoryState === "loading" ? <DateConstellation date={memoryDate} /> : memoryState === "done" && memoryProduct ? <div className="memory-product-reveal memory-stage"><div className="memory-result-art"><ProductArtwork product={memoryProduct} priority /></div><div className="memory-result-copy"><p className="eyebrow"><Check size={13} /> Your memory, forged</p><h2 id="memory-title">{memoryProduct.name}</h2><p className="memory-result-sign">{zodiacForDate(memoryDate)} / {memoryDate}</p><p>{memoryProduct.description}</p><dl><div><dt>Material</dt><dd>{memoryProduct.material}</dd></div><div><dt>Made by</dt><dd>{memoryProduct.maker}</dd></div><div><dt>Arcade price</dt><dd>{money(memoryProduct.price)}</dd></div></dl><p className="memory-saved-note">Saved to Everyday Stars on this browser.</p><div className="memory-result-actions"><button className="primary-button" onClick={() => { setMemoryOpen(false); addToCart(memoryProduct); }}>Add to bag <ArrowRight size={16} /></button><button className="text-button" onClick={showMemoryInStorefront}>See it in the collection</button></div></div></div> : <><p className="eyebrow"><Camera size={13} /> A moment, made tangible</p><h2 id="memory-title">Forge a memory.</h2><p>Upload a photo and tell us what it means. We’ll read its date and palette, and DeepSeek can describe the scene before Arcade turns it into a manufacturable piece.</p><form onSubmit={submitMemoryDesign}><label className="photo-upload">Your photograph<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectMemoryPhoto} required={!memoryPreview} /><span><Camera size={18} /> {memoryPreview ? "Choose a different photo" : "Choose a photo"}</span></label>{memoryPreview && <div className="memory-preview"><img src={memoryPreview} alt="Your uploaded memory" /><div><small>{memoryDateNote}</small><div className="memory-palette" aria-label="Colors extracted from your photo">{memoryPalette.map((color) => <i key={color} style={{ backgroundColor: color }} title={color} />)}</div><button type="button" className="vision-button" onClick={analyzeMemoryPhoto} disabled={visionState === "loading"}>{visionState === "loading" ? <><LoaderCircle className="spin" size={14} /> Reading the scene…</> : <><Sparkles size={14} /> Analyze with DeepSeek</>}</button></div></div>}{visionState === "error" && <p className="error-text">{visionMessage}</p>}{(visionState === "done" || visualDescription) && <label>What DeepSeek sees<textarea value={visualDescription} onChange={(event) => setVisualDescription(event.target.value)} maxLength={1200} /><small>Edit anything before this description is sent to Arcade.</small></label>}<label>Date taken<input type="date" value={memoryDate} onChange={(event) => setMemoryDate(event.target.value)} required /><small>{memoryDateNote || "We’ll read this from the photo metadata when available."}</small></label><label>What happened in this moment?<textarea name="memory" required minLength={10} maxLength={500} placeholder="The evening we realized this was forever—the air smelled like rain and the whole city turned gold…" /></label><div className="memory-options"><label>Piece<select name="jewelryType" required defaultValue="necklace"><option value="necklace">Pendant necklace</option><option value="ring">Stacking ring</option></select></label><label>Material<select name="material" required defaultValue="14k Gold Vermeil"><option>14k Gold Vermeil</option><option>925 Sterling Silver</option><option>14k Yellow Gold</option><option>14k Rose Gold</option><option>14k White Gold</option></select></label></div>{memoryState === "error" && <p className="error-text">{memoryMessage}</p>}<button className="primary-button design-submit" disabled={visionState === "loading"}>Create from this memory <Camera size={16} /></button><small>The photo is sent to DeepSeek only if you choose Analyze. Arcade receives the description, date, palette, and your memory—not the photo. No purchase is made.</small></form></>}</section></div>}
  </main>;
}
