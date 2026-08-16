import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoBanner } from "@/components/demo-banner";
import { OrchelioWordmark } from "@/components/brand";

describe("DemoBanner", () => {
  it("shows the long warning on pages that accept input", () => {
    render(<DemoBanner variant="long" />);

    expect(
      screen.getByText(
        "Environnement de démonstration — n'y saisissez jamais d'informations réelles sur un client.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the short warning in the product chrome", () => {
    render(<DemoBanner variant="short" />);

    expect(
      screen.getByText(
        "Démonstration Orchelio — n'y saisissez jamais d'informations réelles sur un client ni de documents confidentiels.",
      ),
    ).toBeInTheDocument();
  });
});

describe("OrchelioWordmark", () => {
  it("names the product and the open firm so the tenant is never ambiguous", () => {
    render(<OrchelioWordmark subtitle="Dupont & Associés" />);

    expect(screen.getByText("Orchelio")).toBeInTheDocument();
    expect(screen.getByText("Démo")).toBeInTheDocument();
    expect(screen.getByText("Dupont & Associés")).toBeInTheDocument();
  });

  it("exposes an accessible name for the logo", () => {
    render(<OrchelioWordmark />);

    expect(screen.getByRole("img", { name: "Orchelio logo" })).toBeInTheDocument();
  });
});
