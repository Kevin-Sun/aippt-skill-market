---
name: fudan-ppt
description: Create Fudan University-branded academic presentations as native PowerPoint (.pptx), a self-contained horizontal HTML slide deck, or AI-generated slide visuals. Use for Fudan University reports, research talks, teaching decks, thesis defenses, recruiting presentations, and university events that need the supplied exact SVG logo and a high-saturation blue, red, or green academic visual system.
---

# Fudan PPT

Create calm, rigorous, high-contrast academic presentations. Use the supplied original Fudan SVG exactly; make content and evidence—not decorative UI—do the visual work.

## Start by Routing the Deliverable

1. Confirm the audience, speaking duration, outline, source material, output type, and one color system. If this does not affect a reasonable first draft, state the assumption and proceed.
2. Select exactly one primary system: blue by default for research and institutional reports; red for milestones, humanities, and ceremonies; green for sustainability, health, and life sciences. Do not mix the three primary hues in one deck.
3. Read [references/brand-system.md](references/brand-system.md) for every task. It contains the non-negotiable logo, color, typography, and source rules.
4. Route by output:
   - **HTML:** read [references/html-output.md](references/html-output.md), start from `assets/fudan-web-deck.html`, then run `scripts/inline_fudan_logo.py` and `scripts/inline_html_images.py` to make the final HTML a single offline file.
   - **PPTX:** read [references/pptx-output.md](references/pptx-output.md), use the presentation creation workflow, and insert `assets/fudan-university-logo.svg` directly.
   - **AI visuals:** read [references/ai-visuals.md](references/ai-visuals.md), then use the image-generation workflow. Generate only images that have an explicit role in the deck.
5. When delivering both PPTX and HTML, read [references/cross-format-parity.md](references/cross-format-parity.md) before authoring either. Create one master layout; do not make two interpretations of the same deck.
6. Read [references/layouts.md](references/layouts.md) to choose page shapes before authoring. Every deck needs an intentional sequence, not a repeated content-card grid.
7. For a cover, read [references/cover-imagery.md](references/cover-imagery.md) before sourcing a low-opacity conceptual photograph.

## Brand Invariants

- Use `assets/fudan-university-logo.svg` without modifying, tracing, recoloring, outlining, cropping, filtering, or regenerating it. It is an unchanged copy of the SVG code supplied directly by the user.
- Treat `assets/fudan-university-logo.svg` as the canonical source. Use it directly whenever the renderer preserves its official blue. When a renderer ignores SVG stylesheet classes—as the current PowerPoint export route does—use the bundled display derivative `assets/fudan-identity-lockup-blue.png`, rendered deterministically from that exact SVG and the supplied wordmark reference. Never ask an image model to redraw the seal or lettering.
- Keep a clear zone of at least half the logo radius around a standalone seal. Do not place it near a slide edge or crowd it with titles.
- Make the original logo visible on **every slide**. A cover must include it in its primary identity area; every interior slide must include it in one fixed header or footer identity band. Select the band treatment from `brand-system.md` according to the color system. Do not make a watermark of it unless the user expressly requests one.
- Use `assets/fudan-identity-lockup-blue.png` for a blue school-seal + supplied Chinese/English wordmark lockup in headers and footers. Use `assets/fudan-name-treatment-reference.png` only as its source reference. Do not trace, redraw, crop, or ask AI to recreate the lettering; use an official standalone wordmark only when the user supplies one.
- When the requester supplies an official transparent lockup, store it as a named skill asset and use that exact image in both formats. Preserve its aspect ratio; align its left edge to the content grid unless the chosen master explicitly says otherwise.
- Use a 16:9 canvas, asymmetric but orderly grids, generous white space, fine rules, and a strong typographic hierarchy. Avoid gradients, glassmorphism, fake dashboards, excessive rounded pills, and decorative UI chrome.
- Let the official website inform the mood only: restrained Chinese serif details, centered identity in the header, clear navigation bands, disciplined columns, and calm white/gray fields. Do not reproduce the website as a slide.

## Content and Image Safety

- Never ask an image model to create, recreate, alter, or imagine a Fudan building, campus gate, named campus location, or any real/identified person. Never put the Fudan logo in an image-generation prompt.
- Generic, anonymous young adult university students are permitted. Keep them unbranded and in a non-identifiable setting; do not imply they are real Fudan students.
- If a slide needs an identifiable Fudan place or person, request a user-supplied or properly licensed real image. Preserve source attribution when required.
- Use native charts, tables, and simple diagrams for data. Do not ask an image model to render readable chart labels, dense Chinese text, or institutional marks.

## Quality Gate

Before delivery, check the appropriate output file and the following:

- One color system, readable projection-size typography, contrast-safe body text, and no truncated or wrapped display headings.
- Exact logo asset on every cover and every interior header/footer, correct aspect ratio, adequate clear space, and no decorative alteration.
- No prohibited Fudan architecture or named-person AI images.
- A visual rhythm of cover, content, section, evidence/data, and closing pages; avoid three consecutive pages with the same composition.
- For HTML, test keyboard navigation, slide counter, mobile overflow, and standalone operation with network disabled. Inline every visual as a Base64 `data:` URL; the final deck must contain no remote or relative image source.
- For PPTX, render every slide and inspect title wrapping, overflow, collisions, footer consistency, and SVG rendering before delivery.
- For paired PPTX + HTML, verify the cover and at least two interior slides side-by-side against the same master at 1280×720. Do not deliver while any structural field, identity anchor, text block, color, or slide content differs.
- For HTML animation, verify the full transition lifecycle: keyboard next page, animation completion, then another next page. The visible page index must remain correct after every cleanup. Verify a single, master-defined page-number box on the first, middle, and final numbered pages.
