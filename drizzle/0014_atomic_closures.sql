DROP TRIGGER IF EXISTS appointment_no_overlap_insert;
DROP TRIGGER IF EXISTS appointment_no_overlap_update;
DROP TRIGGER IF EXISTS closure_no_bookings_insert;
CREATE TRIGGER IF NOT EXISTS appointment_no_overlap_insert BEFORE INSERT ON appointments
 WHEN NEW.status NOT IN ('cancelled','no_show')
 BEGIN
 SELECT CASE WHEN NEW.ends_at<=NEW.starts_at THEN RAISE(ABORT,'INVALID_APPOINTMENT_RANGE') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM time_off t WHERE t.business_id=NEW.business_id AND (t.staff_id IS NULL OR t.staff_id=NEW.staff_id) AND t.starts_at<NEW.ends_at AND t.ends_at>NEW.starts_at) THEN RAISE(ABORT,'APPOINTMENT_UNAVAILABLE') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM appointments a WHERE a.business_id=NEW.business_id AND a.staff_id=NEW.staff_id AND a.status NOT IN ('cancelled','no_show') AND a.starts_at<NEW.ends_at AND a.ends_at>NEW.starts_at) THEN RAISE(ABORT,'APPOINTMENT_CONFLICT') END;
 END;
CREATE TRIGGER IF NOT EXISTS appointment_no_overlap_update BEFORE UPDATE OF starts_at,ends_at,staff_id,status ON appointments
 WHEN NEW.status NOT IN ('cancelled','no_show')
 BEGIN
 SELECT CASE WHEN NEW.ends_at<=NEW.starts_at THEN RAISE(ABORT,'INVALID_APPOINTMENT_RANGE') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM time_off t WHERE t.business_id=NEW.business_id AND (t.staff_id IS NULL OR t.staff_id=NEW.staff_id) AND t.starts_at<NEW.ends_at AND t.ends_at>NEW.starts_at) THEN RAISE(ABORT,'APPOINTMENT_UNAVAILABLE') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM appointments a WHERE a.id<>NEW.id AND a.business_id=NEW.business_id AND a.staff_id=NEW.staff_id AND a.status NOT IN ('cancelled','no_show') AND a.starts_at<NEW.ends_at AND a.ends_at>NEW.starts_at) THEN RAISE(ABORT,'APPOINTMENT_CONFLICT') END;
 END;

CREATE TRIGGER IF NOT EXISTS closure_no_bookings_insert BEFORE INSERT ON time_off
 BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM appointments a WHERE a.business_id=NEW.business_id AND (NEW.staff_id IS NULL OR a.staff_id=NEW.staff_id) AND a.status NOT IN ('cancelled','no_show','completed') AND a.starts_at<NEW.ends_at AND a.ends_at>NEW.starts_at) THEN RAISE(ABORT,'APPOINTMENT_UNAVAILABLE') END;
 END;
