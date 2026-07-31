const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: './.env' });

// Load models
const Admin = require('./src/models/admin.model');
const User = require('./src/models/user.model');
const Property = require('./src/models/property.model');
const Project = require('./src/models/project.model');
const PropertyEnquiry = require('./src/models/property-enquiry.model');
const DeveloperEnquiry = require('./src/models/developer-enquiry.model');
const Notification = require('./src/models/notification.model');

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is missing from environment!');
      process.exit(1);
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB. Purging existing test records...');

    // Clear existing collections safely
    await Admin.deleteMany({ email: 'admin@gharmb.com' });
    
    // We clean up properties, projects, enquiries, notifications to ensure a clean slate
    await Property.deleteMany({});
    await Project.deleteMany({});
    await PropertyEnquiry.deleteMany({});
    await DeveloperEnquiry.deleteMany({});
    await Notification.deleteMany({});
    
    // Clean up seeded users
    const emailsToClean = [
      'sanjay.aggarwal@gmail.com',
      'alok.mishra@gmail.com',
      'pooja.mehta@gmail.com',
      'kunal.sen@gmail.com',
      'deepak.estates@gmail.com',
      'rahul.sharma@gmail.com',
      'dlf.admin@dlf.in',
      'estate@godrej.com',
      'tatahousings@tata.com',
      'supertech@supertech.in'
    ];
    await User.deleteMany({ email: { $in: emailsToClean } });

    console.log('Creating Admin Account...');
    const admin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@gharmb.com',
      password: 'AdminPassword123!', // model pre-save will hash this
      role: 'admin',
      isActive: true
    });
    console.log(`Admin created: ${admin.email}`);

    console.log('Creating Users (Buyers, Agents, Builders)...');

    // 1. Buyers
    const buyer1 = await User.create({
      name: 'Sanjay Aggarwal',
      email: 'sanjay.aggarwal@gmail.com',
      phone: '+919811223344',
      role: 'buyer',
      status: 'Active',
      isVerified: true,
      isOnboardingCompleted: true
    });

    const buyer2 = await User.create({
      name: 'Alok Mishra',
      email: 'alok.mishra@gmail.com',
      phone: '+919822334455',
      role: 'buyer',
      status: 'Active',
      isVerified: true,
      isOnboardingCompleted: true
    });

    const buyer3 = await User.create({
      name: 'Pooja Mehta',
      email: 'pooja.mehta@gmail.com',
      phone: '+919833445566',
      role: 'buyer',
      status: 'Active',
      isVerified: true,
      isOnboardingCompleted: true
    });

    const buyer4 = await User.create({
      name: 'Kunal Sen',
      email: 'kunal.sen@gmail.com',
      phone: '+919844556677',
      role: 'buyer',
      status: 'Active',
      isVerified: true,
      isOnboardingCompleted: true
    });

    // 2. Agents
    const agent1 = await User.create({
      name: 'Deepak Estates',
      email: 'deepak.estates@gmail.com',
      phone: '+919955667788',
      role: 'agent',
      status: 'Active',
      isVerified: true,
      isOnboardingCompleted: true,
      reraNumber: 'RERA-HR-2022-0922',
      experience: '5+ yrs',
      cityOfOperation: 'Gurugram',
      agentVerificationStatus: 'approved'
    });

    const agent2 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul.sharma@gmail.com',
      phone: '+919966778899',
      role: 'agent',
      status: 'Active',
      isVerified: false,
      isOnboardingCompleted: true,
      reraNumber: 'RERA-DL-2025-0145',
      experience: '1-3 yrs',
      cityOfOperation: 'New Delhi',
      agentVerificationStatus: 'pending'
    });

    // 3. Builders
    const builder1 = await User.create({
      name: 'DLF Limited',
      companyName: 'DLF Limited',
      email: 'dlf.admin@dlf.in',
      phone: '+918001122334',
      role: 'builder',
      status: 'Active',
      isVerified: true,
      isOnboardingCompleted: true,
      gstNumber: '06AAAAD1234A1Z1',
      yearsInBusiness: '10+ yrs',
      builderVerificationStatus: 'approved',
      unitsDelivered: '120+'
    });

    const builder2 = await User.create({
      name: 'Godrej Properties',
      companyName: 'Godrej Properties',
      email: 'estate@godrej.com',
      phone: '+918002233445',
      role: 'builder',
      status: 'Active',
      isVerified: true,
      isOnboardingCompleted: true,
      gstNumber: '27AABC1234F1Z9',
      yearsInBusiness: '10+ yrs',
      builderVerificationStatus: 'approved',
      unitsDelivered: '42'
    });

    const builder3 = await User.create({
      name: 'Tata Value Homes',
      companyName: 'Tata Value Homes',
      email: 'tatahousings@tata.com',
      phone: '+918003344556',
      role: 'builder',
      status: 'Active',
      isVerified: false,
      isOnboardingCompleted: true,
      gstNumber: '27AABC9988F2Z1',
      yearsInBusiness: '5-10 yrs',
      builderVerificationStatus: 'pending',
      unitsDelivered: '35'
    });

    const builder4 = await User.create({
      name: 'Supertech Group',
      companyName: 'Supertech Group',
      email: 'supertech@supertech.in',
      phone: '+918004455667',
      role: 'builder',
      status: 'Active', // builder table status
      isVerified: false,
      isOnboardingCompleted: true,
      gstNumber: '09AAACS9876C1Z9',
      yearsInBusiness: '10+ yrs',
      builderVerificationStatus: 'rejected',
      builderRejectionReason: 'Invalid RERA registration certificate',
      unitsDelivered: '78'
    });

    console.log('Creating Property Listings...');

    const prop1 = await Property.create({
      title: 'Godrej Woods Sector 43',
      price: 24500000,
      carpetArea: 1800,
      category: 'Residential',
      listingFor: 'Sale',
      propertyType: 'Apartment',
      city: 'Noida',
      locality: 'Sector 43',
      fullAddress: 'Godrej Woods, Sector 43, Noida',
      pincode: '201301',
      description: 'Ultra luxury apartments nestled near central forest theme.',
      owner: builder2._id, // Godrej
      approvalStatus: 'approved',
      isLive: true,
      listingTier: 'Premium',
      viewsCount: 1420,
      shortlistedCount: 320,
      inquiriesCount: 12,
      tokensCount: 2
    });

    const prop2 = await Property.create({
      title: 'Premium 3 BHK Builder Floor',
      price: 18500000,
      carpetArea: 2200,
      category: 'Residential',
      listingFor: 'Sale',
      propertyType: 'House',
      city: 'Gurugram',
      locality: 'DLF Phase 2',
      fullAddress: 'H-Block, DLF Phase 2, Gurugram',
      pincode: '122002',
      description: 'Exclusive independent floor with stilt parking and lift access.',
      owner: agent1._id, // Deepak Estates
      approvalStatus: 'pending',
      isLive: false,
      listingTier: 'Standard',
      viewsCount: 120,
      shortlistedCount: 10,
      inquiriesCount: 1,
      tokensCount: 0
    });

    const prop3 = await Property.create({
      title: 'Vatika City Penthouse',
      price: 32000000,
      carpetArea: 3500,
      category: 'Residential',
      listingFor: 'Sale',
      propertyType: 'Apartment',
      city: 'Gurugram',
      locality: 'Sohna Road',
      fullAddress: 'Block C, Vatika City, Sohna Road, Gurugram',
      pincode: '122018',
      description: 'Spacious duplex penthouse with personal terrace garden.',
      owner: buyer1._id, // Sanjay (Owner)
      approvalStatus: 'approved',
      isLive: true,
      listingTier: 'Featured',
      viewsCount: 890,
      shortlistedCount: 140,
      inquiriesCount: 8,
      tokensCount: 1
    });

    const prop4 = await Property.create({
      title: 'Commercial Retail Shop',
      price: 85000,
      carpetArea: 500,
      category: 'Commercial',
      listingFor: 'Lease',
      propertyType: 'Shop / Retail',
      city: 'Gurugram',
      locality: 'Sector 49',
      fullAddress: 'Sapphire Mall, Sector 49, Gurugram',
      pincode: '122018',
      description: 'Ground floor retail space with double height ceiling.',
      owner: agent1._id, // Deepak Estates
      approvalStatus: 'rejected',
      rejectionReason: 'Incorrect commercial zone deed certificate submitted',
      isLive: false,
      listingTier: 'Standard',
      viewsCount: 40,
      shortlistedCount: 2,
      inquiriesCount: 0,
      tokensCount: 0
    });

    console.log('Creating Builder Projects...');

    const prj1 = await Project.create({
      projectName: 'Tata Primanti',
      developerName: 'Tata Value Homes',
      reraProjectNumber: 'RERA-HR-2022-0091',
      city: 'Gurugram',
      locality: 'Sector 72',
      fullAddress: 'Sector 72, Southern Peripheral Road, Gurugram',
      pincode: '122101',
      projectType: 'Residential',
      projectStatus: 'Ready to move',
      totalUnits: 450,
      developer: builder3._id, // Tata
      approvalStatus: 'approved',
      isLive: true,
      viewsCount: 2100,
      inquiriesCount: 84
    });

    const prj2 = await Project.create({
      projectName: 'Godrej Woods Phase 2',
      developerName: 'Godrej Properties',
      reraProjectNumber: 'RERA-UP-2023-0104',
      city: 'Noida',
      locality: 'Sector 43',
      fullAddress: 'Sector 43, Noida',
      pincode: '201301',
      projectType: 'Residential',
      projectStatus: 'Under construction',
      totalUnits: 650,
      developer: builder2._id, // Godrej
      approvalStatus: 'approved',
      isLive: true,
      viewsCount: 3200,
      inquiriesCount: 120
    });

    const prj3 = await Project.create({
      projectName: 'DLF Skycourt',
      developerName: 'DLF Limited',
      reraProjectNumber: 'RERA-HR-2019-0012',
      city: 'Gurugram',
      locality: 'Sector 86',
      fullAddress: 'DLF Gardencity, Sector 86, Gurugram',
      pincode: '122004',
      projectType: 'Residential',
      projectStatus: 'Ready to move',
      totalUnits: 800,
      developer: builder1._id, // DLF
      approvalStatus: 'approved',
      isLive: true,
      viewsCount: 4100,
      inquiriesCount: 180
    });

    const prj4 = await Project.create({
      projectName: 'Supertech Hues',
      developerName: 'Supertech Group',
      reraProjectNumber: 'RERA-HR-2019-0012',
      city: 'Gurugram',
      locality: 'Sector 68',
      fullAddress: 'Sector 68, Sohna Road, Gurugram',
      pincode: '122018',
      projectType: 'Residential',
      projectStatus: 'New launch',
      totalUnits: 950,
      developer: builder4._id, // Supertech
      approvalStatus: 'pending',
      isLive: false,
      viewsCount: 150,
      inquiriesCount: 5
    });

    console.log('Creating Enquiries / Leads...');

    const enq1 = await PropertyEnquiry.create({
      property: prop1._id,
      client: buyer1._id,
      message: 'I am interested in Godrej Woods 3 BHK. Please call me back to schedule a visit.',
      status: 'pending',
      visitPreferredDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
      visitTimeSlot: '10:00 AM - 12:00 PM',
      agentNotes: ''
    });

    const enq2 = await PropertyEnquiry.create({
      property: prop3._id,
      client: buyer2._id,
      message: 'Is the price negotiable for the Vatika City Penthouse? I have escrow ready.',
      status: 'contacted',
      visitPreferredDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
      visitTimeSlot: '2:00 PM - 4:00 PM',
      agentNotes: 'Client requested floor layout plans via WhatsApp.'
    });

    const devEnq1 = await DeveloperEnquiry.create({
      developer: builder1._id, // DLF
      client: buyer1._id,
      message: 'Do you have any commercial shops available in DLF Gardencity?',
      status: 'pending',
      developerNotes: ''
    });

    const devEnq2 = await DeveloperEnquiry.create({
      developer: builder2._id, // Godrej
      client: buyer3._id,
      message: 'What are the downpayment discount terms for Godrej Woods Phase 2?',
      status: 'contacted',
      developerNotes: 'Negotiating discount rate.'
    });

    console.log('Creating Notification History...');

    await Notification.create({
      recipient: admin._id,
      title: 'Documents Pending RERA Check',
      message: 'Builder Tata Value Homes submitted new company documentation for validation.',
      type: 'verification',
      isRead: false
    });

    await Notification.create({
      recipient: admin._id,
      title: 'Escrow Account Credited',
      message: 'Token booking payment of ₹50,000 received for Property Godrej Woods Sector 43.',
      type: 'payment',
      isRead: true
    });

    await Notification.create({
      recipient: admin._id,
      title: 'New Lead Enquiry Received',
      message: 'Buyer Sanjay Aggarwal requested a callback regarding Godrej Woods Sector 43.',
      type: 'enquiry',
      isRead: true
    });

    await Notification.create({
      recipient: admin._id,
      title: 'Agent Application Received',
      message: 'Agent Rahul Sharma registered and uploaded credentials for RERA verification.',
      type: 'verification',
      isRead: false
    });

    console.log('\n=============================================');
    console.log('🎉 Seeding successfully completed!');
    console.log('Email: admin@gharmb.com');
    console.log('Password: AdminPassword123!');
    console.log('=============================================');

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error running check:', err);
    process.exit(1);
  }
};

run();
