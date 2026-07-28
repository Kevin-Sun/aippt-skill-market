---
name: paper-figure-pptx
description: Reconstruct existing reference images, screenshots, or academic paper figures into editable and visually faithful PowerPoint slides. Use when Codex is asked to turn an uploaded image/PDF figure into a PPTX where readable text is editable, simple geometry is native PowerPoint shapes, complex visual regions are local raster crops, panel structure and visual hierarchy are preserved, and outputs must include PPTX, script-preview exports, LibreOffice-rendered PDF/PNG validation artifacts, comparison artifacts, and a validation report. Also supports an optional semantic icon replacement mode when the user explicitly asks for clean, unified, nicer, or semantically consistent icon replacement instead of pixel-perfect icon replication.
---

# Paper Figure PPTX

Specialize in rebuilding academic paper figures and technical diagrams as editable PowerPoint slides. The default goal for reference-image reconstruction is pixel-level visual fidelity with editability where it can be preserved accurately.

## Non-Negotiable Requirements

- Use PptxGenJS by default. If PptxGenJS is unavailable and cannot be installed, use another available PPTX generation library such as python-pptx, but keep the same editability and validation requirements.
- Do not assume required tools are already installed. Check for required command-line tools before relying on them.
- Do not automatically download or install system-level software such as LibreOffice, Node.js, Poppler, ImageMagick, or PowerPoint-related tooling unless the user explicitly asks for installation or grants permission in the current task.
- If a required tool is missing and installation was not explicitly requested, report the missing tool, explain the affected output or validation step, and continue with the best available fallback without falsely claiming full validation.
- Installing npm packages is allowed only when the task requires them and network/package installation is available; prefer reusing existing local dependencies when possible.
- Recreate all readable text as editable PowerPoint text boxes. Preserve wording, line breaks, font weight, approximate size, alignment, and color.
- Recreate simple geometry as native PowerPoint shapes: boxes, rounded rectangles, circles, lines, arrows, separators, brackets, callouts, legends, and panel labels.
- Do not insert the entire source image as a flat slide background. Use the source image only as a temporary visual reference during reconstruction.
- In pixel-perfect hybrid reconstruction mode, rasterize every complex visual element that cannot be matched faithfully with native PowerPoint objects.
- Preserve aspect ratio, panel layout, colors, typography, spacing, arrows, labels, grouping, and visual hierarchy.
- Export the PPTX plus clearly labeled script-preview PDF/PNG artifacts when useful.
- Render every generated PPTX through LibreOffice headless at `C:\Program Files\LibreOffice\program\soffice.exe`; do not use PowerPoint COM.
- Export LibreOffice-rendered PDF and PNG into a separate `libreoffice_render/` folder.
- Compare the LibreOffice-rendered PNG against the source image. Create side-by-side and diff images from the LibreOffice-rendered PNG.
- When LibreOffice is available, drive all optimization and correction decisions from the LibreOffice-rendered PNG, not from script-export previews.
- For custom icons, preserve antialiasing, highlights, shadows, and edge pixels. Never use a hard color mask that can clip corners, arrowheads, strokes, or pale edge pixels.
- Run at least two correction passes after the first LibreOffice render before final output.
- Produce `validation_report.md` listing editable elements, native shape elements, raster crop assets, crop coordinates, unclear text, known differences, tools used, and correction passes.
- Set `render_validation_status = "libreoffice-rendered"` only after LibreOffice conversion and PNG rendering both succeed.

## Mode Selection

Default to **Pixel-Perfect Hybrid Reconstruction Mode**. In this mode, crop custom icons from the reference image and preserve them as local raster crops; do not replace them with icon libraries.

Use **Semantic Icon Replacement Mode** only when the user explicitly says exact icon replication is not required, semantic consistency is enough, the icons should be cleaner or more visually unified, or the existing icons should be replaced with nicer icons.

Never let semantic icon replacement silently override pixel-perfect reconstruction. If the user asks for pixel-perfect replication, accurate reconstruction, exact matching, or faithful reproduction, use the original local icon crops.

## Pixel-Perfect Hybrid Reconstruction Mode

