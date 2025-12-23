"use client";

import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Provider, useDispatch } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import App from "./App";
import { store } from "./store";
import { restoreSession } from "./store/slices/authSlice";
import "../app/globals.css";

// Component to restore session on mount
function AppWithSessionRestore() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
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
          <AppWithSessionRestore />
        </ConfigProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
