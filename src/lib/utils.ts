import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in XOF (CFA Franc) with thousand separators
 * formatXOF(5000) -> "5 000 F"
 * formatXOF(5000, { long: true }) -> "5 000 FCFA"
 */
export function formatXOF(
  amount: number,
  options?: { long?: boolean }
): string {
  const formatted = new Intl.NumberFormat("fr-CI", {
    style: "decimal",
    useGrouping: true,
  }).format(amount);
  return `${formatted} ${options?.long ? "FCFA" : "F"}`;
}

/**
 * Normalize Ivorian phone numbers to international format
 * "07 00 00 00 00" -> "+2250700000000"
 * "27 21 24 02 28" -> "+2252721240228"
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("225")) return `+${digits}`;
  if (digits.startsWith("0")) return `+225${digits.slice(1)}`;
  return `+225${digits}`;
}

/**
 * Format phone for display
 * "+2250700000000" -> "07 00 00 00 00"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("225") ? digits.slice(3) : digits;
  const padded = local.padStart(10, "0");
  return padded.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
}
