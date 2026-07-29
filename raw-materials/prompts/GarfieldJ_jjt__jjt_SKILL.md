# JJT · J 人的 PPT

*(impress.js + panzoom 无限缩放演示文稿 skill)*

Generate a self-contained zooming/rotating slide deck (single folder, double-click `index.html` to open). The interaction model is similar to commercial zoom-presentation tools.

**This skill is agent-agnostic.** It runs anywhere an AI agent can:
- Run shell commands (write files, fetch URLs)
- Create/edit text files

It works on Claude Cowork, OpenClaw, Claude Code, Cursor, Continue, Copilot Chat, or any agent with bash + filesystem.

## Required capabilities (the host agent must provide)

| Capability | Why | Without it |
|---|---|---|
| Shell / bash | Write files, fetch CDN, optionally call image gen CLI | Skill cannot run — hard requirement |
| File write | Build the deck folder | Skill cannot run — hard requirement |
| Web fetch (curl) | Download impress.js + panzoom.min.js | Bundle the two JS files into the skill folder as a fallback |

## Optional capabilities (capability discovery)

Before generating images, **the agent should discover what image-generation tools are available** in the host. In rough preference order:

1. **A bundled image-gen tool/CLI** the user has installed (e.g. `mmx-cli`, OpenAI `dall-e-3` MCP, Midjourney bridge, Stability tool, FLUX local). Detect via `which` / config / MCP listing.
2. **An image-gen MCP server** registered in the agent (e.g. `mcp__minimax__text_to_image`, `mcp__openai_image_generation`, etc).
3. **A vision-capable agent that can generate via its own tool** (Gemini's image generation, etc).
4. **Web image search** — the agent searches and downloads candidate images, optionally asks user to pick.
5. **User-supplied images** — agent asks user to drop files into the folder with agreed names.
6. **Skip images entirely** — render text-only cards in the deck (the templates support this).

The agent should announce *"For images I can use X (detected). Want me to use that, search the web instead, or have you drop your own files?"* and proceed based on user's answer. **mmx-cli is just one example backend** — it is what the original author used; the skill does not require it.

### When to fall back
- If no image-gen tool found and user can't supply: build with text-only cards. Each theme's HTML has a `subnode` style that already shows text-only nicely. Apply that style to all chapter cards too — the layout still works.
- If image-gen produces a sensitive-content / RPM error: retry up to 3× with backoff, then skip that one card and continue.

## Required deliverable

A folder structure like:
```
<topic-slug>/
  index.html                  # the deck
  impress.js                  # ~183 KB, downloaded
  panzoom.min.js              # ~33 KB, downloaded
  hub.jpg, ch1.jpg, ...       # one per chapter (optional — skip if no image source)
```

The HTML is self-contained: opens by double-clicking, no server needed, no external runtime besides the two bundled JS files.

---

## Outline-first workflow (mandatory unless user says otherwise)

Borrowed from Gamma / Presentation-AI / Prezi AI itself. Image generation costs quota and time; if the chapters are wrong the user has to wait twice.

Before any image work, output:
1. 5–9 chapter titles
2. For each: 1-line image intent + 1-line text intent + image source choice (user/web/AI)
3. Ask the user to approve, edit, or replace any chapter

After confirmation, generate.

## Pipeline

1. **Outline confirm** — chapter list, image source per chapter, theme preset.
2. **Acquire images** — per source: copy-from-uploads / web-search-and-verify / mmx-generate. Run AI generation in parallel.
3. **Download `impress.js` and `panzoom.min.js` locally** (CDN paths for impress on npm are 404 — use the GitHub mirror).
4. **Build single `index.html`** with each stage as a `.step`, varying `data-x / data-y / data-rotate / data-scale`.
5. **Wire gesture toggle** (dblclick → script with **instant goto**, wheel → free).
6. **Optional**: speaker notes, table of contents overlay in overview.
7. **Present** with `mcp__cowork__present_files`.

## Output structure

```
outputs/<topic-slug>/
  index.html
  impress.js          # ~183 KB
  panzoom.min.js      # ~33 KB
  00-intro.jpg        # 2048×1152
  01-<scene>.jpg
  ...
```

## Image acquisition (agent-discoverable)

Decide image source FIRST. Order of preference:

### Path A · user-supplied (zero cost)
Ask: *"Do you have images you'd like to use? Drop them into `<slug>/` as `hub.jpg`, `ch1.jpg`, ..."* If yes, skip generation.

### Path B · agent-bundled image-gen tool
Detect what the host agent has configured. Example detections:

```bash
# MiniMax mmx-cli
command -v mmx && mmx auth status >/dev/null 2>&1 && echo "mmx-cli ready"
# OpenAI via env
[ -n "$OPENAI_API_KEY" ] && echo "openai ready"
# Local Stable Diffusion / ComfyUI / FLUX
curl -sf http://127.0.0.1:7860/sdapi/v1/sd-models >/dev/null 2>&1 && echo "automatic1111 ready"
curl -sf http://127.0.0.1:8188/system_stats >/dev/null 2>&1 && echo "comfyui ready"
```

Or just ask the agent's runtime: list available MCP tools / skills, look for ones whose name matches `image|gen|t2i|midjourney|dalle|flux|stable`.

If found, use it with the theme's **prompt suffix** (see Theme Packs).

Reference invocation patterns (each only ONE of these is needed):

```bash
# mmx-cli (MiniMax)
mmx image generate --prompt "$prompt" --width 2048 --height 1152 \
  --out "$OUT/$name.jpg" --response-format base64

# OpenAI dall-e-3 (curl)
curl -sS https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"dall-e-3\",\"prompt\":\"$prompt\",\"size\":\"1792x1024\"}" \
  | jq -r '.data[0].url' | xargs curl -sS -o "$OUT/$name.jpg"

# Local AUTOMATIC1111
curl -sS http://127.0.0.1:7860/sdapi/v1/txt2img \
  -d "{\"prompt\":\"$prompt\",\"width\":1024,\"height\":1024}" \
  | jq -r '.images[0]' | base64 -d > "$OUT/$name.jpg"
```

Whichever backend, **parallelize** when possible. Apply 3× retry with exponential backoff for rate-limit errors.

### Path C · web image search + verify
For canonical subjects (real places, films, historical figures), better than AI gen:
1. Use agent's web-search tool to find candidate URLs
2. `curl` download
3. Use vision tool (if available) to verify subject + quality
4. Keep best

### Path D · text-only fallback
If A/B/C all unavailable: every card uses the `subnode` text-only style instead of an image card. The deck still works — flow path, animations, layout are unchanged.

**Always announce path choice up-front.** Don't silently fall back.

### Prompt-writing rules (regardless of backend)

- Always English (style tokens follow English better in most models)
- Lock one shared **style suffix** per theme (see Theme Packs section)
- Embed iconic subject objects (cherry blossoms for Kyoto, neon signs for cyberpunk, qipao for vintage Shanghai...)
- 16:9 if backend supports custom dims; otherwise 1:1 1024×1024
- ≤ 70 words


## Download impress.js + panzoom

```bash
curl -sL "https://cdn.jsdelivr.net/gh/impress/impress.js@2.0.0/js/impress.js" -o "$OUTDIR/impress.js"
curl -sL "https://cdn.jsdelivr.net/npm/panzoom@9.4.3/dist/panzoom.min.js" -o "$OUTDIR/panzoom.min.js"
```

**DO NOT** use `https://cdn.jsdelivr.net/npm/impress.js@2.0.0/...` — 404.

## Spatial layout

`data-x`, `data-y`, optional `data-rotate` and `data-scale`.

- Spread across **all four quadrants**, not a line.
- `data-rotate` ±5° to ±25° normally; reserve `180°` for inverted semantic moments.
- `data-scale: 0.6–0.8` for "zoom into a detail", `1.5–2.0` for finales, `3` for title screens.
- Always include hidden `<div id="overview" data-x="0" data-y="0" data-scale="9">` for Esc.

### Comparison/parallel layout
For natural pairs (before/after, two characters, contrast), put two steps side-by-side at the same `y`. Esc overview reveals the parallel relationship — Prezi's structural advantage over PPT.

Reference 7-stage layout:
| Step | x | y | rotate | scale |
|---|---|---|---|---|
| intro | 0 | 0 | 0 | 3 |
| 1 | -2700 | -1500 | -4 | 1 |
| 2 | -1000 | -1900 | 7 | 1 |
| 3 | 700 | -1300 | -9 | 0.85 |
| 4 | 2100 | -100 | 15 | 1 |
| 5 | 1500 | 1500 | -22 | 1 |
| 6 (finale) | -1800 | 1100 | -28 | 1.5 |
| overview | -200 | 0 | 0 | 9 |

## HTML template

Critical pieces:
- `#impress` wrapped in `#canvas-stage`. panzoom on stage, impress on inner.
- On load: impress init → panzoom attach immediately (free mode default).
- dblclick: dispose panzoom, **clear inline transform/transformOrigin/transition**, `impress().goto(stepEl, 0)` — `0` is critical, see Common Pitfalls.
- wheel during script: re-attach panzoom.
- Capture-phase keydown blocker for arrow keys in free mode.
- CSS variables for theme tokens; one-line theme swap.
- Optional `<aside class="notes">` per step, toggled with `S` key in script mode.

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>{{TITLE}}</title>
<meta name="viewport" content="width=1024">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
  :root {
    /* Theme tokens — swap to re-skin */
    --bg:        #0a0805;
    --accent:    #d4a574;
    --accent-2:  #ff7e3d;   /* second gradient stop, used for hero curves */
    --frame:     #6b4226;
    --body:      #ece3cb;
  }
  html, body { margin:0; padding:0; background:var(--bg); color:var(--body);
    font-family:'Noto Serif SC', serif; overflow:hidden; height:100%; }
  .step { width:1100px; height:700px; opacity:0.25; transition:opacity 1s; position:relative; }
  .impress-on-overview .step { opacity:0.6; }
  .step.active { opacity:1; }
  .card { position:absolute; inset:0; background-size:cover; background-position:center;
    border:1px solid var(--frame);
    box-shadow: 0 30px 80px rgba(0,0,0,0.7), 0 0 0 6px var(--bg), 0 0 0 7px var(--frame); }
  .card::after { content:""; position:absolute; inset:0;
    background: linear-gradient(180deg, transparent, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.92)); }
  .text { position:absolute; bottom:50px; left:60px; right:60px; z-index:2;
    text-shadow: 0 2px 8px rgba(0,0,0,0.9); }
  .chapter { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:22px;
    color:var(--accent); letter-spacing:4px; margin:0 0 8px 0; text-transform:uppercase; }
  .title { font-size:56px; font-weight:900; letter-spacing:6px; margin:0 0 18px 0; line-height:1.1; }
  .body { font-size:22px; line-height:1.7; max-width:720px; }
  .quote { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:20px;
    color:var(--accent); margin:16px 0 0 0; border-left:2px solid var(--frame); padding-left:14px; opacity:0.9; }

  /* Speaker notes (Prezi "Expert advice" feature) */
  .notes { display:none; position:fixed; right:24px; top:24px; max-width:340px;
    background:rgba(0,0,0,0.85); border:1px solid var(--frame); border-radius:6px;
    padding:14px 18px; color:var(--body); font-size:14px; line-height:1.55; z-index:200;
    backdrop-filter: blur(10px); }
  .notes::before { content:"演讲提示"; display:block; color:var(--accent);
    font-size:11px; letter-spacing:3px; text-transform:uppercase; margin-bottom:6px; }
  body.notes-on .step.active .notes { display:block; }

  /* Hint and progress */
  .hint { position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    color:var(--accent); font-size:13px; letter-spacing:4px; z-index:100; pointer-events:none; opacity:0.85; }
  .hint kbd { background:rgba(0,0,0,0.5); border:1px solid var(--frame); padding:2px 8px; border-radius:3px;
    margin:0 4px; font-family:monospace; color:var(--accent); }
  .progress { position:fixed; top:0; left:0; height:3px;
    background: linear-gradient(90deg, var(--frame), var(--accent), var(--accent-2)); z-index:100; transition:width 0.6s; }

  /* TOC bar — appears in overview, instant-jump (Prezi "Move in any order") */
  .toc { position:fixed; bottom:60px; left:50%; transform:translateX(-50%);
    display:flex; gap:8px; z-index:100; opacity:0; pointer-events:none; transition:opacity .4s; }
  body.in-overview .toc { opacity:1; pointer-events:auto; }
  .toc-dot { width:48px; height:32px; border-radius:4px; background:rgba(0,0,0,0.6);
    border:1px solid var(--frame); cursor:pointer; background-size:cover; background-position:center;
    transition:transform .2s, border-color .2s; }
  .toc-dot:hover { transform:translateY(-4px); border-color:var(--accent); }

  body.free-mode #canvas-stage { cursor: grab; }
  body.free-mode #canvas-stage:active { cursor: grabbing; }
  body.free-mode .step { opacity: 1 !important; cursor: zoom-in; }
  body.free-mode .progress { display: none; }
  body.script-mode #canvas-stage { cursor: default; }
  /* CRITICAL: overview is the last #impress child with scale=9 — it covers everything in free mode and
     swallows clicks. Make it click-through (only used as Esc camera target). */
  #overview { pointer-events: none !important; }
  .card, .card::after { pointer-events: none; }
  .text { pointer-events: auto; }

  /* === Flow path === */
  #flow-path { color: var(--accent); transition: opacity .4s; }
  body.free-mode #flow-path { opacity: 0.45; }
  body.script-mode #flow-path { display: none; }   /* 演示时完全隐藏 */
  body.in-overview #flow-path { opacity: 0.85; }

  /* Numbered badges in each step's corner (visible in free/overview, hidden in script) */
  .step-num {
    position: absolute; top: -22px; left: -22px;
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--bg); color: var(--accent);
    border: 3px solid var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 900; font-family: 'Cormorant Garamond', serif;
    z-index: 10; box-shadow: 0 4px 16px rgba(0,0,0,0.6);
  }
  body.script-mode .step-num { display: none; }
  #intro .step-num, #finale .step-num { display: none; }
