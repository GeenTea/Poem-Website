import { join } from 'path';

// Папка для загруженных файлов: backend/uploads (сервер запускается из папки backend).
// Раздаётся как статика по адресу /uploads/... (см. main.ts).
export const UPLOADS_DIR = join(process.cwd(), 'uploads');
export const AVATARS_DIR = join(UPLOADS_DIR, 'avatars');

// Публичный путь, который хранится в БД: /uploads/avatars/<file>
export const AVATAR_URL_PREFIX = '/uploads/avatars/';
