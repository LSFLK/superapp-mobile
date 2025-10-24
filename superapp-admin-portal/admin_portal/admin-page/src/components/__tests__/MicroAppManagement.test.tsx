/*
Unit tests for MicroAppManagement
  - Initial rendering, loading states, data display
  - Error handling for network and HTTP errors
  - Upload mode toggle and state preservation
  - Authentication handling and headers
  - Edge cases for response shapes and missing data
*/

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Import after mocking
import { useAuthContext } from "@asgardeo/auth-react";
import { getEndpoint } from "../../constants/api";
import MicroAppManagement from "../MicroAppManagement";

// Mock dependencies with correct paths
jest.mock("@asgardeo/auth-react", () => ({
  useAuthContext: jest.fn(),
}));

jest.mock("../UploadMicroApp", () => {
  return function MockUploadMicroApp({
    onUploaded,
  }: {
    onUploaded?: () => void;
  }) {
    return (
      <div data-testid="upload-micro-app">
        Upload Component
        <button onClick={onUploaded}>Simulate Upload Success</button>
      </div>
    );
  };
});

jest.mock("../common/Button", () => {
  return function MockButton({ children, onClick, disabled }: any) {
    return (
      <button onClick={onClick} disabled={disabled} data-testid="button">
        {children}
      </button>
    );
  };
});

jest.mock("../common/Loading", () => {
  return function MockLoading({ message }: { message: string }) {
    return <div data-testid="loading">{message}</div>;
  };
});

jest.mock("../common/Card", () => {
  return function MockCard({ children, style }: any) {
    return (
      <div data-testid="card" style={style}>
        {children}
      </div>
    );
  };
});

jest.mock("../../constants/styles", () => ({
  COLORS: {
    primary: "#1677ff",
  },
}));

jest.mock("../../constants/api", () => ({
  getEndpoint: jest.fn(() => "http://api.test/microapps"),
}));

// Mock fetch globally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.fetch = jest.fn() as any;

