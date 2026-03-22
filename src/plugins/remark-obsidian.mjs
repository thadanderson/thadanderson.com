/**
 * remark-obsidian.mjs
 * Transforms Obsidian wiki-link syntax into standard HTML:
 *   ![[image.jpg]]        → <img src="/media/image.jpg" />
 *   ![[image.jpg|300]]    → <img src="/media/image.jpg" width="300" />
 *   [[Page Name]]         → <a href="/slug">Page Name</a>
 *   [[Page Name|Display]] → <a href="/slug">Display</a>
 */

import fs from 'node:fs';
import path from 'node:path';
import { visit } from 'unist-util-visit';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Image map: filename → public URL path ────────────────────────────────────

function buildImageMap() {
  const map = new Map();
  const mediaDir = path.join(process.cwd(), 'public', 'media');

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else {
        const urlPath =
          '/' +
          path.relative(path.join(process.cwd(), 'public'), full).replace(/\\/g, '/');
        map.set(item.toLowerCase(), urlPath);
      }
    }
  }

  walk(mediaDir);
  return map;
}

// ─── Page map: lowercase page title → site URL ───────────────────────────────

function buildPageMap() {
  const map = new Map();
  const contentDir = path.join(process.cwd(), 'src', 'content');

  // Compositions (nested by category folder)
  const compDir = path.join(contentDir, 'Compositions');
  if (fs.existsSync(compDir)) {
    for (const cat of fs.readdirSync(compDir)) {
      const catPath = path.join(compDir, cat);
      if (!fs.statSync(catPath).isDirectory()) continue;
      const catSlug = toSlug(cat);
      for (const file of fs.readdirSync(catPath)) {
        if (!file.endsWith('.md')) continue;
        const title = file.replace('.md', '');
        map.set(title.toLowerCase(), `/compositions/${catSlug}/${toSlug(title)}`);
      }
    }
  }

  // Projects (top-level only)
  const projDir = path.join(contentDir, 'Projects');
  if (fs.existsSync(projDir)) {
    for (const file of fs.readdirSync(projDir)) {
      if (!file.endsWith('.md')) continue;
      const title = file.replace('.md', '');
      map.set(title.toLowerCase(), `/projects/${toSlug(title)}`);
    }
  }

  // Teaching (recursive)
  const teachDir = path.join(contentDir, 'Teaching');
  if (fs.existsSync(teachDir)) {
    function walkTeach(dir) {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          walkTeach(full);
        } else if (item.endsWith('.md')) {
          const title = item.replace('.md', '');
          if (title === 'Teaching Overview') {
            map.set(title.toLowerCase(), '/teaching');
          } else {
            map.set(title.toLowerCase(), `/teaching/${toSlug(title)}`);
          }
        }
      }
    }
    walkTeach(teachDir);
  }

  // Top-level pages
  map.set('about', '/about');
  map.set('recordings', '/recordings');
  map.set('contact', '/contact');

  return map;
}

const imageMap = buildImageMap();
const pageMap = buildPageMap();

// ─── Resolvers ────────────────────────────────────────────────────────────────

const MEDIA_EXTS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.mp3', '.mp4']);

function getExt(filename) {
  const dot = filename.trim().lastIndexOf('.');
  return dot !== -1 ? filename.trim().slice(dot).toLowerCase() : '';
}

function resolveMedia(filename) {
  const lower = filename.trim().toLowerCase();
  return imageMap.get(lower) ?? `/media/${filename.trim()}`;
}

function resolveLink(name) {
  const lower = name.trim().toLowerCase();
  // If it looks like a media file, link directly to it
  if (MEDIA_EXTS.has(getExt(lower))) {
    return resolveMedia(name);
  }
  if (pageMap.has(lower)) return pageMap.get(lower);
  // Try just the basename (handles "Compositions/Percussion/Passages" → "passages")
  const base = lower.split('/').pop();
  if (pageMap.has(base)) return pageMap.get(base);
  return `/${toSlug(name)}`;
}

// ─── Text processor ──────────────────────────────────────────────────────────

const OBSIDIAN_RE = /(!?\[\[([^\]]+)\]\])/g;

function processText(text) {
  const nodes = [];
  let lastIndex = 0;

  for (const match of text.matchAll(OBSIDIAN_RE)) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    const isEmbed = match[1].startsWith('!');
    const inner = match[2];

    if (isEmbed) {
      // ![[file.ext]] or ![[file.ext|size]]
      const [filename, sizeStr] = inner.split('|');
      const src = resolveMedia(filename);
      const ext = getExt(filename);

      if (ext === '.pdf') {
        // Embed PDF as a viewer with a fallback link
        nodes.push({
          type: 'html',
          value: `<div class="pdf-embed"><embed src="${src}" type="application/pdf" width="100%" height="800" /><p class="pdf-fallback"><a href="${src}" target="_blank" rel="noopener">Open PDF in new tab ↗</a></p></div>`,
        });
      } else {
        // Render as image
        const widthAttr = sizeStr ? ` width="${sizeStr.trim()}"` : '';
        nodes.push({
          type: 'html',
          value: `<img src="${src}" alt="${filename.trim()}"${widthAttr} style="max-width:100%;height:auto;" />`,
        });
      }
    } else {
      // [[Page Name]] or [[Page Name|Display Text]]
      const [pageName, displayText] = inner.split('|');
      const href = resolveLink(pageName);
      const label = displayText ? displayText.trim() : pageName.trim();
      nodes.push({ type: 'html', value: `<a href="${href}">${label}</a>` });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return nodes;
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export function remarkObsidian() {
  return (tree) => {
    visit(tree, (node) => {
      if (!node.children) return;

      const newChildren = [];
      let changed = false;

      for (const child of node.children) {
        if (child.type === 'text' && child.value.includes('[[')) {
          const processed = processText(child.value);
          const unchanged =
            processed.length === 1 &&
            processed[0].type === 'text' &&
            processed[0].value === child.value;
          if (!unchanged) {
            newChildren.push(...processed);
            changed = true;
            continue;
          }
        }
        newChildren.push(child);
      }

      if (changed) node.children = newChildren;
    });
  };
}
