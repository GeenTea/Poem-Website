/** TODO: описать под контракт NestJS. */
export interface User {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  email: string
}
