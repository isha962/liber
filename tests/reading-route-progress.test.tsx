import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReadingRouteProgress } from "@/components/ReadingRouteProgress";

describe("ReadingRouteProgress", () => {
  it("uses different deterministic variants for different books", () => {
    const { rerender } = render(
      <ReadingRouteProgress title="The Midnight Library" startPage={24} endPage={52} totalPages={304} />,
    );

    const first = screen.getByTestId("reading-route-progress").getAttribute("data-variant");
    rerender(<ReadingRouteProgress title="Piranesi" startPage={24} endPage={52} totalPages={272} />);
    const second = screen.getByTestId("reading-route-progress").getAttribute("data-variant");

    expect(first).not.toBe(second);
  });
});
