/**
 * sync-content-media.mjs
 *
 * Astro integration that copies non-markdown files (PDFs, images, etc.)
 * from src/content/ to public/media/ at dev startup and build time.
 *
 * This lets you store media files alongside their .md files in Obsidian
 * without manually copying them to public/.
 */

import fs from 'node:fs';
import path from 'node:path';

const SKIP_EXTENSIONS = new Set(['.md', '.DS_Store']);
const SKIP_FILES = new Set(['.DS_Store']);

function syncContentMedia(root) {
  const contentDir = path.join(root, 'src', 'content');
  const mediaDir = path.join(root, 'public', 'media');

  if (!fs.existsSync(contentDir)) return;
  if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

  let copied = 0;

  function walk(dir) {
    for (const item of fs.readdirSync(dir)) {
      if (SKIP_FILES.has(item) || item.startsWith('.')) continue;

      const full = path.join(dir, item);
      const stat = fs.statSync(full);

      if (stat.isDirectory()) {
        walk(full);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (SKIP_EXTENSIONS.has(ext) || SKIP_EXTENSIONS.has(item)) continue;

        const dest = path.join(mediaDir, item);

        // Only copy if source is newer than destination
        if (!fs.existsSync(dest) || stat.mtimeMs > fs.statSync(dest).mtimeMs) {
          fs.copyFileSync(full, dest);
          copied++;
        }
      }
    }
  }

  walk(contentDir);
  if (copied > 0) console.log(`[sync-content-media] Copied ${copied} media file(s) to public/media/`);
}

export function syncContentMediaIntegration() {
  return {
    name: 'sync-content-media',
    hooks: {
      'astro:config:setup': ({ config }) => {
        const root = config.root ? config.root.pathname.replace(/\/$/, '') : process.cwd();
        syncContentMedia(root);
      },
      'astro:build:start': ({ config }) => {
        const root = config.root ? config.root.pathname.replace(/\/$/, '') : process.cwd();
        syncContentMedia(root);
      },
    },
  };
}
