// Generates teams/manifest.json + teams/smartspace.zip.
// Values come from env vars (CI) and fall back to teams/config.json (local).
const fs = require('fs');
const path = require('path');

const archiver = require('archiver');

// Load a local .env if present, as a convenience for local builds. In CI the
// values are supplied directly via process.env, so dotenv is optional here.
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
  // dotenv not installed / no .env file — fall back to process.env.
}

const teamsDir = __dirname;
const configPath = path.join(teamsDir, 'config.json');
const manifestPath = path.join(teamsDir, 'manifest.json');
const zipPath = path.join(teamsDir, 'smartspace.zip');

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Env overrides (CI) take precedence; config.json is the local-dev fallback.
const appId = process.env.TEAMS_APP_ID || config.appId;
const appName = process.env.TEAMS_APP_NAME || config.appName;
const version = process.env.TEAMS_VERSION || config.version;
// Normalise the base URL once: strip trailing slashes so every derived URL and
// validDomain is built cleanly (avoids '//privacy' and a trailing-slash domain).
const baseUrl = String(process.env.TEAMS_BASE_URL || config.baseUrl).replace(
  /\/+$/,
  ''
);
const host = baseUrl.replace(/^https?:\/\//, '');

const clientId = process.env.VITE_CLIENT_ID;
if (!clientId) {
  throw new Error('VITE_CLIENT_ID is not set (env var or .env)');
}

const manifest = {
  $schema:
    'https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json',
  manifestVersion: '1.16',
  version: version,
  id: appId,
  packageName: 'com.smartspace.app',
  developer: {
    name: appName,
    websiteUrl: baseUrl,
    privacyUrl: baseUrl + '/privacy',
    termsOfUseUrl: baseUrl + '/terms',
  },
  icons: {
    color: 'icon-color.png',
    outline: 'icon-outline.png',
  },
  name: {
    short: appName,
    full: appName,
  },
  description: {
    short: appName + ' application for Teams',
    full:
      'A comprehensive ' +
      appName +
      ' application that can be embedded in Microsoft Teams',
  },
  accentColor: '#FFFFFF',
  staticTabs: [
    {
      entityId: 'smartspace-tab',
      name: appName,
      contentUrl: baseUrl + '/?inTeams=true',
      websiteUrl: baseUrl,
      scopes: ['personal', 'team'],
    },
  ],
  permissions: ['identity', 'messageTeamMembers'],
  validDomains: [host, 'login.microsoftonline.com'],
  webApplicationInfo: {
    id: clientId,
    resource: 'api://' + host + '/' + clientId,
  },
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
archive.file(path.join(teamsDir, 'icon-outline.png'), {
  name: 'icon-outline.png',
});
archive.finalize();