</style>
</head>
<body>
<div class="progress" id="progress"></div>
<div class="hint" id="hint">
  <span id="hint-free">鼠标拖动 · 滚轮缩放 · <kbd>双击画面</kbd>进入演示</span>
  <span id="hint-script" style="display:none"><kbd>←</kbd> <kbd>→</kbd> 翻页 · <kbd>S</kbd> 提示 · <kbd>Esc</kbd> 鸟瞰 · 滚动鼠标退出演示</span>
</div>

<div class="toc" id="toc"></div>

<div id="canvas-stage"><div id="impress" data-transition-duration="1400" data-width="1100" data-height="700" data-perspective="1500">

  <div class="step" data-x="..." data-y="..." data-rotate="..." data-scale="...">
    <div class="card" style="background-image:url('01-foo.jpg');"></div>
    <div class="text">
      <p class="chapter">I · Subtitle</p>
      <h1 class="title">主标题</h1>
      <p class="body">2-3 句中文叙述。</p>
      <p class="quote">可选引文</p>
    </div>
    <aside class="notes">演讲时要点：①...②...③... — 这一段不会出现在卡片正面，按 S 切换。</aside>
  </div>

  <!-- ...more steps... -->

  <div id="overview" class="step" data-x="0" data-y="0" data-scale="9"></div>
