/**
 * socketEmitter.js
 * ─────────────────────────────────────────────────────────────
 * Singleton that holds the Socket.IO server instance.
 * All controllers call emitDashboardEvent() without knowing about
 * socket internals — clean separation of concerns.
 *
 * Usage (in any controller):
 *   const { emitDashboardEvent } = require('../services/socketEmitter');
 *   emitDashboardEvent('dose.logged', { userId: req.user.id });
 */

let _io = null;

/**
 * Initialise with the Socket.IO server instance.
 * Called once from server.js after Socket.IO is created.
 * @param {import('socket.io').Server} io
 */
function init(io) {
  _io = io;
  console.log('📡 SocketEmitter initialised — admin-dashboard room ready');
}

/**
 * Emit a dashboard event to all connected admins.
 * Safe to call even before Socket.IO is ready (no-op if not initialised).
 * @param {string} event   — e.g. 'dose.logged', 'appointment.created'
 * @param {object} payload — arbitrary metadata about the event
 */
function emitDashboardEvent(event, payload = {}) {
  if (!_io) return; // graceful no-op during startup / tests
  _io.to('admin-dashboard').emit('dashboard:update', {
    event,
    payload,
    ts: new Date().toISOString(),
  });
}

/**
 * Emit a targeted event to the admin-dashboard room.
 * Used when you want the client to receive a specific named event
 * in addition to the generic dashboard:update broadcast.
 * @param {string} event
 * @param {object} payload
 */
function emitNamedEvent(event, payload = {}) {
  if (!_io) return;
  _io.to('admin-dashboard').emit(event, {
    ...payload,
    ts: new Date().toISOString(),
  });
}

/** Expose the raw io instance for advanced use cases */
function getIO() {
  return _io;
}

module.exports = { init, emitDashboardEvent, emitNamedEvent, getIO };
