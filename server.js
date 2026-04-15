const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// ── Middleware ──────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ──────────────────────────────────────
app.use('/api/employees', require('./routes/employeeRoutes'));

// ── Fallback: serve index.html (SPA) ────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start Server ─────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  Server:  http://localhost:${PORT}`);
  console.log(`🌍  Env:     ${process.env.NODE_ENV || 'development'}`);
});
