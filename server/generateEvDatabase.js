/**
 * generateEvDatabase.js
 * Run this ONCE to recreate the ev_charging.sqlite database.
 *
 *   node generateEvDatabase.js
 *
 * Requires:
 *   npm install sqlite3
 *
 * NOTE: No seed data. AUTOINCREMENT resets from 1 for a fresh database.
 */

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('ev_charging.sqlite');

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS Bookings');

  // Also reset the AUTOINCREMENT counter so IDs start from 1
  db.run('DELETE FROM sqlite_sequence WHERE name="Bookings"', [], () => {});

  db.run(`
    CREATE TABLE Bookings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      userEmail   TEXT    NOT NULL,
      stationName TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      time        TEXT    NOT NULL,
      duration    INTEGER NOT NULL,
      totalPrice  TEXT    NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'Upcoming'
    )
  `);

  console.log('Database ev_charging.sqlite created fresh. IDs will start from 1.');
});

db.close((err) => {
  if (err) console.error(err.message);
  else console.log('Database connection closed.');
});
