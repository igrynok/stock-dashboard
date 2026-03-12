import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefreshPlugin from "eslint-plugin-react-refresh";

export default [
  // Base JS recommended rules
  js.configs.recommended,
  {
    // Target your TypeScript and React files
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      // Basic browser globals since you are building a web app
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-refresh": reactRefreshPlugin,
    },
    rules: {
      // Pull in recommended rules from your plugins
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      
      // Modern React doesn't require importing React in every file
      "react/react-in-jsx-scope": "off", 
      
      // Vite Hot Module Replacement rule
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      // Added WebSocket and clearTimeout here
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        WebSocket: "readonly",
      },
    },
    // ... (keep plugins and rules the same)
    settings: {
      react: {
        version: "18.2", // Hardcode the version to silence the 'detect' warning
      },
    },
  },
];