import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import security from 'eslint-plugin-security'
import globals from 'globals'

export default [
  { ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'eslint.config.js'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  security.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node }
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.vitest } }
  }
]
