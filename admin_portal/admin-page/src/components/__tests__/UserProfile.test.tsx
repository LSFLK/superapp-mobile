import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserProfile from "../UserProfile";
import type ReactNamespace from "react";

// Mock constants/api
import { getEndpoint } from "../../constants/api";

// Cast JS component to typed FC for prop support in TS tests
const UserProfileTyped = UserProfile as unknown as ReactNamespace.FC<{
  state?: any;
}>;

// Mock Asgardeo auth context
type MockCtx = {
  state: { isAuthenticated: boolean };
  getBasicUserInfo: jest.Mock<Promise<any>, []>;
  getAccessToken: jest.Mock<Promise<string>, []>;
  getIDToken: jest.Mock<Promise<string>, []>;
};

let mockCtx: MockCtx;
jest.mock("@asgardeo/auth-react", () => ({
  useAuthContext: () => mockCtx,
}));
jest.mock("../../constants/api", () => ({
  getEndpoint: jest.fn(),
}));

beforeEach(() => {
  mockCtx = {
    state: { isAuthenticated: false },
    getBasicUserInfo: jest.fn<Promise<any>, []>(),
    getAccessToken: jest.fn<Promise<string>, []>(),
    getIDToken: jest.fn<Promise<string>, []>(),
  };
  global.fetch = jest.fn() as unknown as typeof fetch;
  (getEndpoint as jest.Mock).mockImplementation((name: string) => {
    if (name === "USERS_BASE") return "https://api.example.com";
    if (name === "MICROAPPS_LIST") return "https://api.example.com/micro-apps";
    return "";
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test("shows loading then hides after basic user info resolves", async () => {
  mockCtx.getBasicUserInfo.mockResolvedValue({});
  render(<UserProfileTyped />);

  // Initial loading
  expect(screen.getByText(/Loading user details/i)).toBeInTheDocument();

  // Loading goes away
  await waitFor(() =>
    expect(screen.queryByText(/Loading user details/i)).not.toBeInTheDocument(),
  );
});

test("shows error when fetching basic user info fails", async () => {
  mockCtx.getBasicUserInfo.mockRejectedValue(new Error("boom"));
  render(<UserProfileTyped />);

  expect(
    await screen.findByText("Could not fetch user details"),
  ).toBeInTheDocument();
});

test("fetches backend profile with tokens and renders fields", async () => {
  mockCtx.state.isAuthenticated = true;
  mockCtx.getBasicUserInfo.mockResolvedValue({
    email: "john.doe+test@example.com",
  });
  mockCtx.getIDToken.mockResolvedValue("id-token");
  mockCtx.getAccessToken.mockResolvedValue("acc-token");

  const body = {
    first_name: "John",
    last_name: "Doe",
    employee_id: "E123",
    user_id: "U1",
    department: "HR",
  };
  (global.fetch as unknown as jest.Mock).mockResolvedValue({
    ok: true,
    headers: { get: () => "application/json" },
    text: async () => JSON.stringify(body),
  });

  render(<UserProfileTyped />);

  // Fields render after fetch completes (loader may be too brief to catch reliably)
  expect(await screen.findByText(/First name:/i)).toBeInTheDocument();
  expect(screen.getByText(/John/)).toBeInTheDocument();
  expect(screen.getByText(/Last name:/i)).toBeInTheDocument();
  expect(screen.getByText(/Doe/)).toBeInTheDocument();
  expect(screen.getByText(/Department:/i)).toBeInTheDocument();
  expect(screen.getByText(/HR/)).toBeInTheDocument();
  expect(screen.getByText(/Employee ID:/i)).toBeInTheDocument();
  expect(screen.getByText(/E123/)).toBeInTheDocument();

  // URL encoding and headers
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const [url, init] = (global.fetch as unknown as jest.Mock).mock.calls[0] as [
    string,
    RequestInit,
  ];
  expect(url).toContain(
    "https://api.example.com/users/john.doe%2Btest%40example.com",
  );
  const headers = (init.headers || {}) as Record<string, string>;
  expect(headers["Authorization"]).toBe("Bearer acc-token");
  expect(headers["x-jwt-assertion"]).toBe("id-token");
});

test("shows error on non-JSON success response", async () => {
  mockCtx.getBasicUserInfo.mockResolvedValue({ email: "j@example.com" });
  (global.fetch as unknown as jest.Mock).mockResolvedValue({
    ok: true,
    headers: { get: () => "text/html" },
    text: async () => "<html>not json</html>",
  });

  render(<UserProfileTyped />);

  expect(
    await screen.findByText(
      "Unexpected HTML response – check REACT_APP_USERS_BASE_URL",
    ),
  ).toBeInTheDocument();
});

test("shows error with status and snippet when backend returns non-ok", async () => {
  mockCtx.getBasicUserInfo.mockResolvedValue({ email: "j@example.com" });
  (global.fetch as unknown as jest.Mock).mockResolvedValue({
    ok: false,
    status: 500,
    headers: { get: () => "text/plain" },
    text: async () => "Oops something went wrong",
  });

  render(<UserProfileTyped />);

  expect(
    await screen.findByText(/Profile fetch failed \(500\) - Oops/i),
  ).toBeInTheDocument();
});
