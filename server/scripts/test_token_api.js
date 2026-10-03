const fetch = globalThis.fetch;

const BASE_URL = 'http://localhost:5001';

async function runTest() {
  console.log('--- Testing Token Booking APIs ---');

  // 1. Test public token config endpoint
  try {
    const resConfig = await fetch(`${BASE_URL}/api/tokens/config`);
    const dataConfig = await resConfig.json();
    console.log('1. GET /api/tokens/config status:', resConfig.status, dataConfig);
  } catch (e) {
    console.error('Failed test 1:', e.message);
  }

  // 2. Admin Login to test Admin Token API
  let adminToken = '';
  try {
    const resLogin = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' })
    });
    const dataLogin = await resLogin.json();
    adminToken = dataLogin.token || dataLogin.data?.token;
    console.log('2. Admin login status:', resLogin.status, 'Has token:', !!adminToken);
  } catch (e) {
    console.error('Admin login error:', e.message);
  }

  if (adminToken) {
    // 3. Test GET /api/admin/tokens/settings
    try {
      const resSettings = await fetch(`${BASE_URL}/api/admin/tokens/settings`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const dataSettings = await resSettings.json();
      console.log('3. GET /api/admin/tokens/settings:', dataSettings.status, dataSettings.data?.settings?.tokenAmounts);
    } catch (e) {
      console.error('Failed test 3:', e.message);
    }

    // 4. Test PATCH /api/admin/tokens/settings (Setting token amounts by admin)
    try {
      const resUpdateSettings = await fetch(`${BASE_URL}/api/admin/tokens/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          tokenAmounts: [2000, 5000],
          defaultTokenAmount: 2000,
          adjustmentNote: "Token amount will be adjusted in security deposit or first month's rent"
        })
      });
      const dataUpdate = await resUpdateSettings.json();
      console.log('4. PATCH /api/admin/tokens/settings (set by admin):', dataUpdate.status, dataUpdate.data?.settings?.tokenAmounts);
    } catch (e) {
      console.error('Failed test 4:', e.message);
    }

    // 5. Test GET /api/admin/tokens
    try {
      const resTokens = await fetch(`${BASE_URL}/api/admin/tokens`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const dataTokens = await resTokens.json();
      console.log('5. GET /api/admin/tokens status:', resTokens.status, 'Count:', dataTokens.data?.tokens?.length, 'Stats:', dataTokens.data?.stats);
    } catch (e) {
      console.error('Failed test 5:', e.message);
    }
  }
}

runTest();
