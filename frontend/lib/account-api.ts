// Клиентский API настроек аккаунта (браузер). Токен добавляет прокси app/api/[...path].

export const PASSWORD_MIN = 6; // как при регистрации
export const PASSWORD_MAX = 128;
// Как USERNAME_PATTERN на бэкенде: a–z, 0–9, "_" и ".", 3–20 символов
export const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;

/** Ошибка с текстом от сервера — тексты бэкенда уже понятны пользователю */
export class AccountRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Файл со всеми стихами: свой route handler, чтобы сохранился заголовок Content-Disposition
export const EXPORT_URL = "/api/account/export";
// Слово, которое нужно ввести для подтверждения удаления аккаунта
export const DELETE_CONFIRM_WORD = "DELETE";

async function send<T>(method: "POST" | "PATCH", path: string, body?: unknown, url = `/api/users/me${path}`): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new AccountRequestError(res.status, message || "Something went wrong. Please try again.");
  }
  return data as T;
}

export const accountApi = {
  changePassword: (currentPassword: string, newPassword: string) =>
    send<{ ok: true }>("PATCH", "/password", { currentPassword, newPassword }),

  changeUsername: (username: string) => send<{ username: string }>("PATCH", "/username", { username }),

  /** Шаг 1: код на текущую почту. Ответ — маска адреса, куда ушло письмо */
  sendEmailCode: () => send<{ ok: true; email: string }>("POST", "/email/code"),
  /** Шаг 2: код → одноразовый токен */
  verifyEmailCode: (code: string) => send<{ emailToken: string }>("POST", "/email/verify", { code }),
  /** Шаг 3: новая почта */
  changeEmail: (emailToken: string, newEmail: string) =>
    send<{ email: string }>("PATCH", "/email", { emailToken, newEmail }),

  /** Удалить аккаунт навсегда. Свой route handler: он же стирает cookie с токенами */
  deleteAccount: (password: string) => send<{ ok: true }>("POST", "", { password }, "/api/account/delete"),
};

export function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