</div></div>

<script src="impress.js"></script>
<script src="panzoom.min.js"></script>
<script>
  impress().init();

  // === Flow path: viewport-fixed SVG, redrawn every frame from real step screen positions ===
  // CRITICAL: do NOT place the SVG inside #impress and use data-x/data-y as path coordinates.
  // impress's camera transform does NOT compose linearly with simple child elements (it changes both
  // #impress's CSS top/left AND its scale, but a child SVG's coordinate space ends up offset from
  // where steps actually render — empirically verified). Instead, use a viewport-fixed SVG layer
  // and read each step's getBoundingClientRect() every animation frame. The path always tracks
  // the actual on-screen card centers, regardless of impress + panzoom state.
  (function buildFlowPath() {
    const NS = 'http://www.w3.org/2000/svg';
    const steps = [...document.querySelectorAll('#impress .step:not(#overview)')];
    if (steps.length < 2) return;
    const pts = steps.map(s => ({
      x: parseFloat(s.dataset.x) || 0,
      y: parseFloat(s.dataset.y) || 0,
    }));
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#d4a574';

    const svg = document.createElementNS(NS, 'svg');
    svg.id = 'flow-path';
    // CRITICAL: impress positions every step at top:50% left:50% then translates by (data-x, data-y),
    // so step centers are at (50%+data-x, 50%+data-y) of #impress. The SVG must also anchor at 50%/50%
    // for its (0,0) to match step (0,0) — otherwise the path floats away from the cards.
    Object.assign(svg.style, {
      position: 'absolute', left: '50%', top: '50%', width: '1px', height: '1px',
      overflow: 'visible', pointerEvents: 'none', zIndex: '0',
    });

    // Arrow marker at path end (in user-space units so it scales with the canvas)
    const defs = document.createElementNS(NS, 'defs');
    const marker = document.createElementNS(NS, 'marker');
    marker.setAttribute('id', 'flow-arrow-end');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8'); marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6'); marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerUnits', 'userSpaceOnUse');
    const ap = document.createElementNS(NS, 'path');
    ap.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    ap.setAttribute('fill', accent);
    marker.appendChild(ap);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Smooth cubic-bezier through points
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i-1], b = pts[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      const k = 0.45;
      d += ` C ${a.x + dx*k} ${a.y + dy*0.15}, ${b.x - dx*k} ${b.y - dy*0.15}, ${b.x} ${b.y}`;
    }
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', accent);
    path.setAttribute('stroke-width', '4');
    path.setAttribute('stroke-dasharray', '12 14');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.setAttribute('marker-end', 'url(#flow-arrow-end)');
    svg.appendChild(path);

    // Insert as first child of #impress so it renders below step cards
    const root = document.getElementById('impress');
    root.insertBefore(svg, root.firstChild);

    // Add corner-badge numbers on each step
    steps.forEach((s, i) => {
      const badge = document.createElement('span');
      badge.className = 'step-num';
      badge.textContent = i + 1;
      s.appendChild(badge);
    });
  })();

  const steps = [...document.querySelectorAll('#impress .step:not(#overview)')];
  const progress = document.getElementById('progress');
  const toc = document.getElementById('toc');

  // Build TOC dots from each step's background image
  steps.forEach((s) => {
    const dot = document.createElement('div');
    dot.className = 'toc-dot';
    const card = s.querySelector('.card');
    if (card) dot.style.backgroundImage = card.style.backgroundImage;
    dot.addEventListener('click', () => enterScript(s));
    toc.appendChild(dot);
  });

  document.addEventListener('impress:stepenter', (e) => {
    const idx = steps.indexOf(e.target);
    if (idx >= 0) progress.style.width = ((idx + 1) / steps.length * 100) + '%';
    document.body.classList.toggle('in-overview', e.target.id === 'overview');
  });

  // 状态机：free（默认） <-> script
  const stage = document.getElementById('canvas-stage');
  const hintScript = document.getElementById('hint-script');
  const hintFree = document.getElementById('hint-free');
  let mode = 'free';
  let pz = null;

  function attachPanzoom() {
    pz = panzoom(stage, {
      maxZoom: 20, minZoom: 0.1,
      zoomDoubleClickSpeed: 1,
      smoothScroll: false,
      bounds: false,
      filterKey: () => true,
    });
  }

  function enterFree() {
    if (mode === 'free') return;
    mode = 'free';
    document.body.classList.remove('script-mode');
    document.body.classList.add('free-mode');
    hintScript.style.display = 'none';
    hintFree.style.display = 'inline';
    stage.style.transform = '';
    attachPanzoom();
  }

  function enterScript(stepEl) {
    if (pz) { pz.dispose(); pz = null; }
    stage.style.transform = '';
    stage.style.transformOrigin = '';
    stage.style.transition = '';
    document.body.classList.remove('free-mode');
    document.body.classList.add('script-mode');
    hintFree.style.display = 'none';
    hintScript.style.display = 'inline';
    mode = 'script';
    if (stepEl) impress().goto(stepEl, 0);   // 0ms = instant snap, NOT 1.4s fly
  }

  attachPanzoom();
  document.body.classList.add('free-mode');

  // === 双击检测：panzoom 会吞掉原生 dblclick，所以自己用 pointer 事件检测 ===
  let lastTapTime = 0, lastTapStep = null;
  let downX = 0, downY = 0, downTime = 0, isDragging = false;
  stage.addEventListener('pointerdown', (e) => {
    downX = e.clientX; downY = e.clientY; downTime = Date.now(); isDragging = false;
  });
  stage.addEventListener('pointermove', (e) => {
    if (downTime && (Math.abs(e.clientX - downX) > 6 || Math.abs(e.clientY - downY) > 6)) isDragging = true;
  });
  stage.addEventListener('pointerup', (e) => {
    if (mode !== 'free') return;
    if (isDragging) { lastTapTime = 0; lastTapStep = null; return; }
    const stepEl = e.target.closest('.step:not(#overview)');
    if (!stepEl) { lastTapTime = 0; lastTapStep = null; return; }
    const now = Date.now();
    if (lastTapStep === stepEl && (now - lastTapTime) < 400) {
      lastTapTime = 0; lastTapStep = null;
      enterScript(stepEl);
    } else {
      lastTapTime = now; lastTapStep = stepEl;
    }
  });
  // 后备：部分浏览器/触屏依然会触发 dblclick
  document.addEventListener('dblclick', (e) => {
    if (mode !== 'free') return;
    const stepEl = e.target.closest('.step:not(#overview)');
    if (stepEl) { e.preventDefault(); enterScript(stepEl); }
  });

  let wheelTimer = null;
  document.addEventListener('wheel', () => {
    if (mode === 'script') {
      if (wheelTimer) return;
      wheelTimer = setTimeout(() => { wheelTimer = null; }, 300);
      enterFree();
    }
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    const navKeys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','PageUp','PageDown','Home','End','Tab'];
    if (mode === 'free' && navKeys.includes(e.key)) e.stopImmediatePropagation();
    // Speaker notes toggle
    if ((e.key === 's' || e.key === 'S') && mode === 'script') {
      document.body.classList.toggle('notes-on');
    }
  }, true);
