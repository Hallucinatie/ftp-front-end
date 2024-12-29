import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'src/background.js'
      }
    })
  ],
  base: process.env.ELECTRON ? './' : '/',
  build: {
    rollupOptions: {
      external: ['electron']
    }
  },
  optimizeDeps: {
    exclude: ['electron']
  },
  resolve: {
    alias: {
      path: require.resolve('path-browserify'),
      fs: require.resolve('browserify-fs'),
      os: require.resolve('os-browserify/browser'),
      crypto: require.resolve('crypto-browserify')
    }
  }
})
