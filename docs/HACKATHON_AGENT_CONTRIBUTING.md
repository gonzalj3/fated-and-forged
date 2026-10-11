# Hackathon agent contribution guide

This guide lets another person and their coding agent add jewelry images, edit the Fated & Forged storefront, and publish changes during the hackathon. A GitHub account is optional.

- Production: <https://fated-and-forged.vercel.app>
- GitHub: <https://github.com/gonzalj3/fated-and-forged>
- Vercel project: `martin-gonzalez-s-projects/fated-and-forged`
- Vercel project ID: `prj_X8d6vk7FD0N7dDeahNcEYutydIrI`

## One-time access setup

### Partner without GitHub

The partner can deploy directly with a temporary Vercel token that can access the existing project. The owner creates the token in Vercel, gives it to the partner for the hackathon, and revokes it afterward. Put it in the partner agent's environment as `VERCEL_TOKEN`; do not paste it into source files.

The current source bundle is published at:

```text
https://fated-and-forged.vercel.app/contributor-kit/fated-and-forged-source.tar.gz
```

The partner downloads this bundle, edits it, rebuilds the bundle so the next contributor receives the latest source, and deploys it straight to the existing Vercel project. This path changes the live website without GitHub.

### Partner with GitHub

The repository owner invites the partner's GitHub username as a collaborator on the private repository. GitHub access is enough to upload images and source changes.

For the partner to deploy production personally, the owner must also give their Vercel account access to the `fated-and-forged` project. Otherwise, the partner should push the commit to GitHub and ask the owner or owner agent to run the production deployment.

Do not paste an Arcade key, GitHub token, or Vercel token into a prompt, source file, commit, issue, or pull request. The agent may use credentials that are already configured in its environment.

## Direct Vercel workflow without GitHub

Download and extract the current source:

```bash
mkdir fated-and-forged
cd fated-and-forged
curl -fsSLo source.tar.gz https://fated-and-forged.vercel.app/contributor-kit/fated-and-forged-source.tar.gz
tar -xzf source.tar.gz
rm source.tar.gz
npm install
```

Make the requested changes. Put new images in `public/products/` and update the catalog files described below. Then validate, regenerate the downloadable source bundle, and deploy:

```bash
npm test
npm run build
git diff --check 2>/dev/null || true
rg -n --hidden --glob '!.git/**' 'arcade''_sk_|ghp''_|github''_pat_' .
npm run contributor-kit
npx vercel link --yes --team team_m2GV3vYmjMXTChccVmkqej0D --project prj_X8d6vk7FD0N7dDeahNcEYutydIrI --token "$VERCEL_TOKEN"
npx vercel deploy --prod --yes --logs --token "$VERCEL_TOKEN"
```

The secret scan should return no matches. The deployment must report that it was aliased to `https://fated-and-forged.vercel.app`. The regenerated contributor kit is essential because it is the source record for the next no-GitHub contributor.

## Current application structure

- `public/products/` contains the storefront image files that Vercel serves.
- `lib/store-catalog.ts` contains the product IDs and customer-facing metadata used by `/api/catalog`.
- `app/storefront.tsx` contains the storefront layout and its fallback product data.
- `data/arcade-products.json` is the checked-in audit record for generated products.

For a new image, use a unique lowercase hyphenated filename such as `midnight-orbit-necklace.png`. Preserve the original Arcade output, then create the storefront asset as a square WebP in `public/products/`. Never overwrite an unrelated product image.

```bash
cwebp -quiet -q 82 -m 6 original.png -o public/products/midnight-orbit-necklace.webp
```

Keep each WebP below 200 KB. Update `localAsset` in `data/arcade-products.json` to the `.webp` path.

## Truthful product states

### Priced and purchasable

A product may be marked `priced` only when Arcade returned a successful product ID and a guaranteed price. Add its real product ID to `catalog` in `lib/store-catalog.ts` and its exact verified price snapshot to `data/arcade-products.json`. The storefront reads this checked-in snapshot and does not call Arcade during page rendering. Do not reuse a price from a different product and do not invent a maker, material, or manufacturing status.

Persist the optimized storefront render at `public/products/<slug>.webp`, add the matching metadata to `data/arcade-products.json`, and add a fallback entry to `fallbackProducts` in `app/storefront.tsx`.

## Image-performance contract

- The homepage and `/api/catalog` must remain static and must not call `getProduct` or any Arcade endpoint.
- Existing product images must load from Vercel under `/products/<slug>.webp`.
- The hero image is preloaded and uses eager loading with high fetch priority.
- Product-grid images use native lazy loading and asynchronous decoding.
- Run `npm test` before every deployment. The tests enforce asset presence, byte budgets, loading attributes, static catalog reads, and removal of unsupported collections.
- If the loading lifecycle changes, update `specs/ImageLoading.tla` and run TLC with `specs/ImageLoading.cfg`.

