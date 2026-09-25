# Route A — HTML / React only

Use this file **only** after [SKILL.md](SKILL.md) selected Route A. Do not open Figma tools. Do not reconstruct from an image.

Also read [reference.md](reference.md) for CLI, helpers, and field snippets.

## Inputs

| Input | Source |
|---|---|
| HTML or React | Pasted markup, `.html`/`.htm`, or `.jsx`/`.tsx`/`.js`/`.ts` |
| Version | v1 or v2 |

Optional: slug, folder, CMS `type`. Default folder: nearby library (`VEE-Integration-test/`, `Summer_Collection/`, `new_Collection/`). Slug: kebab-case from heading or filename.

## Checklist

```
Route A (markup):
- [ ] 1. Confirm Route A (no Figma/image as source of truth)
- [ ] 2. Normalize HTML or React → clean <slug>.source.jsx/.tsx
- [ ] 3. BILD CLI convert for v1 or v2
- [ ] 4. Enrich configurable fields; React-only imports
- [ ] 5. Sidecar JSON; `bild` validate if CLI already available (no installs)
- [ ] 6. Report (no upload unless asked)
```

## Step 1 — Normalize

### HTML

1. Save if needed.
2. Map semantic HTML → a **plain React default export**. CLI `from-html` **copies** HTML and does **not** create fields — always go through JSX for a CMS template.
3. Drop Tailwind `class` names; use **inline styles** (live editor has no project CSS variables).
4. Rewrite `/public` images to `https://` or `data:`.
5. Write `<slug>.source.jsx` (or `.tsx`) **without** `$()` and **without** `*.template.*` in the name.

Preserve the **given** structure, copy, and colors. Do not restyle into a different layout.

### React / JSX / TSX

1. Copy to `<slug>.source.jsx` or `.tsx`.
2. `export default function ...`.
3. Strip `next/link`, `next/image`, `next/font`, `useRouter`, server components.
4. If the file already has `$()` or is named `*.template.*`, skip CLI convert → Step 3 enrich.

## Step 2 — BILD CLI

| Version | Command |
|---|---|
| v2 | `bild template from-jsx` / `from-tsx` |
| v1 | `bild template legacy from-jsx` / `from-tsx` |

```bash
bild template from-jsx <slug>.source.jsx --out <dest>/<slug>.tsx --no-ssr-check
bild template from-tsx <slug>.source.tsx --out <dest>/<slug>.tsx --no-ssr-check
bild template legacy from-jsx <slug>.source.jsx --out <dest>/<slug>.tsx --no-ssr-check
bild template legacy from-tsx <slug>.source.tsx --out <dest>/<slug>.tsx --no-ssr-check
```

`--strict` only after a first success. Keep `window`/`document` out of render.

Raw HTML library item (no fields): `bild template from-html` only if the user explicitly wants `--code-type html`.

## Step 3 — Enrich

Add groups from [reference.md](reference.md): Background, Typography, Colors, Alignment, Content, Spacing. Use typed helpers (`asText`, `asColor`, …).

v1: `data-bildit-var-name` / `data-bildit-var-type`. v2: `className` + `@mutates` / `@target`.

`forceMobile?: boolean` + unconditional `useIsMobile(768)` when type or stack changes.

## Step 4 — Sidecar and validate (no installs)

```json
{
  "name": "<slug>",
  "description": "<one line>",
  "type": "<CMS folder type>",
  "image": "",
  "codeType": "tsx",
  "appType": "web",
  "templateId": "<slug>"
}
```

```bash
bild template validate <dest>/<slug>.tsx
bild template legacy validate <dest>/<slug>.tsx
```

Use `bild` only if it is already installed. **Do not** `npm install`, run a TypeScript compiler check, wire `preview/`, or register `TemplateRenderer` unless the user asks.

## Step 5 — Handoff

Report slug, paths, **Route A**, version, and fields. Stop after the template + sidecar exist.
