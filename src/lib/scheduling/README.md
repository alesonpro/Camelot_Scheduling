# scheduling

Reserved for the availability/conflict-detection engine (CLAUDE.md §30): one
shared function answering "is this agent available for this time range?",
combining recurring availability, exceptions, and existing bookings. Built in
Phase 2+. Every consumer (calendar UI, search, booking form, API, admin) must
call this rather than reimplementing the logic.
