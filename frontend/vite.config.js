import os from 'os';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function apexBuildBannerPlugin() {
  return {
    name: 'apexbuild-banner-plugin',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        setTimeout(() => {
          const interfaces = os.networkInterfaces();
          let wifiIp = null;
          let wslIp = null;

          for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
              if (iface.family === 'IPv4' && !iface.internal) {
                if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
                  wifiIp = iface.address;
                } else if (iface.address.startsWith('172.')) {
                  wslIp = iface.address;
                }
              }
            }
          }

          const localWifi = wifiIp || '192.168.29.69';
          const localWsl = wslIp || '172.21.240.1';

          console.log(`
\x1b[36m┌────────────────────────────────────────────────────────────────────────┐\x1b[0m
\x1b[36m│\x1b[0m                 \x1b[1m\x1b[37mAPEXBUILD MULTI-TENANT PLATFORM\x1b[0m                        \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m               \x1b[32mFrontend Application (Vite + React)\x1b[0m                       \x1b[36m│\x1b[0m
\x1b[36m├────────────────────────────────────────────────────────────────────────┤\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1m\x1b[33m🖥️  This PC (Local Browser):\x1b[0m  \x1b[1m\x1b[36mhttp://localhost:5173/\x1b[0m                   \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1m\x1b[32m📱 Phone / Tablet (Wi-Fi):\x1b[0m    \x1b[1m\x1b[32mhttp://${localWifi}:5173/\x1b[0m              \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  \x1b[90m🐧 WSL / Virtual Machine:\x1b[0m     \x1b[90mhttp://${localWsl}:5173/ (WSL Internal)\x1b[0m  \x1b[36m│\x1b[0m
\x1b[36m├────────────────────────────────────────────────────────────────────────┤\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1mWorkspaces Available:\x1b[0m                                                 \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  • Contractor OS:   /dashboard     • Supplier OS:     /supplier       \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  • Distributor OS:  /distributor   • Diagnostics OS:  /diagnostics    \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  • Restaurant OS:   /restaurant    • Pharmacy OS:     /pharmacy (NEW) \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  • Super Admin HQ:  /superadmin                                        \x1b[36m│\x1b[0m
\x1b[36m└────────────────────────────────────────────────────────────────────────┘\x1b[0m
`);
        }, 200);
      });
    }
  };
}

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
  },
  plugins: [
    react(),
    apexBuildBannerPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000, // 5 MB
        importScripts: ['/sw-push.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/v1\/(?!auth|users\/login|users\/register|superadmin).*/i,
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'api-runtime-cache',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'ApexBuild Business OS',
        short_name: 'ApexBuild',
        description: 'Multi-Tenant Business Operating System & Operations Suite',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Distributor Sales',
            short_name: 'Deliveries',
            description: 'Record Chicken Delivery and Sales',
            url: '/distributor/deliveries',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Civil Daily Reports',
            short_name: 'Site DPR',
            description: 'Civil Site Daily Progress & Attendance',
            url: '/site-reports',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Supplier Orders',
            short_name: 'Orders',
            description: 'Material Supplier Dispatch Orders',
            url: '/supplier/orders',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Diagnostic Tests',
            short_name: 'Lab Orders',
            description: 'Patient Test Bookings and Reports',
            url: '/diagnostics/orders',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('lucide-react') || id.includes('react-hot-toast')) {
              return 'ui';
            }
          }
        }
      }
    }
  }
});
