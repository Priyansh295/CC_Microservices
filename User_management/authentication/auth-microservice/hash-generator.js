// // hash-generator.js
// const bcryptjs = require('bcryptjs');

// const password = 'password123';
// const saltRounds = 10;

// bcryptjs.hash(password, saltRounds, (err, hash) => {
//   if (err) {
//     console.error('Error generating hash:', err);
//     return;
//   }
//   console.log('Password:', password);
//   console.log('Hash:', hash);
// });

// test-hash.js
const bcryptjs = require('bcryptjs');

async function verifyStoredHash() {
  const password = 'password123';
  const storedHash = '$2b$10$nlaHntn5NMPz5skQ043G7.KrbQY9MW.3DK9YLQrWirQQCcPWM6cKa';
  
  const isValid = await bcryptjs.compare(password, storedHash);
  console.log('Is password valid for stored hash:', isValid);
}

verifyStoredHash();