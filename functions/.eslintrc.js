module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    quotes: ["error", "double"],
    "max-len": ["error", { "code": 120 }],
    "require-jsdoc": "off",
    "valid-jsdoc": "off",
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
}; 