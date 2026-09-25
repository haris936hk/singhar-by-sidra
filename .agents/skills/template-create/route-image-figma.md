# Route B — Image / Figma (accurate design)

Use this file **only** after [SKILL.md](SKILL.md) selected Route B. The **Figma node or image is the source of truth**. Do not convert leftover HTML/Tailwind as Route A.

Shared CLI and fields: [reference.md](reference.md).

## Goal

Match the design: hierarchy, spacing, colors, type sizes, alignment, real assets. Configurable CMS fields wrap that look — they must not flatten a Figma layout into a generic centered stack unless the design is that stack.

## Inputs

| Input | Source |
|---|---|
| Image or Figma | Attachment, path, or `figma.com/design/...?node-id=` |
| Version | v1 or v2 |

Optional: slug (Figma node name or `section-from-image`), folder, CMS `type`.

## Checklist

```
Route B (design):
- [ ] 1. Confirm Route B (Figma URL, image, or design keywords)
- [ ] 2. Ingest Figma (get_design_context) or read the screenshot
- [ ] 3. Clean React that matches the design (assets https/data)
- [ ] 4. BILD CLI convert for v1 or v2
- [ ] 5. Enrich fields without breaking layout; sidecar; `bild` validate if CLI already available
- [ ] 6. Report (no upload unless asked)
```

## Step 1 — Ingest (required)

### Figma URL

1. Parse `fileKey` + `node-id` (`1-234` → `1:234`). No `node-id` → ask; do not guess.
2. Load **figma-design-to-code**. Call `get_design_context` with `skillNames: "figma-design-to-code"` (or `resource:figma-design-to-code`).
3. Use MCP output as **reference** (screenshot + hints + assets). Do not paste Tailwind as the library file.
4. Download assets. MCP URLs expire (~7 days) — rewrite to `https://` or `data:` before handoff. Render icons from exported assets; do not redraw paths.

Map into the clean source:

- Text → copy + color + size + weight + align from the node
- Fills → background / accent
- Auto-layout → flex direction, gap, padding, alignment (not a guessed hero)
- Images → Image fields or embedded `data:`/`https://`

### Screenshot / image

Read the image. Infer only what is visible:

- Background / gradient (geometry may be fixed; expose tint Color)
- Each text block and CTA
- Alignment (left vs center vs right)
- Type scale; stack vs row
- Photos/logos present in the frame

Do **not** add sections, logos, or CTAs that are not in the image. Ask once if a critical size is unreadable.

## Step 2 — Clean React that matches the design

`<slug>.source.jsx` / `.tsx`:

- Default export, `react` only
- Inline styles from the design (flex, gap, padding, maxWidth, type)
- Desktop vs mobile: `forceMobile` / `useIsMobile(768)` when the design (or Figma frames) actually change
- Decorative orbits/branches: keep geometry; still expose background + type
- No `$()`, no `*.template.*` name

Accuracy bar: same structure and visual hierarchy as the design; not a restyled generic section.

## Step 3 — BILD CLI

```bash
bild template from-jsx <slug>.source.jsx --out <dest>/<slug>.tsx --no-ssr-check
bild template legacy from-jsx <slug>.source.jsx --out <dest>/<slug>.tsx --no-ssr-check
```

Use `from-tsx` / `legacy from-tsx` for TypeScript sources.

## Step 4 — Enrich without flattening

Add Background, Typography, Colors, Alignment, Content, Spacing from [reference.md](reference.md). Defaults must **match the design** (e.g. left-aligned Figma → `textAlign` default `left`, not `center`).

v1 annotations / v2 `@target` on the real nodes.

## Step 5 — Sidecar and validate (no installs)

Same sidecar JSON as Route A. Run `bild template validate` / `legacy validate` only if `bild` is already on PATH.

**Do not** `npm install`, run a TypeScript compiler check, start the preview app, or wire `SOURCE_DIRS` / `TemplateRenderer` unless the user asks.

## Step 6 — Handoff

Match the design in the generated `.tsx` (hierarchy, copy, colors, alignment). Report slug, paths, **Route B**, version, fields, Figma node or image note. Stop after the template + sidecar exist.

## Anti-patterns

- Skipping `get_design_context` when a node URL exists
- Shipping expiring Figma MCP asset URLs
- Forcing a centered hero when Figma is a split or grid
- Inventing content not in the screenshot
- Installing npm packages or preview tooling to generate a template
