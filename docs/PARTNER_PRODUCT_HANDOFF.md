# Partner Arcade product handoff

The safest collaboration path is a product handoff packet. It moves product IDs and creative metadata between agents without sharing either person's Arcade API key or the storefront's Vercel credentials.

Only add successful Arcade products from The Proposal (engagement), After Dark (kinky), or Everyday Stars collections.

Everyday Stars is couples' birth-chart jewelry that isn't an engagement ring or kink-themed: birth-chart stacking rings (sun, moon, rising, birthday, constellation), couples and birth-chart necklaces (matching sets, medallions, lockets, bars), and multi-piercing "ear story" earrings.

No bracelets, in any collection.

## Copy this prompt to the partner's agent

```text
You are contributing Arcade-generated jewelry to the Fated & Forged storefront.

For every piece you generate, wait until the Arcade job reaches `succeeded`. Never include an API key, bearer token, cookie, or other credential in your response.

Return one JSON object only, with this exact shape:
{
  "schemaVersion": 1,
  "sourceAgent": "partner-arcade-agent",
  "products": [
    {
      "availability": "priced",
      "arcadeProductId": "the successful Arcade product ID",
      "arcadePatternId": "the pattern ID if available, otherwise omit",
      "name": "a distinctive 2-4 word product name",
      "subtitle": "a short editorial line",
      "collection": "engagement, kinky, or everyday-stars",
      "signs": "Sign One × Sign Two",
      "description": "one factual customer-facing paragraph",
      "assetUrl": "the highest-resolution Arcade image URL"
    }
  ]
}

Rules:
- Include only products that have a real Arcade product ID and guaranteed price.
- Do not invent or copy a price, maker, material, product ID, or manufacturing status.
- Do not include failed or still-running jobs.
- Only add successful Arcade products from The Proposal (engagement), After Dark (kinky), or Everyday Stars collections.
- Everyday Stars is couples' birth-chart jewelry that isn't an engagement ring or kink-themed: birth-chart stacking rings (sun, moon, rising, birthday, constellation), couples and birth-chart necklaces (matching sets, medallions, lockets, bars), and multi-piercing "ear story" earrings.
- No bracelets, in any collection.
- Do not import pattern-only or concept imagery into the live catalog. Omit it from the handoff instead.
- Make the asset URL available long enough for the receiving agent to download it; signed URLs can expire.
```

The owner can paste the returned JSON into the coding-agent conversation for validation and import.

## Direct production contribution without GitHub

A GitHub account is not required. The owner can provide a temporary Vercel token, and the partner agent can download the current source bundle, edit it, and deploy directly to the existing project. Use the no-GitHub workflow and copy-paste prompt in [`HACKATHON_AGENT_CONTRIBUTING.md`](./HACKATHON_AGENT_CONTRIBUTING.md).

Because a direct Vercel deployment does not update the GitHub repository, the partner agent must run `npm run contributor-kit` before deploying. This republishes the edited source bundle for later recovery. The owner should reconcile the partner's changes into GitHub after the hackathon.

## Direct GitHub contribution option

For the full edit, image-upload, deployment, and production-verification workflow, see [`HACKATHON_AGENT_CONTRIBUTING.md`](./HACKATHON_AGENT_CONTRIBUTING.md).

After the partner's GitHub account is invited to the private repository, their agent can instead:

1. Clone `https://github.com/gonzalj3/fated-and-forged`.
2. Create a feature branch.
3. Download each final 1024×1024 render to `public/products/<unique-slug>.png`.
4. Add the product metadata to `data/arcade-products.json` and `lib/store-catalog.ts`.
5. Never commit an Arcade key or `.env` file.
6. Run `npm run build` and the repository secret scan.
7. Commit the changes and open a pull request; do not deploy directly.

The owner reviews the Arcade product IDs and merges the pull request. Vercel can then deploy the reviewed commit.
