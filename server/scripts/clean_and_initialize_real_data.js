const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const PageContent = require('../src/models/page-content.model');
const Admin = require('../src/models/admin.model');

async function cleanAndInit() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas...');
  const db = mongoose.connection.db;

  // 1. Clean up gibberish broadcasts
  const deletedBroadcasts = await db.collection('broadcasts').deleteMany({
    $or: [
      { title: /hjdchjyfujyg/i },
      { title: /ooooooooooooooooo/i },
      { message: /kjvkvkj/i }
    ]
  });
  console.log(`Cleaned up ${deletedBroadcasts.deletedCount} junk test broadcast(s).`);

  // 2. Clean up test notifications with test credentials/gibberish
  const deletedNotifs = await db.collection('notifications').deleteMany({
    $or: [
      { message: /gdvxhbjnzkm/i },
      { message: /dgvbhjnm/i },
      { title: /hjdchjyfujyg/i }
    ]
  });
  console.log(`Cleaned up ${deletedNotifs.deletedCount} junk test notification(s).`);

  // 3. Find primary admin for lastUpdatedBy reference
  const admin = await Admin.findOne();
  const adminId = admin ? admin._id : new mongoose.Types.ObjectId();

  // 4. Initialize real PageContent documents in MongoDB
  const realAboutUs = {
    type: 'about-us',
    title: 'About GharMB',
    content: 'GharMB is a modern real-estate technology platform connecting home buyers, property owners, and certified agents through verified listings, direct builder rates, and transparent compliance tracking.',
    metadata: {
      tagline: 'Making real estate simpler, verified, and more trustworthy.',
      mission: 'To eliminate unverified listings and deliver a transparent, seamless property discovery ecosystem across India.',
      vision: 'To build India’s most trusted real-estate marketplace for buyers, builders, and certified brokers.',
      supportEmail: 'support@gharmb.com',
      helpline: '+91 99990 00000',
      headquarters: 'GharMB Corporate Office, Gurugram, NCR, Haryana, India',
      reraRegistration: '',
      websiteUrl: 'https://gharmb.com/about'
    },
    lastUpdatedBy: adminId
  };

  const realContactUs = {
    type: 'contact-us',
    title: 'Get in Touch with GharMB',
    content: 'Have questions regarding property verification, builder consultations, or partner network? Our specialized advisory team is here to assist.',
    metadata: {
      supportEmail: 'support@gharmb.com',
      salesEmail: 'sales@gharmb.com',
      helpline: '+91 99990 00000',
      tollFree: '1800-120-4427',
      whatsapp: '+91 99990 00000',
      workingHours: 'Mon – Sat: 9:00 AM – 8:00 PM IST',
      responseSLA: 'Replies in under 15 minutes',
      headquarters: {
        address: 'GharMB Corporate Office',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122002',
        country: 'India',
        mapsUrl: 'https://maps.google.com/?q=Gurugram+Haryana'
      },
      branches: [],
      socialLinks: {
        linkedin: 'https://linkedin.com/company/gharmb',
        twitter: 'https://twitter.com/gharmb_official',
        instagram: 'https://instagram.com/gharmb_official'
      },
      grievanceOfficer: {
        name: 'Grievance Redressal Officer',
        email: 'grievance@gharmb.com',
        phone: '+91 99990 00000'
      }
    },
    lastUpdatedBy: adminId
  };

  const realHelpSupport = {
    type: 'help-support',
    title: 'Help & Customer Support',
    content: 'Need assistance regarding verified listings, token booking, or KYC verification? Reach out to GharMB customer support at support@gharmb.com or via WhatsApp.',
    metadata: {
      supportEmail: 'support@gharmb.com',
      helpline: '+91 99990 00000',
      tollFree: '1800-120-4427',
      whatsapp: '+91 99990 00000',
      workingHours: 'Monday – Saturday: 9:00 AM – 8:00 PM IST'
    },
    lastUpdatedBy: adminId
  };

  await PageContent.findOneAndUpdate({ type: 'about-us' }, realAboutUs, { upsert: true, new: true });
  await PageContent.findOneAndUpdate({ type: 'contact-us' }, realContactUs, { upsert: true, new: true });
  await PageContent.findOneAndUpdate({ type: 'help-support' }, realHelpSupport, { upsert: true, new: true });

  console.log('Successfully initialized real PageContent documents in MongoDB Atlas.');

  const totalPages = await PageContent.countDocuments();
  console.log(`Current pagecontents count in DB: ${totalPages}`);

  process.exit(0);
}

cleanAndInit().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
