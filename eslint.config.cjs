const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const globals = require('globals');

module.exports = [
  { ignores: ['dist/**', 'build/**', 'coverage/**', 'node_modules/**'] },

  // Base JS recommendations
  js.configs.recommended,

  // TypeScript (flat) recommendations
  ...tseslint.configs.recommended,

  // Project rules
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        // If you later enable type-aware lint rules:
        // projectService: { allowDefaultProject: true },
        // // or: project: ['./tsconfig.json'],
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // sensible defaults without dragging in each plugin's preset
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
    },
  },
];