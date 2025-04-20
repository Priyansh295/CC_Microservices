/**
 * Main Test Runner
 * 
 * This script serves as the primary entry point for running all test suites
 * across the microservices architecture, including service tests, security tests,
 * and any additional test categories.
 */

const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Import test runners
const securityTestRunner = require('./security-test-runner');

// Test categories with their descriptions and runner functions
const testCategories = [
  {
    name: 'Security Tests',
    description: 'Security tests including service access control and vulnerability scanning',
    runner: securityTestRunner.runAllSecurityTests
  }
  // Additional test categories can be added here as they are implemented
  // e.g. Performance tests, data integrity tests, etc.
];

// Configuration for test execution
const config = {
  reportDir: path.join(__dirname, 'all-test-reports'),
  defaultTimeout: 600000, // 10 minutes per test category
};

/**
 * Creates the reports directory if it doesn't exist
 */
async function prepareReportDirectory() {
  try {
    await execPromise(`mkdir -p ${config.reportDir}`);
    console.log(`Main report directory created at: ${config.reportDir}`);
  } catch (error) {
    console.error('Failed to create report directory:', error);
    throw error;
  }
}

/**
 * Writes the overall test report
 */
async function writeOverallReport(results) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(config.reportDir, `all-tests-summary-${timestamp}.json`);
  
  try {
    const reportContent = JSON.stringify(results, null, 2);
    await execPromise(`echo '${reportContent}' > ${reportPath}`);
    console.log(`Overall test report written to: ${reportPath}`);
    return reportPath;
  } catch (error) {
    console.error('Failed to write overall test report:', error);
    throw error;
  }
}

/**
 * Runs a specific test category with a timeout
 */
async function runTestCategory(category) {
  return new Promise((resolve) => {
    const { name, runner, timeout = config.defaultTimeout } = category;
    
    console.log('\n==================================================');
    console.log(`Starting test category: ${name}`);
    console.log('==================================================\n');
    
    // Set a timeout for this test category
    const timeoutId = setTimeout(() => {
      console.error(`Test category "${name}" timed out after ${timeout / 1000} seconds`);
      resolve({
        name,
        success: false,
        error: `Timeout after ${timeout / 1000} seconds`
      });
    }, timeout);
    
    // Run the test category
    runner()
      .then(result => {
        clearTimeout(timeoutId);
        resolve({
          name,
          success: result.exitCode === 0,
          summary: result.summary,
          error: result.error
        });
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error(`Error running test category "${name}":`, error);
        resolve({
          name,
          success: false,
          error: error.message || String(error)
        });
      });
  });
}

/**
 * Print a summary of all test categories
 */
function printOverallSummary(results) {
  const totalCategories = results.length;
  const successfulCategories = results.filter(r => r.success).length;
  const failedCategories = totalCategories - successfulCategories;
  
  console.log('\n==================================================');
  console.log('             OVERALL TEST SUMMARY                ');
  console.log('==================================================');
  console.log(`Test Categories: ${totalCategories} total, ${successfulCategories} passed, ${failedCategories} failed`);
  
  // Calculate total tests across all categories
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  results.forEach(result => {
    if (result.summary) {
      totalTests += result.summary.totalTests || 0;
      passedTests += result.summary.passedTests || 0;
      failedTests += result.summary.failedTests || 0;
    }
  });
  
  if (totalTests > 0) {
    const successRate = (passedTests / totalTests * 100).toFixed(2);
    console.log(`All Tests: ${totalTests} total, ${passedTests} passed, ${failedTests} failed (${successRate}% success rate)`);
  }
  
  console.log('\nResults by Category:');
  results.forEach(result => {
    const statusIcon = result.success ? '✅' : '❌';
    console.log(`${statusIcon} ${result.name}`);
    
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    } else if (result.summary) {
      console.log(`   Tests: ${result.summary.totalTests || 0} total, ${result.summary.passedTests || 0} passed, ${result.summary.failedTests || 0} failed`);
    }
  });
  
  console.log('==================================================\n');
}

/**
 * Main function to run all test categories
 */
async function runAllTests() {
  console.log('==================================================');
  console.log('          STARTING MAIN TEST RUNNER               ');
  console.log('==================================================');
  
  try {
    await prepareReportDirectory();
    
    const startTime = Date.now();
    const categoryResults = [];
    
    // Run each test category sequentially
    for (const category of testCategories) {
      const result = await runTestCategory(category);
      categoryResults.push(result);
    }
    
    const endTime = Date.now();
    const totalExecutionTime = (endTime - startTime) / 1000;
    
    // Create overall results summary
    const overallResults = {
      totalCategories: categoryResults.length,
      successfulCategories: categoryResults.filter(r => r.success).length,
      failedCategories: categoryResults.filter(r => !r.success).length,
      executionTime: totalExecutionTime,
      results: categoryResults
    };
    
    // Print and save summary
    printOverallSummary(categoryResults);
    await writeOverallReport(overallResults);
    
    console.log(`All test categories completed in ${totalExecutionTime.toFixed(2)} seconds`);
    
    // Determine overall success - all categories must succeed
    const allSuccessful = categoryResults.every(r => r.success);
    return { success: allSuccessful, exitCode: allSuccessful ? 0 : 1 };
  } catch (error) {
    console.error('Fatal error running all tests:', error);
    return { success: false, exitCode: 1, error };
  }
}

// Run tests if this script is called directly
if (require.main === module) {
  runAllTests()
    .then(({ exitCode }) => {
      process.exit(exitCode);
    })
    .catch(err => {
      console.error('Unhandled error in main test runner:', err);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = {
    runAllTests
  };
} 