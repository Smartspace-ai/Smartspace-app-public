// vite.config.mts
import { nxViteTsPaths } from "file:///C:/Users/thayw/SmartSpaceCursor/Smartspace-app-public/node_modules/@nx/vite/plugins/nx-tsconfig-paths.plugin.js";
import TanStackRouterVite from "file:///C:/Users/thayw/SmartSpaceCursor/Smartspace-app-public/node_modules/@tanstack/router-plugin/dist/esm/vite.js";
import react from "file:///C:/Users/thayw/SmartSpaceCursor/Smartspace-app-public/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import { defineConfig } from "file:///C:/Users/thayw/SmartSpaceCursor/Smartspace-app-public/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "C:\\Users\\thayw\\SmartSpaceCursor\\Smartspace-app-public";
var vite_config_default = defineConfig({
  root: __vite_injected_original_dirname,
  cacheDir: "./node_modules/.vite/smartspace",
  server: {
    port: 4300,
    host: "localhost",
    allowedHosts: ["melanie-chaster-cheerlessly.ngrok-free.dev"]
  },
  preview: {
    port: 4400,
    host: "localhost"
  },
  plugins: [TanStackRouterVite(), react(), nxViteTsPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: "./dist/smartspace",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  test: {
    watch: false,
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      enabled: true,
      provider: "v8",
      reportsDirectory: "./coverage/smartspace",
      reporter: ["text", "text-summary", "html", "lcov"],
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/__tests__/**",
        "src/**/*.{test,spec}.{ts,tsx,js,jsx}",
        "src/routeTree.gen.ts"
      ],
      cleanOnRerun: true,
      reportOnFailure: true
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcdGhheXdcXFxcU21hcnRTcGFjZUN1cnNvclxcXFxTbWFydHNwYWNlLWFwcC1wdWJsaWNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHRoYXl3XFxcXFNtYXJ0U3BhY2VDdXJzb3JcXFxcU21hcnRzcGFjZS1hcHAtcHVibGljXFxcXHZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvdGhheXcvU21hcnRTcGFjZUN1cnNvci9TbWFydHNwYWNlLWFwcC1wdWJsaWMvdml0ZS5jb25maWcubXRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9J3ZpdGVzdCcgLz5cclxuaW1wb3J0IHsgbnhWaXRlVHNQYXRocyB9IGZyb20gJ0BueC92aXRlL3BsdWdpbnMvbngtdHNjb25maWctcGF0aHMucGx1Z2luJztcclxuaW1wb3J0IFRhblN0YWNrUm91dGVyVml0ZSBmcm9tICdAdGFuc3RhY2svcm91dGVyLXBsdWdpbi92aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICByb290OiBfX2Rpcm5hbWUsXHJcbiAgY2FjaGVEaXI6ICcuL25vZGVfbW9kdWxlcy8udml0ZS9zbWFydHNwYWNlJyxcclxuXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiA0MzAwLFxyXG4gICAgaG9zdDogJ2xvY2FsaG9zdCcsXHJcbiAgICBhbGxvd2VkSG9zdHM6IFsnbWVsYW5pZS1jaGFzdGVyLWNoZWVybGVzc2x5Lm5ncm9rLWZyZWUuZGV2J10sXHJcbn0sXHJcblxyXG4gIHByZXZpZXc6IHtcclxuICAgIHBvcnQ6IDQ0MDAsXHJcbiAgICBob3N0OiAnbG9jYWxob3N0JyxcclxuICB9LFxyXG5cclxuICBwbHVnaW5zOiBbVGFuU3RhY2tSb3V0ZXJWaXRlKCksIHJlYWN0KCksIG54Vml0ZVRzUGF0aHMoKV0sXHJcblxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIC8vIFVuY29tbWVudCB0aGlzIGlmIHlvdSBhcmUgdXNpbmcgd29ya2Vycy5cclxuICAvLyB3b3JrZXI6IHtcclxuICAvLyAgcGx1Z2luczogWyBueFZpdGVUc1BhdGhzKCkgXSxcclxuICAvLyB9LFxyXG5cclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiAnLi9kaXN0L3NtYXJ0c3BhY2UnLFxyXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXHJcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogdHJ1ZSxcclxuICAgIGNvbW1vbmpzT3B0aW9uczoge1xyXG4gICAgICB0cmFuc2Zvcm1NaXhlZEVzTW9kdWxlczogdHJ1ZSxcclxuICAgIH0sXHJcbiAgfSxcclxuXHJcbiAgdGVzdDoge1xyXG4gICAgd2F0Y2g6IGZhbHNlLFxyXG4gICAgZ2xvYmFsczogdHJ1ZSxcclxuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxyXG4gICAgc2V0dXBGaWxlczogWycuL3NyYy90ZXN0L3NldHVwLnRzJ10sXHJcbiAgICBpbmNsdWRlOiBbJ3NyYy8qKi8qLnt0ZXN0LHNwZWN9LntqcyxtanMsY2pzLHRzLG10cyxjdHMsanN4LHRzeH0nXSxcclxuXHJcbiAgICByZXBvcnRlcnM6IFsnZGVmYXVsdCddLFxyXG4gICAgY292ZXJhZ2U6IHtcclxuICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgcHJvdmlkZXI6ICd2OCcsXHJcbiAgICAgIHJlcG9ydHNEaXJlY3Rvcnk6ICcuL2NvdmVyYWdlL3NtYXJ0c3BhY2UnLFxyXG4gICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ3RleHQtc3VtbWFyeScsICdodG1sJywgJ2xjb3YnXSxcclxuICAgICAgYWxsOiB0cnVlLFxyXG4gICAgICBpbmNsdWRlOiBbJ3NyYy8qKi8qLnt0cyx0c3h9J10sXHJcbiAgICAgIGV4Y2x1ZGU6IFtcclxuICAgICAgICAnc3JjLyoqLyouZC50cycsXHJcbiAgICAgICAgJ3NyYy8qKi9fX3Rlc3RzX18vKionLFxyXG4gICAgICAgICdzcmMvKiovKi57dGVzdCxzcGVjfS57dHMsdHN4LGpzLGpzeH0nLFxyXG4gICAgICAgICdzcmMvcm91dGVUcmVlLmdlbi50cycsXHJcbiAgICAgIF0sXHJcbiAgICAgIGNsZWFuT25SZXJ1bjogdHJ1ZSxcclxuICAgICAgcmVwb3J0T25GYWlsdXJlOiB0cnVlLFxyXG4gICAgfSxcclxuICB9LFxyXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxxQkFBcUI7QUFDOUIsT0FBTyx3QkFBd0I7QUFDL0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLG9CQUFvQjtBQUw3QixJQUFNLG1DQUFtQztBQU96QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixVQUFVO0FBQUEsRUFFVixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixjQUFjLENBQUMsNENBQTRDO0FBQUEsRUFDL0Q7QUFBQSxFQUVFLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFFQSxTQUFTLENBQUMsbUJBQW1CLEdBQUcsTUFBTSxHQUFHLGNBQWMsQ0FBQztBQUFBLEVBRXhELFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2Isc0JBQXNCO0FBQUEsSUFDdEIsaUJBQWlCO0FBQUEsTUFDZix5QkFBeUI7QUFBQSxJQUMzQjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU07QUFBQSxJQUNKLE9BQU87QUFBQSxJQUNQLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLFlBQVksQ0FBQyxxQkFBcUI7QUFBQSxJQUNsQyxTQUFTLENBQUMsc0RBQXNEO0FBQUEsSUFFaEUsV0FBVyxDQUFDLFNBQVM7QUFBQSxJQUNyQixVQUFVO0FBQUEsTUFDUixTQUFTO0FBQUEsTUFDVCxVQUFVO0FBQUEsTUFDVixrQkFBa0I7QUFBQSxNQUNsQixVQUFVLENBQUMsUUFBUSxnQkFBZ0IsUUFBUSxNQUFNO0FBQUEsTUFDakQsS0FBSztBQUFBLE1BQ0wsU0FBUyxDQUFDLG1CQUFtQjtBQUFBLE1BQzdCLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsY0FBYztBQUFBLE1BQ2QsaUJBQWlCO0FBQUEsSUFDbkI7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
