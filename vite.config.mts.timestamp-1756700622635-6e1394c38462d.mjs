// vite.config.mts
import { nxViteTsPaths } from "file:///C:/Users/thayw/SmartSpaceCursor/Smartspace-app-public/node_modules/@nx/vite/plugins/nx-tsconfig-paths.plugin.js";
import react from "file:///C:/Users/thayw/SmartSpaceCursor/Smartspace-app-public/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import { defineConfig } from "file:///C:/Users/thayw/SmartSpaceCursor/Smartspace-app-public/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "C:\\Users\\thayw\\SmartSpaceCursor\\Smartspace-app-public";
var vite_config_default = defineConfig({
  root: __vite_injected_original_dirname,
  cacheDir: "./node_modules/.vite/smartspace",
  server: {
    port: 4300,
    host: "localhost"
  },
  preview: {
    port: 4400,
    host: "localhost"
  },
  plugins: [react(), nxViteTsPaths()],
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
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "./coverage/smartspace",
      provider: "v8"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcdGhheXdcXFxcU21hcnRTcGFjZUN1cnNvclxcXFxTbWFydHNwYWNlLWFwcC1wdWJsaWNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHRoYXl3XFxcXFNtYXJ0U3BhY2VDdXJzb3JcXFxcU21hcnRzcGFjZS1hcHAtcHVibGljXFxcXHZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvdGhheXcvU21hcnRTcGFjZUN1cnNvci9TbWFydHNwYWNlLWFwcC1wdWJsaWMvdml0ZS5jb25maWcubXRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9J3ZpdGVzdCcgLz5cclxuaW1wb3J0IHsgbnhWaXRlVHNQYXRocyB9IGZyb20gJ0BueC92aXRlL3BsdWdpbnMvbngtdHNjb25maWctcGF0aHMucGx1Z2luJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICByb290OiBfX2Rpcm5hbWUsXHJcbiAgY2FjaGVEaXI6ICcuL25vZGVfbW9kdWxlcy8udml0ZS9zbWFydHNwYWNlJyxcclxuXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiA0MzAwLFxyXG4gICAgaG9zdDogJ2xvY2FsaG9zdCcsXHJcbn0sXHJcblxyXG4gIHByZXZpZXc6IHtcclxuICAgIHBvcnQ6IDQ0MDAsXHJcbiAgICBob3N0OiAnbG9jYWxob3N0JyxcclxuICB9LFxyXG5cclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgbnhWaXRlVHNQYXRocygpXSxcclxuXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxuXHJcbiAgLy8gVW5jb21tZW50IHRoaXMgaWYgeW91IGFyZSB1c2luZyB3b3JrZXJzLlxyXG4gIC8vIHdvcmtlcjoge1xyXG4gIC8vICBwbHVnaW5zOiBbIG54Vml0ZVRzUGF0aHMoKSBdLFxyXG4gIC8vIH0sXHJcblxyXG4gIGJ1aWxkOiB7XHJcbiAgICBvdXREaXI6ICcuL2Rpc3Qvc21hcnRzcGFjZScsXHJcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcclxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiB0cnVlLFxyXG4gICAgY29tbW9uanNPcHRpb25zOiB7XHJcbiAgICAgIHRyYW5zZm9ybU1peGVkRXNNb2R1bGVzOiB0cnVlLFxyXG4gICAgfSxcclxuICB9LFxyXG5cclxuICB0ZXN0OiB7XHJcbiAgICB3YXRjaDogZmFsc2UsXHJcbiAgICBnbG9iYWxzOiB0cnVlLFxyXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXHJcbiAgICBpbmNsdWRlOiBbJ3NyYy8qKi8qLnt0ZXN0LHNwZWN9LntqcyxtanMsY2pzLHRzLG10cyxjdHMsanN4LHRzeH0nXSxcclxuXHJcbiAgICByZXBvcnRlcnM6IFsnZGVmYXVsdCddLFxyXG4gICAgY292ZXJhZ2U6IHtcclxuICAgICAgcmVwb3J0c0RpcmVjdG9yeTogJy4vY292ZXJhZ2Uvc21hcnRzcGFjZScsXHJcbiAgICAgIHByb3ZpZGVyOiAndjgnLFxyXG4gICAgfSxcclxuICB9LFxyXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxxQkFBcUI7QUFDOUIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLG9CQUFvQjtBQUo3QixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixVQUFVO0FBQUEsRUFFVixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDVjtBQUFBLEVBRUUsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUVBLFNBQVMsQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDO0FBQUEsRUFFbEMsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixhQUFhO0FBQUEsSUFDYixzQkFBc0I7QUFBQSxJQUN0QixpQkFBaUI7QUFBQSxNQUNmLHlCQUF5QjtBQUFBLElBQzNCO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTTtBQUFBLElBQ0osT0FBTztBQUFBLElBQ1AsU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsU0FBUyxDQUFDLHNEQUFzRDtBQUFBLElBRWhFLFdBQVcsQ0FBQyxTQUFTO0FBQUEsSUFDckIsVUFBVTtBQUFBLE1BQ1Isa0JBQWtCO0FBQUEsTUFDbEIsVUFBVTtBQUFBLElBQ1o7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
