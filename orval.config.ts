import { defineConfig } from 'orval';

const strictZodOptions = {
  strict: {
    param: true,
    query: true,
    header: true,
    body: true,
    response: true,
  },
  dateTimeOptions: {
    offset: true,
    local: true,
  },
};

export default defineConfig({
  chat: {
    input: './openapi/chat-api.json',
    output: {
      target: './src/platform/api/generated/chat/api.ts',
      schemas: './src/platform/api/generated/chat/models',
      client: 'axios',
      mode: 'single',
      prettier: true,
      override: {
        mutator: {
          path: './src/platform/api/orvalMutator.ts',
          name: 'apiMutator',
        },
        zod: strictZodOptions,
      },
    },
  },
  chatZod: {
    input: './openapi/chat-api.json',
    output: {
      client: 'zod',
      mode: 'single',
      target: './src/platform/api/generated/chat/zod.ts',
      override: {
        zod: strictZodOptions,
      },
    },
  },
});
