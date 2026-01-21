ALTER TABLE "AvailabilitySchedule" ALTER COLUMN "day_of_week" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "AvailabilitySchedule" ADD COLUMN "specific_date" date;--> statement-breakpoint
CREATE INDEX "AvailabilitySchedule_specific_date_idx" ON "AvailabilitySchedule" USING btree ("specific_date");