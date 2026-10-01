const BASE_URL = 'http://localhost:5001/api';

const api = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
};

async function testKeyHandoverFlow() {
  console.log('🚀 Starting Key Handover API Test Suite...\n');

  try {
    // 1. Admin Login
    console.log('1️⃣ Logging in as Admin...');
    const adminRes = await api('/admin/auth/login', {
      method: 'POST',
      body: { email: 'admin@gmail.com', password: 'admin123' },
    });
    if (!adminRes.ok) throw new Error('Admin login failed: ' + JSON.stringify(adminRes.data));
    const adminToken = adminRes.data.token;
    console.log('✅ Admin login successful.');

    // 2. Register Owner + Verify OTP
    console.log('\n2️⃣ Registering test Property Owner with OTP...');
    const timestamp = Date.now().toString().slice(-6);
    const ownerPhone = `9700${timestamp}`;
    const regOwnerRes = await api('/user/auth/register', {
      method: 'POST',
      body: {
        name: `Key Handover Owner ${timestamp}`,
        phone: ownerPhone,
        email: `owner${timestamp}@test.com`,
      },
    });
    if (!regOwnerRes.ok) throw new Error('Owner registration failed: ' + JSON.stringify(regOwnerRes.data));

    const ownerOtp = regOwnerRes.data.otp;
    const verifyOwnerRes = await api('/user/auth/verify-otp', {
      method: 'POST',
      body: {
        phone: ownerPhone,
        otp: ownerOtp,
      },
    });
    if (!verifyOwnerRes.ok) throw new Error('Owner OTP verification failed: ' + JSON.stringify(verifyOwnerRes.data));

    const ownerToken = verifyOwnerRes.data.token;
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
    console.log('✅ Owner registered & verified. Token acquired.');

    // 3. Create Property with keyHandover = true
    console.log('\n3️⃣ Creating property listing with keyHandover = true...');
    const createPropRes = await api('/properties', {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        listingAs: 'Owner',
        category: 'Residential',
        listingFor: 'Sale',
        propertyType: 'Apartment',
        title: `Key Handover Luxury Flat ${timestamp}`,
        city: 'Mumbai',
        locality: 'Andheri West',
        fullAddress: 'Tower 4, Prime Residency, Andheri West',
        pincode: '400053',
        description: 'Ready to move flat with immediate key handover.',
        bedrooms: '3',
        carpetArea: 1200,
        price: 18500000,
        vastuCompliant: true,
        keyHandover: true,
        openToAllBuyers: true,
        loanAssistanceNeeded: true,
      },
    });

    if (!createPropRes.ok) {
      throw new Error('Property creation failed: ' + JSON.stringify(createPropRes.data));
    }

    const property = createPropRes.data.data.property;
    const propertyId = property._id;
    console.log(`✅ Property created successfully! ID: ${propertyId}`);
    console.log(`   Initial keyHandover value: ${property.keyHandover} (Expected: true)`);
    if (property.keyHandover !== true) {
      throw new Error(`Expected keyHandover to be true, got ${property.keyHandover}`);
    }

    // 4. Test PATCH /api/properties/:id/key-handover (Toggle to false)
    console.log('\n4️⃣ Testing PATCH /api/properties/:id/key-handover (Toggle)...');
    const toggleRes1 = await api(`/properties/${propertyId}/key-handover`, {
      method: 'PATCH',
      headers: ownerHeaders,
      body: {}, // No body, should toggle from true -> false
    });

    if (!toggleRes1.ok) {
      throw new Error('Key handover toggle failed: ' + JSON.stringify(toggleRes1.data));
    }
    console.log(`✅ Toggled successfully: keyHandover is now ${toggleRes1.data.data.keyHandover} (Expected: false)`);
    if (toggleRes1.data.data.keyHandover !== false) {
      throw new Error(`Expected false after toggle, got ${toggleRes1.data.data.keyHandover}`);
    }

    // 5. Test PATCH /api/properties/:id/key-handover with explicit body { keyHandover: true }
    console.log('\n5️⃣ Testing PATCH /api/properties/:id/key-handover with explicit body { keyHandover: true }...');
    const toggleRes2 = await api(`/properties/${propertyId}/key-handover`, {
      method: 'PATCH',
      headers: ownerHeaders,
      body: { keyHandover: true },
    });

    if (!toggleRes2.ok) {
      throw new Error('Explicit key handover update failed: ' + JSON.stringify(toggleRes2.data));
    }
    console.log(`✅ Explicit update successful: keyHandover is now ${toggleRes2.data.data.keyHandover} (Expected: true)`);
    if (toggleRes2.data.data.keyHandover !== true) {
      throw new Error(`Expected true after explicit set, got ${toggleRes2.data.data.keyHandover}`);
    }

    // 6. Admin approves property so it becomes live and searchable
    console.log('\n6️⃣ Admin approving property to test public search filters...');
    const approveRes = await api(`/admin/properties/${propertyId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { approvalStatus: 'approved' },
    });
    if (!approveRes.ok) throw new Error('Admin approval failed');
    console.log('✅ Property approved and marked live.');

    // 7. Test public GET /api/properties?keyHandover=true
    console.log('\n7️⃣ Testing GET /api/properties?keyHandover=true...');
    const filterTrueRes = await api('/properties?keyHandover=true');
    const foundInTrue = (filterTrueRes.data?.data?.properties || []).some((p) => p._id === propertyId);
    console.log(`Property found in ?keyHandover=true filter: ${foundInTrue ? '✅ YES (SUCCESS)' : '❌ NO'}`);
    if (!foundInTrue) throw new Error('Property missing from keyHandover=true filter!');

    // 8. Test public GET /api/properties?keyHandover=false
    console.log('\n8️⃣ Testing GET /api/properties?keyHandover=false...');
    const filterFalseRes = await api('/properties?keyHandover=false');
    const foundInFalse = (filterFalseRes.data?.data?.properties || []).some((p) => p._id === propertyId);
    console.log(`Property found in ?keyHandover=false filter: ${foundInFalse ? '❌ FOUND (UNEXPECTED)' : '✅ NOT FOUND (CORRECT)'}`);
    if (foundInFalse) throw new Error('Property unexpectedly appeared in keyHandover=false filter!');

    // 9. Clean up
    console.log('\n9️⃣ Cleaning up test property...');
    await api(`/admin/properties/${propertyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('✅ Test property cleaned up.');

    console.log('\n🎉 ALL KEY HANDOVER API TESTS PASSED WITH 100% SUCCESS! 🚀');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testKeyHandoverFlow();
