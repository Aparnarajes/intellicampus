-- Extend StudentTopicPerformance to support stable incremental updates

ALTER TABLE "StudentTopicPerformance" ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StudentTopicPerformance" ADD COLUMN "correctCount" INTEGER NOT NULL DEFAULT 0;

