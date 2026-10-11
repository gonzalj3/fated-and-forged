# Hackathon agent contribution guide

This guide lets another person and their coding agent add jewelry images, edit the Fated & Forged storefront, and publish changes during the hackathon.

- Production: <https://fated-and-forged.vercel.app>
- GitHub: <https://github.com/gonzalj3/fated-and-forged>
- Vercel project: `martin-gonzalez-s-projects/fated-and-forged`
- Vercel project ID: `prj_X8d6vk7FD0N7dDeahNcEYutydIrI`

## One-time access setup

The repository owner must invite the partner's GitHub username as a collaborator on the private repository. GitHub access is enough to upload images and source changes.

For the partner to deploy production personally, the owner must also give their Vercel account access to the `fated-and-forged` project. Otherwise, the partner should push the commit to GitHub and ask the owner or owner agent to run the production deployment.

Do not paste an Arcade key, GitHub token, or Vercel token into a prompt, source file, commit, issue, or pull request. The agent may use credentials that are already configured in its environment.

## Current application structure

- `public/products/` contains the storefront image files that Vercel serves.
- `lib/store-catalog.ts` contains the product IDs and customer-facing metadata used by `/api/catalog`.
- `app/storefront.tsx` contains the storefront layout and its fallback product data.
- `data/arcade-products.json` is the checked-in audit record for generated products.
- `experiments/arcade-bracelet-probes/` preserves the original bracelet pattern experiments.

For a new image, use a unique lowercase hyphenated filename such as `midnight-orbit-necklace.png`. Prefer a square 1024×1024 PNG or WebP. Never overwrite an unrelated product image.

## Truthful product states

### Priced and purchasable

A product may be marked `priced` only when Arcade returned a successful product ID and a guaranteed price. Add its real product ID to `catalog` in `lib/store-catalog.ts`. The server then obtains its current product information from Arcade. Do not reuse a price from a different product and do not invent a maker, material, or manufacturing status.

Persist the product render at `public/products/<slug>.png`, add the matching metadata to `data/arcade-products.json`, and add a fallback entry to `fallbackProducts` in `app/storefront.tsx`.

### Concept or coming soon

If Arcade returned only a pattern or concept, it is not purchasable. Give it `availability: "concept"`, keep `price: null`, label it **Coming soon**, and keep its checkout action disabled. A concept image may be displayed as Arcade-generated concept art, but it must not be described as a manufacturable product render.

Arcade did not expose a bracelet manufacturing category during the October 11, 2026 API probe. Until that changes, bracelet imagery stays in the concept state even when the image was generated from a bracelet prompt.

## Fast contribution workflow

Use a short-lived branch when possible. During the hackathon, direct pushes to `main` are acceptable only when the owner has explicitly enabled that access and the contributors coordinate so they do not overwrite each other.

```bash
git clone https://github.com/gonzalj3/fated-and-forged.git
cd fated-and-forged
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c partner/<short-change-name>
npm install
```

Make the requested source changes and copy image assets into `public/products/`. Then validate:

```bash
npm run build
git diff --check
rg -n --hidden --glob '!.git/**' 'arcade''_sk_|VERCEL''_TOKEN|GITHUB''_TOKEN' .
git status --short
```

The secret scan should return no matches. Review the exact files being committed, then commit and push:

```bash
git add <only-the-files-for-this-change>
git commit -m "Add partner jewelry collection"
git push -u origin HEAD
```

The preferred workflow is to open and merge a pull request. For the hackathon fast lane, an authorized contributor may instead update `main` after rebasing:

```bash
git fetch origin
git rebase origin/main
npm run build
git push origin HEAD:main
```

## Deploying to Vercel

If a GitHub push triggers a production deployment for this project, wait for it to finish and verify the canonical URL. If it does not, a contributor with Vercel project access can deploy from the repository checkout:

