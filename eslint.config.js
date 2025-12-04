import perfectionist from 'eslint-plugin-perfectionist'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    ignores: ['dist/*'],
  },

  perfectionist.configs['recommended-natural'],
])