</script>
</body>
</html>
```

## Theme presets

Swap five `--theme-*` variables to re-skin:

```css
/* Magical realism (default) */
--bg:#0a0805; --accent:#d4a574; --accent-2:#ff7e3d; --frame:#6b4226; --body:#ece3cb;

/* Ghibli / sky watercolor */
--bg:#0d1418; --accent:#a8d4ec; --accent-2:#4ad6c0; --frame:#6a9bba; --body:#f0e8d0;

/* Vintage scientific (light page) */
--bg:#f4ecd8; --accent:#6b4226; --accent-2:#a85e2c; --frame:#3a2410; --body:#1a1410;

/* Cyberpunk */
--bg:#0a0014; --accent:#ff2b9c; --accent-2:#7d27d6; --frame:#7d27d6; --body:#e8e0ff;

/* Signature gradient (yellow→orange→pink on black) */
--bg:#0a0a0c; --accent:#ffd84a; --accent-2:#ff5a8a; --frame:#ff8a3d; --body:#fff5e8;
```

## Text content rules

- Chapter label: Roman numeral + short non-CJK phrase.
- Title: 2–6 Chinese characters, large.
- Body: 80–120 字 narrative, third person past, museum-caption tone.
- Quote: authentic source quote, italic.
- Notes (optional): 3 bullet points, bilingual where useful — what the speaker should emphasize, not duplicate of body text. Press `S` in script mode to toggle.
- Intro/finale: centered text, larger title (88–96 px). Override with id selectors.

## Present to user

Call `mcp__cowork__present_files` on `index.html`. Tell the user:
- Default = free mode (drag, wheel-zoom anywhere)
- Double-click any card → instant演示 (script) mode
- In script mode: ←/→ navigate, **S** speaker notes, Esc overview (with TOC strip), wheel exits to free
- Folder is self-contained; can be moved/zipped freely

## Common pitfalls

| Issue | Cause | Fix |
|---|---|---|
| `Uncaught TypeError: impress is not a function` | Wrong CDN path | Use GitHub mirror |
| **dblclick shows wrong page / wrong size** | `impress().goto(stepEl)` with default 1400ms transition; impress flies from previous active step but user is panzoomed elsewhere — visual misalignment | **Use `impress().goto(stepEl, 0)` for instant snap** |
| Free-mode zoom shows blurry images | Generated at default 1280×720 | Always `--width 2048 --height 1152` |
| Style drift between images | Each prompt has its own style words | Lock one shared STYLE suffix |
| Slow generation | Sequential | Parallelize with `&` and `wait` |
| Web image URL fetch blocked | Allowlist restriction in some envs | Fall back to mmx-cli generation; report which URLs failed |
| Hallucinated subject (wrong-looking Totoro etc.) | Pure AI gen for canonical subjects | Use Path B (web search + understand_image verification) for canonical visuals |
| Double-click also zooms via panzoom | panzoom default `zoomDoubleClickSpeed > 1` | Set `zoomDoubleClickSpeed: 1` |
| **Native `dblclick` never fires on stage** | panzoom 9.4 attaches pointer handlers that swallow dblclick | **Detect double-tap via pointerdown/up timestamps** (see template); keep dblclick listener as backup |
| **Double-click lands on wrong step (often `overview`)** | `#overview` is the last DOM child of `#impress` with `data-scale="9"`, so in free mode it covers the entire viewport and swallows clicks meant for visible steps below | `#overview { pointer-events: none !important }`; also `.card, .card::after { pointer-events: none }` so `.step` receives the click directly |
| **Single click also triggers a 1.4s fly to that step** | impress.js binds a built-in document-level click handler that calls `api.goto(step)` | Add a capture-phase `click` listener that calls `e.stopImmediatePropagation()` for clicks on `.step` while in free mode |
| Arrow key in free mode flies impress | impress listens to keydown globally | Capture-phase keydown blocker that stopImmediatePropagation in free mode |
| Wheel in script mode doesn't exit | wheel listener missing | Document-level `{ passive: true }`, debounced 300 ms |
| Theme change requires editing many CSS rules | Hard-coded colors | Use CSS variables `--bg / --accent / --accent-2 / --frame / --body` |
| Flow path stroke is invisible after zoom out | SVG stroke-width scales with canvas | Use `vector-effect="non-scaling-stroke"` on the path |
| Flow path color is wrong/gray | `currentColor` inheritance is unreliable in SVG | Read the accent value via `getComputedStyle(:root).getPropertyValue('--accent')` and set `stroke=` directly |
| Step number badges invisible at full zoom-out | Badges live inside step which is scaled by impress | Accepted limitation — readable at moderate zoom; hidden in script mode by design |
| **Animations on `.step` collapse all nodes to (0,0)** | Setting `transform` (scale/rotate/translate) on `.step` overrides impress's own positioning transform | **Always target `.node` (inner element) for entry/sway/pulse animations.** `.step` is reserved for impress to apply its data-x/data-y/data-rotate/data-scale. Filter properties and opacity are safe on `.step` since they don't touch transform. |
| **Flow path floats away from cards in script mode** | impress's camera transform applies a complex compose of CSS top/left changes + scale that does NOT linearly transfer to a child SVG's internal coordinate system. A child SVG drawing at canvas (data-x, data-y) ends up offset by hundreds of px from where the corresponding step actually renders | **Don't put SVG inside #impress at all.** Place it as `position: fixed; left:0; top:0; width:100vw; height:100vh` and redraw every frame using `step.getBoundingClientRect()` to get real screen centers. Cheap (60fps for 7 steps). Always perfectly aligned. |
| TOC dots show no thumbnails | Background image set via inline style on `.card` not parsed | Read `card.style.backgroundImage` after DOM parse, copy to dot |

