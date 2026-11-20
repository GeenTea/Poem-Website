// Клиентский API своего профиля (браузер). Токен добавляет прокси app/api/[...path].

export const DISPLAY_NAME_MAX_LENGTH = 40; // как @MaxLength в UpdateProfileDto
export const BIO_MAX_LENGTH = 300;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 МБ, как на бэкенде
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface MyProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export class ProfileRequestError extends Error {
  constructor(public status: number) {
    super(`Profile request failed with status ${status}`);
  }
}

async function parse(res: Response): Promise<MyProfile> {
  if (!res.ok) throw new ProfileRequestError(res.status);
  return res.json();
}

export const profileApi = {
  /** PATCH /users/me — имя и bio. Пустой bio очищает его */
  update: (data: { displayName?: string; bio?: string }) =>
    fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(parse),

  /**
   * POST /users/me/avatar — multipart/form-data с полем "avatar".
   * Content-Type НЕ ставим вручную: браузер сам добавит его вместе с boundary
   * (разделителем частей формы), без него сервер не разберёт файл.
   */
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return fetch("/api/users/me/avatar", { method: "POST", body: form }).then(parse);
  },
};

export function profileErrorMessage(error: unknown) {
  if (error instanceof ProfileRequestError) {
    if (error.status === 400) return "Please check your name, bio and image (JPG, PNG or WebP).";
    if (error.status === 401) return "Please sign in to continue.";
    if (error.status === 413) return "The image is too large. The limit is 2 MB.";
  }
  return "Something went wrong. Please try again.";
}
