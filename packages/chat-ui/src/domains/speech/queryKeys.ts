export const speechKeys = {
  all: ['speech'] as const,

  config: () => [...speechKeys.all, 'config'] as const,
};
