import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Button from "../common/Button";

test("Button renders correctly", () => {
  render(<Button>Click Me</Button>);
  const buttonElement = screen.getByRole("button", { name: /click me/i });
  expect(buttonElement).toBeInTheDocument();
});
