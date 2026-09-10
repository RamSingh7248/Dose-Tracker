import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Vite 8 uses Oxc transformer (esbuild is deprecated in this version)
    minify: 'oxc',
    // Target modern browsers — smaller output, no legacy polyfills
    target: 'esnext',
    // Split CSS into per-chunk files for faster initial load
    cssCodeSplit: true,
    // Warn on chunks > 600KB (tighter than the default 1000)
    chunkSizeWarningLimit: 600,
    // Enable source maps only in development (don't leak source in prod)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Granular manual chunks — strictly match package directories
        // to prevent React runtime from being fragmented across chunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Core React runtime (must strictly match /node_modules/react/ or /node_modules/react-dom/)
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }

          // Routing
          if (id.includes('/node_modules/react-router')) {
            return 'router-vendor';
          }

          // TanStack Query
          if (id.includes('/node_modules/@tanstack/')) {
            return 'query-vendor';
          }

          // Heavy chart library — only Dashboard & Adherence pages use it
          if (id.includes('/node_modules/recharts/') || id.includes('/node_modules/d3-')) {
            return 'charts-vendor';
          }

          // Heavy animation library
          if (id.includes('/node_modules/framer-motion/')) {
            return 'motion-vendor';
          }

          // Icon library
          if (id.includes('/node_modules/lucide-react/')) {
            return 'icons-vendor';
          }

          // Real-time socket
          if (id.includes('/node_modules/socket.io-client/') || id.includes('/node_modules/engine.io/')) {
            return 'socket-vendor';
          }

          // Everything else from node_modules
          return 'vendor';
        },
        // Use content hash for long-lived browser caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
