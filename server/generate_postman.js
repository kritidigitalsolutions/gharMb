/**
 * GharMB - Comprehensive Postman Collection Generator (v3.0)
 * Generates an elegantly organized Postman collection structured into:
 *   - 📁 User   (Buyer, Owner, Agent, Developer actions & dashboard)
 *   - 📁 Admin  (Dashboard analytics, approvals, user management, CMS)
 *   - 📁 Shared (Public property feeds, project directories, content, static pages, health)
 */

const fs = require('fs');
const path = require('path');

const collection = {
  info: {
    _postman_id: "gharmb-api-suite-v3-2026",
    name: "GharMB - Complete API Suite (Mobile & Web)",
    description: "Complete Postman API Collection for GharMB Real Estate Platform.\nOrganized into 3 main root domains:\n1. 📁 User - User authentication, profile, property/project creation, enquiries, favorites, and uploads.\n2. 📁 Admin - Back-office control suite, user/agent verification, listing approvals, dashboard metrics, notifications, and CMS.\n3. 📁 Shared - Public search feeds, developer directory, news, blogs, legal documents, testimonials, and health checks.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5001/api", type: "string" },
    { key: "adminToken", value: "", type: "string" },
    { key: "adminRefreshToken", value: "", type: "string" },
    { key: "userToken", value: "", type: "string" },
    { key: "userRefreshToken", value: "", type: "string" },
    { key: "ownerToken", value: "", type: "string" },
    { key: "agentToken", value: "", type: "string" },
    { key: "developerToken", value: "", type: "string" },
    { key: "userId", value: "", type: "string" },
    { key: "agentId", value: "", type: "string" },
    { key: "propertyId", value: "", type: "string" },
    { key: "commercialSpaceId", value: "", type: "string" },
    { key: "bannerId", value: "", type: "string" },
    { key: "projectId", value: "", type: "string" },
    { key: "developerId", value: "", type: "string" },
    { key: "notificationId", value: "", type: "string" },
    { key: "enquiryId", value: "", type: "string" },
    { key: "newsId", value: "", type: "string" },
    { key: "blogId", value: "", type: "string" },
    { key: "blogCategoryId", value: "", type: "string" },
    { key: "insightId", value: "", type: "string" },
    { key: "insightSlug", value: "top-7-tips-for-first-time-home-buyers-in-2026", type: "string" },
    { key: "insightCategoryId", value: "", type: "string" },
    { key: "policyId", value: "", type: "string" },
    { key: "testimonialId", value: "", type: "string" },
    { key: "inquiryId", value: "", type: "string" },
    { key: "tokenRequestId", value: "", type: "string" },
    { key: "visitRequestId", value: "", type: "string" },
    { key: "serviceId", value: "", type: "string" },
    { key: "serviceRequestIdCode", value: "SRV-MOV-131", type: "string" },
    { key: "referralId", value: "", type: "string" },
    { key: "faqId", value: "", type: "string" },
    { key: "faqCategoryId", value: "", type: "string" },
    { key: "googleRegistrationToken", value: "", type: "string" },
    { key: "googlePhoneVerificationToken", value: "", type: "string" }
  ],
  item: [
    // =========================================================================
    // 📁 1. USER
    // =========================================================================
    {
      name: "User",
      description: "Endpoints for app users, buyers, tenants, property owners, agents, and builder developers.",
      item: [
        // ---------------------------------------------------------------------
        // 01. Authentication & Onboarding
        // ---------------------------------------------------------------------
        {
          name: "01. Authentication & Onboarding",
          description: "Endpoints for OTP login, phone verification, and initial profile registration.",
          item: [
            {
              name: "01. Send OTP (Login / Initial Signup)",
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ phone: "9876543210" }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/user/auth/send-otp",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "send-otp"]
                }
              }
            },
            {
              name: "02. Verify OTP (Auto-saves userToken & ownerToken)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.token) {",
                      "    pm.collectionVariables.set('userToken', jsonData.token);",
                      "    pm.collectionVariables.set('ownerToken', jsonData.token);",
                      "    console.log('✅ userToken & ownerToken set successfully');",
                      "}",
                      "if (jsonData.refreshToken) {",
                      "    pm.collectionVariables.set('userRefreshToken', jsonData.refreshToken);",
                      "    console.log('✅ userRefreshToken set successfully');",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ phone: "9876543210", otp: "123456" }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/user/auth/verify-otp",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "verify-otp"]
                }
              }
            },
            {
              name: "03. Resend OTP",
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ phone: "9876543210" }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/user/auth/resend-otp",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "resend-otp"]
                }
              }
            },
            {
              name: "04. Complete Registration Details",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.token) {",
                      "    pm.collectionVariables.set('userToken', jsonData.token);",
                      "    console.log('✅ userToken set from Registration');",
                      "}",
                      "if (jsonData.refreshToken) {",
                      "    pm.collectionVariables.set('userRefreshToken', jsonData.refreshToken);",
                      "    console.log('✅ userRefreshToken set from Registration');",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    name: "Ramesh Sharma",
                    phone: "9876543210",
                    email: "ramesh@example.com",
                    address: "Flat 302, Palm Greens, Sector 62, Noida"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/user/auth/register",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "register"]
                }
              }
            },
            {
              name: "05. Google Sign-In / Firebase Auth (POST /user/auth/google)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.token) {",
                      "    pm.collectionVariables.set('userToken', jsonData.token);",
                      "    if (jsonData.data && jsonData.data.user && jsonData.data.user.id) {",
                      "        pm.collectionVariables.set('userId', jsonData.data.user.id);",
                      "    }",
                      "    console.log('✅ Existing user logged in: userToken & userId set');",
                      "}",
                      "if (jsonData.refreshToken) {",
                      "    pm.collectionVariables.set('userRefreshToken', jsonData.refreshToken);",
                      "    console.log('✅ userRefreshToken set from Google Sign-In');",
                      "}",
                      "if (jsonData.registrationToken) {",
                      "    pm.collectionVariables.set('googleRegistrationToken', jsonData.registrationToken);",
                      "    console.log('✅ New user detected: googleRegistrationToken saved for form completion');",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    idToken: "PASTE_FIREBASE_OR_GOOGLE_ID_TOKEN_HERE"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/user/auth/google",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "google"]
                },
                description: "Authenticates via Google OAuth or Firebase ID token. If user already exists, logs in directly. If new user, returns isNewUser: true with locked email and registrationToken without registering in DB yet."
              }
            },
            {
              name: "06. Google Sign-In Step 2: Send Phone Verification OTP (POST /user/auth/google/send-otp)",
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    phone: "9876543210",
                    email: "rohan@gmail.com",
                    registrationToken: "{{googleRegistrationToken}}"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/user/auth/google/send-otp",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "google", "send-otp"]
                },
                description: "Sends 6-digit OTP to mobile number. Verifies that the phone number is unique and not already linked to an existing account (409 Conflict if taken)."
              }
            },
            {
              name: "07. Google Sign-In Step 3: Verify Phone OTP (POST /user/auth/google/verify-otp)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.phoneVerificationToken) {",
                      "    pm.collectionVariables.set('googlePhoneVerificationToken', jsonData.phoneVerificationToken);",
                      "    console.log('✅ googlePhoneVerificationToken saved successfully');",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    phone: "9876543210",
                    otp: "123456"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/user/auth/google/verify-otp",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "google", "verify-otp"]
                },
                description: "Verifies the OTP submitted by the user and issues a phoneVerificationToken for form submission."
              }
            },
            {
              name: "08. Google Sign-In Step 4: Complete Google Registration (POST /user/auth/google/register)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.token) {",
                      "    pm.collectionVariables.set('userToken', jsonData.token);",
                      "    if (jsonData.data && jsonData.data.user && jsonData.data.user.id) {",
                      "        pm.collectionVariables.set('userId', jsonData.data.user.id);",
                      "    }",
                      "    console.log('✅ userToken & userId set from Google Registration');",
                      "}",
                      "if (jsonData.refreshToken) {",
                      "    pm.collectionVariables.set('userRefreshToken', jsonData.refreshToken);",
                      "    console.log('✅ userRefreshToken set from Google Registration');",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    name: "Rohan Sharma",
                    email: "rohan@gmail.com",
                    phone: "9876543210",
                    phoneVerificationToken: "{{googlePhoneVerificationToken}}",
                    registrationToken: "{{googleRegistrationToken}}",
                    role: "buyer",
                    address: "Flat 302, Palm Greens, Sector 62, Noida"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/user/auth/google/register",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "google", "register"]
                },
                description: "Registers user in MongoDB only after details are filled and phone OTP is verified. Enforces email and phone uniqueness."
              }
            },
            {
              name: "09. Get Current User Profile (GET /user/auth/me)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/user/auth/me",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "me"]
                }
              }
            },
            {
              name: "10. Submit Basic Info (Screen 1: Basic Info)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.token) {",
                      "    pm.collectionVariables.set('userToken', jsonData.token);",
                      "    console.log('✅ userToken refreshed from Basic Info submission');",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    name: "Dhruv Sharma",
                    email: "dhruv@example.com",
                    phone: "9876543210",
                    address: "A 191, Kamla Nagar, Agra, Uttar Pradesh, 282005",
                    latitude: 27.1767,
                    longitude: 78.0081
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/user/auth/basic-info",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "basic-info"]
                }
              }
            },
            {
              name: "11. Refresh User Auth Token (Auto-updates userToken & userRefreshToken)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.token) {",
                      "    pm.collectionVariables.set('userToken', jsonData.token);",
                      "    pm.collectionVariables.set('ownerToken', jsonData.token);",
                      "    console.log('✅ userToken refreshed successfully');",
                      "}",
                      "if (jsonData.refreshToken) {",
                      "    pm.collectionVariables.set('userRefreshToken', jsonData.refreshToken);",
                      "    console.log('✅ userRefreshToken rotated and updated');",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    refreshToken: "{{userRefreshToken}}"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/user/auth/refresh-token",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "refresh-token"]
                },
                description: "Exchanges a valid refresh token for a new access token and rotated refresh token."
              }
            },
            {
              name: "12. Update Profile (PATCH /user/auth/update-profile)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    role: "buyer",
                    intents: ["buy", "rent"],
                    preferredLocations: ["Noida Sector 62", "Greater Noida West"],
                    budgetMin: 4000000,
                    budgetMax: 12000000
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/user/auth/update-profile",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "update-profile"]
                }
              }
            },
            {
              name: "13. Current User Verification Status (GET /user/auth/verification-status)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/user/auth/verification-status",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "verification-status"]
                },
                description: "Returns authentication & verification status for the current logged-in user profile."
              }
            },
            {
              name: "14. Refresh Token Alias (POST /user/auth/refresh)",
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ refreshToken: "{{userRefreshToken}}" }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/user/auth/refresh",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "refresh"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 02. Profile & Role Verification
        // ---------------------------------------------------------------------
        {
          name: "02. Profile & Role Verification",
          description: "Manage user account details, avatar, and submit partner upgrades (Agent RERA / Developer Company).",
          item: [
            {
              name: "01. Get My Profile (GET /users/me)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/users/me",
                  host: ["{{baseUrl}}"],
                  path: ["users", "me"]
                }
              }
            },
            {
              name: "01b. Get My Verification Status (GET /users/verification-status)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/users/verification-status",
                  host: ["{{baseUrl}}"],
                  path: ["users", "verification-status"]
                },
                description: "Returns real-time verification status for Agent, Builder, Owner, Buyer with badge, message, isPending, and submittedDetails."
              }
            },
            {
              name: "02. Update My Profile (PATCH /users/update-me)",
              request: {
                method: "PATCH",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "name", value: "Ramesh K. Sharma", type: "text" },
                    { key: "address", value: "Sector 62, Noida, Uttar Pradesh", type: "text" },
                    { key: "city", value: "Noida", type: "text" }
                  ]
                },
                url: {
                  raw: "{{baseUrl}}/users/update-me",
                  host: ["{{baseUrl}}"],
                  path: ["users", "update-me"]
                }
              }
            },
            {
              name: "03. Agent Registration (Submit RERA & Verification)",
              request: {
                method: "POST",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "agencyName", value: "Apex Realty Partners", type: "text" },
                    { key: "reraNumber", value: "UPRERAAGT123456", type: "text" },
                    { key: "city", value: "Noida", type: "text" },
                    { key: "operatingLocalities", value: "Sector 62, Sector 128, Expressway", type: "text" },
                    { key: "experienceYears", value: "8", type: "text" }
                  ]
                },
                url: {
                  raw: "{{baseUrl}}/users/register-agent",
                  host: ["{{baseUrl}}"],
                  path: ["users", "register-agent"]
                }
              }
            },
            {
              name: "04. Developer Registration (Submit Company & Verification)",
              request: {
                method: "POST",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "companyName", value: "Emerald Sky Developers Ltd", type: "text" },
                    { key: "cinNumber", value: "U45200DL2018PTC123456", type: "text" },
                    { key: "panNumber", value: "AAACE1234F", type: "text" },
                    { key: "experienceYears", value: "14", type: "text" },
                    { key: "officeAddress", value: "Emerald Tower, Golf Course Road, Gurgaon", type: "text" }
                  ]
                },
                url: {
                  raw: "{{baseUrl}}/users/register-developer",
                  host: ["{{baseUrl}}"],
                  path: ["users", "register-developer"]
                }
              }
            },
            {
              name: "05. Get User Dashboard (GET /users/dashboard)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/users/dashboard",
                  host: ["{{baseUrl}}"],
                  path: ["users", "dashboard"]
                }
              }
            },
            {
              name: "06. Get Verification Status Alias (GET /users/status)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/users/status",
                  host: ["{{baseUrl}}"],
                  path: ["users", "status"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 03. Property Listings (Owner / Agent)
        // ---------------------------------------------------------------------
        {
          name: "03. Property Listings (Owner / Agent)",
          description: "Owner and Agent dashboard, property creation, editing, and listing removal.",
          item: [
            {
              name: "01. My Property Dashboard (All-Time Stats, Counters, Banner & Tabs)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/properties/my-dashboard?tab=live&page=1&limit=10",
                  host: ["{{baseUrl}}"],
                  path: ["properties", "my-dashboard"],
                  query: [
                    { key: "tab", value: "live", description: "live | pending | rejected | all" },
                    { key: "page", value: "1" },
                    { key: "limit", value: "10" }
                  ]
                }
              }
            },
            {
              name: "02. My Properties List by Tab (Live / Pending / Rejected)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/properties/my-properties?status=live&page=1&limit=10",
                  host: ["{{baseUrl}}"],
                  path: ["properties", "my-properties"],
                  query: [
                    { key: "status", value: "live", description: "live | pending | rejected | all" },
                    { key: "page", value: "1" },
                    { key: "limit", value: "10" }
                  ]
                }
              }
            },
            {
              name: "03. Get Received Token Requests (Banner & Decision)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/properties/token-requests?status=pending",
                  host: ["{{baseUrl}}"],
                  path: ["properties", "token-requests"],
                  query: [
                    { key: "status", value: "pending", description: "pending | accepted | rejected | all" }
                  ]
                }
              }
            },
            {
              name: "04. Submit Property Token Booking Request (Buyer)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.tokenRequest) {",
                      "    pm.collectionVariables.set('tokenRequestId', jsonData.data.tokenRequest._id);",
                      "    console.log('✅ tokenRequestId set to: ' + jsonData.data.tokenRequest._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    propertyId: "{{propertyId}}",
                    tokenAmount: 25000,
                    paymentPlanType: "installment",
                    installmentPlan: {
                      downPaymentAmount: 1500000,
                      numberOfInstallments: 24,
                      installmentFrequency: "Monthly",
                      installmentAmount: 291667,
                      totalPayable: 8500000,
                      proposedTerms: "Buyer opting for 24-month installment option as listed by owner"
                    },
                    message: "Ready to proceed with token booking under the 24-month installment plan."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/token-requests",
                  host: ["{{baseUrl}}"],
                  path: ["token-requests"]
                }
              }
            },
            {
              name: "05. Accept Token Request (Owner Decision)",
              request: {
                method: "PATCH",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/token-requests/{{tokenRequestId}}/accept",
                  host: ["{{baseUrl}}"],
                  path: ["token-requests", "{{tokenRequestId}}", "accept"]
                }
              }
            },
            {
              name: "06. Reject Token Request (Owner Decision)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    reason: "Property already under negotiation with another buyer."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/token-requests/{{tokenRequestId}}/reject",
                  host: ["{{baseUrl}}"],
                  path: ["token-requests", "{{tokenRequestId}}", "reject"]
                }
              }
            },
            {
              name: "02. Create Property Listing (Auto-saves propertyId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.property) {",
                      "    pm.collectionVariables.set('propertyId', jsonData.data.property._id);",
                      "    console.log('✅ propertyId set to: ' + jsonData.data.property._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "Luxurious 3 BHK Apartment in Sector 62",
                    description: "Spacious 3 bedroom apartment with modular kitchen, corner balcony with park view, and covered parking.",
                    listingFor: "sale",
                    category: "residential",
                    propertyType: "apartment",
                    price: 8500000,
                    carpetArea: 1650,
                    builtUpArea: 1950,
                    bedrooms: 3,
                    bathrooms: 3,
                    balconies: 2,
                    furnishingStatus: "semi-furnished",
                    possessionStatus: "ready-to-move",
                    address: "Flat 402, Tower 4, Express Greens",
                    city: "Noida",
                    state: "Uttar Pradesh",
                    pincode: "201301",
                    location: {
                      type: "Point",
                      coordinates: [77.3910, 28.5355]
                    },
                    amenities: ["Gymnasium", "Swimming Pool", "24/7 Power Backup", "Clubhouse", "Security"],
                    vastuCompliant: true,
                    keyHandover: true,
                    openToAllBuyers: true,
                    loanAssistanceNeeded: true,
                    allowInstallments: true,
                    installmentDetails: {
                      downPaymentAmount: 1700000,
                      downPaymentPercentage: 20,
                      numberOfInstallments: 24,
                      installmentFrequency: "Monthly",
                      installmentAmount: 283333,
                      interestRate: 0,
                      installmentDurationMonths: 24,
                      gracePeriodDays: 10,
                      termsAndConditions: "Possession handed over on 50% milestone payment; registry on full clearance."
                    }
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/properties",
                  host: ["{{baseUrl}}"],
                  path: ["properties"]
                }
              }
            },
            {
              name: "03. Update Property Listing",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    price: 8200000,
                    keyHandover: true,
                    furnishingStatus: "fully-furnished",
                    description: "Price reduced! Beautiful 3 BHK apartment ready to move in with imported marble flooring."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/properties/{{propertyId}}",
                  host: ["{{baseUrl}}"],
                  path: ["properties", "{{propertyId}}"]
                }
              }
            },
            {
              name: "04. Toggle / Set Key Handover Status",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    keyHandover: true
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/properties/{{propertyId}}/key-handover",
                  host: ["{{baseUrl}}"],
                  path: ["properties", "{{propertyId}}", "key-handover"]
                }
              }
            },
            {
              name: "05. Delete Property Listing",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/properties/{{propertyId}}",
                  host: ["{{baseUrl}}"],
                  path: ["properties", "{{propertyId}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 04. Developer Projects (Builder / Developer)
        // ---------------------------------------------------------------------
        {
          name: "04. Developer Projects (Builder / Developer)",
          description: "Developer management for new residential townships and commercial complexes.",
          item: [
            {
              name: "01. My Projects (Developer Dashboard)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{developerToken}}" }],
                url: {
                  raw: "{{baseUrl}}/projects/my-projects",
                  host: ["{{baseUrl}}"],
                  path: ["projects", "my-projects"]
                }
              }
            },
            {
              name: "02. Create Project (Auto-saves projectId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.project) {",
                      "    pm.collectionVariables.set('projectId', jsonData.data.project._id);",
                      "    console.log('✅ projectId set to: ' + jsonData.data.project._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{developerToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    name: "Emerald Heights Residential Township",
                    tagline: "Eco-Friendly Living by the Waterfront",
                    description: "Spread over 15 acres of lush greenery with world-class clubhouse, Olympic pool, and smart home automation.",
                    projectType: "residential",
                    configurations: ["2 BHK", "3 BHK", "4 BHK"],
                    priceRange: {
                      minPrice: 6500000,
                      maxPrice: 22000000
                    },
                    reraId: "UPRERAPRJ998877",
                    possessionDate: "2027-12-31",
                    address: "Sector 150, Noida-Greater Noida Expressway",
                    city: "Noida",
                    state: "Uttar Pradesh",
                    pincode: "201310",
                    location: {
                      type: "Point",
                      coordinates: [77.4700, 28.4500]
                    },
                    totalTowers: 8,
                    totalUnits: 650
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/projects",
                  host: ["{{baseUrl}}"],
                  path: ["projects"]
                }
              }
            },
            {
              name: "03. Update Project by ID",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{developerToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    tagline: "Exclusive Waterfront Luxury Residences",
                    priceRange: {
                      minPrice: 7000000,
                      maxPrice: 24000000
                    }
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/projects/{{projectId}}",
                  host: ["{{baseUrl}}"],
                  path: ["projects", "{{projectId}}"]
                }
              }
            },
            {
              name: "04. Delete Project by ID",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{developerToken}}" }],
                url: {
                  raw: "{{baseUrl}}/projects/{{projectId}}",
                  host: ["{{baseUrl}}"],
                  path: ["projects", "{{projectId}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 05. File & Document Uploads
        // ---------------------------------------------------------------------
        {
          name: "05. File & Document Uploads",
          description: "Upload endpoints for photos, blueprints, title deeds, brochures, and documents.",
          item: [
            {
              name: "01. Upload Single File",
              request: {
                method: "POST",
                header: [
                  { key: "Authorization", value: "Bearer {{userToken}}", disabled: true }
                ],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "file", type: "file", src: [], description: "Select an image or document" }
                  ]
                },
                url: {
                  raw: "{{baseUrl}}/upload/single",
                  host: ["{{baseUrl}}"],
                  path: ["upload", "single"]
                }
              }
            },
            {
              name: "02. Upload Multiple Files (FormData)",
              request: {
                method: "POST",
                header: [
                  { key: "Authorization", value: "Bearer {{userToken}}", disabled: true }
                ],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "files", type: "file", src: [], description: "First image or document" },
                    { key: "files", type: "file", src: [], disabled: true, description: "Second image (check to enable)" }
                  ]
                },
                url: {
                  raw: "{{baseUrl}}/upload/multiple",
                  host: ["{{baseUrl}}"],
                  path: ["upload", "multiple"]
                }
              }
            },
            {
              name: "03. Upload Multiple Files (Base64 JSON)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}", disabled: true }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    images: [
                      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    ]
                  }, null, 2),
                  options: {
                    raw: {
                      language: "json"
                    }
                  }
                },
                url: {
                  raw: "{{baseUrl}}/upload/multiple",
                  host: ["{{baseUrl}}"],
                  path: ["upload", "multiple"]
                }
              }
            },
            {
              name: "04. Upload Property Documents by ID",
              request: {
                method: "POST",
                header: [
                  { key: "Authorization", value: "Bearer {{userToken}}", disabled: true }
                ],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "images", type: "file", src: [], description: "Property photo" },
                    { key: "titleDeed", type: "file", src: [], disabled: true, description: "Title Deed PDF (optional)" },
                    { key: "electricityBill", type: "file", src: [], disabled: true, description: "Electricity bill PDF (optional)" }
                  ]
                },
                url: {
                  raw: "{{baseUrl}}/upload/property/{{propertyId}}",
                  host: ["{{baseUrl}}"],
                  path: ["upload", "property", "{{propertyId}}"]
                }
              }
            },
            {
              name: "05. Upload Project Brochures & Plans by ID",
              request: {
                method: "POST",
                header: [
                  { key: "Authorization", value: "Bearer {{developerToken}}", disabled: true }
                ],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "photos", type: "file", src: [], description: "Project photo" },
                    { key: "masterPlan", type: "file", src: [], disabled: true, description: "Master plan PDF/image (optional)" },
                    { key: "brochure", type: "file", src: [], disabled: true, description: "Brochure PDF (optional)" }
                  ]
                },
                url: {
                  raw: "{{baseUrl}}/upload/project/{{projectId}}",
                  host: ["{{baseUrl}}"],
                  path: ["upload", "project", "{{projectId}}"]
                }
              }
            },
            {
              name: "06. Upload Multiple Files Linked to Property",
              request: {
                method: "POST",
                header: [
                  { key: "Authorization", value: "Bearer {{userToken}}", disabled: true }
                ],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "files", type: "file", src: [], description: "Photo to auto-link to property" }
                  ]
                },
                url: {
                  raw: "{{baseUrl}}/upload/multiple?propertyId={{propertyId}}",
                  host: ["{{baseUrl}}"],
                  path: ["upload", "multiple"],
                  query: [{ key: "propertyId", value: "{{propertyId}}" }]
                }
              }
            },
            {
              name: "07. Upload Multiple Files Linked to Project",
              request: {
                method: "POST",
                header: [
                  { key: "Authorization", value: "Bearer {{developerToken}}", disabled: true }
                ],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "files", type: "file", src: [], description: "Photo to auto-link to project" }
                  ]
                },
                url: {
                  raw: "{{baseUrl}}/upload/multiple?projectId={{projectId}}",
                  host: ["{{baseUrl}}"],
                  path: ["upload", "multiple"],
                  query: [{ key: "projectId", value: "{{projectId}}" }]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 06. Leads & Enquiries
        // ---------------------------------------------------------------------
        {
          name: "06. Leads & Enquiries",
          description: "Submit customer inquiries, view submitted inquiries, and manage leads for owners/agents.",
          item: [
            {
              name: "01. Submit Property / Project Enquiry (Auto-saves enquiryId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.enquiry) {",
                      "    pm.collectionVariables.set('enquiryId', jsonData.data.enquiry._id);",
                      "    console.log('✅ enquiryId set to: ' + jsonData.data.enquiry._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    propertyId: "{{propertyId}}",
                    message: "Hello, I am interested in visiting this property this Sunday. Is it available for inspection?"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/users/enquiries",
                  host: ["{{baseUrl}}"],
                  path: ["users", "enquiries"]
                }
              }
            },
            {
              name: "02. Submit Developer Lead / Enquiry",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    developerId: "{{developerId}}",
                    message: "I am interested in bulk booking 2 units in your upcoming project. Please connect with sales."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/users/enquiries/developer",
                  host: ["{{baseUrl}}"],
                  path: ["users", "enquiries", "developer"]
                }
              }
            },
            {
              name: "03. Get My Sent Enquiries (Buyer / Tenant)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/users/enquiries/my-enquiries",
                  host: ["{{baseUrl}}"],
                  path: ["users", "enquiries", "my-enquiries"]
                }
              }
            },
            {
              name: "04. Get Received Enquiries (Owner / Agent / Builder)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{ownerToken}}" }],
                url: {
                  raw: "{{baseUrl}}/users/enquiries/received",
                  host: ["{{baseUrl}}"],
                  path: ["users", "enquiries", "received"]
                }
              }
            },
            {
              name: "05. Update Enquiry Status (contacted / closed)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{ownerToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ status: "contacted" }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/users/enquiries/{{enquiryId}}",
                  host: ["{{baseUrl}}"],
                  path: ["users", "enquiries", "{{enquiryId}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 07. Wishlist / Saved Listings
        // ---------------------------------------------------------------------
        {
          name: "07. Wishlist / Saved Listings",
          description: "Manage shortlisted and bookmarked properties & projects for users.",
          item: [
            {
              name: "01. Get Wishlist Feed",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/wishlist",
                  host: ["{{baseUrl}}"],
                  path: ["wishlist"]
                }
              }
            },
            {
              name: "02. Toggle Wishlist Item (Add / Remove)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    propertyId: "{{propertyId}}"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/wishlist/toggle",
                  host: ["{{baseUrl}}"],
                  path: ["wishlist", "toggle"]
                }
              }
            },
            {
              name: "03. Add to Wishlist (Direct REST POST)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    propertyId: "{{propertyId}}"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/wishlist",
                  host: ["{{baseUrl}}"],
                  path: ["wishlist"]
                }
              }
            },
            {
              name: "04. Check Wishlist Status by ID",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/wishlist/check/{{propertyId}}",
                  host: ["{{baseUrl}}"],
                  path: ["wishlist", "check", "{{propertyId}}"]
                }
              }
            },
            {
              name: "05. Get Wishlisted IDs List",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/wishlist/ids",
                  host: ["{{baseUrl}}"],
                  path: ["wishlist", "ids"]
                }
              }
            },
            {
              name: "06. Remove from Wishlist by ID",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/wishlist/{{propertyId}}",
                  host: ["{{baseUrl}}"],
                  path: ["wishlist", "{{propertyId}}"]
                }
              }
            },
            {
              name: "07. Clear Entire Wishlist",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/wishlist/clear",
                  host: ["{{baseUrl}}"],
                  path: ["wishlist", "clear"]
                }
              }
            },
            {
              name: "08. Get Favorites (Alias /favorites)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/favorites",
                  host: ["{{baseUrl}}"],
                  path: ["favorites"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 08. Developer Reviews & Ratings
        // ---------------------------------------------------------------------
        {
          name: "08. Developer Reviews & Ratings",
          description: "Submit ratings, aspects (Quality, Timely Delivery, etc.), and comments for builders/developers.",
          item: [
            {
              name: "01. Submit / Update Review for Developer",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    rating: 5,
                    tags: ["Quality", "Timely Delivery"],
                    comment: "Exceptional construction quality and timely possession handover!"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/developers/{{developerId}}/reviews",
                  host: ["{{baseUrl}}"],
                  path: ["developers", "{{developerId}}", "reviews"]
                }
              }
            },
            {
              name: "02. Get Developer Reviews & Star Breakdown",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/developers/{{developerId}}/reviews",
                  host: ["{{baseUrl}}"],
                  path: ["developers", "{{developerId}}", "reviews"]
                }
              }
            },
            {
              name: "03. Get My Review for Developer",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/developers/{{developerId}}/my-review",
                  host: ["{{baseUrl}}"],
                  path: ["developers", "{{developerId}}", "my-review"]
                }
              }
            },
            {
              name: "04. Delete My Review for Developer",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/developers/{{developerId}}/reviews",
                  host: ["{{baseUrl}}"],
                  path: ["developers", "{{developerId}}", "reviews"]
                }
              }
            },
            {
              name: "05. Send Direct Developer Enquiry (POST /developers/:id/enquiry)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    name: "Rahul Mehra",
                    phone: "+919876543210",
                    email: "rahul.mehra@example.com",
                    message: "Interested in upcoming Phase 2 launches and inventory pricing.",
                    projectInterest: "ATS Knightsbridge"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/developers/{{developerId}}/enquiry",
                  host: ["{{baseUrl}}"],
                  path: ["developers", "{{developerId}}", "enquiry"]
                }
              }
            },
            {
              name: "06. Submit Review via Direct Reviews Endpoint (POST /reviews)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    developerId: "{{developerId}}",
                    rating: 5,
                    review: "Exemplary transparency and on-time structural completion."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/reviews",
                  host: ["{{baseUrl}}"],
                  path: ["reviews"]
                }
              }
            },
            {
              name: "07. Get Developer Reviews via Direct Route (GET /reviews/developer/:id)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/reviews/developer/{{developerId}}",
                  host: ["{{baseUrl}}"],
                  path: ["reviews", "developer", "{{developerId}}"]
                }
              }
            },
            {
              name: "08. Delete Review by Review ID (DELETE /reviews/:id)",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/reviews/{{notificationId}}",
                  host: ["{{baseUrl}}"],
                  path: ["reviews", "{{notificationId}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 08. In-App Notifications
        // ---------------------------------------------------------------------
        {
          name: "09. In-App Notifications",
          description: "User inbox notifications for status updates, reviews, and admin approvals.",
          item: [
            {
              name: "01. Get My Notifications (Auto-saves notificationId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.notifications && jsonData.data.notifications.length > 0) {",
                      "    pm.collectionVariables.set('notificationId', jsonData.data.notifications[0]._id);",
                      "    console.log('✅ notificationId set to: ' + jsonData.data.notifications[0]._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/notifications",
                  host: ["{{baseUrl}}"],
                  path: ["notifications"]
                }
              }
            },
            {
              name: "02. Mark Notification as Read",
              request: {
                method: "PATCH",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/notifications/{{notificationId}}/read",
                  host: ["{{baseUrl}}"],
                  path: ["notifications", "{{notificationId}}", "read"]
                }
              }
            },
            {
              name: "03. Mark All Notifications as Read",
              request: {
                method: "POST",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/notifications/mark-all-read",
                  host: ["{{baseUrl}}"],
                  path: ["notifications", "mark-all-read"]
                }
              }
            },
            {
              name: "04. Delete Single Notification",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/notifications/{{notificationId}}",
                  host: ["{{baseUrl}}"],
                  path: ["notifications", "{{notificationId}}"]
                }
              }
            },
            {
              name: "05. Clear All Notifications",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/notifications/clear-all",
                  host: ["{{baseUrl}}"],
                  path: ["notifications", "clear-all"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 10. Commercial Spaces
        // ---------------------------------------------------------------------
        {
          name: "10. Commercial Spaces",
          description: "Endpoints for property owners, agents, and developers to list and manage commercial spaces.",
          item: [
            {
              name: "01. Create Commercial Space Listing (POST /commercial-spaces)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    spaceType: "Shop / Retail",
                    listingFor: "Sale",
                    title: "Corner Retail Shop Ground Floor",
                    price: 4800000,
                    carpetArea: 500,
                    city: "Noida",
                    locality: "Sector 18",
                    fullAddress: "Shop 12, Atta Market, Sector 18, Noida",
                    pincode: "201301"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/commercial-spaces",
                  host: ["{{baseUrl}}"],
                  path: ["commercial-spaces"]
                }
              }
            },
            {
              name: "02. Get My Commercial Dashboard (GET /commercial-spaces/my-dashboard)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/commercial-spaces/my-dashboard",
                  host: ["{{baseUrl}}"],
                  path: ["commercial-spaces", "my-dashboard"]
                }
              }
            },
            {
              name: "03. Update Commercial Space (PUT /commercial-spaces/:id)",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    price: 5000000,
                    description: "Updated price for corner retail shop"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/commercial-spaces/{{commercialSpaceId}}",
                  host: ["{{baseUrl}}"],
                  path: ["commercial-spaces", "{{commercialSpaceId}}"]
                }
              }
            },
            {
              name: "04. Delete Commercial Space (DELETE /commercial-spaces/:id)",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/commercial-spaces/{{commercialSpaceId}}",
                  host: ["{{baseUrl}}"],
                  path: ["commercial-spaces", "{{commercialSpaceId}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 11. Home Banners & Analytics
        // ---------------------------------------------------------------------
        {
          name: "11. Home Banners & Analytics",
          description: "Retrieve active home page banners and register tap/click analytics.",
          item: [
            {
              name: "01. Get Structured Home Screen Banners (GET /banners/home)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/banners/home",
                  host: ["{{baseUrl}}"],
                  path: ["banners", "home"]
                }
              }
            },
            {
              name: "02. Get Active Banners by Position (GET /banners?position=home_top)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/banners?position=home_top",
                  host: ["{{baseUrl}}"],
                  path: ["banners"],
                  query: [
                    { key: "position", value: "home_top" }
                  ]
                }
              }
            },
            {
              name: "03. Track Banner Click (PATCH /banners/:id/click)",
              request: {
                method: "PATCH",
                url: {
                  raw: "{{baseUrl}}/banners/{{bannerId}}/click",
                  host: ["{{baseUrl}}"],
                  path: ["banners", "{{bannerId}}", "click"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 12. Property Site Visit Scheduling
        // ---------------------------------------------------------------------
        {
          name: "12. Property Site Visit Scheduling",
          description: "Endpoints for scheduling property/site visits, owner notifications, fetching visits, and owner accept/reject decision flows.",
          item: [
            {
              name: "01. Schedule Visit Request (POST /visit-requests)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.visitRequest) {",
                      "    pm.collectionVariables.set('visitRequestId', jsonData.data.visitRequest._id);",
                      "    console.log('✅ visitRequestId set to: ' + jsonData.data.visitRequest._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    propertyId: "{{propertyId}}",
                    visitDate: "2026-10-15",
                    visitTime: "10:30 AM",
                    notes: "Interested in checking sunlight and parking facilities."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/visit-requests",
                  host: ["{{baseUrl}}"],
                  path: ["visit-requests"]
                }
              }
            },
            {
              name: "02. Schedule Visit Request via Property Path (POST /properties/:id/schedule-visit)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    visitDate: "2026-10-18",
                    visitTime: "02:00 PM",
                    notes: "Follow-up visit with family members."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/properties/{{propertyId}}/schedule-visit",
                  host: ["{{baseUrl}}"],
                  path: ["properties", "{{propertyId}}", "schedule-visit"]
                }
              }
            },
            {
              name: "03. Get Received Visit Requests (Owner - GET /visit-requests)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{ownerToken}}" }],
                url: {
                  raw: "{{baseUrl}}/visit-requests?status=pending",
                  host: ["{{baseUrl}}"],
                  path: ["visit-requests"],
                  query: [
                    { key: "status", value: "pending", description: "pending | accepted | rejected | all" },
                    { key: "page", value: "1", disabled: true },
                    { key: "limit", value: "10", disabled: true }
                  ]
                }
              }
            },
            {
              name: "04. Get My Scheduled Visits (Visitor/Buyer - GET /visit-requests/my-visits)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/visit-requests/my-visits",
                  host: ["{{baseUrl}}"],
                  path: ["visit-requests", "my-visits"],
                  query: [
                    { key: "status", value: "all", disabled: true }
                  ]
                }
              }
            },
            {
              name: "05. Get Visit Request by ID (GET /visit-requests/:id)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/visit-requests/{{visitRequestId}}",
                  host: ["{{baseUrl}}"],
                  path: ["visit-requests", "{{visitRequestId}}"]
                }
              }
            },
            {
              name: "06. Accept Visit Request (Owner Decision - PATCH /visit-requests/:id/accept)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{ownerToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    ownerMessage: "Looking forward to meeting you. Security gate pass has been pre-cleared."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/visit-requests/{{visitRequestId}}/accept",
                  host: ["{{baseUrl}}"],
                  path: ["visit-requests", "{{visitRequestId}}", "accept"]
                }
              }
            },
            {
              name: "07. Reject Visit Request with Message (Owner Decision - PATCH /visit-requests/:id/reject)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{ownerToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    ownerMessage: "Unavailable on Sunday due to society AGM. Please reschedule for Tuesday between 3:00 PM and 6:00 PM."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/visit-requests/{{visitRequestId}}/reject",
                  host: ["{{baseUrl}}"],
                  path: ["visit-requests", "{{visitRequestId}}", "reject"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 13. Property Booking & Token Requests (Rent with Token • Sale with 0 Token)
        // ---------------------------------------------------------------------
        {
          name: "13. Property Booking & Token Requests (Rent with Token • Sale with 0 Token)",
          description: "Unified endpoints for booking properties. For rental listings, token amount deposit is requested. For sale / non-rental listings, requests are submitted through the same API with zero token amount. Handled directly by GharMB Admin out of the app via Call/WhatsApp.",
          item: [
            {
              name: "01. Get Token Booking Config (GET /tokens/config?propertyId=:id)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/tokens/config?propertyId={{propertyId}}",
                  host: ["{{baseUrl}}"],
                  path: ["tokens", "config"],
                  query: [
                    { key: "propertyId", value: "{{propertyId}}" }
                  ]
                },
                description: "Fetches booking configuration. For Rent: returns isTokenApplicable: true and defaultTokenAmount. For Sale: returns isTokenApplicable: false and defaultTokenAmount: 0."
              }
            },
            {
              name: "02. 1-Click Rental Token Request (Rent Listing - Token Deposit Passed - POST /tokens)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.tokenRequest) {",
                      "    pm.collectionVariables.set('tokenRequestId', jsonData.data.tokenRequest._id || jsonData.data.tokenRequest.tokenRequestId);",
                      "    console.log('✅ tokenRequestId set to: ' + (jsonData.data.tokenRequest._id || jsonData.data.tokenRequest.tokenRequestId));",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    propertyId: "{{propertyId}}",
                    tokenAmount: 2000,
                    requestSource: "one_click",
                    personalDetails: {
                      fullName: "Rohan Sharma",
                      mobileNumber: "+91 98765 00112",
                      email: "rohan.sharma@example.com",
                      currentCity: "Noida"
                    },
                    message: "1-Click rental token booking request. Admin please contact via Call/WhatsApp."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/tokens",
                  host: ["{{baseUrl}}"],
                  path: ["tokens"]
                },
                description: "Rental property token booking request. Token amount is passed and assigned to Admin."
              }
            },
            {
              name: "03. 1-Click Booking Request (Sale / Non-Rent Listing - 0 Token Amount - POST /tokens)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    propertyId: "{{propertyId}}",
                    requestSource: "one_click",
                    personalDetails: {
                      fullName: "Rohan Sharma",
                      mobileNumber: "+91 98765 00112",
                      email: "rohan.sharma@example.com",
                      currentCity: "Delhi NCR"
                    },
                    message: "Booking request for sale property. No token amount needed."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/tokens",
                  host: ["{{baseUrl}}"],
                  path: ["tokens"]
                },
                description: "Sale / non-rental booking request through the same API. No token amount is passed (tokenAmount: 0). Handled out of the app by Admin."
              }
            },
            {
              name: "04. 1-Click Booking via Property Route (POST /properties/:id/token-request)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    tokenAmount: 2000,
                    requestSource: "one_click",
                    message: "Interested in this site. Please contact me."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/properties/{{propertyId}}/token-request",
                  host: ["{{baseUrl}}"],
                  path: ["properties", "{{propertyId}}", "token-request"]
                }
              }
            },
            {
              name: "04. Submit Full Form Rental Token Request (POST /tokens)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    propertyId: "{{propertyId}}",
                    personalDetails: {
                      fullName: "Rohan Sharma",
                      mobileNumber: "+91 98765 00112",
                      email: "rohan.sharma@example.com",
                      currentCity: "Delhi NCR"
                    },
                    familyDetails: {
                      numberOfFamilyMembers: "3",
                      adults: "2",
                      children: "1",
                      maritalStatus: "Married"
                    },
                    occupationDetails: {
                      profession: "Software Architect",
                      companyName: "Infosys Ltd",
                      monthlyIncome: "₹1,50,000 - ₹2,00,000"
                    },
                    idProof: {
                      idProofType: "Aadhaar",
                      documentUrl: "/uploads/sample_aadhaar.pdf",
                      documentOriginalName: "Aadhaar_RohanSharma.pdf"
                    },
                    tokenAmount: 2000,
                    monthlyRent: 28000,
                    totalAgreedPrice: "₹28,000/mo",
                    requestSource: "form",
                    message: "Rental booking request submitted with family and occupation details."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/tokens",
                  host: ["{{baseUrl}}"],
                  path: ["tokens"]
                }
              }
            },
            {
              name: "05. Get My Sent Token Requests (Tenant / Buyer - GET /tokens/my-requests)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/tokens/my-requests",
                  host: ["{{baseUrl}}"],
                  path: ["tokens", "my-requests"]
                },
                description: "Returns list of rental token requests submitted by the logged-in user with status and admin out-of-app progress."
              }
            },
            {
              name: "06. Get Received Token Requests (Owner / Landlord - GET /tokens)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{ownerToken}}" }],
                url: {
                  raw: "{{baseUrl}}/tokens?status=pending",
                  host: ["{{baseUrl}}"],
                  path: ["tokens"],
                  query: [
                    { key: "status", value: "pending", description: "pending | contacted | accepted | rejected | cancelled | all" }
                  ]
                }
              }
            },
            {
              name: "07. Get Token Booking Details by ID (GET /tokens/:id)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                url: {
                  raw: "{{baseUrl}}/tokens/{{tokenRequestId}}",
                  host: ["{{baseUrl}}"],
                  path: ["tokens", "{{tokenRequestId}}"]
                }
              }
            },
            {
              name: "08. Cancel Token Request (Tenant Action - PATCH /tokens/:id/cancel)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    cancelReason: "Change of moving plans due to office relocation."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/tokens/{{tokenRequestId}}/cancel",
                  host: ["{{baseUrl}}"],
                  path: ["tokens", "{{tokenRequestId}}", "cancel"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 14. Customer Services & Enquiries (Packers & Movers, Legal, Interior, Loan)
        // ---------------------------------------------------------------------
        {
          name: "14. Customer Services & Enquiries (Packers & Movers, Legal, Interior, Loan)",
          description: "Customer service request submission and dynamic catalogs for Movers, Legal, and Interior design. Inquiries are automatically routed exclusively to Admin.",
          item: [
            {
              name: "01. Get Dynamic Service Catalogs (Movers, Legal, Interior) - GET /services/catalogs",
              request: {
                method: "GET",
                header: [],
                url: {
                  raw: "{{baseUrl}}/services/catalogs",
                  host: ["{{baseUrl}}"],
                  path: ["services", "catalogs"]
                }
              }
            },
            {
              name: "02. Submit Packers & Movers Quote Request (POST /services/movers/enquiry)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.service) {",
                      "    pm.collectionVariables.set('serviceId', jsonData.data.service._id);",
                      "    pm.collectionVariables.set('serviceRequestIdCode', jsonData.data.service.serviceRequestId);",
                      "    console.log('✅ serviceId and serviceRequestIdCode auto-saved: ' + jsonData.data.service.serviceRequestId);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}", description: "Optional" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    clientName: "Aarav Mehta",
                    clientPhone: "9876543210",
                    clientEmail: "aarav@example.com",
                    moveFrom: "Sector 62, Noida",
                    moveTo: "Indirapuram, Ghaziabad",
                    shiftingDate: "2026-10-25",
                    bhkType: "3 BHK",
                    selectedMover: "SafeMove Packers",
                    notes: "Fragile glassware and heavy double-door refrigerator. 2nd floor with elevator.",
                    source: "app"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/services/movers/enquiry",
                  host: ["{{baseUrl}}"],
                  path: ["services", "movers", "enquiry"]
                }
              }
            },
            {
              name: "03. Book Legal Services Consultation (POST /services/legal/enquiry)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.service) {",
                      "    pm.collectionVariables.set('serviceId', jsonData.data.service._id);",
                      "    pm.collectionVariables.set('serviceRequestIdCode', jsonData.data.service.serviceRequestId);",
                      "    console.log('✅ serviceId and serviceRequestIdCode auto-saved: ' + jsonData.data.service.serviceRequestId);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}", description: "Optional" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    clientName: "Pooja Verma",
                    clientPhone: "9811223344",
                    clientEmail: "pooja.verma@example.com",
                    legalServiceType: "Sale deed drafting",
                    propertyRef: "Apex Golf Avenue, Greater Noida West",
                    location: "Noida",
                    consultationDate: "2026-10-12",
                    notes: "Resale registry agreement drafting and legal verification.",
                    source: "app"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/services/legal/enquiry",
                  host: ["{{baseUrl}}"],
                  path: ["services", "legal", "enquiry"]
                }
              }
            },
            {
              name: "04. Book Interior Design Consultation (POST /services/interior/enquiry)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.service) {",
                      "    pm.collectionVariables.set('serviceId', jsonData.data.service._id);",
                      "    pm.collectionVariables.set('serviceRequestIdCode', jsonData.data.service.serviceRequestId);",
                      "    console.log('✅ serviceId and serviceRequestIdCode auto-saved: ' + jsonData.data.service.serviceRequestId);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}", description: "Optional" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    clientName: "Kunal Malhotra",
                    clientPhone: "9988776655",
                    clientEmail: "kunal.m@example.com",
                    designStyle: "Modern",
                    packageSelected: "Premium",
                    bhkType: "3 BHK",
                    budgetRange: "₹5.0 Lakhs",
                    location: "Gurgaon, DLF Phase 5",
                    consultationDate: "2026-10-15",
                    notes: "Looking for modular kitchen, false ceiling, and woodwork.",
                    source: "app"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/services/interior/enquiry",
                  host: ["{{baseUrl}}"],
                  path: ["services", "interior", "enquiry"]
                }
              }
            },
            {
              name: "05. Unified Generic Service Enquiry (POST /services/enquiry)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{userToken}}", description: "Optional" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    serviceType: "Movers",
                    clientName: "Rahul Sharma",
                    clientPhone: "9876543210",
                    clientEmail: "rahul@example.com",
                    moveFrom: "Sector 62, Noida",
                    moveTo: "Indirapuram, Ghaziabad",
                    bhkType: "3 BHK",
                    shiftingDate: "2026-10-25",
                    source: "web"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/services/enquiry",
                  host: ["{{baseUrl}}"],
                  path: ["services", "enquiry"]
                }
              }
            },
            {
              name: "06. Get My Personal Service Enquiries - Authenticated (GET /services/my-enquiries)",
              request: {
                method: "GET",
                header: [
                  { key: "Authorization", value: "Bearer {{userToken}}" }
                ],
                url: {
                  raw: "{{baseUrl}}/services/my-enquiries",
                  host: ["{{baseUrl}}"],
                  path: ["services", "my-enquiries"]
                }
              }
            },
            {
              name: "07. Public Live Enquiry Status & Milestone Tracking (GET /services/track/:id)",
              request: {
                method: "GET",
                header: [],
                url: {
                  raw: "{{baseUrl}}/services/track/{{serviceRequestIdCode}}",
                  host: ["{{baseUrl}}"],
                  path: ["services", "track", "{{serviceRequestIdCode}}"]
                }
              }
            }
          ]
        }
      ]
    },

    // =========================================================================
    // 📁 2. ADMIN
    // =========================================================================
    {
      name: "Admin",
      description: "Complete Admin Control Suite: Moderation, Approvals, Dashboard Analytics, User Verification, and Content CMS.",
      item: [
        // ---------------------------------------------------------------------
        // 01. Authentication & Profile
        // ---------------------------------------------------------------------
        {
          name: "01. Authentication & Profile",
          description: "Admin login and profile retrieval.",
          item: [
            {
              name: "01. Admin Login (Auto-saves adminToken)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.token) {",
                      "    pm.collectionVariables.set('adminToken', jsonData.token);",
                      "    console.log('✅ adminToken set successfully');",
                      "}",
                      "if (jsonData.refreshToken) {",
                      "    pm.collectionVariables.set('adminRefreshToken', jsonData.refreshToken);",
                      "    console.log('✅ adminRefreshToken set successfully');",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ email: "admin@gmail.com", password: "admin123" }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/auth/login",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "auth", "login"]
                }
              }
            },
            {
              name: "02. Admin Profile (GET /users/me)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/users/me",
                  host: ["{{baseUrl}}"],
                  path: ["users", "me"]
                }
              }
            },
            {
              name: "03. Admin Google Sign-In (Auto-saves adminToken)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.token) {",
                      "    pm.collectionVariables.set('adminToken', jsonData.token);",
                      "    console.log('✅ adminToken set successfully from Admin Google Sign-In');",
                      "}",
                      "if (jsonData.refreshToken) {",
                      "    pm.collectionVariables.set('adminRefreshToken', jsonData.refreshToken);",
                      "    console.log('✅ adminRefreshToken set successfully from Admin Google Sign-In');",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    idToken: "PASTE_FIREBASE_OR_GOOGLE_ID_TOKEN_HERE",
                    email: "admin@gmail.com"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/auth/google",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "auth", "google"]
                }
              }
            },
            {
              name: "04. Refresh Admin Auth Token (Auto-updates adminToken & adminRefreshToken)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.token) {",
                      "    pm.collectionVariables.set('adminToken', jsonData.token);",
                      "    console.log('✅ adminToken refreshed successfully');",
                      "}",
                      "if (jsonData.refreshToken) {",
                      "    pm.collectionVariables.set('adminRefreshToken', jsonData.refreshToken);",
                      "    console.log('✅ adminRefreshToken rotated and updated');",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    refreshToken: "{{adminRefreshToken}}"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/auth/refresh-token",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "auth", "refresh-token"]
                },
                description: "Exchanges a valid admin refresh token for a new access token and rotated refresh token."
              }
            },
            {
              name: "05. Admin Firebase Sign-In (POST /admin/auth/firebase)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.token || (jsonData.data && jsonData.data.token)) {",
                      "    pm.collectionVariables.set('adminToken', jsonData.token || jsonData.data.token);",
                      "    console.log('✅ adminToken saved from Firebase Admin Sign-In');",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ idToken: "FIREBASE_ADMIN_ID_TOKEN" }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/auth/firebase",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "auth", "firebase"]
                }
              }
            },
            {
              name: "06. Refresh Admin Auth Token Alias (POST /admin/auth/refresh)",
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ refreshToken: "{{adminRefreshToken}}" }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/auth/refresh",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "auth", "refresh"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 02. Dashboard & Analytics
        // ---------------------------------------------------------------------
        {
          name: "02. Dashboard & Analytics",
          description: "KPI statistics, revenue charts, and platform lead overview.",
          item: [
            {
              name: "01. Admin Dashboard Analytics",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/dashboard/stats",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "dashboard", "stats"]
                }
              }
            },
            {
              name: "02. Admin Revenue Statistics",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/dashboard/revenue",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "dashboard", "revenue"]
                }
              }
            },
            {
              name: "03. Admin - List All Enquiries",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/dashboard/enquiries?page=1&limit=20",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "dashboard", "enquiries"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "20" }
                  ]
                }
              }
            },
            {
              name: "04. Admin - Update Enquiry Status",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ status: "contacted" }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/dashboard/enquiries/{{enquiryId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "dashboard", "enquiries", "{{enquiryId}}"]
                }
              }
            },
            {
              name: "05. Admin - Delete Enquiry",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/dashboard/enquiries/{{enquiryId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "dashboard", "enquiries", "{{enquiryId}}"]
                }
              }
            },
            {
              name: "06. Admin - Create Lead / Enquiry from Dashboard (POST /admin/dashboard/enquiries)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    name: "Harish Chandra",
                    phone: "+91 99881 12233",
                    email: "harish@example.com",
                    enquiryType: "Property Purchase",
                    propertyTitle: "Green Valley Penthouse",
                    message: "Customer inquired at back-office desk regarding payment schemes.",
                    status: "contacted"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/dashboard/enquiries",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "dashboard", "enquiries"]
                }
              }
            },
            {
              name: "07. Admin - Update Token Status via Dashboard (PATCH /admin/dashboard/tokens/:id/status)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    status: "refunded",
                    reason: "Refund approved from admin overview table",
                    utrRef: "UTR-REFUND-DASH-1002"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/dashboard/tokens/{{tokenRequestId}}/status",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "dashboard", "tokens", "{{tokenRequestId}}", "status"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 03. User Moderation & Approvals
        // ---------------------------------------------------------------------
        {
          name: "03. User Moderation & Approvals",
          description: "Manage platform accounts, review Agent RERA certifications, and approve Developer companies.",
          item: [
            {
              name: "01. Admin - List All Users (Auto-saves userId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.users && jsonData.data.users.length > 0) {",
                      "    pm.collectionVariables.set('userId', jsonData.data.users[0]._id);",
                      "    console.log('✅ userId set to: ' + jsonData.data.users[0]._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/users?role=agent&limit=20",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "users"],
                  query: [
                    { key: "role", value: "agent" },
                    { key: "limit", value: "20" }
                  ]
                }
              }
            },
            {
              name: "02. Admin - Create User / Staff Account",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    name: "Operations Associate",
                    email: "ops@gharmb.com",
                    phone: "9876500000",
                    role: "agent"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/users",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "users"]
                }
              }
            },
            {
              name: "03. Admin - Get User Details by ID",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/users/{{userId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "users", "{{userId}}"]
                }
              }
            },
            {
              name: "04. Admin - List Pending Agents (Auto-saves agentId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.agents && jsonData.data.agents.length > 0) {",
                      "    pm.collectionVariables.set('agentId', jsonData.data.agents[0]._id);",
                      "    console.log('✅ agentId set to: ' + jsonData.data.agents[0]._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/users/pending-agents",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "users", "pending-agents"]
                }
              }
            },
            {
              name: "05. Admin - Verify Agent RERA (Approve Agent)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    status: "approved",
                    notes: "RERA Certificate verified against official state registry."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/users/{{agentId}}/verify-agent",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "users", "{{agentId}}", "verify-agent"]
                }
              }
            },
            {
              name: "06. Admin - List Pending Developers (Auto-saves developerId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.developers && jsonData.data.developers.length > 0) {",
                      "    pm.collectionVariables.set('developerId', jsonData.data.developers[0]._id);",
                      "    console.log('✅ developerId set to: ' + jsonData.data.developers[0]._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/users/pending-developers",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "users", "pending-developers"]
                }
              }
            },
            {
              name: "07. Admin - Verify Developer Company (Approve Developer)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    status: "approved",
                    notes: "CIN and PAN corporate records verified successfully."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/users/{{developerId}}/verify-developer",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "users", "{{developerId}}", "verify-developer"]
                }
              }
            },
            {
              name: "08. Admin - Get User Enquiries",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/users/{{userId}}/enquiries",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "users", "{{userId}}", "enquiries"]
                }
              }
            },
            {
              name: "09. Admin - Suspend / Deactivate User",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/users/{{userId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "users", "{{userId}}"]
                }
              }
            },
            {
              name: "10. Admin - Verify User Account (PATCH /admin/users/:id/verify-user)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ isVerified: true, verificationBadge: "Verified Resident" }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/users/{{userId}}/verify-user",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "users", "{{userId}}", "verify-user"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 04. Property Moderation
        // ---------------------------------------------------------------------
        {
          name: "04. Property Moderation",
          description: "Moderation queue for owner/agent properties, status approval, and featured spotlight toggling.",
          item: [
            {
              name: "01. Admin - List All Properties for Moderation",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/properties?approvalStatus=pending&limit=20",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "properties"],
                  query: [
                    { key: "approvalStatus", value: "pending" },
                    { key: "limit", value: "20" }
                  ]
                }
              }
            },
            {
              name: "02. Admin - Approve Property Listing",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    status: "approved",
                    adminNotes: "Title deed and utility bill verified. Approved for public feed."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/properties/{{propertyId}}/status",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "properties", "{{propertyId}}", "status"]
                }
              }
            },
            {
              name: "03. Admin - Toggle Spotlight / Featured Property",
              request: {
                method: "PATCH",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/properties/{{propertyId}}/featured",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "properties", "{{propertyId}}", "featured"]
                }
              }
            },
            {
              name: "04. Admin - Delete Property Listing",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/properties/{{propertyId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "properties", "{{propertyId}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 05. Project Moderation
        // ---------------------------------------------------------------------
        {
          name: "05. Project Moderation",
          description: "Moderation and validation for new builder developments and townships.",
          item: [
            {
              name: "01. Admin - List All Projects for Moderation",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/projects?status=pending&limit=20",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "projects"],
                  query: [
                    { key: "status", value: "pending" },
                    { key: "limit", value: "20" }
                  ]
                }
              }
            },
            {
              name: "02. Admin - Approve Project Listing",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    status: "approved",
                    remarks: "Project RERA registration and master plans validated."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/projects/{{projectId}}/status",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "projects", "{{projectId}}", "status"]
                }
              }
            },
            {
              name: "03. Admin - Delete Project Listing",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/projects/{{projectId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "projects", "{{projectId}}"]
                }
              }
            },
            {
              name: "04. Admin - Create Developer Project (POST /admin/projects)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.project) {",
                      "    pm.collectionVariables.set('projectId', jsonData.data.project._id);",
                      "    console.log('✅ projectId set to: ' + jsonData.data.project._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "Godrej Palm Retreat",
                    tagline: "Resort Style Living in Noida Sector 150",
                    projectType: "residential",
                    description: "Ultra luxury residential complex designed around green expanses.",
                    city: "Noida",
                    locality: "Sector 150",
                    minPrice: 9500000,
                    maxPrice: 28500000,
                    possessionDate: "2027-12-31",
                    approvalStatus: "approved"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/projects",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "projects"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 06. Notifications & Broadcast
        // ---------------------------------------------------------------------
        {
          name: "06. Notifications & Broadcast",
          description: "Send push and in-app system broadcasts to users across the platform.",
          item: [
            {
              name: "01. Admin - Broadcast System Notification",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "Diwali Property Festival 2026",
                    message: "Zero brokerage deals and special developer subvention schemes live now!",
                    targetRole: "all",
                    priority: "high"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/notifications/broadcast",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "notifications", "broadcast"]
                }
              }
            },
            {
              name: "02. Admin - Mark Single Notification Read",
              request: {
                method: "PATCH",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/notifications/{{notificationId}}/read",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "notifications", "{{notificationId}}", "read"]
                }
              }
            },
            {
              name: "03. Admin - Mark All Notifications Read",
              request: {
                method: "POST",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/notifications/mark-all-read",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "notifications", "mark-all-read"]
                }
              }
            },
            {
              name: "04. Admin - Delete Single Notification",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/notifications/{{notificationId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "notifications", "{{notificationId}}"]
                }
              }
            },
            {
              name: "05. Admin - Clear All Notifications",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/notifications/clear-all",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "notifications", "clear-all"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 07. CMS - News & Articles
        // ---------------------------------------------------------------------
        {
          name: "07. CMS - News & Articles",
          description: "Publish, edit, and moderate real estate news articles.",
          item: [
            {
              name: "01. Admin - List All News (Auto-saves newsId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.news && jsonData.data.news.length > 0) {",
                      "    pm.collectionVariables.set('newsId', jsonData.data.news[0]._id);",
                      "    console.log('✅ newsId set to: ' + jsonData.data.news[0]._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/news?page=1&limit=10",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "news"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "10" }
                  ]
                }
              }
            },
            {
              name: "02. Admin - Create News Article",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "Noida-Greater Noida Expressway Metro Extension Approved",
                    category: "Infrastructure",
                    content: "The state cabinet has approved the detailed project report for the new metro corridor connecting Sector 142 with Botanical Garden.",
                    isPublished: true,
                    isFeatured: true
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/news",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "news"]
                }
              }
            },
            {
              name: "03. Admin - Get News by ID",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/news/{{newsId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "news", "{{newsId}}"]
                }
              }
            },
            {
              name: "04. Admin - Update News Article",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "Noida-Greater Noida Expressway Metro Extension: Work Begins 2026",
                    content: "Updated DPR indicates 8 elevated stations planned with complete multimodal interchange."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/news/{{newsId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "news", "{{newsId}}"]
                }
              }
            },
            {
              name: "05. Admin - Publish News Article",
              request: {
                method: "PATCH",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/news/{{newsId}}/publish",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "news", "{{newsId}}", "publish"]
                }
              }
            },
            {
              name: "06. Admin - Unpublish News Article",
              request: {
                method: "PATCH",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/news/{{newsId}}/unpublish",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "news", "{{newsId}}", "unpublish"]
                }
              }
            },
            {
              name: "07. Admin - Delete News Article",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/news/{{newsId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "news", "{{newsId}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 08. CMS - Market Insights & Blogs
        // ---------------------------------------------------------------------
        {
          name: "08. CMS - Market Insights & Blogs",
          description: "Author, categorize, publish, and manage real estate market insights, articles, and educational content. (Supports /admin/blogs and /admin/insights)",
          item: [
            {
              name: "01. Admin - List All Insight Articles (Auto-saves insightId & blogId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.blogs && jsonData.data.blogs.length > 0) {",
                      "    var firstBlog = jsonData.data.blogs[0];",
                      "    pm.collectionVariables.set('blogId', firstBlog._id);",
                      "    pm.collectionVariables.set('insightId', firstBlog._id);",
                      "    if (firstBlog.slug) {",
                      "        pm.collectionVariables.set('insightSlug', firstBlog.slug);",
                      "    }",
                      "    console.log('✅ insightId & blogId set to: ' + firstBlog._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/blogs?page=1&limit=10&status=&search=&sort=desc",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "10" },
                    { key: "status", value: "" },
                    { key: "search", value: "" },
                    { key: "sort", value: "desc" }
                  ]
                }
              }
            },
            {
              name: "02. Admin - Get Insight Article by ID (GET /admin/blogs/:id)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/blogs/{{insightId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs", "{{insightId}}"]
                }
              }
            },
            {
              name: "03. Admin - Create Insight Article (POST /admin/blogs)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.blog) {",
                      "    pm.collectionVariables.set('blogId', jsonData.data.blog._id);",
                      "    pm.collectionVariables.set('insightId', jsonData.data.blog._id);",
                      "    if (jsonData.data.blog.slug) {",
                      "        pm.collectionVariables.set('insightSlug', jsonData.data.blog.slug);",
                      "    }",
                      "    console.log('✅ Created insight article with ID: ' + jsonData.data.blog._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "Top 7 Tips for First-Time Home Buyers in 2026",
                    slug: "top-7-tips-for-first-time-home-buyers-in-2026",
                    category: "{{insightCategoryId}}",
                    excerpt: "A complete strategic guide on home loan interest rates, registry fees, carpet area calculations, and RERA due diligence.",
                    content: "<h2>1. Assess Your Financial Health</h2><p>Buying a home is one of life's biggest milestones. Start by checking your CIBIL score and maintaining a healthy debt-to-income ratio.</p><h2>2. Verify RERA Compliance</h2><p>Always verify the developer's RERA registration number and approved building sanctions before placing token money.</p><h2>3. Hidden Cost Checklist</h2><p>Account for GST, registry stamp duty, maintenance deposits, and parking fees in your total budget.</p>",
                    bannerImage: "http://localhost:5001/uploads/sample-insight-banner.jpg",
                    author: "GharMB Editorial Team",
                    readTime: 6,
                    status: "published",
                    isFeatured: true,
                    tags: ["Home Buying", "RERA", "Finance", "Investment"],
                    seo: {
                      metaTitle: "Top 7 Tips for First-Time Home Buyers in 2026 | GharMB Insights",
                      metaDescription: "Discover essential tips for buying your first home in India, from RERA checks to stamp duty savings.",
                      ogImage: "http://localhost:5001/uploads/sample-insight-banner.jpg",
                      canonicalUrl: "https://gharmb.com/insights/top-7-tips-for-first-time-home-buyers-in-2026"
                    }
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/blogs",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs"]
                }
              }
            },
            {
              name: "04. Admin - Update Insight Article (PUT /admin/blogs/:id)",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "Top 7 Tips for First-Time Home Buyers in 2026 (Updated Edition)",
                    excerpt: "Updated guide with the latest 2026 RBI repo rate adjustments, stamp duty rebates, and RERA guidelines.",
                    content: "<p>Updated analysis of micro-market yields and home loan tax exemptions under Section 24 and Section 80C.</p>",
                    readTime: 7,
                    isFeatured: true,
                    status: "published",
                    tags: ["Home Buying", "RERA", "Finance", "Tax Benefits"]
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/blogs/{{insightId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs", "{{insightId}}"]
                }
              }
            },
            {
              name: "05. Admin - Publish Insight Article (PATCH /admin/blogs/:id/publish)",
              request: {
                method: "PATCH",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/blogs/{{insightId}}/publish",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs", "{{insightId}}", "publish"]
                }
              }
            },
            {
              name: "06. Admin - Unpublish Insight Article (PATCH /admin/blogs/:id/unpublish)",
              request: {
                method: "PATCH",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/blogs/{{insightId}}/unpublish",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs", "{{insightId}}", "unpublish"]
                }
              }
            },
            {
              name: "07. Admin - Upload Insight Banner / Media (POST /admin/blogs/upload)",
              request: {
                method: "POST",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                body: {
                  mode: "formdata",
                  formdata: [{ key: "image", type: "file", src: [] }]
                },
                url: {
                  raw: "{{baseUrl}}/admin/blogs/upload",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs", "upload"]
                }
              }
            },
            {
              name: "08. Admin - Bulk Update Publication Status (PATCH /admin/blogs/bulk-status)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ ids: ["{{insightId}}"], isPublished: true, status: "published" }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/blogs/bulk-status",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs", "bulk-status"]
                }
              }
            },
            {
              name: "09. Admin - Reorder Insight Articles (PUT /admin/blogs/reorder)",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ orders: [{ id: "{{insightId}}", order: 1 }] }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/blogs/reorder",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs", "reorder"]
                }
              }
            },
            {
              name: "10. Admin - Bulk Delete Insight Articles (POST /admin/blogs/bulk-delete)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ ids: ["{{insightId}}"] }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/blogs/bulk-delete",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs", "bulk-delete"]
                }
              }
            },
            {
              name: "11. Admin - Delete Single Insight Article (DELETE /admin/blogs/:id)",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/blogs/{{insightId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs", "{{insightId}}"]
                }
              }
            },
            {
              name: "12. Admin - List Insight Categories (Auto-saves insightCategoryId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.categories && jsonData.data.categories.length > 0) {",
                      "    var firstCat = jsonData.data.categories[0];",
                      "    pm.collectionVariables.set('blogCategoryId', firstCat._id);",
                      "    pm.collectionVariables.set('insightCategoryId', firstCat._id);",
                      "    console.log('✅ insightCategoryId & blogCategoryId set to: ' + firstCat._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/blog-categories",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blog-categories"]
                }
              }
            },
            {
              name: "13. Admin - Create Insight Category (POST /admin/blog-categories)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.category) {",
                      "    pm.collectionVariables.set('blogCategoryId', jsonData.data.category._id);",
                      "    pm.collectionVariables.set('insightCategoryId', jsonData.data.category._id);",
                      "    console.log('✅ Created insight category with ID: ' + jsonData.data.category._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    name: "Market Trends & Price Index",
                    isActive: true
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/blog-categories",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blog-categories"]
                }
              }
            },
            {
              name: "14. Admin - Update Insight Category (PUT /admin/blog-categories/:id)",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    name: "Market Trends & Real Estate Analytics",
                    isActive: true
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/blog-categories/{{insightCategoryId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blog-categories", "{{insightCategoryId}}"]
                }
              }
            },
            {
              name: "15. Admin - Bulk Delete Insight Categories (POST /admin/blog-categories/bulk-delete)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ ids: ["{{insightCategoryId}}"] }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/blog-categories/bulk-delete",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blog-categories", "bulk-delete"]
                }
              }
            },
            {
              name: "16. Admin - Delete Single Insight Category (DELETE /admin/blog-categories/:id)",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/blog-categories/{{insightCategoryId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blog-categories", "{{insightCategoryId}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 09. CMS - Legal Policies & Static Pages
        // ---------------------------------------------------------------------
        {
          name: "09. CMS - Legal Policies & Static Pages",
          description: "Update platform policies, Terms of Service, Privacy Policy, and informational web pages.",
          item: [
            {
              name: "01. Admin - List Legal Policies (Auto-saves policyId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.policies && jsonData.data.policies.length > 0) {",
                      "    pm.collectionVariables.set('policyId', jsonData.data.policies[0]._id);",
                      "    console.log('✅ policyId set to: ' + jsonData.data.policies[0]._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/legal/policies",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "legal", "policies"]
                }
              }
            },
            {
              name: "02. Admin - Create Legal Policy",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "Platform Refund and Subscription Policy",
                    type: "refund-policy",
                    content: "Subscription payments and featured listing promotional packs are non-refundable once activated.",
                    platform: "app"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/legal/policies",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "legal", "policies"]
                }
              }
            },
            {
              name: "03. Admin - Update Terms of Service Policy",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "Terms and Conditions of Use",
                    content: "1. Acceptance of Terms\nBy accessing GharMB, you agree to comply with our real estate portal guidelines and verification standards."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/legal/terms",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "legal", "terms"]
                }
              }
            },
            {
              name: "04. Admin - Delete Legal Policy",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/legal/policies/{{policyId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "legal", "policies", "{{policyId}}"]
                }
              }
            },
            {
              name: "05. Admin - Get Static Page (About Us)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/pages/about-us",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "pages", "about-us"]
                }
              }
            },
            {
              name: "06. Admin - Update Static Page (About Us)",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "About GharMB",
                    content: "GharMB is India's premier real estate ecosystem connecting verified owners, licensed agents, and tier-1 builders with home seekers."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/pages/about-us",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "pages", "about-us"]
                }
              }
            },
            {
              name: "07. Admin - Update Static Page (Help & Support)",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "Help & Customer Support",
                    content: "For assistance regarding listings, KYC verification, or developer partnerships, reach out to help@gharmb.com."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/pages/help-support",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "pages", "help-support"]
                }
              }
            },
            {
              name: "08. Admin - Get Contact Us Details (GET /admin/pages/contact-us)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/pages/contact-us",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "pages", "contact-us"]
                }
              }
            },
            {
              name: "09. Admin - Update Contact Us Details (PUT /admin/pages/contact-us)",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "Get in Touch with GharMB",
                    content: "Have questions about property verification, builder tracking, or partnership opportunities? Reach out to our dedicated advisory team.",
                    metadata: {
                      helpline: "+91 98765 43210",
                      tollFree: "1800-120-GHARMB",
                      whatsapp: "+91 98765 43210",
                      supportEmail: "support@gharmb.in",
                      salesEmail: "sales@gharmb.in",
                      partnershipEmail: "partner@gharmb.in",
                      workingHours: "Monday – Saturday: 9:00 AM – 8:00 PM IST",
                      weekendSupport: "Sunday: Emergency WhatsApp Support Only",
                      responseGuarantee: "⚡ Fast Resolution: First response within 15 minutes",
                      headquarters: {
                        building: "GHARMB Tower, Sector 29, Cyber City Phase 2",
                        city: "Gurugram",
                        state: "Haryana",
                        pincode: "122002",
                        country: "India"
                      }
                    }
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/pages/contact-us",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "pages", "contact-us"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 10. CMS - FAQs & Categories
        // ---------------------------------------------------------------------
        {
          name: "10. CMS - FAQs & Categories",
          description: "Manage frequently asked questions and user guidance.",
          item: [
            {
              name: "01. Admin - List All FAQs",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/faqs",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "faqs"]
                }
              }
            },
            {
              name: "02. Admin - Create FAQ",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    question: "How does GharMB verify RERA credentials?",
                    answer: "Our compliance team cross-checks state RERA portals and uploaded certificates before badge issuance.",
                    category: "Verification"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/faqs",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "faqs"]
                }
              }
            },
            {
              name: "03. Admin - List FAQ Categories",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/faq-categories",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "faq-categories"]
                }
              }
            },
            {
              name: "04. Admin - Create FAQ Category",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.category) {",
                      "    pm.collectionVariables.set('faqCategoryId', jsonData.data.category._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    name: "Property Listings",
                    slug: "listings"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/faq-categories",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "faq-categories"]
                }
              }
            },
            {
              name: "05. Admin - Bulk Delete FAQs (POST /admin/faqs/bulk-delete)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ ids: ["{{faqId}}"] }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/faqs/bulk-delete",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "faqs", "bulk-delete"]
                }
              }
            },
            {
              name: "06. Admin - Reorder FAQs (PUT /admin/faqs/reorder)",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ orders: [{ id: "{{faqId}}", order: 1 }] }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/faqs/reorder",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "faqs", "reorder"]
                }
              }
            },
            {
              name: "07. Admin - Bulk Delete FAQ Categories (POST /admin/faq-categories/bulk-delete)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ ids: ["{{faqCategoryId}}"] }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/faq-categories/bulk-delete",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "faq-categories", "bulk-delete"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 11. CMS - Testimonials
        // ---------------------------------------------------------------------
        {
          name: "11. CMS - Testimonials",
          description: "Manage client testimonials and endorsements.",
          item: [
            {
              name: "01. Admin - List All Testimonials (Auto-saves testimonialId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.testimonials && jsonData.data.testimonials.length > 0) {",
                      "    pm.collectionVariables.set('testimonialId', jsonData.data.testimonials[0]._id);",
                      "    console.log('✅ testimonialId set to: ' + jsonData.data.testimonials[0]._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/testimonials",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "testimonials"]
                }
              }
            },
            {
              name: "02. Admin - Create Testimonial",
              request: {
                method: "POST",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "name", value: "Sunil Verma", type: "text" },
                    { key: "role", value: "Buyer (Noida Sector 76)", type: "text" },
                    { key: "rating", value: "5", type: "text" },
                    { key: "content", value: "Found our dream home within 2 weeks of searching on GharMB. The zero brokerage direct owner connect was seamless.", type: "text" }
                  ]
                },
                url: {
                  raw: "{{baseUrl}}/admin/testimonials",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "testimonials"]
                }
              }
            },
            {
              name: "03. Admin - Update Testimonial",
              request: {
                method: "PUT",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "rating", value: "5", type: "text" },
                    { key: "content", value: "Found our dream home in Sector 76. The direct owner contact and prompt agent assistance was world class!", type: "text" }
                  ]
                },
                url: {
                  raw: "{{baseUrl}}/admin/testimonials/{{testimonialId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "testimonials", "{{testimonialId}}"]
                }
              }
            },
            {
              name: "04. Admin - Delete Testimonial",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/testimonials/{{testimonialId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "testimonials", "{{testimonialId}}"]
                }
              }
            },
            {
              name: "05. Admin - Get Testimonial by ID (GET /admin/testimonials/:id)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/testimonials/{{testimonialId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "testimonials", "{{testimonialId}}"]
                }
              }
            },
            {
              name: "06. Admin - Bulk Delete Testimonials (POST /admin/testimonials/bulk-delete)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ ids: ["{{testimonialId}}"] }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/testimonials/bulk-delete",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "testimonials", "bulk-delete"]
                }
              }
            },
            {
              name: "07. Admin - Reorder Testimonials (PUT /admin/testimonials/reorder)",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ orders: [{ id: "{{testimonialId}}", order: 1 }] }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/testimonials/reorder",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "testimonials", "reorder"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 12. Web Inquiries & Contacts
        // ---------------------------------------------------------------------
        {
          name: "12. Web Inquiries & Contacts",
          description: "Inspect partnership and contact form messages submitted from the public portal.",
          item: [
            {
              name: "01. Admin - Web Inquiry Stats",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/web-inquiries/stats",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "web-inquiries", "stats"]
                }
              }
            },
            {
              name: "02. Admin - List All Web Inquiries (Auto-saves inquiryId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.inquiries && jsonData.data.inquiries.length > 0) {",
                      "    pm.collectionVariables.set('inquiryId', jsonData.data.inquiries[0]._id);",
                      "    console.log('✅ inquiryId set to: ' + jsonData.data.inquiries[0]._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/web-inquiries?page=1&limit=20",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "web-inquiries"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "20" }
                  ]
                }
              }
            },
            {
              name: "03. Admin - Delete Web Inquiry",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/web-inquiries/{{inquiryId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "web-inquiries", "{{inquiryId}}"]
                }
              }
            },
            {
              name: "04. Admin - Get Web Inquiry by ID (GET /admin/web-inquiries/:id)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/web-inquiries/{{inquiryId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "web-inquiries", "{{inquiryId}}"]
                }
              }
            },
            {
              name: "05. Admin - Update Web Inquiry (PATCH /admin/web-inquiries/:id)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    status: "contacted",
                    adminNotes: "Client called regarding property consultation."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/web-inquiries/{{inquiryId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "web-inquiries", "{{inquiryId}}"]
                }
              }
            },
            {
              name: "06. Admin - Bulk Delete Web Inquiries (POST /admin/web-inquiries/bulk-delete)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ ids: ["{{inquiryId}}"] }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/web-inquiries/bulk-delete",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "web-inquiries", "bulk-delete"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 11. Admin - Commercial Space Moderation
        // ---------------------------------------------------------------------
        {
          name: "13. Admin - Commercial Space Moderation",
          description: "Review, approve, reject, feature, or delete commercial space listings.",
          item: [
            {
              name: "01. List All Commercial Spaces (Admin)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/commercial-spaces",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "commercial-spaces"]
                }
              }
            },
            {
              name: "02. Approve / Reject Commercial Space Status",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ approvalStatus: "approved" }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/commercial-spaces/{{commercialSpaceId}}/status",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "commercial-spaces", "{{commercialSpaceId}}", "status"]
                }
              }
            },
            {
              name: "03. Toggle Featured Commercial Space",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ listingTier: "Featured" }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/commercial-spaces/{{commercialSpaceId}}/featured",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "commercial-spaces", "{{commercialSpaceId}}", "featured"]
                }
              }
            },
            {
              name: "04. Delete Commercial Space (Admin)",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/commercial-spaces/{{commercialSpaceId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "commercial-spaces", "{{commercialSpaceId}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 12. Admin - Home Banners Management
        // ---------------------------------------------------------------------
        {
          name: "14. Admin - Home Banners Management",
          description: "Create, update, toggle status, reorder, and delete home screen promotional banners.",
          item: [
            {
              name: "01. Get All Banners (Admin)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/banners",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "banners"]
                }
              }
            },
            {
              name: "02. Create New Home Banner",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "Exclusive Commercial Hubs",
                    subtitle: "High footfall retail shops & offices with assured rental yields",
                    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=500&fit=crop&q=80",
                    position: "home_top",
                    linkType: "category",
                    linkValue: "Commercial",
                    buttonText: "Explore Now",
                    sortOrder: 1,
                    isActive: true
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/banners",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "banners"]
                }
              }
            },
            {
              name: "03. Update Banner by ID",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    title: "Updated Banner Title",
                    sortOrder: 2
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/banners/{{bannerId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "banners", "{{bannerId}}"]
                }
              }
            },
            {
              name: "04. Toggle Banner Active Status",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ isActive: true }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/banners/{{bannerId}}/status",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "banners", "{{bannerId}}", "status"]
                }
              }
            },
            {
              name: "05. Reorder Banners (Bulk)",
              request: {
                method: "PUT",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    items: [
                      { id: "{{bannerId}}", sortOrder: 1 }
                    ]
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/banners/reorder",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "banners", "reorder"]
                }
              }
            },
            {
              name: "06. Delete Banner (Admin)",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/banners/{{bannerId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "banners", "{{bannerId}}"]
                }
              }
            },
            {
              name: "07. Admin - Bulk Delete Banners (POST /admin/banners/bulk-delete)",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({ ids: ["{{bannerId}}"] }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/banners/bulk-delete",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "banners", "bulk-delete"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 15. Admin - Rental Token Booking & Out-of-App Followup
        // ---------------------------------------------------------------------
        {
          name: "15. Admin - Rental Token Booking & Out-of-App Followup",
          description: "Manage rental token requests, direct-to-admin notifications, out-of-app discussion states (call / whatsapp notes), offline token collection confirmation, and property-specific token amount settings.",
          item: [
            {
              name: "01. Get Token Amount Settings (GET /admin/tokens/settings)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/tokens/settings",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "tokens", "settings"]
                }
              }
            },
            {
              name: "02. Update Token Amount Settings (PATCH /admin/tokens/settings)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    tokenAmounts: [2000, 5000],
                    defaultTokenAmount: 2000,
                    minTokenAmount: 1000,
                    maxTokenAmount: 100000,
                    allowCustomAmount: false,
                    adjustmentNote: "Rental site token amount. Transaction is coordinated out-of-the-app by GharMB Admin via Phone/WhatsApp. No online payment gateway.",
                    validityDays: 7
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/tokens/settings",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "tokens", "settings"]
                }
              }
            },
            {
              name: "03. Update Property-Specific Token Settings (PATCH /admin/tokens/property/:propertyId/settings)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    tokenAmounts: [2000, 5000],
                    defaultTokenAmount: 2000,
                    adjustmentNote: "Rental token deposit will be adjusted in security deposit or 1st month rent."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/tokens/property/{{propertyId}}/settings",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "tokens", "property", "{{propertyId}}", "settings"]
                }
              }
            },
            {
              name: "04. List All Token Booking Requests (GET /admin/tokens)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.tokens && jsonData.data.tokens.length > 0) {",
                      "    var first = jsonData.data.tokens[0];",
                      "    pm.collectionVariables.set('tokenRequestId', first._id || first.id);",
                      "    console.log('✅ tokenRequestId auto-saved from tokens list: ' + (first._id || first.id));",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/tokens?status=All&page=1&limit=50",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "tokens"],
                  query: [
                    { key: "status", value: "All", description: "All | pending_contact | contacted | accepted | rejected | cancelled" },
                    { key: "page", value: "1" },
                    { key: "limit", value: "50" }
                  ]
                }
              }
            },
            {
              name: "05. List Pending Contact Rental Tokens (GET /admin/tokens?status=pending_contact)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/tokens?status=pending_contact&page=1&limit=50",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "tokens"],
                  query: [
                    { key: "status", value: "pending_contact" },
                    { key: "page", value: "1" },
                    { key: "limit", value: "50" }
                  ]
                }
              }
            },
            {
              name: "06. List In-Discussion Contacted Tokens (GET /admin/tokens?status=contacted)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/tokens?status=contacted&page=1&limit=50",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "tokens"],
                  query: [
                    { key: "status", value: "contacted" },
                    { key: "page", value: "1" },
                    { key: "limit", value: "50" }
                  ]
                }
              }
            },
            {
              name: "07. List Token Received / Accepted (GET /admin/tokens?status=accepted)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/tokens?status=accepted&page=1&limit=50",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "tokens"],
                  query: [
                    { key: "status", value: "accepted" },
                    { key: "page", value: "1" },
                    { key: "limit", value: "50" }
                  ]
                }
              }
            },
            {
              name: "08. Record Rental Token Booking Manually (POST /admin/tokens)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.tokenRequest) {",
                      "    pm.collectionVariables.set('tokenRequestId', jsonData.data.tokenRequest._id);",
                      "    console.log('✅ tokenRequestId set from manual admin booking');",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    propertyId: "{{propertyId}}",
                    buyerName: "Rohan Sharma",
                    buyerPhone: "+91 98765 00112",
                    buyerEmail: "rohan.sharma@example.com",
                    currentCity: "Delhi NCR",
                    tokenAmount: 2000,
                    monthlyRent: 28000,
                    totalAgreedPrice: "₹28,000/mo",
                    message: "Rental token booking reservation recorded manually by Admin"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/tokens",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "tokens"]
                }
              }
            },
            {
              name: "09. Get Token Booking by ID (GET /admin/tokens/:id)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/tokens/{{tokenRequestId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "tokens", "{{tokenRequestId}}"]
                }
              }
            },
            {
              name: "10. Log Out-of-App Contact & Discussion Notes (PATCH /admin/tokens/:id/status)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    action: "contact",
                    status: "contacted",
                    contactNotes: "Called prospective tenant. Confirmed move-in date and coordinated offline token deposit."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/tokens/{{tokenRequestId}}/status",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "tokens", "{{tokenRequestId}}", "status"]
                },
                description: "Logs that GharMB admin contacted the user out-of-the-app (Phone/WhatsApp) and saves discussion notes."
              }
            },
            {
              name: "11. Confirm Offline Token Received (PATCH /admin/tokens/:id/status)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    action: "accept",
                    tokenReceivedAmount: 2000,
                    tokenReceivedDate: "2026-10-05T15:30:00.000Z",
                    notes: "Token amount collected offline via UPI / cash payment directly."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/tokens/{{tokenRequestId}}/status",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "tokens", "{{tokenRequestId}}", "status"]
                },
                description: "Admin marks token booking accepted upon receiving token offline."
              }
            },
            {
              name: "12. Reject / Decline Token Booking (PATCH /admin/tokens/:id/status)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    action: "reject",
                    reason: "Tenant changed requirements or property already reserved."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/tokens/{{tokenRequestId}}/status",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "tokens", "{{tokenRequestId}}", "status"]
                }
              }
            },
            {
              name: "13. Delete Token Booking (DELETE /admin/tokens/:id)",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/tokens/{{tokenRequestId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "tokens", "{{tokenRequestId}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 16. Admin - Services Management (Loans, Interiors, Movers, Legal)
        // ---------------------------------------------------------------------
        {
          name: "16. Admin - Services Management (Loans, Interiors, Movers, Legal)",
          description: "Full lifecycle tracking, partner assignments, milestone progression, and quotations for platform services.",
          item: [
            {
              name: "01. List All Service Requests & KPI Counts (GET /admin/services)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.services && jsonData.data.services.length > 0) {",
                      "    var s = jsonData.data.services[0];",
                      "    pm.collectionVariables.set('serviceId', s._id);",
                      "    console.log('✅ serviceId auto-saved: ' + s._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/services?serviceType=ALL&status=All",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "services"],
                  query: [
                    { key: "serviceType", value: "ALL", description: "ALL | Loan | Interior | Movers | Legal" },
                    { key: "status", value: "All", description: "All | Pending | In Progress | In Review | Completed | Cancelled" },
                    { key: "search", value: "", disabled: true }
                  ]
                }
              }
            },
            {
              name: "02. Filter Services by Category (GET /admin/services?serviceType=Loan)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/services?serviceType=Loan",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "services"],
                  query: [
                    { key: "serviceType", value: "Loan" }
                  ]
                }
              }
            },
            {
              name: "03. Create New Service Request (POST /admin/services)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.service) {",
                      "    pm.collectionVariables.set('serviceId', jsonData.data.service._id);",
                      "    console.log('✅ serviceId set to: ' + jsonData.data.service._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    serviceType: "Loan",
                    serviceName: "Home Loan Assistance",
                    clientName: "Vikram Malhotra",
                    clientPhone: "+91 98112 34567",
                    clientEmail: "vikram.malhotra@example.com",
                    location: "Gurugram, Sector 54",
                    propertyRef: "DLF The Crest 3BHK",
                    propertyValue: "₹3.50 Cr",
                    loanRequired: "₹2.20 Cr",
                    employmentType: "Salaried - MNC",
                    monthlyIncome: "₹2,75,000",
                    cibilScore: "785",
                    preferredBank: "HDFC Bank",
                    assignedPartner: "HDFC Home Loans Direct",
                    quotation: "₹2,20,00,000 @ 8.45% ROI",
                    status: "In Progress",
                    notes: "Fast-track loan processing requested for upcoming property registration."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/services",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "services"]
                }
              }
            },
            {
              name: "04. Get Service Request Details by ID (GET /admin/services/:id)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/services/{{serviceId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "services", "{{serviceId}}"]
                }
              }
            },
            {
              name: "05. Update Service Request (PATCH /admin/services/:id)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    status: "In Review",
                    assignedPartner: "SBI Home Finance Special Desk",
                    quotation: "₹2,20,00,000 @ 8.35% ROI",
                    notes: "Bank sanction letter issued pending disbursal cheque.",
                    notesAuthor: "Admin"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/services/{{serviceId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "services", "{{serviceId}}"]
                }
              }
            },
            {
              name: "06. Delete Service Request (DELETE /admin/services/:id)",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/services/{{serviceId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "services", "{{serviceId}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 17. Admin - Referral & Ambassador Network
        // ---------------------------------------------------------------------
        {
          name: "17. Admin - Referral & Ambassador Network",
          description: "Manage ambassador referral recommendations, milestone deal progression, reward calculation, and payout settlements.",
          item: [
            {
              name: "01. List All Referrals & Payout KPI Metrics (GET /admin/referrals)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.referrals && jsonData.data.referrals.length > 0) {",
                      "    var ref = jsonData.data.referrals[0];",
                      "    pm.collectionVariables.set('referralId', ref._id);",
                      "    console.log('✅ referralId auto-saved: ' + ref._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/referrals?status=All&page=1&limit=50",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "referrals"],
                  query: [
                    { key: "status", value: "All", description: "All | Deal In Progress | Eligible for Payout | Paid" },
                    { key: "page", value: "1" },
                    { key: "limit", value: "50" },
                    { key: "search", value: "", disabled: true }
                  ]
                }
              }
            },
            {
              name: "02. Record New Referral Deal (POST /admin/referrals)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.referral) {",
                      "    pm.collectionVariables.set('referralId', jsonData.data.referral._id);",
                      "    console.log('✅ referralId set to: ' + jsonData.data.referral._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    referrerName: "Anand Verma",
                    referrerPhone: "+91 98201 12345",
                    referrerEmail: "anand.verma@example.com",
                    referrerRole: "Resident Ambassador",
                    referralCode: "ANAND-2026",
                    refereeName: "Suresh Gupta",
                    refereePhone: "+91 99887 66554",
                    refereeEmail: "suresh.gupta@example.com",
                    propertyTitle: "Ace Parkway 3BHK Tower B",
                    dealValue: "₹1.45 Cr",
                    rewardAmount: 25000,
                    payoutStatus: "Deal In Progress",
                    bankDetails: "HDFC Bank A/C 50100234567891 IFSC HDFC0001234",
                    upiId: "anandverma@okhdfcbank",
                    notes: "Lead submitted via referral network card."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/referrals",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "referrals"]
                }
              }
            },
            {
              name: "03. Get Referral Details by ID (GET /admin/referrals/:id)",
              request: {
                method: "GET",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/referrals/{{referralId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "referrals", "{{referralId}}"]
                }
              }
            },
            {
              name: "04. Update Referral Information (PATCH /admin/referrals/:id)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    dealValue: "₹1.50 Cr",
                    rewardAmount: 30000,
                    notes: "Final registration scheduled with Sub-Registrar this Friday."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/referrals/{{referralId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "referrals", "{{referralId}}"]
                }
              }
            },
            {
              name: "05. Transition Referral Status Lifecycle (PATCH /admin/referrals/:id/status)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    payoutStatus: "Eligible for Payout",
                    notes: "Registry completed and commission cleared for disbursement."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/referrals/{{referralId}}/status",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "referrals", "{{referralId}}", "status"]
                }
              }
            },
            {
              name: "06. Settle Referral Commission Payout (PATCH /admin/referrals/:id/payout)",
              request: {
                method: "PATCH",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    payoutRefId: "NEFT-UTR-8910237490",
                    notes: "Commission ₹30,000 transferred via NEFT to verified bank account."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/referrals/{{referralId}}/payout",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "referrals", "{{referralId}}", "payout"]
                }
              }
            },
            {
              name: "07. Delete Referral Record (DELETE /admin/referrals/:id)",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/referrals/{{referralId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "referrals", "{{referralId}}"]
                }
              }
            }
          ]
        }
      ]
    },

    // =========================================================================
    // 📁 3. SHARED
    // =========================================================================
    {
      name: "Shared",
      description: "Public and shared APIs accessible by websites, mobile apps, and unauthenticated guests.",
      item: [
        // ---------------------------------------------------------------------
        // 01. System & Health
        // ---------------------------------------------------------------------
        {
          name: "01. System & Health",
          description: "Service connectivity, ping, and root status.",
          item: [
            {
              name: "01. Root Service Info",
              request: {
                method: "GET",
                url: {
                  raw: "http://localhost:5001/",
                  host: ["http://localhost:5001"],
                  path: [""]
                }
              }
            },
            {
              name: "02. Server Health Check",
              request: {
                method: "GET",
                url: {
                  raw: "http://localhost:5001/health",
                  host: ["http://localhost:5001"],
                  path: ["health"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 02. Properties & Listings (Public Feed)
        // ---------------------------------------------------------------------
        {
          name: "02. Properties & Listings (Public Feed)",
          description: "Search, filter, geospatial proximity query, and view approved properties.",
          item: [
            {
              name: "01. Get Latest Properties (GET /properties/latest)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/properties/latest?page=1&limit=10",
                  host: ["{{baseUrl}}"],
                  path: ["properties", "latest"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "10" }
                  ]
                }
              }
            },
            {
              name: "02. Get All Verified Properties (GET /properties/verified)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/properties/verified?page=1&limit=20",
                  host: ["{{baseUrl}}"],
                  path: ["properties", "verified"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "20" }
                  ]
                }
              }
            },
            {
              name: "02. Get All Live Properties (Public Feed & Filters)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/properties?listingFor=sale&category=residential&propertyType=apartment&city=Noida&minPrice=5000000&maxPrice=15000000",
                  host: ["{{baseUrl}}"],
                  path: ["properties"],
                  query: [
                    { key: "listingFor", value: "sale" },
                    { key: "category", value: "residential" },
                    { key: "propertyType", value: "apartment" },
                    { key: "city", value: "Noida" },
                    { key: "minPrice", value: "5000000" },
                    { key: "maxPrice", value: "15000000" }
                  ]
                }
              }
            },
            {
              name: "02. Get Near-Me Properties (Geospatial Coordinates)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/properties/near-me?city=Noida&lat=28.5355&lng=77.3910&radius=50&radiusUnit=km",
                  host: ["{{baseUrl}}"],
                  path: ["properties", "near-me"],
                  query: [
                    { key: "city", value: "Noida" },
                    { key: "lat", value: "28.5355" },
                    { key: "lng", value: "77.3910" },
                    { key: "radius", value: "50" },
                    { key: "radiusUnit", value: "km" }
                  ]
                }
              }
            },
            {
              name: "03. Get Detailed Property by ID",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/properties/{{propertyId}}",
                  host: ["{{baseUrl}}"],
                  path: ["properties", "{{propertyId}}"]
                }
              }
            },
            {
              name: "04. Filter Properties Ready for Immediate Key Handover",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/properties?keyHandover=true",
                  host: ["{{baseUrl}}"],
                  path: ["properties"],
                  query: [
                    { key: "keyHandover", value: "true" }
                  ]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 03. Developer Projects (Public Directory)
        // ---------------------------------------------------------------------
        {
          name: "03. Developer Projects (Public Directory)",
          description: "Browse approved builder developments and township project showcases.",
          item: [
            {
              name: "01. Get All Approved Projects (Public Directory)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/projects?city=Noida&projectType=residential&page=1&limit=10",
                  host: ["{{baseUrl}}"],
                  path: ["projects"],
                  query: [
                    { key: "city", value: "Noida" },
                    { key: "projectType", value: "residential" },
                    { key: "page", value: "1" },
                    { key: "limit", value: "10" }
                  ]
                }
              }
            },
            {
              name: "02. Get Project Details by ID",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/projects/{{projectId}}",
                  host: ["{{baseUrl}}"],
                  path: ["projects", "{{projectId}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 04. Developers & Agency Directory
        // ---------------------------------------------------------------------
        {
          name: "04. Developers & Agency Directory",
          description: "Public directory of verified builders and client reviews.",
          item: [
            {
              name: "01. Get All Verified Developers (Auto-saves developerId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.developers && jsonData.data.developers.length > 0) {",
                      "    pm.collectionVariables.set('developerId', jsonData.data.developers[0]._id);",
                      "    console.log('✅ developerId set to: ' + jsonData.data.developers[0]._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/developers?city=Noida&page=1&limit=10",
                  host: ["{{baseUrl}}"],
                  path: ["developers"],
                  query: [
                    { key: "city", value: "Noida" },
                    { key: "page", value: "1" },
                    { key: "limit", value: "10" }
                  ]
                }
              }
            },
            {
              name: "02. Get Developer Detail by ID",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/developers/{{developerId}}",
                  host: ["{{baseUrl}}"],
                  path: ["developers", "{{developerId}}"]
                }
              }
            },
            {
              name: "03. Get Developer Reviews",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/developers/{{developerId}}/reviews",
                  host: ["{{baseUrl}}"],
                  path: ["developers", "{{developerId}}", "reviews"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 05. Real Estate News Feed
        // ---------------------------------------------------------------------
        {
          name: "05. Real Estate News Feed",
          description: "Public feeds for real estate industry news, policy updates, and market trends.",
          item: [
            {
              name: "01. Get All Published News (GET /news)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/news?page=1&limit=10",
                  host: ["{{baseUrl}}"],
                  path: ["news"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "10" }
                  ]
                }
              }
            },
            {
              name: "02. Get Featured News (GET /news/featured)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/news/featured",
                  host: ["{{baseUrl}}"],
                  path: ["news", "featured"]
                }
              }
            },
            {
              name: "03. Get News by Category (GET /news/category/:category)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/news/category/Market?page=1&limit=10",
                  host: ["{{baseUrl}}"],
                  path: ["news", "category", "Market"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "10" }
                  ]
                }
              }
            },
            {
              name: "04. Get News Detail by ID (GET /news/:id)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/news/{{newsId}}",
                  host: ["{{baseUrl}}"],
                  path: ["news", "{{newsId}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 06. Market Insights & Knowledge Hub
        // ---------------------------------------------------------------------
        {
          name: "06. Market Insights & Knowledge Hub",
          description: "Public editorial portal for comprehensive real estate guides, market insights, and legal knowledge. (Supports /blogs and /insights)",
          item: [
            {
              name: "01. Get All Published Market Insights (GET /blogs)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.blogs && jsonData.data.blogs.length > 0) {",
                      "    var first = jsonData.data.blogs[0];",
                      "    pm.collectionVariables.set('blogId', first._id);",
                      "    pm.collectionVariables.set('insightId', first._id);",
                      "    if (first.slug) {",
                      "        pm.collectionVariables.set('insightSlug', first.slug);",
                      "    }",
                      "    console.log('✅ insightId & insightSlug set from public feed: ' + first._id);",
                      "}"
                    ],
                    type: "text/javascript"
                  }
                }
              ],
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/blogs?page=1&limit=12",
                  host: ["{{baseUrl}}"],
                  path: ["blogs"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "12" }
                  ]
                }
              }
            },
            {
              name: "02. Filter Insights by Category Slug (GET /blogs?category=:slug)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/blogs?category=finance&page=1&limit=12",
                  host: ["{{baseUrl}}"],
                  path: ["blogs"],
                  query: [
                    { key: "category", value: "finance" },
                    { key: "page", value: "1" },
                    { key: "limit", value: "12" }
                  ]
                }
              }
            },
            {
              name: "03. Search Insights by Query (GET /blogs?search=:query)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/blogs?search=RERA&page=1&limit=12",
                  host: ["{{baseUrl}}"],
                  path: ["blogs"],
                  query: [
                    { key: "search", value: "RERA" },
                    { key: "page", value: "1" },
                    { key: "limit", value: "12" }
                  ]
                }
              }
            },
            {
              name: "04. Get Active Insight Categories for Navigation Tabs (GET /blogs/categories)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/blogs/categories",
                  host: ["{{baseUrl}}"],
                  path: ["blogs", "categories"]
                }
              }
            },
            {
              name: "05. Get Single Published Insight Article by Slug (GET /blogs/:slug)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/blogs/{{insightSlug}}",
                  host: ["{{baseUrl}}"],
                  path: ["blogs", "{{insightSlug}}"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 07. Policies & Static Content
        // ---------------------------------------------------------------------
        {
          name: "07. Policies & Static Content",
          description: "Read legal disclosures, Terms of Service, Privacy Policy, and company information.",
          item: [
            {
              name: "01. Get All Published Legal Policies",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/legal/policies?platform=app",
                  host: ["{{baseUrl}}"],
                  path: ["legal", "policies"],
                  query: [{ key: "platform", value: "app" }]
                }
              }
            },
            {
              name: "02. Get Terms of Service",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/legal/terms",
                  host: ["{{baseUrl}}"],
                  path: ["legal", "terms"]
                }
              }
            },
            {
              name: "03. Get Privacy Policy",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/legal/privacy-policy",
                  host: ["{{baseUrl}}"],
                  path: ["legal", "privacy-policy"]
                }
              }
            },
            {
              name: "04. Get About Us Content",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/pages/about-us",
                  host: ["{{baseUrl}}"],
                  path: ["pages", "about-us"]
                }
              }
            },
            {
              name: "05. Get Help & Support Content",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/pages/help-support",
                  host: ["{{baseUrl}}"],
                  path: ["pages", "help-support"]
                }
              }
            },
            {
              name: "06. Get Specific Legal Policy by Type (GET /legal/policy/:type)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/legal/policy/privacy-policy",
                  host: ["{{baseUrl}}"],
                  path: ["legal", "policy", "privacy-policy"]
                }
              }
            },
            {
              name: "07. Get Public Contact Us Details (GET /pages/contact-us)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/pages/contact-us",
                  host: ["{{baseUrl}}"],
                  path: ["pages", "contact-us"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 08. FAQs, Testimonials & Contact
        // ---------------------------------------------------------------------
        {
          name: "08. FAQs, Testimonials & Contact",
          description: "Frequently Asked Questions, client reviews, and direct web portal inquiries.",
          item: [
            {
              name: "01. Get All FAQs (GET /faqs)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/faqs",
                  host: ["{{baseUrl}}"],
                  path: ["faqs"]
                }
              }
            },
            {
              name: "02. Get All Testimonials (GET /testimonials)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/testimonials",
                  host: ["{{baseUrl}}"],
                  path: ["testimonials"]
                }
              }
            },
            {
              name: "03. Submit Contact / Web Inquiry (POST /web-inquiries)",
              request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    name: "Amitabh Sen",
                    email: "amitabh@example.com",
                    phone: "9876599999",
                    subject: "Partnership Opportunity",
                    message: "Interested in featuring our upcoming township project on GharMB."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/web-inquiries",
                  host: ["{{baseUrl}}"],
                  path: ["web-inquiries"]
                }
              }
            },
            {
              name: "04. Get Active FAQ Categories (GET /faqs/categories)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/faqs/categories",
                  host: ["{{baseUrl}}"],
                  path: ["faqs", "categories"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 09. Commercial Spaces (Public Feed)
        // ---------------------------------------------------------------------
        {
          name: "09. Commercial Spaces (Public Feed)",
          description: "Search, filter, geospatial proximity lookup, and detailed view of commercial spaces.",
          item: [
            {
              name: "01. Search Commercial Spaces (GET /commercial-spaces)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/commercial-spaces?spaceType=Shop%20%2F%20Retail&listingFor=Sale&city=Noida&page=1&limit=20",
                  host: ["{{baseUrl}}"],
                  path: ["commercial-spaces"],
                  query: [
                    { key: "spaceType", value: "Shop / Retail" },
                    { key: "listingFor", value: "Sale" },
                    { key: "city", value: "Noida" },
                    { key: "page", value: "1" },
                    { key: "limit", value: "20" }
                  ]
                }
              }
            },
            {
              name: "02. Get Near-Me Commercial Spaces (Geospatial Coordinates)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/commercial-spaces/near-me?lat=28.5355&lng=77.3910&radius=50&radiusUnit=km",
                  host: ["{{baseUrl}}"],
                  path: ["commercial-spaces", "near-me"],
                  query: [
                    { key: "lat", value: "28.5355" },
                    { key: "lng", value: "77.3910" },
                    { key: "radius", value: "50" },
                    { key: "radiusUnit", value: "km" }
                  ]
                }
              }
            },
            {
              name: "03. Get Commercial Space Details by ID",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/commercial-spaces/{{commercialSpaceId}}",
                  host: ["{{baseUrl}}"],
                  path: ["commercial-spaces", "{{commercialSpaceId}}"]
                }
              }
            },
            {
              name: "04. Get Latest Commercial Spaces (GET /commercial-spaces/latest)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/commercial-spaces/latest?page=1&limit=10",
                  host: ["{{baseUrl}}"],
                  path: ["commercial-spaces", "latest"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "10" }
                  ]
                }
              }
            },
            {
              name: "05. Get Featured Commercial Spaces (GET /commercial-spaces/featured)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/commercial-spaces/featured?page=1&limit=10",
                  host: ["{{baseUrl}}"],
                  path: ["commercial-spaces", "featured"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "10" }
                  ]
                }
              }
            },
            {
              name: "06. Get Commercial Space Types Breakdown (GET /commercial-spaces/types)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/commercial-spaces/types",
                  host: ["{{baseUrl}}"],
                  path: ["commercial-spaces", "types"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 10. Home Banners (Public Feed)
        // ---------------------------------------------------------------------
        {
          name: "10. Home Banners (Public Feed)",
          description: "Public endpoints for fetching home screen banners and hero slides.",
          item: [
            {
              name: "01. Get Structured Home Screen Banners (GET /banners/home)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/banners/home",
                  host: ["{{baseUrl}}"],
                  path: ["banners", "home"]
                }
              }
            },
            {
              name: "02. Get Active Banners (GET /banners?position=home_top)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/banners?position=home_top",
                  host: ["{{baseUrl}}"],
                  path: ["banners"],
                  query: [
                    { key: "position", value: "home_top" }
                  ]
                }
              }
            }
          ]
        }
      ]
    }
  ]
};

// Generate single Postman Collection file in project root
const rootOutputPath = path.join(__dirname, '../gharmb.postman_collection.json');

const jsonString = JSON.stringify(collection, null, 2);

fs.writeFileSync(rootOutputPath, jsonString, 'utf-8');
console.log('✅ Successfully updated Postman Collection at:', rootOutputPath);

module.exports = collection;

