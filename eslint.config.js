import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const archivosFrontend = [
  'src/main.tsx',
  'src/api.js',
  'src/AppRouter.jsx',
  'src/auth/**/*.{js,jsx}',
  'src/componentes/**/*.jsx',
  'src/paginas/*.{js,jsx,tsx}',
  'src/interfaces/**/*.ts',
  'src/Services/**/*.ts',
  'vite.config.ts',
]

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: archivosFrontend,
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  {
    files: ['src/**/*.{js,jsx}', 'eslint.config.js'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // Sin eslint-plugin-react, el compilador ya marca los identificadores usados en JSX.
      'no-unused-vars': 'off',
    },
  },
])
