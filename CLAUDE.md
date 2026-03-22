# CLAUDE.md — thadanderson.com

Professional website for Thad Anderson (percussionist, composer, arts leader).
Built with Astro, deployed via Vercel, source managed on GitHub.

---

## Tech Stack

- **Framework**: Astro 6 with MDX integration
- **Content**: Markdown `.md` files (authored in Obsidian)
- **Styling**: Global CSS in `src/layouts/BaseLayout.astro` (no CSS framework)
- **Deployment**: Vercel (connected to this GitHub repo)
- **Dev server**: `npm run dev` → localhost:4321

---

## Project Structure

```
src/
  content/          # All page content as .md files (edit these in Obsidian)
    Home.md         # Landing page (not in nav)
    About.md        # Full biography
    Recordings.md
    Contact.md
    Compositions/
      Overview & Purchase.md   # /compositions index
      Percussion/
      Mixed Chamber/
      Multi-Media/
      Piano/
      Open Instrumentation/
    Projects/       # Individual project pages
    Teaching/
      Teaching Overview.md     # /teaching index
      Clinics & Presentations/
  layouts/
    BaseLayout.astro  # Main layout: nav, global CSS, footer
  pages/            # Astro route files (do not edit for content changes)
  plugins/
    remark-obsidian.mjs  # Handles Obsidian wiki-link syntax

public/
  media/            # Images and PDFs served as static assets
    covers/
    portfolio/
    (subdirectories by topic)
```

---

## Content Workflow

Content lives in `src/content/` and is edited in **Obsidian** (open the repo root as a vault).

### Obsidian syntax is supported
The custom remark plugin (`src/plugins/remark-obsidian.mjs`) transforms:
- `![[image.jpg]]` → `<img src="/media/image.jpg" />`
- `![[image.jpg|300]]` → `<img src="/media/image.jpg" width="300" />`
- `[[Page Name]]` → `<a href="/slug">Page Name</a>`
- `[[Page Name|Display Text]]` → `<a href="/slug">Display Text</a>`

Images and PDFs go in `public/media/`. The plugin automatically resolves filenames to their correct paths even in subdirectories.

### Adding new content
- **New composition**: add a `.md` file to the appropriate `src/content/Compositions/<Category>/` folder. It will automatically get a route at `/compositions/<category>/<slug>`.
- **New project**: add a `.md` file to `src/content/Projects/`. Route: `/projects/<slug>`.
- **New teaching page**: add a `.md` file to `src/content/Teaching/Clinics & Presentations/`. Route: `/teaching/<slug>`.
- **New media**: drop files into `public/media/` (or a subdirectory). Reference by filename in `.md` files using `![[filename.ext]]`.

### Slugs are auto-generated from filenames
`Scroll Manuscript.md` → `/compositions/percussion/scroll-manuscript`
Special characters, diacritics, and spaces are handled automatically.

---

## Navigation

Defined in `src/layouts/BaseLayout.astro` (the `nav` array in the frontmatter script).

- The **home page** (`/`) renders `Home.md` — not shown in the nav
- The **About** nav link goes to `/about` (renders `About.md`)
- **Compositions** has a dropdown with all 5 categories

To add a nav item, edit the `nav` array in `BaseLayout.astro`.

---

## Styling

All CSS is in `src/layouts/BaseLayout.astro` inside `<style is:global>`.

Key CSS variables (defined in `:root`):
```css
--bg: #ffffff
--text: #1a1a1a
--accent: #2a4a7f
--muted: #666
--border: #e2e2e2
--nav-bg: #1a1a1a
--max-w: 900px
--nav-h: 58px
--font: system font stack
```

**Important**: Global `ul`, `ol`, and `li` margin/padding styles are scoped to `main` to prevent leaking into the navigation.

---

## Dev Commands

```bash
npm run dev       # Start dev server (localhost:4321)
npm run build     # Production build
npm run preview   # Preview production build (requires build first)
```

---

## Deployment

Pushing to `main` on GitHub triggers an automatic Vercel deployment to `thadanderson.com`.
