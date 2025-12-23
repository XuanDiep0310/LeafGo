// Location service using Nominatim (OpenStreetMap) for geocoding and OpenRouteService for routing
const NOMINATIM_API =
  import.meta.env.VITE_NOMINATIM_API || "https://nominatim.openstreetmap.org";
const ORS_API =
  import.meta.env.VITE_ORS_API || "https://api.openrouteservice.org/v2";
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

// Search locations using Nominatim geocoding API
export const searchLocations = async (query) => {
  if (!query || query.length < 3) return [];

  try {
    // Use expanded viewbox for better results (Hanoi expanded area)
    // viewbox format: left,top,right,bottom (minlon,minlat,maxlon,maxlat)
    const response = await fetch(
      `${NOMINATIM_API}/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=15&countrycodes=vn&viewbox=105.4,20.4,106.0,21.2&bounded=0&accept-language=vi`
    );
    const data = await response.json();

    return data.map((item) => ({
      address: item.name || item.address || "Unknown",
      city: item.address?.split(",").pop()?.trim() || "Hà Nội",
      district: "",
      fullAddress: item.display_name || item.name || "Unknown",
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (error) {
    return [];
  }
};

// Decode encoded polyline from OpenRouteService
const decodePolyline = (encoded) => {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
};

// Get route between two points using OpenRouteService
export const getRoute = async (start, end) => {
  try {
    if (!start || !end || !start.lng || !start.lat || !end.lng || !end.lat) {
      console.error("[v0] Invalid start or end coordinates", { start, end });
      return null;
    }

    // If ORS_API_KEY is not configured, fallback to simple route calculation
    if (!ORS_API_KEY) {
      console.warn(
        "[LeafGo] ORS_API_KEY is not set. Falling back to simple route calculation."
      );
      return getSimpleRoute(start, end);
    }

    const response = await fetch(`${ORS_API}/directions/driving-car`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ORS_API_KEY}`,
      },
      body: JSON.stringify({
        coordinates: [
          [start.lng, start.lat],
          [end.lng, end.lat],
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return getSimpleRoute(start, end);
    }

    const data = await response.json();

    if (!data) {
      return getSimpleRoute(start, end);
    }

    if (data.routes && Array.isArray(data.routes) && data.routes.length > 0) {
      const route = data.routes[0];
      if (route && route.summary) {
        let coordinates = [];

        // Handle encoded polyline geometry (default format)
        if (typeof route.geometry === "string") {
          coordinates = decodePolyline(route.geometry);
        }
        // Handle GeoJSON coordinates array
        else if (
          route.geometry &&
          route.geometry.coordinates &&
          Array.isArray(route.geometry.coordinates)
        ) {
          coordinates = route.geometry.coordinates.map((coord) => [
            coord[1],
            coord[0],
          ]);
        }

        if (coordinates && coordinates.length > 0) {
          const distance = (route.summary.distance / 1000).toFixed(1);
          const duration = Math.round(route.summary.duration / 60);

          return {
            distance: Number.parseFloat(distance),
            duration,
            coordinates,
          };
        }
      }
    }

    return getSimpleRoute(start, end);
  } catch (error) {
    return getSimpleRoute(start, end);
  }
};

// Simple route calculation as fallback
const getSimpleRoute = (start, end) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLon = ((end.lng - start.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((start.lat * Math.PI) / 180) *
      Math.cos((end.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = (R * c).toFixed(1);
  const duration = Math.round((distance / 30) * 60); // Assume 30 km/h average speed

  // Create simple straight line coordinates
  const coordinates = [
    [start.lat, start.lng],
    [end.lat, end.lng],
  ];

  return {
    distance: Number.parseFloat(distance),
    duration,
    coordinates,
  };
};

// Get current location using browser geolocation API with high accuracy
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    // Use high accuracy options to get the most accurate location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({
          lat: latitude,
          lng: longitude,
          accuracy,
        });
      },
      (error) => {
        // Fallback: use Hanoi center if geolocation fails
        resolve({
          lat: 21.0285,
          lng: 105.8542,
          accuracy: 5000,
          fallback: true,
        });
      },
      {
        enableHighAccuracy: true, // Force high accuracy
        timeout: 15000, // Wait up to 15 seconds
        maximumAge: 0, // Don't use cached position
      }
    );
  });
};

// Reverse geocode coordinates to address using Nominatim with high detail
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `${NOMINATIM_API}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`
    );
    const data = await response.json();

    if (data) {
      const address = data.address || {};

      // Priority order for finding location name
      let locationName =
        address.road ||
        address.pedestrian ||
        address.footway ||
        address.path ||
        address.residential ||
        address.neighbourhood ||
        address.suburb ||
        address.village ||
        address.hamlet ||
        address.town ||
        address.city ||
        data.name ||
        "Vị trí hiện tại";

      // Get city/district info
      const city = address.city || address.town || address.county || "Hà Nội";
      const district = address.district || address.county || "";

      // Build full address
      const parts = [];
      if (address.road) parts.push(address.road);
      if (address.suburb) parts.push(address.suburb);
      if (address.district) parts.push(address.district);
      if (address.city) parts.push(address.city);
      if (address.postcode) parts.push(address.postcode);

      const fullAddress =
        parts.length > 0
          ? parts.join(", ")
          : data.display_name || `${locationName}, ${city}`;

      return {
        address: locationName,
        city: city,
        district: district,
        fullAddress: fullAddress,
        lat,
        lng,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
};
