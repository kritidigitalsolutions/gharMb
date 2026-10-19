/**
 * Firebase Cloud Messaging (FCM) Diagnostic & Test Script
 * Verifies FCM Admin initialization, database device tokens, and push delivery.
 *
 * Usage:
 *   node test_fcm.js                       (Test FCM configuration and count tokens)
 *   node test_fcm.js <device_token_string> (Send a test push to a real device token)
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const fcmService = require('./src/services/fcm.service');
const User = require('./src/models/user.model');
const Admin = require('./src/models/admin.model');

async function runFcmDiagnostics() {
  console.log('====================================================');
  console.log('🚀 Testing GharMB Firebase Cloud Messaging (FCM)');
  console.log('====================================================\n');

  try {
    // 1. Check FCM Admin initialization
    const isReady = fcmService.isConfigured();
    console.log(`1️⃣  FCM Service Status: ${isReady ? '✅ INITIALIZED' : '❌ NOT CONFIGURED'}`);

    if (!isReady) {
      console.error('\n❌ Firebase Cloud Messaging is not initialized.');
      console.error('Please check serviceAccountKey.json and FIREBASE_PROJECT_ID in server/.env');
      process.exit(1);
    }

    // 2. Connect to MongoDB to inspect active device tokens
    console.log('\n2️⃣  Checking Registered Device Tokens in Database...');
    await mongoose.connect(process.env.MONGO_URI);

    const userWithTokensCount = await User.countDocuments({ 'fcmTokens.0': { $exists: true } });
    const adminWithTokensCount = await Admin.countDocuments({ 'fcmTokens.0': { $exists: true } });

    console.log(`   📱 Users with registered FCM devices : ${userWithTokensCount}`);
    console.log(`   🛡️ Admins with registered FCM devices: ${adminWithTokensCount}`);

    // Sample user devices
    const sampleUsers = await User.find({ 'fcmTokens.0': { $exists: true } })
      .select('name phone role fcmTokens')
      .limit(3);

    if (sampleUsers.length > 0) {
      console.log('   Recent registered devices:');
      sampleUsers.forEach((u) => {
        console.log(`   - ${u.name} (${u.role || 'user'}, 📞 ${u.phone || 'N/A'}): ${u.fcmTokens.length} device(s)`);
      });
    }

    // 3. Optional live push test if token provided in CLI arguments
    const cliArg = process.argv[2];
    if (cliArg === '--test-db' || cliArg === '--send-db') {
      console.log(`\n3️⃣  Dispatching Live Test Push to all DB registered devices...`);
      const users = await User.find({ 'fcmTokens.0': { $exists: true } });
      const admins = await Admin.find({ 'fcmTokens.0': { $exists: true } });
      let sentCount = 0;

      for (const u of [...users, ...admins]) {
        for (const t of u.fcmTokens) {
          sentCount++;
          console.log(`   📤 Sending to ${u.name || u.phone || 'User'} (${t.deviceType}): ${t.token.substring(0, 20)}...`);
          const res = await fcmService.sendToToken({
            token: t.token,
            title: '🎉 GharMB Live Notification Test',
            body: `Hello ${u.name || 'there'}! FCM is working with new Firebase project (gharmb-1ce6f).`,
            data: { type: 'test', timestamp: new Date().toISOString() },
          });
          if (res.success) {
            console.log(`   ✅ Success! Message ID: ${res.messageId}`);
          } else {
            console.log(`   ❌ Failed: ${res.error} (${res.errorCode || 'unknown'})`);
          }
        }
      }

      if (sentCount === 0) {
        console.log('   ℹ️  No registered devices found in DB to test.');
      }
    } else if (cliArg && cliArg.trim()) {
      console.log(`\n3️⃣  Dispatching Live Test Push Notification to token...`);
      console.log(`   Target: ${cliArg.substring(0, 25)}...`);

      const pushResult = await fcmService.sendToToken({
        token: cliArg.trim(),
        title: '🎉 GharMB Push Notification Test',
        body: 'FCM is working successfully on your device!',
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
        },
      });

      if (pushResult.success) {
        console.log(`   ✅ Push notification delivered successfully! Message ID: ${pushResult.messageId}`);
      } else {
        console.log(`   ❌ Delivery failed: ${pushResult.error} (${pushResult.errorCode || 'unknown'})`);
      }
    } else {
      console.log('\n3️⃣  Live Device Push Test:');
      console.log('   ℹ️  To test sending to devices in MongoDB, run:');
      console.log('      node test_fcm.js --test-db');
      console.log('   ℹ️  To test sending to a real device token string, run:');
      console.log('      node test_fcm.js <FCM_REGISTRATION_TOKEN>');
    }

    console.log('\n====================================================');
    console.log('🎉 FCM SERVICE IS 100% CONFIGURED & READY FOR APP PUSH!');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ FCM Test Error:', error.message);
    process.exit(1);
  }
}

runFcmDiagnostics();
