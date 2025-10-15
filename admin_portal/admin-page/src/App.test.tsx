import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

type MockAuth = {
  state: { isAuthenticated: boolean; username?: string; displayName?: string };
  signIn: jest.Mock<any, any>;
  signOut: jest.Mock<any, any>;
  getAccessToken: jest.Mock<any, any>;
};

let mockAuth: MockAuth;
jest.mock("@asgardeo/auth-react", () => ({
  useAuthContext: () => mockAuth,
}));

jest.mock("./constants/api", () => {
  const real = jest.requireActual("./constants/api");
  return {
    ...real,
    getEndpoint: jest.fn((k: string) => {
      // In tests, prefer env overrides when set; else fall back to defaults
      const envMap: Record<string, string | undefined> = {
        MICROAPPS_LIST: process.env.REACT_APP_MICROAPPS_LIST_URL,
        MICROAPPS_UPLOAD: process.env.REACT_APP_MICROAPPS_UPLOAD_URL,
        USERS_BASE: process.env.REACT_APP_USERS_BASE_URL,
        USERS: process.env.REACT_APP_USERS_URL,
      };
      return (envMap[k] || real.getEndpoint(k)).replace(/\/$/, "");
    }),
  };
});

beforeEach(() => {
  mockAuth = {
    state: { isAuthenticated: false, username: "", displayName: "" },
    signIn: jest.fn(),
    signOut: jest.fn(),
    getAccessToken: jest.fn(),
  };
  // @ts-ignore
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => [] });
});

afterEach(() => jest.clearAllMocks());

test("renders sign in screen when not authenticated", () => {
  mockAuth.state.isAuthenticated = false;
  render(<App />);
  expect(screen.getByText(/Please Sign In/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
  expect(mockAuth.signIn).toHaveBeenCalled();
});

test("renders menu when authenticated", async () => {
  mockAuth.state.isAuthenticated = true;
  mockAuth.state.displayName = "Zoe Zebra";
  render(<App />);
  expect(await screen.findByText(/Hi Zoe,/)).toBeInTheDocument();
});
