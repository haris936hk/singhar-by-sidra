---
name: template-create
description: >-
  Create a BILDIT CMS template (v1 $() or v2 JSDoc) via BILD CLI. Routes
  strictly: HTML or React markup uses the markup-only path; Figma URL, screenshot,
  or image uses the design-accurate path. Use when the user says templateCreate,
  template-create, HTMLtotemplate, imagetotemplate, HTML/React to template, or
  Figma/screenshot to BILDIT.
---

# templateCreate

One skill, **two exclusive routes**. Pick the route **before** writing files. Do not mix ingest methods.

Read after routing:

- Markup route → [route-html-react.md](route-html-react.md)
- Design route → [route-image-figma.md](route-image-figma.md)
- Shared CLI / fields / helpers → [reference.md](reference.md)
- Upload (only if asked) → [bild-cli](../bild-cli/SKILL.md)

---

## Route (do this first)

Evaluate the **user message + attachments** in this order. Stop at the first match.

### Route B — Image / Figma (design-accurate)

Take this route if **any** of these is true:

- A `figma.com` URL is present
- The user says Figma, FigJam, screenshot, mockup, PNG/JPG/WebP, or imagetotemplate
- An image is attached or a local image path is the source

**Then:** follow **only** [route-image-figma.md](route-image-figma.md). Reconstruct from the **design**. Do **not** treat pasted Figma MCP HTML/Tailwind as Route A. Do **not** skip `get_design_context` when a Figma node URL exists.

### Route A — HTML / React (markup-only)

Take this route if Route B did **not** match **and** **any** of these is true:

- Pasted HTML (`<section`, `<div`, markup)
- A `.html` / `.htm` file
- React/JSX/TSX/JS component source
- The user says HTML, React, JSX, HTMLtotemplate, or “from this component”

**Then:** follow **only** [route-html-react.md](route-html-react.md). Build from **that markup**. Do **not** call Figma MCP. Do **not** invent a new layout from a screenshot you were not given as the source.

### Both artifacts, user named the source

If HTML/React **and** Figma/image appear:

| User names the source | Route |
|---|---|
| “from this HTML / React / component” | **A** — markup is truth; ignore Figma/image except optional visual check |
| “from this Figma / image / screenshot” | **B** — design is truth; ignore HTML except as MCP reference |

If they did **not** name a source: **Route B** (design present).

### Neither

Ask once: markup (HTML/React) or design (image/Figma), plus **v1 or v2**.

### Version (both routes)

If omitted, ask once. `v1` / `legacy` → `$()`. `v2` → `// @template v2` + JSDoc. Never mix in one file.

---

## Shared hard rules (both routes)

1. BILD CLI convert after a **clean React source** (no `$()`, default export, inline styles).
2. Enrich configurable groups: Background, Typography, Colors, Alignment, Content, Spacing ([reference.md](reference.md)).
3. React-only imports. Images: `https://` or `data:` only. Rewrite third-party UI libs to inline SVG / `<a>` / `<img>`. Do **not** `npm install` preview, TypeScript, or other template deps.
4. Deliverable is the **matching template file** (`<slug>.tsx` + sidecar JSON). No preview app, no `tsc`, no `SOURCE_DIRS` / `TemplateRenderer` wiring unless the user asks.
5. `bild template validate` (v2) or `legacy validate` (v1) if `bild` is on PATH. Convert/validate/upload all use the **BILD CLI npm package** `@bildit-platform/bild-cli`.
6. **CMS upload** (`bild library add/update`) requires `@bildit-platform/bild-cli` installed globally (or otherwise on PATH). If the user asked to upload and `bild` is missing:

```bash
npm install -g @bildit-platform/bild-cli
```

Install **only** that package. Then follow [bild-cli](../bild-cli/SKILL.md). Do not install anything else.
7. No `bild library add/update` or git commit unless the user asks.

## Anti-patterns

- Running Figma ingest because HTML “looks like a design”
- Running markup-only convert on a Figma URL (skips accurate layout/assets)
- Mixing `$()` and v2 JSDoc
- Pasting Figma Tailwind into the library as the final template
- Installing npm packages, TypeScript, or preview deps to “finish” a template
- Uploading to CMS without `@bildit-platform/bild-cli` (`bild`) installed
