const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect('mongodb://localhost:27017/dose-tracker');
  const db = mongoose.connection.db;

  await db.collection('users').updateMany(
    { email: { $in: ['ramub9349@gmail.com', 'admin@dosetracker.com'] } },
    { $set: { role: 'ROLE_ADMIN' } }
  );

  await db.collection('users').updateMany(
    { email: 'doctor@dosetracker.com' },
    { $set: { role: 'ROLE_DOCTOR', isVerifiedDoctor: 'approved' } }
  );

  await db.collection('users').updateMany(
    { role: { $in: [null, undefined, 'patient'] } },
    { $set: { role: 'ROLE_PATIENT' } }
  );

  const users = await db.collection('users').find({}).toArray();
  console.log('Updated Users:', users.map(u => ({ email: u.email, role: u.role })));
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
