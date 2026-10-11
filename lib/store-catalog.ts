export type CatalogDefinition = {
  productId: string;
  slug: string;
  name: string;
  subtitle: string;
  collection: "engagement" | "kinky";
  signs: string;
  fallbackDescription: string;
};

export type BraceletConceptDefinition = {
  patternId: string;
  slug: string;
  name: string;
  subtitle: string;
  collection: "bracelets";
  signs: string;
  material: string;
  description: string;
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

// Arcade does not currently expose a bracelet manufacturing category. These
// are concept studies only: no product IDs, prices, maker claims, or checkout.
export const braceletConcepts: BraceletConceptDefinition[] = [
  {
    patternId: "cmv47xock006xpa10s1t3s6o4",
    slug: "equinox-cuff-bracelet",
    name: "Equinox Cuff",
    subtitle: "Opposites, held in perfect tension",
    collection: "bracelets",
    signs: "Aries × Libra",
    material: "Gold vermeil direction",
    description: "An open cuff balancing a sculptural flame against a quiet horizon, with a private celestial engraving inside.",
  },
  {
    patternId: "cmv480zrv00itpb10qi1lnm0q",
    slug: "lunar-backbone-bracelet",
    name: "Lunar Backbone",
    subtitle: "Softness with structure",
    collection: "bracelets",
    signs: "Cancer × Capricorn",
    material: "Sterling silver direction",
    description: "A polished cuff where a moonlit curve rises into a restrained mountain ridge—tenderness with a backbone.",
  },
  {
    patternId: "cmv4813kp00ahlg101f4mdz94",
    slug: "true-north-wrap-bracelet",
    name: "True North Wrap",
    subtitle: "For the pair that keeps moving",
    collection: "bracelets",
    signs: "Gemini × Sagittarius",
    material: "Rose gold direction",
    description: "Twin paths circle the wrist before meeting at a miniature compass star and arrow.",
  },
  {
    patternId: "cmv4810xt00fylm10127evaoj",
    slug: "tidal-thorn-bracelet",
    name: "Tidal Thorn",
    subtitle: "A beautiful kind of danger",
    collection: "bracelets",
    signs: "Scorpio × Pisces",
    material: "Sterling silver direction",
    description: "A darkly polished wave wraps into one elegant thorn, intimate and dangerous without saying too much.",
  },
  {
    patternId: "cmv4813d7007ppa10nf4j8h12",
    slug: "sun-current-bracelet",
    name: "Sun Current",
    subtitle: "Radiance that refuses a cage",
    collection: "bracelets",
    signs: "Leo × Aquarius",
    material: "Gold vermeil direction",
    description: "A radiant sun sends two electric currents around the wrist in a bold open silhouette.",
  },
  {
    patternId: "cmv4812o200ixpb10c2wwxhhe",
    slug: "rooted-orbit-bracelet",
    name: "Rooted Orbit",
    subtitle: "Grounded enough to grow",
    collection: "bracelets",
    signs: "Taurus × Virgo",
    material: "Yellow gold direction",
    description: "A slender orbit carries tiny wheat leaves and a single earth-toned stone like a shared garden.",
  },
];

export function presentProduct(definition: CatalogDefinition, product: {
  imageUrl: string;
  images: { url: string }[];
  selections: Record<string, string>;
  maker: { name: string };
  description: string | null;
  unitPrice: { amount: string; currency: string } | null;
}) {
  const persistedImageUrl = `/products/${definition.slug}.png`;
  return {
    productId: definition.productId,
    slug: definition.slug,
    name: definition.name,
    subtitle: definition.subtitle,
    collection: definition.collection,
    signs: definition.signs,
    imageUrl: persistedImageUrl,
    images: [{ url: persistedImageUrl }],
    material: product.selections.material || "Made to order",
    maker: product.maker.name || "Arcade maker network",
    description: definition.fallbackDescription,
    price: product.unitPrice,
    availability: "priced" as const,
  };
}

export function presentBraceletConcept(definition: BraceletConceptDefinition) {
  const conceptImageUrl = `/products/${definition.slug}.png`;
  return {
    productId: `concept-${definition.patternId}`,
    slug: definition.slug,
    name: definition.name,
    subtitle: definition.subtitle,
    collection: definition.collection,
    signs: definition.signs,
    imageUrl: conceptImageUrl,
    images: [{ url: conceptImageUrl }],
    material: definition.material,
    maker: "Arcade concept study",
    description: definition.description,
    price: null,
    availability: "concept" as const,
  };
}
