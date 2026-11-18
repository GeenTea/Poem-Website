// Клиентский API жалоб (браузер). Токен добавляет прокси app/api/[...path].

export type ReportableType = "COMMENT" | "POEM";

export const REPORT_MAX_LENGTH = 1000; // как @MaxLength в CreateReportDto

export class ReportRequestError extends Error {
  constructor(public status: number) {
    super(`Report request failed with status ${status}`);
  }
}

export const reportsApi = {
  /** POST /reports { type, targetId, reason } — как ждёт CreateReportDto */
  async create(type: ReportableType, targetId: string, reason: string) {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, targetId, reason }),
    });
    if (!res.ok) throw new ReportRequestError(res.status);
  },
};

export function reportErrorMessage(error: unknown) {
  if (error instanceof ReportRequestError) {
    if (error.status === 400) return "You can't report this. Check the reason and try again.";
    if (error.status === 401) return "Please sign in to continue.";
    if (error.status === 404) return "This no longer exists.";
    if (error.status === 409) return "You've already reported this.";
  }
  return "Something went wrong. Please try again.";
}
