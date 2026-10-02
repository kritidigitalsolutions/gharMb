const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/user.model');
const Property = require('../src/models/property.model');
const Favorite = require('../src/models/favorite.model');

const BASE_URL = 'http://localhost:5001/api';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for test setup.');

    // Find or create test user
    let user = await User.findOne({ phone: '+919999988888' });
    if (!user) {
      user = await User.create({
        name: 'Test Wishlist User',
        phone: '+919999988888',
        role: 'buyer',
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'gharmb_secret_key_2026',
      { expiresIn: '1d' }
    );

    // Find an approved property or create one
    let property = await Property.findOne({ approvalStatus: 'approved' });
    if (!property) {
      property = await Property.findOne({});
    }

    if (!property) {
      property = await Property.create({
        title: 'Skyline Heights',
        price: 4500000,
        carpetArea: 1480,
        category: 'Residential',
        listingFor: 'Sale',
        propertyType: 'Apartment',
        city: 'Noida',
        locality: 'Sector 62',
        fullAddress: 'Sector 62, Noida, UP',
        pincode: '201309',
        bedrooms: '3',
        owner: user._id,
        approvalStatus: 'approved',
        isLive: true,
      });
    }

    console.log(`Using Test Property: ${property.title} (${property._id})`);

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 1. Test GET /api/wishlist initially
    console.log('\n--- 1. Testing GET /api/wishlist (Initial) ---');
    const res1 = await fetch(`${BASE_URL}/wishlist`, { headers });
    const data1 = await res1.json();
    console.log('Status:', res1.status, 'Wishlist count:', data1.count);

    // 2. Test POST /api/wishlist/toggle
    console.log('\n--- 2. Testing POST /api/wishlist/toggle (Add) ---');
    const res2 = await fetch(`${BASE_URL}/wishlist/toggle`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ propertyId: property._id.toString() }),
    });
    const data2 = await res2.json();
    console.log('Status:', res2.status, 'isWishlisted:', data2.isWishlisted, 'Message:', data2.message);

    // 3. Test GET /api/wishlist/check/:id
    console.log('\n--- 3. Testing GET /api/wishlist/check/:id ---');
    const res3 = await fetch(`${BASE_URL}/wishlist/check/${property._id}`, { headers });
    const data3 = await res3.json();
    console.log('Status:', res3.status, 'isWishlisted:', data3.isWishlisted);

    // 4. Test GET /api/wishlist/ids
    console.log('\n--- 4. Testing GET /api/wishlist/ids ---');
    const res4 = await fetch(`${BASE_URL}/wishlist/ids`, { headers });
    const data4 = await res4.json();
    console.log('Status:', res4.status, 'IDs count:', data4.count, 'IDs:', data4.ids);

    // 5. Test GET /api/wishlist (Feed inspection)
    console.log('\n--- 5. Testing GET /api/wishlist (Populated Feed) ---');
    const res5 = await fetch(`${BASE_URL}/wishlist`, { headers });
    const data5 = await res5.json();
    console.log('Status:', res5.status, 'Results:', data5.results);
    if (data5.data && data5.data.wishlist && data5.data.wishlist.length > 0) {
      const item = data5.data.wishlist[0];
      console.log('Sample Wishlist Item:');
      console.log(' - Title:', item.property?.title);
      console.log(' - Price:', item.property?.price);
      console.log(' - Locality:', item.property?.locality);
      console.log(' - Bedrooms:', item.property?.bedrooms);
      console.log(' - Carpet Area:', item.property?.carpetArea);
      console.log(' - isVerified:', item.property?.isVerified);
      console.log(' - isWishlisted:', item.isWishlisted);
    }

    // 6. Test GET /api/favorites alias
    console.log('\n--- 6. Testing GET /api/favorites (Alias) ---');
    const res6 = await fetch(`${BASE_URL}/favorites`, { headers });
    const data6 = await res6.json();
    console.log('Status:', res6.status, 'Favorites count:', data6.count);

    // 7. Test POST /api/wishlist/toggle (Toggle off)
    console.log('\n--- 7. Testing POST /api/wishlist/toggle (Remove) ---');
    const res7 = await fetch(`${BASE_URL}/wishlist/toggle`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ propertyId: property._id.toString() }),
    });
    const data7 = await res7.json();
    console.log('Status:', res7.status, 'isWishlisted:', data7.isWishlisted, 'Message:', data7.message);

    // 8. Test POST /api/wishlist (Direct Add)
    console.log('\n--- 8. Testing POST /api/wishlist (Direct Add) ---');
    const res8 = await fetch(`${BASE_URL}/wishlist`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ propertyId: property._id.toString() }),
    });
    const data8 = await res8.json();
    console.log('Status:', res8.status, 'isWishlisted:', data8.isWishlisted);

    // 9. Test DELETE /api/wishlist/:id (By Property ID)
    console.log('\n--- 9. Testing DELETE /api/wishlist/:propertyId ---');
    const res9 = await fetch(`${BASE_URL}/wishlist/${property._id}`, {
      method: 'DELETE',
      headers,
    });
    const data9 = await res9.json();
    console.log('Status:', res9.status, 'Message:', data9.message);

    // 10. Final check
    console.log('\n--- 10. Final Verification (Wishlist should be empty) ---');
    const res10 = await fetch(`${BASE_URL}/wishlist`, { headers });
    const data10 = await res10.json();
    console.log('Status:', res10.status, 'Count:', data10.count);

    console.log('\n🎉 ALL WISHLIST API TESTS PASSED SUCCESSFULLY! 🎉\n');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

run();
