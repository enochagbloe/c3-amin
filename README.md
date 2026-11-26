# C3 Church budget manager

A full-stack Next.js app for church budgets, income, expense approvals, organizations, and chat history. All persistent data uses PostgreSQL through Prisma. MongoDB is no longer required.

## Local setup

Use Node.js 22, run `npm ci`, and create a git-ignored `.env` with:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler/DATABASE?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
AUTH_SECRET=GENERATE_A_RANDOM_SECRET
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
```

Run `npm run db:deploy`, then `npm run dev`. Create your account at `/sign-up`. A new database starts empty; old MongoDB accounts and chat history are not automatically imported.

`OPEN_AI_KEYS` is optional and must contain an OpenRouter API key for AI requests. Without it, AI endpoints return 503; the budget features remain available. Never commit credentials.

## Render + Neon

Create a Render Node web service from this repository, branch `main`:

- Build: `npm ci --include=dev && npm run build`
- Start: `npm run db:deploy && npm start -- --hostname 0.0.0.0 --port $PORT`
- Health check: `/api/health`
- Environment: `NODE_VERSION=22`, `AUTH_URL` set to the Render public URL, and the variables listed above. Use the pooled Neon connection for `DATABASE_URL` and the direct connection for `DIRECT_URL`.

The deployment uses a separate Neon project named `c3-budget`. Existing databases are not modified. The deployment runs versioned Prisma migrations, never `db push` or a reset.

## Verification

`npm run build` checks the production build. `npm run test:db` verifies PostgreSQL account/user relationships, password hashing, organization membership, expense approval, income, and chat cascading deletes inside a transaction that is rolled back. It requires a configured `.env`.

## Organization budget requests

Open an organization and choose **Budget requests**. The dashboard also has **Request budget** and **Request history** buttons. This workflow is only available inside an organization.

The organization owner sets the **Budget approval settings** on the organization Settings page: one first-stage budget reviewer (the owner by default) and a different final-stage pastor. Members submit a title, purpose, amount, currency, and optional needed-by date. They cannot choose or override approvers.

Requests progress from `PENDING_MAIN` to `PENDING_SECOND` to `APPROVED`. Either approver can reject at their own stage with a reason. Final decisions cannot be changed. The requester, organization owner, and assigned approvers can read the request and its decision history; other members, including unassigned admins, cannot. Requests are kept separate from shared expense tables. Approval authorizes the budget; it does not record a payment or expenditure.

Approvers work from **Needs my approval**; the pastor receives the request there only after the first approval. **Oversight** shows everything the current user may see, and **My requests** preserves the member’s request history. An assigned reviewer may give first approval to their own request; final approval must come from a different person and cannot be given by the requester. The owner can assign another approver in settings if necessary. Settings changes reroute unfinished stages and add an audit event, preserving completed decisions.

Endpoints (authenticated organization membership required):

- `GET/POST /api/organizations/:id/budget-requests` — scoped history / submit a request.
- `GET /api/organizations/:id/budget-requests/:requestId` — private details and history.
- `POST /api/organizations/:id/budget-requests/:requestId/decision` — `{ decision: "APPROVED" | "REJECTED", comment?: string }`.
- `GET/PUT /api/organizations/:id/budget-approval-settings` — read route / owner-only assignment `{ reviewerId, pastorId }`.

Run workflow tests against an isolated Neon branch and a local server using that branch: `node --env-file=.env.budget-test scripts/budget-requests-smoke.cjs`. The test creates and deletes its own fixture organizations and users. Never point the test at a server using a different database. It checks automatic routing, private access, owner permissions, sequential approvals, race conditions, rejection, self-approval, reassignment and audit history.

## Team invitations and member permissions

The organization owner opens **Settings → Team** to invite members by email, inspect pending invitations, resend or revoke links, check delivery, and remove members. New invitations always grant the restricted `MEMBER` role after acceptance; requesting a different role in the invitation payload cannot elevate access.

Owners can choose **Settings → Team → Share a link**, enter the intended member's email, and copy a private invitation URL. This works without Resend or a verified sender domain and sends no email. The recipient signs in or creates an account using that email and accepts the invitation. Links expire after seven days and grant only `MEMBER` access. **Create new link** replaces a pending invitation's previous link; revocation disables it. Only token hashes are stored; raw links are returned to the owner once on creation and never in invitation listings.

Configure Resend on the server, never in the UI. Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to your gitignored `.env` for local development and to the Render service environment for production, then restart/redeploy. The sender must be an email address on your verified Resend domain. See `.env.example` for placeholders. Keys are server-only and are never returned by the API. Existing database email settings are no longer used, and the API no longer accepts key updates. `SENT` means Resend accepted the email; **Check delivery** retrieves the latest provider event (requires email read permission).

Invitation links expire after seven days, store only a token hash, and must be accepted while signed in with the invited email. Opening the link never consumes it. Reissuing an invitation invalidates the previous link, and revocation immediately prevents acceptance. Existing accounts sign in; new users sign up and return to the invitation. Membership is not granted just because an email was sent.

| Organization role | Available access |
| --- | --- |
| Owner | Team management, approval assignments, all budget requests, organization finance and settings |
| Admin | Organization finance and their permitted budget requests; no team or email setup |
| Member / Viewer | Personal settings and their own budget requests |
| Assigned reviewer / pastor | Adds assigned budget visibility and the applicable approval stage; does not grant finance access |

Members are redirected to their organization dashboard on normal sign-in and cannot access the old finance navigation through the personal workspace. Organization finance pages, income/expense endpoints, financial AI, organization detail data, roster access, and financial server actions enforce permissions independently of the navigation. Workspace listings omit financial records for restricted members. Personal finance queries are scoped to their author and never include organization records. Profile updates cannot change email, role, or status through the personal settings API.

The invitation/permission integration test is `scripts/team-smoke.cjs`. Run it only against an isolated database and a local server configured with an explicit test-only Resend adapter. Its Resend responses are simulated and no real email is sent. The production app always calls Resend’s fixed HTTPS API.

To run the invitation checks locally (PowerShell), first build the app and provide a separate `.env.budget-test` pointing to an isolated migrated database. In one terminal:

```powershell
$env:TEAM_TEST_OUTBOX = Join-Path $env:TEMP 'c3-team-test-outbox.jsonl'
node --env-file=.env.budget-test --require ./scripts/testing/resend-preload.cjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000
```

In another terminal, set the same `TEAM_TEST_OUTBOX` path and run `node --env-file=.env.budget-test scripts/team-smoke.cjs`. The preloader only runs when explicitly supplied to Node; production startup does not load it. It intercepts Resend calls for isolated tests and captures test email payloads locally.

The owner may assign any active organization member as reviewer and change that assignment in Settings → Organization. Assigned reviewers may first-approve their own requests and forward them to the final pastor. Final self-approval remains forbidden.

## Cash handover and confirmed expenses

Final approval does not create an expense. The request retains its approval status and has a separate cash status:

1. `NOT_RELEASED`: the assigned reviewer records collecting the full approved amount, optionally adding a voucher/reference.
2. `WITH_REVIEWER`: the same assigned reviewer records handing the cash to the requester.
3. `AWAITING_RECEIPT`: only the requester can confirm receiving the full amount.
4. `RECEIVED`: one approved organization expense is recorded for the organization owner, with the approved amount, currency and confirmation date.

`POST /api/organizations/:id/budget-requests/:requestId/cash` accepts `{ action: "RECEIVE_FUNDS" | "HAND_OVER" | "CONFIRM_RECEIPT", reference?: string }`. Amounts and recipients cannot be supplied by clients. All transitions require final approval and are audited with actor and server timestamp. Receipt confirmation and expense creation run in one serializable transaction, protected by a unique budget-to-expense link. Retrying confirmation is idempotent. Confirmed budget expenses cannot be deleted or have their status changed through ordinary expense actions. Cash handling remains with the request's assigned reviewer after approval; changing organization approval settings changes only unfinished approval stages.

Dashboard activity and the notification bell refresh every 30 seconds and on focus. `GET /api/organizations/:id/budget-requests/summary` returns only visible request totals, current tasks and recent decisions. `GET/PATCH /api/organizations/:id/notifications` lists and marks only the current member's visible notifications. New request, approval, reassignment and cash events notify the relevant participants in-app. No new email delivery or cash transfer is initiated by these features. Notifications do not reveal requests after the recipient loses access.

Run `node --env-file=.env.budget-test scripts/cash-receipts-smoke.cjs` against the matching isolated local server. It covers permissions, ordering, private notifications, no expense before requester confirmation, currency, and duplicate/concurrent confirmations. Existing expense currencies default to USD; newly confirmed requests keep their explicitly selected currency and expense totals display separate currency groups.
