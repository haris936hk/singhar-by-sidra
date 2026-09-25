# templateCreate examples

## Route A — HTML + v1

Pasted `<section>…</section>`, no Figma/image: follow [route-html-react.md](route-html-react.md).

`bild template legacy from-jsx <slug>.source.jsx --out …/<slug>.tsx --no-ssr-check`

## Route A — React + v2

“Convert this component to v2”: [route-html-react.md](route-html-react.md) only. No `get_design_context`.

## Route B — Figma + v2

Figma URL: [route-image-figma.md](route-image-figma.md). `get_design_context` with `skillNames: "figma-design-to-code"`, then CLI. Do not use the MCP HTML as Route A.

## Route B — Screenshot + v1

Attached PNG: infer from the **image**, then `legacy from-jsx`. Do not invent sections. Do not `npm install`.

## Mixed message

User pastes Figma MCP JSX **and** a Figma URL → **Route B**. User says “from this HTML” and attaches a screenshot “for color” → **Route A**, screenshot is optional check only.
