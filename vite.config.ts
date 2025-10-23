
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';

function printAllNetworkAddresses(port: number) {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  console.log('\n🌐 Accessible on your network:');
  addresses.forEach(ip => {
    console.log(`   ➜  http://${ip}:${port}/`);
  });
  console.log(`   ➜  Local:   http://localhost:${port}/`);
}

function AllNetworkAddressesPlugin() {
  return {
    name: 'all-network-addresses',
    configureServer(server: any) {
      server.httpServer?.once('listening', () => {
        const address = server.httpServer.address();
        const port = typeof address === 'object' && address ? address.port : 5173;
        printAllNetworkAddresses(port);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), AllNetworkAddressesPlugin()],
  server: {
    host: true, // Allow LAN access
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
