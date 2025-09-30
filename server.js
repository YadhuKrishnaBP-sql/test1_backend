// server.js

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- Database Configuration ---
// This section is now configured to securely connect to your online Aiven database
// using Environment Variables that we will set in the hosting platform (Render).
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: true
  }
});

// --- Connect to Database ---
db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to the remote Aiven MySQL database.');
});


// --- API Endpoints for Events (Full CRUD) ---

// READ: Get all events
app.get('/events', (req, res) => {
  // We order by date to show the newest events first
  const query = 'SELECT * FROM events ORDER BY event_date DESC;';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// CREATE: Add a new event
app.post('/events', (req, res) => {
  const { event_name, sport, event_date, winner_player_name } = req.body;

  if (!event_name || !sport || !event_date) {
    return res.status(400).json({ error: 'Event name, sport, and date are required.' });
  }

  // If winner is not provided, it will be inserted as NULL
  const query = 'INSERT INTO events (event_name, sport, event_date, winner_player_name) VALUES (?, ?, ?, ?);';
  db.query(query, [event_name, sport, event_date, winner_player_name || null], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      message: 'Event created successfully!',
      eventId: result.insertId
    });
  });
});

// UPDATE: Modify an existing event's details
app.put('/events/:id', (req, res) => {
    const { id } = req.params;
    const { event_name, sport, event_date, winner_player_name } = req.body;

    if (!event_name || !sport || !event_date) {
        return res.status(400).json({ error: 'Event name, sport, and date are required.' });
    }

    const query = 'UPDATE events SET event_name = ?, sport = ?, event_date = ?, winner_player_name = ? WHERE event_id = ?;';
    db.query(query, [event_name, sport, event_date, winner_player_name || null, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found.' });
        }
        res.json({ message: 'Event updated successfully!' });
    });
});


// UPDATE: Set a winner for an event
app.put('/events/:id/winner', (req, res) => {
  const { id } = req.params;
  const { winner_player_name } = req.body;

  if (!winner_player_name) {
    return res.status(400).json({ error: 'Winner name is required.' });
  }

  const query = 'UPDATE events SET winner_player_name = ? WHERE event_id = ?;';
  db.query(query, [winner_player_name, id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    res.json({ message: 'Winner has been set successfully!' });
  });
});

// DELETE: Remove an event
app.delete('/events/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM events WHERE event_id = ?;';
  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    res.json({ message: 'Event deleted successfully.' });
  });
});


// --- Start the Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});