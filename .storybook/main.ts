import { fileURLToPath } from 'url';
import path from 'path';

import type { StorybookConfig } from '@storybook/react-vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    '../packages/chat-ui/src/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    // Essentials (controls, actions, backgrounds, viewport, toolbars, docs)
    // and interactions are bundled into the core storybook package in v10.
    // Only list third-party addons that need explicit registration.
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal(baseConfig) {
    /**
     * Storybook processes chat-ui package sources directly (not via dist).
     * The package uses `@/` aliased to `packages/chat-ui/src/`, but the
     * root vite config maps `@/` to `src/`.  We override it here so package
     * internals resolve correctly.
     *
     * App stories (src/**) must avoid the `@/` alias and instead use
     * `@smartspace/*` package imports or relative paths.
     *
     * Also drop the TanStack Router plugin — it is only needed in the app
     * dev-server context, not in Storybook.
     */
    const filteredPlugins = (baseConfig.plugins ?? []).filter((plugin) => {
      if (!plugin || typeof plugin !== 'object' || Array.isArray(plugin)) {
        return true;
      }
      const p = plugin as { name?: string };
      return p.name !== 'vite-plugin-tanstack-router';
    });

    // Normalise existing aliases to array form so we can prepend our override.
    // Vite resolves array aliases in order (first match wins), while object
    // aliases use last-key-wins semantics — array format is the only safe way
    // to guarantee our '@/' → packages/chat-ui/src/ override takes precedence
    // over the nxViteTsPaths entry that maps '@/' → src/.
    const existingAliases = Array.isArray(baseConfig.resolve?.alias)
      ? baseConfig.resolve.alias
      : Object.entries(baseConfig.resolve?.alias ?? {}).map(
          ([find, replacement]) => ({
            find,
            replacement,
          })
        );

    return {
      ...baseConfig,
      plugins: filteredPlugins,
      resolve: {
        ...baseConfig.resolve,
        alias: [
          // Both aliases point at the same source tree so all modules share
          // a single React Context instance — without this, ChatProvider
          // imported from @smartspace/chat-ui (dist) creates a different
          // context object than useChatContext imported via @/ (source),
          // causing "Chat hook used outside <ChatProvider>" errors.
          {
            find: '@smartspace/chat-ui/styles.css',
            replacement: path.resolve(
              __dirname,
              '../packages/chat-ui/src/styles.css'
            ),
          },
          {
            find: '@smartspace/chat-ui',
            replacement: path.resolve(
              __dirname,
              '../packages/chat-ui/src/index.ts'
            ),
          },
          // '@/' → packages/chat-ui/src/ for chat-ui internal imports.
          {
            find: '@',
            replacement: path.resolve(__dirname, '../packages/chat-ui/src'),
          },
          ...existingAliases,
        ],
      },
    };
  },
};

export default config;
