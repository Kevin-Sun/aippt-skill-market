# OpenCode Corporate PPTX Skill

Agent Skill + Custom Tool for [OpenCode](https://opencode.ai) that generates PowerPoint presentations in **Banki.ru** corporate style.

## What's inside

```
opencode-corporate-pptx/
├── README.md                  # This file
├── install.sh                 # Auto-install script
├── skill/
│   └── SKILL.md               # Agent Skill — brand guidelines and rules
└── tools/
    ├── corporate-pptx.ts      # Custom Tool — TypeScript wrapper
    ├── generate_pptx.py       # Python PPTX generator (python-pptx)
    └── assets/
        ├── bankiru_logo.png       # Logo (small, fallback)
        ├── bankiru_logo_white.png # White logo (for blue/dark backgrounds)
        └── bankiru_logo_dark.png  # Dark logo (for light backgrounds)
```

### Components

| Component | Type | Description |
|-----------|------|-------------|
| `SKILL.md` | Agent Skill | Full brand guidelines: colors, fonts, layouts, slide types. Loaded by agent on demand. |
| `corporate-pptx.ts` | Custom Tool | TypeScript tool definition. Agent calls it with JSON slide spec, it invokes the Python generator. |
| `generate_pptx.py` | Python script | Generates .pptx files using `python-pptx`. Follows all corporate rules. |
| `assets/` | Logo files | Three variants of the Banki.ru logo for different background colors. |

## Requirements

- **OpenCode** (https://opencode.ai)
- **Python 3.8+**
- **python-pptx** library
- **Bun** runtime (used by OpenCode for custom tools)

## Installation

### Windows

открываем Клод CLI или opencod
```
Установи навык https://github.com/banki-teh/opencode-corporate-pptx
```

## Usage

Once installed, simply ask OpenCode to create a presentation:

> "Создай презентацию про основные услуги на 10 слайдов"

The agent will:
1. Load the `corporate-pptx` skill to learn the brand rules
2. Call the `corporate-pptx` custom tool with a JSON slide specification
3. Produce a `.pptx` file in the current directory

### Supported slide types

| Type | Description | Background |
|------|-------------|-----------|
| `title` | Title/cover slide with logo | Blue `#3E89F7` |
| `section` | Section divider with logo | Blue `#3E89F7` |
| `content` | Bullet points | White |
| `two_column` | Two-column comparison | White |
| `metrics` | Key numbers in cards | White |
| `image` | Image with caption | White |
| `thank_you` | Final slide with logo | Blue `#3E89F7` |

### Direct CLI usage (without OpenCode)

You can also use the Python generator standalone:

```bash
python3 ~/.config/opencode/tools/generate_pptx.py '{
  "filename": "my_presentation.pptx",
  "slides": [
    {"type": "title", "title": "Hello World", "subtitle": "My first presentation"},
    {"type": "content", "title": "Key Points", "bullets": ["Point 1", "Point 2"]},
    {"type": "thank_you", "title": "Thank you!"}
  ]
}'
```

Or with a JSON file:

```bash
python3 ~/.config/opencode/tools/generate_pptx.py --file slides.json
```

## Corporate color palette

Based on the official "Цвета Банки.ру" PowerPoint theme:

| Role | Hex | Usage |
|------|-----|-------|
| Primary Blue (accent1) | `#0D8BFF` | Accents, links, metrics, bullet markers |
| Purple (accent2) | `#9641FF` | Secondary accent |
| Green (accent3) | `#00D73C` | Success indicators |
| Orange (accent4) | `#FF7828` | Warning indicators |
| Light Blue (accent5) | `#96DCFF` | Subtitles on colored backgrounds |
| Light Purple (accent6) | `#C8BEFF` | Soft accents |
| Blue BG (section default) | `#3E89F7` | Title, section, final slide backgrounds |
| Dark BG | `#1E2537` | Alternative dark background |
| Body text | `#566173` | Main body text |
| Headings | `#000000` | Slide titles on white |
| Subtitles | `#162136` | Subtitles on white |

**Font:** Coil Regular (fallback: Arial)



## License

Internal use. Banki.ru brand assets are proprietary.

