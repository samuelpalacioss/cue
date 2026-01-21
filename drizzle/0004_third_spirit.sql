CREATE INDEX "AvailabilitySchedule_active_event_idx" ON "AvailabilitySchedule" USING btree ("is_active","event_id");--> statement-breakpoint
CREATE INDEX "AvailabilitySchedule_active_date_idx" ON "AvailabilitySchedule" USING btree ("is_active","specific_date");--> statement-breakpoint
CREATE INDEX "AvailabilitySchedule_active_dow_idx" ON "AvailabilitySchedule" USING btree ("is_active","day_of_week");--> statement-breakpoint
CREATE INDEX "Booking_option_date_status_idx" ON "Booking" USING btree ("event_option_id","date","status");--> statement-breakpoint
CREATE INDEX "User_username_idx" ON "User" USING btree ("username");