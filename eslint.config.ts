import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const archivosFrontend = [
  'src/main.tsx',
  'src/api.ts',
  'src/tipos.ts',
  'src/AppRouter.tsx',
  'src/auth/**/*.{ts,tsx}',
  'src/componentes/**/*.tsx',
  'src/paginas/**/*.tsx',
  'src/interfaces/**/*.ts',
  'src/Services/**/*.ts',
  'vite.config.ts',
  'eslint.config.ts',
  'tailwind.config.ts',
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
])
