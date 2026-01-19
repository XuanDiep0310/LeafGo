# Vehicle Types 404 Error - Fix Documentation

## Problem
The VehicleConfigModal was showing a **404 Not Found** error when trying to fetch vehicle types:
```
Request failed with status code 404
API endpoint: /api/VehicleTypes
```

## Root Cause
The frontend was calling the wrong endpoint. The code was trying to access:
- ❌ **Wrong:** `/api/VehicleTypes`

But the backend API actually provides this endpoint at:
- ✅ **Correct:** `/api/Admin/vehicle-types`

The endpoint is part of the **AdminController**, not a standalone VehicleTypesController.

## Backend Endpoint Details

### Endpoint Location
- **Route:** `GET /api/Admin/vehicle-types`
- **Controller:** `AdminController.cs` (line 268-280)
- **Authorization:** Requires `Admin` or `Driver` role
- **Response Type:** `ApiResponse<List<VehicleTypeResponse>>`

### Response Format
```json
{
  "success": true,
  "message": "Vehicle types retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Xe máy",
      "basePrice": 15000,
      "pricePerKm": 5000,
      "description": "Motorbike",
      "isActive": true,
      "totalDrivers": 5,
      "totalRides": 120
    }
  ]
}
```

## Changes Made

### 1. Updated driverService.js
**File:** `frontend/src/services/driverService.js` (line 121)

```javascript
// Before
export async function getVehicleTypes() {
    const res = await apiClient.get("/api/VehicleTypes");
    return res.data;
}

// After
export async function getVehicleTypes() {
    const res = await apiClient.get("/api/Admin/vehicle-types");
    return res.data;
}
```

### 2. Updated VehicleConfigModal.jsx Debug Info
**File:** `frontend/src/components/VehicleConfigModal.jsx` (line 262)

Updated the debug information to show the correct endpoint:
```jsx
// API endpoint: /api/Admin/vehicle-types (was: /api/VehicleTypes)
```

## Response Handling

The VehicleConfigModal handles multiple response formats:
1. **ApiResponse wrapper:** `{ success: true, data: [...] }`
2. **Direct data object:** `{ data: [...] }`
3. **Direct array:** `[...]`

This ensures compatibility with the actual API response format.

## Verification Steps

1. **Check Console Logs:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for these success messages:
     ```
     ✅ Vehicle Types Data: {...}
     ✅ Active Vehicle Types (X): [...]
     Format 1: ApiResponse with success + data
     ```

2. **Verify Vehicle Types Appear:**
   - Open the Vehicle Configuration modal
   - The "Loại xe" (Vehicle Type) dropdown should show available vehicle types
   - If no types appear, check if Admin has created them

3. **Check Network Tab:**
   - Go to Network tab in DevTools
   - Trigger the modal
   - Verify request to `/api/Admin/vehicle-types` returns **200 OK**

## Troubleshooting

### Still Getting 404?
1. **Check if Admin created vehicle types:**
   - Go to Admin panel
   - Create at least one vehicle type with `isActive = true`

2. **Verify API is running:**
   - Test endpoint directly: `GET http://localhost:3000/api/Admin/vehicle-types`
   - Should return status 200 with vehicle types

3. **Check authorization:**
   - Ensure driver is logged in (token is valid)
   - Endpoint requires `Driver` or `Admin` role

### Empty Dropdown?
1. **All vehicle types inactive:**
   - The modal filters out inactive types (`isActive = false`)
   - Ask Admin to activate at least one vehicle type

2. **Check data structure:**
   - Open Console
   - Verify `isActive` property exists and is `true`
   - Verify array is not empty

## Testing the Fix

1. **Manual Testing:**
   ```bash
   # Clear browser cache
   # Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   # Open Vehicle Config modal
   # Verify dropdown loads vehicle types
   ```

2. **API Testing:**
   ```bash
   # Test endpoint directly
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/Admin/vehicle-types
   ```

## Related Files
- Backend: `LeafGo.API/Controllers/AdminController.cs` (GetVehicleTypes method)
- Frontend Service: `frontend/src/services/driverService.js`
- Frontend Modal: `frontend/src/components/VehicleConfigModal.jsx`
- Backend Service: `LeafGo.Infrastructure/Services/AdminService.cs` (GetVehicleTypesAsync method)

## Summary
✅ Fixed endpoint URL from `/api/VehicleTypes` to `/api/Admin/vehicle-types`
✅ Updated debug info to reflect correct endpoint
✅ Modal now correctly fetches and displays available vehicle types
