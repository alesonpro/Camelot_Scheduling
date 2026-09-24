CLAUDE.md

Camelot Properties — Agent Availability & Showing Scheduler

1. Project Purpose

You are working on an internal scheduling application for Camelot Properties, a real estate company.

The primary operational problem is that receptionists need to schedule prospects for property showings, but agent schedules are not fixed. The receptionist currently has difficulty determining which agent is available for a specific property, date, and time. This can delay prospects.

The application must solve this problem by allowing agents to maintain their own availability while giving the receptionist a fast way to see who is available and book a showing.

The core question the application must answer is:

Which agent is available to show this property at this time?

This is an internal operational tool. Prioritize reliability, simplicity, speed, and maintainability over unnecessary features.

2. Product Principles

Always follow these principles:

Keep the workflow simple.

Minimize the number of clicks required to schedule a showing.

Make the application understandable to non-technical users.

Agents manage their own availability.

The receptionist should not need to manually ask agents whether they are available.

Supabase is the source of truth for scheduling data.

Prevent double-booking at the backend/database level, not only in the frontend.

Do not make CINC a dependency for the MVP.

Design the architecture so n8n and CINC can be integrated later.

Do not over-engineer the MVP.

3. Technology Stack

Use this stack unless there is a strong technical reason to change it:

Frontend

Next.js

React

TypeScript

Tailwind CSS

shadcn/ui

FullCalendar or a similarly reliable calendar component

Backend

Next.js Server Actions and/or API routes

Supabase

Database

PostgreSQL through Supabase

Authentication

Supabase Authentication

Automation

n8n

Deployment

Vercel

Future Integration

CINC API

CINC OAuth

Do not introduce additional frameworks, databases, or services without a clear reason.

Prefer existing tools in the stack.

4. User Roles

There are three primary roles.

Agent

Agents can:

Log in

View their schedule

Add availability

Edit their availability

Delete availability

Add recurring weekly availability

Add one-time availability

Add unavailable periods

View their booked showings

Agents should normally only manage their own availability.

Receptionist

Receptionists can:

View all agent availability

Search for available agents

Select a property

Select a date

Select a time

Select showing duration

Create showings

View upcoming showings

Cancel showings

Reschedule showings

View relevant agent schedules

The receptionist workflow must be optimized for desktop.

Admin

Admins can:

Add agents

Disable agents

Edit agent information

View all agents

View all availability

Modify availability

View all showings

Cancel showings

Manage system-level settings

5. Core Scheduling Model

Separate these concepts:

Recurring availability

Availability exceptions

Actual bookings/showings

Do NOT store all scheduling information as one undifferentiated calendar object.

Use the following logic:

Available Time = Recurring Availability + One-Time Availability - Unavailability Exceptions - Existing Bookings

A booking can only be created if the complete requested time range is available.

6. Agent Availability

Agents should be able to define weekly recurring availability.

Example:

Monday:
09:00–17:00

Tuesday:
09:00–17:00

Wednesday:
12:00–18:00

Thursday:
09:00–17:00

Friday:
09:00–15:00

Agents should be able to choose:

Repeat every week

This prevents them from repeatedly entering the same availability.

7. Availability Exceptions

The system must support temporary overrides.

Examples:

Unavailable September 25

Unavailable September 26 from 14:00–17:00

Extra availability Saturday from 10:00–14:00

Vacation for several days

Exceptions must take priority over normal recurring availability.

Example:

Recurring:

Monday 09:00–17:00

Exception:

Monday September 28, unavailable 14:00–17:00

Final availability:

09:00–14:00

8. Booking Rules

A showing can only be booked when:

The agent is available for the full duration.

The agent has no conflicting booking.

No unavailability exception blocks the requested time.

The requested duration fits inside the available period.

The agent is active.

Never allow overlapping bookings.

Example:

Agent availability:
10:00–15:00

Showing duration:
30 minutes

Valid slots include:
10:00
10:30
11:00
11:30
12:00
12:30
13:00
13:30
14:00
14:30

A 14:45 slot is invalid for a 30-minute showing because the agent becomes unavailable at 15:00.

9. Double-Booking Prevention

Double-booking prevention is a critical system requirement.

Do not rely only on frontend availability checks.

The backend/database must also enforce conflict prevention.

If two users attempt to book the same agent at the same time, only one booking should succeed.

The second request should receive a clear error such as:

This agent is no longer available for this time. Please choose another agent or time.

Where possible, use PostgreSQL constraints, transactions, locking, or another reliable backend strategy.

10. Receptionist Workflow

The ideal workflow is:

Step 1

Click:

New Showing

Step 2

Select property.

Step 3

Select date.

Step 4

Select preferred time.

Step 5

Select duration.

Step 6

