// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { remarkObsidian } from './src/plugins/remark-obsidian.mjs';
import { syncContentMediaIntegration } from './src/plugins/sync-content-media.mjs';

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), syncContentMediaIntegration()],
  markdown: {
    remarkPlugins: [remarkObsidian],
  },
});
