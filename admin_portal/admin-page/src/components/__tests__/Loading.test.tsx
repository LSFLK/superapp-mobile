import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Loading from "../common/Loading";

// Mock theme styles to make style assertions deterministic
jest.mock("../../constants/styles", () => ({
  COMMON_STYLES: {
    loadingText: {
      color: "blue",
      fontWeight: "bold",
    },
  },
}));

describe("Loading component (TS)", () => {
  test("renders with default message", () => {
    render(<Loading />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("renders with custom message", () => {
    render(<Loading message="Fetching micro-apps..." />);
    expect(screen.getByText("Fetching micro-apps...")).toBeInTheDocument();
  });

  test("merges default and custom styles, with custom overriding defaults", () => {
    const { container } = render(
      <Loading style={{ fontSize: "16px", color: "red" }} />,
    );

    const div = container.querySelector("div") as HTMLDivElement | null;
    expect(div).not.toBeNull();
    if (!div) return; // type guard for TS

    // Custom style applied
    expect(div).toHaveStyle("font-size: 16px");

    // Default style preserved
    expect(div).toHaveStyle("font-weight: bold");

    // Custom overrides default
    expect(div).toHaveStyle("color: red");
  });
});
