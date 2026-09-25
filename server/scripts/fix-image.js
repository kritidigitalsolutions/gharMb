const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  await db.collection('blogs').updateOne(
    { slug: 'sustainable-living-spaces' },
    { $set: { bannerImage: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1000&h=600&fit=crop' } }
  );
  console.log('Fixed image');
  process.exit(0);
});
