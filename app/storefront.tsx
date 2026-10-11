"use client";

import { ArrowDown, ArrowRight, Asterisk, Check, LoaderCircle, Menu, Minus, Plus, ShoppingBag, Sparkles, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import productArchive from "@/data/arcade-products.json";
import type { ProductCollection } from "@/lib/store-catalog";

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

const fallbackProducts = [
  { productId: "pending-leo-aquarius", slug: "solar-orbit-ring", name: "Solar Orbit", subtitle: "A promise written in opposing stars", collection: "engagement", signs: "Leo × Aquarius", imageUrl: "", images: [], material: "14k Yellow Gold", maker: "Arcade maker network", description: "An oval diamond held in a low celestial setting, with two tiny constellation details orbiting the band.", price: null },
  { productId: "pending-pisces-virgo", slug: "tide-and-wheat-ring", name: "Tide & Wheat", subtitle: "Soft water meets steady earth", collection: "engagement", signs: "Pisces × Virgo", imageUrl: "", images: [], material: "14k Rose Gold", maker: "Arcade maker network", description: "A bezel-set diamond with an intertwined wave and wheat motif in warm rose gold.", price: null },
  { productId: "pending-scorpio-taurus", slug: "devotion-lock-necklace", name: "Devotion Lock", subtitle: "For the fixed signs who mean it", collection: "kinky", signs: "Scorpio × Taurus", imageUrl: "", images: [], material: "14k Gold Vermeil", maker: "Arcade maker network", description: "Serpent and horn geometry frame a miniature lock—a private promise in plain sight.", price: null },
  { productId: "pending-celestial-cuffs", slug: "celestial-cuffs-necklace", name: "Celestial Cuffs", subtitle: "Linked by choice, guided by stars", collection: "kinky", signs: "Your two signs", imageUrl: "", images: [], material: "925 Sterling Silver", maker: "Arcade maker network", description: "Two abstract cuffs joined by a delicate chain and finished with subtle constellation engravings.", price: null },
  { productId: "pending-equinox-promise", slug: "equinox-promise-ring", name: "Equinox Promise", subtitle: "Where opposites find their balance", collection: "engagement", signs: "Aries × Libra", imageUrl: "", images: [], material: "14k White Gold", maker: "Arcade maker network", description: "A low-set diamond held between a whisper of flame and a balanced horizon—opposites meeting at the equinox.", price: null },
  { productId: "pending-moon-meridian", slug: "moon-meridian-ring", name: "Moon Meridian", subtitle: "Tenderness with a backbone", collection: "engagement", signs: "Cancer × Capricorn", imageUrl: "", images: [], material: "14k Yellow Gold", maker: "Arcade maker network", description: "A crescent-soft curve meets a steady mountain line beneath a bright center stone—a study in tenderness and resolve.", price: null },
  { productId: "pending-wild-compass", slug: "wild-compass-ring", name: "Wild Compass", subtitle: "Two minds, one true north", collection: "engagement", signs: "Gemini × Sagittarius", imageUrl: "", images: [], material: "14k Rose Gold", maker: "Arcade maker network", description: "Twin bands travel their own paths before meeting beneath a compass star, made for the pair who always finds the way back.", price: null },
  { productId: "pending-ember-garden", slug: "ember-garden-ring", name: "Ember Garden", subtitle: "A devotion that keeps growing", collection: "engagement", signs: "Leo × Taurus", imageUrl: "", images: [], material: "14k Gold Vermeil", maker: "Arcade maker network", description: "Fine sun rays soften into tiny leaves around a bezel-set stone—radiance rooted in something lasting.", price: null },
  { productId: "pending-double-dare", slug: "double-dare-necklace", name: "Double Dare", subtitle: "For the pair that never plays it safe", collection: "kinky", signs: "Gemini × Sagittarius", imageUrl: "", images: [], material: "925 Sterling Silver", maker: "Arcade maker network", description: "Two elongated links hold each other in tension, finished with a miniature arrow detail for the couple always tempting fate.", price: null },
  { productId: "pending-velvet-rule", slug: "velvet-rule-necklace", name: "Velvet Rule", subtitle: "Soft power, beautifully worn", collection: "kinky", signs: "Cancer × Capricorn", imageUrl: "", images: [], material: "14k Gold Vermeil", maker: "Arcade maker network", description: "A soft crescent rests beneath an architectural peak—a quiet emblem of care, structure, and chosen control.", price: null },
  { productId: "pending-balanced-heat", slug: "balanced-heat-necklace", name: "Balanced Heat", subtitle: "Equal parts spark and surrender", collection: "kinky", signs: "Aries × Libra", imageUrl: "", images: [], material: "14k Rose Gold", maker: "Arcade maker network", description: "A sculptural flame slips through a polished balance ring—heat and harmony held in one private symbol.", price: null },
  { productId: "pending-afterglow-link", slug: "afterglow-link-necklace", name: "Afterglow Link", subtitle: "Made for the hours after midnight", collection: "kinky", signs: "Leo × Pisces", imageUrl: "", images: [], material: "14k Gold Vermeil", maker: "Arcade maker network", description: "A radiant edge dissolves into a liquid curve and one open link, capturing the charged calm after midnight.", price: null },
].map((product) => {
  const archived = productArchive.find((item) => item.slug === product.slug);
  if (!archived) throw new Error(`Missing archived product data for ${product.slug}`);
  const [amount, currency] = archived.price.split(" ");
  const imageUrl = `/products/${product.slug}.webp`;
  return {
    ...product,
    productId: archived.productId,
    imageUrl,
    images: [{ url: imageUrl }],
    material: archived.material,
    maker: archived.maker,
    price: { amount, currency },
    availability: "priced",
  };
}) as Product[];

const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const collectionLabels: Record<ProductCollection, string> = { engagement: "The Proposal", kinky: "After Dark", "everyday-stars": "Everyday Stars" };
const collectionFilters = ["all", "engagement", "kinky", "everyday-stars"] as const;

function money(price: Product["price"]) {
  if (!price) return "Pricing…";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: price.currency, maximumFractionDigits: 0 }).format(Number(price.amount));
}

