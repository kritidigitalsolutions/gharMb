const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config({ path: path.join(__dirname, '../.env') });
const Admin = require('../src/models/admin.model');
const connectDB = require('../src/config/db');

async function resetAdmin() {
  await connectDB();
  const hash = await bcrypt.hash('123123', 10);
  const result = await Admin.updateOne(
    { email: 'annika9070@gmail.com' },
    {
      $set: {
        password: hash,
        loginAttempts: 0,
        isActive: true
      },
      $unset: {
        lockUntil: 1
      }
    }
  );
  console.log('Update result:', result);
  console.log('Admin annika9070@gmail.com unlocked with password: 123123');
  process.exit(0);
}

resetAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
