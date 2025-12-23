import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import bookingReducer from "./slices/bookingSlice"
import appReducer from "./slices/appSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer,
    app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["booking/setCurrentTrip"],
        // Ignore these paths in the state
        ignoredPaths: ["booking.currentTrip.createdAt"],
      },
    }),
})
