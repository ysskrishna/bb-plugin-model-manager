// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PreferredModelAction } from "./PreferredModelAction";

const state = vi.hoisted(() => ({
  enabled: true,
  selection: { providerId: "custom", model: "a" },
  setSelection: vi.fn(),
  preferred: "b",
}));
vi.mock("@get-bb/plugin-sdk/app", () => ({
  useComposer: () => ({
    selection: state.selection,
    isSubmitting: false,
    isRunning: false,
    setSelection: state.setSelection,
  }),
  useSettings: () => ({ values: { enabled: state.enabled } }),
}));
vi.mock("./preferences-client", () => ({
  usePreferencesView: () => ({
    snapshot: {
      revision: 1,
      providers: {
        custom: {
          mode: "selected",
          modelIds: ["a", "b"],
          preferredModelId: state.preferred,
          preferredReasoning: "high",
        },
      },
    },
  }),
}));
vi.mock("./components/ui/button", () => ({
  Button: ({
    variant,
    size,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
    size?: string;
  }) => <button {...props} />,
}));
beforeEach(() => {
  state.enabled = true;
  state.preferred = "b";
  state.setSelection
    .mockReset()
    .mockImplementation(async (selection) => selection);
});
afterEach(cleanup);

it("applies only the provider's preferred execution fields after an explicit click", async () => {
  render(<PreferredModelAction />);
  expect(state.setSelection).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Use preferred model" }));
  await screen.findByText("Preferred model selected.");
  expect(state.setSelection).toHaveBeenCalledWith({
    providerId: "custom",
    model: "b",
    reasoningLevel: "high",
    serviceTier: "default",
  });
});
it("reports native reconciliation instead of claiming an unavailable preference was applied", async () => {
  state.setSelection.mockResolvedValue({ providerId: "custom", model: "a" });
  render(<PreferredModelAction />);
  fireEvent.click(screen.getByRole("button", { name: "Use preferred model" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("alert").textContent).toMatch(/not available/i);
});
it("does not offer the action when filtering is off or the preference is hidden", () => {
  state.enabled = false;
  const surface = render(<PreferredModelAction />);
  expect(screen.queryByRole("button")).toBeNull();
  state.enabled = true;
  state.preferred = "hidden";
  surface.rerender(<PreferredModelAction />);
  expect(screen.queryByRole("button")).toBeNull();
});
