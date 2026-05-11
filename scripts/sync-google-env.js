const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const googleServicesPath = path.join(root, 'google-services.json');
const clientSecretPath = path.join(root, 'client_secret.json');
const envPath = path.join(root, '.env');

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${path.basename(filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const googleServices = readJson(googleServicesPath);
const clientSecret = readJson(clientSecretPath);

const projectInfo = googleServices.project_info || {};
const appClient = (googleServices.client || []).find((client) => {
  const androidInfo = client.client_info && client.client_info.android_client_info;
  return androidInfo && androidInfo.package_name === 'com.synclife.app';
}) || (googleServices.client || [])[0] || {};

const clientInfo = appClient.client_info || {};
const androidOauth = (appClient.oauth_client || []).find((client) => client.client_type === 1) || {};
const webOauthFromServices = (appClient.oauth_client || []).find((client) => client.client_type === 3) || {};
const webOauth = clientSecret.web || clientSecret.installed || webOauthFromServices;

const values = {
  EXPO_PUBLIC_FIREBASE_API_KEY: (((appClient.api_key || [])[0] || {}).current_key) || '',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: projectInfo.project_id ? `${projectInfo.project_id}.firebaseapp.com` : '',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: projectInfo.project_id || '',
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: projectInfo.storage_bucket || '',
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: projectInfo.project_number || '',
  EXPO_PUBLIC_FIREBASE_APP_ID: clientInfo.mobilesdk_app_id || '',
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: webOauth.client_id || '',
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: androidOauth.client_id || ''
};

fs.writeFileSync(envPath, `${Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n')}\n`, 'utf8');

const missing = Object.entries(values).filter(([, value]) => !value).map(([key]) => key);
console.log(`Wrote .env with ${Object.keys(values).length - missing.length}/${Object.keys(values).length} populated values.`);
if (missing.length) {
  console.log(`Missing: ${missing.join(', ')}`);
  process.exitCode = 1;
}
