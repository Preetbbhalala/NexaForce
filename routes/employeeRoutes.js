'use strict';

const express  = require('express');
const router   = express.Router();
const protect  = require('../middleware/auth');
const {
  getStats,
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');

// All employee routes are protected
router.use(protect);

// Stats must come before /:id to avoid param conflict
router.get('/stats', getStats);

router.route('/')
  .get(getEmployees)
  .post(createEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(updateEmployee)
  .delete(deleteEmployee);

module.exports = router;
