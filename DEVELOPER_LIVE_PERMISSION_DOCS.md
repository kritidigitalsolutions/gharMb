# GharMB — Developer Live Screen Permission System & API Documentation

> **Document Version:** 1.0  
> **Last Updated:** 27 November 2026  
> **Target Audience:** Backend Developers, Flutter Mobile Developers, Admin Panel Operators  
> **Feature Overview:** 2-Step Developer Verification & Mobile App Publishing Control (`isLive` Permission Toggle)

---

## 1. Executive Summary

Previously, as soon as an Administrator authorized a developer/builder in the Admin Panel (`builderVerificationStatus: 'approved'`), that developer immediately appeared live on the mobile app discovery screen via `GET https://server.gharmb.com/api/users/developers`.

To provide granular control to administrators and fulfill compliance requirements, a **2-Step Publishing Permission Workflow** has been implemented:
1. **Step 1 (Audit & Verification):** Admin reviews documents (RERA license, PAN Card, Company credentials) and marks the developer as **Approved** (`builderVerificationStatus: 'approved'`). By default, the developer remains **Off-Screen (Hidden)**.
2. **Step 2 (Screen Permission / Live Toggle):** Admin explicitly grants permission to publish the developer onto the live mobile app screen via a 1-click **`Screen: ON / OFF`** toggle (`isLive: true / false`).

---

## 2. API Specifications

### 2.1 Public Mobile Discovery API (Flutter Client)

* **Endpoint:** `GET https://server.gharmb.com/api/users/developers`  
  *(Also accessible via `/api/developers` and `/api/user/developers`)*
* **Access:** Public (No Bearer token required)
* **Description:** Fetches all verified developers who have been explicitly granted permission to appear on the mobile app screen, sorted strictly according to Admin-assigned Priority (#1, #2, #3...) followed by unranked builders.

#### Request Query Parameters:
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `city` | String | Optional | `'All India'` | Case-insensitive filter matching the developer's `cityOfOperation`. |

#### Priority Sorting Logic:
Developers are sorted by `priority` ascending (`1, 2, 3...` where `1` = Top Rank). Developers with `priority: 0` (unranked) appear below all prioritized developers.

#### Response Format (`200 OK`):
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "developers": [
      {
        "id": "673dd5c48b8b8c12a4b899a1",
        "name": "GharMB Premium Builders",
        "companyName": "GharMB Premium Builders Pvt Ltd",
        "profilePicture": "default-avatar.png",
        "logo": "https://storage.googleapis.com/.../company_logo.png",
        "cityOfOperation": "Mumbai",
        "yearsInBusiness": "5",
        "rating": 4.8,
        "reviewCount": 142,
        "priority": 1,
        "projectCount": 3,
        "projectCountDisplay": "3+ projects"
      }
    ]
  }
}
```

---

### 2.2 Admin Developer Priority Update API

* **Endpoint:** `PATCH /api/admin/users/:id/priority`
* **Access:** Private (Admin authentication token required)
* **Description:** Sets or updates the display ranking/priority for a developer.

#### Validation & Auto-Management Rules:
1. `priority` must be a non-negative integer (0, 1, 2, 3...).
2. **Auto-Exchange (Swap Rule):** If an already-prioritized developer (e.g. #2) is assigned another claimed priority (e.g. #1), the two developers automatically **exchange/swap** their priorities with each other (#2 becomes #1, #1 becomes #2).
3. **Auto-Shift (+1 Ripple Rule):** If an unranked developer (priority 0) is assigned a claimed priority (e.g. #1), all existing developers holding priority `>= 1` automatically **shift down by +1** (#1 becomes #2, #2 becomes #3, etc.) so that the new developer takes the designated rank without conflicts.
4. `priority = 0` represents the default unranked state; resetting a developer to 0 does not trigger shifts.

#### Response Format (`200 OK`):
```json
{
  "status": "success",
  "message": "Priority rank for GharMB Premium Builders updated to 1.",
  "data": {
    "id": "673dd5c48b8b8c12a4b899a1",
    "priority": 1
  }
}
```

---

### 2.3 Admin Developer Screen Permission Toggle API

* **Endpoint:** `PATCH /api/admin/users/:id/toggle-live`
* **Access:** Private (Admin authentication token required)
* **Description:** Toggles or sets the mobile app screen visibility (`isLive`) for an approved developer.

#### Request Body (Optional):
```json
{
  "isLive": true // Set true to show on screen, false to hide. Omit to auto-toggle.
}
```

#### Validation Rules:
1. Target user must have `role === 'builder'` or valid developer registration.
2. Target user must have `builderVerificationStatus === 'approved'`. Attempting to grant screen permission to a pending or rejected developer returns `400 Bad Request`.

#### Response Format (`200 OK`):
```json
{
  "status": "success",
  "message": "Permission granted: GharMB Premium Builders is now LIVE on the mobile app screen! 🚀",
  "data": {
    "isLive": true,
    "builderVerificationStatus": "approved"
  }
}
```

---

### 2.3 Admin Developer Audit & Verification API

* **Endpoint:** `PATCH /api/admin/users/:id/verify-developer`
* **Access:** Private (Admin authentication token required)
* **Description:** Verifies or rejects developer credentials.

#### Request Body:
```json
{
  "builderVerificationStatus": "approved", // 'approved' | 'rejected' | 'pending'
  "publishToApp": false,                  // Optional: Set true to make live immediately upon approval
  "rejectReason": "Incomplete RERA doc"   // Required if rejected
}
```

---

## 3. Database Schema Changes

### `User` Model (`server/src/models/user.model.js`)

A dedicated `isLive` indexed boolean flag has been added to the developer profile schema:

```javascript
// Developer / Builder Company Verification Details
builderVerificationStatus: {
  type: String,
  enum: ['unverified', 'pending', 'approved', 'rejected'],
  default: 'unverified',
  index: true,
},
builderRejectionReason: {
  type: String,
  trim: true,
},
isLive: {
  type: Boolean,
  default: false,
  index: true, // Optimized for fast discovery queries
},
```

---

## 4. Admin Panel UI Integration

**Location:** `http://localhost:5173/admin/builders` (`client/src/pages/BuilderManagement.jsx`)

