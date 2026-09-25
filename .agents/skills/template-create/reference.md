# Shared output contract (both routes)

CLI, typed helpers, v1/v2 snippets, third-party rewrite, validate. No package installs.

## BILD CLI map

| Source | Version | Command |
|---|---|---|
| `.jsx` | v2 | `bild template from-jsx` |
| `.tsx` / `.ts` | v2 | `bild template from-tsx` |
| `.jsx` | v1 | `bild template legacy from-jsx` |
| `.tsx` / `.ts` | v1 | `bild template legacy from-tsx` |
| `.html` / `.htm` | HTML library | `bild template from-html` (copy only — **not** a fielded template) |

`from-jsx` / `from-tsx` refuse `*.template.*` names and files that already contain `$()`.

Flags: `--out`, `--dry-run`, `--no-ssr-check`, `--no-verify`, `--css-mode hybrid|inline|style-tag`, `--site-path`, `--deps-file`.

Prefer `--css-mode hybrid`. Do not pass `--apply-deps` on library add unless the user asks.

## Configurable groups (required)

| Group | Fields |
|---|---|
| **Background** | `backgroundColor` (Color), optional `backgroundImage` (Image) |
| **Typography** | `fontFamily` (Dropdown), `headingSize` (Number), `bodySize` (Number), `headingWeight` (Dropdown), `bodyWeight` (Dropdown) |
| **Colors** | extra accents not on RichText |
| **Alignment** | `textAlign` (left/center/right), `contentAlign` (flex-start/center/flex-end) |
| **Content** | each heading/body/CTA as RichText (+ `ctaUrl` String) |
| **Spacing** | `marginTop`, `marginBottom` (Standard/Large/None) |

Route B: defaults must match the design (do not force `center` if Figma is left-aligned).

## Typed helpers

```tsx
type RichTextField = {
  text?: string;
  color?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textDecoration?: string;
};

type ImageField = { url?: string; alt?: string };

function asText(value: unknown): string {
  if (value && typeof value === "object" && "text" in value) {
    return String((value as RichTextField).text ?? "");
  }
  return String(value ?? "");
}

function asColor(value: unknown, fallback: string): string {
  if (value && typeof value === "object" && "color" in value) {
    return String((value as RichTextField).color || fallback);
  }
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}

function asImage(value: unknown): ImageField {
  if (value && typeof value === "object") return value as ImageField;
  return { url: typeof value === "string" ? value : "", alt: "" };
}

function resolveFontFamily(value: unknown): string {
  const key = String(value || "system").toLowerCase();
  if (key === "uncut sans" || key === "uncut-sans") {
    return '"Uncut Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';
  }
  if (key === "georgia") return 'Georgia, "Times New Roman", serif';
  if (key === "inter") return 'Inter, "Helvetica Neue", Arial, sans-serif';
  return 'system-ui, -apple-system, "Segoe UI", sans-serif';
}

function resolveTextAlign(value: unknown): "left" | "center" | "right" {
  const key = String(value || "center").toLowerCase();
  if (key === "left" || key === "right") return key;
  return "center";
}

function resolveContentAlign(value: unknown): "flex-start" | "center" | "flex-end" {
  const key = String(value || "center").toLowerCase();
  if (key === "flex-start" || key === "start" || key === "left") return "flex-start";
  if (key === "flex-end" || key === "end" || key === "right") return "flex-end";
  return "center";
}

function resolveSectionMargin(value: unknown): number {
  const key = String(value || "standard").toLowerCase();
  if (key === "none") return 0;
  if (key === "large") return 96;
  return 48;
}

function resolveWeight(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
```

## v1 field examples

```tsx
// group { Background }
const backgroundColor = $(backgroundColor:Color="#0d0118");
const backgroundImage = $(backgroundImage:Image={ url: "", alt: "" });
// endgroup
// group { Typography }
const fontFamily = $(fontFamily:Dropdown[System|system,Uncut Sans|uncut-sans,Georgia|georgia,Inter|inter]="uncut-sans");
const headingSize = $(headingSize:Number=48);
const bodySize = $(bodySize:Number=20);
const headingWeight = $(headingWeight:Dropdown[Regular|400,Medium|500,Semibold|600,Bold|700]="700");
const bodyWeight = $(bodyWeight:Dropdown[Regular|400,Medium|500,Semibold|600,Bold|700]="500");
// endgroup
// group { Alignment }
const textAlign = $(textAlign:Dropdown[Left|left,Center|center,Right|right]="center");
const contentAlign = $(contentAlign:Dropdown[Start|flex-start,Center|center,End|flex-end]="center");
// endgroup
// group { Content }
const headline = $(headline:RichText={ text: "Headline", color: "#f0e6ff" });
// endgroup
// group { Spacing }
const marginTop = $(marginTop:Dropdown[Standard|standard,Large|large,None|none]="none");
const marginBottom = $(marginBottom:Dropdown[Standard|standard,Large|large,None|none]="none");
// endgroup
```

```tsx
data-bildit-var-name="headline"
data-bildit-var-type="RichText"
```

## v2 field examples

```tsx
// slug:v1.0 legacy=false
// @template v2

/**
 * Section background
 * @type Color
 * @mutates style:background-color
 * @target .tpl-root
 * @group Background
 */
const backgroundColor = "#0d0118";

/**
 * Headline
 * @type RichText
 * @mutates content
 * @target .tpl-headline
 * @group Content
 */
const headline = { text: "Headline", color: "#f0e6ff" };

/**
 * Horizontal text alignment
 * @type Dropdown
 * @dropdownOption 'Left' | 'left'
 * @dropdownOption 'Center' | 'center'
 * @dropdownOption 'Right' | 'right'
 * @group Alignment
 */
const textAlign = "center";
```

v2 dropdowns need `@dropdownOption` lines. Match `className="tpl-root"` / `tpl-headline`.

## Third-party libraries

| In source | In template |
|---|---|
| `next/link` | `<a href={ctaUrl}>` |
| `next/image` | `<img src={asImage(img).url} alt={...} />` |
| `lucide-react` / MUI / Chakra | exported SVG/`data:` or omit |
| CSS modules | CLI inlines; delete leftover imports |
| `framer-motion` | CSS/React only |
| unknown npm | rewrite or ask; no bare imports; **never `npm install`** |

## Validation (optional, existing CLI only)

```bash
bild template validate path/to/file.tsx
bild template legacy validate path/to/file.tsx
```

Skip validate if `bild` is not installed and the user did not ask to upload. **CMS upload** requires `@bildit-platform/bild-cli` (`npm install -g @bildit-platform/bild-cli`) — install that package only when uploading. Never run a TypeScript compiler check or add preview/TypeScript packages.

v1 `$()` is invalid TS on the library file itself — that is expected. Do not typecheck by installing a compiler.

Do not wire `SOURCE_DIRS` or `TemplateRenderer.tsx` unless the user asks to preview.
