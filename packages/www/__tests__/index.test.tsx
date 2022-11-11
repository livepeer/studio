import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ActiveStreamsBadge from "../components/Dashboard/ActiveStreamsBadge";

describe("CreateDialog component", () => {
  it("example", () => {
    render(<ActiveStreamsBadge />);

    // render(<main>Ciao</main>);
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });
});
