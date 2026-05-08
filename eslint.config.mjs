import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: [
      'node_modules/**',
      'docs/.vitepress/dist/**',
      'docs/.vitepress/cache/**',
      'docs/public/**'
    ]
  },
  {
    files: ['docs/.vitepress/theme/**/*.{ts,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue']
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      'no-console': ['error', { allow: ['warn'] }],
      '@typescript-eslint/no-explicit-any': 'error'
    }
  },
  {
    files: ['docs/.vitepress/theme/components/**/*.vue'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='fetch']",
          message: '组件层禁止直接 fetch，请改为调用 utils 层 API。'
        }
      ]
    }
  },
  {
    files: ['docs/.vitepress/theme/utils/logger.ts'],
    rules: {
      'no-console': 'off'
    }
  }
]
