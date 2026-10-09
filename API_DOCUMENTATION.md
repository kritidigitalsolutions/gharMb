# GharMB Platform — Complete API Reference & Documentation

This documentation provides an exhaustive, role-based technical blueprint of all APIs across the **GharMB Real Estate Platform** (Backend Server, Web Portal, Mobile App, and Admin Panel).

---

## 📌 Global Architecture & Conventions

### Base URLs
- **Development Localhost** `http://localhost:5001/api`
- **Production Server:** `https://server.gharmb.com/api` (or environment-configured domain)
- **Static Assets / Media:** `http://localhost:5001/uploads/`

### Standard Request Headers
| Header | Description | Required For |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` (or `multipart/form-data` for uploads) | All `POST`, `PUT`, `PATCH` requests |
| `Authorization` | `Bearer <userToken>` | Authenticated Buyer, Owner, Agent, Builder endpoints |
| `Authorization` | `Bearer <adminToken>` | All `/api/admin/*` management endpoints |
| `platform` | `app` \| `web` \| `admin` | Optional analytics & platform filtering |

### Standard Response Envelope
```json
{
  "status": "success",   // "success" | "fail" | "error"
  "message": "Human readable status message",
  "data": { ... }        // Result object or array
}
```

---

## 📑 Quick Navigation Index

1. [Authentication & Identity APIs (User, Owner, Builder, Agent)](#1-authentication--identity-apis)
2. [User Profile, Role Verification & Dashboards](#2-user-profile-role-verification--dashboards)
3. [Property Listings & Public Feed APIs](#3-property-listings--public-feed-apis)
4. [Commercial Spaces APIs (Retail, Office, Industrial)](#4-commercial-spaces-apis)
5. [Developer Projects Directory & Reviews](#5-developer-projects-directory--reviews)
6. [Property Site Visit Scheduling APIs](#6-property-site-visit-scheduling-apis)
7. [Property Token Booking Requests (Direct Offline Reservation)](#7-property-token-booking-requests)
8. [Leads, Inquiries & Contact Forms](#8-leads-inquiries--contact-forms)
9. [Wishlist & Saved Listings](#9-wishlist--saved-listings)
10. [In-App Notifications Center](#10-in-app-notifications-center)
11. [File & Media Uploads Engine](#11-file--media-uploads-engine)
12. [CMS, News, Blogs, FAQs & Static Legal Content](#12-cms-news-blogs-faqs--static-content)
13. [Admin Panel: Authentication & Platform Dashboard](#13-admin-panel-authentication--platform-dashboard)
14. [Admin Panel: Moderation, Approvals & Content Control](#14-admin-panel-moderation-approvals--content-control)
14. [Admin Panel: Moderation, Approvals & Content Control](#14-admin-panel-moderation-approvals--content-control)
15. [Admin Panel: Services & Referral Network](#15-admin-panel-services--referral-network)
16. [Refer & Earn Program and GharMB Coins Wallet APIs](#16-refer--earn-program-and-gharmb-coins-wallet-apis)

---

## 1. Authentication & Identity APIs

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/send-otp` | Sends a 6-digit verification code to a mobile number | User login or registration step 1 (Buyer, Tenant, Owner, Agent) | **Body:** `{ "phone": "9876543210" }` | `{ status: "success", message: "OTP sent" }` |
| `POST` | `/api/auth/verify-otp` | Validates submitted OTP and logs in / issues JWT | Completing phone-based authentication | **Body:** `{ "phone": "9876543210", "otp": "123456" }` | User record, `token`, and `isNewUser: true/false` |
| `POST` | `/api/auth/register` | Sets initial name, email & optional referral code | New user account creation after OTP verification | **Body:** `{ "name": "Rohan", "phone": "9876543210", "email": "rohan@test.com", "referralCode": "GHARMB-RAHUL42" }` | Created user object (with lifetime unique referralCode) + active JWT `token` |
| `POST` | `/api/auth/google` | Authenticates via Google OAuth / Firebase ID Token | 1-tap Google login on App & Web. Existing user → direct login. New user → returns `isNewUser: true` with locked email & registrationToken. | **Body:** `{ "idToken": "firebase_id_token_string..." }` | User record + session `token` (if existing), or `{ isNewUser: true, email, registrationToken }` (if new user) |
| `POST` | `/api/auth/google/send-otp` | Sends phone verification code for new Google users | Verifying mobile number during Google registration (checks uniqueness) | **Body:** `{ "phone": "9876543210", "registrationToken": "..." }` | `{ status: "success", message: "OTP sent" }` |
| `POST` | `/api/auth/google/verify-otp` | Verifies submitted OTP for mobile number during Google registration | Confirming ownership of phone number | **Body:** `{ "phone": "9876543210", "otp": "123456" }` | `{ phoneVerified: true, phoneVerificationToken }` |
| `POST` | `/api/auth/google/register` | Completes registration for Google users after detail add & phone OTP | Final step: registers user in DB only after details, phone OTP & optional referralCode completed | **Body:** `{ "name": "Rohan", "email": "rohan@gmail.com", "phone": "9876543210", "phoneVerificationToken": "...", "role": "buyer", "referralCode": "GHARMB-RAHUL42" }` | Created user record + JWT session `token` |
| `POST` | `/api/auth/refresh` | Refreshes expired session tokens silently | Keeping mobile app users logged in without prompting OTP | **Body:** `{ "refreshToken": "<userRefreshToken>" }` | Fresh `token` and `refreshToken` |
| `POST` | `/api/auth/logout` | Revokes current session and clears refresh tokens | Logging out safely from device | **Header:** `Authorization: Bearer <userToken>` | `{ status: "success", message: "Logged out" }` |

---

## 2. User Profile, Role Verification & Dashboards

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users/me` | Fetches active user's entire account profile | Rendering personal profile screen, avatar, contact info | **Header:** `Bearer <userToken>` | Full user object, KYC state, role (`user`, `agent`, `developer`, `admin`) |
| `PATCH` | `/api/users/update-me` | Updates user's personal profile fields | User updating their name, email, avatar, city | **Header:** `Bearer <userToken>`<br>**Body:** `{ "name": "...", "avatar": "...", "city": "..." }` | Updated user document |
| `GET` | `/api/users/verification-status` | Returns verification status of user, agent, or developer | Displaying verification badges and pending review banners | **Header:** `Bearer <userToken>` | `{ isVerified: Boolean, role: String, verificationStatus: "pending" \| "approved" \| "rejected" }` |
| `POST` | `/api/users/register-agent` | Submits agent application with RERA number and agency details | Individual or Broker applying for verified Real Estate Agent status | **Header:** `Bearer <userToken>`<br>**Body:** `{ "agencyName": "...", "reraNumber": "...", "experienceYears": 5, "city": "Noida", "documents": [...] }` | Application status set to `pending` review |
| `POST` | `/api/users/register-developer` | Submits company details and corporate registration | Construction firm or Developer applying for verified Builder status | **Header:** `Bearer <userToken>`<br>**Body:** `{ "companyName": "...", "reraId": "...", "cinNumber": "...", "officeAddress": "...", "projectsCompleted": 10 }` | Developer profile set to `pending` review |
| `GET` | `/api/users/dashboard` | Aggregates all user-specific metrics | General profile home screen showing stats | **Header:** `Bearer <userToken>` | Total posted listings, saved properties, sent inquiries, active tokens |

---

## 3. Property Listings & Public Feed APIs

### Public Feeds (No Login Required)
| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/properties` | Queries and filters active live property listings | Home search bar, explore feeds, price filters | **Query Params:** `page`, `limit`, `listingFor` (sale/rent), `propertyType`, `city`, `minPrice`, `maxPrice`, `bedrooms`, `readyToMove`, `keyHandover` | Paginated array of property cards with media and pricing |
| `GET` | `/api/properties/latest` | Fetches recently listed residential & commercial properties | "New on GharMB" home carousel | **Query Params:** `page=1`, `limit=10` | Array of the 10 newest live properties |
| `GET` | `/api/properties/verified` | Returns listings physically or legally verified by GharMB | "Verified Properties" trust section | **Query Params:** `page=1`, `limit=20` | Properties with `isVerified: true` flag |
| `GET` | `/api/properties/near-me` | Performs geospatial GPS search based on radius | "Properties Near You" mobile location map | **Query Params:** `lat`, `lng`, `radius` (e.g. 50), `radiusUnit` (km/miles) | Properties sorted by geographical distance |
| `GET` | `/api/properties/:id` | Returns complete details, amenities, floor plans, and seller info | Property Detail Screen (PDP) | **Path Param:** `:id` (MongoDB ObjectID) | Full property object with owner contact, images, specifications, location |

#### 💡 Property Pricing & Discount Model (For App Frontend Developers)
> **Crucial Business Policy**: Any discount displayed on a property is funded **exclusively from GharMB Admin Commission**. The seller's asking price is 100% safeguarded.

On all property endpoints (`/api/properties`, `/api/properties/:id`, `/api/properties/latest`, etc.), property objects include the following ready-to-use pricing fields:
- `price` *(Number)*: Original property listed price (e.g. `5000000`).
- `formattedPrice` *(String)*: Formatted Indian currency (e.g. `"₹50.00 Lac"`).
- `hasDiscount` *(Boolean)*: `true` if an active discount is configured, else `false`.
- `discountAmount` *(Number)*: Amount discounted (e.g. `50000`).
- `formattedDiscount` *(String)*: Formatted discount string (e.g. `"₹50,000"`).
- `discountedPrice` *(Number)*: Effective price for the buyer (`price - discountAmount`, e.g. `4950000`).
- `formattedDiscountedPrice` *(String)*: Formatted discounted price (e.g. `"₹49.50 Lac"`).
- `discountPercentage` *(Number)*: Effective discount % on total property price (e.g. `1.0%`).
- `discountLabel` *(String)*: `"₹50,000 GharMB Discount"`.
- `discountNote` *(String)*: `"Discount is offered exclusively from GharMB Admin Commission. Property seller receives 100% of the listed price."`.
- `pricingSummary` *(Object)*:
  ```json
  {
    "originalPrice": 5000000,
    "discountAmount": 50000,
    "effectivePrice": 4950000,
    "grossAdminCommission": 100000,
    "netAdminCommission": 50000,
    "sellerPayoutAmount": 5000000,
    "discountBorneBy": "Admin Commission",
    "discountOnCommissionOnly": true
  }
  ```

### Owner & Agent Listing Management (Requires Login)
| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/properties/my-dashboard` | Returns owner dashboard with listing counts & token requests | Owner / Agent Dashboard summary screen | **Header:** `Bearer <userToken>`<br>**Query:** `tab=live` | Metrics: live count, pending count, total views, active inquiries |
| `GET` | `/api/properties/my-properties` | Fetches owner's listings filtered by tab | "My Properties" screen (Live, Under Review, Drafts) | **Header:** `Bearer <userToken>`<br>**Query:** `status=live \| pending \| rejected` | List of properties created by the authenticated user |
| `POST` | `/api/properties` | Creates and submits a new property listing | Property Owner or Agent posting an apartment, villa, or plot | **Header:** `Bearer <userToken>`<br>**Body:** Property object (title, price, listingFor, location, bedrooms, bathrooms, photos, amenities) | Created property listing (defaults to `pending` review) |
| `PUT` | `/api/properties/:id` | Updates an existing property listing | Owner updating price, photos, or description | **Header:** `Bearer <userToken>`<br>**Path:** `:id`<br>**Body:** Updated fields | Updated property object |
| `PATCH` | `/api/properties/:id/key-handover` | Sets or toggles immediate key handover availability | Owner indicating property is ready for immediate physical possession | **Header:** `Bearer <userToken>`<br>**Body:** `{ "keyHandover": true, "possessionDate": "Immediate" }` | Updated property status |
| `DELETE` | `/api/properties/:id` | Deletes an owned property listing | Owner removing their listing from platform | **Header:** `Bearer <userToken>`<br>**Path:** `:id` | `{ status: "success", message: "Property deleted" }` |

### ⭐ Property Ratings, Reviews & Owner Profile Ratings
| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/properties/:id/reviews` | Returns all ratings, star breakdown, and review comments for a property | Property Detail Screen (PDP) Reviews tab | **Path:** `:id`<br>**Query (Optional):** `page=1`, `limit=20` | `{ averageRating: 4.8, totalReviews: 12, breakdown: { "5": 8, "4": 3, ... }, reviews: [...] }` |
| `GET` | `/api/properties/:id/my-review` | Returns current user's submitted review for this property | Check if user already rated this property | **Header:** `Bearer <userToken>`<br>**Path:** `:id` | `{ hasReviewed: true/false, review: { rating, comment, tags } }` |
| `POST` | `/api/properties/:id/reviews` | Submits or updates a 1-5 star rating and comment for a property | Verified buyers/tenants rating a property listing (Owner self-rating blocked) | **Header:** `Bearer <userToken>`<br>**Path:** `:id`<br>**Body:** `{ "rating": 5, "comment": "...", "tags": ["Accurate Photos", "Great Location"] }` | Updated review, property `rating` & `reviewsCount`, and owner average rating |
| `POST` | `/api/properties/:id/rate` | Alias endpoint to rate a property | 1-Click star rating from app or mobile cards | **Header:** `Bearer <userToken>`<br>**Body:** `{ "rating": 5, "comment": "..." }` | Saved review & updated metrics |
| `DELETE` | `/api/properties/:id/reviews/:reviewId` | Deletes a property review | Review author or Admin removing a review | **Header:** `Bearer <userToken>`<br>**Path:** `:id`, `:reviewId` | `{ status: "success", message: "Property review removed successfully." }` |
| `GET` | `/api/users/me/ratings` | Returns all ratings received across all properties owned by current user | **Property Owner Profile Screen** to view their reputation & reviews | **Header:** `Bearer <userToken>` | `{ averageRating: 4.8, totalReviews: 24, breakdown: { "5": 18, ... }, reviews: [...] }` |
| `GET` | `/api/users/:id/ratings` | Returns overall rating & reviews received by a property owner / seller | Public or Admin viewing owner's rating breakdown | **Path:** `:id` (Owner User ID) | Full owner rating breakdown and reviews |
| `GET` | `/api/admin/users/:id/ratings` | Administrator inspects ratings & reviews received on an owner's properties | Admin User Inspector drawer "Ratings" tab | **Header:** `Bearer <adminToken>`<br>**Path:** `:id` | Aggregate metrics and full reviews list |

> **Property Owner Profile Integration**:
> On `/api/users/me` and `/api/properties/my-dashboard`, the property owner's profile payload includes:
> - `profile.rating` *(Number)*: Overall weighted average rating across all their properties (e.g. `4.8`).
> - `profile.reviewsCount` *(Number)*: Total count of reviews received across all their properties.
> - `profile.ratings` *(Object)*: Full ratings breakdown `{ averageRating, totalReviews, breakdown: { "5": ..., "4": ... }, recentReviews: [...] }`.
> - Each property inside `myProperties.live`, `myProperties.pending`, etc. includes its own `rating` and `reviewsCount`.

---

## 4. Commercial Spaces APIs

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/commercial-spaces` | Filters commercial retail, shops, offices, warehouses | Commercial property search tab on Web & App | **Query:** `spaceType` (Office/Shop/Showroom/Warehouse), `listingFor` (Sale/Lease), `city`, `minPrice`, `maxPrice` | Paginated commercial listings |
| `GET` | `/api/commercial-spaces/:id` | Fetches single commercial listing details | Commercial space detail page | **Path:** `:id` | Full commercial space document |
| `GET` | `/api/commercial-spaces/types` | Returns count breakdown of commercial space categories | Category pills / filter tiles on frontend | None | `{ "Retail / Shop": 42, "Office Space": 89, "Warehouse": 15 }` |
| `POST` | `/api/commercial-spaces` | Creates a new commercial space listing | Business owners or builders listing commercial properties | **Header:** `Bearer <userToken>`<br>**Body:** `{ title, spaceType, carpetArea, totalFloors, powerBackup, price, city, images }` | Created commercial listing (pending approval) |
| `GET` | `/api/commercial-spaces/my-dashboard` | Commercial landlord listing dashboard | Landlord reviewing leads & views for commercial assets | **Header:** `Bearer <userToken>` | My commercial spaces and inquiry counters |

---

## 5. Developer Projects Directory & Reviews

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | Explores township & residential developer projects | New Projects / Townships directory | **Query:** `city`, `projectType`, `status` (under_construction/ready_to_move), `page` | Array of developer mega-projects |
| `GET` | `/api/projects/:id` | Detailed developer project specifications | Project detail view (towers, floor plans, RERA IDs, amenities) | **Path:** `:id` | Complete project specs, brochure links, developer details |
| `GET` | `/api/developers` | Directory of verified builders and construction firms | "Top Developers" directory (e.g. DLF, Godrej, ATS) | **Query:** `city`, `page`, `limit` | Paginated builder profiles |
| `GET` | `/api/developers/:id` | Public profile of builder including active projects | Developer portfolio page | **Path:** `:id` | Developer stats, RERA numbers, completed projects, reviews |
| `POST` | `/api/developers/:id/reviews` | Submits buyer review and star rating for a developer | Buyer rating construction quality and delivery timelines | **Header:** `Bearer <userToken>`<br>**Body:** `{ "rating": 5, "review": "Great quality and on-time delivery.", "projectPurchased": "..." }` | Saved review document + recalculated average rating |
| `GET` | `/api/developers/:id/reviews` | Returns all reviews and rating breakdown for a builder | Reviews tab on developer profile | **Path:** `:id` | List of buyer reviews with 1-5 star distributions |

---

## 6. Property Site Visit Scheduling APIs

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/visit-requests` | Books a physical property visit appointment | Buyer requesting to inspect a house on a specific date/slot | **Header:** `Bearer <userToken>`<br>**Body:** `{ "propertyId": "...", "visitDate": "2026-10-15", "timeSlot": "11:00 AM - 01:00 PM", "visitorName": "...", "visitorPhone": "...", "note": "..." }` | Created visit request with status `pending` |
| `POST` | `/api/properties/:id/schedule-visit` | Direct property shortcut to schedule visit | "Book Site Visit" button on Property detail page | Same payload as above | Created visit request |
| `GET` | `/api/visit-requests/my-visits` | Retrieves visits scheduled by the logged-in buyer | Buyer checking upcoming site visits | **Header:** `Bearer <userToken>` | List of visits booked by the buyer |
| `GET` | `/api/visit-requests` | Retrieves visits received by property owner | Owner viewing buyers wanting to visit their properties | **Header:** `Bearer <userToken>`<br>**Query:** `status=pending \| accepted \| rejected` | List of visitor appointments |
| `PATCH` | `/api/visit-requests/:id/accept` | Owner confirms the requested visit appointment | Owner approving the buyer's date and time slot | **Header:** `Bearer <userToken>`<br>**Path:** `:id` | Status updated to `accepted` + buyer notified |
| `PATCH` | `/api/visit-requests/:id/reject` | Owner declines or reschedules visit | Owner unavailable at the requested time | **Header:** `Bearer <userToken>`<br>**Body:** `{ "reason": "Property unavailable on Sunday afternoon" }` | Status updated to `rejected` with explanation |

---

## 7. Property Token Booking Requests

> 💡 **Important Architectural Note:** GharMB does **not** process, hold, or escrow online payments. Token booking requests represent **direct reservation intents** with a 5-step applicant KYC profile. Financial settlement of the token deposit is arranged directly between buyer and owner offline.

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/tokens/config` | Returns available token booking amounts and policy note | Buyer opening the "Book with Token" modal | **Query:** `propertyId` (optional) | `{ tokenAmounts: [2000, 5000], defaultTokenAmount: 2000, adjustmentNote: "..." }` |
| `POST` | `/api/tokens` | Submits complete 5-step property token booking request | Buyer locking a property reservation request | **Header:** `Bearer <userToken>`<br>**Body:**<br>• `propertyId`<br>• `personalDetails` (name, phone, email, city)<br>• `familyDetails` (members, adults, children, maritalStatus)<br>• `occupationDetails` (profession, company, income)<br>• `idProof` (idType, documentUrl)<br>• `tokenAmount` (e.g. 2000)<br>• `monthlyRent` / `totalAgreedPrice` | Token request created with status `pending`, token code (e.g. `#TKN-261005-9921`), owner notified |
| `GET` | `/api/tokens/my-requests` | Returns token bookings sent by the buyer | Buyer checking reservation status under "My Bookings" | **Header:** `Bearer <userToken>` | Array of token reservations submitted by buyer |
| `GET` | `/api/tokens` | Returns token booking requests received by the property owner | Owner reviewing buyer reservation requests | **Header:** `Bearer <userToken>`<br>**Query:** `status=pending` | Array of incoming booking requests with complete applicant KYC |
| `GET` | `/api/tokens/:id` | Returns full details of a single token reservation | Audit drawer / detail view | **Header:** `Bearer <userToken>`<br>**Path:** `:id` | Full 5-step applicant profile, property info, decision history |
| `PATCH` | `/api/tokens/:id/accept` | Property owner accepts the token booking request | Owner reserving the property for this applicant | **Header:** `Bearer <userToken>`<br>**Path:** `:id`<br>**Body:** `{ "notes": "Agreed to hold property for 7 days" }` (optional) | Status set to `accepted`, notification sent to buyer |
| `PATCH` | `/api/tokens/:id/reject` | Property owner declines the token booking request | Owner turning down reservation (e.g. sold or terms mismatched) | **Header:** `Bearer <userToken>`<br>**Path:** `:id`<br>**Body:** `{ "reason": "Already finalized deal with another family" }` | Status set to `rejected` |
| `PATCH` | `/api/tokens/:id/cancel` | Buyer withdraws their token reservation request | Buyer finding another house or changing plans | **Header:** `Bearer <userToken>`<br>**Path:** `:id`<br>**Body:** `{ "reason": "Relocating to another city" }` | Status set to `cancelled` |

---

## 8. Leads, Inquiries & Contact Forms

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users/enquiries` | Submits general lead / enquiry on a property | Buyer clicking "Contact Owner / Send Enquiry" | **Header:** `Bearer <userToken>`<br>**Body:** `{ "propertyId": "...", "name": "...", "phone": "...", "message": "...", "moveInDate": "..." }` | Saved inquiry document + SMS/Email dispatch |
| `POST` | `/api/users/enquiries/developer` | Submits developer sales lead on a project | Buyer requesting callback from developer sales desk | **Header:** `Bearer <userToken>`<br>**Body:** `{ "developerId": "...", "projectId": "...", "unitType": "3BHK", "budget": "1.2 Cr" }` | Lead assigned to developer CRM |
| `GET` | `/api/users/enquiries/my-enquiries` | Retrieves inquiries sent by the buyer | Buyer tracking contact requests | **Header:** `Bearer <userToken>` | List of user's submitted inquiries |
| `GET` | `/api/users/enquiries/received` | Retrieves inquiries received by owner/builder | Owner / Broker lead management desk | **Header:** `Bearer <userToken>` | Incoming inquiries with caller phone numbers |
| `POST` | `/api/web-inquiries` | Submits public contact / enterprise inquiry form | Website footer "Contact Us" form | **Body:** `{ "name": "...", "email": "...", "phone": "...", "subject": "...", "message": "..." }` | Stored in admin web inquiry inbox |

---

## 9. Wishlist & Saved Listings

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/wishlist` | Fetches user's saved properties feed | "Saved / Wishlist" screen on App & Web | **Header:** `Bearer <userToken>` | Array of full property cards in wishlist |
| `POST` | `/api/wishlist/toggle` | Toggles property in/out of wishlist | Heart icon click on property cards | **Header:** `Bearer <userToken>`<br>**Body:** `{ "propertyId": "..." }` | `{ isSaved: true \| false, message: "..." }` |
| `GET` | `/api/wishlist/ids` | Returns only an array of saved property IDs | Synchronizing heart icons across feed efficiently | **Header:** `Bearer <userToken>` | `{ propertyIds: ["6ac...", "6ad..."] }` |
| `GET` | `/api/wishlist/check/:propertyId` | Checks if a single property is saved | Property detail page heart button initialization | **Header:** `Bearer <userToken>`<br>**Path:** `:propertyId` | `{ isWishlisted: true \| false }` |
| `DELETE` | `/api/wishlist/:propertyId` | Removes specific property from wishlist | User swiping to delete from saved list | **Header:** `Bearer <userToken>`<br>**Path:** `:propertyId` | Updated wishlist |
| `DELETE` | `/api/wishlist/clear` | Clears all saved listings | User clearing their favorites history | **Header:** `Bearer <userToken>` | `{ status: "success", count: 0 }` |

---

## 10. In-App Notifications Center

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Fetches user's notification list & unread count | Bell icon notification center | **Header:** `Bearer <userToken>` | Notifications array + `unreadCount` |
| `PATCH` | `/api/notifications/:id/read` | Marks a specific notification as read | User clicking a single notification | **Header:** `Bearer <userToken>`<br>**Path:** `:id` | Updated notification |
| `POST` | `/api/notifications/mark-all-read` | Marks all notifications as read | User tapping "Mark All Read" | **Header:** `Bearer <userToken>` | `{ status: "success", unreadCount: 0 }` |
| `DELETE` | `/api/notifications/:id` | Deletes a notification item | User dismissing a notification | **Header:** `Bearer <userToken>`<br>**Path:** `:id` | Item removed |
| `DELETE` | `/api/notifications/clear-all` | Clears all notifications | User emptying notification inbox | **Header:** `Bearer <userToken>` | All notifications deleted |

---

## 11. File & Media Uploads Engine

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/upload/single` | Uploads a single image, document, or PDF | Profile avatar, single KYC document | **Header:** `Bearer <token>`<br>**Body (Multipart):** `file: (Binary)` | `{ url: "/uploads/image-123.jpg", originalName: "...", size: 1024 }` |
| `POST` | `/api/upload/multiple` | Uploads batch of images or files | Property photos, floor plans, gallery | **Header:** `Bearer <token>`<br>**Body (Multipart):** `files: [(Binary), (Binary)]` | Array of `{ url, originalName, size }` |
| `POST` | `/api/upload/property/:id` | Uploads and directly links files to a property | Post-creation document upload | **Path:** `:id`<br>**Body:** Multipart `files` | Property object updated with new image URLs |
| `POST` | `/api/upload/project/:id` | Uploads project brochures, master plans, 3D renders | Builder uploading project media | **Path:** `:id`<br>**Body:** Multipart `files` | Project object updated |

---

## 12. CMS, News, Blogs, FAQs & Static Content

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/banners/home` | Returns structured home banners by section | Top home slider, promotional banners | None | Banners organized by `home_top`, `home_middle`, `home_popup` |
| `PATCH` | `/api/banners/:id/click` | Tracks clicks on marketing banners | Banner analytics | **Path:** `:id` | Click counter incremented |
| `GET` | `/api/news` | Real estate industry news & market updates | Market News feed | **Query:** `page`, `limit`, `category` | Published news articles |
| `GET` | `/api/blogs`<br>*(alias `/api/insights`)* | Queries published market insight articles with category and keyword search | Public Market Insights & Editorial Knowledge Hub | **Query:** `page`, `limit`, `category`, `search` | Paginated insights array with category taxonomy |
| `GET` | `/api/blogs/categories`<br>*(alias `/api/insights/categories`)* | Returns all active insight topic categories | Public category navigation bar & filtering tabs | None | Active category list with names and slugs |
| `GET` | `/api/blogs/:slug`<br>*(alias `/api/insights/:slug`)* | Fetches single insight article by slug, increments read counter, and returns related articles | Insight Article Detail View | **Path:** `:slug` (URL slug string) | Complete article with HTML content, author, SEO meta, readTime, and related articles |
| `GET` | `/api/faqs` | Frequently asked questions by topic | Help / FAQ center | **Query:** `category` (optional) | FAQs grouped by categories |
| `GET` | `/api/testimonials` | Client & homeowner reviews of GharMB | Social proof section on homepage | None | Verified testimonial quotes & star ratings |
| `GET` | `/api/legal/policies` | Legal documents (Terms, Privacy, Refund, Disclaimer) | In-app legal viewer | **Query:** `platform=app \| web` | Active legal policy documents |
| `GET` | `/api/pages/about-us` | Dynamic rich content for "About Us" | About GharMB screen | None | HTML / Markdown structured company info |

---

## 13. Admin Panel: Authentication & Platform Dashboard

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/auth/login` | Super Admin email & password login | Admin Console login | **Body:** `{ "email": "admin@gmail.com", "password": "..." }` | `adminToken`, admin profile details |
| `POST` | `/api/admin/auth/refresh` | Refreshes admin session token | Keeping Admin Dashboard authenticated | **Body:** `{ "refreshToken": "..." }` | Fresh `adminToken` |
| `GET` | `/api/admin/dashboard/stats` | Calculates platform KPI summary | Top row metric cards on Admin Dashboard | **Header:** `Bearer <adminToken>` | Counts: Users, Verified Properties, Pending Properties, Token Requests, Commercial Spaces |
| `GET` | `/api/admin/dashboard/revenue` | Computes revenue analytics & platform earnings | Revenue analytics charts | **Header:** `Bearer <adminToken>` | Monthly revenue breakdowns and commission metrics |
| `GET` | `/api/admin/dashboard/recent-activity` | Chronological audit log of new listings, users, tokens | Recent activity feed on Admin Home | **Header:** `Bearer <adminToken>` | Array of recent events with timestamps and actors |

---

## 14. Admin Panel: Moderation, Approvals & Content Control

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/properties` | Lists all platform properties with admin filters | Property Moderation Table | **Header:** `Bearer <adminToken>`<br>**Query:** `status=all \| pending \| approved`, `page`, `limit` | Paginated properties with seller details |
| `PATCH` | `/api/admin/properties/:id/status` | Approves or rejects a property listing (supports optional commission & discount payload at verification) | Admin reviewing and publishing listings | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "approvalStatus": "approved", "adminCommission": { "type": "percentage", "rate": 2 }, "commissionDiscount": { "enabled": true, "discountType": "percentage", "discountValue": 25 } }` | Listing goes live with commission & discount |
| `PATCH` | `/api/admin/properties/:id/commission-discount` | Configures / edits Admin Commission and Buyer Discount on commission anytime | Admin configuring or editing discount later | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "adminCommission": { "type": "percentage" \| "fixed", "rate": 2 }, "commissionDiscount": { "enabled": true, "discountType": "percentage" \| "fixed", "discountValue": 25, "notes": "Diwali Offer" } }` | Updated commission, discount, and buyer pricing |
| `PATCH` | `/api/admin/properties/:id/featured` | Marks property as "Featured" on homepage | Admin highlighting premium listings | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "isFeatured": true }` | Featured status updated |
| `DELETE` | `/api/admin/properties/:id` | Permanently deletes a property listing | Removing spam or violating listings | **Header:** `Bearer <adminToken>`<br>**Path:** `:id` | Deleted confirmation |
| `GET` | `/api/admin/users` | Lists all registered buyers, sellers, agents, developers | User Management CRM | **Header:** `Bearer <adminToken>`<br>**Query:** `role`, `status`, `search` | User list with verification flags |
| `PATCH` | `/api/admin/users/:id/verify-agent` | Approves / rejects Real Estate Agent RERA credentials | Agent Verification Desk | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "status": "approved" \| "rejected", "notes": "..." }` | User given verified Agent badge |
| `PATCH` | `/api/admin/users/:id/verify-developer` | Approves / rejects Builder company credentials | Developer Verification Desk | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "status": "approved" \| "rejected" }` | Developer profile activated |
| `GET` | `/api/admin/tokens/settings` | Gets global token booking amounts & policy terms | Token Configuration Modal | **Header:** `Bearer <adminToken>` | `{ tokenAmounts: [2000, 5000], defaultTokenAmount: 2000, adjustmentNote: "..." }` |
| `PATCH` | `/api/admin/tokens/settings` | Updates token booking amounts & adjustment notes | Admin changing token amounts | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "tokenAmounts": [2000, 5000, 10000], "defaultTokenAmount": 2000, "adjustmentNote": "..." }` | Updated settings saved across mobile & web |
| `GET` | `/api/admin/tokens` | Lists all token booking requests in database | Token Booking Requests Management screen | **Header:** `Bearer <adminToken>`<br>**Query:** `status=All \| pending \| accepted`, `page`, `limit` | Token requests with full 5-step applicant profiles |
| `POST` | `/api/admin/tokens` | Manually records a token reservation request | Admin entering offline booking on behalf of client | **Header:** `Bearer <adminToken>`<br>**Body:** `{ buyerName, buyerPhone, propertyId, tokenAmount, notes, ... }` | New token record created |
| `PATCH` | `/api/admin/tokens/:id/status` | Moderates token booking status (Accept / Reject / Cancel) | Admin resolving or assisting buyer-owner token disputes | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "status": "accepted" \| "rejected" \| "cancelled", "notes": "..." }` | Updated token record |
| `DELETE` | `/api/admin/tokens/:id` | Deletes a token request record | Database cleanup | **Header:** `Bearer <adminToken>`<br>**Path:** `:id` | Deleted confirmation |

### Market Insights & Editorial Knowledge Hub CMS
| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/blogs`<br>*(alias `/api/admin/insights`)* | Lists all articles (drafts & published) with filters & global stats | Insights Management table | **Header:** `Bearer <adminToken>`<br>**Query:** `page`, `limit`, `category`, `status`, `search`, `sort` | Paginated articles + database stats (total, published, drafts, views) |
| `GET` | `/api/admin/blogs/:id`<br>*(alias `/api/admin/insights/:id`)* | Fetches article by ID or slug for editing | Insights Editor screen | **Header:** `Bearer <adminToken>`<br>**Path:** `:id` | Single article document with populated category |
| `POST` | `/api/admin/blogs`<br>*(alias `/api/admin/insights`)* | Creates and saves a new insight article | Admin publishing market analysis or advice | **Header:** `Bearer <adminToken>`<br>**Body:** `{ title, slug, category, excerpt, content, bannerImage, author, readTime, status, isFeatured, tags, seo }` | Newly created article object |
| `PUT` | `/api/admin/blogs/:id`<br>*(alias `/api/admin/insights/:id`)* | Updates article content, slug, category, or SEO | Editing existing article | **Header:** `Bearer <adminToken>`<br>**Path:** `:id`<br>**Body:** Updated fields | Updated article object |
| `PATCH` | `/api/admin/blogs/:id/publish` | Toggles article status to `published` | Publishing drafted article | **Header:** `Bearer <adminToken>`<br>**Path:** `:id` | Article marked live with timestamp |
| `PATCH` | `/api/admin/blogs/:id/unpublish` | Toggles article status to `draft` | Taking article down to draft | **Header:** `Bearer <adminToken>`<br>**Path:** `:id` | Article moved to draft |
| `POST` | `/api/admin/blogs/upload` | Uploads banner or in-article graphic | Media upload within article editor | **Header:** `Bearer <adminToken>`<br>**Body:** `multipart/form-data` with `image` | Absolute image URL and filename |
| `PATCH` | `/api/admin/blogs/bulk-status` | Updates publish status across multiple selected articles | Bulk actions dropdown in management table | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "ids": [...], "isPublished": Boolean }` | Success confirmation |
| `PUT` | `/api/admin/blogs/reorder` | Sets custom display sort order for articles | Drag-and-drop sorting | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "orders": [{ "id": "...", "order": 1 }] }` | Reordered confirmation |
| `POST` | `/api/admin/blogs/bulk-delete` | Bulk deletes multiple selected articles | Bulk clean up | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "ids": [...] }` | Deleted count confirmation |
| `DELETE` | `/api/admin/blogs/:id` | Permanently deletes single insight article | Article row delete action | **Header:** `Bearer <adminToken>`<br>**Path:** `:id` | Deleted confirmation |
| `GET` | `/api/admin/blog-categories`<br>*(alias `/api/admin/insight-categories`)* | Lists categories with dynamic article counts | Category management table | **Header:** `Bearer <adminToken>` | Categories array with `articleCount` per category |
| `POST` | `/api/admin/blog-categories`<br>*(alias `/api/admin/insight-categories`)* | Creates a new insight category topic | Adding new topic taxonomy | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "name": "...", "isActive": true }` | Created category with generated slug |
| `PUT` | `/api/admin/blog-categories/:id` | Updates category name, slug, or active state | Renaming category | **Header:** `Bearer <adminToken>`<br>**Path:** `:id`<br>**Body:** `{ "name": "...", "isActive": true }` | Updated category object |
| `POST` | `/api/admin/blog-categories/bulk-delete` | Bulk deletes unused categories | Category cleanup | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "ids": [...] }` | Deleted count confirmation |
| `DELETE` | `/api/admin/blog-categories/:id` | Deletes single category | Category row delete action | **Header:** `Bearer <adminToken>`<br>**Path:** `:id` | Deleted confirmation |

---

## 15. Admin Panel: Services & Referral Network

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/services` | Lists and filters third-party service inquiries | Home Loan, Interior Design, Packers & Movers lead desk | **Header:** `Bearer <adminToken>`<br>**Query:** `serviceType=Loan \| Interior \| Movers`, `status=All` | Service inquiry records and KPI counts |
| `POST` | `/api/admin/services` | Manually creates a new service inquiry lead | Admin logging incoming phone call lead | **Header:** `Bearer <adminToken>`<br>**Body:** `{ customerName, phone, serviceType, requirements, budget }` | Created service lead |
| `PATCH` | `/api/admin/services/:id` | Updates service lead status and notes | Moving lead through `new` ➔ `in_progress` ➔ `completed` | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "status": "completed", "assignedPartner": "HDFC Bank" }` | Updated service inquiry |
| `GET` | `/api/admin/referrals` | Lists referral deals and partner commission metrics | Ambassador / Referral network tracker | **Header:** `Bearer <adminToken>`<br>**Query:** `status=All`, `page=1` | List of referral deals with payout metrics |
| `POST` | `/api/admin/referrals` | Records a new referral transaction | Logging an affiliate / partner closed deal | **Header:** `Bearer <adminToken>`<br>**Body:** `{ referrerName, referrerPhone, clientName, dealValue, commissionAmount }` | Created referral record |
| `PATCH` | `/api/admin/referrals/:id/status` | Advances referral lifecycle (`lead` ➔ `site_visit` ➔ `closed`) | Referral progression | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "status": "closed" }` | Updated referral deal |
| `PATCH` | `/api/admin/referrals/:id/payout` | Marks referral payout as settled | Recording offline payout to ambassador | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "payoutStatus": "paid", "payoutDate": "2026-10-05", "utrRef": "..." }` | Payout marked settled |
| `POST` | `/api/admin/referrals/:id/credit-coins` | Manually credits ₹250 coins reward to both referrer & referee | Admin manual approval / override of Refer & Earn coins reward | **Header:** `Bearer <adminToken>`<br>**Path:** `:id` | Updated referral record with coins granted confirmation |

---

## 16. Refer & Earn Program (Zero Coin System — Direct Admin Contact & Out-of-App Payment)

The Refer & Earn system has **NO coin system**. When a new user signs up using an existing user's referral code (e.g. `GHARMB-3307`), **both users immediately win a ₹250 cash reward**. 

**Users do NOT need to contact Admin.** Instead, **Admin gets automatically notified with both users' phone numbers** and contacts them directly to deliver the reward payment outside of the app.

---

### 📱 How It Works (The 4-Step Lifecycle)
1. **Share your code:** Existing user shares their unique lifetime referral code (e.g., `GHARMB-3307`) via WhatsApp, SMS, or any channel.
2. **Friend signs up:** New user inputs the referral code during registration on the detail add page.
3. **Both users win ₹250:** Both Referrer and Referee are instantly awarded ₹250 cash reward in their referral balance.
4. **Admin contacts users directly:** GharMB Admin receives an instant notification with both users' names & phone numbers. Admin calls both users and delivers their reward payment completely outside the app (UPI, Cash, Bank Transfer).

---

### 📋 Refer & Earn API Endpoints

| Method | Endpoint | What it Does | For What (Use Case & Role) | From What (Required Inputs) | What it Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/user/referrals/validate-code`<br>*(alias `/api/referrals/validate-code`)* | Validates a referral code in real-time | Public check on login detail add page / signup before user registers | **Body:** `{ "referralCode": "GHARMB-3307" }` | `{ isValid: true, referrerName: "Kartik", rewardAmount: 250, currency: "₹", rewardDescription: "₹250 cash reward won upon signup. GharMB Admin will contact both users directly..." }` |
| `GET` | `/api/user/referrals/validate/:code` | Validates a referral code via URL parameter | Real-time inline field check during registration | **Path:** `:code` | Validation status, referrer details, and reward info |
| `GET` | `/api/user/referrals/dashboard`<br>*(alias `/api/user/referrals/my-code`)* | Fetches the full Refer & Earn screen details | Rendering the "Invite & Earn ₹250" screen (matching mobile UI) | **Header:** `Bearer <userToken>` | User's lifetime code, stats (`friendsInvited`, `totalRewardEarned`, `rewardPerReferral: 250`), share templates, 4-step guide, and recent invited friends with status `"Admin Will Contact Soon"` |
| `GET` | `/api/user/referrals/history`<br>*(alias `/api/user/referrals/my-friends`)* | Returns paginated list of all invited friends | Friends Referral History tab | **Header:** `Bearer <userToken>`<br>**Query:** `page=1, limit=20` | Array of invited friends, masked phone, join date, status (`Admin Will Contact Soon` or `Reward Delivered`), reward amount (₹250) |
| `POST` | `/api/user/referrals/apply-code` | Applies a referral code post-signup | For users who registered without a code and want to link one | **Header:** `Bearer <userToken>`<br>**Body:** `{ "referralCode": "GHARMB-3307" }` | Success confirmation; instantly awards ₹250 to both users and alerts Admin to call them |
| `POST` | `/api/user/referrals/:id/claim`<br>*(alias `/api/user/referrals/claim`)* | Checks reward status | Confirms reward status. Users do not need to contact admin; confirms Admin will contact directly | **Header:** `Bearer <userToken>` | Confirmation that ₹250 reward is active and Admin is contacting the user directly |
| `GET` | `/api/user/referrals/claims`<br>*(alias `/api/user/referrals/my-claims`)* | Lists all referral rewards and their out-of-app payment status | Viewing pending/settled reward status | **Header:** `Bearer <userToken>` | Referral rewards array with `payoutStatus`, `claimedAmount: 250`, and Admin notes |
| `PATCH` | `/api/admin/referrals/:id/settle-payout`<br>*(alias `.../payout`)* | Records out-of-app funding/payment settlement | Admin contacts users, delivers payment out of app, and marks record settled | **Header:** `Bearer <adminToken>`<br>**Body:** `{ "payoutRefId": "UTR12345678", "payoutMethod": "UPI / Cash", "amountPaid": 250, "adminSettlementNotes": "Called users and settled ₹250 reward via UPI" }` | Payout marked `Paid`; notifies both Referrer and Referee |
| `GET` | `/api/user/referrals/wallet`<br>*(alias `/api/user/wallet/coins`)* | Fetches cash reward overview | Rewards balance & history overview | **Header:** `Bearer <userToken>` | `totalRewardEarned`, `currency: "₹"`, `payoutProcess: "Admin contacts both users directly to deliver cash/UPI reward out of the app"`, and rewards list |

---

### 📞 100% Out-of-App Payment & Admin-Initiated Contact Flow
There is **ZERO bank account / payment gateway requirement inside the app**.
1. **Instant Reward on Signup:** When a new user registers using an existing user's referral code, both users are immediately credited ₹250 reward in the system.
2. **Automated Admin Alert:** The system instantly notifies all active Admins with both users' details:
   - **Referrer:** Name and registered phone number.
   - **Referee:** Name and registered phone number.
   - **Message:** *"📞 Referral Reward Won! Contact [Referee] (📞 Phone) and [Referrer] (📞 Phone) to deliver ₹250 payment out of the app."*
3. **Users Notified:**
   - **Referrer:** *"🎉 You Won ₹250 Referral Reward! Your friend [Name] just registered. GharMB Admin will contact you on [Phone] to deliver your payment out of the app."*
   - **Referee:** *"🎉 Welcome! You Won ₹250 Referral Reward! GharMB Admin will contact you on [Phone] to deliver your payment out of the app."*
4. **Admin Contacts Users:** GharMB Admin calls both users directly and settles the ₹250 reward outside the app (via UPI, Cash, or Direct Transfer). Users never need to initiate contact.
5. **Admin Marks Record Settled:** Admin opens Admin Panel and records settlement (`PATCH /api/admin/referrals/:id/settle-payout`). Both users receive a notification confirming payment delivery.

---

## 🛠️ Postman Collection

All endpoints documented above are pre-configured with active environment variables, auto-saving JWT scripts, and sample payloads in the GharMB Postman collections:
- **Root Postman File:** `d:\dhruv_backernd work\gharMb\gharmb.postman_collection.json`
- **Server Postman File:** `d:\dhruv_backernd work\gharMb\server\gharmb.postman_collection.json`
- **Regeneration Script:** `node server/generate_postman.js`
