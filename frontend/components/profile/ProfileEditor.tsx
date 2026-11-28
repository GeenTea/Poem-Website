"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  BIO_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  profileApi,
  profileErrorMessage,
  type MyProfile,
} from "@/lib/profile-api";

type Props = { profile: MyProfile };
type Field = "name" | "bio" | null;

/**
 * Редактор своего профиля: аватар, отображаемое имя, bio.
 * Поля меняются по карандашу, а сохраняется всё сразу кнопкой Save внизу.
 */
export function ProfileEditor({ profile }: Props) {
  const router = useRouter();
  const initialName = profile.displayName || profile.username;
  const initialBio = profile.bio ?? "";

  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [editing, setEditing] = useState<Field>(null);

  // Новый аватар: сам файл (уйдёт на сервер при Save) и временная ссылка для превью
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const trimmedBio = bio.trim();
  const nameChanged = trimmedName !== initialName;
  const bioChanged = trimmedBio !== initialBio;
  const dirty = nameChanged || bioChanged || avatarFile !== null;
  const valid =
    trimmedName.length > 0 &&
    trimmedName.length <= DISPLAY_NAME_MAX_LENGTH &&
    trimmedBio.length <= BIO_MAX_LENGTH;

  // Превью — это blob:-ссылка в памяти браузера. Освобождаем её при уходе со страницы
  const previewRef = useRef<string | null>(null);
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  // Предупреждение при закрытии вкладки с несохранёнными изменениями
  useEffect(() => {
    if (!dirty || pending) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, pending]);

  function pickAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // чтобы можно было выбрать тот же файл ещё раз
    if (!file) return;

    // Быстрая проверка в браузере; настоящая — на сервере (по содержимому файла)
    if (!AVATAR_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError("The image is too large. The limit is 2 MB.");
      return;
    }

    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setAvatarPreview(url);
    setAvatarFile(file);
    setError(null);
  }

  async function save() {
    if (!dirty || !valid || pending) return;
    setPending(true);
    setError(null);
    try {
      if (avatarFile) await profileApi.uploadAvatar(avatarFile);
      if (nameChanged || bioChanged) {
        await profileApi.update({
          ...(nameChanged && { displayName: trimmedName }),
          ...(bioChanged && { bio: trimmedBio }),
        });
      }
      router.push(`/authors/${profile.username}`);
      router.refresh(); // обновить шапку (аватар/имя в меню) и профиль
    } catch (err) {
      setError(profileErrorMessage(err));
      setPending(false);
    }
  }

  // Enter — закончить правку поля (для bio — Ctrl/Cmd+Enter), Esc — вернуть как было
  function fieldKeys(field: "name" | "bio") {
    return (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const finish = field === "name" ? e.key === "Enter" : e.key === "Enter" && (e.metaKey || e.ctrlKey);
      if (finish) {
        e.preventDefault();
        setEditing(null);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (field === "name") setName(initialName);
        else setBio(initialBio);
        setEditing(null);
      }
    };
  }

  return (
    <section aria-labelledby="edit-profile-title" className="auth-card rounded-[28px] bg-[var(--glass)] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h1 id="edit-profile-title" className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">
          Edit profile
        </h1>
        <Link
          href={`/authors/${profile.username}`}
          className="focus-ring rounded-full px-3 py-1 text-sm text-ink-muted hover:bg-[var(--glass-hover)] hover:text-ink"
        >
          ← Back to profile
        </Link>
      </div>

      {/* ---------- Аватар: затемнение + иконка по центру ---------- */}
      <div className="mt-6 flex flex-col items-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={pending}
          aria-label="Change avatar"
          className="focus-ring group relative size-20 overflow-hidden rounded-full ring-1 ring-[var(--glass-border)]"
        >
          {avatarPreview ? (
            // blob:-ссылку оптимизировать нечего — unoptimized
            <Image src={avatarPreview} alt="" fill unoptimized className="object-cover" />
          ) : (
            <Avatar src={profile.avatarUrl} name={initialName} size="xl" />
          )}
          <span className="absolute inset-0 grid place-items-center bg-scrim/45 text-white transition-colors group-hover:bg-scrim/60">
            <CameraIcon className="h-7 w-7" />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={AVATAR_TYPES.join(",")}
          onChange={pickAvatar}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
        <p className="mt-2 text-xs text-ink-muted">
          {avatarFile ? `New photo: ${avatarFile.name}` : "JPG, PNG or WebP, up to 2 MB"}
        </p>
        <p className="mt-1 text-sm text-ink-muted">@{profile.username}</p>
      </div>

      {/* ---------- Отображаемое имя ---------- */}
      <EditableField
        label="Display name"
        editing={editing === "name"}
        onEdit={() => setEditing("name")}
        count={name.length}
        max={DISPLAY_NAME_MAX_LENGTH}
        view={<span className="font-serif text-2xl text-ink">{trimmedName || initialName}</span>}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={fieldKeys("name")}
          onBlur={() => setEditing(null)}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          autoFocus
          aria-label="Display name"
          className="block w-full rounded-2xl border border-[var(--glass-border)] bg-input-bg px-4 py-2.5 font-serif text-2xl text-ink focus:border-leaf-deep focus:outline-none focus:ring-2 focus:ring-leaf/40"
        />
      </EditableField>

      {/* ---------- Bio ---------- */}
      <EditableField
        label="Bio"
        editing={editing === "bio"}
        onEdit={() => setEditing("bio")}
        count={bio.length}
        max={BIO_MAX_LENGTH}
        view={
          trimmedBio ? (
            <span className="whitespace-pre-line font-serif text-lg leading-relaxed text-ink">{trimmedBio}</span>
          ) : (
            <span className="font-serif text-lg italic text-ink-muted">Add a few words about yourself…</span>
          )
        }
      >
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          onKeyDown={fieldKeys("bio")}
          onBlur={() => setEditing(null)}
          maxLength={BIO_MAX_LENGTH}
          rows={4}
          autoFocus
          aria-label="Bio"
          placeholder="What do you write about?"
          className="block w-full resize-none rounded-2xl border border-[var(--glass-border)] bg-input-bg px-4 py-3 font-serif text-lg leading-relaxed text-ink placeholder:italic placeholder:text-ink-muted/70 focus:border-leaf-deep focus:outline-none focus:ring-2 focus:ring-leaf/40"
        />
      </EditableField>

      {/* ---------- Кнопки ---------- */}
      <div className="mt-8 flex flex-wrap items-center justify-end gap-2 border-t border-leaf/30 pt-5">
        {error && (
          <p role="alert" className="mr-auto text-sm text-berry">
            {error}
          </p>
        )}
        <Link
          href={`/authors/${profile.username}`}
          className="focus-ring rounded-full px-4 py-2 text-sm text-ink-muted hover:bg-[var(--glass-hover)] hover:text-ink"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || !valid || pending}
          className="focus-ring rounded-full bg-berry px-6 py-2 text-sm font-medium text-white shadow-[var(--glass-highlight)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </section>
  );
}

/* Поле профиля: подпись, значение и карандаш; в режиме правки — поле ввода и счётчик */
function EditableField({
  label,
  editing,
  onEdit,
  count,
  max,
  view,
  children,
}: {
  label: string;
  editing: boolean;
  onEdit: () => void;
  count: number;
  max: number;
  view: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mt-7">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">{label}</span>
        {editing && (
          <span className={`text-xs tabular-nums ${count > max ? "text-berry" : "text-ink-muted"}`}>
            {count}/{max}
          </span>
        )}
      </div>

      {editing ? (
        <div className="mt-2">{children}</div>
      ) : (
        <div className="mt-2 flex items-start justify-between gap-3 rounded-2xl border border-transparent px-1 py-1">
          <div className="min-w-0 break-words">{view}</div>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${label.toLowerCase()}`}
            className="glass-pill focus-ring grid size-9 shrink-0 place-items-center rounded-full text-ink-muted hover:text-ink"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4L19 9a2.83 2.83 0 0 0-4-4L4 16v4Z" />
      <path strokeLinecap="round" d="m13.5 6.5 4 4" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path strokeLinejoin="round" d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.4-2h5l1.4 2h1.6A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}
