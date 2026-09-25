# template-create

[![skills.sh](https://skills.sh/b/BILDIT-LLC/template-create)](https://skills.sh/BILDIT-LLC/template-create/template-create)

Claude skill for creating **BILDIT CMS templates** (v1 `$()` or v2 JSDoc) via the BILD CLI.

One skill, two exclusive routes:

| Route | When | Doc |
| --- | --- | --- |
| **A — HTML / React** | Pasted HTML, `.html`, React/JSX/TSX | [`route-html-react.md`](./route-html-react.md) |
| **B — Image / Figma** | Figma URL, screenshot, image | [`route-image-figma.md`](./route-image-figma.md) |

Shared CLI / fields / helpers: [`reference.md`](./reference.md)  
Examples: [`examples.md`](./examples.md)

## Install

```bash
npx skills add BILDIT-LLC/template-create
```

Directory: [skills.sh/BILDIT-LLC/template-create/template-create](https://skills.sh/BILDIT-LLC/template-create/template-create)

### Claude Code (git clone)

```bash
# Personal skills
mkdir -p ~/.claude/skills
git clone git@github.com:BILDIT-LLC/template-create.git ~/.claude/skills/template-create

# Or project skills
mkdir -p .claude/skills
git clone git@github.com:BILDIT-LLC/template-create.git .claude/skills/template-create
```

Symlink if you already keep skills elsewhere:

```bash
ln -s /path/to/template-create ~/.claude/skills/template-create
```

## Trigger phrases

- `templateCreate` / `template-create`
- `HTMLtotemplate` / HTML or React → template
- `imagetotemplate` / Figma or screenshot → BILDIT

## Dependencies

- **BILD CLI** available in the environment
- Optional sibling skill **`bild-cli`** for upload flows (`SKILL.md` links to `../bild-cli/SKILL.md` when both skills are installed side-by-side under the same skills root)

## Layout

```
template-create/
├── SKILL.md              # Frontmatter + routing rules
├── route-html-react.md   # Route A
├── route-image-figma.md  # Route B
├── reference.md          # Shared CLI / schema helpers
├── examples.md
└── README.md
```
