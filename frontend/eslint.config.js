// https://docs.expo.dev/guide/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([expoConfig, prettierRecommended, { ignores: ['dist/*', 'scripts/*'] }]);
