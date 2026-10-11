export type CatalogDefinition = {
  productId: string;
  slug: string;
  name: string;
  subtitle: string;
  collection: "engagement" | "kinky";
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
];

export function presentProduct(definition: CatalogDefinition, product: {
  imageUrl: string;
  images: { url: string }[];
  selections: Record<string, string>;
  maker: { name: string };
  description: string | null;
  unitPrice: { amount: string; currency: string } | null;
}) {
  return {
    productId: definition.productId,
    slug: definition.slug,
    name: definition.name,
    subtitle: definition.subtitle,
    collection: definition.collection,
    signs: definition.signs,
    imageUrl: product.imageUrl,
    images: product.images,
    material: product.selections.material || "Made to order",
    maker: product.maker.name || "Arcade maker network",
    description: definition.fallbackDescription,
    price: product.unitPrice,
  };
}
