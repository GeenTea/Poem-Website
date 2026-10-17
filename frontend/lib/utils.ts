export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });
const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

// "3 дня назад", "вчера", "5 минут назад"
export function formatRelativeDate(iso: string) {
  const diffSeconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return rtf.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return "только что";
}

// Стихи читают медленнее прозы, поэтому ~150 слов в минуту
export function getReadingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 150));
}

const numberFormat = new Intl.NumberFormat("ru");
export function formatCount(value: number) {
  return numberFormat.format(value);
}