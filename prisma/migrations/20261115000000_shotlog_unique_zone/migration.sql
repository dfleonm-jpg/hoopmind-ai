-- Enforce idempotent shot aggregation per (sessionId, exerciseId, zone).
CREATE UNIQUE INDEX "ShotLog_sessionId_exerciseId_zone_key" ON "ShotLog"("sessionId", "exerciseId", "zone");