describe("MicroAppManagement Component (TS)", () => {
  const mockAuth = {
    state: {
      isAuthenticated: true,
    },
    getAccessToken: jest.fn(() => Promise.resolve("mock-access-token")),
  };

  const mockMicroApps = [
    {
      micro_app_id: "1",
      name: "Test App 1",
      version: "1.0.0",
      description: "Test description 1",
    },
    {
      app_id: "2",
      name: "Test App 2",
      version: "2.0.0",
      description: "Test description 2",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthContext as jest.Mock).mockReturnValue(mockAuth);
    (getEndpoint as jest.Mock).mockReturnValue("http://api.test/microapps");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMicroApps),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders refresh button with correct text based on loading state", async () => {
    render(<MicroAppManagement />);
    expect(screen.getByText("Refreshing…")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });
  });

  test("handles button interactions with flexible text matching", async () => {
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("Test App 1")).toBeInTheDocument();
    });
    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    const addButton = screen.getByRole("button", { name: /add new/i });
    expect(refreshButton).toBeInTheDocument();
    expect(addButton).toBeInTheDocument();
    fireEvent.click(refreshButton);
    await waitFor(() => {
      expect(global.fetch as jest.Mock).toHaveBeenCalledTimes(2);
    });
  });

  test("displays correct app initials for multiple apps", async () => {
    render(<MicroAppManagement />);
    await waitFor(() => {
      const initialsElements = screen.getAllByText("TE");
      expect(initialsElements).toHaveLength(2);
    });
  });

  test("handles apps with missing data using flexible matching", async () => {
    const incompleteApps = [{ micro_app_id: "1" }, { name: "App 2" }];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(incompleteApps),
    });
    render(<MicroAppManagement />);
    await waitFor(() => {
      // Version label should be hidden when version is missing
      expect(screen.queryByText(/v—/)).not.toBeInTheDocument();
      expect(screen.getAllByText("No description")).toHaveLength(2);
      expect(screen.getByText("App 2")).toBeInTheDocument();
      expect(screen.getByText("?")).toBeInTheDocument();
    });
  });

  test("displays different app initials correctly", async () => {
    const appsWithDifferentNames = [
      { micro_app_id: "1", name: "Alpha App", version: "1.0.0" },
      { micro_app_id: "2", name: "Beta Service", version: "2.0.0" },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(appsWithDifferentNames),
    });
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("AL")).toBeInTheDocument();
      expect(screen.getByText("BE")).toBeInTheDocument();
    });
  });

  test("handles single word app names for initials", async () => {
    const singleWordApps = [
      { micro_app_id: "1", name: "Dashboard", version: "1.0.0" },
      { micro_app_id: "2", name: "A", version: "2.0.0" },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(singleWordApps),
    });
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("DA")).toBeInTheDocument();
      expect(screen.getByText("A")).toBeInTheDocument();
    });
  });

  test("handles network timeout gracefully", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 100),
        ),
    );
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("Request timeout")).toBeInTheDocument();
    });
  });

  test("handles malformed JSON response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error("Unexpected token")),
    });
    render(<MicroAppManagement />);
    await waitFor(() => {
      // Component surfaces a normalized message on JSON parse failures
      expect(
        screen.getByText("Unexpected response format (non-JSON)"),
      ).toBeInTheDocument();
    });
  });

  test("handles 404 error response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(
        screen.getByText("Failed to load micro-apps (404)"),
      ).toBeInTheDocument();
    });
  });

  test("handles null response data", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null),
    });
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("No micro-apps found.")).toBeInTheDocument();
    });
  });

  test("handles response with nested data structure", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockMicroApps, meta: { total: 2 } }),
    });
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("Test App 1")).toBeInTheDocument();
    });
  });

  test("prevents multiple simultaneous refresh requests", async () => {
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("Test App 1")).toBeInTheDocument();
    });
    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    fireEvent.click(refreshButton);
    fireEvent.click(refreshButton);
    fireEvent.click(refreshButton);
    await waitFor(() => {
      expect(global.fetch as jest.Mock).toHaveBeenCalledTimes(2);
    });
  });

  test("maintains component state during upload mode toggle", async () => {
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("Test App 1")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /add new/i }));
    expect(screen.getByTestId("upload-micro-app")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.getByText("Test App 1")).toBeInTheDocument();
    expect(screen.getByText("Test App 2")).toBeInTheDocument();
  });

  test("handles very long app names gracefully", async () => {
    const longNameApps = [
      {
        micro_app_id: "1",
        name: "This Is A Very Long Application Name That Might Cause Display Issues",
        version: "1.0.0",
        description: "A description for the very long named app",
      },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(longNameApps),
    });
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(
        screen.getByText(/This Is A Very Long Application Name/),
      ).toBeInTheDocument();
      expect(screen.getByText("TH")).toBeInTheDocument();
    });
  });

  test("handles apps with special characters in names", async () => {
    const specialCharApps = [
      {
        micro_app_id: "1",
        name: "Café & Restaurant Manager",
        version: "1.0.0",
      },
      { micro_app_id: "2", name: "E-Commerce 2.0", version: "2.0.0" },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(specialCharApps),
    });
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("Café & Restaurant Manager")).toBeInTheDocument();
      expect(screen.getByText("E-Commerce 2.0")).toBeInTheDocument();
      expect(screen.getByText("CA")).toBeInTheDocument();
      expect(screen.getByText("E-")).toBeInTheDocument();
    });
  });

  test("renders initial state correctly", async () => {
    render(<MicroAppManagement />);
    expect(screen.getByText("Available Micro Apps")).toBeInTheDocument();
    expect(screen.getByText("Add new")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Test App 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });

  test("displays loading state when fetching apps", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve([]),
              }),
            100,
          ),
        ),
    );
    render(<MicroAppManagement />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.getByText("Loading micro-apps…")).toBeInTheDocument();
  });

  test("displays micro apps in grid format", async () => {
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("Test App 1")).toBeInTheDocument();
      expect(screen.getByText("Test App 2")).toBeInTheDocument();
      expect(screen.getByText("v1.0.0")).toBeInTheDocument();
      expect(screen.getByText("v2.0.0")).toBeInTheDocument();
      expect(screen.getByText("Test description 1")).toBeInTheDocument();
      expect(screen.getByText("Test description 2")).toBeInTheDocument();
    });
  });

  test("handles API error gracefully", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  test("handles HTTP error responses", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(
        screen.getByText("Failed to load micro-apps (500)"),
      ).toBeInTheDocument();
    });
  });

  test("handles different response formats", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockMicroApps }),
    });
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("Test App 1")).toBeInTheDocument();
    });
  });

  test("displays empty state when no apps available", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("No micro-apps found.")).toBeInTheDocument();
    });
  });

  test("toggles upload mode", async () => {
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("Available Micro Apps")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Add new"));
    expect(screen.getByTestId("upload-micro-app")).toBeInTheDocument();
    expect(screen.queryByText("Available Micro Apps")).not.toBeInTheDocument();
    expect(screen.getByText("Close")).toBeInTheDocument();
  });

  test("closes upload mode", async () => {
    render(<MicroAppManagement />);
    await waitFor(() => {
      fireEvent.click(screen.getByText("Add new"));
    });
    expect(screen.getByTestId("upload-micro-app")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("upload-micro-app")).not.toBeInTheDocument();
    expect(screen.getByText("Available Micro Apps")).toBeInTheDocument();
  });

  test("refreshes micro apps list", async () => {
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(global.fetch as jest.Mock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Refresh"));
    await waitFor(() => {
      expect(global.fetch as jest.Mock).toHaveBeenCalledTimes(2);
    });
  });

  test("handles successful upload and refreshes list", async () => {
    render(<MicroAppManagement />);
    await waitFor(() => {
      fireEvent.click(screen.getByText("Add new"));
    });
    expect(global.fetch as jest.Mock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Simulate Upload Success"));
    await waitFor(() => {
      expect(global.fetch as jest.Mock).toHaveBeenCalledTimes(2);
      expect(screen.queryByTestId("upload-micro-app")).not.toBeInTheDocument();
    });
  });

  test("handles unauthenticated state", async () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      state: { isAuthenticated: false },
      getAccessToken: jest.fn(),
    });
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(global.fetch as jest.Mock).toHaveBeenCalledWith(
        "http://api.test/microapps",
        {
          headers: { Accept: "application/json" },
        },
      );
    });
  });

  test("handles authentication token failure", async () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      state: { isAuthenticated: true },
      getAccessToken: jest.fn(() => Promise.reject(new Error("Token error"))),
    });
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(global.fetch as jest.Mock).toHaveBeenCalledWith(
        "http://api.test/microapps",
        {
          headers: { Accept: "application/json" },
        },
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Authentication token acquisition failed:",
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });

  test("displays app initials correctly", async () => {
    render(<MicroAppManagement />);
    await waitFor(() => {
      const cards = screen.getAllByTestId("card");
      const appCards = cards.filter(
        (card) =>
          card.textContent?.includes("Test App 1") ||
          card.textContent?.includes("Test App 2"),
      );
      expect(appCards).toHaveLength(2);
      expect(screen.getAllByText("TE")).toHaveLength(2);
    });
  });

  test("handles apps with missing data gracefully (alt case)", async () => {
    const incompleteApps = [{ micro_app_id: "1" }, { name: "App 2" }];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(incompleteApps),
    });
    render(<MicroAppManagement />);
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("App 2")).toBeInTheDocument();
      // Version label should be hidden when version is missing
      expect(screen.queryByText(/v—/)).not.toBeInTheDocument();
      expect(screen.getAllByText("No description")).toHaveLength(2);
    });
  });

  test("disables refresh button while loading", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve([]),
              }),
            100,
          ),
        ),
    );
    render(<MicroAppManagement />);
    await waitFor(() => {
      const refreshButton = screen.getByText("Refreshing…");
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).toBeDisabled();
    });
  });
});
