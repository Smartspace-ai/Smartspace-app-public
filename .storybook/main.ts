import { fileURLToPath } from 'url';
import path from 'path';

import type { StorybookConfig } from '@storybook/react-vite';
import type { Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const chatUiSrc = path.resolve(__dirname, '../packages/chat-ui/src');
const appSrc = path.resolve(__dirname, '../src');

/**
 * Routes `@/` imports to the correct source root based on the importer's
 * location. Files inside packages/chat-ui/src/ resolve `@/` to that package's
 * own source root; everything else (app stories in src/) resolves to src/.
 *
 * A plain alias can't do this — it has no knowledge of the importer path —
 * so we use a Vite plugin resolveId hook instead.
 */
function atAliasRouter(): Plugin {
  return {
    name: 'storybook-at-alias-router',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!source.startsWith('@/')) return null;
      const subpath = source.slice(2); // strip '@/'
      const norm = (importer ?? '').replace(/\\/g, '/');
      const base = norm.includes('/packages/chat-ui/src/') ? chatUiSrc : appSrc;
      // Delegate back into Vite's full resolution pipeline so it handles
      // extension appending (.tsx/.ts) and directory index lookup (index.ts).
      return this.resolve(path.resolve(base, subpath), importer, {
        skipSelf: true,
      });
    },
  };
}

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    '../packages/chat-ui/src/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal(baseConfig) {
    const filteredPlugins = (baseConfig.plugins ?? []).filter((plugin) => {
      if (!plugin || typeof plugin !== 'object' || Array.isArray(plugin)) {
        return true;
      }
      const p = plugin as { name?: string };
      return p.name !== 'vite-plugin-tanstack-router';
    });

    // Normalise existing aliases to array form. We strip out any '@' entry
    // from nxViteTsPaths because atAliasRouter() handles @/ routing instead.
    const existingAliases = (
      Array.isArray(baseConfig.resolve?.alias)
        ? baseConfig.resolve.alias
        : Object.entries(baseConfig.resolve?.alias ?? {}).map(
            ([find, replacement]) => ({ find, replacement })
          )
    ).filter((a) => {
      const f = typeof a === 'object' && 'find' in a ? a.find : null;
      return f !== '@' && f !== '@/';
    });

    return {
      ...baseConfig,
      plugins: [
        ...filteredPlugins,
        // Must come after Storybook's own plugins so we intercept first.
        atAliasRouter(),
      ],
      resolve: {
        ...baseConfig.resolve,
        alias: [
          // Redirect @smartspace/chat-ui imports to source so all modules
          // share a single React Context instance (prevents "hook used outside
          // ChatProvider" errors caused by dist vs source context mismatch).
          {
            find: '@smartspace/chat-ui/styles.css',
            replacement: path.resolve(chatUiSrc, 'styles.css'),
          },
          {
            find: '@smartspace/chat-ui',
            replacement: path.resolve(chatUiSrc, 'index.ts'),
          },
          ...existingAliases,
        ],
      },
    };
  },
};

export default config;
