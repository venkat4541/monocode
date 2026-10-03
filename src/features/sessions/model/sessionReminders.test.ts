import { describe, expect, it } from "vitest";
import {
  customReminderTime,
  MAX_CUSTOM_REMINDER_MS,
  reminderTime,
} from "./sessionReminders";

describe("reminder presets", () => {
  it("uses elapsed hours across midnight", () => {
    const now = new Date(2026, 8, 11, 23, 45);
    expect(reminderTime("reminder:1h", now)).toBe(
      new Date(2026, 8, 12, 0, 45).getTime(),
    );
    expect(reminderTime("reminder:3h", now)).toBe(now.getTime() + 10_800_000);
  });

  it("never schedules this evening in the past", () => {
    expect(
      reminderTime("reminder:evening", new Date(2026, 8, 11, 17, 59)),
    ).toBe(new Date(2026, 8, 11, 18).getTime());
    expect(
      reminderTime("reminder:evening", new Date(2026, 8, 11, 18)),
    ).toBeNull();
    expect(
      reminderTime("reminder:evening", new Date(2026, 8, 11, 23)),
    ).toBeNull();
  });

  it("uses local 9am tomorrow across a year boundary", () => {
    expect(reminderTime("reminder:tomorrow", new Date(2026, 11, 31, 21))).toBe(
      new Date(2027, 0, 1, 9).getTime(),
    );
  });

  it.each([
    [11, 14], // Friday -> Monday
    [13, 14], // Sunday -> Monday
    [14, 21], // Monday -> next Monday, even before 9am
  ])("chooses next Monday from September %i", (day, monday) => {
    expect(reminderTime("reminder:next-week", new Date(2026, 8, day, 8))).toBe(
      new Date(2026, 8, monday, 9).getTime(),
    );
  });

  it("rejects unknown and cancel actions", () => {
    expect(reminderTime("reminder:cancel")).toBeNull();
    expect(reminderTime("unknown")).toBeNull();
  });

  it("does not treat a custom amount as a preset", () => {
    expect(reminderTime("reminder:custom")).toBeNull();
  });
});

describe("custom reminders", () => {
  const now = new Date(2026, 8, 11, 9, 30);

  it("schedules minutes and hours from now", () => {
    expect(customReminderTime(45, "minutes", now)).toBe(
      now.getTime() + 45 * 60_000,
    );
    expect(customReminderTime(2, "hours", now)).toBe(
      now.getTime() + 2 * 60 * 60_000,
    );
  });

  it("accepts fractional hours as minutes", () => {
    expect(customReminderTime(0.5, "hours", now)).toBe(
      now.getTime() + 30 * 60_000,
    );
  });

  it("rejects empty, non-numeric, and non-positive amounts", () => {
    expect(customReminderTime(Number(""), "minutes", now)).toBeNull();
    expect(customReminderTime(Number("abc"), "minutes", now)).toBeNull();
    expect(customReminderTime(0, "minutes", now)).toBeNull();
    expect(customReminderTime(-5, "hours", now)).toBeNull();
  });

  it("rejects delays under a minute or beyond a year", () => {
    expect(customReminderTime(0.4, "minutes", now)).toBeNull();
    expect(
      customReminderTime(MAX_CUSTOM_REMINDER_MS / 60_000 + 1, "minutes", now),
    ).toBeNull();
    expect(customReminderTime(365 * 24, "hours", now)).toBe(
      now.getTime() + MAX_CUSTOM_REMINDER_MS,
    );
  });
});
