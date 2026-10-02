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
    { key: "userToken", value: "", type: "string" },
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
    { key: "policyId", value: "", type: "string" },
    { key: "testimonialId", value: "", type: "string" },
    { key: "inquiryId", value: "", type: "string" },
    { key: "tokenRequestId", value: "", type: "string" }
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
              name: "05. Google Sign-In / Firebase Auth (Auto-saves userToken)",
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
                      "    console.log('✅ userToken & userId set successfully from Google Sign-In');",
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
                    role: "buyer",
                    phone: "+919876543210"
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/user/auth/google",
                  host: ["{{baseUrl}}"],
                  path: ["user", "auth", "google"]
                }
              }
            },
            {
              name: "06. Get Current User Profile (GET /user/auth/me)",
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
              name: "07. Submit Basic Info (Screen 1: Basic Info)",
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
                    message: "Ready to proceed with token booking for this property.",
                    paymentMethod: "upi",
                    transactionId: "UPI-TXN-123456789"
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
                    loanAssistanceNeeded: true
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
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "file", type: "file", src: [] }
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
              name: "02. Upload Multiple Files (General)",
              request: {
                method: "POST",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "files", type: "file", src: [] },
                    { key: "files", type: "file", src: [] }
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
              name: "03. Upload Property Documents by ID",
              request: {
                method: "POST",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "images", type: "file", src: [] },
                    { key: "titleDeed", type: "file", src: [] },
                    { key: "electricityBill", type: "file", src: [] }
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
              name: "04. Upload Project Brochures & Plans by ID",
              request: {
                method: "POST",
                header: [{ key: "Authorization", value: "Bearer {{developerToken}}" }],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "photos", type: "file", src: [] },
                    { key: "masterPlan", type: "file", src: [] },
                    { key: "brochure", type: "file", src: [] }
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
              name: "05. Upload Multiple Files Linked to Property",
              request: {
                method: "POST",
                header: [{ key: "Authorization", value: "Bearer {{userToken}}" }],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "files", type: "file", src: [] }
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
              name: "06. Upload Multiple Files Linked to Project",
              request: {
                method: "POST",
                header: [{ key: "Authorization", value: "Bearer {{developerToken}}" }],
                body: {
                  mode: "formdata",
                  formdata: [
                    { key: "files", type: "file", src: [] }
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
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 08. In-App Notifications
        // ---------------------------------------------------------------------
        {
          name: "08. In-App Notifications",
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
        // 09. Reviews & Ratings
        // ---------------------------------------------------------------------
        {
          name: "09. Reviews & Ratings",
          description: "Submit client reviews and ratings for verified developers.",
          item: [
            {
              name: "01. Submit Developer Review",
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
                    review: "Top notch construction quality, delivered clubhouse amenities ahead of possession deadline!"
                  }, null, 2)
                },
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
        // 08. CMS - Blogs & Categories
        // ---------------------------------------------------------------------
        {
          name: "08. CMS - Blogs & Categories",
          description: "Author and publish editorial blog posts and topics.",
          item: [
            {
              name: "01. Admin - List All Blogs (Auto-saves blogId)",
              event: [
                {
                  listen: "test",
                  script: {
                    exec: [
                      "var jsonData = pm.response.json();",
                      "if (jsonData.data && jsonData.data.blogs && jsonData.data.blogs.length > 0) {",
                      "    pm.collectionVariables.set('blogId', jsonData.data.blogs[0]._id);",
                      "    console.log('✅ blogId set to: ' + jsonData.data.blogs[0]._id);",
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
                  raw: "{{baseUrl}}/admin/blogs?page=1&limit=10",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "10" }
                  ]
                }
              }
            },
            {
              name: "02. Admin - Create Blog Article",
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
                    excerpt: "A complete guide on home loan interest rates, registry fees, and RERA due diligence.",
                    content: "Buying a home is one of life's biggest milestones. Here is our expert guide on credit score planning, carpet area verification, and legal checklist.",
                    category: "Guides",
                    isPublished: true
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
              name: "03. Admin - Publish Blog",
              request: {
                method: "PATCH",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/blogs/{{blogId}}/publish",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs", "{{blogId}}", "publish"]
                }
              }
            },
            {
              name: "04. Admin - Unpublish Blog",
              request: {
                method: "PATCH",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/blogs/{{blogId}}/unpublish",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs", "{{blogId}}", "unpublish"]
                }
              }
            },
            {
              name: "05. Admin - Delete Blog",
              request: {
                method: "DELETE",
                header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
                url: {
                  raw: "{{baseUrl}}/admin/blogs/{{blogId}}",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blogs", "{{blogId}}"]
                }
              }
            },
            {
              name: "06. Admin - List Blog Categories",
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
              name: "07. Admin - Create Blog Category",
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "Bearer {{adminToken}}" }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    name: "Home Loans & Finance",
                    slug: "finance",
                    description: "Articles on home loan subsidies, interest rate cycles, and EMIs."
                  }, null, 2)
                },
                url: {
                  raw: "{{baseUrl}}/admin/blog-categories",
                  host: ["{{baseUrl}}"],
                  path: ["admin", "blog-categories"]
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
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 11. Admin - Commercial Space Moderation
        // ---------------------------------------------------------------------
        {
          name: "11. Admin - Commercial Space Moderation",
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
          name: "12. Admin - Home Banners Management",
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
        // 05. News, Articles & Blogs
        // ---------------------------------------------------------------------
        {
          name: "05. News, Articles & Blogs",
          description: "Public feeds for real estate market news and informative articles.",
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
            },
            {
              name: "05. Get All Published Blogs (GET /blogs)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/blogs?page=1&limit=10",
                  host: ["{{baseUrl}}"],
                  path: ["blogs"],
                  query: [
                    { key: "page", value: "1" },
                    { key: "limit", value: "10" }
                  ]
                }
              }
            },
            {
              name: "06. Get Blog Categories (GET /blogs/categories)",
              request: {
                method: "GET",
                url: {
                  raw: "{{baseUrl}}/blogs/categories",
                  host: ["{{baseUrl}}"],
                  path: ["blogs", "categories"]
                }
              }
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 06. Policies & Static Content
        // ---------------------------------------------------------------------
        {
          name: "06. Policies & Static Content",
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
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 07. FAQs, Testimonials & Contact
        // ---------------------------------------------------------------------
        {
          name: "07. FAQs, Testimonials & Contact",
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
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 08. Commercial Spaces (Public Search & Details)
        // ---------------------------------------------------------------------
        {
          name: "08. Commercial Spaces (Public Feed)",
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
            }
          ]
        },

        // ---------------------------------------------------------------------
        // 09. Home Banners (Public Feed)
        // ---------------------------------------------------------------------
        {
          name: "09. Home Banners (Public Feed)",
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

// Generate Postman Collection file in project root
const rootOutputPath = path.join(__dirname, '../gharmb.postman_collection.json');

const jsonString = JSON.stringify(collection, null, 2);

fs.writeFileSync(rootOutputPath, jsonString, 'utf-8');
console.log('✅ Successfully updated root Postman Collection at:', rootOutputPath);

