---
name: corporate-pptx
description: Generate PowerPoint presentations in Banki.ru corporate style with correct colors, fonts, layouts, and logo placement
---

## What I do

Generate PPTX presentations that strictly follow the Banki.ru corporate brand guidelines extracted from the official `Шаблон демо.pptx` template. All presentations must use the exact color palette, typography, and layout rules described below.

## When to use me

Use this skill whenever the user asks to:
- Create a PowerPoint / PPTX presentation
- Generate slides or a slide deck
- Make a corporate presentation
- Prepare materials for a meeting/demo in presentation format

Always load this skill BEFORE writing any python-pptx code or calling the `corporate-pptx` custom tool.

---

## Brand Identity

**Company:** Banki.ru (Банки.ру)
**Theme name:** "Цвета Банки.ру" (official PowerPoint theme)

### Logo files (in `~/.config/opencode/tools/assets/`)
- `bankiru_logo_white.png` — white logo for dark/colored backgrounds (348x106 px, RGBA)
- `bankiru_logo_dark.png` — dark logo for light backgrounds (364x111 px, RGBA)
- `bankiru_logo.png` — small logo variant (348x105 px, RGBA)

---

## Official Theme Color Palette ("Цвета Банки.ру")

Extracted from the `a:clrScheme` of `Шаблон демо.pptx`:

| Theme Role | Hex | Name | Usage |
|-----------|-----|------|-------|
| accent1 | `#0D8BFF` | Primary Blue | Main accent, links, key metrics, highlighted numbers, blue accent bars |
| accent2 | `#9641FF` | Purple | Secondary accent, alternative section backgrounds |
| accent3 | `#00D73C` | Green | Success indicators, positive metrics |
| accent4 | `#FF7828` | Orange | Warning indicators, attention elements |
| accent5 | `#96DCFF` | Light Blue | Subtitle text on dark backgrounds, soft blue accents |
| accent6 | `#C8BEFF` | Light Purple | Soft purple accents |
| dk1 | `#000000` | Black (windowText) | Headings on white backgrounds |
| lt1 | `#FFFFFF` | White (window) | Text on colored backgrounds |
| dk2 | `#EBF5FF` | Ice Blue | Light tinted backgrounds |
| lt2 | `#F0F0FF` | Lavender | Light tinted backgrounds |
| hlink | `#0D8BFF` | Link Blue | Hyperlinks (same as accent1) |
| folHlink | `#9641FF` | Visited Link | Followed hyperlinks (same as accent2) |

### Extended Palette (from template content)

| Role | Hex | Usage |
|------|-----|-------|
| Dark Navy | `#0F1A24` | Section slide backgrounds (dark variant) |
| Dark Subtitle | `#162136` | Subtitles, footnotes on light backgrounds |
| Body Gray-Blue | `#566173` | Body text, descriptions, secondary content |
| Section Blue BG | `#3E89F7` | **PRIMARY SECTION SLIDE BACKGROUND (blue variant)** |
| Section Purple BG | `#9641FF` | Section slide background (purple variant) |
| Section Dark BG | `#1E2537` | Section slide background (dark variant) |
| Light Section BG | `#EBF5FF` | Section slide background (light variant) |

---

## Background Variants for Section / Title / Final slides

The template provides **4 background color variants** (from `image (3).png` reference). **Blue is the priority default:**

| # | Name | Main Color | Text Color | When to use |
|---|------|-----------|------------|-------------|
| **1** | **Blue (DEFAULT)** | **`#3E89F7`** | **`#FFFFFF`** | **Default for title, section dividers, and final slides** |
| 2 | Dark Navy | `#1E2537` | `#FFFFFF` | Alternative dark variant |
| 3 | Light / White | `#EBF5FF` / `#FFFFFF` | `#000000` | Content-heavy section dividers |
| 4 | Purple | `#9641FF` | `#FFFFFF` | Alternative vibrant variant |

> IMPORTANT: The **blue background (`#3E89F7`)** is the PRIORITY default for all section dividers, title slides, and final slides. Use other variants only when explicitly requested.

