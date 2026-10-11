# Fated & Forged

An AI-native jewelry storefront for couples, created for Shopping 3.0: the AI Commerce Hackathon with Arcade.

Fated & Forged turns a couple's zodiac pairing and shared story into made-to-order engagement rings and discreet after-dark jewelry. Arcade generates each manufacturable product, supplies guaranteed pricing, and powers checkout and fulfillment.

## What is included

- Twelve generated and priced Arcade jewelry products
- Six engagement rings and six after-dark necklaces
- Locally persisted 1024×1024 product renders in `public/products/`
- Product filtering, detail views, shopping bag, and Arcade checkout
- A live custom-design flow that creates new jewelry from a couple's signs and story
- A versioned product archive in `data/arcade-products.json`

## Local development

Requirements: Node.js 22 or later and an Arcade API key.

```bash
npm install
npm run dev
```

Set `ARCADE_API_KEY` in your local environment. Never commit it.

## Production

The storefront is deployed on Vercel at [fated-and-forged.vercel.app](https://fated-and-forged.vercel.app). The API key is stored as a sensitive Vercel environment variable.

```bash
npm run build
vercel deploy --prod
```

## Product provenance

Every product ID in `lib/store-catalog.ts` was returned by Arcade's prompt-to-product API after successful generation and pricing. Product renders are checked into the repository at the user's request so the complete hackathon artifact remains reproducible even if upstream image URLs change.
