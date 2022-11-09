import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("CreateDialog component", () => {
  it("example", () => {
    render(<main>Ciao</main>);
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });
});
