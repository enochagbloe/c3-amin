WITH actors AS (
 SELECT DISTINCT ON (n."id") n."id", e."actorId", u."name"
 FROM "BudgetNotification" n
 JOIN "BudgetRequestEvent" e ON e."requestId" = n."requestId" AND e."createdAt" <= n."createdAt"
 JOIN "User" u ON u."id" = e."actorId"
 WHERE n."actorId" IS NULL AND n."requestId" IS NOT NULL
 ORDER BY n."id", e."createdAt" DESC, e."id" DESC
) UPDATE "BudgetNotification" n SET "actorId" = actors."actorId", "actorName" = actors."name" FROM actors WHERE n."id" = actors."id";
