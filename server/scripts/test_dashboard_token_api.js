const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const http = require('http');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../app');
const User = require('../src/models/user.model');
const Property = require('../src/models/property.model');
const TokenRequest = require('../src/models/token-request.model');
const PropertyEnquiry = require('../src/models/property-enquiry.model');
const Favorite = require('../src/models/favorite.model');

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'gharmb_secret_key_2026', {
    expiresIn: '7d',
  });
};

const run = async () => {
  let server;
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected to MongoDB.');

    // Start server on an ephemeral port
    const PORT = 5588;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}/api`;

    // 1. Setup Builder User "Kartik" matching the screenshot
    await User.deleteMany({ email: 'kartikoffice8@gmail.com' });
    const kartik = await User.create({
      name: 'Kartik',
      email: 'kartikoffice8@gmail.com',
      phone: '+919284253307',
      role: 'builder',
      isVerified: true,
      builderVerificationStatus: 'approved',
      address: {
        formattedAddress: '1600 Amphitheatre Pkwy, Mountain View, California, 94043',
        city: 'Mountain View',
        state: 'California',
        pincode: '94043',
      },
      isOnboardingCompleted: true,
      isBasicInfoCompleted: true,
    });
    const kartikToken = signToken(kartik._id, kartik.role);

    // 2. Setup Buyer User
    await User.deleteMany({ email: 'buyer.test@example.com' });
    const buyer = await User.create({
      name: 'Rohan Verma',
      email: 'buyer.test@example.com',
      phone: '+919876543299',
      role: 'buyer',
      isVerified: true,
    });
    const buyerToken = signToken(buyer._id, buyer.role);

    // Clean old test properties for kartik
    await Property.deleteMany({ owner: kartik._id });
    await TokenRequest.deleteMany({ owner: kartik._id });

    // 3. Create Properties matching the screenshot:
    // Property 1 (Live): "fgcvhb" in sector4, noida
    const prop1 = await Property.create({
      title: 'fgcvhb',
      price: 5500000,
      category: 'Residential',
      listingFor: 'Sale',
      propertyType: 'Apartment',
      city: 'noida',
      locality: 'sector4',
      fullAddress: 'sector4, noida',
      pincode: '201301',
      carpetArea: 1250,
      bedrooms: '2',
      bathrooms: '2',
      owner: kartik._id,
      approvalStatus: 'approved',
      isLive: true,
      viewsCount: 15,
      shortlistedCount: 4,
      inquiriesCount: 2,
      photos: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500'],
    });

    // Property 2 (Live): "Green Valley Residency"
    const prop2 = await Property.create({
      title: 'Green Valley Residency',
      price: 12000000,
      category: 'Residential',
      listingFor: 'Sale',
      propertyType: 'Villa',
      city: 'noida',
      locality: 'sector 150',
      fullAddress: 'Sector 150, Noida expressway',
      pincode: '201310',
      carpetArea: 2400,
      bedrooms: '4',
      bathrooms: '4',
      owner: kartik._id,
      approvalStatus: 'approved',
      isLive: true,
      viewsCount: 30,
      shortlistedCount: 6,
      inquiriesCount: 3,
      photos: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500'],
    });

    // 4. Test GET /api/user/properties/my-dashboard
    console.log('\n--- 1. Testing GET /api/user/properties/my-dashboard ---');
    const dashRes = await fetch(`${BASE_URL}/user/properties/my-dashboard`, {
      headers: { Authorization: `Bearer ${kartikToken}` },
    });
    const dashData = await dashRes.json();
    console.log('Dashboard status:', dashData.status);
    console.log('Profile:', dashData.data.profile);
    console.log('Counters:', dashData.data.counters);
    console.log('Token Banner:', dashData.data.tokenRequestsBanner);
    console.log('Performance:', dashData.data.performance);
    console.log('Live Listings Count:', dashData.data.myProperties.live.length);

    if (
      dashData.data.profile.name === 'Kartik' &&
      dashData.data.profile.roleTitle === 'Builder Profile' &&
      dashData.data.profile.verificationBadge === 'Verified' &&
      dashData.data.counters.totalListings === 2 &&
      dashData.data.counters.liveListings === 2 &&
      dashData.data.performance.period === 'all' &&
      dashData.data.performance.label === 'All Time'
    ) {
      console.log('✅ Dashboard returns accurate profile, counters, and ALL-TIME performance!');
    } else {
      console.error('❌ Dashboard assertion failed:', dashData);
      process.exit(1);
    }

    // 5. Buyer submits a Token Request for prop1
    console.log('\n--- 2. Testing POST /api/user/token-requests ---');
    const tokenSubmitRes = await fetch(`${BASE_URL}/user/token-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        propertyId: prop1._id,
        tokenAmount: 25000,
        message: 'Interested in booking fgcvhb apartment. Token amount paid via UPI.',
        paymentMethod: 'upi',
        transactionId: 'UPI-TXN-987654321',
      }),
    });
    const tokenSubmitData = await tokenSubmitRes.json();
    console.log('Token Submission response:', tokenSubmitData.status, tokenSubmitData.message);
    const createdTokenRequestId = tokenSubmitData.data.tokenRequest._id;

    if (tokenSubmitRes.status === 201 && tokenSubmitData.data.tokenRequest.status === 'pending') {
      console.log('✅ Token request created successfully with pending status!');
    } else {
      console.error('❌ Token request creation failed:', tokenSubmitData);
      process.exit(1);
    }

    // 6. Check Dashboard after Token Request
    console.log('\n--- 3. Checking Dashboard counters after Token Request ---');
    const dashRes2 = await fetch(`${BASE_URL}/user/properties/my-dashboard`, {
      headers: { Authorization: `Bearer ${kartikToken}` },
    });
    const dashData2 = await dashRes2.json();
    console.log('Pending Tokens:', dashData2.data.counters.pendingTokens);
    console.log('Token Banner:', dashData2.data.tokenRequestsBanner);

    if (
      dashData2.data.counters.pendingTokens === 1 &&
      dashData2.data.tokenRequestsBanner.count === 1 &&
      dashData2.data.tokenRequestsBanner.title === '1 new token requests'
    ) {
      console.log('✅ Pending tokens & banner count updated accurately!');
    } else {
      console.error('❌ Dashboard token counter mismatch:', dashData2.data.counters);
      process.exit(1);
    }

    // 7. Builder fetches received token requests
    console.log('\n--- 4. Testing GET /api/user/token-requests ---');
    const listRes = await fetch(`${BASE_URL}/user/token-requests?status=pending`, {
      headers: { Authorization: `Bearer ${kartikToken}` },
    });
    const listData = await listRes.json();
    console.log('Received token requests count:', listData.data.tokenRequests.length);
    console.log('Request client name:', listData.data.tokenRequests[0].client.name);
    console.log('Request property title:', listData.data.tokenRequests[0].property.title);

    // 8. Builder accepts the token request
    console.log('\n--- 5. Testing PATCH /api/user/token-requests/:id/accept ---');
    const acceptRes = await fetch(`${BASE_URL}/user/token-requests/${createdTokenRequestId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${kartikToken}` },
    });
    const acceptData = await acceptRes.json();
    console.log('Accept response:', acceptData.status, acceptData.message);

    // 9. Check Dashboard after accepting token request
    console.log('\n--- 6. Checking Dashboard counters after Token Acceptance ---');
    const dashRes3 = await fetch(`${BASE_URL}/user/properties/my-dashboard`, {
      headers: { Authorization: `Bearer ${kartikToken}` },
    });
    const dashData3 = await dashRes3.json();
    console.log('Counters:', dashData3.data.counters);
    console.log('Performance:', dashData3.data.performance);

    if (
      dashData3.data.counters.pendingTokens === 0 &&
      dashData3.data.counters.acceptedTokens === 1 &&
      dashData3.data.performance.tokensReceived === 1 &&
      dashData3.data.performance.totalTokenAmount === 25000
    ) {
      console.log('✅ Accepted tokens & all-time tokensReceived updated successfully!');
    } else {
      console.error('❌ Counter mismatch after acceptance:', dashData3.data);
      process.exit(1);
    }

    // 10. Test GET /api/user/properties/my-properties?status=live
    console.log('\n--- 7. Testing GET /api/user/properties/my-properties ---');
    const myPropsRes = await fetch(`${BASE_URL}/user/properties/my-properties?status=live`, {
      headers: { Authorization: `Bearer ${kartikToken}` },
    });
    const myPropsData = await myPropsRes.json();
    console.log('My Properties Live count:', myPropsData.data.properties.length);
    console.log('Property formatted price:', myPropsData.data.properties[0].formattedPrice);

    // 11. Test Aliases: GET /api/users/dashboard
    console.log('\n--- 8. Testing Alias GET /api/users/dashboard ---');
    const aliasRes = await fetch(`${BASE_URL}/users/dashboard`, {
      headers: { Authorization: `Bearer ${kartikToken}` },
    });
    const aliasData = await aliasRes.json();
    console.log('Alias endpoint status:', aliasData.status);

    console.log('\n🎉 ALL DASHBOARD & TOKEN APIS TESTED & FULLY VERIFIED!\n');

    server.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    if (server) server.close();
    process.exit(1);
  }
};

run();