System immediately shows available agents.

Example:

Sarah — Available

John — Available

Mike — Busy

David — Unavailable

Step 7

Click:

Book with Sarah

The showing is created.

This should take only a few clicks.

11. Find Next Available Agent

This is an important feature.

The receptionist should be able to enter something like:

Property:
123 Main Street

Date:
September 26

Preference:
Afternoon

The application should display available slots.

Example:

14:00 — Sarah
14:30 — John
15:00 — Sarah
15:30 — David
16:00 — John

The system should reduce the need for receptionists to manually search through calendars.

12. Dashboard Requirements

Receptionist Dashboard

Show:

Today's showings

Upcoming showings

Quick "New Showing" action

Availability search

Agent schedule overview

Recommended quick actions:

New Showing

Find Availability

Today's Schedule

Upcoming Showings

Agent Dashboard

Show:

Today's showings

Upcoming showings

Current availability

Add Availability

Add Unavailability

The agent home screen should not be cluttered.

Admin Dashboard

Show:

Agent list

Availability overview

Upcoming showings

Schedule conflicts

Basic management controls

Avoid building analytics unless needed.

13. Calendar UX

Use a familiar calendar.

Support:

Day view

Week view

Month view

Default agent view should be Week view.

Make these states visually distinct:

Available

Booked

Unavailable

Do not use excessive colors, icons, animations, or visual decorations.

The calendar is a functional tool, not a showcase.

14. Mobile Requirements

Agents may use mobile devices.

The agent experience must be responsive and usable on a phone.

Agents must be able to:

Log in

View availability

Add availability

Add unavailability

View showings

The receptionist experience can prioritize desktop, but it must remain tablet-friendly and reasonably responsive.

15. Database Schema

Use PostgreSQL via Supabase.

Recommended tables:

users

Fields:

id

email

name

role

phone

active

created_at

updated_at

Roles:

admin

receptionist

agent

agents

Fields:

id

user_id

name

email

phone

active

created_at

updated_at

availability_rules

Used for recurring weekly availability.

Fields:

id

agent_id

day_of_week

start_time

end_time

timezone

active

created_at

updated_at

availability_exceptions

Used for temporary changes.

Fields:

id

agent_id

date

start_time

end_time

type

reason

created_at

updated_at

Types:

unavailable

available

properties

Fields:

id

address

city

state

zip

property_name

active

created_at

updated_at

CINC can be integrated later.

prospects

Fields:

id

name

phone

email

notes

created_at

updated_at

showings

Fields:

id

agent_id

property_id

prospect_id

start_time

end_time

status

notes

created_at

updated_at

Statuses:

scheduled

confirmed

cancelled

completed

rescheduled

16. Timezone Rules

Do not use ambiguous local timestamps.

The application must have a consistent timezone strategy.

The operating timezone should be configurable.

Store timestamps in a reliable standard representation and convert them for display.

Do not hardcode timezone assumptions throughout the frontend.

17. Authentication and Authorization

Use Supabase Auth.

Every user should have their own account.

Do not use shared credentials.

Use role-based access control.

Agent permissions

Agents can manage:

Their own availability

Their own exceptions

Their own schedule information

Receptionist permissions

Receptionists can:

Read all agent availability

Create showings

Update/cancel showings

View relevant agent schedules

They should not automatically have permission to change recurring agent availability unless explicitly intended.

Admin permissions

Admins can manage everything.

18. Supabase Row Level Security

RLS is required.

Never rely only on frontend UI restrictions.

Examples:

Agents cannot update another agent's availability.

Agents cannot access another agent's private data.

Receptionists can read all required scheduling data.

Admins have appropriate management access.

Test RLS policies rather than assuming they work.

19. Security Rules

Never expose secrets in client-side code.

Keep these in environment variables:

Supabase service role key

API keys

n8n credentials

CINC credentials

OAuth secrets

Never commit .env files containing secrets.

Do not hardcode credentials into source code.

Validate all incoming data.

Perform server-side authorization checks.

Do not rely on hiding buttons as a security mechanism.

20. n8n Integration

n8n should handle automation and external integrations.

Design the application to emit webhook events.

Useful events:

showing.created

showing.cancelled

showing.rescheduled

showing.completed

availability.updated

Example payload:

{
  "event": "showing.created",
  "showing_id": "123",
  "agent_id": "456",
  "property_id": "789",
  "prospect_id": "999",
  "start_time": "2026-09-26T14:00:00",
  "end_time": "2026-09-26T14:30:00"
}

The system should not tightly couple core scheduling logic to n8n.

n8n is an integration and automation layer.

21. Notification Architecture

When a showing is created:

Save the showing.

Emit/trigger the appropriate event.

n8n handles notifications.

Potential notifications:

Agent notification

