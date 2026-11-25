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