### Decorative Background Elements

Title and final slides in the template use **large decorative splash/circle images** positioned in the right portion of the slide as overlay elements. These are semi-transparent gradient splashes in complementary blue tones (`#1E99FF` to `#58BBFF`).

---

## Typography

**Primary font:** `Coil Regular`

> If the Coil font is not available on the system, use `Arial` as fallback.

### Font Size Scale (Standard 25.4cm format)

| Element | Size (pt) | Color | Bold |
|---------|-----------|-------|------|
| Slide title | 25.6 | `#000000` on white bg / `#FFFFFF` on colored bg | No |
| Subtitle | 12.8 | `#162136` or `#566173` | No |
| Subtitle on colored bg | 12.8 | `#96DCFF` (accent5, Light Blue) | No |
| Key metric number | 33.9 | `#0D8BFF` on white bg / `#FFFFFF` on colored bg | No |
| Hero number (large) | 107.6 | `#FFFFFF` | No |
| Card/block header | 10.7 - 12.8 | `#FFFFFF` on colored bg / `#0D8BFF` on white bg | No |
| Body text | 10.7 | `#566173` | No |
| Small body text | 7.1 - 9.0 | `#566173` | No |
| Footnote | 5.3 - 6.4 | `#162136` | No |
| "Thank you" text | 53.4 | `#FFFFFF` | No |
| Accent bar marker | — | `#0D8BFF` (vertical bar, w=0.32cm) | — |

### Font Size Scale (Large 67.74cm demo format)

| Element | Size (pt) | Color |
|---------|-----------|-------|
| Slide title | 72.0 | `#000000` |
| Subtitle | 48.0 | `#162136` |
| Section metric title | 36.0 | `#000000` |
| Metric value | 72.0 | theme accent1 `#0D8BFF` |
| Body text | 30.0 | `#000000` |

---

## Slide Dimensions

**Standard presentation:** 25.4 cm x 14.29 cm (widescreen 16:9)
**Demo/large format:** 67.74 cm x 38.1 cm (internal demos with screenshots)

Default: **Standard 25.4 x 14.29 cm** unless user explicitly requests large format.

---

## Layout Templates

### 1. Title Slide (first slide)
- **Background:** **Blue `#3E89F7`** (priority default)
- **Logo:** White variant (`bankiru_logo_white.png`), top-left: left=1.9cm, top=1.9cm, width=12.8cm, height=3.9cm (demo) / scaled proportionally for standard
- **Title text:** Large, white `#FFFFFF`, font size 42.8pt (standard) or 72pt (demo), positioned at left=1.06cm, top region
- **Subtitle:** Light blue `#96DCFF`, below title
- **Decorative element:** Large semi-transparent gradient splash in right portion of slide

### 2. Content Slide (most common)
- **Background:** White `#FFFFFF`
- **Title:** Top-left, left=1.06cm, top=1.06cm, font 25.6pt, color `#000000`
- **Subtitle:** Below title, 12.8pt, color `#162136`
- **Content area:** Below title, starting from top=4.0cm
- **Grid layout:** 2-column or 4-column grids
- **Cards:** Rounded rectangles with `#0D8BFF` header strip and white body
- **Blue accent bars:** Vertical `#0D8BFF` bars (width=0.32cm) as list item markers

### 3. Section Divider Slide
- **Background:** **Blue `#3E89F7`** (priority default)
- **Logo:** White variant, top-left, left=1.9cm, top=1.9cm
- **Section title:** Large white `#FFFFFF` text, positioned in lower-left area
- **Subtitle:** Below title, `#96DCFF` (Light Blue accent5)

### 4. Metrics/Stats Slide
- **Background:** White
- **Title:** Standard position (top-left), `#000000`
- **Metric cards:** Rounded rectangles with `#0D8BFF` top accent strip
- **Key numbers:** Large 33.9pt in `#0D8BFF`
- **Labels:** Below numbers, 10.2pt in `#566173`
- **Brand mentions ("Банки.ру"):** Always colored `#0D8BFF`