```bash
vercel link --yes --project fated-and-forged --scope martin-gonzalez-s-projects
vercel deploy --prod --yes --logs
```

Do not create a second Vercel project. The completed deployment must alias the existing production URL:

```text
https://fated-and-forged.vercel.app
```

## Production verification

Verify the deployed site, catalog, and every newly added image on Vercel rather than relying only on a local preview:

```bash
curl -I https://fated-and-forged.vercel.app
curl -fsS https://fated-and-forged.vercel.app/api/catalog
curl -I https://fated-and-forged.vercel.app/products/<new-image-name>.png
```

Confirm that:

- The homepage and image URLs return HTTP 200.
- The new catalog entries appear in `/api/catalog`.
- Real products show their own Arcade price.
- Concepts show `price: null`, `availability: "concept"`, and **Coming soon**.
- Concepts cannot be added to the bag.
- `git rev-parse HEAD` matches `git ls-remote origin refs/heads/main` after a direct-to-main release.

## Copy-paste prompt for the partner's coding agent

```text
You are an authorized hackathon contributor to the Fated & Forged website.

Repository: https://github.com/gonzalj3/fated-and-forged
Production: https://fated-and-forged.vercel.app
Vercel project: martin-gonzalez-s-projects/fated-and-forged

First read docs/HACKATHON_AGENT_CONTRIBUTING.md and docs/PARTNER_PRODUCT_HANDOFF.md completely. Use the GitHub and Vercel credentials already configured in your environment. Never print, paste, commit, or create a file containing an Arcade key, GitHub token, Vercel token, cookie, or .env value.

Your task is to add our Arcade-generated jewelry and any agreed storefront changes.

For each image:
- Save the final image in public/products/ using a unique lowercase hyphenated filename.
- Prefer the highest-resolution Arcade output, ideally 1024×1024.
- Do not overwrite an existing product asset.

For each real product:
- Wait until the Arcade job succeeds.
- Use only that product's real Arcade product ID and guaranteed pricing data.
- Add the product definition to lib/store-catalog.ts.
- Add its audit metadata to data/arcade-products.json.
- Add the matching fallback entry to app/storefront.tsx.
- Never invent or transfer a price, maker, material, product ID, or manufacturing status.

For any pattern-only output or bracelet concept:
- Mark it availability "concept" with price null.
- Label it "Arcade-generated concept art" and "Coming soon."
- Keep Add to bag and checkout disabled.
- Do not describe it as a manufacturable product render.

Preserve the existing visual design and responsive behavior. Run npm run build, git diff --check, and a repository secret scan before committing. Commit only the intended files.

Use a short-lived branch and pull request by default. If I explicitly tell you to use the hackathon fast lane, rebase on origin/main and push your tested commit directly to main.

If your account has access to the existing Vercel project, deploy that exact commit to production with `vercel deploy --prod --yes --logs`. Do not create a new Vercel project. Otherwise, stop after pushing and report that the owner must deploy.

Verify the canonical production site, /api/catalog, and every new image URL. Report the commit SHA, branch or pull request URL, deployment URL if deployed, and verification results.
```

## Security debt after the hackathon

The fast lane is intentionally optimized for speed, not long-term operational safety. Future agents should help complete these items before treating the store as production-ready:

- Rotate any Arcade key that was ever pasted into a conversation and update the Vercel environment variable.
- Restrict direct pushes to `main` and require reviewed pull requests.
- Remove unnecessary Vercel project members and repository collaborators.
- Add authentication and rate limits to product generation endpoints so strangers cannot consume Arcade credits.
- Add server-side validation and rate limits to checkout endpoints.
- Use separate development and production Arcade credentials.
- Add dependency, secret, and image-license checks to CI.
- Record product provenance, consent, and licensing for every contributed image.
- Replace temporary signed asset URLs with durable repository or managed-storage copies.
- Review whether the public storefront needs legal terms, privacy disclosures, returns information, and content warnings.

