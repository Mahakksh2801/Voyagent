export type ValidationCode =
  | "SCHEMA"
  | "CURRENCY_MISMATCH"
  | "DATE_OUT_OF_RANGE"
  | "DATE_DUPLICATE"
  | "DATE_MISSING"
  | "DATES_OUT_OF_ORDER"
  | "PLACE_MISSING"
  | "PLACE_NOT_IN_CANDIDATES"
  | "TRANSIT_HAS_PLACE"
  | "STOP_OUTSIDE_DAY_WINDOW"
  | "STOPS_OVERLAP"
  | "STOPS_OUT_OF_ORDER"
  | "WEATHER_DEPENDENT_ON_WET_DAY"
  | "WEATHER_UNKNOWN"
  | "OVER_BUDGET";

export interface ValidationIssue {
  code: ValidationCode;
  severity: "error" | "warning";
  message: string;
  /** Where the issue is, for UI highlighting and retry prompts. */
  location?: { date?: string; dayIndex?: number; stopIndex?: number };
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}
