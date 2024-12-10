const fs = require('fs-extra');
const path = require('path');

const source = path.join(__dirname, '..', 'build');
const destination = path.join(__dirname, '..', '..', 'server_code', 'build');

// Ensure the source exists
if (!fs.existsSync(source)) {
  console.error('Build folder does not exist. Run npm run build first.');
  process.exit(1);
}

// Remove old build directory if it exists
if (fs.existsSync(destination)) {
  console.log('Removing old build directory...');
  fs.removeSync(destination);
}

// Copy new build directory
console.log('Copying build directory to backend...');
fs.copySync(source, destination);
console.log('Build directory successfully copied to backend!');
