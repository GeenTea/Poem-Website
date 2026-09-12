/**
 * Клиент для запросов к NestJS API.
 *
 * TODO: реализовать обёртку над fetch — сборку URL и query, JSON-тело,
 * заголовок Authorization, разбор ошибок Nest (statusCode/message).
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export {};
