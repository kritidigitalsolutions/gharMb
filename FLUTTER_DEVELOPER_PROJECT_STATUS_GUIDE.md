# Flutter Mobile Integration: Developer New Project Status & Ownership Rule

> **Audience**: Flutter Mobile App Developer & Backend Team  
> **Backend Base URL**: `$baseUrl/api` (e.g. `https://server.gharmb.com/api` or `http://localhost:5001/api`)  
> **Status**: Production Ready  
> **Date**: October 2026

---

## 📌 Changes Summary

डेवलपर साइड से जब नया प्रोजेक्ट ऐड किया जाता है, तो दो मुख्य बदलाव लागू किए गए हैं:

1. **Remove Ownership Type ❌**:
   - डेवलपर साइड फ़ॉर्म से **"Ownership Type"** (या Seller Role: Owner / Agent / Builder) का फ़ील्ड **पूरी तरह हटा (Remove)** दिया गया है।
   - डेवलपर हमेशा केवल अपना प्रोजेक्ट लिस्ट करता है, इसलिए यह फ़ील्ड यहाँ अप्रासंगिक (redundant) है।
   - बैकएंड ऑटोमैटिकली प्रोजेक्ट को लॉगिन डेवलपर से लिंक करता है।

2. **Project Status: Exactly 3 Options ⭐**:
   - डेवलपर प्रोजेक्ट स्टेटस में केवल और केवल ये **3 ऑप्शंस** (Title Case) रहेंगे:
     1. **`Under Construction`**
     2. **`Ready to Move`**
     3. **`New Launch`**

---

## 1. Developer Project Add API Payload (`POST /api/user/projects`)

जब डेवलपर ऐप में 5-स्टेप प्रोजेक्ट फ़ॉर्म सबमिट करता है:

```json
{
  "projectName": "Singhania Bayview Towers",
  "projectType": "Residential",            // "Residential" | "Commercial" | "Mixed use"
  
  // ── ⭐ EXACT 3 OPTIONS ONLY ──
  "projectStatus": "Under Construction",    // 👈 "Under Construction" | "Ready to Move" | "New Launch"
  
  "possessionDate": "Dec 2027",            // e.g. "Dec 2027" or "Ready to Move"
  "totalUnits": 180,
  "towers": 4,
  "floors": "G + 24",
  "openSpacePercentage": 70,
  "city": "Agra",
  "locality": "Dayal Bagh",
  "fullAddress": "Near Dayalbagh Institute, Dayal Bagh",
  "pincode": "282005",
  "latitude": 27.220645,
  "longitude": 78.005598,
  
  // RERA Numbers (At least 1 mandatory for developer projects)
  "reraNumbers": [
    { "name": "Phase 1", "reraNumber": "UPRERAPRJ987654" }
  ],

  // Multiple BHK Configurations
  "bhkConfigurations": [
    {
      "bhkType": "2 BHK",
      "carpetArea": 1150,
      "minPrice": 6500000,
      "maxPrice": 7500000,
      "priceRangeText": "₹65 L - ₹75 L",
      "availableUnits": 40
    },
    {
      "bhkType": "3 BHK",
      "carpetArea": 1650,
      "minPrice": 9500000,
      "maxPrice": 11500000,
      "priceRangeText": "₹95 L - ₹1.15 Cr",
      "availableUnits": 25
    }
  ],
  "amenities": ["Clubhouse", "Swimming Pool", "24x7 Security", "Gymnasium", "Power Backup"]
}
```

> ⚠️ **नोट**: इस पेलोड में कोई `ownershipType`, `ownership`, या `listingAs` फ़ील्ड **नहीं** भेजना है।

---

## 2. Flutter UI Code: Project Status Selector (3 Options)

Flutter फ़ॉर्म में Project Status के लिए Dropdown या Segmented/Chips Widget:

```dart
// 1. Constants
const List<String> kProjectStatusOptions = [
  'Under Construction',
  'Ready to Move',
  'New Launch',
];

// 2. State Variable
String selectedProjectStatus = 'Under Construction';

// 3. UI Widget (Choice Chips or Dropdown)
Widget buildProjectStatusSelector() {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text(
        'Project Status *',
        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
      const SizedBox(height: 8),
      Wrap(
        spacing: 10,
        children: kProjectStatusOptions.map((status) {
          final isSelected = selectedProjectStatus == status;
          return ChoiceChip(
            label: Text(status),
            selected: isSelected,
            selectedColor: Theme.of(context).primaryColor.withOpacity(0.15),
            labelStyle: TextStyle(
              fontWeight: FontWeight.w600,
              color: isSelected ? Theme.of(context).primaryColor : Colors.black87,
            ),
            onSelected: (selected) {
              if (selected) {
                setState(() {
                  selectedProjectStatus = status;
                });
              }
            },
          );
        }).toList(),
      ),
    ],
  );
}
```

---

## 3. Developer UI Badge Widget (Feed / Cards)

जब ऐप में New Projects की लिस्टिंग दिखाई जाए, तो स्टेटस बैज का स्टाइल:

```dart
Widget buildStatusBadge(String status) {
  Color bgColor;
  Color textColor;
  Color borderColor;

  switch (status.trim()) {
    case 'Ready to Move':
      bgColor = const Color(0xFFE8F5E9);     // Light Green
      textColor = const Color(0xFF2E7D32);   // Dark Green
      borderColor = const Color(0xFFA5D6A7);
      break;
    case 'New Launch':
      bgColor = const Color(0xFFEDE7F6);     // Light Purple/Brand
      textColor = const Color(0xFF512DA8);
      borderColor = const Color(0xFFD1C4E9);
      break;
    case 'Under Construction':
    default:
      bgColor = const Color(0xFFFFF8E1);     // Light Amber
      textColor = const Color(0xFFF57F17);   // Dark Amber
      borderColor = const Color(0xFFFFE082);
      break;
  }

  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: bgColor,
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: borderColor),
    ),
    child: Text(
      status,
      style: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: textColor,
      ),
    ),
  );
}
```

---

## 4. Checklist for Flutter Developer

- [ ] **Remove Ownership Field**: Developer Project Add screen से "Ownership Type" (Freehold/Leasehold/Role) इनपुट हटा दें।
- [ ] **Project Status Dropdown/Chips**: केवल 3 ऑप्शंस रखें:
  - `Under Construction`
  - `Ready to Move`
  - `New Launch`
- [ ] **API Payload**: `POST /api/user/projects` और `PUT /api/user/projects/:id` पर `projectStatus` को सटीक Title Case में भेजें।
- [ ] **Cards Badge**: New Projects कार्ड्स पर स्टेटस बैज इसी अनुसार दिखाएं।
