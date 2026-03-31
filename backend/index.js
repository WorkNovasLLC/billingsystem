require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'worknovas_billing_secret_key_2024';

// Middleware
app.use(cors());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Database Initialization (Neon/PostgreSQL)
// This will read from DATABASE_URL in your .env file
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Neon
});

// Tables Setup for PostgreSQL
const initializeDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                login_id TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                hourly_pay DECIMAL(10, 2) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS invoices (
                invoice_number TEXT PRIMARY KEY,
                invoice_blob BYTEA NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

    // Seed default admins
    const result = await pool.query('SELECT COUNT(*) FROM admins');
    if (parseInt(result.rows[0].count) === 0) {
      const hashedAdmin = bcrypt.hashSync('admin123', 10);
      const hashedManager = bcrypt.hashSync('password', 10);

      await pool.query('INSERT INTO admins (login_id, password) VALUES ($1, $2)', ['admin', hashedAdmin]);
      await pool.query('INSERT INTO admins (login_id, password) VALUES ($1, $2)', ['administrator', hashedManager]);

      console.log('Default PG admins created.');
    }
    console.log('PostgreSQL Database connected and initialized.');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.log('Attempting to use SQLite fallback or check your DATABASE_URL in .env');
  }
};

initializeDB();

// Root check
app.get('/', (req, res) => res.send('Billing API is running'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- Auth Routes ---

// Admin Login
app.post('/api/login', async (req, res) => {
  const { login_id, password } = req.body;
  if (!login_id || !password) {
    return res.status(400).json({ error: 'Login ID and Password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM admins WHERE login_id = $1', [login_id]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: admin.id, login_id: admin.login_id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// --- Protected Routes ---

// Add Employee
app.post('/api/employees', authenticate, async (req, res) => {
  const { name, hourly_pay } = req.body;
  if (!name || !hourly_pay) {
    return res.status(400).json({ error: 'Name and Hourly Pay are required' });
  }

  try {
    const result = await pool.query('INSERT INTO employees (name, hourly_pay) VALUES ($1, $2) RETURNING id', [name, hourly_pay]);
    res.status(201).json({ id: result.rows[0].id, name, hourly_pay });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List Employees
app.get('/api/employees', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Invoice (Blob/Bytea)
app.post('/api/invoices', authenticate, async (req, res) => {
  const { invoice_number, pdf_blob } = req.body;
  if (!invoice_number || !pdf_blob) {
    return res.status(400).json({ error: 'Invoice number and Blob are required' });
  }

  try {
    const pdfBuffer = Buffer.from(pdf_blob, 'base64');
    await pool.query('INSERT INTO invoices (invoice_number, invoice_blob) VALUES ($1, $2)', [invoice_number, pdfBuffer]);
    res.status(201).json({ message: 'Invoice saved successfully', invoice_number });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List Invoices
app.get('/api/invoices', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT invoice_number, created_at FROM invoices ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download Invoice (Blob)
app.get('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT invoice_blob FROM invoices WHERE invoice_number = $1', [id]);
    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.contentType('application/pdf');
    res.send(row.invoice_blob);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404 Fallback Logger
app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: `Path ${req.url} not found`,
    method: req.method
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