function ProductArtwork({ product, priority = false }: { product: Product; priority?: boolean }) {
  if (product.imageUrl) return <img src={product.imageUrl} alt={`${product.name}, ${product.material}`} className="product-image" width={1024} height={1024} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" />;
  return <div className="placeholder-art" aria-label="Arcade product render in progress"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><Sparkles size={28} strokeWidth={1} /><span>Arcade is crafting this render</span></div>;
}

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [activeCollection, setActiveCollection] = useState<"all" | ProductCollection>("all");
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "error">("idle");
  const [designState, setDesignState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [designMessage, setDesignMessage] = useState("");

  const visibleProducts = useMemo(() => activeCollection === "all" ? products : products.filter((product) => product.collection === activeCollection), [products, activeCollection]);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price?.amount || 0) * item.quantity, 0);

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

  return <main>
    <div className="announcement">Generated by Arcade <span>✦</span> Made to order by independent artisans</div>
    <header className="site-header">
      <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button>
      <a href="#top" className="brand" aria-label="Fated and Forged home"><span>FATED</span><i>×</i><span>FORGED</span></a>
      <nav className={menuOpen ? "nav-open" : ""} aria-label="Primary navigation">
        <a href="#shop" onClick={() => { setActiveCollection("engagement"); setMenuOpen(false); }}>The Proposal</a><a href="#shop" onClick={() => { setActiveCollection("kinky"); setMenuOpen(false); }}>After Dark</a><a href="#shop" onClick={() => { setActiveCollection("everyday-stars"); setMenuOpen(false); }}>Everyday Stars</a><a href="#story" onClick={() => setMenuOpen(false)}>Our story</a><button onClick={() => { setDesignOpen(true); setMenuOpen(false); }}>Design yours</button>
      </nav>
      <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Open cart with ${cartCount} items`}><ShoppingBag size={19} strokeWidth={1.5} /><span>Bag</span><b>{cartCount}</b></button>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow"><Asterisk size={13} /> Jewelry for two bodies, one orbit</p>
        <h1>Your chemistry,<br /><em>cast in metal.</em></h1>
        <p className="hero-lede">Fine jewelry imagined from your star signs, shared mythology, and private language—then made on demand by world-class artisans.</p>
        <div className="hero-actions"><button className="primary-button" onClick={() => setDesignOpen(true)}>Create your piece <ArrowRight size={17} /></button><a href="#shop" className="text-link">Shop the first drop <ArrowDown size={15} /></a></div>
        <div className="hero-note"><span>01</span><p>No inventory. No sameness.<br />Every piece begins with a prompt.</p></div>
      </div>
      <div className="hero-visual" aria-label="Celestial jewelry composition">
        <div className="zodiac-wheel">{signs.map((sign, index) => <span key={sign} style={{ "--i": index } as React.CSSProperties}>{sign.slice(0, 2)}</span>)}<div className="wheel-center"><i>∞</i><small>YOUR<br />ORBIT</small></div></div>
        <div className="hero-product-card"><span className="card-index">THE FIRST DROP / 01</span><ProductArtwork product={products[0]} priority /><div><b>{products[0].name}</b><span>{products[0].signs}</span></div></div><div className="floating-glyph glyph-one">♌</div><div className="floating-glyph glyph-two">♒</div>
      </div>
    </section>

    <section className="manifesto" id="story"><p>Not your birth chart on a charm.</p><h2>We translate the tension between two people into an object worth keeping.</h2><div className="manifesto-details"><span>Designed with AI</span><span>Made by hand</span><span>Priced instantly</span><span>Shipped on demand</span></div></section>

    <section className="shop-section" id="shop">
      <div className="shop-heading"><div><p className="eyebrow"><Asterisk size={13} /> The first drop</p><h2>Choose your constellation.</h2></div><div className="collection-tabs" role="tablist" aria-label="Filter products">{collectionFilters.map((collection) => <button key={collection} className={activeCollection === collection ? "active" : ""} onClick={() => setActiveCollection(collection)}>{collection === "all" ? "All pieces" : collectionLabels[collection]}</button>)}</div></div>
      <div className="product-grid">{visibleProducts.map((product) => <article className="product-card" key={product.productId}><button className="product-art" onClick={() => setSelected(product)} aria-label={`View ${product.name}`}><ProductArtwork product={product} /><span className="product-collection">{collectionLabels[product.collection]}</span><span className="quick-view">View piece <ArrowRight size={15} /></span></button><div className="product-info"><div><h3>{product.name}</h3><p>{product.signs}</p></div><span>{money(product.price)}</span></div><p className="product-subtitle">{product.subtitle}</p></article>)}</div>
    </section>

    <section className="two-worlds"><article className="world world-light"><span>01 / ENGAGEMENT</span><h2>The promise,<br />reimagined.</h2><p>Quietly symbolic settings built around the way your signs attract, challenge, and steady each other.</p><button onClick={() => { setActiveCollection("engagement"); document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" }); }}>Enter the collection <ArrowRight size={16} /></button></article><article className="world world-dark"><span>02 / AFTER DARK</span><h2>Codes only<br />you two know.</h2><p>Collars, locks, links, and celestial symbols rendered as elegant daily jewelry. Suggestive, never obvious.</p><button onClick={() => { setActiveCollection("kinky"); document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" }); }}>Enter the collection <ArrowRight size={16} /></button></article></section>

    <section className="design-section"><div className="design-orbit">♏ <span>+</span> ♉</div><div><p className="eyebrow"><Asterisk size={13} /> The couple’s atelier</p><h2>What if your story<br />became the jewelry?</h2><p>Tell us your signs, your shared energy, and how bold you want to be. Arcade turns the prompt into a manufacturable piece with a real price.</p><button className="primary-button inverse" onClick={() => setDesignOpen(true)}>Design with the stars <Sparkles size={16} /></button></div></section>

    <footer><div className="footer-brand"><span>FATED</span><i>×</i><span>FORGED</span></div><p>Jewelry made for the space between you.</p><div className="footer-meta"><span>Made on demand with Arcade</span><span>© 2026 Fated & Forged</span><a href="https://www.arcade.ai" target="_blank" rel="noreferrer">About Arcade ↗</a></div></footer>

    {selected && <div className="modal-backdrop" onMouseDown={() => setSelected(null)}><section className="product-modal" role="dialog" aria-modal="true" aria-label={selected.name} onMouseDown={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setSelected(null)} aria-label="Close"><X /></button><div className="modal-art"><ProductArtwork product={selected} priority /></div><div className="modal-copy"><p className="eyebrow"><Asterisk size={13} /> {collectionLabels[selected.collection]} collection</p><h2>{selected.name}</h2><p className="modal-signs">{selected.signs}</p><p className="modal-description">{selected.description}</p><dl><div><dt>Material</dt><dd>{selected.material}</dd></div><div><dt>Made by</dt><dd>{selected.maker}</dd></div><div><dt>Production</dt><dd>Made to order</dd></div></dl><div className="modal-buy"><strong>{money(selected.price)}</strong><button className="primary-button" onClick={() => addToCart(selected)}>Add to bag <ArrowRight size={16} /></button></div></div></section></div>}

    {cartOpen && <div className="drawer-backdrop" onMouseDown={() => setCartOpen(false)}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag" onMouseDown={(event) => event.stopPropagation()}><div className="drawer-header"><h2>Your orbit</h2><button className="close-button" onClick={() => setCartOpen(false)} aria-label="Close"><X /></button></div>{cart.length === 0 ? <div className="empty-cart"><div>☾</div><h3>Nothing in orbit yet.</h3><p>Choose a piece that feels written for you.</p><button className="primary-button" onClick={() => setCartOpen(false)}>Explore the drop</button></div> : <><div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item.productId}><div className="cart-thumb"><ProductArtwork product={item} /></div><div><h3>{item.name}</h3><p>{item.material}</p><div className="quantity"><button onClick={() => changeQuantity(item.productId, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.productId, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div></div><strong>{money(item.price)}</strong></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cartTotal)}</strong></div><p>Shipping and taxes calculated by Arcade at checkout.</p>{checkoutState === "error" && <p className="error-text">Checkout couldn’t be created. Please try again.</p>}<button className="primary-button checkout-button" onClick={checkout} disabled={checkoutState === "loading"}>{checkoutState === "loading" ? <LoaderCircle className="spin" size={18} /> : "Checkout with Arcade"}<ArrowRight size={17} /></button></div></>}</aside></div>}

    {designOpen && <div className="modal-backdrop" onMouseDown={() => setDesignOpen(false)}><section className="design-modal" role="dialog" aria-modal="true" aria-labelledby="design-title" onMouseDown={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setDesignOpen(false)} aria-label="Close"><X /></button><p className="eyebrow"><Sparkles size={13} /> Powered by Arcade</p><h2 id="design-title">Design your chemistry.</h2><p>Give us the celestial ingredients. Arcade will generate a real piece and return a guaranteed manufacturing price.</p>{designState === "done" ? <div className="design-success"><Check /><h3>Your stars are aligning.</h3><p>{designMessage}</p><button className="primary-button" onClick={() => setDesignOpen(false)}>Back to the atelier</button></div> : <form onSubmit={submitDesign}><div className="form-row"><label>Your sign<select name="signOne" required defaultValue=""><option value="" disabled>Select</option>{signs.map((sign) => <option key={sign}>{sign}</option>)}</select></label><span>×</span><label>Their sign<select name="signTwo" required defaultValue=""><option value="" disabled>Select</option>{signs.map((sign) => <option key={sign}>{sign}</option>)}</select></label></div><label>What are we making?<select name="collection" required defaultValue="engagement"><option value="engagement">An engagement ring</option><option value="kinky">An after-dark necklace</option><option value="everyday-stars">An Everyday Stars necklace</option></select></label><label>Your shared energy<textarea name="story" required minLength={10} maxLength={350} placeholder="Magnetic, playful, a little dangerous. We met at midnight in New Orleans…" /></label><label>Material<select name="material" required defaultValue="14k Gold Vermeil"><option>14k Gold Vermeil</option><option>925 Sterling Silver</option><option>14k Yellow Gold</option><option>14k Rose Gold</option><option>14k White Gold</option></select></label>{designState === "error" && <p className="error-text">{designMessage}</p>}<button className="primary-button design-submit" disabled={designState === "loading"}>{designState === "loading" ? <><LoaderCircle className="spin" size={18} /> Casting your prompt…</> : <>Generate my piece <Sparkles size={16} /></>}</button><small>Generation usually takes a few minutes. No purchase is made.</small></form>}</section></div>}
  </main>;
}
