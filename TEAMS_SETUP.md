# Microsoft Teams Integration Setup Guide

This guide explains how to embed your SmartSpace app in Microsoft Teams.

## Overview

Your app has been configured to work both as a standalone web application and as a Teams tab application. The integration includes:

- **Teams SDK Integration** - Detects Teams environment and provides Teams context
- **Adaptive Authentication** - Uses Teams SSO when available, falls back to popup auth
- **Theme Awareness** - Automatically adapts to Teams themes (default, dark, high contrast)
- **Context-Aware UI** - Shows Teams-specific information when running in Teams

## Prerequisites

1. **Azure AD App Registration** - Your app must be registered in Azure AD
2. **Microsoft Teams Admin Access** - To upload and manage Teams apps
3. **Public HTTPS Endpoint** - Teams requires secure endpoints

## Step 1: Azure AD Configuration

### 1.1 Update App Registration

In your Azure AD app registration, add the following:

**Redirect URIs:**
```
https://your-domain.com
https://your-domain.com?inTeams=true
```

**API Permissions:**
- Microsoft Graph: `User.Read`
- Microsoft Graph: `User.ReadBasic.All`
- Your custom API scopes

**Authentication Platform:**
- Single-page application (SPA)
- Allow public client flows: Yes

### 1.2 Teams-Specific Settings

Add these application ID URIs:
```
api://your-domain.com/your-azure-app-client-id
```

## Step 2: Environment Configuration

Update your environment variables:

```bash
# .env.production
VITE_CLIENT_ID=your-azure-app-client-id
VITE_CLIENT_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
VITE_CLIENT_SCOPES=api://your-azure-app-client-id/.default
VITE_CHAT_API_URI=https://your-api-domain.com
```

## Step 3: Teams App Manifest

### 3.1 Update Manifest Values

Edit `public/manifest.json` and replace these placeholder values:

```json
{
  "id": "your-app-id-guid-here",  // Generate a new GUID
  "developer": {
    "websiteUrl": "https://your-domain.com",
    "privacyUrl": "https://your-domain.com/privacy",
    "termsOfUseUrl": "https://your-domain.com/terms"
  },
  "staticTabs": [
    {
      "contentUrl": "https://your-domain.com?inTeams=true",
      "websiteUrl": "https://your-domain.com"
    }
  ],
  "validDomains": [
    "your-domain.com",
    "login.microsoftonline.com"
  ],
  "webApplicationInfo": {
    "id": "your-azure-app-client-id",
    "resource": "api://your-domain.com/your-azure-app-client-id"
  }
}
```

### 3.2 Create App Icons

Add these files to the `public/` directory:
- `icon-color.png` (192x192px) - Full color icon
- `icon-outline.png` (32x32px) - Monochrome outline icon

## Step 4: Building and Deployment

### 4.1 Build for Production

```bash
npm run build
```

### 4.2 Deploy to Your Domain

Deploy the `dist/` folder to your web server. Ensure:
- HTTPS is enabled
- All files are accessible
- The manifest.json is at `/manifest.json`

### 4.3 Test the Deployment

Visit `https://your-domain.com?inTeams=true` to test Teams mode.

## Step 5: Teams App Package

### 5.1 Create App Package

Create a ZIP file containing:
```
teams-app.zip
├── manifest.json
├── icon-color.png
└── icon-outline.png
```

### 5.2 Upload to Teams

**Option 1: Teams Admin Center (Organization-wide)**
1. Go to [Teams Admin Center](https://admin.teams.microsoft.com)
2. Navigate to Teams apps > Manage apps
3. Click "Upload new app"
4. Upload your ZIP file

**Option 2: Teams Client (Personal/Team)**
1. Open Microsoft Teams
2. Go to Apps > Manage your apps
3. Click "Upload an app"
4. Select "Upload an app to your org's app catalog" or "Upload a custom app"
5. Upload your ZIP file

## Step 6: Testing

### 6.1 Add to Teams

1. Search for your app in the Teams app store
2. Click "Add" to install it
3. The app will appear as a tab

### 6.2 Verify Functionality

Check that:
- [ ] App loads in Teams
- [ ] Authentication works (Teams SSO or popup)
- [ ] Theme adapts to Teams theme
- [ ] Teams context is detected
- [ ] All features work as expected

## Development Tips

### Testing Locally

For local development, you can test Teams integration by:

1. **Using ngrok** for HTTPS tunneling:
```bash
ngrok http 4200
```

2. **Update manifest** with ngrok URL:
```json
"contentUrl": "https://your-ngrok-url.ngrok.io?inTeams=true"
```

3. **Upload test manifest** to Teams

### Debugging

Use the browser developer tools in Teams:
- Right-click in the app → Inspect
- Check console for Teams SDK logs
- Verify Teams context is loaded

### Teams Context Detection

The app automatically detects Teams environment by:
- URL parameter: `?inTeams=true`
- Parent window detection: `window.parent !== window`

## Troubleshooting

### Common Issues

**Authentication Fails:**
- Check Azure AD redirect URIs
- Verify domain in `validDomains`
- Ensure HTTPS is working

**App Doesn't Load:**
- Check manifest syntax (use JSON validator)
- Verify all URLs are accessible
- Check Teams admin policies

**Theme Not Applied:**
- Check if Teams SDK is initialized
- Verify CSS imports
- Test theme switching in Teams

**Context Not Available:**
- Ensure Teams SDK is loaded
- Check for JavaScript errors
- Verify Teams app permissions

### Support

For Teams-specific issues:
- [Teams Platform Documentation](https://docs.microsoft.com/en-us/microsoftteams/platform/)
- [Teams App Validation Tool](https://dev.teams.microsoft.com/validation)
- [Teams Developer Community](https://techcommunity.microsoft.com/t5/microsoft-teams-platform/ct-p/MicrosoftTeamsPlaftorm)

## Security Considerations

1. **Validate Teams Context** - Always validate Teams-provided information
2. **Secure API Calls** - Use proper authentication for API calls
3. **Content Security Policy** - Configure CSP headers for Teams
4. **Data Privacy** - Follow data handling requirements for Teams apps

## Next Steps

After successful deployment:
1. Monitor app usage and performance
2. Gather user feedback
3. Consider additional Teams features:
   - Message extensions
   - Bots
   - Meeting apps
   - Personal apps 