Use this mode whenever the user provides a reference image and wants an academic paper figure that visually matches the source. This mode is mandatory for image-to-PPTX reconstruction unless the user explicitly asks for a fully editable redraw and accepts lower visual fidelity.

Core strategy:

- Use native PowerPoint objects only when they can match the source accurately.
- Use local raster crops from the reference image for visual elements that cannot be faithfully reconstructed.
- Prioritize visual fidelity over full editability for complex icons and visual regions.
- Do not approximate custom icons with PowerPoint built-in icons, emoji, Font Awesome, Lucide, Material Icons, or random icon libraries unless the exact original icon source is known.

## Semantic Icon Replacement Mode

Use this optional mode when semantic consistency and visual polish are more important than exact icon replication. Keep the current layout, text, boxes, arrows, colors, and structure unless the user asks for broader redesign; replace only icon-like elements.

Activation examples:

- "Semantic consistency is enough."
- "Exact icon replication is not required."
- "Make the figure clean and visually unified."
- "Replace icons with nicer icons."
- "Use semantic icon replacement mode."

Icon source policy:

1. Prefer local command-line icon packages over web browsing.
2. Use web browsing only when local icon packages do not contain a suitable icon or when license verification is required.
3. Prefer sources in this order: Material Symbols, Lucide, Heroicons, UXWing, then Flaticon only as fallback.
4. Avoid mixing unrelated icon styles.
5. Use one primary icon family for the whole figure whenever possible.
6. If one icon family cannot cover all concepts, use one fallback family and record the mixed source.
7. Do not use icons with unclear license.
8. For Flaticon free icons, record attribution requirements. Do not use Flaticon icons without recording license and attribution status.

Command-line icon workflow:

1. Check whether Node.js and npm are available.
2. Create `output/icons/` or an equivalent local icon output folder next to the generated PPTX.
3. Install or reuse local packages when needed:

```bash
npm install lucide-static
npm install @iconify-json/material-symbols
npm install @iconify-json/lucide
npm install @iconify-json/heroicons
```

4. Search local icon JSON or SVG files by semantic labels.
5. Pick icons that match the figure concepts.
6. Normalize icons to the same viewBox or visual size, stroke width or fill style, padding, optical weight, and column theme color.
7. Export final icons as SVG first.
8. If LibreOffice renders SVG poorly, convert the icon to a high-resolution transparent PNG and use the PNG.
9. Insert icons into PPTX at fixed coordinates.
10. Keep captions as editable text boxes.

Semantic icon styling policy:

- Blue column icons use the sampled blue theme color.
- Orange column icons use the sampled orange theme color.
- Purple column icons use the sampled purple theme color.
- Do not use random multi-color icons.
- Do not use emoji.
- Use uniform alignment above captions.
- Match visual weight across repeated icon cards even when semantic icons come from two families.

Create `icon_manifest.json` when this mode is active. Include:

- `icon_id`
- `semantic_label`
- `chosen_icon_name`
- `source_family`
- `source_url_or_package`
- `license`
- `attribution_required`
- `original_format`
- `inserted_format`
- `final_color`
- `final_size`
- `ppt_position`
- `fallback_reason` when a fallback family or raster conversion is used

Validation in semantic icon replacement mode:

1. Generate PPTX.
2. Render PPTX with LibreOffice.
3. Compare the LibreOffice-rendered PNG against the reference or target layout.
4. Run correction passes for icon size, alignment, spacing, color, and visual weight.
5. Update `validation_report.md` and include `icon_manifest.json`.
6. Prioritize visual unity and professional appearance over exact icon replication.

### Element Classification

Before generating the PPTX, classify every visible element into one of these groups and record the classification for the validation report.

A. Editable text box

- Use for all readable text, captions, labels, headings, section titles, numbers, and annotations.
- If exact text is unclear, write `[UNCLEAR]` in the reconstruction or report the uncertainty, depending on whether the text must appear visually.

B. Native PowerPoint shape

- Use for simple objects: rectangles, rounded rectangles, borders, divider lines, simple arrows, panel boxes, circles, simple timelines, dashed boxes, and simple connectors.
- Use native shapes only when their geometry, stroke, fill, opacity, and z-order can closely match the source.

