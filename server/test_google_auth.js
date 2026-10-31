const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

async function testAuth() {
  try {
    const credPath = path.join(__dirname, 'src/config/firebaseCredentials.json');
    console.log('Testing credentials at:', credPath);
    const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));

    const auth = new GoogleAuth({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/devstorage.full_control'],
    });

    const client = await auth.getClient();
    console.log('Acquiring access token from Google...');
    const tokenResponse = await client.getAccessToken();
    console.log('✅ Access Token acquired successfully! Token length:', tokenResponse.token ? tokenResponse.token.length : 0);
  } catch (err) {
    console.error('❌ Google Auth Error:', err.message);
    if (err.response && err.response.data) {
      console.error('Error details:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

testAuth();
