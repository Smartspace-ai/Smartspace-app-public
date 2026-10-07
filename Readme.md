<!--
  Editing this file? Two things are not obvious:
  1. It is fetched at runtime by the SmartSpace admin interface and rendered on
     its API documentation page, so a change here reaches every installation
     once it lands on a release - there is no separate publish step.
  2. That page replaces the whole fenced `env` block below with values from the
     reader's own installation. Keep exactly one such block, and keep anything
     you want the reader to see OUTSIDE it.
-->

# SmartSpace Chat UI

> **Template repository.** This is a starting point for organisations who want their own branded chat interface for SmartSpace. Take a copy, brand it, deploy it to an address you control, and point it at your own SmartSpace installation. It talks to the same backend as the interface you already have — it is an additional way in, not a replacement.

A chat interface built with React 18.3, [shadcn UI](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/), designed to integrate with [smartspace.ai](https://smartspace.ai).

---

## What you need

- **Node.js 20+** and **pnpm 9**. Easiest install: enable Corepack (bundled with Node) and let it resolve the version pinned in `package.json` — `corepack enable`.
- **An Azure subscription** you can create a storage account in.
- **A Microsoft Entra administrator**, for one consent step.
- **Your SmartSpace version**, from the `/updates` page of your SmartSpace admin interface. It shows the version you are currently on.

Deploying inside Microsoft Teams as well? Read [teams/Readme.md](https://github.com/Smartspace-ai/Smartspace-app-public/blob/main/teams/Readme.md) **before** creating your app registration — Teams needs settings on it that are awkward to add afterwards.

---

## 1. Take your own copy

GitHub cannot create a private fork of a public repository, so clone and push rather than using the Fork button:

```bash
gh repo create <your-org>/<name>-smartspace-ui --private
git clone https://github.com/Smartspace-ai/Smartspace-app-public.git <name>
cd <name>
git remote rename origin upstream
git remote add origin https://github.com/<your-org>/<name>-smartspace-ui.git
git push origin main --tags
```

Keeping the original as `upstream` is what lets you pull in later versions.

### Pin to the version that matches your installation

**Always build from the tag matching the SmartSpace version your installation is running.**

```bash
# Replace v1.14.9 with your version, from the admin /updates page
git checkout -B main v1.14.9
git push origin main --force
```

To see the available versions: `git ls-remote --tags https://github.com/Smartspace-ai/Smartspace-app-public.git`

> **Do not build from `main`** unless you are on the latest version of SmartSpace. The interface validates every response it receives from the backend, and `main` tracks the most recent release — it can expect response shapes your installation does not send yet, which surfaces as validation errors and blank panels even though the backend is answering correctly.

### Optional: remove the internal workflows

Three GitHub Actions workflows exist only for SmartSpace-internal automation. They are gated on the upstream repository and will not run in your copy, but you can delete them for cleanliness. Each carries a `# Smartspace-internal: safe to delete in forks.` comment at the top:

```bash
rm .github/workflows/internal-bump-sdk.yml
rm .github/workflows/internal-notify-app.yml
rm .github/workflows/update-release-next.yml
```

### Updating later

When SmartSpace updates your installation, merge the **matching version tag** — not `upstream/main`:

```bash
git fetch upstream --tags
git merge v1.14.9
git push origin main
```

If nothing has changed between your tag and the one you are merging, git will say "Already up to date" — that is your signal there is nothing to pick up.

---

## 2. Create an app registration

Your interface signs users in against an app registration **in your own tenant**. Create a new one — do not reuse the SmartSpace application that your installation already has.

1. Microsoft Entra admin centre → **App registrations → New registration**.
   - **Name:** the brand your users will see. It appears on the consent prompt.
   - **Supported account types:** accounts in this organizational directory only.
   - **Redirect URI:** **Single-page application (SPA)**, set to the address you will deploy to, with a trailing slash.
2. Copy the **Application (client) ID** from the overview page. This is your `VITE_CLIENT_ID`.
3. **API permissions → Add a permission → APIs my organization uses →** search for **SmartSpace** → **Delegated permissions** → add `smartspaceapi.chat.access` and `smartspaceapi.config.access`.
4. **Grant admin consent** for your organisation. Without it, the first sign-in fails with `AADSTS65001`.

Deploying into Teams? [teams/Readme.md](https://github.com/Smartspace-ai/Smartspace-app-public/blob/main/teams/Readme.md) adds four more things to this registration. Doing them now is easier than retrofitting.

---

## 3. Configure

Create a `.env` in the project root.

| Variable                  | What it is                                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_CLIENT_ID`          | **The client ID of the app registration you created in step 2** — your own, not SmartSpace's.                                                                                                           |
| `VITE_CLIENT_AUTHORITY`   | `https://login.microsoftonline.com/{your-tenant-id}`                                                                                                                                                    |
| `VITE_CLIENT_SCOPES`      | `api://2b53f19a-35f6-4c6e-a1ef-2a9b9fd87fe9/smartspaceapi.chat.access` — the **SmartSpace** application's scope. This is the audience your chat API accepts, and it is the same for every installation. |
| `VITE_CHAT_API_URI`       | Your chat API address. Azure portal → the resource group created by your SmartSpace installation → the container app whose name contains `api-chat` → its application URL.                              |
| `VITE_TENANT_ID`          | Your tenant GUID.                                                                                                                                                                                       |
| `VITE_TEAMS_USE_MSAL`     | Teams only. See [teams/Readme.md](https://github.com/Smartspace-ai/Smartspace-app-public/blob/main/teams/Readme.md).                                                                                    |
| `VITE_TEAMS_SSO_RESOURCE` | Teams only, and only on the NAA path. See [teams/Readme.md](https://github.com/Smartspace-ai/Smartspace-app-public/blob/main/teams/Readme.md).                                                          |

The two IDs are easy to mix up, and getting them the wrong way round is the most common setup failure: **`VITE_CLIENT_ID` is yours, `VITE_CLIENT_SCOPES` names SmartSpace's.**

```env
VITE_CLIENT_ID=
VITE_CLIENT_AUTHORITY=https://login.microsoftonline.com/{your-tenant-id}
VITE_CLIENT_SCOPES=api://2b53f19a-35f6-4c6e-a1ef-2a9b9fd87fe9/smartspaceapi.chat.access
VITE_CHAT_API_URI=
VITE_TENANT_ID=
```

See [.env.example](https://github.com/Smartspace-ai/Smartspace-app-public/blob/main/.env.example) for the full list including the Teams variables.

### SDK dependency

The project depends on `@smartspace/api-client`, published to [npmjs.com](https://www.npmjs.com/package/@smartspace/api-client). It installs automatically — no package-feed authentication needed.

---

## 4. Run it locally

```bash
pnpm install
pnpm run start
```

Sign in with an account from your tenant. If the workspace list renders with real data, your configuration is correct.

---

## 5. Deploy

The app is a static site: files in an Azure Storage account with no server to run or patch.

### Create the storage account

1. Create a **Storage account** in your subscription. The name must be lowercase letters and numbers.
2. **Data management → Static website → Enabled.** Index document `index.html`, error document path `index.html`. This creates the `$web` container — without it the deploy fails with `ContainerNotFound`.
3. Note the **primary endpoint**. That is the address your users visit, and the one your app registration's redirect URI must match.

### Configure the GitHub environment

Create an environment named **`production`** (**Settings → Environments**). `deploy-production.yml` reads it on every push to `main`.

Add the six `VITE_*` values from step 3 as environment **variables**. They are compiled into the files served to the browser, which is normal for a web application — none of them are secrets.

Then pick how the deploy authenticates to storage:

- **Access key:** add a secret `AZURE_STORAGE_CONNECTION_STRING`.
- **Workload identity**, if you would rather not store a key: add variables `AZURE_STORAGE_ACCOUNT`, `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` and `AZURE_SUBSCRIPTION_ID`, and give that identity **Storage Blob Data Contributor** on the account. The deploy uses a federated token whenever `AZURE_STORAGE_ACCOUNT` is set, and the connection string when it is not.

### Run it

Pushing to `main` deploys. That is the only trigger — there is no "Run workflow" button for production. Once a run exists you can repeat it with **Re-run all jobs**, which is the quickest fix when a run failed because a variable was not saved yet rather than because of anything in the code. If you want on-demand runs, add `workflow_dispatch:` to `on:` in `.github/workflows/deploy-production.yml`.

### Expected console noise

A `404` when refreshing a deep link is normal — the path is not a stored file, so storage returns 404 and serves `index.html`, which loads and routes correctly. Errors from `chrome-extension://` sources come from the reader's own browser extensions.

---

## 6. Branding

| What               | Where                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Accent colour      | `src/_theme.scss` — `$primary-hex` at the top. The rest of the palette derives from it.                                               |
| Full colour scheme | The same file. The comment at the top links to theme generators whose output pastes in wholesale.                                     |
| Logo               | `src/assets/logo.tsx` — an inline SVG so it can be styled with `currentColor`. Keep the `className` prop so consumers stay unchanged. |
| Browser tab icon   | `public/favicon.ico`                                                                                                                  |
| Page title         | `index.html`                                                                                                                          |
| Teams icons        | `teams/icon-color.png` (192×192) and `teams/icon-outline.png` (32×32, transparent)                                                    |

The app also reads a brand name and logo at runtime from the CSS variables `--ss-brand-name` and `--ss-brand-logo-url`, if you would rather set them in your theme than edit components.

---

## 7. Microsoft Teams

To make this available as an app inside Teams, with users signed in automatically, see **[teams/Readme.md](https://github.com/Smartspace-ai/Smartspace-app-public/blob/main/teams/Readme.md)**. It covers the additional app registration settings, the package, and uploading it to your tenant.

---

## License

MIT. See [LICENSE](https://github.com/Smartspace-ai/Smartspace-app-public/blob/main/LICENSE).
