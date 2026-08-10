import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import './responsive.css'
import App from './App.jsx'

// ── Global QueryClient ─────────────────────────────────────────────────────
// Exported so hooks (useDashboardSocket, etc.) can invalidate queries
// from anywhere without prop drilling.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes — data stays fresh without re-fetching on every interaction.
      // Socket.IO handles sub-5-minute real-time updates for live data.
      staleTime: 5 * 60 * 1000,
      // Keep unused queries in cache for 10 minutes (good for tab switching)
      gcTime: 10 * 60 * 1000,
      // Do NOT refetch when user focuses the window — sockets handle live data.
      // This was causing duplicate API calls every time a recruiter alt-tabs.
      refetchOnWindowFocus: false,
      // Do NOT refetch on reconnect — avoids a burst of requests when
      // the mobile/browser regains connectivity.
      refetchOnReconnect: false,
      // Do NOT refetch on component remount if data is fresh
      refetchOnMount: false,
      // Retry failed queries twice with exponential back-off
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
    mutations: {
      retry: 0,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('DoseTracker PWA ServiceWorker registered successfully: ', reg.scope);
      })
      .catch((err) => {
        console.log('DoseTracker ServiceWorker registration failed: ', err);
      });
  });
}
