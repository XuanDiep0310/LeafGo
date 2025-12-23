"use client"

import { Provider } from "react-redux"
import { ConfigProvider } from "antd"
import viVN from "antd/locale/vi_VN"
import { BrowserRouter } from "react-router-dom"
import { store } from "../src/store"
import App from "../src/App"
import "./globals.css"
import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { restoreSession } from "../src/store/slices/authSlice"

// Component to restore session on mount
function AppContent() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(restoreSession())
  }, [dispatch])

  return <App />
}

export default function Page() {
  return (
    <Provider store={store}>
      <ConfigProvider
        locale={viVN}
        theme={{
          token: {
            colorPrimary: "#10b981",
            borderRadius: 8,
            fontFamily: "system-ui, -apple-system, sans-serif",
          },
        }}
      >
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  )
}