### Pattern-only or concept output

Do not add pattern-only or concept imagery to the live storefront. The current catalog contains only successfully generated engagement and after-dark products with real Arcade product IDs and verified price snapshots.

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
npm test
npm run build
git diff --check
rg -n --hidden --glob '!.git/**' 'arcade''_sk_|ghp''_|github''_pat_' .
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
curl -I https://fated-and-forged.vercel.app/products/<new-image-name>.webp
```

Confirm that:

- The homepage and image URLs return HTTP 200.
- The new catalog entries appear in `/api/catalog`.
- Real products show their own Arcade price.
- Every displayed product has its own real Arcade product ID and verified price snapshot.
- `git rev-parse HEAD` matches `git ls-remote origin refs/heads/main` after a direct-to-main release.

## Copy-paste prompt for a no-GitHub partner agent

```text
You are authorized to update the Fated & Forged production website directly for this hackathon. You do not need GitHub.

Production: https://fated-and-forged.vercel.app
Source bundle: https://fated-and-forged.vercel.app/contributor-kit/fated-and-forged-source.tar.gz
Vercel team ID: team_m2GV3vYmjMXTChccVmkqej0D
Vercel project ID: prj_X8d6vk7FD0N7dDeahNcEYutydIrI

Use the temporary Vercel token already supplied in your environment as VERCEL_TOKEN. Never print it or save it in the project.

Download and extract the source bundle into a new directory. Read docs/HACKATHON_AGENT_CONTRIBUTING.md and docs/PARTNER_PRODUCT_HANDOFF.md completely before editing.

Add our Arcade jewelry images to public/products/ as WebPs with unique lowercase hyphenated filenames. Keep each storefront image under 200 KB. Update lib/store-catalog.ts, data/arcade-products.json, and the fallback products in app/storefront.tsx as appropriate.

A piece is publishable only if Arcade returned a successful product ID and that piece's guaranteed price. Never invent or transfer pricing, maker, material, product ID, or manufacturing status. Do not add pattern-only or concept outputs to the storefront.

You may make the agreed layout, copy, styling, and functionality changes. Preserve unrelated behavior and the responsive design.

Do not add an Arcade request to page rendering or `/api/catalog`; existing images and verified product snapshots must be served by Vercel. Run npm test, npm run build, and the secret scan in the contributor guide. Resolve all failures. Then run npm run contributor-kit so your updated source is included in the production deployment for the next contributor.

Link only to the existing Vercel project with:
npx vercel link --yes --team team_m2GV3vYmjMXTChccVmkqej0D --project prj_X8d6vk7FD0N7dDeahNcEYutydIrI --token "$VERCEL_TOKEN"

Deploy directly with:
npx vercel deploy --prod --yes --logs --token "$VERCEL_TOKEN"

Do not create a new Vercel project. Confirm the deployment is aliased to https://fated-and-forged.vercel.app.

Verify the homepage, /api/catalog, every new image URL, and product pricing states. Report the production URL, deployment ID, changed files, and verification results.
```

## Copy-paste prompt for a GitHub partner agent

```text
You are an authorized hackathon contributor to the Fated & Forged website.

Repository: https://github.com/gonzalj3/fated-and-forged
Production: https://fated-and-forged.vercel.app
Vercel project: martin-gonzalez-s-projects/fated-and-forged

First read docs/HACKATHON_AGENT_CONTRIBUTING.md and docs/PARTNER_PRODUCT_HANDOFF.md completely. Use the GitHub and Vercel credentials already configured in your environment. Never print, paste, commit, or create a file containing an Arcade key, GitHub token, Vercel token, cookie, or .env value.

Your task is to add our Arcade-generated jewelry and any agreed storefront changes.

For each image:
- Preserve the highest-resolution Arcade output, ideally 1024×1024.
- Convert the storefront copy to WebP and save it in public/products/ using a unique lowercase hyphenated filename.
- Keep the WebP under 200 KB.
- Do not overwrite an existing product asset.

For each real product:
- Wait until the Arcade job succeeds.
- Use only that product's real Arcade product ID and guaranteed pricing data.
- Add the product definition to lib/store-catalog.ts.
- Add its audit metadata to data/arcade-products.json.
- Add the matching fallback entry to app/storefront.tsx.
- Never invent or transfer a price, maker, material, product ID, or manufacturing status.

Do not add pattern-only or concept outputs to the live catalog.

Do not add Arcade requests to page rendering or `/api/catalog`. Preserve the existing visual design and responsive behavior. Run npm test, npm run build, git diff --check, and a repository secret scan before committing. Commit only the intended files.

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

