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
    Projects/       # Root-level .md files + subfolders
      John Cage Early Recordings Collection/
        Overview.md              # /projects/john-cage-early-recordings-collection
        CageDisks1.doc/          # /projects/john-cage-early-recordings-collection/cagedisks1doc
        CageDisks2.doc/
    Teaching/
      Teaching Overview.md       # /teaching index
      Clinics & Presentations/   # /teaching/clinics-and-presentations
  drafts/           # Unpublished .md files — NOT routed, safe to store here
  layouts/
    BaseLayout.astro  # Main layout: nav, global CSS, footer
  pages/            # Astro route files (do not edit for content changes)
  plugins/
    remark-obsidian.mjs       # Handles Obsidian wiki-link and embed syntax
    sync-content-media.mjs    # Copies non-.md files from src/content/ to public/media/

public/
  media/            # Images and PDFs served as static assets (auto-populated by sync plugin)
```

---

## Content Workflow

Content lives in `src/content/` and is edited in **Obsidian** (open the repo root as a vault).

### Obsidian syntax is supported
The custom remark plugin (`src/plugins/remark-obsidian.mjs`) transforms:
- `![[image.jpg]]` → `<img src="/media/image.jpg" />`
- `![[image.jpg|300]]` → `<img src="/media/image.jpg" width="300" />`
- `![[file.pdf]]` → embedded PDF viewer with "Open in new tab" fallback
- `[[file.pdf]]` → `<a href="/media/file.pdf">` direct link
- `[[Page Name]]` → `<a href="/slug">Page Name</a>`
- `[[Page Name|Display Text]]` → `<a href="/slug">Display Text</a>`

### Media files are auto-synced
The `sync-content-media.mjs` Astro integration automatically copies any non-`.md` file (PDFs, images, etc.) from `src/content/` to `public/media/` at dev startup and build time. You do not need to manually move media files — just keep them alongside your `.md` files in Obsidian.

### Adding new content
- **New composition**: add a `.md` file to the appropriate `src/content/Compositions/<Category>/` folder. Route: `/compositions/<category>/<slug>`.
- **New project (root-level)**: add a `.md` file to `src/content/Projects/`. Route: `/projects/<slug>`.
- **New project collection (folder)**: add a subfolder to `src/content/Projects/`. A listing page is auto-generated at `/projects/<folder-slug>`. Add an `Overview.md` inside the folder to use it as the page content.
- **New teaching page**: add a `.md` file to `src/content/Teaching/Clinics & Presentations/`. Route: `/teaching/<slug>`. It will automatically appear on the Clinics & Presentations listing page.
- **Unpublished/draft content**: put `.md` files in `src/drafts/`. They are tracked in git but never routed.

### Slugs are auto-generated from filenames
`Scroll Manuscript.md` → `/compositions/percussion/scroll-manuscript`
Special characters, diacritics, `&` → `and`, and spaces are all handled automatically.

---

## Routing

### Compositions
- `/compositions` → `Overview & Purchase.md`
- `/compositions/<category>` → auto-generated listing of that category's files
- `/compositions/<category>/<slug>` → individual composition page

### Projects
Fully generic — any folder structure in `src/content/Projects/` is automatically routed:
- `/projects` → lists all root-level files and subfolders
- `/projects/<slug>` → root-level `.md` file
- `/projects/<folder>` → subfolder listing page (uses `Overview.md` as content if present)
- `/projects/<folder>/<slug>` → `.md` file directly inside a subfolder
- `/projects/<folder>/<subfolder>` → sub-subfolder listing page
- `/projects/<folder>/<subfolder>/<slug>` → `.md` file inside a sub-subfolder
- Breadcrumbs reflect the full hierarchy on all nested pages

### Teaching
- `/teaching` → `Teaching Overview.md`
- `/teaching/clinics-and-presentations` → auto-generated listing of that folder
- `/teaching/<slug>` → individual teaching page (breadcrumb shows parent folder if applicable)

---

## Navigation

Defined in `src/layouts/BaseLayout.astro` (the `nav` array in the frontmatter script).

- The **home page** (`/`) renders `Home.md` — not shown in the nav
- **Compositions**, **Projects**, and **Teaching** have dropdown menus
- **Teaching** dropdown links to Teaching Overview and Clinics & Presentations
- Dropdowns are CSS-only (`:hover`)

To add a nav item or dropdown entry, edit the `nav` array in `BaseLayout.astro`.

---

## Styling

All CSS is in `src/layouts/BaseLayout.astro` inside `<style is:global>`.

Key CSS variables (defined in `:root`):
```css
--bg: #ffffff
--text: #1a1a1a
--accent: #707070      /* accent line, links, footer headings */
--muted: #666
--border: #e2e2e2
--nav-bg: #1a1a1a      /* header and footer background */
--max-w: 900px
--nav-h: 58px
--font: system font stack
```

**Important**: Global `ul`, `ol`, and `li` margin/padding styles are scoped to `main` to prevent leaking into the navigation.

### Layout details
- Header and footer share `--nav-bg` background with a `6px solid var(--accent)` border between them and the page body
- Footer is three-column: brand/tagline/copyright | navigation | music & social links
- Footer headings and tagline use `var(--accent)` color

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
