module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  transform: {},
  // fuerza el runner correcto (opcional porque ya es el default)
  testRunner: "jest-circus/runner",
};
