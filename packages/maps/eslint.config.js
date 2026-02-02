const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [...compat.extends("react-app", "plugin:storybook/recommended")];
