const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is missing from environment!');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
};

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    require('./src/models/notification.model');
    const Notification = mongoose.model('Notification');

    const adminId = '6a6727fb055dd4b7886ce8a4'; // Super Admin ID

    const newNotification = await Notification.create({
      recipient: adminId,
      title: 'New Live Alert',
      message: `Test alert triggered at ${new Date().toLocaleTimeString()}! It is working successfully!`,
      type: 'enquiry',
      isRead: false
    });

    console.log('\n=============================================');
    console.log('🎉 Notification created successfully in DB!');
    console.log(`Title: ${newNotification.title}`);
    console.log(`Message: ${newNotification.message}`);
    console.log('=============================================');
    console.log('\nOpen your browser admin panel and watch the bell icon dropdown updates.');

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error creating notification:', err);
    process.exit(1);
  }
};

run();
