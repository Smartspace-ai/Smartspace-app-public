# Microsoft Teams integration

This guide makes your deployed SmartSpace interface available as an app inside Microsoft Teams, with users signed in automatically.

Work through [the main setup guide](../Readme.md) first — this one assumes you already have the interface deployed at an address you control, and an app registration in your tenant.

Throughout, `{host}` means the address your site is served from **without** a trailing slash (`https://smartspace.contoso.com`), and `{host-without-scheme}` is the same thing with `https://` removed (`smartspace.contoso.com`).

## What you need

- The interface deployed and working in a browser. Get that right first — it separates configuration problems from Teams packaging problems, which are much harder to untangle together.
- **A Microsoft Entra administrator**, to grant consent.
- **A Microsoft Teams administrator**, to upload the app to your tenant's catalogue.
- **Node.js 20+**, if you build the package locally rather than in GitHub Actions.

---

## 1. Add the Teams settings to your app registration

Four additions to the registration you created in the main guide. All four matter: miss one and sign-in fails inside Teams while continuing to work in a browser.

### Redirect addresses

**Authentication →** under the single-page application platform, you should have these five:

```
{host}/
{host}/teams-auth-end.html
{host}/auth-redirect.html
brk-multihub://{host-without-scheme}/
brk-5e3ce6c0-2b1f-4285-8d4b-75ee78787346://{host-without-scheme}/
```

The `brk-` pair are the addresses Teams uses to hand a sign-in back to your app. If the portal rejects the scheme, add them to `spa.redirectUris` in the **Manifest** instead — the same setting, behind a stricter form.

### Application ID URI

**Expose an API →** set the Application ID URI to exactly:

```
api://{host-without-scheme}/{your-client-id}
```

Teams only issues a token when the domain in this URI matches the domain the tab is served from, so the default `api://{client-id}` will not work.

### The `access_as_user` scope

On the same page, add a scope named `access_as_user`:

- **Who can consent:** admins and users
- **Admin consent display name:** Access <Your Brand> as the signed-in user
- **Admin consent description:** Allows Microsoft Teams and approved clients to access <Your Brand> on behalf of the signed-in user.
- **User consent display name:** Access <Your Brand> as you
- **User consent description:** Allow this app to access <Your Brand> on your behalf.
- **State:** Enabled

One scope is enough. It exists so Teams can exchange its own sign-in for one that works with your app; nothing else uses it.

### Authorised client applications

Still on **Expose an API**, under **Authorized client applications**, pre-authorise both Teams clients against `access_as_user`. These are Microsoft's own identifiers and are the same for every organisation:

| Client                   | Application ID                         |
| ------------------------ | -------------------------------------- |
| Teams desktop and mobile | `1fec8e78-bce4-4aaf-ab1b-5451cc387264` |
| Teams web                | `5e3ce6c0-2b1f-4285-8d4b-75ee78787346` |

This is what lets Teams sign users in without a consent prompt. Without it, users are asked to consent before they can use the app.

---

## 2. Choose a sign-in path

Teams has two. The setting is `VITE_TEAMS_USE_MSAL`, and it is **compiled into the site when it is built** — one deployment has one answer for everyone who uses it. It is not per user and not per Teams app.

- **`false`** uses the faster path, which resolves your app registration in the signed-in user's _own_ tenant. It only works for people who are members of yours, and it is the one that gets users straight in with no prompt.
- **`true`** signs in against the authority you configured. Members and guests both work; expect a sign-in step the first time.

This matters if people from another organisation will use your SmartSpace. A Teams app can only be installed from the catalogue of the tenant it was uploaded to, so that organisation uploads its own Teams package — pointing at the same website of yours. Two Teams apps, one website, one setting between them. Those users are guests in your tenant, and the fast path fails for them with `AADSTS700016`, reporting that the application cannot be found: it is looking in their organisation, where your registration does not exist.

So `false` only when every user is a member of your tenant, and `true` the moment anyone outside it is in scope. Leaving it unset is a third state, where the choice falls to a flag stored in each person's browser — set it explicitly either way.

