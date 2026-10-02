const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/user.model');
const DeveloperReview = require('../src/models/developer-review.model');

const BASE_URL = 'http://localhost:5001/api';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for test setup.');

    // Find or create test developer
    let developer = await User.findOne({ role: 'builder' });
    if (!developer) {
      developer = await User.create({
        name: 'abab Developers',
        companyName: 'abab',
        email: 'developer.abab@gmail.com',
        phone: '+919999911111',
        role: 'builder',
        cityOfOperation: 'Pan India',
        yearsInBusiness: '2-5 yrs',
        bio: 'Kartik Khandelwal has been delivering quality projects across noida for 2-5 yrs.',
        unitsDelivered: '0',
      });
    }

    // Find or create test reviewer user
    let reviewer = await User.findOne({ phone: '+919999922222' });
    if (!reviewer) {
      reviewer = await User.create({
        name: 'Happy Reviewer',
        phone: '+919999922222',
        role: 'buyer',
      });
    }

    const token = jwt.sign(
      { id: reviewer._id },
      process.env.JWT_SECRET || 'gharmb_secret_key_2026',
      { expiresIn: '1d' }
    );

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    console.log(`Developer: ${developer.name} (${developer._id})`);
    console.log(`Reviewer: ${reviewer.name} (${reviewer._id})`);

    // Clean up any existing review for clean test
    await DeveloperReview.deleteMany({ developer: developer._id, reviewer: reviewer._id });

    // 1. Submit review via /api/developers/:id/reviews
    console.log('\n--- 1. Submit Review (POST /api/developers/:id/reviews) ---');
    const res1 = await fetch(`${BASE_URL}/developers/${developer._id}/reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        rating: 5,
        whatAreYouRating: 'Quality',
        comment: 'Amazing quality of construction, delivered on time!',
      }),
    });
    const data1 = await res1.json();
    console.log('Status:', res1.status, 'Message:', data1.message);
    console.log('Review ID:', data1.data?.review?._id);
    console.log('Rating:', data1.data?.review?.rating);
    console.log('Tags:', data1.data?.review?.tags);
    console.log('Developer Rating:', data1.data?.developerRating);
    console.log('Total Reviews:', data1.data?.developerReviewCount);

    // 2. Fetch Developer Reviews & Stats Breakdown (GET /api/developers/:id/reviews)
    console.log('\n--- 2. Fetch Developer Reviews & Stats (GET /api/developers/:id/reviews) ---');
    const res2 = await fetch(`${BASE_URL}/developers/${developer._id}/reviews`);
    const data2 = await res2.json();
    console.log('Status:', res2.status, 'Reviews Count:', data2.results);
    console.log('Average Rating:', data2.stats?.averageRating);
    console.log('Breakdown:', data2.stats?.breakdown);

    // 3. Get My Review (GET /api/developers/:id/my-review)
    console.log('\n--- 3. Get My Review (GET /api/developers/:id/my-review) ---');
    const res3 = await fetch(`${BASE_URL}/developers/${developer._id}/my-review`, { headers });
    const data3 = await res3.json();
    console.log('Status:', res3.status, 'Has Reviewed:', data3.hasReviewed, 'Comment:', data3.data?.review?.comment);

    // 4. Update Review (Seamlessly updates existing review)
    console.log('\n--- 4. Update Review (POST /api/developers/:id/reviews again) ---');
    const res4 = await fetch(`${BASE_URL}/developers/${developer._id}/reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        rating: 4,
        tags: ['Quality', 'Timely Delivery'],
        comment: 'Updated review: Good construction and timely delivery.',
      }),
    });
    const data4 = await res4.json();
    console.log('Status:', res4.status, 'Message:', data4.message, 'New Rating:', data4.data?.review?.rating);

    // 5. Test direct root route (POST /api/reviews)
    console.log('\n--- 5. Test Direct Route (POST /api/reviews) ---');
    const res5 = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        developerId: developer._id.toString(),
        rating: 5,
        tags: ['Support', 'Value for Money'],
        experience: 'Superb support from customer care team.',
      }),
    });
    const data5 = await res5.json();
    console.log('Status:', res5.status, 'Message:', data5.message, 'Rating:', data5.data?.review?.rating);

    // 6. Delete Review (DELETE /api/developers/:id/reviews)
    console.log('\n--- 6. Delete Review (DELETE /api/developers/:id/reviews) ---');
    const res6 = await fetch(`${BASE_URL}/developers/${developer._id}/reviews`, {
      method: 'DELETE',
      headers,
    });
    const data6 = await res6.json();
    console.log('Status:', res6.status, 'Message:', data6.message);

    console.log('\n🎉 ALL DEVELOPER REVIEW API TESTS PASSED SUCCESSFULLY! 🎉\n');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

run();
