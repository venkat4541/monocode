// @vitest-environment happy-dom
// Keep this as .ts because the project test glob intentionally excludes .test.tsx.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomReminderDialog } from "./CustomReminderDialog";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function render(
  props: {
    sessionCount?: number;
    onSave?: (dueAt: number) => void;
    onClose?: () => void;
  } = {},
) {
  act(() =>
    root.render(
      createElement(CustomReminderDialog, {
        sessionCount: props.sessionCount ?? 1,
        onSave: props.onSave ?? vi.fn(),
        onClose: props.onClose ?? vi.fn(),
      }),
    ),
  );
}

function amount(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>("input[type='number']")!;
}

function type(value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  act(() => {
    setter.call(amount(), value);
    amount().dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function button(label: string): HTMLButtonElement {
  const result = [
    ...document.querySelectorAll<HTMLButtonElement>("button"),
  ].find((item) => item.textContent === label);
  expect(result, label).toBeDefined();
  return result!;
}

describe("CustomReminderDialog", () => {
  it("saves the default amount in minutes", () => {
    const onSave = vi.fn();
    const before = Date.now();
    render({ onSave });
    act(() => button("Set reminder").click());

    expect(onSave).toHaveBeenCalledExactlyOnceWith(
      expect.any(Number) as number,
    );
    const [dueAt] = vi.mocked(onSave).mock.calls[0];
    expect(dueAt).toBeGreaterThanOrEqual(before + 30 * 60_000);
    expect(dueAt).toBeLessThanOrEqual(Date.now() + 30 * 60_000);
  });

  it("converts the amount when the unit changes to hours", () => {
    const onSave = vi.fn();
    render({ onSave });
    act(() => button("Hours").click());
    type("2");
    const before = Date.now();
    act(() => button("Set reminder").click());

    expect(button("Hours").getAttribute("aria-pressed")).toBe("true");
    const [dueAt] = vi.mocked(onSave).mock.calls[0];
    expect(dueAt).toBeGreaterThanOrEqual(before + 2 * 60 * 60_000);
    expect(dueAt).toBeLessThanOrEqual(Date.now() + 2 * 60 * 60_000);
  });

  it("blocks an unusable amount and explains why", () => {
    const onSave = vi.fn();
    render({ onSave });
    type("");
    act(() => button("Set reminder").click());

    expect(onSave).not.toHaveBeenCalled();
    expect(document.querySelector("[role='alert']")?.textContent).toBe(
      "Enter how many minutes or hours from now.",
    );
    expect(amount().getAttribute("aria-describedby")).toBe(
      "custom-reminder-error",
    );
  });

  it("rejects an amount beyond a year", () => {
    const onSave = vi.fn();
    render({ onSave });
    act(() => button("Hours").click());
    type("9000");
    act(() => button("Set reminder").click());

    expect(onSave).not.toHaveBeenCalled();
    expect(document.querySelector("[role='alert']")?.textContent).toBe(
      "Enter at most 8760 hours.",
    );
  });

  it("closes without saving", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render({ onSave, onClose });
    act(() => button("Cancel").click());

    expect(onClose).toHaveBeenCalledExactlyOnceWith();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("names the sessions the reminder covers", () => {
    render({ sessionCount: 3 });
    expect(document.querySelector("[role='dialog']")?.textContent).toContain(
      "3 sessions",
    );
  });
});
