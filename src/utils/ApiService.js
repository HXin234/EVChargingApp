/**
 * ApiService.js
 * All HTTP (REST API) calls to the EV Charging web service.
 *
 * Functions exported:
 *   getAllBookings(email)
 *   getBookingById(id)
 *   createBooking(payload)      — payload must include userEmail
 *   updateBooking(id, payload)
 *   deleteBooking(id)
 */

import config from './config';

const BASE = config.apiBaseUrl;

// ─── Helper ───────────────────────────────────────────────────────────────────
async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    const msg = (data && data.error) ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ─── GET /api/bookings?email=xxx ──────────────────────────────────────────────
/**
 * Fetch all bookings for a specific user from the cloud.
 * @param {string} email  — the logged-in user's email
 * @returns {Promise<Array>}
 */
export async function getAllBookings(email) {
  const res = await fetch(`${BASE}/api/bookings?email=${encodeURIComponent(email)}`);
  return handleResponse(res);
}

// ─── GET /api/bookings/:id ────────────────────────────────────────────────────
export async function getBookingById(id) {
  const res = await fetch(`${BASE}/api/bookings/${id}`);
  return handleResponse(res);
}

// ─── POST /api/bookings ───────────────────────────────────────────────────────
/**
 * Create a new booking on the cloud server.
 * @param {{ userEmail, stationName, date, time, duration, totalPrice, status }} payload
 */
export async function createBooking(payload) {
  const res = await fetch(`${BASE}/api/bookings`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ─── PUT /api/bookings/:id ────────────────────────────────────────────────────
export async function updateBooking(id, payload) {
  const res = await fetch(`${BASE}/api/bookings/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ id, ...payload }),
  });
  return handleResponse(res);
}

// ─── DELETE /api/bookings/:id ─────────────────────────────────────────────────
export async function deleteBooking(id) {
  const res = await fetch(`${BASE}/api/bookings/${id}`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ id }),
  });
  return handleResponse(res);
}
