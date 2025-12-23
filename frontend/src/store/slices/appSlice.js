import { createSlice } from "@reduxjs/toolkit"

// General app state
const initialState = {
  sidebarCollapsed: false,
  notifications: [],
}

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      })
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
  },
})

export const { toggleSidebar, addNotification, removeNotification, clearNotifications } = appSlice.actions
export default appSlice.reducer
