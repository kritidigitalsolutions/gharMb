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

    const { notifyAdmin } = require('./src/utils/adminNotification.helper');

    const enqNotif = await notifyAdmin({
      title: 'New Property Enquiry 📩',
      message: 'Rajesh Kumar submitted an enquiry for listing "Luxury 3BHK Penthouse, Bandra West". Phone: +91 98765 43210 | Message: "Interested in viewing this Sunday afternoon."',
      type: 'enquiry',
      metadata: {
        clientDetails: {
          name: 'Rajesh Kumar',
          phone: '+91 98765 43210',
          email: 'rajesh.kumar@example.com'
        }
      }
    });

    const visitNotif = await notifyAdmin({
      title: 'New Site Visit Scheduled 🗓️',
      message: 'Priya Sharma scheduled an in-person site visit for "Green Acres Villa #14" on Saturday, 12 Oct at 11:30 AM. Phone: +91 98220 12345 | Note: "Please have key holder ready on site."',
      type: 'visit_booking',
      metadata: {
        clientDetails: {
          name: 'Priya Sharma',
          phone: '+91 98220 12345',
          email: 'priya.sharma@example.com'
        },
        scheduleDetails: {
          date: 'Sat, 12 Oct 2026',
          time: '11:30 AM'
        }
      }
    });

    console.log('\n=============================================');
    console.log('🎉 Live Test Notifications created successfully in DB!');
    console.log('1. Enquiry Notification ID:', enqNotif?._id);
    console.log('2. Visit Schedule Notification ID:', visitNotif?._id);
    console.log('=============================================');
    console.log('Now refresh the Admin Notifications panel to see them live.');

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error creating notification:', err);
    process.exit(1);
  }
};

run();
