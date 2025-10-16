// .eslintrc.js
module.exports = {
  root: true,

  env: { browser: true, es2023: true, node: true },

  // Nx + React + TS + Import + Boundaries + Hooks + A11y
  plugins: ['@nx', 'import', 'boundaries', 'react-hooks', 'jsx-a11y'],

  extends: [
    'plugin:@nx/react',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],

  settings: {
    // Path alias resolution (@/...)
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
      node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    },
    react: { version: 'detect' },

    // Architectural layers for boundaries
    'boundaries/elements': [
      { type: 'platform', pattern: 'src/platform/**' },
      { type: 'app',      pattern: 'src/app/**' },
      { type: 'domains',  pattern: 'src/domains/**' },
      { type: 'ui',       pattern: 'src/ui/**' },
      { type: 'pages',    pattern: 'src/pages/**' },
      { type: 'shared',   pattern: 'src/shared/**' },
      { type: 'mocks',    pattern: 'src/mocks/**' },
      { type: 'tests',    pattern: 'src/tests/**' },
    ],
  },

  rules: {
    /**
     * Architecture boundaries
     */
    'boundaries/element-types': [2, {
      default: 'allow',
      rules: [
        // platform is foundational; it must not depend on higher layers
        { from: 'platform',  disallow: ['app', 'domains', 'ui', 'pages'] },

        // app composes everything
        { from: 'app',       allow: ['platform', 'shared', 'domains', 'ui', 'pages'] },

        // domains use platform + shared only
        { from: 'domains',   allow: ['platform', 'shared'] },

        // ui can use domains + platform + shared (no pages to avoid cycles)
        { from: 'ui',        allow: ['platform', 'shared', 'domains'] },

        // pages can use ui + domains + platform + shared
        { from: 'pages',     allow: ['ui', 'domains', 'platform', 'shared'] },

        // shared must stay pure
        { from: 'shared',    disallow: ['app', 'domains', 'ui', 'pages'] },
      ],
    }],

    /**
     * Import hygiene & ordering
     */
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
      pathGroups: [
        { pattern: '@/platform/**', group: 'internal', position: 'before' },
        { pattern: '@/app/**',      group: 'internal', position: 'before' },
        { pattern: '@/domains/**',  group: 'internal', position: 'before' },
        { pattern: '@/ui/**',       group: 'internal', position: 'before' },
        { pattern: '@/pages/**',    group: 'internal', position: 'before' },
        { pattern: '@/shared/**',   group: 'internal', position: 'before' },
      ],
      pathGroupsExcludedImportTypes: ['builtin'],
      alphabetize: { order: 'asc', caseInsensitive: true },
      'newlines-between': 'always',
    }],

    // 🚫 Outside platform: do not import axios or raw transport
    'no-restricted-imports': ['error', {
      paths: [
        { name: 'axios', message: 'Use @/platform/api (or request/http helpers) instead of axios directly.' },
        { name: '@/platform/transport', message: 'Do not import raw transport outside platform.' },
      ],
      patterns: [
        {
          group: ['@/domains/**/dto', '@/domains/**/mapper', '@/domains/**/service'],
          message: 'Import domain models/queries/mutations, not DTO/mapper/service.',
        },
      ],
    }],

    /**
     * High-signal correctness
     */
    'react-hooks/exhaustive-deps': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    'no-loop-func': 'error',
    'jsx-a11y/alt-text': 'error',

    /**
     * App-specific allowances
     */
    'jsx-a11y/no-autofocus': 'off',

    /**
     * Useful-but-noisy as warnings
     */
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'import/no-named-as-default': 'warn',
    'import/no-named-as-default-member': 'warn',
    'jsx-a11y/heading-has-content': 'warn',
  },

  overrides: [
    // TypeScript source
    {
      files: ['src/**/*.{ts,tsx}'],
      extends: ['plugin:@nx/typescript'],
      rules: {},
    },

    // JavaScript source
    {
      files: ['src/**/*.{js,jsx}'],
      extends: ['plugin:@nx/javascript'],
      rules: {},
    },

    // Allow axios/transport inside platform only
    {
      files: ['src/platform/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },

    // Loosen rules in known noisy/legacy areas (example)
    {
      files: ['src/ui/chat-variables/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
      },
    },

    // Tests
    {
      files: ['src/**/*.{spec,test}.{ts,tsx,js,jsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        'no-loop-func': 'warn',
      },
    },

    // Mocks
    {
      files: ['src/mocks/**/*.{ts,tsx,js,jsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
      },
    },
  ],

  ignorePatterns: [
    'dist', 'build', 'coverage', '.turbo', '.next',
    // generated router tree or similar
    'src/routeTree.gen.ts',
  ],
};
