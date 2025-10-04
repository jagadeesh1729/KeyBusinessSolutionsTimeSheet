// eslint.config.js
const eslintPluginTs = require("@typescript-eslint/eslint-plugin");
const eslint = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = [
  {
    ignores: ["dist/**"],
  },
  {
    ...eslint.configs.recommended,
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": eslintPluginTs,
    },
    rules: { // Your custom rules go here
        ...eslintPluginTs.configs.recommended.rules,
        semi: ["error", "always"],
      },
  },
  eslintConfigPrettier,
];
