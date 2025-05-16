# SmartSpace Chat UI

A modern, customizable chat interface built with React 18.3, utilizing [shadcn UI](https://ui.shadcn.com/) components and [Tailwind CSS](https://tailwindcss.com/) for styling. This project is designed to integrate seamlessly with [smartspace.ai](https://smartspace.ai).

---

## 📦 Project Information

- **Package Name:** `@smartspace/source`
- **Version:** `1.0.0`
- **License:** [MIT](LICENSE)

---

## 🚀 Features

- **React 18.3:** Leverages the latest features of React for building robust and efficient components.
- **shadcn UI Components:** Utilizes a set of accessible and customizable UI components.
- **Tailwind CSS:** Provides utility-first CSS for rapid UI development.
- **Theming Support:** Easily customize the primary color and other theme aspects.
- **Logo Customization:** Simple process to update the application logo.

---

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/en/download/) (version 14 or higher)
- [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com/getting-started/install)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/smartspace-ai/chat-ui.git
   ```

2. **Navigate to the project directory:**

   ```bash
   cd chat-ui
   ```

3. **Install the dependencies:**

   ```bash
   npm install
   ```

   or

   ```bash
   yarn install
   ```

### Configuration

Create a file named `.env` in your project root and populate it with the values from your Smartspace Admin UI:

```env
VITE_CLIENT_ID=
VITE_CLIENT_AUTHORITY=
VITE_CLIENT_SCOPES=
VITE_CHAT_API_URI=
```

---

## 📜 Available Scripts

In the project directory, you can run the following scripts:

- **Start the development server:**

  ```bash
  npm run start
  ```

  or

  ```bash
  yarn start
  ```

- **Build the application for production:**

  ```bash
  npm run build
  ```

  or

  ```bash
  yarn build
  ```

- **Run tests:**

  ```bash
  npm run test
  ```

  or

  ```bash
  yarn test
  ```

- **Environment-Specific Commands:**

  - **Development:**

    - Start: `npm run start:dev` or `yarn start:dev`
    - Build: `npm run build:dev` or `yarn build:dev`
    - Test: `npm run test:dev` or `yarn test:dev`

  - **Local:**

    - Start: `npm run start:local` or `yarn start:local`
    - Build: `npm run build:local` or `yarn build:local`
    - Test: `npm run test:local` or `yarn test:local`

---

## 🎨 Theming

The application uses CSS variables for theming, allowing easy customization of colors and styles. The primary color is defined in the `theme.scss` file.

### Changing the Primary Color

To update the primary color of the application:

1. **Open the `theme.scss` file located in the styles directory.**

2. **Locate the `$primary-hex` variable:**

   ```scss
   // Primary input color
   $primary-hex: #6443f4;
   ```

3. **Replace the `#6443f4` value with your desired hex color code.**

4. **Save the file.** The application's primary color will now reflect the new value.

> **Note:** The `theme.scss` file uses HSL (Hue, Saturation, Lightness) values derived from the `$primary-hex` to define various color variables. Ensure that the new primary color provides sufficient contrast and accessibility.

For more detailed information on theming with shadcn UI and Tailwind CSS, refer to the [shadcn UI Theming Documentation](https://ui.shadcn.com/docs/theming).

---

## 🖼️ Updating the Logo

The logo component is located at `components/Logo.tsx`. To update the logo:

1. **Open the `Logo.tsx` file.**

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

3. **Replace `'../assets/logo.png'` with the path to your logo file.**

4. **Save the file.** The application will now display the updated logo.

---

## 🤝 Contributing

We welcome contributions to the SmartSpace Chat UI project! To contribute:

1. **Fork the repository.**

2. **Create a new branch:**

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

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

---

*For any issues or questions, please open an issue on the [GitHub repository](https://github.com/smartspace-ai/chat-ui/issues).*