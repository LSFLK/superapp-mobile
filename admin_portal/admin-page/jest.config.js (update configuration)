const fs = require('fs');

const jestConfigContent = `
module.exports = {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/',
  ],
  testEnvironment: 'jsdom',
};
`;

fs.writeFileSync('admin_portal/admin-page/jest.config.js', jestConfigContent.trim());

const babelConfigContent = `
{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}
`;

fs.writeFileSync('admin_portal/admin-page/babel.config.js', babelConfigContent.trim());

const microAppManagementTestContent = `
describe('MicroAppManagement', () => {
  test('example test', () => {
    expect(true).toBe(true);
  });
});
`;

fs.writeFileSync('admin_portal/src/components/__tests__/MicroAppManagement.test.js', microAppManagementTestContent.trim());