'use strict';

require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const path         = require('path');

const connectDB         = require('./config/db');
const errorHandler      = require('./middleware/errorHandler');

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Rate Limiting ─────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);

// ── Body Parser ───────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ── Static Files ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/news',      require('./routes/newsRoutes'));

// ── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ── SPA Fallback ──────────────────────────────────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// ── Startup Helpers ───────────────────────────────────────────
async function createDefaultAdmin() {
  try {
    const User = require('./models/User');
    const count = await User.countDocuments();
    if (count === 0) {
      await User.create({
        name:     'Admin',
        email:    'admin@nexaforce.com',
        password: 'Admin@123',
        role:     'admin',
      });
      console.log('Default admin created: admin@nexaforce.com / Admin@123');
    }
  } catch (err) {
    console.error('createDefaultAdmin error:', err.message);
  }
}

async function seedEmployees() {
  try {
    const Employee = require('./models/Employee');
    const count = await Employee.countDocuments();
    if (count === 0) {
      const employees = [
        { name: 'Alice Chen',       email: 'alice.chen@corp.io',    phone: '(306) 555-0101', department: 'Engineering',  position: 'Senior Developer',       salary: 110000, status: 'Active',   joinDate: new Date('2021-03-15') },
        { name: 'Marcus Williams',  email: 'marcus.w@corp.io',      phone: '(306) 555-0102', department: 'Engineering',  position: 'DevOps Engineer',         salary: 98000,  status: 'Active',   joinDate: new Date('2022-07-01') },
        { name: 'Priya Sharma',     email: 'priya.s@corp.io',       phone: '(306) 555-0103', department: 'Design',       position: 'UI/UX Designer',          salary: 87000,  status: 'Active',   joinDate: new Date('2020-11-20') },
        { name: 'Jordan Lee',       email: 'jordan.lee@corp.io',    phone: '(306) 555-0104', department: 'Marketing',    position: 'Marketing Manager',       salary: 92000,  status: 'Active',   joinDate: new Date('2019-05-10') },
        { name: 'Sofia Torres',     email: 'sofia.t@corp.io',       phone: '(306) 555-0105', department: 'Sales',        position: 'Sales Director',          salary: 105000, status: 'Active',   joinDate: new Date('2020-02-14') },
        { name: 'Ryan Patel',       email: 'ryan.p@corp.io',        phone: '(306) 555-0106', department: 'Finance',      position: 'Financial Analyst',       salary: 83000,  status: 'On Leave', joinDate: new Date('2021-09-05') },
        { name: 'Emma Johnson',     email: 'emma.j@corp.io',        phone: '(306) 555-0107', department: 'HR',           position: 'HR Specialist',           salary: 76000,  status: 'Active',   joinDate: new Date('2022-01-17') },
        { name: 'Liam Nguyen',      email: 'liam.n@corp.io',        phone: '(306) 555-0108', department: 'Engineering',  position: 'Full Stack Engineer',     salary: 102000, status: 'Active',   joinDate: new Date('2023-03-01') },
        { name: 'Amara Osei',       email: 'amara.o@corp.io',       phone: '(306) 555-0109', department: 'Operations',   position: 'Operations Manager',      salary: 94000,  status: 'Active',   joinDate: new Date('2020-08-22') },
        { name: 'Carlos Rivera',    email: 'carlos.r@corp.io',      phone: '(306) 555-0110', department: 'Sales',        position: 'Account Executive',       salary: 79000,  status: 'Inactive', joinDate: new Date('2019-12-01') },
        { name: 'Zoe Mitchell',     email: 'zoe.m@corp.io',         phone: '(306) 555-0111', department: 'Design',       position: 'Graphic Designer',        salary: 72000,  status: 'Active',   joinDate: new Date('2022-06-15') },
        { name: 'Noah Kim',         email: 'noah.k@corp.io',        phone: '(306) 555-0112', department: 'Finance',      position: 'Senior Accountant',       salary: 88000,  status: 'Active',   joinDate: new Date('2021-04-28') },
      ];
      await Employee.insertMany(employees);
      console.log(`Seeded ${employees.length} demo employees`);
    }
  } catch (err) {
    console.error('seedEmployees error:', err.message);
  }
}

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await createDefaultAdmin();
  await seedEmployees();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err.message);
  process.exit(1);
});

module.exports = app;
