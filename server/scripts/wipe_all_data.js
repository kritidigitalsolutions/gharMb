const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore DNS override errors
}

dotenv.config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../src/config/db');

async function wipeAllData() {
  console.log('--------------------------------------------------');
  console.log('GHARMB: Initiating complete data cleanup...');
  console.log('--------------------------------------------------');

  await connectDB();
  console.log('Connected to MongoDB database:', mongoose.connection.name);

  // 1. Wipe all collections in MongoDB
  const collections = await mongoose.connection.db.collections();
  console.log(`\nFound ${collections.length} collections in database.`);

  const stats = [];
  for (const collection of collections) {
    const colName = collection.collectionName;
    const countBefore = await collection.countDocuments();
    const result = await collection.deleteMany({});
    stats.push({ collection: colName, deleted: result.deletedCount, before: countBefore });
    console.log(`Deleted ${result.deletedCount} documents from '${colName}'`);
  }

  // 2. Clean up server/uploads
  const uploadDir = path.join(__dirname, '../uploads');
  let deletedFilesCount = 0;
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          fs.unlinkSync(filePath);
          deletedFilesCount++;
        }
      } catch (err) {
        console.warn(`Could not remove file ${file}:`, err.message);
      }
    }
    console.log(`\nCleaned ${deletedFilesCount} uploaded files from ${uploadDir}`);
  } else {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created uploads folder at ${uploadDir}`);
  }

  // 3. Re-seed default admin account so the dashboard remains accessible
  const Admin = require('../src/models/admin.model');
  const adminEmail = (process.env.ADMIN_EMAIL || 'annika9070@gmail.com').toLowerCase().trim();
  const hashedPassword = await bcrypt.hash('123123', 10);
  await Admin.create({
    name: 'Admin',
    email: adminEmail,
    password: hashedPassword,
    role: 'ADMIN',
    isActive: true
  });
  console.log(`\nRe-created default Admin user (${adminEmail} / 123123)`);

  console.log('--------------------------------------------------');
  console.log('CLEANUP COMPLETE:');
  console.log(`- Collections processed: ${stats.length}`);
  console.log(`- Total records removed: ${stats.reduce((acc, s) => acc + s.deleted, 0)}`);
  console.log(`- Uploaded files removed: ${deletedFilesCount}`);
  console.log('--------------------------------------------------');

  process.exit(0);
}

wipeAllData().catch((err) => {
  console.error('Error during data wipe:', err);
  process.exit(1);
});
