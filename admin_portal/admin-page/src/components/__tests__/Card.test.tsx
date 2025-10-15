/*
This tests cover:
    Basic rendering - Ensures children are rendered correctly
    Default styling - Verifies default card class is applied
    Custom classes - Tests that custom className props work alongside defaults
    Style merging - Confirms custom styles merge with COMMON_STYLES
    Style overrides - Ensures custom styles can override defaults
    Edge cases - Empty children, complex nested content
    Semantic structure - Confirms it renders as a div element
*/

import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Card from "../common/Card";

// Mock the COMMON_STYLES to avoid dependency issues
jest.mock("../../constants/styles", () => ({
  COMMON_STYLES: {
    card: {
      backgroundColor: "#ffffff",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      padding: "16px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
  },
}));

describe("Card Component", () => {
  test("renders children correctly", () => {
    const { getByText } = render(
      <Card>
        <h3>Test Title</h3>
        <p>Test content</p>
      </Card>,
    );

    expect(getByText("Test Title")).toBeInTheDocument();
    expect(getByText("Test content")).toBeInTheDocument();
  });

  test("applies default card className", () => {
    const { container } = render(<Card>Content</Card>);
    const cardElement = container.firstChild as HTMLElement;

    expect(cardElement).toHaveClass("card");
  });

  test("applies custom className alongside default", () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const cardElement = container.firstChild as HTMLElement;

    expect(cardElement).toHaveClass("card");
    expect(cardElement).toHaveClass("custom-class");
  });

  test("applies default styles from COMMON_STYLES", () => {
    const { container } = render(<Card>Content</Card>);
    const cardElement = container.firstChild as HTMLElement;

    expect(cardElement).toHaveStyle({
      backgroundColor: "#ffffff",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      padding: "16px",
    });
  });

  test("merges custom styles with default styles", () => {
    const customStyle = {
      maxWidth: "400px",
      margin: "10px",
    } as React.CSSProperties;

    const { container } = render(<Card style={customStyle}>Content</Card>);
    const cardElement = container.firstChild as HTMLElement;

    // Should have both default and custom styles
    expect(cardElement).toHaveStyle({
      backgroundColor: "#ffffff", // from COMMON_STYLES
      maxWidth: "400px", // custom style
      margin: "10px", // custom style
    });
  });

  test("custom styles override default styles when conflicting", () => {
    const customStyle = {
      backgroundColor: "#f0f0f0", // Override default background
      padding: "20px", // Override default padding
    } as React.CSSProperties;

    const { container } = render(<Card style={customStyle}>Content</Card>);
    const cardElement = container.firstChild as HTMLElement;

    expect(cardElement).toHaveStyle({
      backgroundColor: "#f0f0f0", // Should be overridden
      padding: "20px", // Should be overridden
    });
  });

  test("handles empty children", () => {
    const { container } = render(<Card>{null}</Card>);
    const cardElement = container.firstChild as HTMLElement;

    expect(cardElement).toBeInTheDocument();
    expect(cardElement).toHaveClass("card");
    expect(cardElement).toBeEmptyDOMElement();
  });

  test("handles complex nested children", () => {
    const { getByTestId, getByText } = render(
      <Card>
        <div data-testid="nested-div">
          <span>Nested content</span>
          <button>Action Button</button>
        </div>
      </Card>,
    );

    expect(getByTestId("nested-div")).toBeInTheDocument();
    expect(getByText("Nested content")).toBeInTheDocument();
    expect(getByText("Action Button")).toBeInTheDocument();
  });

  test("handles multiple custom classes", () => {
    const { container } = render(
      <Card className="class1 class2 class3">Content</Card>,
    );
    const cardElement = container.firstChild as HTMLElement;

    expect(cardElement).toHaveClass("card");
    expect(cardElement).toHaveClass("class1");
    expect(cardElement).toHaveClass("class2");
    expect(cardElement).toHaveClass("class3");
  });

  test("renders as a div element", () => {
    const { container } = render(<Card>Content</Card>);
    const cardElement = container.firstChild as HTMLElement;

    expect(cardElement.tagName).toBe("DIV");
  });
});
