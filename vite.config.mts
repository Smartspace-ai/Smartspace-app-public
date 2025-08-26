import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// ✅ correct import
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  root: __dirname,
  cacheDir: './node_modules/.vite/smartspace',

  server: {
    port: 4300,
    host: 'localhost',
    // Allow current and previously used ngrok hosts
    allowedHosts: ['1b53505965c7.ngrok-free.app', '3713aa4fb034.ngrok-free.app'],
  },

  preview: {
    port: 4400,
    host: 'localhost',
  },

  plugins: [
    react(),
    nxViteTsPaths(),
    tanstackRouter({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

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
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './coverage/smartspace',
      provider: 'v8',
    },
  },
})
