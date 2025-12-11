import { build } from 'esbuild'
import { readFileSync } from 'node:fs'

const graphqlPlugin = {
  name: 'graphql',
  setup(build) {
    build.onLoad({ filter: /\.gql$/ }, args => {
      const content = readFileSync(args.path, 'utf8')

      const minified = content
        .replace(/#.*(?=[\n\r]|$)/g, '')
        .replace(/[\s]+/g, ' ')
        .trim()

      return {
        contents: `export default ${JSON.stringify(minified)};`,
        loader: 'js',
      }
    })
  },
}

const run = () => {
  console.log('🚀 Starting build process...')

  build({
    bundle: true,
    entryPoints: ['src/index.js'],
    minify: true,
    outfile: 'dist/index.cjs',
    platform: 'node',
    plugins: [graphqlPlugin],
    target: 'node20',
  })
    .then(() => {
      console.log('🎉 Build completed successfully!')
    })
    .catch(error => {
      console.error('💥 Build failed:', error.message)
      process.exit(1)
    })
}

run()
