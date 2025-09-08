#!/usr/bin/env node

// Simple JavaScript test runner (no TypeScript dependencies)
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Running Telegram Module Tests...\n');

try {
  // Run tests through ts-node
  console.log('🧪 Running tests...');
  execSync('npx ts-node test-runner.ts', { stdio: 'inherit', cwd: path.resolve('.') });

  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Test run failed:', error.message);
  process.exit(1);
}
