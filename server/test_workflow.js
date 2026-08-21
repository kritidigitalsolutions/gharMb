/**
 * End-to-End Verification Test Script
 * Uses native fetch (Node.js 18+)
 */

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

const runTests = async () => {
  console.log('🚀 Starting GharMB E2E Role & Verification Workflow Tests...\n');

  try {
    // ==========================================
    // 1. ADMIN AUTHENTICATION
    // ==========================================
    console.log('1️⃣ Admin Login...');
    const adminLoginRes = await api('/admin/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@gmail.com',
        password: 'admin123',
      },
    });
    if (!adminLoginRes.ok) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    }
    const adminToken = adminLoginRes.data.token;
    console.log('✅ Admin logged in successfully. Token acquired.');

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // ==========================================
    // 2. USER REGISTRATION (Agent, Developer, Owner)
    // ==========================================
    const timestamp = Date.now().toString().slice(-6);
    const agentPhone = `9876${timestamp}`;
    const devPhone = `9875${timestamp}`;
    const ownerPhone = `9874${timestamp}`;

    console.log('\n2️⃣ Registering Users...');

    // Register Agent
    const regAgentRes = await api('/user/auth/register', {
      method: 'POST',
      body: {
        name: `Agent Test ${timestamp}`,
        phone: agentPhone,
        email: `agent${timestamp}@test.com`,
      },
    });
    const agentOtp = regAgentRes.data.otp;
    const verifyAgentRes = await api('/user/auth/verify-otp', {
      method: 'POST',
      body: {
        phone: agentPhone,
        otp: agentOtp,
      },
    });
    let agentToken = verifyAgentRes.data.token;
    let agentHeaders = { Authorization: `Bearer ${agentToken}` };
    const agentId = verifyAgentRes.data.data.user.id;
    console.log(`✅ Agent registered (ID: ${agentId}, Phone: ${agentPhone})`);

    // Register Developer
    const regDevRes = await api('/user/auth/register', {
      method: 'POST',
      body: {
        name: `Builder Test ${timestamp}`,
        phone: devPhone,
        email: `builder${timestamp}@test.com`,
      },
    });
    const devOtp = regDevRes.data.otp;
    const verifyDevRes = await api('/user/auth/verify-otp', {
      method: 'POST',
      body: {
        phone: devPhone,
        otp: devOtp,
      },
    });
    let devToken = verifyDevRes.data.token;
    let devHeaders = { Authorization: `Bearer ${devToken}` };
    const devId = verifyDevRes.data.data.user.id;
    console.log(`✅ Developer registered (ID: ${devId}, Phone: ${devPhone})`);

    // Register Owner
    const regOwnerRes = await api('/user/auth/register', {
      method: 'POST',
      body: {
        name: `Owner Test ${timestamp}`,
        phone: ownerPhone,
        email: `owner${timestamp}@test.com`,
      },
    });
    const ownerOtp = regOwnerRes.data.otp;
    const verifyOwnerRes = await api('/user/auth/verify-otp', {
      method: 'POST',
      body: {
        phone: ownerPhone,
        otp: ownerOtp,
      },
    });
    const ownerToken = verifyOwnerRes.data.token;
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
    const ownerId = verifyOwnerRes.data.data.user.id;
    console.log(`✅ Owner registered (ID: ${ownerId}, Phone: ${ownerPhone})`);

    // ==========================================
    // 3. SUBMIT AGENT & DEVELOPER VERIFICATION DOCS
    // ==========================================
    console.log('\n3️⃣ Submitting RERA & Verification Docs...');

    // Agent submits RERA docs
    const agentReraRes = await api('/users/register-agent', {
      method: 'POST',
      headers: agentHeaders,
      body: {
        reraNumber: `UPRERA-AGT-${timestamp}`,
        experience: '3-5 yrs',
        cityOfOperation: 'Noida',
        verificationDocs: {
          reraCertificate: 'uploads/rera_agent_cert.pdf',
          aadhaarCard: 'uploads/aadhaar_front_back.jpg',
          profilePhoto: 'uploads/agent_photo.jpg',
        },
      },
    });
    agentToken = agentReraRes.data.token;
    agentHeaders = { Authorization: `Bearer ${agentToken}` };
    console.log('✅ Agent RERA documents submitted. Status is pending.');

    // Developer submits Company docs
    const devCompanyRes = await api('/users/register-developer', {
      method: 'POST',
      headers: devHeaders,
      body: {
        companyName: `Apex Infra Heights ${timestamp}`,
        reraNumber: `UPRERA-DEV-${timestamp}`,
        gstNumber: `07AAAAA${timestamp}Z1`,
        yearsInBusiness: '5-10 yrs',
        cityOfOperation: 'Greater Noida',
        reraCertificate: 'uploads/rera_developer_cert.pdf',
        panCard: 'uploads/company_pan.jpg',
        companyLogo: 'uploads/apex_logo.png',
        bio: 'Leading residential builder with 10+ years experience.',
        unitsDelivered: '250',
        isIsoCertified: true,
        submitForVerification: true,
      },
    });
    devToken = devCompanyRes.data.token;
    devHeaders = { Authorization: `Bearer ${devToken}` };
    console.log('✅ Developer Company documents submitted. Status is pending.');

    // ==========================================
    // 4. TEST VERIFICATION GUARDS (Should be Blocked)
    // ==========================================
    console.log('\n4️⃣ Testing Upload Guards (Before Admin Approval)...');

    // Agent attempts to upload property BEFORE admin approval
    const agentEarlyPropRes = await api('/properties', {
      method: 'POST',
      headers: agentHeaders,
      body: {
        listingAs: 'Agent / Broker',
        category: 'Residential',
        listingFor: 'Sale',
        propertyType: 'Apartment',
        title: '3 BHK Luxury Apartment in Sector 62',
        city: 'Noida',
        locality: 'Sector 62',
        fullAddress: 'Tower 4, Green Valley, Sector 62',
        pincode: '201301',
        carpetArea: 1450,
        price: 8500000,
      },
    });
    if (agentEarlyPropRes.status === 403) {
      console.log(`✅ Passed: Agent correctly blocked with 403 Forbidden: "${agentEarlyPropRes.data.message}"`);
    } else {
      console.error(`❌ FAILED: Expected 403 for Agent, got ${agentEarlyPropRes.status}:`, agentEarlyPropRes.data);
    }

    // Developer attempts to upload project BEFORE admin approval
    const devEarlyProjRes = await api('/projects', {
      method: 'POST',
      headers: devHeaders,
      body: {
        projectName: `Greenwood Residency ${timestamp}`,
        developerName: `Apex Infra Heights ${timestamp}`,
        reraProjectNumber: `UPRERAPRJ${timestamp}`,
        city: 'Greater Noida',
        locality: 'Techzone 4',
        fullAddress: 'Plot 12, Techzone 4, Greater Noida',
        pincode: '201306',
        projectType: 'Residential',
        projectStatus: 'Under construction',
      },
    });
    if (devEarlyProjRes.status === 403) {
      console.log(`✅ Passed: Developer correctly blocked with 403 Forbidden: "${devEarlyProjRes.data.message}"`);
    } else {
      console.error(`❌ FAILED: Expected 403 for Developer, got ${devEarlyProjRes.status}:`, devEarlyProjRes.data);
    }

    // ==========================================
    // 5. ADMIN REVIEWS & APPROVES AGENT AND DEVELOPER
    // ==========================================
    console.log('\n5️⃣ Admin Approving Agent and Developer...');

    // Admin checks pending queues
    const pendingAgentsRes = await api('/admin/users/pending-agents', { headers: adminHeaders });
    console.log(`Pending Agents in Queue: ${pendingAgentsRes.data.results}`);

    const pendingDevsRes = await api('/admin/users/pending-developers', { headers: adminHeaders });
    console.log(`Pending Developers in Queue: ${pendingDevsRes.data.results}`);

    // Admin approves Agent
    const approveAgentRes = await api(`/admin/users/${agentId}/verify-agent`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: { agentVerificationStatus: 'approved' },
    });
    console.log(`✅ Admin approved Agent: status = ${approveAgentRes.data.data.user.agentVerificationStatus}`);

    // Admin approves Developer
    const approveDevRes = await api(`/admin/users/${devId}/verify-developer`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: { builderVerificationStatus: 'approved' },
    });
    console.log(`✅ Admin approved Developer: status = ${approveDevRes.data.data.user.builderVerificationStatus}`);

    // ==========================================
    // 6. UPLOADS AFTER ADMIN APPROVAL
    // ==========================================
    console.log('\n6️⃣ Uploading Properties & Projects (After Admin Approval)...');

    // Agent uploads property
    const agentPropRes = await api('/properties', {
      method: 'POST',
      headers: agentHeaders,
      body: {
        listingAs: 'Agent / Broker',
        category: 'Residential',
        listingFor: 'Sale',
        propertyType: 'Apartment',
        title: `3 BHK Luxury Apartment by Agent ${timestamp}`,
        city: 'Noida',
        locality: 'Sector 62',
        fullAddress: 'Tower 4, Green Valley, Sector 62',
        pincode: '201301',
        description: 'Spacious flat with park facing balcony and modern amenities.',
        bedrooms: '3',
        bathrooms: '3',
        carpetArea: 1450,
        builtUpArea: 1680,
        floorNo: '8',
        totalFloors: '18',
        ageOfProperty: '0–3 yrs',
        furnishing: 'Semi-furnished',
        facingDirection: 'East',
        parking: '1 covered',
        amenities: ['Gym', 'Clubhouse', 'Swimming pool', 'Lift', 'Power backup', '24/7 security'],
        price: 8500000,
        listingTier: 'Featured',
        images: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
        propertyDocuments: {
          titleDeed: 'uploads/title_deed.pdf',
          taxReceipt: 'uploads/tax_receipt.pdf',
        },
      },
    });
    const agentPropertyId = agentPropRes.data.data.property._id;
    console.log(`✅ Agent uploaded Property: ID ${agentPropertyId}, Submission ID: ${agentPropRes.data.data.submissionId}, Status: ${agentPropRes.data.data.property.approvalStatus}`);

    // Developer uploads project
    const devProjRes = await api('/projects', {
      method: 'POST',
      headers: devHeaders,
      body: {
        projectName: `Emerald Heights Phase 2 ${timestamp}`,
        developerName: `Apex Infra Heights ${timestamp}`,
        reraProjectNumber: `UPRERAPRJ${timestamp}`,
        reraExpiryDate: '31/12/2028',
        launchDate: '01/01/2024',
        projectType: 'Residential',
        projectStatus: 'Under construction',
        city: 'Greater Noida',
        locality: 'Techzone 4',
        fullAddress: 'Plot 12, Techzone 4, Greater Noida West',
        pincode: '201306',
        possessionDate: 'Dec 2026',
        projectWebsite: 'https://emeraldheights.in',
        projectTagline: 'Where luxury meets nature',
        shortDescription: 'Premium gated project near NH-58 with 70% open space.',
        totalUnits: 240,
        openSpacePercentage: 70,
        floors: 'G + 14',
        towers: 3,
        bhkConfigurations: [
          {
            bhkType: '2 BHK',
            carpetArea: 1100,
            minPrice: 4500000,
            maxPrice: 5500000,
            priceRangeText: '₹45 L - ₹55 L',
            availableUnits: 60,
          },
          {
            bhkType: '3 BHK',
            carpetArea: 1550,
            minPrice: 7000000,
            maxPrice: 8500000,
            priceRangeText: '₹70 L - ₹85 L',
            availableUnits: 40,
          },
        ],
        amenities: ['Clubhouse', 'Swimming pool', 'Gym', 'Kids play area', 'Tennis court', 'EV charging', '24/7 security'],
        nearbyLandmarks: [
          { locationName: 'NH-58', distance: '1.2 km' },
          { locationName: 'Metro Station', distance: '2.5 km' },
        ],
        vastuCompliant: true,
        projectPhotos: ['https://example.com/proj1.jpg', 'https://example.com/proj2.jpg'],
        masterPlanUrl: 'uploads/master_plan.jpg',
        floorPlanUrl: 'uploads/floor_plan_3bhk.jpg',
        brochureUrl: 'uploads/emerald_brochure.pdf',
      },
    });
    const projectId = devProjRes.data.data.project._id;
    console.log(`✅ Developer uploaded Project: ID ${projectId}, Submission ID: ${devProjRes.data.data.submissionId}, Status: ${devProjRes.data.data.project.approvalStatus}`);

    // Owner uploads property directly
    const ownerPropRes = await api('/properties', {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        listingAs: 'Owner',
        category: 'Residential',
        listingFor: 'Rent',
        propertyType: 'Apartment',
        title: `2 BHK Apartment for Rent in Indirapuram ${timestamp}`,
        city: 'Ghaziabad',
        locality: 'Indirapuram',
        fullAddress: 'Flat 204, Royal Apartments, Indirapuram',
        pincode: '201014',
        description: 'Fully furnished 2 BHK for family or bachelors.',
        bedrooms: '2',
        bathrooms: '2',
        carpetArea: 950,
        price: 22000,
        securityDeposit: 44000,
        maintenanceCharges: 2000,
        maintenanceIncludedInRent: false,
        preferredTenants: ['Family', 'Working professionals'],
        petsAllowed: true,
        noticePeriod: '1 month',
      },
    });
    const ownerPropertyId = ownerPropRes.data.data.property._id;
    console.log(`✅ Owner uploaded Property: ID ${ownerPropertyId}, Submission ID: ${ownerPropRes.data.data.submissionId}, Status: ${ownerPropRes.data.data.property.approvalStatus}`);

    // ==========================================
    // 7. PUBLIC GET FILTERS CHECK (BEFORE ADMIN APPROVAL)
    // ==========================================
    console.log('\n7️⃣ Checking Public GET APIs Before Admin Approval (Should NOT Show Pending Items)...');

    const publicPropsBefore = await api('/properties');
    const foundAgentPropBefore = (publicPropsBefore.data?.data?.properties || []).find((p) => p._id === agentPropertyId);
    const foundOwnerPropBefore = (publicPropsBefore.data?.data?.properties || []).find((p) => p._id === ownerPropertyId);
    console.log(`Agent property in public feed before approval: ${foundAgentPropBefore ? '❌ VISIBLE (BUG)' : '✅ HIDDEN (CORRECT)'}`);
    console.log(`Owner property in public feed before approval: ${foundOwnerPropBefore ? '❌ VISIBLE (BUG)' : '✅ HIDDEN (CORRECT)'}`);

    const publicProjectsBefore = await api('/projects');
    const foundDevProjectBefore = (publicProjectsBefore.data?.data?.projects || []).find((p) => p._id === projectId);
    console.log(`Developer project in public feed before approval: ${foundDevProjectBefore ? '❌ VISIBLE (BUG)' : '✅ HIDDEN (CORRECT)'}`);

    // ==========================================
    // 8. ADMIN APPROVES PROPERTIES AND PROJECT
    // ==========================================
    console.log('\n8️⃣ Admin Approving Properties and Project...');

    // Admin approves Agent Property
    const approveAgentPropRes = await api(`/admin/properties/${agentPropertyId}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: { approvalStatus: 'approved' },
    });
    console.log(`✅ Admin approved Agent Property: status = ${approveAgentPropRes.data.data.property.approvalStatus}, isLive = ${approveAgentPropRes.data.data.property.isLive}`);

    // Admin approves Owner Property
    const approveOwnerPropRes = await api(`/admin/properties/${ownerPropertyId}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: { approvalStatus: 'approved' },
    });
    console.log(`✅ Admin approved Owner Property: status = ${approveOwnerPropRes.data.data.property.approvalStatus}, isLive = ${approveOwnerPropRes.data.data.property.isLive}`);

    // Admin approves Developer Project
    const approveProjRes = await api(`/admin/projects/${projectId}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: { approvalStatus: 'approved' },
    });
    console.log(`✅ Admin approved Developer Project: status = ${approveProjRes.data.data.project.approvalStatus}, isLive = ${approveProjRes.data.data.project.isLive}`);

    // ==========================================
    // 9. PUBLIC GET FILTERS CHECK (AFTER ADMIN APPROVAL)
    // ==========================================
    console.log('\n9️⃣ Checking Public GET APIs After Admin Approval (MUST Show Approved Items)...');

    const publicPropsAfter = await api('/properties');
    const foundAgentPropAfter = (publicPropsAfter.data?.data?.properties || []).find((p) => p._id === agentPropertyId);
    const foundOwnerPropAfter = (publicPropsAfter.data?.data?.properties || []).find((p) => p._id === ownerPropertyId);
    console.log(`Agent property in public feed after approval: ${foundAgentPropAfter ? '✅ VISIBLE (SUCCESS)' : '❌ NOT FOUND'}`);
    console.log(`Owner property in public feed after approval: ${foundOwnerPropAfter ? '✅ VISIBLE (SUCCESS)' : '❌ NOT FOUND'}`);

    const publicProjectsAfter = await api('/projects');
    const foundDevProjectAfter = (publicProjectsAfter.data?.data?.projects || []).find((p) => p._id === projectId);
    console.log(`Developer project in public feed after approval: ${foundDevProjectAfter ? '✅ VISIBLE (SUCCESS)' : '❌ NOT FOUND'}`);

    // Check Developer Profile in Public Directory
    const publicDevs = await api('/users/developers');
    const foundDev = (publicDevs.data?.data?.developers || []).find((d) => d.id === devId);
    console.log(`Developer in public directory: ${foundDev ? '✅ VISIBLE (SUCCESS)' : '❌ NOT FOUND'}`);

    console.log('\n🎉 ALL E2E VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (error) {
    console.error('\n❌ Test execution encountered an error:', error.message);
  }
};

runTests();
