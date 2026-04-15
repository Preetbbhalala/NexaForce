require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

const employees = [
  { name: 'Alice Chen',      email: 'alice.chen@corp.io',    phone: '(306) 555-0101', department: 'Engineering',  position: 'Senior Developer',      salary: 110000, status: 'Active',   joinDate: '2021-03-15' },
  { name: 'Marcus Williams', email: 'marcus.w@corp.io',      phone: '(306) 555-0102', department: 'Engineering',  position: 'DevOps Engineer',        salary: 98000,  status: 'Active',   joinDate: '2022-07-01' },
  { name: 'Priya Sharma',    email: 'priya.s@corp.io',       phone: '(306) 555-0103', department: 'Design',       position: 'UI/UX Designer',         salary: 87000,  status: 'Active',   joinDate: '2020-11-20' },
  { name: 'Jordan Lee',      email: 'jordan.lee@corp.io',    phone: '(306) 555-0104', department: 'Marketing',    position: 'Marketing Manager',      salary: 92000,  status: 'Active',   joinDate: '2019-05-10' },
  { name: 'Sofia Torres',    email: 'sofia.t@corp.io',       phone: '(306) 555-0105', department: 'Sales',        position: 'Sales Director',         salary: 105000, status: 'Active',   joinDate: '2020-02-14' },
  { name: 'Ryan Patel',      email: 'ryan.p@corp.io',        phone: '(306) 555-0106', department: 'Finance',      position: 'Financial Analyst',      salary: 83000,  status: 'On Leave', joinDate: '2021-09-05' },
  { name: 'Emma Johnson',    email: 'emma.j@corp.io',        phone: '(306) 555-0107', department: 'HR',           position: 'HR Specialist',          salary: 76000,  status: 'Active',   joinDate: '2022-01-17' },
  { name: 'Liam Nguyen',     email: 'liam.n@corp.io',        phone: '(306) 555-0108', department: 'Engineering',  position: 'Full Stack Engineer',    salary: 102000, status: 'Active',   joinDate: '2023-03-01' },
  { name: 'Amara Osei',      email: 'amara.o@corp.io',       phone: '(306) 555-0109', department: 'Operations',   position: 'Operations Manager',     salary: 94000,  status: 'Active',   joinDate: '2020-08-22' },
  { name: 'Carlos Rivera',   email: 'carlos.r@corp.io',      phone: '(306) 555-0110', department: 'Sales',        position: 'Account Executive',      salary: 79000,  status: 'Inactive', joinDate: '2019-12-01' },
  { name: 'Zoe Mitchell',    email: 'zoe.m@corp.io',         phone: '(306) 555-0111', department: 'Design',       position: 'Graphic Designer',       salary: 72000,  status: 'Active',   joinDate: '2022-06-15' },
  { name: 'Noah Kim',        email: 'noah.k@corp.io',        phone: '(306) 555-0112', department: 'Finance',      position: 'Senior Accountant',      salary: 88000,  status: 'Active',   joinDate: '2021-04-28' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/employeedb');
    await Employee.deleteMany({});
    await Employee.insertMany(employees);
    console.log(`✅ Seeded ${employees.length} employees successfully.`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seed();
