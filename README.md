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

Approvers work from **Needs my approval**; the pastor receives the request there only after the first approval. **Oversight** shows everything the current user may see, and **My requests** preserves the member’s request history. Nobody can approve their own request. The owner can assign another approver in settings if necessary. Settings changes reroute unfinished stages and add an audit event, preserving completed decisions.

Endpoints (authenticated organization membership required):

- `GET/POST /api/organizations/:id/budget-requests` — scoped history / submit a request.
- `GET /api/organizations/:id/budget-requests/:requestId` — private details and history.
- `POST /api/organizations/:id/budget-requests/:requestId/decision` — `{ decision: "APPROVED" | "REJECTED", comment?: string }`.
- `GET/PUT /api/organizations/:id/budget-approval-settings` — read route / owner-only assignment `{ reviewerId, pastorId }`.

Run workflow tests against an isolated Neon branch and a local server using that branch: `node --env-file=.env.budget-test scripts/budget-requests-smoke.cjs`. The test creates and deletes its own fixture organizations and users. Never point the test at a server using a different database. It checks automatic routing, private access, owner permissions, sequential approvals, race conditions, rejection, self-approval, reassignment and audit history.