Receptionist confirmation

Prospect confirmation

Agent reminder

Prospect reminder

Do not embed notification provider-specific code throughout the scheduling logic.

22. CINC Integration

CINC is a future integration.

Do NOT make CINC required for the MVP.

The application should eventually support:

Importing properties

Pulling prospect information

Sending showing information

Updating lead information

Triggering CINC workflows

Use an integration/service boundary.

Preferred architecture:

Application
    |
    v
Scheduling Service
    |
    +---- CINC Integration
    |
    +---- n8n Integration

Do not spread CINC API calls across random UI components.

Keep external integrations isolated.

23. UI / Design Rules

The target users are non-technical employees.

Prioritize:

Large buttons

Clear labels

Obvious actions

Minimal steps

Good contrast

High readability

Clear confirmation states

Helpful error messages

Responsive design

Use familiar terminology.

Prefer:

Add Availability

over:

Create Availability Rule

Prefer:

Book Showing

over:

Create Appointment Record

Avoid technical language in user-facing UI.

24. UX Copy Rules

Use concise, practical wording.

Good:

Showing booked successfully.

Good:

Sarah is no longer available at this time. Please choose another agent.

Bad:

An unexpected scheduling conflict has occurred in the appointment resource allocation layer.

Do not expose technical implementation details to end users.

25. Errors and Empty States

Every important screen should have clear:

Loading state

Empty state

Error state

Success state

Example empty state:

No showings scheduled today.

Example availability empty state:

No agents are available at this time.

Give the receptionist a useful next action where possible.

Example:

No agents are available at 2:00 PM. Try 2:30 PM or find the next available agent.

26. Performance

Prioritize fast interactions.

Avoid unnecessary API calls.

Use server-side queries where appropriate.

Fetch only required data.

Index commonly queried database fields.

Common query patterns include:

Availability by agent/date

Available agents by time range

Showings by date

Showings by agent

Upcoming showings

Do not load the entire database into the browser.

27. Code Organization

Use clear separation between:

UI

Database access

Business logic

Authentication

Scheduling logic

Integrations

Utilities

Do not put complex scheduling logic directly inside page components.

Create reusable services/utilities for:

Availability calculations

Conflict detection

Booking validation

Timezone handling

Permission checks

28. TypeScript Rules

Use TypeScript throughout.

Avoid any unless absolutely necessary.

Prefer:

Explicit types

Shared database types

Typed function parameters

Typed API responses

Type-safe form validation

Do not silently suppress type errors.

If a type must be narrowed, do it explicitly.

29. Form Validation

Validate both client-side and server-side.

Validate:

Required fields

Valid dates

Valid times

End time after start time

Showing duration

Existing conflicts

Active agent status

Property validity

Never trust data coming from the client.

30. Business Logic Rules

Do not duplicate scheduling calculations in multiple places.

Create one source of truth for determining:

Is this agent available for this time range?

That function/service should consider:

Recurring availability

One-time availability

Exceptions

Existing bookings

Agent active status

Timezone

Avoid slightly different availability logic between:

Calendar UI

Search results

Booking form

API

Admin dashboard

They should use the same core business logic.

31. Data Integrity

Protect relationships with proper database constraints.

Use:

Foreign keys

Required fields

Appropriate indexes

Unique constraints where appropriate

Check constraints where useful

Do not rely solely on frontend behavior to maintain valid database state.

32. Development Phases

Build incrementally.

Phase 1 — Foundation

Implement:

Next.js

TypeScript

Tailwind

shadcn/ui

Supabase

Authentication

Role system

Initial database schema

Base application layout

Phase 2 — Agent Availability

Implement:

Weekly recurring availability

One-time availability

Unavailability

Agent calendar

Availability CRUD

Phase 3 — Receptionist Availability Search

Implement:

Agent availability overview

Date/time search

Available agent results

Next available search

Phase 4 — Showing Management

Implement:

Create showing

Conflict detection

Double-booking prevention

View showings

Cancel showing

Reschedule showing

Phase 5 — Admin

Implement:

Agent management

Availability management

Showing oversight

Phase 6 — n8n

Implement:

Webhook/event layer

Showing notifications

Availability events

Phase 7 — CINC

Only after CINC API/OAuth configuration is ready:

CINC property sync

Prospect sync

Showing sync

Relevant automation workflows

33. MVP Scope

Do not expand the MVP unnecessarily.

The MVP must include:

Authentication

Login

Roles

Agent

View schedule

Add availability

Edit availability

Add unavailability

View bookings

Receptionist

View agent availability

Search availability

Create showing

View upcoming showings

Cancel showing

Reschedule showing

Admin

Manage agents

View all schedules

View bookings

Database

Supabase/PostgreSQL

Relationships

RLS

