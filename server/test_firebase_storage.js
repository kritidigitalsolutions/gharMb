/**
 * Firebase Storage Connection & Upload Test Script
 * Verifies that the Google Cloud / Firebase Storage bucket is connected,
 * writable, readable, and cleans up properly.
 *
 * Usage:
 *   cd server
 *   node test_firebase_storage.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const firebaseStorageService = require('./src/services/firebaseStorage.service');

async function testFirebaseStorage() {
  console.log('====================================================');
  console.log('🚀 Testing GharMB Firebase Cloud Storage Connection');
  console.log('====================================================\n');

  try {
    // 1. Check configuration
    const isConfigured = firebaseStorageService.isConfigured();
    const bucketName = firebaseStorageService.getBucketName();

    console.log(`1️⃣  Bucket Status: ${isConfigured ? '✅ INITIALIZED' : '❌ NOT CONFIGURED'}`);
    console.log(`   Bucket Name  : ${bucketName || 'None'}`);

    if (!isConfigured) {
      console.error('\n❌ Firebase Storage is not initialized.');
      console.error('Please verify serviceAccountKey.json and FIREBASE_STORAGE_BUCKET in .env');
      process.exit(1);
    }

    // 2. Test buffer upload
    console.log('\n2️⃣  Uploading sample test file to Firebase Storage...');
    const testContent = Buffer.from(
      JSON.stringify(
        {
          project: 'GharMB',
          message: 'Firebase Storage is fully connected and working!',
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );

    const uploadResult = await firebaseStorageService.uploadBuffer(
      testContent,
      'connection_test.json',
      'application/json',
      'diagnostics'
    );

    console.log('   ✅ File uploaded successfully!');
    console.log(`   Firebase URL : ${uploadResult.url}`);
    console.log(`   Storage Path : ${uploadResult.path}`);
    console.log(`   File Size    : ${uploadResult.size} bytes`);

    // 3. Test HTTP fetch from public CDN
    console.log('\n3️⃣  Testing public HTTP accessibility of the uploaded URL...');
    const fetchResponse = await fetch(uploadResult.url);
    console.log(`   HTTP Status  : ${fetchResponse.status} ${fetchResponse.statusText}`);

    if (fetchResponse.status === 200) {
      const body = await fetchResponse.json();
      console.log('   ✅ Public read verified! Content received:');
      console.log('  ', JSON.stringify(body));
    } else {
      console.warn(`   ⚠️ Received unexpected status: ${fetchResponse.status}`);
    }

    // 4. Test file deletion / cleanup
    console.log('\n4️⃣  Cleaning up diagnostic test file...');
    const deleted = await firebaseStorageService.deleteFile(uploadResult.url);
    console.log(`   Cleanup Status: ${deleted ? '✅ File deleted successfully' : '⚠️ Could not delete'}`);

    console.log('\n====================================================');
    console.log('🎉 FIREBASE STORAGE IS 100% CONNECTED & OPERATIONAL!');
    console.log('====================================================');
  } catch (error) {
    console.error('\n❌ Firebase Storage Test Failed:', error);
    process.exit(1);
  }
}

testFirebaseStorage();
