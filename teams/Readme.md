# Microsoft Teams Integration Setup Guide

This guide walks you through integrating your SmartSpace application with Microsoft Teams as a custom app.

## 📋 Prerequisites

Before starting, ensure you have:

- **Azure AD Admin Access** - You'll need permissions to create app registrations
- **SmartSpace Backend** - A deployed SmartSpace backend instance
- **Teams Admin Access** - To upload custom apps to your Teams tenant
- **Node.js** - Version 20 or higher for building the Teams package

## 🔧 Step-by-Step Setup

### 1. Create Azure AD App Registration

1. **Go to [Azure Entra ID](https://entra.microsoft.com/)**
2. **Navigate to** `App registrations` → `New registration`
3. **Configure the registration:**
   - **Name:** Choose a descriptive name (e.g., "SmartSpace App")
   - **Supported account types:** `Accounts in this organizational directory only`
   - **Redirect URI:** Select `Single Page Application (SPA)` and enter your deployed SmartSpace URL
4. **Click** `Register`

### 2. Configure API Permissions

1. **In your new app registration, go to** `API permissions`
2. **Click** `Add a permission`
3. **Select** `APIs my organization uses`
4. **Search for and select** `SmartSpace`
5. **Choose** `smartspaceapi.chat.access` permission
6. **Click** `Add permissions`

### 3. Expose an API

1. **Go to** `Expose an API`
2. **Set the Application ID URI** to:
   ```
   api://{your-deployed-smartspace-url}/{your-app-client-id}
   ```
   - Replace `{your-deployed-smartspace-url}` with the url of your deployed custom SmartSpace web
   - Replace `{your-app-client-id}` with the Client ID from step 1

### 4. Configure Environment Variables

1. **In your project root, update the `.env` file:**
   ```env
   VITE_CLIENT_ID=your-app-client-id-from-step-1
   VITE_CLIENT_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
   VITE_CLIENT_SCOPES=api://smartspace-app-client-id/smartspaceapi.chat.access
   VITE_CHAT_API_URI=https://your-smartspace-chat-api-url
   ```

### 5. Configure Teams Settings

1. **Open** `teams/config.json`
2. **Update the configuration:**
   ```json
   {
     "appId": "generate-a-unique-guid-for-your-teams-app",
     "baseUrl": "https://your-deployed-smartspace-url",
     "appName": "Your Company SmartSpace",
     "version": "1.0.0"
   }
   ```

   > **Note:** The `appId` should be a unique GUID different from your Azure AD app's Client ID. You can generate one at [guidgenerator.com](https://guidgenerator.com).

### 6. Prepare App Icons

1. **Add your app icons to the `teams/` directory:**
   - `icon-color.png` - 192x192 pixels, full-color icon
   - `icon-outline.png` - 32x32 pixels, transparent outline icon

### 7. Build the Teams App Package

1. **Run the build command:**
   ```bash
   npm run build:teams
   ```

2. **This will generate:**
   - `teams/manifest.json` - The Teams app manifest
   - `teams/smartspace.zip` - The Teams app package ready for upload

### 8. Upload to Microsoft Teams

1. **Go to Microsoft Teams Admin Center** at [admin.teams.microsoft.com](https://admin.teams.microsoft.com)
2. **Navigate to** `Teams apps` → `Manage apps`
3. **Click** `Upload new app`
4. **Upload the** `teams/smartspace.zip` file
5. **Configure app permissions and availability** as needed for your organization

## 🔍 Verification

After installation, verify the integration:

1. **Open Microsoft Teams**
2. **Go to** `Apps` and search for your SmartSpace app
3. **Add the app** to a team or use it personally
4. **Verify** that authentication works seamlessly (users should not need to log in again)

## 🚨 Troubleshooting

### Common Issues

**Authentication Errors:**
- Verify the Application ID URI format in step 3
- Ensure the redirect URI matches your deployed URL exactly
- Check that admin consent has been granted for API permissions

**App Not Loading:**
- Confirm the `baseUrl` in `teams/config.json` is correct and accessible
- Verify your SmartSpace backend is running and accessible
- Check the Teams app manifest for any validation errors

**Build Failures:**
- Ensure `VITE_CLIENT_ID` is set in your `.env` file
- Verify Node.js version is 20 or higher
- Check that all required files are present in the `teams/` directory

### Getting Help

If you encounter issues:

1. **Check the browser console** for error messages when the app loads in Teams
2. **Verify your environment variables** are correctly set
3. **Test the app in a regular browser** first to isolate Teams-specific issues
4. **Contact your SmartSpace administrator** for backend configuration issues

## 🔗 Useful Links

- [Microsoft Teams Developer Documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/)
- [Azure AD App Registration Guide](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Teams App Manifest Schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)