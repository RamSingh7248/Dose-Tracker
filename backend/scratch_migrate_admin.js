const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function migrateAdmin() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/dose-tracker';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    const adminEmail = 'ramub9349@gmail.com';
    let user = await User.findOne({ email: adminEmail.toLowerCase() });

    if (user) {
      user.role = 'ROLE_ADMIN';
      user.isActive = true;
      user.isVerifiedDoctor = 'approved';
      await user.save({ validateBeforeSave: false });
      console.log(JSON.stringify({
        status: 'UPDATED',
        email: user.email,
        role: user.role,
        message: 'Existing account updated to Primary Super Admin with full permissions.'
      }));
    } else {
      const tempPassword = 'Admin#' + Math.random().toString(36).slice(-6) + '!' + Math.floor(Math.random() * 1000);
      user = await User.create({
        name: 'Primary Super Admin',
        email: adminEmail.toLowerCase(),
        password: tempPassword,
        role: 'ROLE_ADMIN',
        isActive: true,
        isVerifiedDoctor: 'approved',
        termsAccepted: true
      });
      console.log(JSON.stringify({
        status: 'CREATED',
        email: user.email,
        role: user.role,
        tempPassword: tempPassword,
        message: 'New Primary Super Admin account created with secure temporary password.'
      }));
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrateAdmin();
