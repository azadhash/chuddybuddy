import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';

// Flat ESLint config covering the server (Node) and web (browser) workspaces.
export default [
  { ignores: ['**/dist/**', '**/node_modules/**', '**/.pgdata/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'react-hooks': reactHooks, react },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Mark components referenced in JSX as "used" (the new JSX transform needs no React import).
      'react/jsx-uses-vars': 'error',
    },
  },
  {
    // Vitest exposes describe/it/expect/vi as globals (config: globals: true).
    files: ['**/*.test.{js,jsx}', '**/test/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
  },
];