C. Local raster crop

- Use for icons, logos, complex line icons, photos, portraits, screenshots, video frames, image thumbnails, textured graphics, dense plots, decorative gradients, complex arrows, and any visual element that cannot be matched exactly with native PPT shapes.
- For the current academic figure style, crop all custom icons from the reference image; crop photo thumbnails and video-frame thumbnails; rebuild colored panels, borders, section boxes, divider lines, and simple arrows as PPT shapes; rebuild all Chinese headings and captions as editable text boxes.

### Mandatory Crop Rules

1. Never insert the entire source image as one full-slide background.
2. Crop the smallest local bounding box that preserves the element's original visual footprint, not the tightest content-only box. Include original whitespace, antialiasing, shadows, and edge pixels needed for the crop to look the same size after PPT placement.
3. For icons, crop the icon only. Keep the caption as editable PPT text whenever possible.
4. For photos or video frames, crop the exact photo or video region from the source.
5. Preserve crop resolution. Do not downsample unless necessary.
6. Save crops as separate PNG files in `output/assets/slideXX/`.
7. Use filenames like `slide01_icon_03.png`, `slide01_photo_02.png`, and `slide01_video_frame_04.png`.
8. Place each crop at the exact corresponding PPT position using converted pixel coordinates.
9. Preserve z-order. Raster crops should sit behind editable labels when labels overlap them.
10. If a crop contains readable text that cannot be separated, document it as non-editable in `validation_report.md`.

### Icon Crop and Transparency Rules

Use these rules for all custom icons, especially single-color line icons on pale panel backgrounds:

1. Crop from the reference image, not from an icon library.
2. Start with a crop box that includes the complete icon plus the source's original local whitespace and at least 1 to 3 px transparent/pale padding. If any stroke touches the crop boundary, expand the crop before masking.
3. Before finalizing, create a diagnostic comparison on a neutral gray background: original local crop vs processed transparent crop. Use this to catch clipped corners, missing arrowheads, broken strokes, or deleted antialiasing.
4. Avoid hard color-threshold masks as the only transparency method. They can delete pale antialiasing, highlights, shadows, and curved-edge pixels.
5. Prefer conservative transparency extraction: remove only background-connected pale pixels, then retain strong stroke pixels plus a 1 to 2 px neighborhood of related edge pixels.
6. For icons with gradients, highlights, shadows, or thin strokes, favor a slightly larger local raster crop over aggressive transparency. Visual completeness is more important than perfect transparency.
7. If transparency processing damages an icon, use the smallest local raster crop that preserves the icon and its immediate pale background; document the non-transparent crop in `validation_report.md`.
8. Recheck the LibreOffice-rendered PNG, not only the source crop. PowerPoint/LibreOffice can resample transparent PNG edges differently from script previews.
9. Do not over-tighten icon crops. A tight crop can make the icon look smaller because the source whitespace, antialiasing boundary, and optical footprint are removed. In pixel-perfect mode, preserve the original crop footprint and place it back at the same source coordinates.
10. When a rendered icon looks smaller than the reference, fix the crop bounds first. Expand the crop to include the reference footprint and surrounding pale background; do not simply scale the image up unless the crop already matches the source footprint.
11. For icon groups inside panels, crop the whole visual group footprint when that preserves scale better than splitting into tight individual icon crops. Avoid including nearby captions, bullets, dividers, or panel borders unless they are intentionally part of the raster element.
12. Prefer group-level crops for repeated icon rows, icon-to-icon arrows, circular feedback loops, flow diagrams, or any icons connected by arrows. Per-icon crops often lose arcs, arrowheads, antialiasing, or shared spacing; group crops preserve the original visual footprint.
13. If a group crop accidentally includes panel borders, captions, bullets, or unrelated text, split it into logical subgroups instead of returning to tight per-icon crops. Example: use one inner-row crop plus one separate refresh/loop icon crop.
14. When debugging missing icon edges, change crop granularity before changing scale: individual icon -> row/group crop -> subgroup split that excludes unwanted borders/text.

### Pixel Coordinate Rules