### 5. Two-Column Slide
- **Background:** White
- **Title:** Standard position
- **Column cards:** Two equal-width cards side by side
- **Card headers:** `#0D8BFF` blue strip with white text
- **Card body:** White background, text in `#566173`

### 6. Image Slide
- **Background:** White
- **Title:** Standard position
- **Image area:** Large image placeholder or actual image below title
- **Caption:** Small text below image in `#162136`

### 7. Final "Thank You" Slide
- **Background:** **Blue `#3E89F7`** (priority default, matching title slide)
- **Logo:** White variant, top-left
- **"Спасибо за внимание!":** Large (53.4pt), white `#FFFFFF`, lower-left
- **Contact info:** Light blue `#96DCFF`, below or above thank-you text

---

## Layout Rules

1. **Margins:** Left margin = 1.06cm for content. Logo area starts at ~1.9cm.
2. **Logo placement:**
   - Title slide: White logo, top-left
   - Section dividers: White logo, top-left
   - Final slide: White logo, top-left
   - Content slides: NO logo (clean content area)
3. **Title alignment:** Always top-left, never centered.
4. **Brand name "Банки.ру"** in running text: Always colored `#0D8BFF`, rest of sentence in its normal color.
5. **No bold/italic/underline:** Clean, minimal typography with Coil Regular.
6. **Card spacing:** ~0.5cm gap between cards in grids.
7. **Accent bar:** Vertical `#0D8BFF` bar (w=0.32cm) next to table-of-contents style items.
8. **Background priority:** Always use blue `#3E89F7` background for title/section/final slides unless user specifies otherwise.

---

## How to Generate

Use the `corporate-pptx` custom tool. Pass a JSON string describing the slides.

### JSON Structure

```json
{
  "filename": "output_presentation.pptx",
  "slides": [
    {
      "type": "title",
      "title": "Main Presentation Title",
      "subtitle": "Optional subtitle"
    },
    {
      "type": "section",
      "title": "Section Name",
      "subtitle": "What this section covers"
    },
    {
      "type": "content",
      "title": "Slide Title",
      "subtitle": "Optional subtitle",
      "bullets": ["Point 1", "Point 2", "Point 3"]
    },
    {
      "type": "two_column",
      "title": "Comparison",
      "left_title": "Option A",
      "left_bullets": ["Fact 1", "Fact 2"],
      "right_title": "Option B",
      "right_bullets": ["Fact 1", "Fact 2"]
    },
    {
      "type": "metrics",
      "title": "Key Numbers",
      "metrics": [
        {"value": "29.5 млн", "label": "трафика в месяц"},
        {"value": "300+", "label": "финансовых партнеров"}
      ]
    },
    {
      "type": "image",
      "title": "Screenshot",
      "image_path": "/path/to/image.png",
      "caption": "Description"
    },
    {
      "type": "thank_you",
      "title": "Спасибо за внимание!",
      "contact": "partnership@banki.ru"
    }
  ]
}
```

### Supported Slide Types

| Type | Description | Background |
|------|-------------|-----------|
| `title` | Title/cover slide with logo | Blue `#3E89F7` |
| `section` | Section divider with logo | Blue `#3E89F7` |
| `content` | Bullet points | White |
| `two_column` | Two-column comparison | White |
| `metrics` | Key numbers in cards | White |
| `image` | Image with caption | White |
| `thank_you` | Final slide with logo | Blue `#3E89F7` |

---

## Checklist Before Delivering

- [ ] All text uses Coil Regular font (fallback: Arial)
- [ ] Colors match the official "Цвета Банки.ру" theme exactly
- [ ] White logo on blue/dark backgrounds, dark logo on light backgrounds
- [ ] Title, section, and final slides use blue `#3E89F7` background by default
- [ ] "Спасибо за внимание!" on the final slide
- [ ] No bold, italic, or underline styling
- [ ] Slide dimensions: 25.4cm x 14.29cm (standard)
- [ ] "Банки.ру" in text always colored `#0D8BFF`
- [ ] Left margin consistent at 1.06cm
- [ ] Subtitles on colored backgrounds use `#96DCFF` (Light Blue)
