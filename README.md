# Fated & Forged

An AI-native jewelry storefront for couples, created for Shopping 3.0: the AI Commerce Hackathon with Arcade.

Fated & Forged turns a couple's zodiac pairing and shared story into made-to-order engagement rings and discreet after-dark jewelry. Arcade generates each manufacturable product, supplies guaranteed pricing, and powers checkout and fulfillment.

## What is included

- Twelve generated and priced Arcade jewelry products
- Six engagement rings and six after-dark necklaces
- Locally persisted product renders plus lightweight WebP storefront assets in `public/products/`
- Product filtering, detail views, shopping bag, and Arcade checkout
- A live custom-design flow that creates new jewelry from a couple's signs and story
- A versioned product archive in `data/arcade-products.json`
- A credential-free partner handoff process in `docs/PARTNER_PRODUCT_HANDOFF.md`
- A direct contributor and Vercel deployment guide in `docs/HACKATHON_AGENT_CONTRIBUTING.md`
- A downloadable, credential-free source bundle for no-GitHub contributors

## Local development

Requirements: Node.js 22 or later, an Arcade API key, and a DeepSeek API key for optional photo analysis.

```bash
npm install
npm run dev
```

Set `ARCADE_API_KEY` and `DEEPSEEK_API_KEY` in your local environment. Never commit either key. The DeepSeek key is server-only; never expose it through a `NEXT_PUBLIC_` variable.

## Production

The storefront is deployed on Vercel at [fated-and-forged.vercel.app](https://fated-and-forged.vercel.app). The API key is stored as a sensitive Vercel environment variable.

```bash
npm run build
vercel deploy --prod
```

## Product provenance

Every product ID in `lib/store-catalog.ts` was returned by Arcade's prompt-to-product API after successful generation and pricing. Product renders are checked into the repository at the user's request so the complete hackathon artifact remains reproducible even if upstream image URLs change.

The storefront serves its checked-in WebP images and last verified Arcade product data directly from Vercel. Page rendering does not call Arcade. Arcade is contacted only for an explicit custom-generation or checkout action.

Image-loading behavior is covered by executable tests in `tests/storefront-performance.test.mjs` and modeled in TLA+ under `specs/`.

## Collaborating during the hackathon

Use [`docs/HACKATHON_AGENT_CONTRIBUTING.md`](docs/HACKATHON_AGENT_CONTRIBUTING.md) to let an authorized partner agent upload images, edit the catalog, push changes, and optionally deploy the existing Vercel project. The credential-free product-packet alternative remains in [`docs/PARTNER_PRODUCT_HANDOFF.md`](docs/PARTNER_PRODUCT_HANDOFF.md).

Partners without GitHub can download the current source from `/contributor-kit/fated-and-forged-source.tar.gz` and deploy directly with temporary access to the existing Vercel project. Direct deployments must regenerate the source bundle first so later contributors do not start from stale code.
