import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { copyFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          if (options && options.startup) {
            options.startup()
          }
        },
        vite: {
          build: {
            rollupOptions: {
              external: ['sql.js'],
            },
          },
        },
      },
      {
        vite: {
          build: {
            rollupOptions: {
              input: 'electron/preload.ts',
              output: {
                format: 'cjs',
                codeSplitting: false,
                entryFileNames: 'preload.js',
                chunkFileNames: '[name].js',
              },
            },
          },
        },
        onstart(args) {
          args.reload()
        },
      },
    ]),
    renderer(),
    {
      name: 'copy-sql-wasm',
      closeBundle() {
        const src = path.join(projectRoot, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
        const destDir = path.join(projectRoot, 'dist-electron')
        if (existsSync(src) && existsSync(destDir)) {
          copyFileSync(src, path.join(destDir, 'sql-wasm.wasm'))
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
    },
  },
})
