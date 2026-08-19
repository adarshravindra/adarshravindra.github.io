# Personal site — Adarsh Ravindra

Static site. No build step, no dependencies. Plain HTML/CSS/JS.

## Run locally

    python3 -m http.server 8934

Then open http://localhost:8934

## Structure

    index.html          Home (landing, intro, work list, contact)
    404.html            Not-found page
    projects/           Case study pages (tip, site-scan, salesroom, linkme)
    css/style.css       All styles
    js/main.js          Scroll reveal + nav state
    assets/             Resume, images, decks

## Hosting

Live URL: **https://adarshravindra.github.io**

This is a GitHub Pages *user site*, so it serves from the domain root. That requires the
repository to be named exactly `adarshravindra.github.io` — with any other repo name GitHub
serves it from a subpath (`/repo-name/`) and the root-absolute links in `404.html` break.

Deploy: push to the `main` branch of that repo, then enable Pages in
Settings → Pages → Source: `main` / root.

## Changing the domain later

The URL appears in the `canonical`/`og:`/`twitter:` tags of every page, plus `robots.txt`
and `sitemap.xml`. To repoint everything at a custom domain:

    grep -rl "adarshravindra.github.io" . | xargs sed -i '' 's|https://adarshravindra.github.io|https://NEWDOMAIN|g'

Then add a `CNAME` file containing just the bare domain, and point the DNS at GitHub.
Link previews on LinkedIn/WhatsApp only render once these URLs match the real host.

## Open items

1. **The IDfy decks.** `projects/tip.html` and `projects/site-scan.html` link
   `assets/decks/*.pptx`. These are IDfy-owned material — the TIP deck names a company as a
   credit-risk example and includes unreleased roadmap. Review before publishing publicly.

2. Optional: convert the `.pptx` decks to PDF so they preview in-browser instead of downloading.

3. Project thumbnails for the work rows, if wanted.
