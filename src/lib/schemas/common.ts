import { z } from "zod";

/** Calendar date, "YYYY-MM-DD". Checked to be a real date (no Feb 30). */
export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD format")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Not a valid calendar date");

/** Local time of day, "HH:mm" (24h). */
export const TimeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected a time in HH:mm (24h) format");

/** ISO 4217 currency code, e.g. "EUR". */
export const CurrencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/, "Expected a 3-letter ISO 4217 currency code");

/** Non-negative money amount with at most 2 decimal places. */
export const MoneySchema = z
  .number()
  .finite()
  .nonnegative()
  .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, "At most 2 decimal places");

export const StopTypeSchema = z.enum(["activity", "meal", "transit", "lodging"]);
export type StopType = z.infer<typeof StopTypeSchema>;
