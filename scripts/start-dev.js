#!/usr/bin/env node

/**
 * Cross-platform development server starter
 * This script ensures the project runs consistently across Windows, macOS, and Linux
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';

console.log(`🚀 Starting EventHub development servers on ${os.platform()}...`);

// Function to spawn a process with proper platform handling
function spawnProcess(command, args, options = {}) {
  const processOptions = {
    stdio: 'inherit',
    shell: isWindows,
    ...options
  };

  if (isWindows) {
    return spawn('cmd', ['/c', command, ...args], processOptions);
  } else {
    return spawn(command, args, processOptions);
  }
}

// Start frontend and backend using npm run dev
console.log('🚀 Starting both frontend and backend servers...');
const dev = spawnProcess('npm', ['run', 'dev'], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: 'development' }
});

// Handle process termination
const cleanup = () => {
  console.log('\n🛑 Shutting down servers...');
  dev.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Handle errors
dev.on('error', (error) => {
  console.error('❌ Development servers error:', error);
});

console.log('✅ Cross-platform development script ready!');
console.log('📱 Press Ctrl+C to stop all servers');