Conflict prevention

Do not build advanced analytics during the MVP.

34. Future Features

The architecture should allow future additions such as:

SMS notifications

Email notifications

Google Calendar integration

Microsoft/Outlook Calendar integration

CINC integration

n8n workflows

Prospect reminders

Agent reminders

Showing confirmation workflows

Property synchronization

Reporting

Agent workload statistics

No-show tracking

Do not build these prematurely.

35. Testing Rules

Test business-critical functionality.

At minimum, test:

Availability

Recurring availability

One-time availability

Exceptions

Overnight/edge cases if supported

Timezone conversion

Booking

Valid booking

Booking outside availability

Booking during unavailable period

Booking overlapping an existing booking

Simultaneous booking attempts

Permissions

Agent accessing own data

Agent attempting another agent's data

Receptionist access

Admin access

Data integrity

Invalid references

Missing required values

Cancelled bookings

Rescheduled bookings

36. Do Not Do These Things

Do not:

Build a complicated CRM.

Make CINC required for the first version.

Assume agent schedules are fixed.

Require agents to manually update availability every day.

Allow double-booking.

Put business logic only in frontend code.

Expose secrets.

Use shared credentials.

Add unnecessary dependencies.

Create excessive animations.

Overcomplicate the navigation.

Use technical jargon in the user-facing interface.

Duplicate scheduling logic in multiple components.

Hardcode timezone assumptions.

Build advanced analytics before the core scheduler is stable.

37. Decision-Making Rules

When there are multiple implementation options, prefer the option that is:

More reliable

Easier for employees to use

Faster

Easier to maintain

Easier to extend

Simpler

Do not choose complexity merely because it looks more sophisticated.

38. Agent Experience Requirement

An agent should be able to understand the availability page without documentation.

The basic interaction should feel like:

When can you show properties?

Then:

Monday
09:00–17:00

Tuesday
09:00–17:00

Wednesday
12:00–18:00

and so on.

The agent should not have to understand the technical concept of recurring rules, database records, or scheduling algorithms.

39. Receptionist Experience Requirement

A receptionist should be able to handle a live prospect call.

Example:

Prospect:

Can I see the property tomorrow around 2 PM?

Receptionist workflow:

Open New Showing.

Select property.

Select date.

Select 2:00 PM.

Select duration.

Immediately see available agents.

Book the showing.

The system should make this workflow as close to instant as reasonably possible.

40. Project Architecture Goal

The long-term architecture should look approximately like:

                    ┌────────────────────┐
                    │  Agent Portal      │
                    │ Availability       │
                    └─────────┬──────────┘
                              │
                              v
                    ┌────────────────────┐
                    │     Supabase       │
                    │ PostgreSQL + Auth  │
                    └─────────┬──────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                v                           v
      ┌──────────────────┐        ┌──────────────────┐
      │ Receptionist     │        │ Admin Portal     │
      │ Scheduler        │        │ Management       │
      └────────┬─────────┘        └──────────────────┘
               │
               v
      ┌──────────────────┐
      │ Scheduling Logic │
      │ Availability     │
      │ Conflict Checks  │
      └────────┬─────────┘
               │
        ┌──────┴──────┐
        │             │
        v             v
     n8n Layer     CINC Layer
        │             │
        v             v
    Notifications   Future API

41. Definition of Done

A feature is not considered complete simply because it works visually.

A feature is complete when:

It works end-to-end.

It is type-safe.

It has appropriate validation.

It respects user permissions.

It does not expose secrets.

It handles errors.

It has appropriate loading/empty states.

It does not introduce avoidable technical debt.

Core scheduling logic remains centralized.

Relevant database constraints/RLS policies are implemented.

The UX remains simple for non-technical users.

42. How Claude Should Work on This Project

Before making significant changes:

Inspect the existing project structure.

Understand the current architecture.

Reuse existing components/utilities where appropriate.

Avoid unnecessary rewrites.

Identify dependencies and side effects.

Make the smallest clean change that solves the problem.

When adding a feature:

Explain the intended change briefly.

Implement it.

Check affected types and business logic.

Check permissions/security.

Test the relevant workflow.

Check for regressions.

When fixing bugs:

Identify the actual root cause.

Fix the underlying issue.

Do not mask symptoms with frontend hacks.

Add or update tests where appropriate.

43. Final Priority

This application should ultimately feel like:

One simple place where Camelot can manage agent availability and schedule property showings.

The receptionist should no longer have to:

Search multiple schedules.

Message agents asking if they are available.

Manually compare schedules.

Delay prospects while trying to find someone.

Instead:

Enter property → choose date/time → see available agents → book.

Agents should only need to:

Set availability → receive bookings → show the property.

Keep the system simple, dependable, and easy to maintain.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
