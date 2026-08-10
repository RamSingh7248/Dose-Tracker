const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const isLocal = process.env.MONGO_URI && (process.env.MONGO_URI.includes('127.0.0.1') || process.env.MONGO_URI.includes('localhost'));
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      ...(isLocal ? { directConnection: true } : {}),
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
