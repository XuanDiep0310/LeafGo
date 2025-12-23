import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { mockApi, calculateTripPrice } from "../../services/mockData"

// Implements FR-05, FR-06, FR-07, FR-08, FR-09, FR-10, FR-11

const initialState = {
  currentTrip: null, // Current active trip
  trips: [], // All trips history
  loading: false,
  error: null,
  // Booking form data
  pickupLocation: null,
  dropoffLocation: null,
  estimatedPrice: 0,
  distance: 0,
}

// Async thunks
// FR-07: Create booking
export const createBooking = createAsyncThunk(
  "booking/createBooking",
  async ({ userId, pickupLocation, dropoffLocation, distance, price }, { rejectWithValue }) => {
    try {
      const trip = await mockApi.createTrip({
        userId,
        pickupLocation,
        dropoffLocation,
        distance,
        price,
        status: "finding",
      })
      return trip
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

// FR-10: Fetch trip history
export const fetchTripHistory = createAsyncThunk("booking/fetchTripHistory", async (userId, { rejectWithValue }) => {
  try {
    const trips = await mockApi.getTripsByUserId(userId)
    return trips
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

// FR-11: Rate trip
export const rateTrip = createAsyncThunk(
  "booking/rateTrip",
  async ({ tripId, rating, comment }, { rejectWithValue }) => {
    try {
      const trip = await mockApi.updateTrip(tripId, { rating, comment })
      return trip
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    // FR-05: Set pickup location
    setPickupLocation: (state, action) => {
      state.pickupLocation = action.payload
      if (state.dropoffLocation) {
        // Calculate distance (simplified - in real app would use map routing)
        const distance = calculateDistance(state.pickupLocation, state.dropoffLocation)
        state.distance = distance
        // FR-06: Calculate price
        state.estimatedPrice = calculateTripPrice(distance)
      }
    },
    // FR-05: Set dropoff location
    setDropoffLocation: (state, action) => {
      state.dropoffLocation = action.payload
      if (state.pickupLocation) {
        const distance = calculateDistance(state.pickupLocation, state.dropoffLocation)
        state.distance = distance
        // FR-06: Calculate price
        state.estimatedPrice = calculateTripPrice(distance)
      }
    },
    // FR-08, FR-09: Update trip status (realtime simulation)
    updateTripStatus: (state, action) => {
      if (state.currentTrip) {
        state.currentTrip.status = action.payload.status
        if (action.payload.driverId) {
          state.currentTrip.driverId = action.payload.driverId
        }
      }
    },
    setCurrentTrip: (state, action) => {
      state.currentTrip = action.payload
    },
    clearCurrentTrip: (state) => {
      state.currentTrip = null
      state.pickupLocation = null
      state.dropoffLocation = null
      state.estimatedPrice = 0
      state.distance = 0
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false
        state.currentTrip = action.payload
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Trip History
      .addCase(fetchTripHistory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTripHistory.fulfilled, (state, action) => {
        state.loading = false
        state.trips = action.payload
      })
      .addCase(fetchTripHistory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Rate Trip
      .addCase(rateTrip.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(rateTrip.fulfilled, (state, action) => {
        state.loading = false
        // Update trip in history
        const index = state.trips.findIndex((t) => t.id === action.payload.id)
        if (index !== -1) {
          state.trips[index] = action.payload
        }
      })
      .addCase(rateTrip.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

// Helper function to calculate distance (simplified)
const calculateDistance = (loc1, loc2) => {
  if (!loc1 || !loc2) return 0
  // Simplified distance calculation (Haversine formula approximation)
  const R = 6371 // Earth's radius in km
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180
  const dLon = ((loc2.lng - loc1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return Math.round(distance * 10) / 10 // Round to 1 decimal
}

export const { setPickupLocation, setDropoffLocation, updateTripStatus, setCurrentTrip, clearCurrentTrip, clearError } =
  bookingSlice.actions
export default bookingSlice.reducer
