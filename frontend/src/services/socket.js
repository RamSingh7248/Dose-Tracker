/**
 * socket.js
 * ─────────────────────────────────────────────────────────────
 * Socket.IO client singleton.
 *
 * Usage:
 *   import { getSocket, connectSocket, disconnectSocket } from './socket';
 *
 * The socket authenticates via JWT so the server can place admins
 * into the 'admin-dashboard' room automatically.
 */

import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

/** @type {import('socket.io-client').Socket | null} */
let socket = null;

/**
 * Connect (or reuse) the socket.
 * Passes the JWT from localStorage so the server can authenticate.
 * NOTE: The app stores the token under 'dt_token' (not 'token').
 * @returns {import('socket.io-client').Socket}
 */
export function connectSocket() {
  if (socket?.connected) return socket;

  // FIX: was incorrectly using 'token' — the app stores under 'dt_token'
  const token = localStorage.getItem('dt_token') ?? '';

  socket = io(BACKEND_URL, {
    auth:       { token },
    transports: ['websocket', 'polling'],
    reconnection:        true,
    reconnectionAttempts: 10,
    reconnectionDelay:   1000,
    reconnectionDelayMax: 5000,
    // Don't connect immediately — wait until explicitly called
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('🔌 Dashboard socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Dashboard socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('🔌 Socket connect error:', err.message);
  });

  socket.on('dashboard:connected', (data) => {
    console.log('✅ Joined admin-dashboard room:', data.message);
  });

  return socket;
}

/**
 * Return the current socket instance (may be null if not yet connected).
 * @returns {import('socket.io-client').Socket | null}
 */
export function getSocket() {
  return socket;
}

/**
 * Gracefully disconnect and clear the singleton.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
