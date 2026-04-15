'use strict';

const Activity = require('../models/Activity');

const logActivity = async (action, entity, entityId, entityName, userName, details) => {
  try {
    await Activity.create({ action, entity, entityId, entityName, userName, details });
  } catch (e) {
    // silent — activity logging must never break main flow
  }
};

module.exports = logActivity;
