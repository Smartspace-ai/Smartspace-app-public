# SmartSpace Chat UI

> **Template Repository:**
> 
> This repository is intended as a starting point for clients who want to build their own customized chat UI for Smartspace. The recommended workflow is to **fork this repository**, then white label and customize it to fit your organization's branding and requirements. Once customized, you can deploy your version and connect it to your own Smartspace backend.

A modern, customizable chat interface built with React 18.3, utilizing [shadcn UI](https://ui.shadcn.com/) components and [Tailwind CSS](https://tailwindcss.com/) for styling. This project is designed to integrate seamlessly with [smartspace.ai](https://smartspace.ai).

---

## 🚀 Features

- **React 18.3:** Leverages the latest features of React for building robust and efficient components.
- **shadcn UI Components:** Accessible and customizable UI components.
- **Tailwind CSS:** Utility-first CSS for rapid UI development.
- **Theming Support:** Easily customize the primary color and other theme aspects.
- **Logo Customization:** Simple process to update the application logo.

---

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/en/download/) (version 20 or higher)
- [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com/getting-started/install)

### Installation

1. **Fork [this repository](https://github.com/Smartspace-ai/Smartspace-app-public) to your own GitHub account.**
2. **Clone your fork:**

   ```bash
   git clone https://github.com/<your-org-or-username>/Smartspace-app-public.git
   ```

3. **Navigate to the project directory:**

   ```bash
   cd Smartspace-app-public
   ```

4. **Install the dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

### Configuration

Create a file named `.env` in your project root directory with the following environment variables:

```env
VITE_CLIENT_ID=         # Your client ID
VITE_CLIENT_AUTHORITY=  # Your authentication authority
VITE_CLIENT_SCOPES=     # Required scopes (comma-separated)
VITE_CHAT_API_URI=      # Chat API endpoint
```

> **Note:** These variables are required for authentication and API access. Fill them in with values appropriate for your environment.

---

## 📜 Available Scripts

In the project directory, you can run the following scripts:

- **Start the development server:**

  ```bash
  npm run start
  # or
  yarn start
  ```

- **Build the application for production:**

  ```bash
  npm run build
  # or
  yarn build
  ```

- **Run tests:**

  ```bash
  npm run test
  # or
  yarn test
  ```

---

## 🚀 Automatic Deployment to Azure Static Web Apps

You can set up automatic deployment of your customized project to an Azure Storage Account configured as a static website using GitHub Actions. This requires the following configuration:

### 1. Create a GitHub Environment

- Go to your forked repository on GitHub.
- Navigate to **Settings** > **Environments**.
- Click **New environment** and name it `smartspace`.

### 2. Add the Azure Storage Connection String Secret

- In your new `smartspace` environment.
- Click **Add environment secret**.
- Name the secret `AZURE_STORAGE_CONNECTION_STRING`.
- Paste your Azure Storage Account connection string as the value.

### 3. How It Works

When you push to the `main` branch, GitHub Actions will use the `AZURE_STORAGE_CONNECTION_STRING` secret to deploy the built application to your Azure Storage Account configured for static website hosting.

> **Note:** Ensure your Azure Storage Account is set up for static website hosting. For more information, see the [Azure documentation](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website).

---

## 🎨 Theming

The application uses CSS variables for theming, allowing easy customization of colors and styles. The primary color is defined in the `theme.scss` file, located in the `styles` directory.

### Changing the Primary Color

To update the primary color of the application:

1. **Open the `theme.scss` file in the `styles` directory.**
2. **Locate the `$primary-hex` variable:**

   ```scss
   // Primary input color
   $primary-hex: #FF5B37;
   ```

3. **Replace the `#6443f4` value with your desired hex color code.**
4. **Save the file.** The application's primary color will now reflect the new value.

> **Note:** The `theme.scss` file uses HSL (Hue, Saturation, Lightness) values derived from the `$primary-hex` to define various color variables. Ensure that the new primary color provides sufficient contrast and accessibility.

For more detailed information on theming with shadcn UI and Tailwind CSS, refer to the [shadcn UI Theming Documentation](https://ui.shadcn.com/docs/theming).

---

## 🖼️ Updating the Logo

The logo component is located at `components/Logo.tsx`. To update the logo:

1. **Open the `Logo.tsx` file in the `components` directory.**
2. **Modify the `Logo` component to return your desired logo.** For example, to use an image file:

   ```tsx
   import React from 'react';
   import logo from '../assets/logo.png'; // Adjust the path as necessary

   interface LogoProps {
     className?: string;
   }

   export const Logo: React.FC<LogoProps> = ({ className }) => {
     return <img src={logo} alt="SmartSpace Logo" className={className} />;
   };
   ```

3. **Replace `'../assets/logo.png'` with the path to your logo file as needed.**
4. **Save the file.** The application will now display the updated logo.

---

## 🤝 Contributing

We welcome contributions to the SmartSpace Chat UI template! To contribute improvements to the template itself:

1. **Fork the repository.**
2. **Create a new branch for your feature or fix:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes and commit them:**

   ```bash
   git commit -m "Add your commit message here"
   ```

4. **Push to your fork:**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a pull request with a detailed description of your changes.**

> **Tip:** Please follow any existing code style and contribution guidelines. If you have questions, open an issue or ask in your pull request.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

---