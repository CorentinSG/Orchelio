import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoBanner } from "@/components/demo-banner";
import { OrchelioWordmark } from "@/components/brand";

describe("DemoBanner", () => {
  it("shows the long warning on pages that accept input", () => {
    render(<DemoBanner variant="long" />);

    expect(
      screen.getByText(
        "Demo environment — Do not upload real client information or confidential documents.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the short warning in the product chrome", () => {
    render(<DemoBanner variant="short" />);

    expect(
      screen.getByText(
        "Orchelio Demo — Do not upload real client information or confidential documents.",
      ),
    ).toBeInTheDocument();
  });
});

describe("OrchelioWordmark", () => {
  it("names the product and the open firm so the tenant is never ambiguous", () => {
    render(<OrchelioWordmark subtitle="Dupont Immigration Law" />);

    expect(screen.getByText("Orchelio")).toBeInTheDocument();
    expect(screen.getByText("Demo")).toBeInTheDocument();
    expect(screen.getByText("Dupont Immigration Law")).toBeInTheDocument();
  });

  it("exposes an accessible name for the logo", () => {
    render(<OrchelioWordmark />);

    expect(screen.getByRole("img", { name: "Orchelio logo" })).toBeInTheDocument();
  });
});
