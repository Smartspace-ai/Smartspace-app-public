// .eslintrc.js
module.exports = {
  root: true,

  plugins: ['@nx', 'import', 'boundaries', 'react-hooks', 'jsx-a11y'],

  extends: [
    // Nx defaults for React/TS
    'plugin:@nx/react',

    // Import plugin presets
    'plugin:import/recommended',
    'plugin:import/typescript',

    // Hooks & a11y presets
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],

  settings: {
    // Path alias resolution (@/...)
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
      node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    },

    // Architectural layers for boundaries
    'boundaries/elements': [
      { type: 'platform', pattern: 'src/platform/**' },
      { type: 'domains',  pattern: 'src/domains/**'  },
      { type: 'ui',       pattern: 'src/ui/**'       },
      { type: 'pages',    pattern: 'src/pages/**'    },
      { type: 'shared',   pattern: 'src/shared/**'   },
      { type: 'mocks',    pattern: 'src/mocks/**'    },
      { type: 'tests',    pattern: 'src/tests/**'    },
    ],
  },

  rules: {
    /**
     * Architecture boundaries
     */
    'boundaries/element-types': [2, {
      default: 'allow',
      rules: [
        { from: 'domains',   allow: ['shared', 'platform'] },
        { from: 'ui',        allow: ['domains', 'shared', 'platform'] },
        { from: 'pages',     allow: ['ui', 'domains', 'shared', 'platform'] },
        { from: 'shared',    disallow: ['domains', 'ui', 'pages'] },
        { from: 'platform',  disallow: ['ui', 'domains', 'pages'] },
      ],
    }],

    /**
     * Import hygiene
     */
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
      pathGroups: [
        { pattern: '@/platform/**', group: 'internal', position: 'before' },
        { pattern: '@/domains/**',  group: 'internal', position: 'before' },
        { pattern: '@/ui/**',       group: 'internal', position: 'before' },
        { pattern: '@/pages/**',    group: 'internal', position: 'before' },
        { pattern: '@/shared/**',   group: 'internal', position: 'before' },
      ],
      pathGroupsExcludedImportTypes: ['builtin'],
      alphabetize: { order: 'asc', caseInsensitive: true },
      'newlines-between': 'always',
    }],

    /**
     * Promote these to errors (highest-signal correctness)
     */
    'react-hooks/exhaustive-deps': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    'no-loop-func': 'error',
    'jsx-a11y/alt-text': 'error',

    /**
     * Keep useful-but-noisy as warnings
     */
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'import/no-named-as-default': 'warn',
    'import/no-named-as-default-member': 'warn',
    'jsx-a11y/heading-has-content': 'warn',
  },

  overrides: [
    // Nx TS/JS defaults on source files
    {
      files: ['src/**/*.{ts,tsx}'],
      extends: ['plugin:@nx/typescript'],
      rules: {},
    },
    {
      files: ['src/**/*.{js,jsx}'],
      extends: ['plugin:@nx/javascript'],
      rules: {},
    },

    // Loosen rules in known noisy/legacy areas to keep velocity
    {
      files: ['src/ui/chat-variables/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
      },
    },
    // Tests
    {
      files: ['src/**/*.{spec,test}.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        'no-loop-func': 'warn',
      },
    },
    // Mocks
    {
      files: ['src/mocks/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
      },
    },
  ],
};
