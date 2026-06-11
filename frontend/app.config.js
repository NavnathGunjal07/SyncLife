const fs = require('fs');

module.exports = ({ config }) => {
  if (fs.existsSync('./google-services.json')) {
    if (!config.android) config.android = {};
    config.android.googleServicesFile = './google-services.json';
  }
  return config;
};
