/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import TanStackRouterVite from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Silence verbose logging from Nx Vite ts-paths plugin to avoid noisy "Unable to resolve" messages
process.env.NX_VERBOSE_LOGGING = 'false';

export default defineConfig({
  root: __dirname,
  cacheDir: './node_modules/.vite/smartspace',

  server: {
    port: 4300,
    host: 'localhost',
    allowedHosts: ['melanie-chaster-cheerlessly.ngrok-free.dev'],
},

  preview: {
    port: 4400,
    host: 'localhost',
  },

  plugins: [
    TanStackRouterVite({
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
      reporter: ['text', 'text-summary', 'html', 'lcov'],
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