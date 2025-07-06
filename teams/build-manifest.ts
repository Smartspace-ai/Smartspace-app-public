// To use this script, run: npm install archiver dotenv
// If using TypeScript, you may also want: npm install --save-dev @types/archiver
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const archiver = require('archiver');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const teamsDir = __dirname;
const configPath = path.join(teamsDir, 'config.json');
const manifestPath = path.join(teamsDir, 'manifest.json');
const zipPath = path.join(teamsDir, 'smartspace.zip');

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const baseUrl = config.baseUrl;
const appName = config.appName;
const appId = config.appId;
const version = config.version;

const clientId = process.env.VITE_CLIENT_ID;
if (!clientId) {
  throw new Error('VITE_CLIENT_ID is not set in .env');
}

const manifest = {
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
  "manifestVersion": "1.16",
  "version": version,
  "id": appId,
  "packageName": "com.smartspace.app",
  "developer": {
    "name": appName,
    "websiteUrl": baseUrl,
    "privacyUrl": baseUrl + "/privacy",
    "termsOfUseUrl": baseUrl + "/terms"
  },
  "icons": {
    "color": "icon-color.png",
    "outline": "icon-outline.png"
  },
  "name": {
    "short": appName,
    "full": appName
  },
  "description": {
    "short": appName + " application for Teams",
    "full": "A comprehensive " + appName + " application that can be embedded in Microsoft Teams"
  },
  "accentColor": "#FFFFFF",
  "staticTabs": [
    {
      "entityId": "smartspace-tab",
      "name": appName,
      "contentUrl": baseUrl + "?inTeams=true",
      "websiteUrl": baseUrl,
      "scopes": ["personal", "team"]
    }
  ],
  "permissions": [
    "identity",
    "messageTeamMembers"
  ],
  "validDomains": [
    baseUrl.replace(/^https?:\/\//, ''),
    "login.microsoftonline.com"
  ],
  "webApplicationInfo": {
    "id": clientId,
    "resource": "api://" + baseUrl.replace(/^https?:\/\//, '') + "/" + clientId
  }
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✅ manifest.json generated from config.json and .env');

const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function () {
  console.log(`✅ smartspace.zip created (${archive.pointer()} total bytes)`);
});

archive.on('error', function (err: Error) {
  throw err;
});

archive.pipe(output);
archive.file(manifestPath, { name: 'manifest.json' });
archive.file(path.join(teamsDir, 'icon-color.png'), { name: 'icon-color.png' });
archive.file(path.join(teamsDir, 'icon-outline.png'), { name: 'icon-outline.png' });
archive.finalize(); 