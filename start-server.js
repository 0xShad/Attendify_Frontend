#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('Starting Next.js application...');
console.log(`PORT: ${process.env.PORT || 8080}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

const npm = spawn('npm', ['start'], {
  stdio: 'inherit',
  env: { ...process.env }
});

npm.on('error', (error) => {
  console.error('Failed to start npm:', error);
  process.exit(1);
});

npm.on('exit', (code) => {
  process.exit(code);
});
