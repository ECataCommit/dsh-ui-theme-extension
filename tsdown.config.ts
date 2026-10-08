import type { UserConfig } from 'tsdown'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const id = 'dsh-ui-theme-extension'
const inlineCssPrefix = '\0ui-theme-extension-css:'

export default [
  {
    entry: { index: 'lib/types/index.js' },
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'node22',
    dts: false,
    clean: false,
    outputOptions: { entryFileNames: 'index.js' },
  },
  {
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: ['cjs'],
    platform: 'browser',
    target: 'es2024',
    dts: false,
    clean: false,
    plugins: [{
      name: 'ui-theme-extension-inline-css',
      resolveId(source, importer) {
        if (!source.endsWith('.css?inline') || importer === undefined) return null
        return `${inlineCssPrefix}${resolve(dirname(importer), source.slice(0, -'?inline'.length))}.mjs`
      },
      load(fileId) {
        if (!fileId.startsWith(inlineCssPrefix)) return null
        const file = fileId.slice(inlineCssPrefix.length, -'.mjs'.length)
        this.addWatchFile(file)
        return `export default ${JSON.stringify(readFileSync(file, 'utf8'))}`
      },
    }],
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
] satisfies UserConfig[]
