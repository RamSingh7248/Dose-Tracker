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
        // Granular manual chunks — prevents framer-motion / recharts from
        // landing in the main bundle that users see on first load.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Core React runtime — always cached after first load
          if (id.includes('/react-dom/') || id.includes('/react/'))
            return 'react-vendor';

          // Routing — small, loaded immediately
          if (id.includes('react-router'))
            return 'router-vendor';

          // Heavy chart library — only Dashboard & Adherence pages use it
          if (id.includes('recharts') || id.includes('d3-'))
            return 'charts-vendor';

          // Heavy animation library — loaded lazily with pages that use it
          if (id.includes('framer-motion'))
            return 'motion-vendor';

          // Icon library — tree-shaken by Vite, but isolate for caching
          if (id.includes('lucide-react'))
            return 'icons-vendor';

          // Real-time socket — only Admin Dashboard connects
          if (id.includes('socket.io-client') || id.includes('engine.io'))
            return 'socket-vendor';

          // TanStack Query
          if (id.includes('@tanstack'))
            return 'query-vendor';

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
