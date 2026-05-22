import path from 'path';

import type { StorybookConfig } from '@storybook/react-vite';

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

    // Existing aliases from nxViteTsPaths (and any others injected by Storybook)
    const existingAlias =
      typeof baseConfig.resolve?.alias === 'object' &&
      !Array.isArray(baseConfig.resolve.alias)
        ? baseConfig.resolve.alias
        : {};

    return {
      ...baseConfig,
      plugins: filteredPlugins,
      resolve: {
        ...baseConfig.resolve,
        alias: {
          // Put our override FIRST so Vite picks it over the nxViteTsPaths entry.
          // `@/` → packages/chat-ui/src/ for chat-ui internal imports.
          '@': path.resolve(__dirname, '../packages/chat-ui/src'),
          // Keep all other aliases intact.
          ...existingAlias,
        },
      },
    };
  },
};

export default config;
