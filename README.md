# Scientific Discovery: central page

Hub page for Nikhil Abhyankar's work on safe LLM agents for open-ended scientific discovery. It links the four project pages:

| Project | Venue | Project page |
|---|---|---|
| LLM-ACES | NeurIPS 2026 | https://scientific-discovery.github.io/llm-aces-project/ |
| LLM-AutoSciLab | NeurIPS 2026 | https://scientific-discovery.github.io/llm-autoscilab-project/ |
| LLEMA | ICLR 2026 | https://scientific-discovery.github.io/llema-project/ |
| LLM-FE | TMLR 2026 | https://scientific-discovery.github.io/llm-fe/ |

## Publish on GitHub Pages

1. Create a repo named `main_page` in the `scientific-discovery` org and push this folder to it.
2. In the repo go to Settings → Pages → Deploy from a branch → `main` / root.
3. The page goes live at https://scientific-discovery.github.io/main_page/

For the shorter https://scientific-discovery.github.io/ URL, name the repo `scientific-discovery.github.io` instead. Then replace `/main_page/` in the `canonical`, `og:url`, `og:image` and `twitter:image` tags at the top of `index.html`.

## Preview locally

```bash
cd main_page && python3 -m http.server 8000
```

Then open http://localhost:8000 (VS Code forwards the port automatically on a remote machine).

## What to edit where

- Text, links and venues: `index.html`. Each project card is an `<article class="card">` block.
- Colors, fonts and layout: `static/css/main.css`. It uses the same Inter font and color tokens as the project pages (`llema-project/static/css/index.css`).
- Figure viewer and share/QR dialog: `static/js/main.js`.
- Card figures: `static/images/figs/<project>-1400.webp` (card) and `-2400.webp` (full-size viewer).
- Link preview image for Slack, LinkedIn and X: `static/images/og-image.png` (1200 × 630).
