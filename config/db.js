'use strict';

const mongoose = require('mongoose');

const connectDB = async () => {
  const conn = await mongoose.connect(
    process.env.MONGO_URI || 'mongodb://localhost:27017/nexaforcedb'
  );
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
