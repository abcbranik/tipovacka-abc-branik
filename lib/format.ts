/** Formats a Date for display in Czech locale, e.g. "so 16. 8. 2025, 17:00". */
export function formatKickoff(date: Date): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function venueLabel(venue: string): string {
  return venue === "HOME" ? "Doma" : "Venku";
}