### 4.1 Data Table View
* **Status Column:** Under the `Approved` badge, an interactive pill toggle displays:
  * 🟢 **`Screen: ON`** (Emerald glow): Developer is currently active and discoverable on the mobile app screen. Clicking toggles permission OFF.
  * ⚪ **`Screen: OFF`** (Slate pill): Developer is approved/KYC-verified but currently hidden from the mobile app screen. Clicking grants permission and makes them LIVE immediately.

### 4.2 Grid Cards View
* Each builder card displays the `Screen: ON` / `Screen: OFF` pill right next to the approval badge for fast 1-click publishing.

### 4.3 Builder Review Drawer (Slide-Over Panel)
* **Drawer Header:** Displays real-time `App Screen: ON (Live)` or `App Screen: OFF (Permission Needed)`.
* **Drawer Footer:** For approved builders, contains the dedicated toggle button:
  * `Screen Permission: ON (Live)`
  * `Screen Permission: OFF (Off-Screen)`

---

## 5. Mobile App / Flutter Developer Notes

1. **Zero Breaking Changes:**  
   The Flutter app does **not** require any code modifications. The existing API endpoint (`/api/users/developers`) continues to return the exact same JSON response format.
2. **Behavioral Assurance:**  
   Developers whose admin permission is `Screen: OFF` will not appear in the discovery list. As soon as the admin clicks `Screen: ON`, the developer appears on the next app refresh or pagination call.
3. **Caching:**  
   If the mobile app caches developer responses locally, ensure cache invalidation on pull-to-refresh so newly permitted builders reflect instantly.

---

## 6. Files Changed & Summary

| File | Type | Changes Made |
| :--- | :--- | :--- |
| `server/src/models/user.model.js` | Backend Model | Added `isLive: { type: Boolean, default: false, index: true }`. |
| `server/src/controllers/user/user.controller.js` | User Controller | Added `isLive: true` filter to `getVerifiedDevelopers`. |
| `server/src/controllers/admin/user.controller.js` | Admin Controller | Added `toggleDeveloperLive` handler and updated `verifyDeveloper` to support `isLive`. |
| `server/src/routes/admin/user.routes.js` | Admin Routes | Registered `PATCH /:id/toggle-live`. |
| `client/src/pages/BuilderManagement.jsx` | Admin UI | Added `Screen: ON` / `Screen: OFF` toggles in Table, Grid, and Drawer. |

---
*For support or further modifications, contact the GharMB Technical Team.*
