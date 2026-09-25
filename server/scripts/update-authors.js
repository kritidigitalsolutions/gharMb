const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Blog = require('../src/models/blog.model');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gharmb';

async function updateAuthors() {
  try {
    await mongoose.connect(MONGO_URI);
    const blogs = await Blog.find({ author: { $regex: /Editorial/i } });
    for (const blog of blogs) {
      blog.author = blog.author.replace(/Editorial/gi, '').trim();
      await blog.save();
    }
    console.log('Authors updated.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

updateAuthors();
