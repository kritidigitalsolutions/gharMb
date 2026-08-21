/**
 * Script to generate complete Postman Collection v2.1
 * with full request bodies, headers, auth tokens, variables, and comments.
 */

const fs = require('fs');
const path = require('path');

const collection = {
  info: {
    _postman_id: "gharmb-api-full-suite-2026",
    name: "GharMB - Complete API Suite (Roles, Moderation & Workflows)",
    description: "Complete Postman API Collection for GharMB Platform.\nIncludes:\n- Owner, Agent/Broker, Developer/Builder & Admin Auth\n- RERA Document & Profile Verification\n- Upload Guards (Blocked until Admin Approval)\n- 5-Step Property & Project Uploads\n- Admin Moderation & Approval Flow\n- Public Filtered GET APIs",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5001/api", type: "string" },
    { key: "adminToken", value: "", type: "string" },
    { key: "agentToken", value: "", type: "string" },
    { key: "developerToken", value: "", type: "string" },
    { key: "ownerToken", value: "", type: "string" },
    { key: "agentId", value: "", type: "string" },
    { key: "developerId", value: "", type: "string" },
    { key: "propertyId", value: "", type: "string" },
    { key: "projectId", value: "", type: "string" }
  ],
  item: [
    // ---------------------------------------------------------
    // 01. Authentication & User Setup
    // ---------------------------------------------------------
    {
      name: "01. Authentication & Setup",
      item: [
        {
          name: "Admin Login",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.token) {",
                  "    pm.collectionVariables.set('adminToken', jsonData.token);",
                  "    console.log('adminToken set successfully');",
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
                email: "admin@gmail.com",
                password: "admin123"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/admin/auth/login",
              host: ["{{baseUrl}}"],
              path: ["admin", "auth", "login"]
            }
          }
        },
        {
          name: "Get Current Admin Profile",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: {
              raw: "{{baseUrl}}/admin/auth/me",
              host: ["{{baseUrl}}"],
              path: ["admin", "auth", "me"]
            }
          }
        },
        {
          name: "Owner / User Register (Send OTP)",
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
          name: "Owner / User Verify OTP",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.token) {",
                  "    pm.collectionVariables.set('ownerToken', jsonData.token);",
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
              raw: "{{baseUrl}}/user/auth/verify-otp",
              host: ["{{baseUrl}}"],
              path: ["user", "auth", "verify-otp"]
            }
          }
        },
        {
          name: "Agent Register (Send OTP)",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Rahul Verma (Agent)",
                phone: "9876500001",
                email: "rahul.agent@example.com"
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
          name: "Agent Verify OTP",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.token) {",
                  "    pm.collectionVariables.set('agentToken', jsonData.token);",
                  "    pm.collectionVariables.set('agentId', jsonData.data.user.id);",
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
                phone: "9876500001",
                otp: "123456"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/user/auth/verify-otp",
              host: ["{{baseUrl}}"],
              path: ["user", "auth", "verify-otp"]
            }
          }
        },
        {
          name: "Developer Register (Send OTP)",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Vikram Singhania (Builder)",
                phone: "9876500002",
                email: "vikram@emeraldinfra.com"
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
          name: "Developer Verify OTP",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.token) {",
                  "    pm.collectionVariables.set('developerToken', jsonData.token);",
                  "    pm.collectionVariables.set('developerId', jsonData.data.user.id);",
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
                phone: "9876500002",
                otp: "123456"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/user/auth/verify-otp",
              host: ["{{baseUrl}}"],
              path: ["user", "auth", "verify-otp"]
            }
          }
        },
        {
          name: "Get My Profile",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{agentToken}}" }],
            url: {
              raw: "{{baseUrl}}/users/me",
              host: ["{{baseUrl}}"],
              path: ["users", "me"]
            }
          }
        }
      ]
    },

    // ---------------------------------------------------------
    // 02. File & Document Uploads (Form-Data Attached to Property/Project)
    // ---------------------------------------------------------
    {
      name: "02. File & Document Uploads",
      item: [
        {
          name: "Upload Multiple Photos (Attach to Property ID)",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{agentToken}}" }],
            body: {
              mode: "formdata",
              formdata: [
                {
                  key: "files",
                  type: "file",
                  src: []
                }
              ]
            },
            url: {
              raw: "{{baseUrl}}/user/upload/multiple?propertyId={{propertyId}}",
              host: ["{{baseUrl}}"],
              path: ["user", "upload", "multiple"],
              query: [{ key: "propertyId", value: "{{propertyId}}" }]
            }
          }
        },
        {
          name: "Upload Multiple Photos (Attach to Project ID)",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{developerToken}}" }],
            body: {
              mode: "formdata",
              formdata: [
                {
                  key: "files",
                  type: "file",
                  src: []
                }
              ]
            },
            url: {
              raw: "{{baseUrl}}/user/upload/multiple?projectId={{projectId}}",
              host: ["{{baseUrl}}"],
              path: ["user", "upload", "multiple"],
              query: [{ key: "projectId", value: "{{projectId}}" }]
            }
          }
        },
        {
          name: "Upload Property Document (Title Deed / Electricity Bill / Tax Receipt / Khata)",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{ownerToken}}" }],
            body: {
              mode: "formdata",
              formdata: [
                {
                  key: "file",
                  type: "file",
                  src: ""
                }
              ]
            },
            url: {
              raw: "{{baseUrl}}/user/upload/single?propertyId={{propertyId}}&docType=titleDeed",
              host: ["{{baseUrl}}"],
              path: ["user", "upload", "single"],
              query: [
                { key: "propertyId", value: "{{propertyId}}" },
                { key: "docType", value: "titleDeed" }
              ]
            }
          }
        },
        {
          name: "Upload Project Master Plan (Attach to Project ID)",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{developerToken}}" }],
            body: {
              mode: "formdata",
              formdata: [
                {
                  key: "file",
                  type: "file",
                  src: ""
                }
              ]
            },
            url: {
              raw: "{{baseUrl}}/user/upload/single?projectId={{projectId}}&field=masterPlan",
              host: ["{{baseUrl}}"],
              path: ["user", "upload", "single"],
              query: [
                { key: "projectId", value: "{{projectId}}" },
                { key: "field", value: "masterPlan" }
              ]
            }
          }
        },
        {
          name: "Upload Project Floor Plan (Attach to Project ID)",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{developerToken}}" }],
            body: {
              mode: "formdata",
              formdata: [
                {
                  key: "file",
                  type: "file",
                  src: ""
                }
              ]
            },
            url: {
              raw: "{{baseUrl}}/user/upload/single?projectId={{projectId}}&field=floorPlan",
              host: ["{{baseUrl}}"],
              path: ["user", "upload", "single"],
              query: [
                { key: "projectId", value: "{{projectId}}" },
                { key: "field", value: "floorPlan" }
              ]
            }
          }
        },
        {
          name: "Upload Project Brochure PDF (Attach to Project ID)",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{developerToken}}" }],
            body: {
              mode: "formdata",
              formdata: [
                {
                  key: "file",
                  type: "file",
                  src: ""
                }
              ]
            },
            url: {
              raw: "{{baseUrl}}/user/upload/single?projectId={{projectId}}&field=brochure",
              host: ["{{baseUrl}}"],
              path: ["user", "upload", "single"],
              query: [
                { key: "projectId", value: "{{projectId}}" },
                { key: "field", value: "brochure" }
              ]
            }
          }
        },
        {
          name: "Upload Standalone Single File (RERA / PAN / Aadhaar / Logo)",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{agentToken}}" }],
            body: {
              mode: "formdata",
              formdata: [
                {
                  key: "file",
                  type: "file",
                  src: ""
                }
              ]
            },
            url: {
              raw: "{{baseUrl}}/user/upload/single",
              host: ["{{baseUrl}}"],
              path: ["user", "upload", "single"]
            }
          }
        },
        {
          name: "Upload Standalone Multiple Files",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{agentToken}}" }],
            body: {
              mode: "formdata",
              formdata: [
                {
                  key: "files",
                  type: "file",
                  src: []
                }
              ]
            },
            url: {
              raw: "{{baseUrl}}/user/upload/multiple",
              host: ["{{baseUrl}}"],
              path: ["user", "upload", "multiple"]
            }
          }
        }
      ]
    },

    // ---------------------------------------------------------
    // 03. Agent / Broker Workflow
    // ---------------------------------------------------------
    {
      name: "03. Agent / Broker Workflow",
      item: [
        {
          name: "Step 1 & 2: Submit Agent Registration & RERA Verification Docs",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.token) {",
                  "    pm.collectionVariables.set('agentToken', jsonData.token);",
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
              { key: "Authorization", value: "Bearer {{agentToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Rahul Sharma",
                phone: "9876500001",
                reraNumber: "UPRERA24AGT987654",
                experience: "3-5 yrs",
                cityOfOperation: "Noida",
                reraCertificate: "uploads/rera_agent_cert.pdf",
                aadhaarCard: "uploads/aadhaar_card.jpg",
                profilePhoto: "uploads/agent_profile.jpg"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/users/register-agent",
              host: ["{{baseUrl}}"],
              path: ["users", "register-agent"]
            }
          }
        },
        {
          name: "[TEST GUARD] Agent Upload Property BEFORE Admin Approval (Expect 403)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{agentToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                listingAs: "Agent / Broker",
                category: "Residential",
                listingFor: "Sale",
                propertyType: "Apartment",
                title: "3 BHK Apartment in Sector 62",
                city: "Noida",
                locality: "Sector 62",
                fullAddress: "Tower A, Skyline Heights",
                pincode: "201301",
                carpetArea: 1450,
                price: 8500000
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
          name: "Agent Upload Property AFTER Admin Approval (5-Step Listing)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.data && jsonData.data.property) {",
                  "    pm.collectionVariables.set('propertyId', jsonData.data.property._id);",
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
              { key: "Authorization", value: "Bearer {{agentToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                listingAs: "Agent / Broker",
                category: "Residential",
                listingFor: "Sale",
                propertyType: "Apartment",
                title: "Skyline Heights — 3 BHK Apartment",
                city: "Noida",
                locality: "Sector 62",
                fullAddress: "A-304, Skyline Heights, Sector 62, Noida",
                pincode: "201301",
                description: "Spacious 3 BHK apartment with premium wooden flooring, modular kitchen, park view balcony.",
                bedrooms: "3",
                bathrooms: "3",
                carpetArea: 1450,
                builtUpArea: 1680,
                floorNo: "8",
                totalFloors: "18",
                ageOfProperty: "0–3 yrs",
                furnishing: "Semi-furnished",
                facingDirection: "East",
                parking: "1 covered",
                amenities: ["Security", "Gym", "Lift", "Power backup", "Pool", "Wi-Fi", "Garden", "Clubhouse"],
                price: 8500000,
                listingTier: "Featured",
                vastuCompliant: true,
                openToAllBuyers: true,
                loanAssistanceNeeded: true,
                images: [
                  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
                  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9"
                ],
                propertyDocuments: {
                  titleDeed: "uploads/title_deed.pdf",
                  electricityBill: "uploads/electricity_bill.pdf",
                  taxReceipt: "uploads/tax_receipt.pdf",
                  khataExtract: "uploads/khata_cert.pdf"
                },
                longitude: 77.3649,
                latitude: 28.6280
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
          name: "Agent View My Dashboard",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{agentToken}}" }],
            url: {
              raw: "{{baseUrl}}/properties/my-dashboard",
              host: ["{{baseUrl}}"],
              path: ["properties", "my-dashboard"]
            }
          }
        },
        {
          name: "Agent Update Owned Property",
          request: {
            method: "PUT",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{agentToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                price: 8200000,
                description: "Price reduced! Urgent sale for 3 BHK in Skyline Heights Sector 62."
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
          name: "Agent Delete Owned Property",
          request: {
            method: "DELETE",
            header: [{ key: "Authorization", value: "Bearer {{agentToken}}" }],
            url: {
              raw: "{{baseUrl}}/properties/{{propertyId}}",
              host: ["{{baseUrl}}"],
              path: ["properties", "{{propertyId}}"]
            }
          }
        }
      ]
    },

    // ---------------------------------------------------------
    // 04. Developer / Builder Workflow
    // ---------------------------------------------------------
    {
      name: "04. Developer / Builder Workflow",
      item: [
        {
          name: "Step 1, 2 & 3: Submit Developer Registration & Company Docs",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.token) {",
                  "    pm.collectionVariables.set('developerToken', jsonData.token);",
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
                companyName: "Emerald Builders Pvt Ltd",
                reraNumber: "UPREAREG24DEV8899",
                gstNumber: "07AAAAA0000A1Z5",
                yearsInBusiness: "5-10 yrs",
                cityOfOperation: "Noida",
                reraCertificate: "uploads/developer_rera_cert.pdf",
                panCard: "uploads/company_pan.jpg",
                companyLogo: "uploads/emerald_logo.png",
                bio: "Emerald Builders is an ISO-certified real estate development group specializing in sustainable luxury condominiums and townships.",
                unitsDelivered: "500",
                isIsoCertified: true,
                submitForVerification: true
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/users/register-developer",
              host: ["{{baseUrl}}"],
              path: ["users", "register-developer"]
            }
          }
        },
        {
          name: "[TEST GUARD] Developer Upload Project BEFORE Admin Approval (Expect 403)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{developerToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                projectName: "Emerald Heights Phase 2",
                reraProjectNumber: "UPRERAPRJ249911",
                city: "Noida",
                locality: "Sector 150",
                fullAddress: "Plot GH-01, Sector 150, Noida Express Highway",
                pincode: "201310"
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
          name: "Developer Upload 5-Step Project AFTER Admin Approval",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.data && jsonData.data.project) {",
                  "    pm.collectionVariables.set('projectId', jsonData.data.project._id);",
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
                projectName: "Emerald Heights Phase 2",
                developerName: "Emerald Builders Pvt Ltd",
                reraProjectNumber: "UPREAREG24PRJ0015",
                reraExpiryDate: "31/12/2028",
                launchDate: "15/01/2024",
                projectType: "Residential",
                projectStatus: "Under construction",
                city: "Meerut",
                locality: "Shastri Nagar",
                fullAddress: "Plot No. 45, Sector 4, Near NH-58, Shastri Nagar, Meerut",
                pincode: "250002",
                possessionDate: "Dec 2026",
                projectWebsite: "https://emeraldheights.in",
                projectTagline: "Where luxury meets nature",
                shortDescription: "Premium gated project near NH-58 with 70% open green space, high-end amenities and RERA approval.",
                totalUnits: 240,
                openSpacePercentage: 70,
                floors: "G + 14",
                towers: 3,
                bhkConfigurations: [
                  {
                    bhkType: "2 BHK",
                    carpetArea: 1150,
                    minPrice: 4500000,
                    maxPrice: 5800000,
                    priceRangeText: "₹45 L - ₹58 L",
                    availableUnits: 80
                  },
                  {
                    bhkType: "3 BHK",
                    carpetArea: 1620,
                    minPrice: 7200000,
                    maxPrice: 9000000,
                    priceRangeText: "₹72 L - ₹90 L",
                    availableUnits: 120
                  },
                  {
                    bhkType: "4 BHK",
                    carpetArea: 2200,
                    minPrice: 11000000,
                    maxPrice: 13500000,
                    priceRangeText: "₹1.10 Cr - ₹1.35 Cr",
                    availableUnits: 40
                  }
                ],
                amenities: [
                  "RERA approved", "Gated society", "24/7 security", "Lift",
                  "Clubhouse", "Swimming pool", "Gym", "Garden", "Kids play area",
                  "Jogging track", "Amphitheatre", "Cricket pitch", "Tennis court",
                  "Badminton court", "Metro nearby", "Power backup", "WiFi ready", "EV charging"
                ],
                nearbyLandmarks: [
                  { locationName: "NH-58 Highway", distance: "1.2 km" },
                  { locationName: "Metro Station", distance: "3.5 km" },
                  { locationName: "City Hospital", distance: "2.0 km" }
                ],
                vastuCompliant: true,
                projectPhotos: [
                  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
                  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab"
                ],
                masterPlanUrl: "uploads/emerald_master_plan.jpg",
                floorPlanUrl: "uploads/emerald_3bhk_floorplan.jpg",
                brochureUrl: "uploads/emerald_heights_brochure.pdf",
                longitude: 77.7064,
                latitude: 28.9845
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
          name: "Developer View My Projects",
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
          name: "Developer Update Owned Project",
          request: {
            method: "PUT",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{developerToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                possessionDate: "March 2027",
                totalUnits: 260
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/projects/{{projectId}}",
              host: ["{{baseUrl}}"],
              path: ["projects", "{{projectId}}"]
            }
          }
        }
      ]
    },

    // ---------------------------------------------------------
    // 05. Owner Workflow
    // ---------------------------------------------------------
    {
      name: "05. Owner Workflow",
      item: [
        {
          name: "Owner Upload Residential Property For Sale",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{ownerToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                listingAs: "Owner",
                category: "Residential",
                listingFor: "Sale",
                propertyType: "Apartment",
                title: "2 BHK Flat in Sector 18 Noida",
                city: "Noida",
                locality: "Sector 18",
                fullAddress: "Flat 402, Lotus Greens, Sector 18, Noida",
                pincode: "201301",
                description: "Direct from owner. Very close to Metro station and Mall.",
                bedrooms: "2",
                bathrooms: "2",
                carpetArea: 1050,
                price: 6500000,
                furnishing: "Semi-furnished",
                parking: "1 covered",
                listingTier: "Standard",
                propertyDocuments: {
                  titleDeed: "uploads/owner_title_deed.pdf",
                  electricityBill: "uploads/owner_electricity_bill.pdf"
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
          name: "Owner Upload Residential Property For Rent",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{ownerToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                listingAs: "Owner",
                category: "Residential",
                listingFor: "Rent",
                propertyType: "Apartment",
                title: "3 BHK Apartment for Rent in Sector 62",
                city: "Noida",
                locality: "Sector 62",
                fullAddress: "Flat B-501, Stellar Kings Court, Sector 62, Noida",
                pincode: "201301",
                description: "Fully furnished flat with high speed broadband and power backup.",
                bedrooms: "3",
                bathrooms: "3",
                carpetArea: 1350,
                price: 25000,
                securityDeposit: 50000,
                securityDepositDuration: "2 months",
                maintenanceCharges: 2500,
                maintenanceIncludedInRent: false,
                preferredTenants: ["Family", "Working professionals"],
                petsAllowed: true,
                smokingAllowed: false,
                noticePeriod: "1 month",
                availableFrom: "Immediate",
                listingTier: "Standard"
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
          name: "Owner Upload Commercial Property For Rent/Lease",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{ownerToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                listingAs: "Owner",
                category: "Commercial",
                listingFor: "Rent",
                propertyType: "Office space",
                title: "Furnished Office Space in Commercial Hub",
                city: "Noida",
                locality: "Sector 62",
                fullAddress: "Unit 305, Logix Cyber Park, Sector 62, Noida",
                pincode: "201301",
                description: "Plug and play office space with 25 workstations, conference room, pantry.",
                carpetArea: 2200,
                price: 110000,
                securityDeposit: 330000,
                maintenanceCharges: 15000,
                ceilingHeight: "10–14 ft",
                powerLoad: 15,
                lockInPeriod: "3 years",
                camIncluded: "No",
                rentEscalationPercentage: 5,
                listingTier: "Featured"
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
          name: "Owner View My Dashboard",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{ownerToken}}" }],
            url: {
              raw: "{{baseUrl}}/properties/my-dashboard",
              host: ["{{baseUrl}}"],
              path: ["properties", "my-dashboard"]
            }
          }
        }
      ]
    },

    // ---------------------------------------------------------
    // 06. Admin Moderation & Approval Workflow
    // ---------------------------------------------------------
    {
      name: "06. Admin Moderation & Approval Workflow",
      item: [
        {
          name: "Get All Registered Users",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: {
              raw: "{{baseUrl}}/admin/users",
              host: ["{{baseUrl}}"],
              path: ["admin", "users"]
            }
          }
        },
        {
          name: "Get Pending Agents Queue",
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
          name: "Admin Approve Agent RERA & Docs",
          request: {
            method: "PATCH",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{adminToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                agentVerificationStatus: "approved"
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
          name: "Admin Reject Agent (with reason)",
          request: {
            method: "PATCH",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{adminToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                agentVerificationStatus: "rejected",
                rejectionReason: "RERA certificate document is unreadable. Please upload a clear PDF copy."
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
          name: "Get Pending Developers Queue",
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
          name: "Admin Approve Developer Company & RERA Docs",
          request: {
            method: "PATCH",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{adminToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                builderVerificationStatus: "approved"
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
          name: "Admin Reject Developer (with reason)",
          request: {
            method: "PATCH",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{adminToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                builderVerificationStatus: "rejected",
                rejectionReason: "PAN card company name does not match RERA registration document."
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
          name: "Get Pending Properties Queue",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: {
              raw: "{{baseUrl}}/admin/properties?approvalStatus=pending",
              host: ["{{baseUrl}}"],
              path: ["admin", "properties"],
              query: [{ key: "approvalStatus", value: "pending" }]
            }
          }
        },
        {
          name: "Admin Approve Property (Goes Live)",
          request: {
            method: "PATCH",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{adminToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                approvalStatus: "approved"
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
          name: "Admin Reject Property (with reason)",
          request: {
            method: "PATCH",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{adminToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                approvalStatus: "rejected",
                rejectionReason: "Property ownership document / Electricity bill missing."
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
          name: "Admin Toggle Featured Tier on Property",
          request: {
            method: "PATCH",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{adminToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                listingTier: "Premium"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/admin/properties/{{propertyId}}/featured",
              host: ["{{baseUrl}}"],
              path: ["admin", "properties", "{{propertyId}}", "featured"]
            }
          }
        },
        {
          name: "Get Pending Projects Queue",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: {
              raw: "{{baseUrl}}/admin/projects?approvalStatus=pending",
              host: ["{{baseUrl}}"],
              path: ["admin", "projects"],
              query: [{ key: "approvalStatus", value: "pending" }]
            }
          }
        },
        {
          name: "Admin Approve Developer Project (Goes Live)",
          request: {
            method: "PATCH",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{adminToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                approvalStatus: "approved"
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
          name: "Admin Reject Developer Project (with reason)",
          request: {
            method: "PATCH",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{adminToken}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                approvalStatus: "rejected",
                rejectionReason: "RERA project number expired or invalid."
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
          name: "Admin Dashboard Statistics",
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
          name: "Admin Notification List",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: {
              raw: "{{baseUrl}}/admin/notifications",
              host: ["{{baseUrl}}"],
              path: ["admin", "notifications"]
            }
          }
        }
      ]
    },

    // ---------------------------------------------------------
    // 07. Public GET APIs (Verified & Live Items Only)
    // ---------------------------------------------------------
    {
      name: "07. Public GET APIs (Verified & Live Only)",
      item: [
        {
          name: "Get All Approved Properties (with filters)",
          request: {
            method: "GET",
            url: {
              raw: "{{baseUrl}}/properties?category=Residential&listingFor=Sale&city=Noida",
              host: ["{{baseUrl}}"],
              path: ["properties"],
              query: [
                { key: "category", value: "Residential" },
                { key: "listingFor", value: "Sale" },
                { key: "city", value: "Noida" }
              ]
            }
          }
        },
        {
          name: "Get Live Property by ID",
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
          name: "Get Properties Near Me (Geospatial / City)",
          request: {
            method: "GET",
            url: {
              raw: "{{baseUrl}}/properties/near-me?city=Noida&radius=25",
              host: ["{{baseUrl}}"],
              path: ["properties", "near-me"],
              query: [
                { key: "city", value: "Noida" },
                { key: "radius", value: "25" }
              ]
            }
          }
        },
        {
          name: "Get All Approved Developer Projects",
          request: {
            method: "GET",
            url: {
              raw: "{{baseUrl}}/projects?city=Meerut&projectType=Residential",
              host: ["{{baseUrl}}"],
              path: ["projects"],
              query: [
                { key: "city", value: "Meerut" },
                { key: "projectType", value: "Residential" }
              ]
            }
          }
        },
        {
          name: "Get Live Developer Project Details by ID",
          request: {
            method: "GET",
            url: {
              raw: "{{baseUrl}}/projects/{{projectId}}",
              host: ["{{baseUrl}}"],
              path: ["projects", "{{projectId}}"]
            }
          }
        },
        {
          name: "Get All Verified Developers Directory",
          request: {
            method: "GET",
            url: {
              raw: "{{baseUrl}}/users/developers?city=Noida",
              host: ["{{baseUrl}}"],
              path: ["users", "developers"],
              query: [{ key: "city", value: "Noida" }]
            }
          }
        },
        {
          name: "Get Detailed Developer Profile by ID",
          request: {
            method: "GET",
            url: {
              raw: "{{baseUrl}}/users/developers/{{developerId}}",
              host: ["{{baseUrl}}"],
              path: ["users", "developers", "{{developerId}}"]
            }
          }
        },
        {
          name: "Get Developer Reviews & Ratings",
          request: {
            method: "GET",
            url: {
              raw: "{{baseUrl}}/users/developers/{{developerId}}/reviews",
              host: ["{{baseUrl}}"],
              path: ["users", "developers", "{{developerId}}", "reviews"]
            }
          }
        }
      ]
    }
  ]
};

const outputPath = path.join(__dirname, '../gharmb.postman_collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf-8');
console.log('✅ Successfully generated Postman Collection at:', outputPath);
