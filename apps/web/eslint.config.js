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
    rules: {
      // shadcn/ui components intentionally export both components and constants
      // (e.g. buttonVariants alongside Button). allowConstantExport suppresses
      // the false-positive react-refresh warning for those files.
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // The React Compiler rule flags setState calls inside effects. Our data-fetching
      // pattern (setIsLoading → fetch → setData in useEffect) is intentional and safe;
      // downgrade to warn rather than error so CI isn't blocked.
      "react-hooks/set-state-in-effect": "warn",
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
