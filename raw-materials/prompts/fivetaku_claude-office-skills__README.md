English | [한국어](README.ko.md)

# claude-office-skills

> **Claude in Excel & Claude in PowerPoint skills, restored for Claude Code.**

Anthropic ships domain skills inside **Claude in Excel** and **Claude in PowerPoint** add-ins. This repo reconstructs those skills as plain `SKILL.md` files so you can drop them into Claude Code and use them outside the Office add-ins — on local spreadsheets, `.xlsx` files, `.pptx` files, or any workflow where Claude Code has filesystem access.

[Quick Start](#quick-start) • [Skills](#skills) • [Install](#install) • [Disclaimer](#disclaimer)

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/<your-handle>/claude-office-skills.git
cd claude-office-skills
```

### 2. Copy skills into Claude Code

```bash
# All skills
cp -r claude-in-excel/* ~/.claude/skills/
cp -r claude-in-powerpoint/* ~/.claude/skills/

# Or just one
cp -r claude-in-excel/dcf-model ~/.claude/skills/
```

### 3. Trigger in Claude Code

Each skill has natural-language triggers declared in its frontmatter. Just say what you want:

```
"build a DCF for this company"
"audit this spreadsheet"
"make a competitive landscape deck"
"refresh this deck"
```

Claude Code auto-matches the request to the correct skill.

---

## Skills

### 📊 claude-in-excel (6 skills)

| Skill | Purpose | Example triggers |
|-------|---------|------------------|
| `audit-xls` | Audit formulas, errors, model integrity | "check my formulas", "model won't balance", "QA this spreadsheet" |
| `clean-data-xls` | Clean and standardize messy data | "clean this data", "standardize this sheet" |
| `3-statement-model` | Build Income Statement / Balance Sheet / Cash Flow | "build a 3-statement model", "fill out this financial model" |
| `dcf-model` | Discounted Cash Flow valuation | "build a DCF", "value this company" |
| `lbo-model` | Leveraged Buyout model | "build an LBO", "model this buyout" |
| `comps-analysis` | Comparable companies analysis | "run comps", "peer comparison" |

### 🎨 claude-in-powerpoint (3 skills)

| Skill | Purpose | Example triggers |
|-------|---------|------------------|
| `competitive-analysis` | Build a competitive landscape deck | "competitive landscape", "build a market map" |
| `deck-refresh` | Swap numbers across an existing deck (quarterly refresh, earnings update, comp roll) | "update the deck with Q4 numbers", "roll this forward" |
| `ib-check-deck` | IB-grade deck QC — number consistency, narrative alignment, formatting | "check my numbers", "reconcile figures across slides", "is this client-ready" |

Each skill folder contains:

```
<skill-name>/
├── SKILL.md           # name, description (triggers), instructions
├── references/        # supporting docs (schemas, frameworks, formulas)
└── scripts/           # optional Python helpers
```

**Bundled helper scripts:**

| Script | Lives in | Purpose |
|--------|----------|---------|
| `recalc.py` | `3-statement-model`, `dcf-model`, `lbo-model`, `comps-analysis` | Recalculate and re-link formulas after edits |
| `validate_dcf.py` | `dcf-model` | Sanity-check a built DCF (WACC, terminal value, growth assumptions) |
| `extract_numbers.py` | `ib-check-deck` | Pull all figures out of a deck for cross-slide reconciliation |

---

## Install

### Global install (recommended)

Put the skills where Claude Code looks globally:

```bash
# From repo root
cp -r claude-in-excel/* ~/.claude/skills/
cp -r claude-in-powerpoint/* ~/.claude/skills/
```

### Per-project install

Drop just the skills you need into a single project:

```bash
mkdir -p .claude/skills
cp -r /path/to/claude-office-skills/claude-in-excel/dcf-model .claude/skills/
```

### Verify

Start Claude Code in the target directory and ask:

```
"what skills do you have?"
```

Claude should list the installed skills.

---

## Repository structure

```
claude-office-skills/
├── README.md
├── README.ko.md
├── claude-in-excel/
│   ├── audit-xls/
│   ├── clean-data-xls/
│   ├── 3-statement-model/
│   ├── dcf-model/
│   ├── lbo-model/
│   └── comps-analysis/
└── claude-in-powerpoint/
    ├── competitive-analysis/
    ├── deck-refresh/
    └── ib-check-deck/
```

---

## Why this exists

Claude in Excel and Claude in PowerPoint are great — **inside** the add-ins. But if you work in Claude Code with local files, the same skill logic (DCF modeling, deck building, formula auditing) is just sitting there, unusable. This repo brings those skills to where the rest of your work already happens:

- Run a DCF on a local `.xlsx` without opening Excel
- Audit a financial model from the terminal
- Build a deck into a `.pptx` file you generated programmatically
- Chain office skills with your other Claude Code tools (git, bash, MCP servers)

Same prompts, same outputs — just unbundled from the add-ins.

---

## Disclaimer

> ⚠️ **These skills are reconstructions of Anthropic's proprietary skills** bundled with Claude in Excel and Claude in PowerPoint. All credit for the underlying skill design goes to Anthropic. This repository is an unofficial community archive made to port those skills into the Claude Code environment.
>
> - All copyright in the original skill content belongs to **Anthropic**.
> - This repo is **not affiliated with or endorsed by Anthropic**.
> - If Anthropic requests removal, this repo will be taken down.
>
> The repository structure, documentation, and any helper scripts written specifically for Claude Code are released under MIT (see below).

---

## Requirements

- [Claude Code](https://docs.anthropic.com/claude-code) CLI
- A Claude plan or API key that can run skills

Some skills (like `dcf-model`) include optional Python helper scripts. You'll need `python3` if you want to use them — otherwise the skills work off `SKILL.md` alone.

---

## Contributing

Found a skill that behaves differently from the add-in? Open an issue or PR with:

1. Which skill
2. What the add-in does
3. What this repo does
4. Ideally, a corrected `SKILL.md` diff

Please don't submit skills extracted from other proprietary Claude products without attribution.

---

## License

- **Repository structure & documentation:** MIT
- **Skill content (SKILL.md, references, scripts):** © Anthropic — archived here under fair-use-style community reconstruction. Remove on request.

---

<div align="center">

**Bring the Office add-in skills to your terminal.**

</div>
