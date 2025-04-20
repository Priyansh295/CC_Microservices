/**
 * Security Test Runner
 * 
 * This script orchestrates the execution of all security-related tests
 * for the microservices architecture, including integration tests between
 * services and specialized vulnerability scanning tests.
 */

const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Import the test modules
const detailedServiceTests = require('./detailed-service-tests');
const vulnerabilityTests = require('./vulnerability-tests');

// Configuration
const config = {
  reportDir: path.join(__dirname, 'test-reports'),
  testTimeout: 300000, // 5 minutes
  testOrder: [
    { name: 'Service Integration Tests', runner: detailedServiceTests.runAllTests },
    { name: 'Vulnerability Scanner Tests', runner: vulnerabilityTests.runVulnerabilityTests }
  ]
};

/**
 * Ensures the report directory exists
 */
async function ensureReportDir() {
  try {
    await execPromise(`mkdir -p ${config.reportDir}`);
    console.log(`Report directory confirmed: ${config.reportDir}`);
  } catch (error) {
    console.error('Error creating report directory:', error);
    throw error;
  }
}

/**
 * Writes a test report to a file
 */
async function writeReport(testName, results) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportFile = path.join(config.reportDir, `${testName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.json`);
  
  try {
    // Convert results to JSON with proper formatting
    const reportContent = JSON.stringify(results, null, 2);
    await execPromise(`echo '${reportContent}' > ${reportFile}`);
    console.log(`Report written to: ${reportFile}`);
    
    return reportFile;
  } catch (error) {
    console.error(`Error writing report for ${testName}:`, error);
    throw error;
  }
}

/**
 * Runs a single test suite with timeout
 */
async function runTestWithTimeout(testInfo) {
  return new Promise((resolve, reject) => {
    const { name, runner } = testInfo;
    
    // Set a timeout for the test
    const timeoutId = setTimeout(() => {
      reject(new Error(`Test suite "${name}" timed out after ${config.testTimeout / 1000} seconds`));
    }, config.testTimeout);
    
    console.log(`\n===============================================`);
    console.log(`Starting test suite: ${name}`);
    console.log(`===============================================\n`);
    
    // Run the test
    runner()
      .then(results => {
        clearTimeout(timeoutId);
        resolve({ name, results, success: true });
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error(`Test suite "${name}" failed with error:`, error);
        resolve({ name, error: error.message || String(error), success: false });
      });
  });
}

/**
 * Aggregate and summarize all test results
 */
function aggregateResults(testResults) {
  const summary = {
    totalSuites: testResults.length,
    successfulSuites: 0,
    failedSuites: 0,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    successRate: 0,
    testSuites: []
  };
  
  testResults.forEach(result => {
    const { name, results, success, error } = result;
    
    if (success && results && results.summary) {
      summary.successfulSuites++;
      summary.totalTests += results.summary.totalTests || 0;
      summary.passedTests += results.summary.passedTests || 0;
      summary.failedTests += results.summary.failedTests || 0;
      
      summary.testSuites.push({
        name,
        success: true,
        totalTests: results.summary.totalTests || 0,
        passedTests: results.summary.passedTests || 0,
        failedTests: results.summary.failedTests || 0,
        successRate: results.summary.successRate || 0
      });
    } else {
      summary.failedSuites++;
      
      summary.testSuites.push({
        name,
        success: false,
        error: error
      });
    }
  });
  
  // Calculate overall success rate
  if (summary.totalTests > 0) {
    summary.successRate = (summary.passedTests / summary.totalTests * 100).toFixed(2);
  }
  
  return summary;
}

/**
 * Print the test summary to the console
 */
function printSummary(summary) {
  console.log('\n===============================================');
  console.log('       Security Tests Overall Summary          ');
  console.log('===============================================');
  console.log(`Test Suites: ${summary.totalSuites} total, ${summary.successfulSuites} successful, ${summary.failedSuites} failed`);
  console.log(`Tests: ${summary.totalTests} total, ${summary.passedTests} passed, ${summary.failedTests} failed`);
  console.log(`Overall Success Rate: ${summary.successRate}%`);
  console.log('===============================================\n');
  
  // Print individual suite results
  console.log('Test Suite Results:');
  summary.testSuites.forEach(suite => {
    const status = suite.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} ${suite.name}`);
    
    if (suite.success) {
      console.log(`  Tests: ${suite.totalTests} total, ${suite.passedTests} passed, ${suite.failedTests} failed, ${suite.successRate}% success rate`);
    } else {
      console.log(`  Error: ${suite.error}`);
    }
  });
}

/**
 * Main function to run all tests
 */
async function runAllSecurityTests() {
  console.log('===============================================');
  console.log('      Starting Security Test Runner           ');
  console.log('===============================================\n');
  
  try {
    // Ensure report directory exists
    await ensureReportDir();
    
    // Run all test suites
    const testResults = [];
    const startTime = Date.now();
    
    for (const testInfo of config.testOrder) {
      try {
        const result = await runTestWithTimeout(testInfo);
        testResults.push(result);
        
        // Write individual report
        if (result.success) {
          await writeReport(testInfo.name, result.results);
        } else {
          await writeReport(`${testInfo.name}-failed`, { error: result.error });
        }
      } catch (error) {
        console.error(`Error running test suite ${testInfo.name}:`, error);
        testResults.push({
          name: testInfo.name,
          success: false,
          error: error.message || String(error)
        });
      }
    }
    
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    
    // Aggregate results
    const summary = aggregateResults(testResults);
    summary.executionTime = executionTime;
    
    // Print summary
    printSummary(summary);
    
    // Write overall summary report
    await writeReport('security-tests-summary', summary);
    
    console.log(`\nAll tests completed in ${executionTime.toFixed(2)} seconds.`);
    
    // Determine exit code based on whether any tests failed
    const exitCode = summary.failedTests > 0 || summary.failedSuites > 0 ? 1 : 0;
    return { summary, exitCode };
  } catch (error) {
    console.error('Error running security tests:', error);
    return { error, exitCode: 1 };
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runAllSecurityTests()
    .then(({ exitCode }) => {
      process.exit(exitCode);
    })
    .catch(err => {
      console.error('Unhandled error in security test runner:', err);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = {
    runAllSecurityTests
  };
} 