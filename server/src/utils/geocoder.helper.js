/**
 * Geocoder Helper for GharMb
 * Resolves accurate coordinates for properties & developer projects using:
 * 1. Explicit coordinates passed in request body (lat, lng, longitude, latitude)
 * 2. High-precision Geocoding (OpenStreetMap Nominatim) based on Locality, City, Full Address & Pincode
 * 3. Comprehensive Indian city & regional coordinates fallback dictionary
 */

// Well-known coordinates for Indian cities and urban regions
const CITY_COORDINATES = {
  // NCR & Uttar Pradesh
  noida: [77.3910, 28.5355],
  'greater noida': [77.5030, 28.4744],
  delhi: [77.2090, 28.6139],
  'new delhi': [77.2090, 28.6139],
  gurgaon: [77.0266, 28.4595],
  gurugram: [77.0266, 28.4595],
  ghaziabad: [77.4538, 28.6692],
  faridabad: [77.3178, 28.4089],
  agra: [78.0081, 27.1767],
  agar: [78.0081, 27.1767],
  mathura: [77.6737, 27.4924],
  vrindavan: [77.7006, 27.5807],
  aligarh: [78.0880, 27.8974],
  firozabad: [78.3957, 27.1592],
  meerut: [77.7064, 28.9845],
  lucknow: [80.9462, 26.8467],
  kanpur: [80.3319, 26.4499],
  varanasi: [82.9739, 25.3176],
  prayagraj: [81.8463, 25.4358],
  allahabad: [81.8463, 25.4358],
  ayodhya: [82.1998, 26.7922],
  gorakhpur: [83.3732, 26.7606],
  bareilly: [79.4304, 28.3670],
  moradabad: [78.7768, 28.8386],
  jhansi: [78.5788, 25.4484],

  // Maharashtra
  mumbai: [72.8777, 19.0760],
  'navi mumbai': [73.0297, 19.0330],
  thane: [72.9781, 19.2183],
  'mira road': [72.8691, 19.2812],
  'mira bhayandar': [72.8561, 19.2952],
  kalyan: [73.1355, 19.2403],
  pune: [73.8567, 18.5204],
  'pimpri chinchwad': [73.8052, 18.6298],
  nagpur: [79.0882, 21.1458],
  nashik: [73.7898, 19.9975],
  aurangabad: [75.3433, 19.8762],

  // Karnataka & South
  bangalore: [77.5946, 12.9716],
  bengaluru: [77.5946, 12.9716],
  mysore: [76.6394, 12.2958],
  hyderabad: [78.4867, 17.3850],
  secunderabad: [78.5011, 17.4399],
  chennai: [80.2707, 13.0827],
  coimbatore: [76.9558, 11.0168],
  kochi: [76.2673, 9.9312],
  trivandrum: [76.9366, 8.5241],
  visakhapatnam: [83.2185, 17.6868],
  vijayawada: [80.6480, 16.5062],

  // Rajasthan
  jaipur: [75.7873, 26.9124],
  jodhpur: [73.0243, 26.2389],
  udaipur: [73.7125, 24.5854],
  kota: [75.8648, 25.2138],
  ajmer: [74.6399, 26.4499],
  bhiwadi: [76.8524, 28.2104],

  // Gujarat
  ahmedabad: [72.5714, 23.0225],
  surat: [72.8311, 21.1702],
  vadodara: [73.1812, 22.3072],
  rajkot: [70.8022, 22.3039],
  gandhinagar: [72.6369, 23.2156],

  // East & Central
  kolkata: [88.3639, 22.5726],
  howrah: [88.2636, 22.5958],
  patna: [85.1376, 25.5941],
  ranchi: [85.3096, 23.3441],
  bhubaneswar: [85.8245, 20.2961],
  bhopal: [77.4126, 23.2599],
  indore: [75.8577, 22.7196],
  gwalior: [78.1828, 26.2183],
  jabalpur: [79.9864, 23.1815],
  raipur: [81.6296, 21.2514],

  // North & Hills
  chandigarh: [76.7794, 30.7333],
  mohali: [76.7179, 30.7046],
  panchkula: [76.8606, 30.6942],
  ludhiana: [75.8573, 30.9010],
  amritsar: [74.8723, 31.6340],
  dehradun: [78.0322, 30.3165],
  haridwar: [78.1642, 29.9457],
  rishikesh: [78.2676, 30.0869],
};

/**
 * Calculates straight line distance in km using Haversine formula
 */
function calculateDistanceInKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v === null || v === undefined || isNaN(Number(v)))) {
    return null;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(lat1) * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Human-friendly distance display text
 */
function formatDistanceText(distanceInKm) {
  if (distanceInKm === null || distanceInKm === undefined || isNaN(distanceInKm)) return null;
  const num = Number(distanceInKm);
  if (num < 1) {
    const meters = Math.round(num * 1000);
    return `${meters} m away`;
  }
  return `${num.toFixed(1)} km away`;
}

/**
 * Queries OpenStreetMap Nominatim for exact coordinates
 * Supports strict timeout to keep API responses ultra-fast
 */
async function geocodeAddressAsync(addressDetails = {}) {
  const { locality = '', city = '', fullAddress = '', pincode = '', state = '' } = addressDetails;

  const queries = [];
  // 1. Locality + City + Country (Most accurate for neighborhoods)
  if (locality && city) {
    queries.push(`${locality.trim()}, ${city.trim()}, India`);
  }
  // 2. Full address if provided and not overly verbose
  if (fullAddress && city && fullAddress.length < 100) {
    queries.push(`${fullAddress.trim()}, India`);
  }
  // 3. Locality + Pincode
  if (locality && pincode) {
    queries.push(`${locality.trim()}, ${pincode.trim()}, India`);
  }
  // 4. City + State/Country
  if (city) {
    queries.push(`${city.trim()}, India`);
  }

  for (const q of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'GharMb-Backend/1.0 (support@gharmb.com)',
        },
        signal: AbortSignal.timeout(3000), // Max 3s timeout
      });

      if (!response.ok) continue;
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].lon && data[0].lat) {
        const lon = Number(data[0].lon);
        const lat = Number(data[0].lat);
        if (!isNaN(lon) && !isNaN(lat) && (lon !== 0 || lat !== 0)) {
          return [lon, lat];
        }
      }
    } catch (_) {
      // Ignore network / timeout errors and try next query
    }
  }

  return null;
}

/**
 * Synchronous resolver for coordinates (uses explicit body coords or City dictionary)
 */
function resolveCoordinates(body = {}) {
  const targetLng =
    body.lng ??
    body.longitude ??
    body.location?.coordinates?.[0] ??
    body.location?.longitude ??
    body.location?.lng;
  const targetLat =
    body.lat ??
    body.latitude ??
    body.location?.coordinates?.[1] ??
    body.location?.latitude ??
    body.location?.lat;

  if (
    targetLng !== undefined &&
    targetLat !== undefined &&
    targetLng !== null &&
    targetLat !== null &&
    !isNaN(Number(targetLng)) &&
    !isNaN(Number(targetLat)) &&
    (Number(targetLng) !== 0 || Number(targetLat) !== 0)
  ) {
    return [Number(targetLng), Number(targetLat)];
  }

  const rawCity = (body.city || '').toLowerCase().trim();
  const cleanCity = rawCity.split(',')[0].trim();
  if (cleanCity && CITY_COORDINATES[cleanCity]) {
    return CITY_COORDINATES[cleanCity];
  }

  const rawLocality = (body.locality || '').toLowerCase().trim();
  if (rawLocality && CITY_COORDINATES[rawLocality]) {
    return CITY_COORDINATES[rawLocality];
  }

  return [77.3910, 28.5355]; // Sensible NCR/Noida default
}

/**
 * Asynchronous resolver for coordinates:
 * 1. Checks explicit coordinates in payload
 * 2. If missing, attempts high-precision geocoding via Nominatim
 * 3. Falls back to CITY_COORDINATES
 * 4. Falls back to NCR/Noida default
 */
async function resolveCoordinatesAsync(body = {}) {
  const targetLng =
    body.lng ??
    body.longitude ??
    body.location?.coordinates?.[0] ??
    body.location?.longitude ??
    body.location?.lng;
  const targetLat =
    body.lat ??
    body.latitude ??
    body.location?.coordinates?.[1] ??
    body.location?.latitude ??
    body.location?.lat;

  // 1. Explicit coordinates provided by client (GPS or Map picker)
  if (
    targetLng !== undefined &&
    targetLat !== undefined &&
    targetLng !== null &&
    targetLat !== null &&
    !isNaN(Number(targetLng)) &&
    !isNaN(Number(targetLat)) &&
    (Number(targetLng) !== 0 || Number(targetLat) !== 0)
  ) {
    return [Number(targetLng), Number(targetLat)];
  }

  // 2. Try online geocoding for exact locality / address
  const geocoded = await geocodeAddressAsync({
    locality: body.locality,
    city: body.city,
    fullAddress: body.fullAddress,
    pincode: body.pincode,
    state: body.state,
  });

  if (geocoded) {
    return geocoded;
  }

  // 3. Fallback to dictionary
  return resolveCoordinates(body);
}

module.exports = {
  CITY_COORDINATES,
  calculateDistanceInKm,
  formatDistanceText,
  geocodeAddressAsync,
  resolveCoordinates,
  resolveCoordinatesAsync,
};
