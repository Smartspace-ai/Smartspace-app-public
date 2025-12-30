// @ts-nocheck
/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'module';
import { defineConfig } from 'vite';

// Silence verbose logging from Nx Vite ts-paths plugin to avoid noisy "Unable to resolve" messages
process.env.NX_VERBOSE_LOGGING = 'false';

export default defineConfig({
  root: __dirname,
  cacheDir: './node_modules/.vite/smartspace',

  server: {
    port: 4300,
    strictPort: true,
    // Listen on all interfaces for reliability across IPv4/IPv6 and when using tunnels
    host: true,
    // Explicitly allow localhost access in addition to the ngrok domain
    allowedHosts: ['localhost', '127.0.0.1', 'melanie-chaster-cheerlessly.ngrok-free.dev'],
},

  preview: {
    port: 4400,
    host: 'localhost',
  },

  plugins: [
    // Dynamically resolve the TanStack Router Vite plugin to avoid editor/moduleResolution issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ((() => {
      const require = createRequire(import.meta.url);
      try {
        // Avoid static analysis resolution by constructing the module name dynamically
        const moduleName = ['@tanstack', 'router-plugin', 'vite'].join('/');
        // @ts-ignore
        return require(moduleName).default;
      } catch {
        return () => ({ name: 'tanstack-router-plugin-noop' });
      }
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