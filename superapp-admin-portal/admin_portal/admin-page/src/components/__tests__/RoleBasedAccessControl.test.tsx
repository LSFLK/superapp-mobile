import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import RoleBasedAccessControl from "../RoleBasedAccessControl";

// Mock Asgardeo auth context
type MockAuth = {
  state: {
    isAuthenticated: boolean;
    accessToken: string | null;
    accessTokenPayload: any | null;
  };
  getAccessToken: jest.Mock<Promise<string | null>, []>;
  getIDToken: jest.Mock<Promise<string | null>, []>;
  getDecodedIDToken: jest.Mock<any, []>;
  getBasicUserInfo: jest.Mock<Promise<any>, []>;
  signOut: jest.Mock<void, []>;
};

let mockAuth: MockAuth;
jest.mock("@asgardeo/auth-react", () => ({
  useAuthContext: () => mockAuth,
}));

const Protected = () => <div data-testid="protected">Protected Content</div>;

describe("RoleBasedAccessControl", () => {
  beforeEach(() => {
    mockAuth = {
      state: {
        isAuthenticated: false,
        accessToken: null,
        accessTokenPayload: null,
      },
      getAccessToken: jest.fn<Promise<string | null>, []>(),
      getIDToken: jest.fn<Promise<string | null>, []>(),
      getDecodedIDToken: jest.fn<any, []>(),
      getBasicUserInfo: jest.fn<Promise<any>, []>(),
      signOut: jest.fn<void, []>(),
    };
  });

  test("renders Access Denied when user is not authenticated", async () => {
    mockAuth.state.isAuthenticated = false;

    render(
      <RoleBasedAccessControl requiredGroups={["superapp_admin"]}>
        <Protected />
      </RoleBasedAccessControl>,
    );

    // Final state should be access denied
    expect(await screen.findByText("Access Denied")).toBeInTheDocument();
    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
  });

  test("renders children when authenticated and user has required group (via ID token)", async () => {
    mockAuth.state.isAuthenticated = true;
    mockAuth.getIDToken.mockResolvedValue("dummy");
    mockAuth.getDecodedIDToken.mockReturnValue({ groups: ["superapp_admin"] });

    render(
      <RoleBasedAccessControl requiredGroups={["superapp_admin"]}>
        <Protected />
      </RoleBasedAccessControl>,
    );

    // After auth check resolves, protected content should be visible
    expect(await screen.findByTestId("protected")).toBeInTheDocument();
    expect(screen.queryByText("Access Denied")).not.toBeInTheDocument();
  });

  test("shows Access Denied and lists user groups when missing required group", async () => {
    mockAuth.state.isAuthenticated = true;
    mockAuth.getIDToken.mockResolvedValue("dummy");
    mockAuth.getDecodedIDToken.mockReturnValue({ groups: ["viewer"] });

    render(
      <RoleBasedAccessControl requiredGroups={["superapp_admin"]}>
        <Protected />
      </RoleBasedAccessControl>,
    );

    expect(await screen.findByText("Access Denied")).toBeInTheDocument();
    // Required group is shown
    expect(screen.getByText("superapp_admin")).toBeInTheDocument();
    // User groups section shows the actual group
    expect(screen.getByText("viewer")).toBeInTheDocument();
    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
  });

  test("authorizes if any of multiple required groups match (case-insensitive, partial includes)", async () => {
    mockAuth.state.isAuthenticated = true;
    mockAuth.getIDToken.mockResolvedValue("dummy");
    // The component checks with `includes`, make sure a partial match works
    mockAuth.getDecodedIDToken.mockReturnValue({ groups: ["Org-OPS-TEAM"] });

    render(
      <RoleBasedAccessControl requiredGroups={["admin", "ops"]}>
        <Protected />
      </RoleBasedAccessControl>,
    );

    expect(await screen.findByTestId("protected")).toBeInTheDocument();
    expect(screen.queryByText("Access Denied")).not.toBeInTheDocument();
  });

  test("clicking Sign Out calls auth.signOut on denied screen", async () => {
    mockAuth.state.isAuthenticated = true;
    mockAuth.getIDToken.mockResolvedValue("dummy");
    mockAuth.getDecodedIDToken.mockReturnValue({ groups: ["viewer"] });

    render(
      <RoleBasedAccessControl requiredGroups={["superapp_admin"]}>
        <Protected />
      </RoleBasedAccessControl>,
    );

    expect(await screen.findByText("Access Denied")).toBeInTheDocument();
    const signOutBtn = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(signOutBtn);

    await waitFor(() => expect(mockAuth.signOut).toHaveBeenCalled());
  });
});