Use the original reference image size as the coordinate source. For each slide, record:

- Source image width in pixels.
- Source image height in pixels.
- PPT slide width.
- PPT slide height.
- Conversion formula from pixels to PPT units.

Use this conversion:

```text
x_ppt = x_px / source_width_px * slide_width
y_ppt = y_px / source_height_px * slide_height
w_ppt = w_px / source_width_px * slide_width
h_ppt = h_px / source_height_px * slide_height
```

Keep column layout, panel alignment, and repeated spacing based on the reference image coordinates, not on guessed spacing.

### Text Layout Rules

1. Do not rely on automatic freeform text placement.
2. Every text block must have a fixed bounding box.
3. Use manual line breaks to match the source image.
4. Set internal text margins to `0` unless visual padding is explicitly needed.
5. Use center alignment for captions under icons.
6. Use consistent vertical alignment inside repeated cards.
7. Use Chinese fonts explicitly: Microsoft YaHei, SimHei, or Noto Sans CJK SC.
8. Match font weight, color, and size as closely as possible.
9. Do not let text overflow outside its source bounding box.
10. If exact text is unclear, mark it as `[UNCLEAR]` and report it.

## Mandatory LibreOffice Render Validation

Use this renderer for true PPTX validation:

```text
C:\Program Files\LibreOffice\program\soffice.exe
```

For every generated PPTX:

1. Generate the PPTX.
2. Render the PPTX through LibreOffice headless.
3. Export the LibreOffice-rendered PDF and PNG into a separate `libreoffice_render/` folder.
4. Compare the LibreOffice-rendered PNG against the reference image.
5. Generate `side_by_side_comparison.png` and `diff_image.png` from the LibreOffice-rendered PNG, not from a script preview render.
6. If there are visible layout, text, icon, spacing, color, or cropping errors, revise the PPTX and rerender through LibreOffice.
7. Run at least two correction passes.
8. Set `render_validation_status = "libreoffice-rendered"` only after successful LibreOffice rendering.
9. Keep script-export previews clearly labeled as previews.
10. Do not use PowerPoint COM.

When LibreOffice is available, all optimization must be driven by the LibreOffice-rendered PNG, not by script-export previews. The script-export preview may only be used for debugging coordinates. Final comparison, diff, similarity score, and correction decisions must use LibreOffice-rendered output.

Use commands equivalent to:

```powershell
& "C:\Program Files\LibreOffice\program\soffice.exe" --headless --convert-to pdf --outdir "<output_dir>\libreoffice_render" "<pptx_path>"
pdftoppm -png -r 200 "<output_dir>\libreoffice_render\<name>.pdf" "<output_dir>\libreoffice_render\<name>_libreoffice"
```

If LibreOffice rendering fails, do not claim true PPTX render validation succeeded. Keep `render_validation_status = "script-export-only"`, paste the exact LibreOffice error in `validation_report.md`, and keep all script-generated PDF/PNG files labeled as previews.

## Tool Availability Policy

Before generating outputs, check whether the needed tools are available for the selected workflow.

If the skill repository includes `scripts/check_environment.py`, prefer running it before generating outputs:

```powershell
python scripts/check_environment.py
```

When using the open-source repository, install declared Node dependencies with:

```powershell
npm install
```

Manual checks for the default workflow:

```powershell
node --version
npm --version
& "C:\Program Files\LibreOffice\program\soffice.exe" --version
pdftoppm -h
```

Use these results as follows:

- If Node.js is missing, do not run a PptxGenJS script. Use another available PPTX library only if it can meet the same output requirements, otherwise report the blocker.
- If PptxGenJS is missing, first look for reusable local `node_modules`. If none is available, install it only when npm installation is acceptable in the task context; otherwise use a fallback library or report the limitation.
- If LibreOffice is missing, generate the PPTX if possible, but set `render_validation_status = "script-export-only"` and clearly state that true PPTX render validation could not be performed.
- If `pdftoppm` is missing, keep the LibreOffice-rendered PDF and use another available PDF-to-PNG method if possible. If no renderer is available, skip PNG comparison and report the missing conversion tool.
- If network access or administrator permission is required for installation, stop before installing and state exactly what permission is needed.
- Never use random third-party download sites for required tooling. Prefer official package managers or official project download pages.

