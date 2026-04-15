'use strict';

const Employee      = require('../models/Employee');
const logActivity   = require('../utils/activityLogger');

// GET /api/employees/stats
const getStats = async (req, res, next) => {
  try {
    const [total, active, onLeave, inactive, salaryAgg, byDept] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'Active' }),
      Employee.countDocuments({ status: 'On Leave' }),
      Employee.countDocuments({ status: 'Inactive' }),
      Employee.aggregate([
        { $group: { _id: null, avgSalary: { $avg: '$salary' }, totalPayroll: { $sum: '$salary' } } },
      ]),
      Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        onLeave,
        inactive,
        avgSalary:    salaryAgg[0] ? Math.round(salaryAgg[0].avgSalary)    : 0,
        totalPayroll: salaryAgg[0] ? Math.round(salaryAgg[0].totalPayroll) : 0,
        byDept,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/employees
const getEmployees = async (req, res, next) => {
  try {
    const { department, search, status, page = 1, limit = 100 } = req.query;
    const filter = {};

    if (department && department !== 'all') filter.department = department;
    if (status     && status     !== 'all') filter.status     = status;
    if (search) {
      const q = search.trim();
      filter.$or = [
        { name:     { $regex: q, $options: 'i' } },
        { email:    { $regex: q, $options: 'i' } },
        { position: { $regex: q, $options: 'i' } },
      ];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const [employees, count] = await Promise.all([
      Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Employee.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, count, data: employees });
  } catch (err) {
    next(err);
  }
};

// GET /api/employees/:id
const getEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.status(200).json({ success: true, data: emp });
  } catch (err) {
    next(err);
  }
};

// POST /api/employees
const createEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.create(req.body);
    await logActivity(
      'hired',
      'employee',
      emp._id,
      emp.name,
      req.user ? req.user.name : 'System',
      `Added to ${emp.department}`
    );
    res.status(201).json({ success: true, data: emp });
  } catch (err) {
    next(err);
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new:           true,
      runValidators: true,
    });
    if (!emp) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    await logActivity(
      'updated',
      'employee',
      emp._id,
      emp.name,
      req.user ? req.user.name : 'System',
      'Updated profile'
    );
    res.status(200).json({ success: true, data: emp });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/employees/:id
const deleteEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findByIdAndDelete(req.params.id);
    if (!emp) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    await logActivity(
      'terminated',
      'employee',
      emp._id,
      emp.name,
      req.user ? req.user.name : 'System',
      'Removed from system'
    );
    res.status(200).json({ success: true, message: 'Employee deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee };
