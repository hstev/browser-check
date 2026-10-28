/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string;
  homepage: string;
};

/** Public URL of the deployed site, used for canonical/Open Graph URLs (social networks require absolute URLs). */
const siteUrl = (process.env.SITE_URL || pkg.homepage).replace(/\/?$/, '/');

/** Fills `%SITE_URL%` in index.html and emits robots.txt and sitemap.xml. */
function seo(url: string): Plugin {
  return {
    name: 'browser-check:seo',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', url),
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${url}sitemap.xml\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
      });
    },
  };
}

export default defineConfig({
  // Relative base so the build works from any sub-path (GitHub Pages, etc.).
  base: './',
  plugins: [react(), tailwindcss(), seo(siteUrl)],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
    unstubGlobals: true,
  },
});