## Workflow

### 1. Inspect Inputs

Identify each requested source figure and output target. For each image, inspect visually before writing code.

Record:

- Source dimensions and aspect ratio.
- Panel structure, reading order, and grouping.
- Text content, font style, approximate size, color, and alignment.
- Shape inventory: boxes, connectors, arrows, axes, legends, labels, badges, and separators.
- Raster-only items that should remain images.
- Ambiguous or unreadable text that must be flagged in `validation_report.md`.
- Element classification: editable text box, native PowerPoint shape, or local raster crop.

### 2. Choose Slide Geometry

Create a slide size that matches the source aspect ratio whenever possible.

Use PptxGenJS custom layouts when needed:

```js
pptx.defineLayout({ name: "SOURCE_RATIO", width: slideW, height: slideH });
pptx.layout = "SOURCE_RATIO";
```

Use a consistent coordinate system and scale all objects from source-pixel coordinates into PowerPoint inches. Keep margins and panel positions proportional to the source.

### 3. Rebuild as Hybrid Editable Objects

Create the PPTX from scratch with native objects and local raster crops.

Use:

- `addText` for all readable labels, titles, numbers, axis text, legends, and annotations.
- `addShape` for native rectangles, rounded rectangles, circles, polygons, separators, and callouts.
- `addShape` or `addText` with line options for arrows and connectors.
- `addImage` only for smallest-bounding-box raster crop assets, never for the whole figure as a background.

Group related objects logically in code even if the library does not expose PowerPoint grouping. Keep naming and helper functions clear enough for iterative edits.

### 4. Export

Always generate these files:

- `<name>.pptx`
- Script-preview `<name>.pdf` and `<name>.png` only when useful, clearly labeled as previews.
- `libreoffice_render/<name>.pdf` from LibreOffice headless PPTX conversion.
- `libreoffice_render/<name>_libreoffice.png` or one PNG per slide rendered from the LibreOffice PDF.
- `side_by_side_comparison.png` generated from the LibreOffice-rendered PNG.
- `diff_image.png` generated from the LibreOffice-rendered PNG when possible.
- `validation_report.md`
- `icon_manifest.json` when Semantic Icon Replacement Mode is active.

Use LibreOffice headless conversion to PDF, then Poppler/ImageMagick/Python PIL to PNG. If a required renderer is missing or fails, report the missing tool or exact error message. Do not silently skip LibreOffice validation. Do not use PowerPoint COM.

### 5. Render and Compare

Render the generated PPTX through LibreOffice to PNG at the same aspect ratio as the source. Compare the LibreOffice-rendered PNG against the source image and create side-by-side and diff images from that LibreOffice-rendered PNG.

Check:

- Overall canvas aspect ratio and margins.
- Panel positions and bounding boxes.
- Text placement, line breaks, and emphasis.
- Arrow endpoints and connector routing.
- Color matches for major fills, strokes, and text.
- Relative spacing, hierarchy, and alignment.
- Crop placement and z-order.

Use objective checks where practical, such as image dimensions, color sampling, bounding-box measurements, and pixel/SSIM-style comparison. Also perform visual inspection; pixel metrics alone are not sufficient for editable reconstructions.

When a mismatch is found, classify it before editing:

- Global slide scale or margins.
- Column, panel, section box, divider, or arrow geometry.
- Text font, size, weight, line break, color, margin, or vertical alignment.
- Raster crop bounds, transparency mask, resampling blur, z-order, or placement.
- Border color, border width, dash style, opacity, or corner radius.

If a crop looks wrong in LibreOffice, first compare the raw source crop against the processed crop on a gray background. If the raw crop is complete but the processed crop is incomplete, fix the transparency mask. If the raw crop is incomplete, expand the crop box and update placement coordinates.

If a crop looks smaller than the reference, compare the original source region and the LibreOffice-rendered crop at the same coordinate scale. Treat missing source whitespace or antialiasing as a crop-boundary bug. Expand the crop to preserve the visual footprint before changing image scale.

