/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'module';
import { defineConfig, type PluginOption } from 'vite';

const publicOriginHost = (() => {
  const origin = process.env.PUBLIC_ORIGIN;
  if (!origin) return undefined;
  try {
    return new URL(origin).hostname;
  } catch (_err) {
    return undefined;
  }
})();

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: './node_modules/.vite/smartspace',

  server: {
    port: 4300,
    strictPort: true,
    // Listen on all interfaces for reliability across IPv4/IPv6 and when using tunnels
    host: true,
    // Allow localhost plus the hostname from PUBLIC_ORIGIN (used for dev tunnels / external access)
    allowedHosts: ['localhost', '127.0.0.1', ...(publicOriginHost ? [publicOriginHost] : [])],
  },

  preview: {
    port: 4400,
    host: 'localhost',
  },

  plugins: [
    // Skip the TanStack Router plugin in test mode. Tests import route
    // modules directly (routeTree.gen.ts is already generated and committed),
    // so the plugin's route-tree regeneration and HMR injection are unused.
    // Under @nx/vite:test the plugin's output gets layered on top of the
    // transform @vitejs/plugin-react already applies, producing
    // "Duplicate declaration 'hot'" in Babel when test files import routes.
    // This gate is targeted — the plugin still runs for dev/build/preview.
    ...(mode === 'test'
      ? []
      : [
          // Dynamically resolve the TanStack Router Vite plugin to avoid editor/moduleResolution issues
          ((() => {
            const require = createRequire(import.meta.url);
            try {
              // Avoid static analysis resolution by constructing the module name dynamically
              const moduleName = ['@tanstack', 'router-plugin', 'vite'].join('/');
              const mod = require(moduleName) as { default?: unknown };
              if (typeof mod?.default === 'function') {
                return mod.default as (opts: { routeFileIgnorePattern?: string }) => PluginOption;
              }
            } catch {
              // ignore
            }
            return () => ({ name: 'tanstack-router-plugin-noop' }) as PluginOption;
          })())({
            // Ignore tests and test directories when scanning for route files
            routeFileIgnorePattern: '__tests__|\\.(test|spec)\\.(t|j)sx?$',
          }),
        ]),
    react(),
    nxViteTsPaths(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        // Suppress Sass deprecation warnings coming from dependencies in node_modules.
        // Warnings from *your* scss still show.
        quietDeps: true,
        // Dart Sass emits this when the toolchain calls the legacy JS API.
        // This isn't actionable in app code; silence just this deprecation for a cleaner build.
        // (Keeps other deprecations visible.)
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  build: {
    outDir: './dist/smartspace',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        teamsAuthStart: path.resolve(__dirname, 'teams-auth-start.html'),
        teamsAuthEnd: path.resolve(__dirname, 'teams-auth-end.html'),
      },
      onwarn(warning, warn) {
        const w = warning as unknown as {
          message?: unknown;
          loc?: { file?: unknown } | null;
          id?: unknown;
        };
        const msg = typeof w?.message === 'string' ? w.message : '';
        const file =
          (typeof w?.loc?.file === 'string' ? w.loc.file : undefined) ??
          (typeof w?.id === 'string' ? w.id : undefined) ??
          '';

        // Silence a noisy, non-actionable warning from a dependency.
        if (
          msg.includes('contains an annotation that Rollup cannot interpret') &&
          String(file).includes('@microsoft/signalr')
        ) {
          return;
        }

        warn(warning);
      },
      output: {
        // Practical code-splitting to keep bundles smaller and reduce chunk-size warnings.
        // Order matters — first match wins.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // React core (imported everywhere)
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/')
          )
            return 'react';

          // UI libraries
          if (id.includes('/@mui/')) return 'mui';
          if (id.includes('/@emotion/')) return 'emotion';
          if (id.includes('/@radix-ui/')) return 'radix';
          if (id.includes('/lucide-react/') || id.includes('/@heroicons/'))
            return 'icons';
          if (id.includes('/framer-motion/')) return 'motion';

          // Editor libraries (heaviest third-party surfaces)
          if (id.includes('/@milkdown/') || id.includes('/@milkdown-next/'))
            return 'milkdown';
          if (id.includes('/ace-builds/') || id.includes('/react-ace/'))
            return 'ace';

          // Router + data
          if (id.includes('/@tanstack/')) return 'tanstack';

          // Auth + identity
          if (
            id.includes('/@azure/msal') ||
            id.includes('/jwt-decode/')
          )
            return 'msal';
          if (id.includes('/@microsoft/teams-js/')) return 'teams';

          // Realtime
          if (id.includes('/@microsoft/signalr/')) return 'signalr';

          // Markdown pipeline — unified, remark/rehype, mdast/hast utils, visit
          if (
            id.includes('/react-markdown/') ||
            id.includes('/remark-') ||
            id.includes('/rehype-') ||
            id.includes('/unified/') ||
            id.includes('/unist-util-') ||
            id.includes('/mdast-util-') ||
            id.includes('/hast-util-') ||
            id.includes('/micromark') ||
            id.includes('/decode-named-character-reference/')
          )
            return 'markdown';

          // Form schema rendering
          if (id.includes('/@jsonforms/')) return 'jsonforms';

          return 'vendor';
        },
      },
    },
  },

  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    reporters: ['default'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './coverage/smartspace',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json', 'json-summary'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/**/*.{test,spec}.{ts,tsx,js,jsx}',
        'src/routeTree.gen.ts',
      ],
      cleanOnRerun: true,
      reportOnFailure: true,
    },
  },
}));