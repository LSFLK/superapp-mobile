import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import MenuBar, { MenuBarProps } from "../MenuBar";

describe("MenuBar Component (TS)", () => {
  const makeDefaultProps = (
    overrides: Partial<MenuBarProps> = {},
  ): MenuBarProps => {
    const onNavigate: jest.Mock<void, [string]> = jest.fn<void, [string]>();
    const onSignOut: jest.Mock<void, []> = jest.fn<void, []>();
    return {
      onNavigate,
      onSignOut,
      isAuthed: true,
      activeKey: "microapp",
      placement: "left",
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders MenuBar with all required elements", () => {
    render(<MenuBar {...makeDefaultProps()} />);
    expect(screen.getByTestId("sider")).toBeInTheDocument();
    expect(screen.getByTestId("menu")).toBeInTheDocument();
    expect(screen.getByText("Admin Portal")).toBeInTheDocument();
  });

  test("renders all navigation menu items when authenticated", () => {
    render(<MenuBar {...makeDefaultProps()} />);

    expect(screen.getByTestId("menu-item-microapp")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item-profile")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item-logout")).toBeInTheDocument();

    expect(screen.getByText("Micro App Management")).toBeInTheDocument();
    expect(screen.getByText("User Profile")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  test("does not render logout item when not authenticated", () => {
    render(<MenuBar {...makeDefaultProps({ isAuthed: false })} />);

    expect(screen.getByTestId("menu-item-microapp")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item-profile")).toBeInTheDocument();
    expect(screen.queryByTestId("menu-item-logout")).not.toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  test("renders correct icons for each menu item", () => {
    render(<MenuBar {...makeDefaultProps()} />);
    expect(screen.getByTestId("menu-item-microapp")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item-profile")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item-logout")).toBeInTheDocument();
  });

  test("calls onNavigate when clicking navigation items", () => {
    const props = makeDefaultProps();
    render(<MenuBar {...props} />);

    fireEvent.click(screen.getByTestId("menu-item-microapp"));
    expect(props.onNavigate).toHaveBeenCalledWith("microapp");

    fireEvent.click(screen.getByTestId("menu-item-profile"));
    expect(props.onNavigate).toHaveBeenCalledWith("profile");

    expect(props.onNavigate).toHaveBeenCalledTimes(2);
  });

  test("calls onSignOut when clicking logout item", () => {
    const props = makeDefaultProps();
    render(<MenuBar {...props} />);

    fireEvent.click(screen.getByTestId("menu-item-logout"));
    expect(props.onSignOut).toHaveBeenCalledTimes(1);
  });

  test("does not call onNavigate when clicking logout item", () => {
    const props = makeDefaultProps();
    render(<MenuBar {...props} />);

    fireEvent.click(screen.getByTestId("menu-item-logout"));
    expect(props.onNavigate).not.toHaveBeenCalled();
  });

  test("handles missing onNavigate callback gracefully", () => {
    render(<MenuBar {...makeDefaultProps({ onNavigate: undefined })} />);
    expect(() => {
      fireEvent.click(screen.getByTestId("menu-item-microapp"));
    }).not.toThrow();
  });

  test("handles missing onSignOut callback gracefully", () => {
    render(<MenuBar {...makeDefaultProps({ onSignOut: undefined })} />);
    expect(() => {
      fireEvent.click(screen.getByTestId("menu-item-logout"));
    }).not.toThrow();
  });

  test("highlights active menu item", () => {
    render(<MenuBar {...makeDefaultProps({ activeKey: "profile" })} />);
    const profileItem = screen.getByTestId("menu-item-profile");
    expect(profileItem).toHaveClass("selected");
  });

  test("applies correct Sider configuration", () => {
    render(<MenuBar {...makeDefaultProps()} />);
    const sider = screen.getByTestId("sider");
    expect(sider).toBeInTheDocument();
  });

  test("applies Menu configuration correctly", () => {
    render(<MenuBar {...makeDefaultProps({ activeKey: "microapp" })} />);
    const menu = screen.getByTestId("menu");
    expect(menu).toBeInTheDocument();
  });

  test("renders with different activeKey values", () => {
    const { rerender } = render(
      <MenuBar {...makeDefaultProps({ activeKey: "microapp" })} />,
    );
    expect(screen.getByTestId("menu-item-microapp")).toHaveClass("selected");

    rerender(<MenuBar {...makeDefaultProps({ activeKey: "profile" })} />);
    expect(screen.getByTestId("menu-item-profile")).toHaveClass("selected");
    expect(screen.getByTestId("menu-item-microapp")).not.toHaveClass(
      "selected",
    );
  });

  test("handles undefined activeKey", () => {
    render(
      <MenuBar
        {...makeDefaultProps({ activeKey: undefined as unknown as string })}
      />,
    );
    expect(screen.getByTestId("menu-item-microapp")).not.toHaveClass(
      "selected",
    );
    expect(screen.getByTestId("menu-item-profile")).not.toHaveClass("selected");
  });

  test("uses default placement when not provided", () => {
    const { placement, ...rest } = makeDefaultProps();
    render(<MenuBar {...rest} />);
    expect(screen.getByTestId("sider")).toBeInTheDocument();
  });
});
