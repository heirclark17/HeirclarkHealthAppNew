#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Starting Expo with tunnel...\n');

// Start expo with tunnel and dev-client flags
const expo = spawn('npx', ['expo', 'start', '--tunnel', '--dev-client'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

expo.on('error', (error) => {
  console.error('Failed to start Expo:', error);
  process.exit(1);
});

expo.on('close', (code) => {
  console.log(`\nExpo tunnel stopped with code ${code}`);
  process.exit(code);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\nStopping tunnel...');
  expo.kill('SIGINT');
});