If repeated icons or connected flow icons still show missing arcs, edges, or arrowheads after padding expansion, stop using separate per-icon crops and switch to a group-level crop that includes the whole icon row and connectors. If that includes unwanted panel borders, split into larger semantic subgroups rather than returning to tight crops.

### 6. Correction Passes

Run at least two correction passes after the first render:

- Pass 1: Correct global layout, scale, slide size, outer margins, and three-column bounds.
- Pass 2: Correct repeated containers: section boxes, header bars, dividers, arrows, and panel alignment.
- Pass 3: Correct text: font, size, weight, alignment, line breaks, margins, and vertical centering.
- Pass 4: Correct raster crops: icon crop bounds, thumbnail crop bounds, crop padding, and placement.
- Pass 5: Correct fine styling: color, border width, dash style, opacity, and corner radius.

Run more passes when visible differences remain material. Do not finalize after a single render.

Do not optimize icons by replacing them with approximate icon libraries. Use local crops from the reference image and adjust crop bounds, transparency masks, and placement against the LibreOffice-rendered result.

Recommended correction order:

1. Fix global geometry: slide size, aspect ratio, outer margins, and main columns.
2. Fix repeated containers: section boxes, header bars, dividers, arrows, and panel alignment.
3. Fix text: font, size, weight, alignment, line breaks, margins, vertical centering, and color hierarchy.
4. Fix raster crops: icon crop bounds, thumbnail crop bounds, transparency masks, crop padding, and placement.
5. Fix fine styling: sampled colors, border widths, dash styles, opacity, and corner radius.

For text hierarchy inside repeated icon cards, split text into multiple editable boxes when the source uses different colors or weights, such as a colored title line plus black explanatory lines. Do not force all lines into one text box if LibreOffice renders the hierarchy incorrectly.

For file-lock failures such as `EBUSY` when writing the PPTX, do not terminate the workflow. Detect likely locks from PowerPoint, LibreOffice, or VS Code previews. If the locked file cannot be overwritten safely, generate an alternate output basename such as `<name>_fixed.pptx`, render it through LibreOffice, and report that the original file was open.

### 7. Validation Report

Write `validation_report.md` next to the generated files.

Include:

- Source file name and output file paths.
- Source image dimensions, PPT slide dimensions, and pixel-to-PPT conversion formula.
- PPTX generation library and render/export tools used.
- `render_validation_status`, set to `"libreoffice-rendered"` only after successful LibreOffice headless conversion and PNG rendering.
- LibreOffice renderer path, version if known, conversion command, and rendered artifact paths.
- Clear distinction between script-preview PDF/PNG and LibreOffice-rendered PDF/PNG.
- Icon manifest path and icon source/license summary when Semantic Icon Replacement Mode is active.
- Editable text elements: headings, captions, labels, numbers, annotations, and their approximate bounding boxes.
- Native shape elements: panels, borders, dividers, simple arrows, timelines, dashed boxes, connectors, and simple geometric objects.
- Raster crop assets: file path, reason for rasterization, crop bounding box in source pixel coordinates, and placement coordinates in PPT units.
- Unclear text: list every uncertain word, number, symbol, or label.
- Known differences: state visible deviations in layout, font, color, geometry, or raster detail.
- Correction passes: summarize at least two passes and what changed.
- Per-pass metrics: record average RGB difference, rough similarity score, corrected regions, remaining mismatch regions, and stop reason when correction is driven by visual comparison.
- Final pass/fail checklist covering aspect ratio, text editability, native shape use, crop minimality, no full-background source image, LibreOffice-rendered PDF/PNG, side-by-side comparison from LibreOffice render, diff image if possible, and at least two correction passes.
- Final status: whether the result is ready for manual editing, publication polishing, or needs user clarification.

## Quality Bar

For reference-image academic figures, favor pixel-perfect hybrid reconstruction: keep readable text and simple geometry editable, but crop complex icons and visual regions rather than approximating them with inaccurate substitutes.

If exact reconstruction is impossible because text is unreadable, source resolution is too low, or specialized fonts/assets are missing, produce the closest hybrid reconstruction and clearly document the limitation in `validation_report.md`.
