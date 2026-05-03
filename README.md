# Career Rebuild Navigator

Career Rebuild Navigator is a professional MVP for helping displaced professionals run a disciplined job-search campaign. It models the operating workflow of a placement team: market search, job-fit review, CV review, application packaging, and case management.

Live site: https://career-rebuild-navigator-vercel.vercel.app/

## Product Workflow

1. **Readiness Check** — explains the required sequence and quality gates.
2. **Market Search Command Center** — generates compliant search links across professional job markets, company ATS systems, recruiter sites, and niche boards.
3. **Quick Job Assessment** — performs a lightweight target-role search against available public feeds.
4. **CV Review Agent** — reviews a full CV against a target lane.
5. **Job-Specific CV Fit Review** — compares the full CV to a real job description and routes the candidate to apply, tailor, optimize, or treat as a stretch.
6. **Application Package Agent** — drafts recruiter outreach, cover letter outline, interview prep, checklist, safe claims, softened claims, and follow-up plan.
7. **Placement Case Manager** — tracks serious roles, source, fit status, CV status, application package status, application status, follow-up dates, and next actions.

## Responsible Use

- The site is a career-support workflow prototype, not a staffing agency or employer.
- It does not guarantee interviews, offers, or employment.
- Users should verify every job posting at the source.
- Users should remove sensitive personal identifiers before pasting CV content.
- All generated language must be reviewed by a human before use.
- Users should not make unsupported claims about experience, credentials, or accomplishments.

## Current Architecture

- Static HTML pages hosted on Vercel.
- Browser-based rule logic for CV review, fit review, package generation, and case management.
- Local browser storage for the Placement Case Manager pipeline.
- Serverless route for public job-feed search where available.
- No user accounts and no central database in this MVP version.

## Pages

- `/` — Mission Control
- `/ready-check` — Readiness and workflow guide
- `/market-search` — Professional sourcing link generator
- `/assessment` — Quick job assessment
- `/cv-review` — Lane-based CV review
- `/job-fit-review` — CV versus job description fit review
- `/application-package` — Application package builder
- `/case-manager` — Placement case manager pipeline
- `/privacy` — Privacy and responsible use notice

## Recommended Next Technical Enhancements

- Protected LLM API routes for higher-quality resume and cover-letter generation.
- Database-backed user accounts for persistent pipeline management.
- Secure document upload and parsing.
- More robust job data integrations with approved APIs.
- Export to PDF for packages and case reports.
- Admin analytics for product usage and workflow drop-off.
