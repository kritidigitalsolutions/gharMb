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

    const PORT = 5598;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}/api`;

    // 1. Create two test users: User A (Owner) and User B (Buyer/Other Owner)
    await User.deleteMany({ email: { $in: ['usera.ownertest@example.com', 'userb.buyertest@example.com'] } });

    const userA = await User.create({
      name: 'User A Owner',
      email: 'usera.ownertest@example.com',
      phone: '+919811100001',
      role: 'owner',
      isPhoneVerified: true,
    });
    const tokenA = signToken(userA._id, userA.role);

    const userB = await User.create({
      name: 'User B Buyer',
      email: 'userb.buyertest@example.com',
      phone: '+919822200002',
      role: 'buyer',
      isPhoneVerified: true,
    });
    const tokenB = signToken(userB._id, userB.role);

    // 2. Create properties for User A and User B
    await Property.deleteMany({ title: { $in: ['User A Penthouse Listing', 'User B Villa Listing'] } });

    const propA = await Property.create({
      title: 'User A Penthouse Listing',
      owner: userA._id,
      category: 'Residential',
      listingFor: 'Rent',
      propertyType: 'Apartment',
      price: 45000,
      city: 'Noida',
      locality: 'Sector 62',
      fullAddress: 'Tower 4, Sector 62, Noida',
      pincode: '201301',
      carpetArea: 1450,
      approvalStatus: 'approved',
      isLive: true,
      allowTokenBooking: true,
      tokenAmount: 2000,
    });

    const propB = await Property.create({
      title: 'User B Villa Listing',
      owner: userB._id,
      category: 'Residential',
      listingFor: 'Rent',
      propertyType: 'Villa',
      price: 85000,
      city: 'Noida',
      locality: 'Sector 150',
      fullAddress: 'Villa 12, Sector 150, Noida',
      pincode: '201310',
      carpetArea: 3200,
      approvalStatus: 'approved',
      isLive: true,
      allowTokenBooking: true,
      tokenAmount: 5000,
    });

    console.log(`Created Property A (Owner User A): ${propA._id}`);
    console.log(`Created Property B (Owner User B): ${propB._id}`);

    // --- TEST 1: Public Feed without Auth (Should return both properties) ---
    console.log('\n--- TEST 1: Public Feed without Auth ---');
    const publicRes = await fetch(`${BASE_URL}/properties?city=Noida`);
    const publicData = await publicRes.json();
    const publicIds = (publicData.data?.properties || []).map((p) => p._id.toString());
    console.log('Public feed property count:', publicIds.length);
    if (!publicIds.includes(propA._id.toString()) || !publicIds.includes(propB._id.toString())) {
      console.error('❌ FAIL: Public feed should contain both properties for guest');
      process.exit(1);
    }
    console.log('✅ PASS: Public feed contains both properties.');

    // --- TEST 2: Feed with User A Auth (Should EXCLUDE Prop A, but show Prop B) ---
    console.log('\n--- TEST 2: Feed with User A Bearer Token ---');
    const userARes = await fetch(`${BASE_URL}/properties?city=Noida`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const userAData = await userARes.json();
    const userAIds = (userAData.data?.properties || []).map((p) => p._id.toString());
    console.log('User A feed property IDs:', userAIds);
    if (userAIds.includes(propA._id.toString())) {
      console.error('❌ FAIL: User A should NOT see their own listed property in the feed!');
      process.exit(1);
    }
    if (!userAIds.includes(propB._id.toString())) {
      console.error('❌ FAIL: User A should see User B property in the feed!');
      process.exit(1);
    }
    console.log('✅ PASS: User A feed successfully hides own listed property!');

    // --- TEST 3: Feed with User A latest & verified endpoints ---
    console.log('\n--- TEST 3: Latest & Verified Feed with User A Bearer Token ---');
    const latestRes = await fetch(`${BASE_URL}/properties/latest?city=Noida`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const latestData = await latestRes.json();
    const latestIds = (latestData.data?.properties || []).map((p) => p._id.toString());
    if (latestIds.includes(propA._id.toString())) {
      console.error('❌ FAIL: Latest feed should NOT contain own property');
      process.exit(1);
    }
    console.log('✅ PASS: /properties/latest hides own property.');

    // --- TEST 4: Query param ?userId=<userAId> without Bearer Token ---
    console.log('\n--- TEST 4: Query param ?userId=<userAId> fallback ---');
    const queryExcludeRes = await fetch(`${BASE_URL}/properties?city=Noida&userId=${userA._id}`);
    const queryExcludeData = await queryExcludeRes.json();
    const queryExcludeIds = (queryExcludeData.data?.properties || []).map((p) => p._id.toString());
    if (queryExcludeIds.includes(propA._id.toString())) {
      console.error('❌ FAIL: ?userId= fallback should exclude own property');
      process.exit(1);
    }
    console.log('✅ PASS: ?userId= fallback successfully excludes own property.');

    // --- TEST 5: User A attempts to book own property (Must be BLOCKED with 400) ---
    console.log('\n--- TEST 5: User A attempts to book own property ---');
    const selfBookRes = await fetch(`${BASE_URL}/user/token-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        propertyId: propA._id,
        tokenAmount: 2000,
      }),
    });
    const selfBookData = await selfBookRes.json();
    console.log('Self-book response status:', selfBookRes.status, 'Message:', selfBookData.message);
    if (selfBookRes.status !== 400 || !selfBookData.message.includes('own property')) {
      console.error('❌ FAIL: Self-booking should return 400 with own property warning:', selfBookData);
      process.exit(1);
    }
    console.log('✅ PASS: User A was strictly blocked from booking their own property!');

    // --- TEST 6: Guest attempts to book User A property with User A's phone number ---
    console.log('\n--- TEST 6: Guest with User A phone number attempts to book ---');
    const guestMatchRes = await fetch(`${BASE_URL}/user/token-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: propA._id,
        phone: userA.phone,
        name: 'Impersonator or Owner Guest',
      }),
    });
    const guestMatchData = await guestMatchRes.json();
    console.log('Guest match response status:', guestMatchRes.status, 'Message:', guestMatchData.message);
    if (guestMatchRes.status !== 400 || !guestMatchData.message.includes('own property')) {
      console.error('❌ FAIL: Guest with matching owner phone should be blocked');
      process.exit(1);
    }
    console.log('✅ PASS: Owner phone match was blocked from booking!');

    // --- TEST 7: Token config for own property shows canBook: false, isOwner: true ---
    console.log('\n--- TEST 7: Token Config for Own Property ---');
    const configRes = await fetch(`${BASE_URL}/properties/${propA._id}/token-config`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const configData = await configRes.json();
    console.log('Token config isOwner:', configData.data?.isOwner, 'canBook:', configData.data?.canBook);
    if (!configData.data?.isOwner || configData.data?.canBook !== false) {
      console.error('❌ FAIL: Config for owner must have isOwner: true, canBook: false:', configData);
      process.exit(1);
    }
    console.log('✅ PASS: Token config correctly marks isOwner: true and canBook: false!');

    // --- TEST 8: User B books User A property (Valid booking, must SUCCEED) ---
    console.log('\n--- TEST 8: User B books User A property (Must Succeed) ---');
    const validBookRes = await fetch(`${BASE_URL}/user/token-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        propertyId: propA._id,
        tokenAmount: 2000,
      }),
    });
    const validBookData = await validBookRes.json();
    console.log('Valid book response status:', validBookRes.status, 'Message:', validBookData.message);
    if (validBookRes.status !== 201) {
      console.error('❌ FAIL: User B should be able to book User A property:', validBookData);
      process.exit(1);
    }
    console.log('✅ PASS: User B successfully booked User A property!');

    // Cleanup
    await TokenRequest.deleteMany({ property: propA._id });
    await Property.deleteMany({ _id: { $in: [propA._id, propB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });

    console.log('\n======================================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! Everything working!');
    console.log('======================================================');
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  } finally {
    if (server) server.close();
  }
};

run();
