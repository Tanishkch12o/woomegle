import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.woomegle.com',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://api.woomegle.com',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  build: {
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          socket: ['socket.io-client']
        }
      }
    }
  },
  esbuild: {
    drop: ['debugger'],
    pure: ['console.log', 'console.debug'],
  }
})
