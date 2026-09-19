import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'out/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Coding rules from the project spec.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // "Keine leeren Catch Blocks" — an empty block must carry a comment.
      'no-empty': ['error', { allowEmptyCatch: false }],
      // "Keine Secrets loggen" / no PII in logs: force everything through
      // the structured logger in src/lib/logging.
      'no-console': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.type='MemberExpression'][object.object.name='process'][object.property.name='env']",
          message:
            'Read environment variables through src/lib/env instead of process.env directly.',
        },
      ],
    },
  },
  {
    // The env modules, the logger and build/test config are the only places
    // allowed to read process.env directly.
    files: [
      'src/lib/env/**/*.ts',
      'src/lib/logging/**/*.ts',
      '*.config.ts',
      '*.config.mjs',
      'vitest.setup.ts',
      'e2e/**/*.ts',
      'supabase/tests/**/*.ts',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // Playwright assertions occasionally need the browser console.
    files: ['e2e/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];

export default config;
