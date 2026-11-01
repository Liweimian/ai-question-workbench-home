import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

function craCompatibleSvg(): Plugin {
  const inner = svgr({
    include: '**/*.svg',
    svgrOptions: { exportType: 'named', namedExport: 'ReactComponent' },
  })
  const innerLoad = inner.load as (this: unknown, id: string) => Promise<{ code: string } | undefined>
  return {
    ...inner,
    name: 'cra-compatible-svg',
    async load(id) {
      const result = await innerLoad.call(this, id)
      if (!result) return
      const file = id.replace(/[?#].*$/s, '')
      return {
        code: `import __svgUrl from ${JSON.stringify(file + '?url')};\n${result.code}\nexport default __svgUrl;\n`,
        map: null,
      }
    },
  }
}

export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE_PATH || './',
  plugins: [react(), craCompatibleSvg()],
  resolve: { alias: { buffer: 'buffer/' } },
  define: {
    global: 'globalThis',
    'process.env.REACT_APP_ENV': JSON.stringify(mode),
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
        'process.env.REACT_APP_ENV': JSON.stringify(mode),
      },
    },
  },
  css: {
    preprocessorOptions: { less: { javascriptEnabled: true } },
  },
  build: { sourcemap: false },
}))
