import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  base: './',
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    minify: 'esbuild',
    outDir: 'assets/shader',
    emptyOutDir: true,
    lib: {
      entry: { shader: 'src/shader-entry.tsx' },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
      cssFileName: 'shader',
    },
  },
})
