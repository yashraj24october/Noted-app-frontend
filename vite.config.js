import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/tinymce',
          dest: 'assets',
        },
      ],
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})