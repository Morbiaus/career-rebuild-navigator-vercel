# AI Agent Support Roadmap

This roadmap moves Career Rebuild Navigator from browser-based workflow logic to true AI-agent support.

## Current State

The current MVP is functional and professional for controlled use:

- Static Vercel site
- Browser-based workflow logic
- Public job-source link generation
- Job Fit Review
- CV Review
- Application Package generation
- Placement Case Manager using browser local storage
- Automated Playwright usability tests

## Why We Need a Test Environment First

Before adding real AI agents, the workflow must be stable. AI should improve a working process, not hide a broken one.

The automated test environment now checks:

- Page availability
- Navigation from Mission Control
- Market Search output
- Job Fit Review output and handoff controls
- Case Manager role intake and next-action display

## Phase A: Protected LLM API Routes

Add serverless API routes for AI-powered analysis:

- `/api/ai-cv-review`
- `/api/ai-job-fit-review`
- `/api/ai-application-package`
- `/api/ai-case-manager-advice`

API keys must be stored as Vercel environment variables, never in GitHub.

## Phase B: Agent Roles

Recommended agent structure:

1. Candidate Intake Agent
2. Market Search Strategy Agent
3. CV Review Agent
4. Job Fit Review Agent
5. CV Optimization Agent
6. Application Package Agent
7. Placement Case Manager Agent
8. QA / Truthfulness Agent

## Phase C: Data Persistence

Move from browser local storage to a real database:

- Supabase or Neon Postgres
- User profiles
- Saved roles
- Fit reviews
- Application packages
- Follow-up dates
- Case manager notes

## Phase D: Security and Privacy

Before accepting real user documents at scale:

- Add authentication
- Add privacy policy and terms
- Add document retention controls
- Add delete-my-data workflow
- Add audit logging
- Add secure file upload and parsing

## Phase E: Human-in-the-Loop Controls

Every agent output should include:

- Evidence basis
- Assumptions
- Claims safe to use
- Claims requiring confirmation
- Next recommended action
- Human approval before application

## Recommended Next Build

The next build should add one protected AI route first:

`/api/ai-job-fit-review`

This is the highest-value agent because it decides whether to apply, optimize first, or drop the role.
