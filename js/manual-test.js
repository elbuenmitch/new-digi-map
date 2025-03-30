// Manual Test Execution Script for SVG Shape Editor
// ==================================================

// Import test utilities
import { TestRunner, assert } from './test-suite.js';

// Create test runner instance
const runner = new TestRunner();

// Define tests
defineTests(runner);

// Function to define tests
function defineTests(runner) {
    // App initialization tests
    runner.addTest('App initialization', (app) => {
        console.log('Testing app initialization');
        return assert.exists(app, 'App should be initialized') &&
               assert.exists(app.canvas, 'Canvas manager should be initialized') &&
               assert.exists(app.settings, 'Settings manager should be initialized') &&
               assert.exists(app.menu, 'Menu manager should be initialized') &&
               assert.exists(app.exporter, 'SVG exporter should be initialized');
    });

    // Element types configuration tests
    runner.addTest('Element types configuration', (app) => {
        console.log('Testing element types configuration');
        return assert.exists(app.elementTypes, 'Element types should be defined') &&
               assert.exists(app.elementTypes.Location, 'Location type should be defined') &&
               assert.exists(app.elementTypes.Barrier, 'Barrier type should be defined') &&
               assert.equal(app.elementTypes.Location.color, '#FFC580', 'Location color should be correct') &&
               assert.equal(app.elementTypes.Barrier.color, '#444444', 'Barrier color should be correct') &&
               assert.isTrue(app.elementTypes.Location.showName, 'Location showName should be true') &&
               assert.isFalse(app.elementTypes.Barrier.showName, 'Barrier showName should be false');
    }, ['App initialization']);

    // Other tests same as before...
}

// Run tests and generate report
async function runManualTests() {
    console.log('Running manual tests...');
    
    try {
        const results = await runner.runTests();
        generateTextReport(results, runner);
        return { success: true, results };
    } catch (error) {
        console.error('Error running tests:', error);
        return { success: false, error };
    }
}

// Generate text report
function generateTextReport(results, runner) {
    console.log('=== SVG Shape Editor Test Report ===');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);
    console.log('');
    
    console.log('Test Results:');
    runner.tests.forEach(test => {
        let statusSymbol = '⚠️';
        let statusText = 'Skipped';
        
        if (test.result === true) {
            statusSymbol = '✅';
            statusText = 'Pass';
        } else if (test.result === false) {
            statusSymbol = '❌';
            statusText = 'Fail';
        }
        
        console.log(`${statusSymbol} ${test.name}: ${statusText}`);
        if (test.error) {
            console.log(`   Error: ${test.error}`);
        }
    });
    
    console.log('');
    console.log('=== End of Test Report ===');
}

// Execute tests
runManualTests().then(result => {
    if (result.success) {
        console.log('Tests completed successfully');
    } else {
        console.error('Tests failed to run properly');
    }
});

// Export testing utilities
export { runManualTests, defineTests };
