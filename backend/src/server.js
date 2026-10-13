import os from 'os';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

dotenv.config();

const PORT = parseInt(process.env.PORT, 10) || 5000;

// Resolve all active network addresses (Wi-Fi, Ethernet, WSL)
function getNetworkDetails() {
  const interfaces = os.networkInterfaces();
  const networks = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        networks.push({ name, address: iface.address });
      }
    }
  }
  const primary = networks.find(n => n.address.startsWith('192.168.') || n.address.startsWith('10.')) || networks[0];
  return {
    primaryIp: primary ? primary.address : 'localhost',
    primaryName: primary ? primary.name : 'Wi-Fi / LAN',
    all: networks
  };
}

// Connect to Database & Start HTTP Server
connectDB().then((conn) => {
  const server = app.listen(PORT, () => {
    const net = getNetworkDetails();
    const dbHost = conn?.connection?.host || 'MongoDB Cluster';
    const dbName = conn?.connection?.name || 'apexbuild_platform';
    const envMode = process.env.NODE_ENV || 'development';

    console.log(`
\x1b[36m┌────────────────────────────────────────────────────────────────────────┐\x1b[0m
\x1b[36m│\x1b[0m                 \x1b[1m\x1b[37mAPEXBUILD MULTI-TENANT PLATFORM\x1b[0m                        \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m                   \x1b[32mBackend API Service v2.4.0\x1b[0m                           \x1b[36m│\x1b[0m
\x1b[36m├────────────────────────────────────────────────────────────────────────┤\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1m\x1b[32m⚡ Server Status:\x1b[0m   \x1b[32mONLINE & LISTENING\x1b[0m                               \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1m🌍 Environment:\x1b[0m     \x1b[33m${envMode.padEnd(20)}\x1b[0m                             \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1m🔌 Server Port:\x1b[0m     \x1b[36m${PORT.toString().padEnd(20)}\x1b[0m                             \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1m🖥️  Local URL:\x1b[0m       \x1b[1m\x1b[36mhttp://localhost:${PORT}/\x1b[0m                            \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1m📱 Network URL:\x1b[0m     \x1b[1m\x1b[32mhttp://${net.primaryIp}:${PORT}/\x1b[0m                        \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1m🔗 API Root:\x1b[0m        \x1b[36mhttp://localhost:${PORT}/api/v1\x1b[0m                          \x1b[36m│\x1b[0m
\x1b[36m├────────────────────────────────────────────────────────────────────────┤\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1m🍃 Database:\x1b[0m        \x1b[32mMongoDB Atlas (Connected)\x1b[0m                        \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1m📦 Database Name:\x1b[0m   \x1b[37m${dbName.padEnd(25)}\x1b[0m                    \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1m🌐 Cluster Host:\x1b[0m    \x1b[90m${dbHost.slice(0, 36).padEnd(36)}\x1b[0m    \x1b[36m│\x1b[0m
\x1b[36m├────────────────────────────────────────────────────────────────────────┤\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1mRegistered OS Verticals:\x1b[0m                                             \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  • Contractor OS       • Supplier OS         • Distributor OS          \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  • Diagnostics OS      • Restaurant OS       • Pharmacy OS (New)       \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  • Super Admin Control Plane                                           \x1b[36m│\x1b[0m
\x1b[36m└────────────────────────────────────────────────────────────────────────┘\x1b[0m
`);
  });

  // Handle Port Conflict gracefully
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`\n\x1b[41m\x1b[37m [PORT CONFLICT] \x1b[0m \x1b[31mPort ${PORT} is already in use by another process!\x1b[0m`);
      console.log(`\x1b[33m💡 Quick Fix Options:\x1b[0m`);
      console.log(`   1. An instance is already running in another terminal window.`);
      console.log(`   2. In PowerShell, stop the existing process:`);
      console.log(`      \x1b[36mStop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\x1b[0m`);
      console.log(`   3. Or set a different port in backend/.env: \x1b[36mPORT=5001\x1b[0m\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  // Handle Unhandled Rejections
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
}).catch(err => {
  console.error("Failed to connect to DB:", err);
});
