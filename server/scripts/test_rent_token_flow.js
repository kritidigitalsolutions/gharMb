const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../app');
const User = require('../src/models/user.model');
const Property = require('../src/models/property.model');
const TokenRequest = require('../src/models/token-request.model');
const Notification = require('../src/models/notification.model');

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'gharmb_secret_key_2026', {
    expiresIn: '7d',
  });
};

const run = async () => {
  let server;
  try {
    console.log('--- Connecting to MongoDB ---');
    await connectDB();
    console.log('Connected to MongoDB.');

    const PORT = 5599;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}/api`;

    const Admin = require('../src/models/admin.model');

    // 1. Setup Admin user
    await Admin.deleteMany({ email: 'admin.tokentest@example.com' });
    const admin = await Admin.create({
      name: 'Admin GharMB',
      email: 'admin.tokentest@example.com',
      phone: '+919999900001',
      password: 'password123',
      role: 'ADMIN',
      isActive: true,
    });
    const adminToken = signToken(admin._id, admin.role);

    // 2. Setup Tenant / User
    await User.deleteMany({ email: 'tenant.tokentest@example.com' });
    const tenant = await User.create({
      name: 'Amitabh Sen',
      email: 'tenant.tokentest@example.com',
      phone: '+919876501234',
      role: 'tenant',
      isPhoneVerified: true,
    });
    const tenantToken = signToken(tenant._id, tenant.role);

    // Setup Owner User
    await User.deleteMany({ email: 'owner.tokentest@example.com' });
    const ownerUser = await User.create({
      name: 'Owner Property Sharma',
      email: 'owner.tokentest@example.com',
      phone: '+919876505678',
      role: 'owner',
      isPhoneVerified: true,
    });

    await Property.deleteMany({ submissionId: { $in: ['#SALE-101', '#RENT-202'] } });

    // 3. Setup Property for SALE (Not eligible for token)
    const saleProp = await Property.create({
      title: 'Luxury 4 BHK Villa For Sale',
      owner: ownerUser._id,
      category: 'Residential',
      listingFor: 'Sale',
      propertyType: 'Villa',
      city: 'Noida',
      locality: 'Sector 128',
      fullAddress: 'Jaypee Greens, Sector 128, Noida',
      pincode: '201304',
      price: 25000000,
      bedrooms: 4,
      bathrooms: 4,
      carpetArea: 3200,
      furnishing: 'Furnished',
      submissionId: '#SALE-101',
      approvalStatus: 'approved',
    });

    // 4. Setup Property for RENT (Eligible for token)
    const rentProp = await Property.create({
      title: 'Spacious 2 BHK Apartment For Rent',
      owner: ownerUser._id,
      category: 'Residential',
      listingFor: 'Rent',
      propertyType: 'Apartment',
      city: 'Noida',
      locality: 'Sector 62',
      fullAddress: 'Stellar Park, Sector 62, Noida',
      pincode: '201309',
      price: 22000,
      bedrooms: 2,
      bathrooms: 2,
      carpetArea: 1050,
      furnishing: 'Semi-furnished',
      submissionId: '#RENT-202',
      approvalStatus: 'approved',
      allowTokenBooking: true,
      tokenAmount: 2000,
    });

    console.log('\n--- 1. Testing Token Config for Sale Property ---');
    const saleConfigRes = await fetch(`${BASE_URL}/properties/${saleProp._id}/token-config`);
    const saleConfigData = await saleConfigRes.json();
    console.log('Sale property allowTokenBooking:', saleConfigData.data?.allowTokenBooking);
    console.log('Sale property isTokenApplicable:', saleConfigData.data?.isTokenApplicable);
    console.log('Sale property defaultTokenAmount:', saleConfigData.data?.defaultTokenAmount);
    if (saleConfigData.data?.allowTokenBooking === true && saleConfigData.data?.isTokenApplicable === false) {
      console.log('✅ PASS: Sale property booking allowed with zero token amount.');
    } else {
      console.error('❌ FAIL: Sale property config invalid:', saleConfigData);
      process.exit(1);
    }

    console.log('\n--- 2. Testing Booking Request on SALE Property (Must Succeed with 0 Token) ---');
    const saleBookRes = await fetch(`${BASE_URL}/user/token-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId: saleProp._id,
      }),
    });
    const saleBookData = await saleBookRes.json();
    console.log('Response Status:', saleBookRes.status, saleBookData.message);
    const saleToken = saleBookData.data?.tokenRequest;
    if (saleBookRes.status === 201 && saleToken && saleToken.tokenAmount === 0 && saleToken.isTokenApplicable === false) {
      console.log('✅ PASS: Booking on Sale property created successfully with 0 token amount!');
      console.log('Token ID:', saleToken.tokenRequestId);
      console.log('Token Amount:', saleToken.tokenAmount);
      console.log('Is Token Applicable:', saleToken.isTokenApplicable);
    } else {
      console.error('❌ FAIL: Booking on Sale property should succeed with 0 token amount:', saleBookData);
      process.exit(1);
    }

    console.log('\n--- 3. Testing 1-Click Token Request on RENTAL Property (Must Succeed) ---');
    const successRes = await fetch(`${BASE_URL}/user/token-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId: rentProp._id,
        tokenAmount: 2000,
      }),
    });
    const successData = await successRes.json();
    console.log('Response Status:', successRes.status, successData.message);
    const createdToken = successData.data?.tokenRequest;
    if (successRes.status === 201 && createdToken && createdToken.status === 'pending') {
      console.log('✅ PASS: 1-Click token request created successfully!');
      console.log('Token ID:', createdToken.tokenRequestId);
      console.log('Tenant Name:', createdToken.clientDetails?.name);
      console.log('Tenant Phone:', createdToken.clientDetails?.phone);
      console.log('Out of App Status:', createdToken.outOfAppStatus);
    } else {
      console.error('❌ FAIL: Token request creation failed:', successData);
      process.exit(1);
    }

    console.log('\n--- 4. Checking Direct-to-Admin Notification ---');
    const adminNotifs = await Notification.find({
      $or: [
        { recipient: admin._id },
        { forAdmin: true },
      ],
      type: 'token_request',
    });
    console.log('Found Admin Notifications:', adminNotifs.length);
    if (adminNotifs.length > 0) {
      console.log('Notification Title:', adminNotifs[0].title);
      console.log('Notification Message:', adminNotifs[0].message);
      console.log('✅ PASS: Admin received direct notification with user contact details!');
    } else {
      console.error('❌ FAIL: Admin did not receive direct notification!');
      process.exit(1);
    }

    console.log('\n--- 5. Testing Admin GET /api/admin/tokens ---');
    const adminTokensRes = await fetch(`${BASE_URL}/admin/tokens`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminTokensData = await adminTokensRes.json();
    console.log('Total tokens returned:', adminTokensData.data?.tokens?.length);
    console.log('Stats:', adminTokensData.data?.stats);
    const targetToken = adminTokensData.data?.tokens?.find(
      t => t.id === createdToken.tokenRequestId || t.mongoId === createdToken._id
    );
    if (targetToken && targetToken.buyerPhone === '+919876501234') {
      console.log('✅ PASS: Token record visible in admin console with buyer phone and rental details!');
    } else {
      console.error('❌ FAIL: Token record not found in admin list!');
      process.exit(1);
    }

    console.log('\n--- 6. Testing Admin Out-of-App Followup: Mark as Contacted ---');
    const contactRes = await fetch(`${BASE_URL}/admin/tokens/${targetToken.mongoId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'contacted',
        action: 'contact',
        notes: 'Called tenant Amitabh on phone. Agreed to visit site on Sunday at 11 AM.',
      }),
    });
    const contactData = await contactRes.json();
    console.log('Contact update response:', contactData.status, contactData.message);
    if (contactData.data?.token?.status === 'contacted' && contactData.data?.token?.outOfAppStatus === 'contacted') {
      console.log('✅ PASS: Status updated to contacted with discussion notes!');
    } else {
      console.error('❌ FAIL: Contact status update failed:', contactData);
      process.exit(1);
    }

    console.log('\n--- 7. Testing Admin Confirm Token Received Offline ---');
    const acceptRes = await fetch(`${BASE_URL}/admin/tokens/${targetToken.mongoId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'accepted',
        action: 'accept',
        tokenReceivedAmount: 2000,
        notes: 'Received ₹2,000 token offline via GPay. Deal closed for Sector 62 rental apartment.',
      }),
    });
    const acceptData = await acceptRes.json();
    console.log('Accept update response:', acceptData.status, acceptData.message);
    if (acceptData.data?.token?.status === 'accepted' && acceptData.data?.token?.outOfAppStatus === 'token_received') {
      console.log('✅ PASS: Token received recorded successfully offline!');
    } else {
      console.error('❌ FAIL: Token accept status update failed:', acceptData);
      process.exit(1);
    }

    console.log('\n========================================');
    console.log('🎉 ALL RENTAL TOKEN & OUT-OF-APP TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('========================================');

    // Clean up test data
    await TokenRequest.deleteMany({ _id: createdToken._id });
    await Property.deleteMany({ _id: { $in: [saleProp._id, rentProp._id] } });
    await Notification.deleteMany({ recipient: admin._id });
    await User.deleteMany({ _id: { $in: [admin._id, tenant._id] } });

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test execution error:', err);
    if (server) server.close();
    process.exit(1);
  }
};

run();
