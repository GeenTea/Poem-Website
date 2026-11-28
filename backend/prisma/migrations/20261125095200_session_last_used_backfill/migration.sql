-- Старые сессии получили lastUsedAt = CURRENT_TIMESTAMP базы (в её часовом поясе, не UTC),
-- поэтому «последняя активность» оказалась в будущем. Для сессий, созданных до появления
-- сведений об устройстве, считаем последней активностью момент входа.
UPDATE "Session" SET "lastUsedAt" = "createdAt" WHERE "userAgent" IS NULL AND "ip" IS NULL;
