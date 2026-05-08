# Append-only activity log for all field events

Route versions, Visit events (GPS + timestamp), and Call records are append-only. UPDATE and DELETE are disabled on activity tables via Supabase RLS policies. Corrections create new rows with a `supersedes_id` foreign key referencing the original record.

Pharma field activity data is subject to compliance audits. Retrofitting immutability after the fact requires a full data model rewrite. The cost of append-only from day one is low (one extra column, stricter RLS); the cost of not doing it is high.
