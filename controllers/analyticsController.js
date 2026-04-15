'use strict';

const Employee = require('../models/Employee');
const Activity = require('../models/Activity');

const getAnalytics = async (req, res, next) => {
  try {
    // 1. By Department — count + avgSalary
    const byDept = await Employee.aggregate([
      {
        $group: {
          _id:       '$department',
          count:     { $sum: 1 },
          avgSalary: { $avg: '$salary' },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id:       1,
          count:     1,
          avgSalary: { $round: ['$avgSalary', 0] },
        },
      },
    ]);

    // 2. By Status
    const byStatus = await Employee.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 3. Monthly hires — last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyHires = await Employee.aggregate([
      { $match: { joinDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year:  { $year:  '$joinDate' },
            month: { $month: '$joinDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // 4. Salary ranges via $bucket
    const salaryRanges = await Employee.aggregate([
      {
        $bucket: {
          groupBy:    '$salary',
          boundaries: [0, 50000, 75000, 100000, 125000, 999999],
          default:    'Other',
          output:     { count: { $sum: 1 } },
        },
      },
    ]);

    // 5. Top 5 earners
    const topEarners = await Employee.find({})
      .sort({ salary: -1 })
      .limit(5)
      .select('name department position salary');

    // 6. Recent activity — last 15
    const recentActivity = await Activity.find({})
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        byDept,
        byStatus,
        monthlyHires,
        salaryRanges,
        topEarners,
        recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAnalytics };
