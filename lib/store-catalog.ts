export const productCollections = ["engagement", "kinky", "everyday-stars"] as const;
export type ProductCollection = (typeof productCollections)[number];

export function isProductCollection(value: string): value is ProductCollection {
  return productCollections.includes(value as ProductCollection);
}

export function isAllowedProductCandidate(candidate: { collection: string; productType: string }) {
  return isProductCollection(candidate.collection) && !/\bbracelets?\b/i.test(candidate.productType);
}

export type CatalogDefinition = {
  productId: string;
  slug: string;
  name: string;
  subtitle: string;
  collection: ProductCollection;
  signs: string;
  fallbackDescription: string;
};

// Product IDs are created by Arcade's prompt-to-product API and committed here
// only after generation and guaranteed pricing finish successfully.
export const catalog: CatalogDefinition[] = [
  {
    productId: "20c7da24-4180-4246-bac4-f3bb56477053",
    slug: "solar-orbit-ring",
    name: "Solar Orbit",
    subtitle: "A promise written in opposing stars",
    collection: "engagement",
    signs: "Leo × Aquarius",
    fallbackDescription: "A round diamond set between a radiant star and an Aquarius wave—a tiny, wearable map of two opposing signs.",
  },
  {
    productId: "bcea26a4-0ed7-4c71-9483-31faf4a2570e",
    slug: "tide-and-wheat-ring",
    name: "Tide & Wheat",
    subtitle: "Soft water meets steady earth",
    collection: "engagement",
    signs: "Pisces × Virgo",
    fallbackDescription: "A bezel-set diamond where a fluid wave meets a fine wheat stem, cast in warm rose gold.",
  },
  {
    productId: "808b83f9-eef1-4abc-9bb2-032f46b2e323",
    slug: "devotion-lock-necklace",
    name: "Devotion Lock",
    subtitle: "For the fixed signs who mean it",
    collection: "kinky",
    signs: "Scorpio × Taurus",
    fallbackDescription: "A coiled serpent meets sculptural horns around a miniature lock—a private promise in plain sight.",
  },
  {
    productId: "5e1976da-853d-485d-9947-0ae4425e275e",
    slug: "celestial-cuffs-necklace",
    name: "Celestial Cuffs",
    subtitle: "Linked by choice, guided by stars",
    collection: "kinky",
    signs: "Your two signs",
    fallbackDescription: "Two crescent cuffs joined by a delicate chain and finished with subtle constellation engravings.",
  },
  {
    productId: "e890ca6b-f372-4031-8673-7199207c4ff4",
    slug: "equinox-promise-ring",
    name: "Equinox Promise",
    subtitle: "Where opposites find their balance",
    collection: "engagement",
    signs: "Aries × Libra",
    fallbackDescription: "A low-set diamond held between a whisper of flame and a balanced horizon—opposites meeting at the equinox.",
  },
  {
    productId: "f2e274b4-cc4d-4b1d-84c2-75ffcabddef2",
    slug: "moon-meridian-ring",
    name: "Moon Meridian",
    subtitle: "Tenderness with a backbone",
    collection: "engagement",
    signs: "Cancer × Capricorn",
    fallbackDescription: "A crescent-soft curve meets a steady mountain line beneath a bright center stone—a study in tenderness and resolve.",
  },
  {
    productId: "557f6ffe-d943-4bd1-8022-50a8d8d390d2",
    slug: "wild-compass-ring",
    name: "Wild Compass",
    subtitle: "Two minds, one true north",
    collection: "engagement",
    signs: "Gemini × Sagittarius",
    fallbackDescription: "Twin bands travel their own paths before meeting beneath a compass star, made for the pair who always finds the way back.",
  },
  {
    productId: "faac0a67-2c95-43b1-904d-b7c976a21417",
    slug: "ember-garden-ring",
    name: "Ember Garden",
    subtitle: "A devotion that keeps growing",
    collection: "engagement",
    signs: "Leo × Taurus",
    fallbackDescription: "Fine sun rays soften into tiny leaves around a bezel-set stone—radiance rooted in something lasting.",
  },
  {
    productId: "f435a223-5250-4430-9b24-deff7ee9999e",
    slug: "double-dare-necklace",
    name: "Double Dare",
    subtitle: "For the pair that never plays it safe",
    collection: "kinky",
    signs: "Gemini × Sagittarius",
    fallbackDescription: "Two elongated links hold each other in tension, finished with a miniature arrow detail for the couple always tempting fate.",
  },
  {
    productId: "eee888e5-5c0f-4f93-9af8-8fdf674b7326",
    slug: "velvet-rule-necklace",
    name: "Velvet Rule",
    subtitle: "Soft power, beautifully worn",
    collection: "kinky",
    signs: "Cancer × Capricorn",
    fallbackDescription: "A soft crescent rests beneath an architectural peak—a quiet emblem of care, structure, and chosen control.",
  },
  {
    productId: "3efc1e0a-304d-4195-9810-1793f05f1a92",
    slug: "balanced-heat-necklace",
    name: "Balanced Heat",
    subtitle: "Equal parts spark and surrender",
    collection: "kinky",
    signs: "Aries × Libra",
    fallbackDescription: "A sculptural flame slips through a polished balance ring—heat and harmony held in one private symbol.",
  },
  {
    productId: "ec8fcc92-7b05-4ca4-a7fa-baebb953d1b2",
    slug: "afterglow-link-necklace",
    name: "Afterglow Link",
    subtitle: "Made for the hours after midnight",
    collection: "kinky",
    signs: "Leo × Pisces",
    fallbackDescription: "A radiant edge dissolves into a liquid curve and one open link, capturing the charged calm after midnight.",
  },
];

export function presentArchivedProduct(definition: CatalogDefinition, product: {
  productId: string;
  material: string;
  maker: string;
  price: string;
}) {
  const persistedImageUrl = `/products/${definition.slug}.webp`;
  const [amount, currency] = product.price.split(" ");
  return {
    productId: definition.productId,
    slug: definition.slug,
    name: definition.name,
    subtitle: definition.subtitle,
    collection: definition.collection,
    signs: definition.signs,
    imageUrl: persistedImageUrl,
    images: [{ url: persistedImageUrl }],
    material: product.material,
    maker: product.maker,
    description: definition.fallbackDescription,
    price: { amount, currency },
    availability: "priced" as const,
  };
}
