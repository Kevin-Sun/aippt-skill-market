# Example Prompts

## Pixel-Perfect Hybrid Reconstruction

```text
Use $paper-figure-pptx.

Reconstruct the attached academic paper figure as an editable PowerPoint slide.
Use pixel-perfect hybrid reconstruction.

Requirements:
- keep readable text editable;
- rebuild simple geometry as native PowerPoint shapes;
- crop custom icons and complex thumbnails from the reference image;
- never insert the whole reference image as a slide background;
- render the PPTX with LibreOffice;
- export PPTX, LibreOffice-rendered PDF/PNG, side-by-side comparison, diff image, source script, and validation_report.md;
- run at least two correction passes.
```

## Semantic Icon Replacement

```text
Use $paper-figure-pptx.

Use semantic icon replacement mode.
Exact icon replication is not required.
Keep the original layout and text, but replace the icons with clean, unified icons.
Export icon_manifest.json and validation_report.md.
```

## LibreOffice-Driven Correction

```text
Use $paper-figure-pptx.

The attached comparison image shows the reference beside the LibreOffice-rendered PPTX.
Fix the PPTX using only the LibreOffice-rendered PNG as the validation target.
Do not optimize against script-preview images.
Focus on global geometry, section boxes, text line breaks, icon crop bounds, border styles, and final diff.
```