`VITE_TEAMS_SSO_RESOURCE` is the Application ID URI from step 1, and is only needed on the `false` path.

---

## 3. Configure the package

Open `teams/config.json`:

```json
{
  "appId": "a-brand-new-guid",
  "baseUrl": "{host}",
  "appName": "Your Brand",
  "version": "1.0.0"
}
```

**Every value in this file ships as a placeholder.** The ones in the repository point at a SmartSpace deployment and are not valid for yours — all four need replacing before you build.

**Generate a fresh GUID for `appId`.** It identifies your app in your Teams catalogue and must not match anything already uploaded there, so it has to be one you generate rather than the shipped example. It is unrelated to your client ID — a separate identifier that exists only for Teams.

### Icons

Replace `teams/icon-color.png` (192×192, full colour) and `teams/icon-outline.png` (32×32, transparent outline) with your own.

---

## 4. Build the package

**In GitHub Actions**, run the **Build Teams package** workflow, pick the environment and a version, and download the package from the run. It reads `VITE_CLIENT_ID`, `TEAMS_APP_ID`, `TEAMS_BASE_URL` and `TEAMS_APP_NAME` from the environment you select, so add those `TEAMS_*` variables alongside your `VITE_*` ones.

> If those `TEAMS_*` variables are not set, the build falls back to `teams/config.json` without warning — which is how a package ends up pointing at the wrong address with nothing in the log to show it.

**Or locally**, with `VITE_CLIENT_ID` in a root `.env`:

```bash
pnpm install
pnpm run build:teams
```

Either way you get `teams/manifest.json` and `teams/smartspace.zip`.

### Check the manifest before uploading

Open `teams/manifest.json` and confirm `webApplicationInfo.resource` matches the Application ID URI from step 1 character for character:

```
api://{host-without-scheme}/{your-client-id}
```

The script derives it from `baseUrl` and the client ID, so it is right automatically when the config is. If it does not match, one of those two is wrong, and Teams will refuse to issue a token.

---

## 5. Upload and roll out

1. [Teams admin centre](https://admin.teams.microsoft.com) → **Teams apps → Manage apps → Upload new app** → upload `teams/smartspace.zip`.
2. Set availability for the users or groups who should see it.
3. **Optional but worth doing:** **Teams apps → Setup policies** lets you add the app to a policy so it is installed — and, if you like, pinned to the sidebar — for everyone assigned that policy. Otherwise each person has to find and add it themselves.

Open Teams, find the app and add it. On the `false` path you should land straight in. On `true`, expect one sign-in.

When you change anything about the app, increment the version in `teams/config.json` or the workflow input and re-upload. Teams only applies an update when the version increases.

---

## Troubleshooting

| What you see                                                                            | What it means                                                                                                                                              |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AADSTS65001`, consent required                                                         | Admin consent was not granted on the SmartSpace permissions. Main guide, step 2.                                                                           |
| `AADSTS700016`, application not found in directory _&lt;a tenant that is not yours&gt;_ | A guest or external user on the fast sign-in path — the broker is looking in their organisation. Set `VITE_TEAMS_USE_MSAL` to `true` and redeploy.         |
| Sign-in opens a popup instead of being silent                                           | The Teams clients are not pre-authorised on `access_as_user`, or the Application ID URI is not host-bound. Step 1.                                         |
| Upload rejected: "already an app in the catalog with the same app ID"                   | The `appId` in `teams/config.json` has been uploaded to your tenant before. Generate a fresh GUID. Step 3.                                                 |
| On mobile: a popup error, then "interaction in progress" on retry                       | Popup sign-in is fragile on mobile. Close Teams fully and retry. If it persists for a guest, have them sign in to the site once in a mobile browser first. |
| The app loads but shows nothing                                                         | Usually not a Teams problem. Check the site works in a browser, and that your copy is built from the tag matching your SmartSpace version.                 |

Still stuck? Open the app in a browser first to establish whether the problem is Teams-specific, and check the browser console for the error behind the symptom.
