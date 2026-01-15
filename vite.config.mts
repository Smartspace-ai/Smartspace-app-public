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

export default defineConfig({
  // Use relative base so static hosting works under any path prefix.
  base: './',
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
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('/react') || id.includes('/react-dom')) return 'react';
          if (id.includes('/@mui/')) return 'mui';
          if (id.includes('/@milkdown/')) return 'milkdown';
          if (id.includes('/@tanstack/')) return 'tanstack';
          if (id.includes('/ace-builds/')) return 'ace';

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
});