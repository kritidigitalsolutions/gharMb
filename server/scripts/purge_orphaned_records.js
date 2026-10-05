const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function purgeOrphans() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is missing!');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB successfully.');
  const db = mongoose.connection.db;

  const users = await db.collection('users').find({}).toArray();
  const validUserIds = users.map(u => u._id);
  console.log('Total valid users in DB:', validUserIds.length);

  // 1. Purge orphaned properties whose owner is missing or no longer exists in users
  const propRes = await db.collection('properties').deleteMany({
    $or: [
      { owner: { $exists: false } },
      { owner: null },
      { owner: { $nin: validUserIds } }
    ]
  });
  console.log('Deleted orphaned properties:', propRes.deletedCount);

  // 2. Fetch remaining valid property IDs
  const validProps = await db.collection('properties').find({}).toArray();
  const validPropIds = validProps.map(p => p._id);
  console.log('Remaining valid properties in DB:', validPropIds.length);

  // 3. Purge orphaned projects whose developer is missing or no longer exists in users
  const projRes = await db.collection('projects').deleteMany({
    $or: [
      { developer: { $exists: false } },
      { developer: null },
      { developer: { $nin: validUserIds } }
    ]
  });
  console.log('Deleted orphaned projects:', projRes.deletedCount);

  const validProjs = await db.collection('projects').find({}).toArray();
  const validProjIds = validProjs.map(p => p._id);

  // 4. Purge orphaned token requests
  const tokenRes = await db.collection('tokenrequests').deleteMany({
    $or: [
      { property: { $nin: validPropIds } },
      { buyer: { $exists: true, $nin: [...validUserIds, null, undefined] } },
      { seller: { $exists: true, $nin: [...validUserIds, null, undefined] } }
    ]
  });
  console.log('Deleted orphaned token requests:', tokenRes.deletedCount);

  // 5. Purge orphaned visit requests
  const visitRes = await db.collection('visitrequests').deleteMany({
    $or: [
      { property: { $nin: validPropIds } },
      { user: { $nin: validUserIds } }
    ]
  });
  console.log('Deleted orphaned visit requests:', visitRes.deletedCount);

  // 6. Purge orphaned developer enquiries
  const devEnqRes = await db.collection('developerenquiries').deleteMany({
    $or: [
      { client: { $nin: validUserIds } },
      { developer: { $nin: validUserIds } },
      { project: { $exists: true, $nin: [...validProjIds, null, undefined] } }
    ]
  });
  console.log('Deleted orphaned developer enquiries:', devEnqRes.deletedCount);

  // 7. Purge orphaned property enquiries
  const propEnqRes = await db.collection('propertyenquiries').deleteMany({
    $or: [
      { property: { $nin: validPropIds } },
      { client: { $exists: true, $nin: [...validUserIds, null, undefined] } }
    ]
  });
  console.log('Deleted orphaned property enquiries:', propEnqRes.deletedCount);

  // 8. Purge orphaned favorites
  const favRes = await db.collection('favorites').deleteMany({
    $or: [
      { user: { $nin: validUserIds } },
      { property: { $nin: validPropIds } }
    ]
  });
  console.log('Deleted orphaned favorites:', favRes.deletedCount);

  // 9. Purge orphaned notifications
  const notifRes = await db.collection('notifications').deleteMany({
    $or: [
      { recipient: { $nin: validUserIds } }
    ]
  });
  console.log('Deleted orphaned notifications:', notifRes.deletedCount);

  // 10. Purge orphaned developer reviews
  const revRes = await db.collection('developerreviews').deleteMany({
    $or: [
      { user: { $nin: validUserIds } },
      { developer: { $nin: validUserIds } }
    ]
  });
  console.log('Deleted orphaned developer reviews:', revRes.deletedCount);

  console.log('\n--- VERIFICATION AFTER PURGE ---');
  console.log('Total properties remaining:', await db.collection('properties').countDocuments());
  console.log('Total projects remaining:', await db.collection('projects').countDocuments());
  console.log('Total tokenrequests remaining:', await db.collection('tokenrequests').countDocuments());
  console.log('Total visitrequests remaining:', await db.collection('visitrequests').countDocuments());
  console.log('Total notifications remaining:', await db.collection('notifications').countDocuments());
  console.log('Total users remaining:', await db.collection('users').countDocuments());

  await mongoose.disconnect();
  console.log('Done!');
}

purgeOrphans().catch(err => {
  console.error('Error purging orphans:', err);
  process.exit(1);
});
