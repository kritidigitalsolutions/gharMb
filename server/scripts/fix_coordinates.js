const mongoose = require('mongoose');
require('dotenv').config();
const Property = require('../src/models/property.model');

const CITY_COORDS = {
  noida: [77.3910, 28.5355],
  agra: [78.0081, 27.1767],
  agar: [78.0081, 27.1767],
  delhi: [77.2090, 28.6139],
  'new delhi': [77.2090, 28.6139],
  gurgaon: [77.0266, 28.4595],
  gurugram: [77.0266, 28.4595],
  ghaziabad: [77.4538, 28.6692],
  faridabad: [77.3178, 28.4089],
  mumbai: [72.8777, 19.0760],
  pune: [73.8567, 18.5204],
  bangalore: [77.5946, 12.9716],
  bengaluru: [77.5946, 12.9716],
  hyderabad: [78.4867, 17.3850],
  kolkata: [88.3639, 22.5726],
  chennai: [80.2707, 13.0827],
  ahmedabad: [72.5714, 23.0225],
  jaipur: [75.7873, 26.9124],
  lucknow: [80.9462, 26.8467],
  chandigarh: [76.7794, 30.7333],
  meerut: [77.7064, 28.9845],
};

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  const properties = await Property.find({});
  console.log(`Found ${properties.length} total properties.`);

  for (const p of properties) {
    const cityName = (p.city || '').toLowerCase().trim();
    const coords = CITY_COORDS[cityName] || [77.3910, 28.5355];

    const isMumbaiDefault = p.location && p.location.coordinates &&
      p.location.coordinates[0] === 72.8561 && p.location.coordinates[1] === 19.2812 && cityName !== 'mumbai';

    if (!p.location || !p.location.coordinates || p.location.coordinates.length < 2 || isMumbaiDefault) {
      await Property.collection.updateOne(
        { _id: p._id },
        {
          $set: {
            location: {
              type: 'Point',
              coordinates: coords,
            },
          },
        }
      );
      console.log(`Updated property: "${p.title}" (City: ${p.city}) with coordinates:`, coords);
    }
  }

  const live = await Property.find({ approvalStatus: 'approved', isLive: true }).lean();
  console.log('\nApproved & Live properties now:');
  live.forEach((u) => {
    console.log(`- Title: "${u.title}", City: "${u.city}", Coords: [${u.location.coordinates.join(', ')}]`);
  });

  // Verify the exact query from user's Flutter request:
  // city=Agra&lat=27.1766701&lng=78.00807449999999&radius=50.0&radiusUnit=km
  const agraLat = 27.1766701;
  const agraLng = 78.00807449999999;
  const maxDistanceInMeters = 50 * 1000;

  const testQuery = {
    approvalStatus: 'approved',
    isLive: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [agraLng, agraLat],
        },
        $maxDistance: maxDistanceInMeters,
      },
    },
  };

  const results = await Property.find(testQuery);
  console.log(`\nTest near-me query for Agra (within 50 km) returned: ${results.length} properties!`);
  results.forEach(r => console.log(`  -> Found: "${r.title}" in ${r.city} (${r.locality})`));

  await mongoose.disconnect();
}

fix().catch(console.error);
