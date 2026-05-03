/**
 * evServer.js
 * EV Charging Management App — REST API Web Service
 *
 * Endpoints:
 *   GET    /api/bookings?email=xxx   — list bookings for a specific user
 *   GET    /api/bookings/:id         — get one booking
 *   POST   /api/bookings             — create a booking (body includes userEmail)
 *   PUT    /api/bookings/:id         — update time/duration
 *   DELETE /api/bookings/:id         — delete a booking
 *
 * Run:
 *   cd server
 *   node evRestfulAPIServer.js
 *
 * Requires:
 *   npm install express sqlite3 cors
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const cors    = require('cors');

const app = express();
const DB  = 'ev_charging.sqlite';

app.use(cors());
app.use(express.json());

// ─── Helper ───────────────────────────────────────────────────────────────────
function rowToDict(row) {
  return {
    id:          row.id,
    userEmail:   row.userEmail,
    stationName: row.stationName,
    date:        row.date,
    time:        row.time,
    duration:    row.duration,
    totalPrice:  row.totalPrice,
    status:      row.status,
  };
}

// ─── GET /api/bookings?email=xxx ──────────────────────────────────────────────
app.get('/api/bookings', (req, res) => {
  const { email } = req.query;
  console.log(`[REST] GET /api/bookings?email=${email}`);

  if (!email) {
    return res.status(400).json({ error: 'email query parameter is required.' });
  }

  const db = new sqlite3.Database(DB);

  db.all(
    'SELECT * FROM Bookings WHERE userEmail = ? ORDER BY id DESC',
    [email],
    (err, rows) => {
      if (err) {
        console.log(`[REST] GET /api/bookings ERROR: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
      console.log(`[REST] GET /api/bookings -> returned ${rows.length} record(s) for ${email}`);
      res.status(200).json(rows.map(rowToDict));
    }
  );

  db.close();
});

// ─── GET /api/bookings/:id ────────────────────────────────────────────────────
app.get('/api/bookings/:id', (req, res) => {
  console.log(`[REST] GET /api/bookings/${req.params.id}`);

  const db = new sqlite3.Database(DB);

  db.get(
    'SELECT * FROM Bookings WHERE id = ?',
    [req.params.id],
    (err, row) => {
      if (err) {
        console.log(`[REST] GET /api/bookings/${req.params.id} ERROR: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
      console.log(`[REST] GET /api/bookings/${req.params.id} -> ${row ? 'found' : 'not found'}`);
      res.status(200).json(row ? rowToDict(row) : null);
    }
  );

  db.close();
});

// ─── POST /api/bookings ───────────────────────────────────────────────────────
app.post('/api/bookings', (req, res) => {
  console.log('[REST] POST /api/bookings payload:', req.body);
  const { userEmail, stationName, date, time, duration, totalPrice, status } = req.body;

  if (!userEmail || !stationName || !date || !time || !duration || totalPrice === undefined || totalPrice === null) {
    console.log('[REST] POST /api/bookings ERROR: Missing required fields');
    return res.status(400).json({ error: 'All fields including userEmail are required.' });
  }

  const db = new sqlite3.Database(DB);

  db.run(
    `INSERT INTO Bookings (userEmail, stationName, date, time, duration, totalPrice, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userEmail, stationName, date, time, duration, totalPrice, status || 'Upcoming'],
    function (err) {
      if (err) {
        console.log(`[REST] POST /api/bookings ERROR: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
      console.log(`[REST] POST /api/bookings -> booking created, id: ${this.lastID}`);
      res.status(201).json({ id: this.lastID, affected: this.changes });
    }
  );

  db.close();
});

// ─── PUT /api/bookings/:id ────────────────────────────────────────────────────
app.put('/api/bookings/:id', (req, res) => {
  console.log(`[REST] PUT /api/bookings/${req.params.id} payload:`, req.body);
  const { id, time, duration } = req.body;

  if (!id || parseInt(id) !== parseInt(req.params.id)) {
    console.log(`[REST] PUT /api/bookings/${req.params.id} ERROR: id mismatch`);
    return res.status(400).json({ error: 'Booking id mismatch or missing.' });
  }
  if (!time || !duration) {
    console.log(`[REST] PUT /api/bookings/${req.params.id} ERROR: time or duration missing`);
    return res.status(400).json({ error: 'Time and duration are required.' });
  }

  const db = new sqlite3.Database(DB);

  db.run(
    'UPDATE Bookings SET time = ?, duration = ? WHERE id = ?',
    [time, duration, req.params.id],
    function (err) {
      if (err) {
        console.log(`[REST] PUT /api/bookings/${req.params.id} ERROR: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
      console.log(`[REST] PUT /api/bookings/${req.params.id} -> updated, affected: ${this.changes}`);
      res.status(200).json({ id: req.params.id, affected: this.changes });
    }
  );

  db.close();
});

// ─── DELETE /api/bookings/:id ─────────────────────────────────────────────────
app.delete('/api/bookings/:id', (req, res) => {
  console.log(`[REST] DELETE /api/bookings/${req.params.id} payload:`, req.body);
  const { id } = req.body;

  if (!id || parseInt(id) !== parseInt(req.params.id)) {
    console.log(`[REST] DELETE /api/bookings/${req.params.id} ERROR: id mismatch`);
    return res.status(400).json({ error: 'Booking id mismatch or missing.' });
  }

  const db = new sqlite3.Database(DB);

  db.run(
    'DELETE FROM Bookings WHERE id = ?',
    [req.params.id],
    function (err) {
      if (err) {
        console.log(`[REST] DELETE /api/bookings/${req.params.id} ERROR: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
      console.log(`[REST] DELETE /api/bookings/${req.params.id} -> deleted, affected: ${this.changes}`);
      res.status(200).json({ id: req.params.id, affected: this.changes });
    }
  );

  db.close();
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('================================================');
  console.log(' EV Charging REST API server running on port ' + PORT);
  console.log('================================================');
});