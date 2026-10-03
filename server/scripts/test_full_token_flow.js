const BASE_URL = 'http://localhost:5001';

async function testFullWorkflow() {
  console.log('--- Testing Full Token Booking Flow ---');

  // 1. Get properties
  const propRes = await fetch(`${BASE_URL}/api/properties?limit=5`);
  const propData = await propRes.json();
  const properties = propData.data?.properties || propData.properties || [];

  if (properties.length === 0) {
    console.log('No properties found');
    return;
  }

  const property = properties[0];
  console.log('Target Property:', property._id, property.title);

  // 2. Fetch token configuration
  const configRes = await fetch(`${BASE_URL}/api/tokens/config?propertyId=${property._id}`);
  const configData = await configRes.json();
  console.log('Property Token Config:', configData.data?.tokenAmounts, 'Adjustment Note:', configData.data?.adjustmentNote);

  // 3. User Auth (send-otp -> verify-otp -> register if new)
  const phone = '9876500112';
  await fetch(`${BASE_URL}/api/user/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });

  const otpRes = await fetch(`${BASE_URL}/api/user/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp: '123456' })
  });
  const otpData = await otpRes.json();

  let buyerToken = otpData.token || otpData.data?.token;
  if (!buyerToken) {
    const regRes = await fetch(`${BASE_URL}/api/user/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Sharma',
        phone,
        email: 'rohan.sharma@example.com'
      })
    });
    const regData = await regRes.json();
    buyerToken = regData.token || regData.data?.token;
  }

  console.log('Buyer Token retrieved:', !!buyerToken);

  if (buyerToken) {
    // 4. Submit Token Booking with all 5 Steps from screenshot!
    console.log('Submitting 5-Step Token Booking...');
    const bookingPayload = {
      propertyId: property._id,
      // Step 1: Personal Details
      personalDetails: {
        fullName: 'Rohan Sharma',
        mobileNumber: '+91 98765 00112',
        email: 'rohan.sharma@example.com',
        currentCity: 'Delhi NCR'
      },
      // Step 2: Family Details
      familyDetails: {
        numberOfFamilyMembers: '3',
        adults: '2',
        children: '1',
        maritalStatus: 'Married'
      },
      // Step 3: Occupation Details
      occupationDetails: {
        profession: 'Software Architect',
        companyName: 'Infosys Ltd',
        monthlyIncome: '₹1,50,000 - ₹2,00,000'
      },
      // Step 4: Upload ID Proof
      idProof: {
        idProofType: 'Aadhaar',
        documentUrl: '/uploads/sample_aadhaar.pdf',
        documentOriginalName: 'Aadhaar_RohanSharma.pdf'
      },
      // Step 5: Token Amount & Pricing
      tokenAmount: 2000,
      monthlyRent: property.price || 28000,
      totalAgreedPrice: `₹${(property.price || 28000).toLocaleString('en-IN')}`,
      paymentMethod: 'upi',
      transactionId: 'UTR-UPI-8899123401',
      message: 'Booking submitted through Book with Token screen'
    };

    const bookRes = await fetch(`${BASE_URL}/api/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify(bookingPayload)
    });

    const bookData = await bookRes.json();
    console.log('Booking Result:', bookRes.status, bookData.message || bookData.status);
    if (bookData.data?.tokenRequest) {
      console.log('Token Request ID:', bookData.data.tokenRequest.tokenRequestId, 'Deposit:', bookData.data.tokenRequest.tokenAmount);
    }
  }

  // 5. Admin View & Management
  const adminLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' })
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token || adminLoginData.data?.token;

  const adminTokensRes = await fetch(`${BASE_URL}/api/admin/tokens`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminTokensData = await adminTokensRes.json();
  console.log('Admin Tokens List Count:', adminTokensData.data?.tokens?.length);
  if (adminTokensData.data?.tokens?.length > 0) {
    const latest = adminTokensData.data.tokens[0];
    console.log('Latest Token:', latest.id, 'Buyer:', latest.buyerName, 'Deposit:', latest.tokenAmount, 'Status:', latest.status);
  }
}

testFullWorkflow().catch(console.error);
