/**
 * Application Theme Configuration
 *
 * This file contains the basic customizable aspects of the application theme.
 * Edit this file to customize your branding, logo, and basic theme settings.
 *
 * For more advanced color customization, use the shadcn UI theme generator:
 * https://ui.shadcn.com/themes
 *
 * After generating your theme, copy the CSS variables to app/globals.css
 */

// Simple theme configuration interface
export interface ThemeConfig {
  // Brand identity
  brand: {
    name: string;
    domain: string;
    logo: {
      path: string;
      darkPath?: string;
      width: number;
      height: number;
    };
    favicon: string;
  };

  // Basic color scheme (these should match your shadcn theme)
  colors: {
    primary: string;
    secondary?: string;
  };

  // Feature flags
  features: {
    darkMode: boolean;
    rtlSupport: boolean;
    animations: boolean;
  };
}

// Default SmartSpace theme configuration
const themeConfig: ThemeConfig = {
  // Brand identity
  brand: {
    name: 'SmartSpace',
    domain: 'smartspace.ai',
    logo: {
      path: '/images/logo.svg', // Path to your logo
      darkPath: '/images/logo-dark.svg', // Optional: different logo for dark mode
      width: 150,
      height: 40,
    },
    favicon: '/favicon.ico',
  },

  // Basic color scheme - should match your shadcn theme
  colors: {
    primary: '#6044f3', // SmartSpace purple/indigo
    secondary: '#6366F1', // Optional secondary color
  },

  // Feature flags
  features: {
    darkMode: true, // Enable/disable dark mode
    rtlSupport: false, // Enable/disable RTL support
    animations: true, // Enable/disable animations
  },
};

export default themeConfig;
