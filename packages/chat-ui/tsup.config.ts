import { defineConfig } from 'tsup';

// Externals mirror packages/chat-ui/package.json `peerDependencies`. Keep in
// sync — anything left non-external gets bundled into the published artifact
// and risks shipping a duplicate copy alongside the consumer's own.
const externals = [
  '@emotion/react',
  '@emotion/styled',
  '@hookform/resolvers',
  '@jsonforms/core',
  '@jsonforms/react',
  '@lobehub/icons-static-svg',
  '@jsonforms/vanilla-renderers',
  '@milkdown/core',
  '@milkdown/kit',
  '@milkdown/plugin-clipboard',
  '@milkdown/plugin-listener',
  '@milkdown/plugin-slash',
  '@milkdown/preset-commonmark',
  '@milkdown/prose',
  '@milkdown/react',
  '@mui/material',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-slot',
  '@smartspace/api-client',
  '@tanstack/react-query',
  'ace-builds',
  'ace-builds/*',
  'class-variance-authority',
  'clsx',
  'dayjs',
  'lodash.debounce',
  'lucide-react',
  'react',
  'react-ace',
  'react-dom',
  'react-hook-form',
  'react-markdown',
  'sonner',
  'tailwind-merge',
  'zod',
];

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'test/index': 'src/test/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: externals,
});
