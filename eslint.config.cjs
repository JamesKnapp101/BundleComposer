// eslint.config.cjs
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const globals = require('globals');

module.exports = [
  { ignores: ['dist/**', 'coverage/**', 'build/**'] },

  // Base JS rules
  js.configs.recommended,

  // TypeScript recommended (flat config)
  ...tseslint.configs.recommended,

  // Your project rules
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parser: tseslint.parser,
      parserOptions: {
        // If you want type-aware rules, uncomment the next line and ensure tsconfig exists
        // project: ['./tsconfig.json'],
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      // add any project-specific overrides here
    },
  },
];
