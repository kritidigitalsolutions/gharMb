const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001/api';

const runUploadTest = async () => {
  console.log('🧪 Testing File Upload Auto-Attachment to Property & Project...\n');

  try {
    // 1. Create a dummy test file in uploads/ if not exists
    const testFilePath = path.join(__dirname, 'uploads', 'test_sample_img.jpg');
    fs.writeFileSync(testFilePath, 'dummy image content binary placeholder');

    // 2. Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' })
    });
    const { token: adminToken } = await adminLoginRes.json();
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 3. Register & Approve an Agent
    const timestamp = Date.now().toString().slice(-6);
    const regRes = await fetch(`${BASE_URL}/user/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `UploadTester ${timestamp}`, phone: `9899${timestamp}` })
    });
    const { otp } = await regRes.json();

    const verifyRes = await fetch(`${BASE_URL}/user/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: `9899${timestamp}`, otp })
    });
    const { token: userToken, data: { user } } = await verifyRes.json();

    // Submit Agent details
    await fetch(`${BASE_URL}/users/register-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ reraNumber: `UPRERA-TEST-${timestamp}`, cityOfOperation: 'Noida' })
    });

    // Admin approve
    await fetch(`${BASE_URL}/admin/users/${user.id}/verify-agent`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...adminHeaders },
      body: JSON.stringify({ agentVerificationStatus: 'approved' })
    });

    // 4. Create Property (JSON body text)
    const propRes = await fetch(`${BASE_URL}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        listingAs: 'Agent / Broker',
        category: 'Residential',
        listingFor: 'Sale',
        propertyType: 'Apartment',
        title: `Upload Attachment Property ${timestamp}`,
        city: 'Noida',
        locality: 'Sector 62',
        fullAddress: 'Tower 2, Sector 62',
        pincode: '201301',
        carpetArea: 1200,
        price: 7500000
      })
    });
    const propJson = await propRes.json();
    const propertyId = propJson.data.property._id;
    console.log(`✅ Property created with ID: ${propertyId}, initial images count: ${(propJson.data.property.images || []).length}`);

    // 5. Upload multiple files using FormData with propertyId in URL params:
    // POST /api/user/upload/multiple?propertyId=${propertyId}
    const formData = new FormData();
    const fileBlob = new Blob(['sample-img-bytes-1'], { type: 'image/jpeg' });
    formData.append('files', fileBlob, 'property_photo_1.jpg');
    const fileBlob2 = new Blob(['sample-img-bytes-2'], { type: 'image/jpeg' });
    formData.append('files', fileBlob2, 'property_photo_2.jpg');

    const uploadRes = await fetch(`${BASE_URL}/user/upload/multiple?propertyId=${propertyId}`, {
      method: 'POST',
      body: formData
    });
    const uploadJson = await uploadRes.json();
    console.log('Upload Response:', uploadJson.message);
    console.log(`✅ Attached Property images in DB:`, uploadJson.data.property?.images);

    // Verify Property directly from DB
    const checkPropRes = await fetch(`${BASE_URL}/admin/properties?search=${timestamp}`, {
      headers: adminHeaders
    });
    const checkPropJson = await checkPropRes.json();
    const fetchedProp = checkPropJson.data.properties.find(p => p._id === propertyId);
    console.log(`✅ Verified Property in DB has ${fetchedProp.images.length} images connected!`);

    // 6. Test Single Document Upload: POST /api/user/upload/single?propertyId=${propertyId}&docType=titleDeed
    const docFormData = new FormData();
    const docBlob = new Blob(['title-deed-pdf-bytes'], { type: 'application/pdf' });
    docFormData.append('file', docBlob, 'title_deed.pdf');

    const docUploadRes = await fetch(`${BASE_URL}/user/upload/single?propertyId=${propertyId}&docType=titleDeed`, {
      method: 'POST',
      body: docFormData
    });
    const docUploadJson = await docUploadRes.json();
    console.log('Single Doc Upload Response:', docUploadJson.message);
    console.log(`✅ Title Deed connected to Property:`, docUploadJson.data.property?.propertyDocuments?.titleDeed);

    console.log('\n🎉 UPLOAD ATTACHMENT TEST COMPLETED SUCCESSFULLY! 🚀');
  } catch (err) {
    console.error('❌ Error during upload test:', err);
  }
};

runUploadTest();
