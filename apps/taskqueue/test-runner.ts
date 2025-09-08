// Simple test runner script
import { runAllUtilsTests } from './src/telegram/__tests__/utils.spec';
import { runAuthHandlerTests } from './src/telegram/__tests__/auth.handler.spec';

console.log('🚀 Starting Telegram Module Tests...\n');

// Run utils tests
runAllUtilsTests();

console.log('\n' + '='.repeat(50) + '\n');

// Run auth handler tests
runAuthHandlerTests();

console.log('\n✨ All tests completed!');
