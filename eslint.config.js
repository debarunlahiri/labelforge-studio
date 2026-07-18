import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Electron IPC, sql.js rows, Konva nodes, and serialized template payloads
      // are runtime-validated dynamic boundaries. Requiring a fabricated static
      // shape at every boundary makes those casts less safe, not more useful.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      // These compiler-oriented rules reject established event-driven patterns
      // used by Konva and Electron. The standard hooks rules remain enabled.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'off',
      // Page-loading and autosave effects are intentionally keyed to route/state
      // transitions; their store actions are stable Zustand references.
      'react-hooks/exhaustive-deps': 'off',
      'no-control-regex': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['src/pages/template-designer/NewTemplateWizard.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
