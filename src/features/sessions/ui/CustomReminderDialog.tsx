import { useState, type FormEvent } from "react";
import { Modal } from "../../../shared/ui/Modal";
import {
  customReminderTime,
  formatReminderTime,
  MAX_CUSTOM_REMINDER_MS,
  type ReminderUnit,
} from "../model/sessionReminders";

const UNITS: { id: ReminderUnit; label: string }[] = [
  { id: "minutes", label: "Minutes" },
  { id: "hours", label: "Hours" },
];

const MAX_HOURS = Math.round(MAX_CUSTOM_REMINDER_MS / (60 * 60 * 1000));

export function CustomReminderDialog({
  sessionCount,
  onSave,
  onClose,
}: {
  sessionCount: number;
  onSave: (dueAt: number) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("30");
  const [unit, setUnit] = useState<ReminderUnit>("minutes");
  const [submitted, setSubmitted] = useState(false);
  const parsed = Number(amount);
  const max = unit === "hours" ? MAX_HOURS : MAX_CUSTOM_REMINDER_MS / 60_000;
  const previewDueAt = customReminderTime(parsed, unit);
  const error =
    previewDueAt != null
      ? ""
      : Number.isFinite(parsed) && parsed > 0 && parsed > max
        ? `Enter at most ${max} ${unit === "hours" ? "hours" : "minutes"}.`
        : "Enter how many minutes or hours from now.";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const dueAt = customReminderTime(Number(amount), unit);
    if (dueAt == null) {
      setSubmitted(true);
      return;
    }
    onSave(dueAt);
  };

  return (
    <Modal
      title="Remind me in…"
      description={`${sessionCount} session${sessionCount === 1 ? "" : "s"}`}
      size="sm"
      onClose={onClose}
    >
      <form
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-4 p-4 text-[12px]"
      >
        <div className="flex flex-col gap-1.5">
          <span
            id="custom-reminder-amount-label"
            className="font-medium text-content/80"
          >
            Remind me in
          </span>
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="number"
              inputMode="numeric"
              min={1}
              step={unit === "hours" ? 1 : 5}
              max={max}
              value={amount}
              aria-labelledby="custom-reminder-amount-label"
              aria-invalid={submitted && error ? true : undefined}
              aria-describedby={
                submitted && error ? "custom-reminder-error" : undefined
              }
              onChange={(event) => setAmount(event.target.value)}
              className={`h-9 w-28 rounded-md border bg-content/5 px-2.5 text-[13px] text-content outline-none focus:border-content/30 ${
                submitted && error ? "border-red-400/60" : "border-content/10"
              }`}
            />
            <div role="group" aria-label="Reminder unit" className="flex gap-1">
              {UNITS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={unit === option.id}
                  onClick={() => setUnit(option.id)}
                  className={`h-9 rounded-md px-3 text-[13px] ${
                    unit === option.id
                      ? "bg-content/12 text-content"
                      : "text-content/55 hover:bg-content/8 hover:text-content"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {submitted && error ? (
            <span
              id="custom-reminder-error"
              role="alert"
              className="text-[11px] text-red-400"
            >
              {error}
            </span>
          ) : previewDueAt != null ? (
            <span className="text-[11px] text-content/45">
              Due {formatReminderTime(previewDueAt)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onClose()}
            className="rounded-md px-3 py-1.5 hover:bg-content/8 active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-accent px-3 py-1.5 font-medium text-white hover:brightness-110 active:scale-[0.97]"
          >
            Set reminder
          </button>
        </div>
      </form>
    </Modal>
  );
}
