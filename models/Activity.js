'use strict';

const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    action: {
      type:     String,
      required: [true, 'Action is required'],
    },
    entity: {
      type: String,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    entityName: {
      type: String,
    },
    userName: {
      type: String,
    },
    details: {
      type: String,
    },
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
