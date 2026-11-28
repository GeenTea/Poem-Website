// Правило для username — одно на регистрацию и смену в настройках.
// username попадает в адрес профиля (/authors/<username>), поэтому только «безопасные» символы.
export const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;
export const USERNAME_RULE_MESSAGE =
    'Username must be 3–20 characters: latin letters, digits, "_" and "."';

/** Приводим к виду, в котором храним: без пробелов по краям и в нижнем регистре */
export const normalizeUsername = ({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value;
