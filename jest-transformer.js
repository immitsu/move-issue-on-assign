export default {
  process: sourceText => ({
    code: `module.exports = ${JSON.stringify(sourceText)};`,
  }),
}
