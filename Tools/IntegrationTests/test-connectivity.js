const http = require('http');

// Function to test an endpoint
function testEndpoint(url) {
  return new Promise((resolve, reject) => {
    console.log(`Testing ${url}...`);
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${url} - Status: ${res.statusCode}`);
          try {
            const parsedData = JSON.parse(data);
            console.log(`   Response: ${JSON.stringify(parsedData)}`);
          } catch (e) {
            console.log(`   Response: ${data.substring(0, 100)}...`);
          }
        } else {
          console.error(`❌ ${url} - Status: ${res.statusCode}`);
          console.error(`   Response: ${data.substring(0, 100)}...`);
        }
        resolve({ success: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode });
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ ${url} - Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(3000, () => {
      console.error(`❌ ${url} - Error: Timeout after 3 seconds`);
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function runTests() {
  console.log('Testing microservices connectivity...\n');
  
  let allSuccess = true;
  let results = {};
  
  // Test NGINX health
  results.nginx = await testEndpoint('http://localhost/health');
  allSuccess = allSuccess && results.nginx.success;
  
  console.log('\nTesting direct service access:');
  
  // Test direct access to services
  results.accessControlDirect = await testEndpoint('http://localhost:3001/health');
  allSuccess = allSuccess && results.accessControlDirect.success;
  
  results.vulnerabilityScannerDirect = await testEndpoint('http://localhost:3002/health');
  allSuccess = allSuccess && results.vulnerabilityScannerDirect.success;
  
  results.bugMonitoringDirect = await testEndpoint('http://localhost:3003/health');
  allSuccess = allSuccess && results.bugMonitoringDirect.success;
  
  results.dataEncryptionDirect = await testEndpoint('http://localhost:3004/health');
  allSuccess = allSuccess && results.dataEncryptionDirect.success;
  
  results.authenticationDirect = await testEndpoint('http://localhost:3005/health');
  allSuccess = allSuccess && results.authenticationDirect.success;
  
  console.log('\nTesting services through NGINX:');
  
  // Test NGINX proxying
  results.accessControlProxy = await testEndpoint('http://localhost/api/access-control/health');
  allSuccess = allSuccess && results.accessControlProxy.success;
  
  results.vulnerabilityScannerProxy = await testEndpoint('http://localhost/api/vulnerability-scanner/health');
  allSuccess = allSuccess && results.vulnerabilityScannerProxy.success;
  
  results.bugMonitoringProxy = await testEndpoint('http://localhost/api/bug-monitoring/health');
  allSuccess = allSuccess && results.bugMonitoringProxy.success;
  
  results.dataEncryptionProxy = await testEndpoint('http://localhost/api/data-encryption/health');
  allSuccess = allSuccess && results.dataEncryptionProxy.success;
  
  results.authenticationProxy = await testEndpoint('http://localhost/api/auth/health');
  allSuccess = allSuccess && results.authenticationProxy.success;
  
  console.log('\n===== SUMMARY =====');
  console.log(allSuccess ? '✅ All tests passed!' : '❌ Some tests failed!');
  
  return { allSuccess, results };
}

runTests(); 