import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Your current port
    proxy: {
      // API endpoints
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      // Health endpoint
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // SignalR Hub with WebSocket support
      '/hubs': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket
        configure: (proxy, _options) => {
          // Handle WebSocket upgrade
          proxy.on('error', (err, _req, _res) => {
            console.log('SignalR proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('SignalR Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('SignalR Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
            console.log('WebSocket upgrade request:', req.url);
          });
          proxy.on('open', (proxySocket) => {
            console.log('WebSocket connection opened');
          });
          proxy.on('close', (res, socket, head) => {
            console.log('WebSocket connection closed');
          });
        },
      }
    }
  }
})