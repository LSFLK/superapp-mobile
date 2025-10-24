import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/dist/"],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
};

export default config;
