import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@corner/shared': path.resolve(__dirname, '../shared/types.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // SSE endpoint — must not buffer; disable encoding so the stream passes through
      '/api/orchestrate': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Prevent Vite from buffering the SSE stream
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            // Remove accept-encoding so the upstream sends plain text (no gzip buffering)
            req.headers['accept-encoding'] = 'identity';
          });
        },
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    }
  }
})
