import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['public/shogi-game/js/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        AI: 'readonly',
        GOTE: 'readonly',
        Network: 'readonly',
        PIECES: 'readonly',
        SENTE: 'readonly',
        Shogi: 'readonly',
        UI: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      'no-redeclare': 'off',
    },
  },
])