## Optional enhancements

- **Soundtrack** via `mmx music generate` + `<audio autoplay loop>`.
- **Per-step narration** via `mmx speech synthesize`, play on `impress:stepenter`.
- **Single-file deliverable**: inline images as base64 + inline JS (5–10 MB).
- **Touch support**: panzoom handles touch by default.
- **In-place text edit** (Gamma-style): add `contenteditable="true"` to `.text` for ad-hoc tweaks (won't persist on reload).
- **Theme picker**: small button cycling the 5 theme presets via JS that swaps `:root` CSS vars.
- **Export to PDF**: `print` media query with `.step { break-after: page; opacity:1 !important; }` and Cmd+P.

---

## Theme Packs

Predefined visual systems. Each theme is a complete bundle: color tokens, fonts, node shape, animations, link style, image prompt suffix, sample topic. When user asks for "做个 X 风格", apply the matching pack.

**Critical rule for ALL themes**: animations MUST target `.node` (the inner card), never `.step` itself. Setting `transform` on `.step` overrides impress's positioning transform and collapses all nodes to (0,0). See pitfalls.

### KAWAII · 可爱风
- **Topic** suggestion: 甜品时光 / 烘焙日记 / 周末小确幸
- **Colors**: bg `#fff0f7` · accent `#ff8fb1` (rose) · accent2 `#ffd166` (yellow) · body `#5d3954`
- **Background**: 三个柔和光斑 + 飘浮星点 (radial-gradient + twinkle keyframe)
- **Shape**: `border-radius: 60px` 圆角矩形（不是全圆，更萌）
- **Border**: 6px 双层（白内圈 + accent 外圈）+ 强 box-shadow
- **Fonts**: `Quicksand` + `M PLUS Rounded 1c`
- **Decorations**: 角落 emoji（🍰 ✨ 🍓 🌈 💖）跟随 bobble 动画浮动
- **Entry animation**: `bouncyPop` overshoot cubic-bezier(.34,1.56,.64,1) + `gentleSway` ±1.2°
- **Hover**: scale 1.04
- **Active pulse**: kawaiiPulse 3s
- **Links**: 粉色虚线 (8 14 dasharray) + 双层（光晕底 + 锐利上）
- **Image prompt suffix**: `kawaii cute pastel illustration, pink and cream, sparkles, soft rounded forms, sticker art, ultra detailed`

### CYBERPUNK · 赛博朋克
- **Topic** suggestion: 2099 夜城 / 未来档案 / 数字废墟
- **Colors**: bg `#060010` · accent `#ff007a` (hot pink) · accent2 `#00ffff` (cyan) · accent3 `#6e00ff` (purple)
- **Background**: 极光光斑 + 横向扫描线 (repeating-linear-gradient + scanlines keyframe) + 闪烁星点
- **Shape**: `clip-path: polygon(0 12%, 12% 0, 88% 0, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0 88%)` 切角八边形
- **Border**: 双层 — 内层霓虹边框带 box-shadow 强发光，外层 hue-rotate filter
- **Fonts**: `Orbitron` (英文) + `Major Mono Display` (代码标签) + `Noto Sans SC`
- **Decorations**: 三角标签 `// 01`, `▣ AUTH`, `SECTOR 7` 在节点四角
- **Entry animation**: `cyberWipe` clip-path 八角形展开（菱形→八边形）+ `glitchPulse` RGB 偏移
- **Hover**: scale 1.03 + 强化辉光
- **Active pulse**: activeNeon 双色 box-shadow
- **Links**: 双层（光晕底 + cyan 极速虚线 1.5s/圈，相位错开 0.1s）
- **Image prompt suffix**: `cyberpunk neon-noir cinematic, hot pink and cyan neon, rain-soaked streets, blade runner atmosphere, ultra detailed`
- **Title text-shadow**: `0 0 20px var(--accent), 2px 0 0 var(--accent-2), -2px 0 0 var(--accent)` (RGB 偏移文字)

### HAND-DRAWN · 手绘风
- **Topic** suggestion: 旅行手账 / 日常 / 读书笔记
- **Colors**: bg `#f5e8d0` (牛皮纸) · accent `#2a2418` (墨黑) · accent2 `#c1572b` (锈红) · accent3 `#c89b6e` (棕褐)
- **Background**: SVG noise 噪点 + radial 暗角 + 散落咖啡渍 (mix-blend-mode multiply)
- **Shape**: `border-radius: 56% 44% 60% 40% / 48% 52% 48% 52%` 不规则有机 blob
- **Border**: 3px dashed + 三层 box-shadow（内填 + 外纸 + 棕色描边）
- **Fonts**: `Caveat` (英文手写) + `Ma Shan Zheng` (中文毛笔) + `Long Cang`
- **Decorations**: 旋转的手写角标 "京都 · 三月" `transform: rotate(-8deg)`
- **Entry animation**: `paperDrop` 从上方掉落 + 翻转角度回正 + blur 消散 + 持续 `blobMorph` 12s
- **Hover**: scale 1.04 rotate(-2deg)
- **Active**: 持续 blob 形变
- **Links**: 长短随机虚线 (`12 5 4 9 18 6` dasharray)，三次贝塞尔带随机偏移控制点（用 sin/cos(idx*1.7) 生成）模拟手抖
- **Image prompt suffix**: `hand drawn pen and ink with watercolor wash, sketchnote, casual loose lines, cream paper, ultra detailed`

### FORMAL · 正式汇报
- **Topic** suggestion: Q3 业务回顾 / 项目立项 / 投资人报告
- **Colors**: bg `#0e1a2b` (deep navy) · accent `#5b8def` · accent2 `#a3c1ff` · body `#e8edf5`
- **Background**: 极克制——单层非常轻微的渐变光斑（无动画）
- **Shape**: `border-radius: 12px` 圆角矩形（稳重不浮夸）
- **Border**: 1px solid frame + 极浅 box-shadow，无 glow
- **Fonts**: `IBM Plex Sans` + `Inter` + `Noto Sans SC` 全局 700 weight
- **Decorations**: 文字角标 `FY24 Q3`, `CONFIDENTIAL`, `SECTION 01` (12px letter-spacing 1.5px)
- **Entry animation**: `cleanFade` translateY(12px → 0) + opacity，仅 0.7s ease-out
- **Hover**: translateY(-3px)，仅边框变 accent
- **Active**: 仅 box-shadow 加 2px accent 边框，无脉冲
- **Links**: 单层 1.2px 直线（不是曲线），solid 不虚
- **Special**: hub 卡片可加 `<div class="metric">` 展示 KPI 数字（28% YoY, 4.6/5 NPS 等）
- **No mode flash, no ripple animations** —— 商务场合保持克制
- **Image prompt suffix**: `professional corporate infographic, navy and white, abstract data visualization, geometric, minimalist line art`

---

## 主题选择对照

| 用户场景关键词 | 推荐主题 |
|---|---|
| 烘焙、宠物、生活、礼物、儿童 | KAWAII |
| 黑客、数据、未来、电影、游戏 | CYBERPUNK |
| 日记、读书、旅行、随笔、教育 | HAND-DRAWN |
| 汇报、董事会、投资、年报、回顾 | FORMAL |
| 简历、技术分享、产品介绍 | FORMAL（可考虑 tech-demo 那种青色科技风作为变体）|
| 文学经典、史诗、影评 | （Magical realism 已有 solitude 模板） |
| 动漫、电影分析、童话 | （Ghibli 已有 miyazaki 模板） |

---

## 一键切换主题（开发指南）

每个主题 = 完整 HTML 文件，独立资源（impress.js、panzoom.min.js、5 张图）。要做 "X 主题的 Y 内容"：
1. 复制目标主题目录为新名字
2. 替换 5 张 jpg（用 mmx 按该主题的 imagePromptSuffix 重新生成）
3. 修改 `<title>` 和每个 step 的 `tag/title/body` 文案
4. 不动 CSS / 动画 / SVG 路径绘制 / JS 逻辑

未来若做"切换主题保留内容"功能：把 :root 变量、字体 link、shape clip-path、动画 keyframes 抽到独立 `theme-pack-*.css` 文件，HTML 里 `<link id="theme">`，JS 里换 href 即可。但配图风格无法切换（图片是烘焙写实，套到 cyberpunk 主题上就不搭）。

## Layout pattern: zoom-on-image (经典缩放模式)

When the theme uses ONE giant background image (a map, a room, an artifact) with sub-deck items at scale 1 placed AT meaningful spots ON the image, treat it as **zoom-on-image** mode:

- **hub data-scale ≥ 8** (typically 10-15) — the image is the entire canvas
- **chapters at scale 1** — they look like tiny pins/markers ON the big image when viewing hub
- **subs at scale 0.15-0.25** — they look like dots in a pin when viewing the city
- **Hide flow-path lines** (`#flow-path { display: none !important; }`) — the connecting lines on top of a single big image look messy. The visual "connection" is the spatial proximity on the image itself.
- **Use two-phase camera animation** for chapter→sub transitions: pan first (300-500ms) then zoom (500-700ms). This feels more like "fly there, then dive in" than impress's default single-stage transform.

Examples this pattern fits: travel route on a world map, museum tour on a floor plan, ecosystem on a microscope slide, anatomy on a body diagram.

For the travel route topic specifically: hub is the world map, chapters are city pins at their geo positions on the map, subs are landmarks within each city's area.

---

## Modifying an existing deck (agent editing guide)

Most JJT decks live as a single `index.html` next to image files (`hub.jpg`, `ch1.jpg`, …) and two libs (`impress.js`, `panzoom.min.js`). When the user asks you to edit a deck rather than generate one, follow this map.

### Anatomy

Inside `<div id="impress">` every card is a `<div class="step">` with these attributes:

| Attribute | Meaning | Typical values |
|---|---|---|
| `id` | Unique handle. **Only hub/chapters/overview need IDs**; subnodes are anonymous. | `hub`, `ch1`–`ch5`, `overview` |
| `class` | `step` (required) + optional `subnode` for small text-only cards | `step`, `step subnode` |
| `data-x` `data-y` | World coordinates of the card's CENTER, in pixels. | hub `0,0`; chapters `±2400, ±1600`; subs `±3100, ±1200/±2000` |
| `data-scale` | Zoom factor when this card is active. **Bigger = camera pulls back farther = card looks smaller at rest.** | hub `1` (network mode) or `10–15` (zoom-on-image); chapters `1`; subs `0.15–0.32` |
| `data-parent` | Logical parent for the flow-path connector lines. | `hub`, `ch1`, … |
| `data-rotate` | Optional rotation in degrees. | `-8`, `12` |

The `#overview` step (`data-scale="9"` or so) is the "fit everything in view" camera and is intentionally invisible — never put content in it.

### Two layout families

1. **Node-network** (kawaii, formal) — hub at scale 1, chapters fanned out, flow-path lines drawn between parent/child. To rearrange: only change `data-x`/`data-y`. Lines redraw automatically.
2. **Zoom-on-image** (handdrawn, cyberpunk, cats, anime, tech, vintage) — hub at scale 10–15, chapters/subs are pins on top of the hub image. Flow-path is hidden (`#flow-path { display: none !important; }`). To place a pin, set `data-x`/`data-y` to the pixel offset from image center, multiplied by the scale ratio. For a scale-10 hub, a pin "halfway right" sits around `data-x="2400"`.

Check `<style>` for `#flow-path { display: none` to tell which family you're in.

### Common edits

**Change text on a card** — find the step by `id` (or by its title text), edit `.tag`, `.title`, `.body` directly. No script changes needed.

**Move a card** — change `data-x` / `data-y` on the step. Refresh the page; impress.js re-reads these on init. Connectors (in node-network themes) auto-follow.

**Resize a card** — change `data-scale`. Increasing scale on a chapter (e.g. 1 → 1.4) makes the camera linger farther out, so the card looks smaller during navigation. To make a card visually bigger in overview, **decrease** its scale or **increase** its `width`/`height` in CSS.

**Replace a card's image** — swap the `<img src="chN.jpg">` filename, or drop a new file with the same name into the deck folder.

**Add a chapter** — copy an existing `<div id="chN" class="step" …>` block, increment N, pick a fresh `data-x`/`data-y` that doesn't overlap others, and add a matching image. Add 0–2 subnodes underneath with `data-parent="chN"`.

**Add a subnode** — copy any `<div class="step subnode" data-parent="chN" …>` and place it near its chapter (subs typically sit ±700px from their chapter in node-network themes, or anywhere "inside" the image area in zoom-on-image themes).

**Delete a card** — remove the `<div class="step" …>` block. Also remove any subnodes whose `data-parent` points to it. Re-number remaining chapter IDs only if other code references them (it usually doesn't).

**Swap theme palette** — edit the `:root` CSS variables (`--bg`, `--accent`, `--frame`, `--body`, etc.). Keep the structure; only colors change.

### Things NOT to touch unless you know why

- The `<script>` block at the bottom (impress init, panzoom setup, double-tap detection, mode switching). All decks share this scaffolding; bugs here break navigation.
- The `#overview` step.
- The `data-transition-duration` on `<div id="impress">` (1400ms is tuned).
- The clip-path / SVG masks defining the card SHAPE — these are part of the theme identity. Change colors/sizes, not the polygon.

### Verification after editing

Always open the file in a browser (or take a Playwright screenshot) and:

1. The card you moved is where you expect in overview.
2. Double-clicking it zooms in cleanly with no jump or off-screen drift.
3. Scroll wheel returns to overview.
4. In node-network themes, connector lines reach the new position.
