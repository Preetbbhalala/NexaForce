const Employee = require('../models/Employee');

// @desc  Get all employees (with optional search/filter)
// @route GET /api/employees
const getEmployees = async (req, res) => {
  try {
    const { department, status, search } = req.query;
    const query = {};

    if (department && department !== 'all') query.department = department;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single employee
// @route GET /api/employees/:id
const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create employee
// @route POST /api/employees
const createEmployee = async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    const msg =
      error.code === 11000
        ? 'An employee with that email already exists'
        : error.message;
    res.status(400).json({ success: false, message: msg });
  }
};

// @desc  Update employee
// @route PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!employee)
      return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc  Delete employee
// @route DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee)
      return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get dashboard stats
// @route GET /api/employees/stats
const getStats = async (req, res) => {
  try {
    const [total, active, onLeave, inactive, salaryData, byDept] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'Active' }),
      Employee.countDocuments({ status: 'On Leave' }),
      Employee.countDocuments({ status: 'Inactive' }),
      Employee.aggregate([{ $group: { _id: null, avg: { $avg: '$salary' }, total: { $sum: '$salary' } } }]),
      Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        onLeave,
        inactive,
        avgSalary: Math.round(salaryData[0]?.avg || 0),
        totalPayroll: Math.round(salaryData[0]?.total || 0),
        byDept,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getStats };
