# C3-Amin Copilot Instructions

## Project Overview
C3-Amin is a **Next.js 15 full-stack admin dashboard** for budget tracking and expense management with user authentication. It combines a modern React frontend with MongoDB/PostgreSQL backends and uses NextAuth v5 for authentication.

**Key Tech Stack:**
- Frontend: Next.js 15 (App Router), React 19, Tailwind CSS, Shadcn UI
- Authentication: NextAuth v5 (Credentials + OAuth support)
- Database: MongoDB (Mongoose) for users/accounts + PostgreSQL (Prisma) for expenses
- Validation: Zod schemas
- Forms: React Hook Form + Shadcn UI form components

---

## Architecture & Data Flow

### Authentication Flow
1. **NextAuth v5 Configuration** (`auth.ts`):
   - Credentials provider for email/password login
   - Callbacks: `session` (attach userId), `jwt` (fetch user from DB), `signIn`
   - Uses `bcryptjs` for password hashing (12 rounds)

2. **Action Handler** (`lib/handler/action.ts`):
   - Wraps server actions for validation, auth checks, and DB connections
   - Returns `{ params, session }` on success or error objects
   - Use pattern: `const result = await action({ params, schema, authorize: true, useMongo: true })`

3. **Error Handling** (`lib/http.error.ts`):
   - Custom error classes: `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`
   - API responses use `handleError()` which formats errors consistently
   - Returns `{ success: false, error: { message, details } }`

### Database Schema
- **MongoDB (Mongoose)**:
  - `User`: name, username (unique), email (unique), bio, image, location, portfolio, reputation
  - `Account`: userId (ref), provider, providerAccountId, password (hashed), image
  
- **PostgreSQL (Prisma)**:
  - `ExpenseTracker`: id, name, amount, date, status (pending/approved/rejected), description, author (user ID)
  - Uses CUID for IDs with date/author indices

### API Layer Pattern
All API endpoints structured in `lib/api.ts`:
```typescript
export const api = {
  users: { getAll(), getById(id), getByEmail(email), create(), update(), delete() },
  accounts: { getAll(), getById(id), getByProvider(id), create(), update(), delete() },
  ai: { getAnswer(question, content, userAnswer) }
}
```
Uses `fetchHandler` from `lib/handler/fetch.ts` for consistent HTTP handling.

---

## Project-Specific Conventions

### Validation Patterns
- All schemas use **Zod** with discriminated unions for conditional logic
- Password schema enforces: min 6 chars, uppercase, lowercase, number, special char
- Expense status: "pending" | "approved" | "rejected"
- Use `z.preprocess()` for date parsing from form inputs
- Use `z.discriminatedUnion()` for payment methods (mobile vs bank transfer)

### Server Actions & Type Safety
- Mark all server-side functions with `"use server"`
- Use `ActionResponse<T>` type: `{ success: boolean, data?: T, error?: ErrorResponse }`
- Always wrap with `action()` handler for auth/validation
- Example: See `lib/actions/auth.actions.ts` for transaction patterns

### Form Component Pattern (see `components/forms/AuthForms.tsx`)
- Generic typed component using React Hook Form
- Accepts `schema` (Zod), `defaultValues`, `formType`, and `onSubmit` callback
- Uses Sonner for toast notifications on success/error
- Redirects to ROUTES.HOME on success

### Environment Variables
- `DATABASE_URL`: Mongoose connection string
- `NEXT_PUBLIC_API_BASE_URL`: Defaults to `http://localhost:3000/api`
- Session callback automatically attaches user ID to session

---

## Critical Developer Workflows

### Local Development
```bash
pnpm dev           # Start with Turbopack (runs on port 3000)
pnpm build         # Build with Turbopack
pnpm start         # Start production server
pnpm lint          # Run ESLint
```

### Database Migrations
- **MongoDB**: Direct model creation in `database/*.model.ts`
- **PostgreSQL/Prisma**:
  ```bash
  npx prisma migrate dev --name description
  npx prisma generate  # (auto-runs on dev)
  ```
  Migrations stored in `prisma/migrations/`

### Build Configuration
- Turbopack enabled by default in `next.config.ts`
- `serverExternalPackages`: pino, pino-pretty, zod (required for server-side use)
- Path alias: `@/*` maps to workspace root

---

## Integration Points

### NextAuth Middleware
- Defined in `middleware.ts`: `export { auth as middleware }`
- Protects routes at request level; protected pages redirect to `/sign-in`
- Check session in pages: `const session = await auth()`

### Component Library (Shadcn UI)
- Components in `components/ui/` (button, form, dialog, etc.)
- Use `FormField` + `FormControl` + `FormItem` pattern for forms
- Dialog components: `approveDialog.tsx`, `deleteDialog.tsx`, `make-paymentDialog.tsx`

### Data Tables
- `components/ReuableDataTable.tsx` for generic data display
- Column definitions in separate `columns.tsx` files (see `app/(root)/budgetTracker/columns.tsx`)
- Uses TanStack React Table v8

### Navigation Structure
- Left sidebar: `components/Nav/LeftSideBar.tsx`
- Top navbar: `components/Nav/navbar.tsx`
- Route navigation uses `next/navigation` useRouter

---

## Common Implementation Tasks

### Adding a New Page/Feature
1. Create route folder: `app/(root)/[feature]/page.tsx`
2. Wrap in layout if needed: `app/(root)/[feature]/layout.tsx`
3. Create API endpoint: `app/api/[feature]/route.ts`
4. Define Zod schema in `lib/validations.ts`
5. Create server action in `lib/actions/[feature].actions.ts`
6. Create form component in `components/forms/[Feature]Form.tsx`
7. Add route constant to `constant/route.ts`

### Creating an API Endpoint
```typescript
// app/api/feature/route.ts
import handleError from "@/lib/handler/error";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // validation + logic
    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return handleError(error, "api");
  }
}
```

### Adding Protected API Routes
- Use `middleware.ts` to protect at request level
- Or check session inside handler: `const session = await auth()`
- Return `UnauthorizedError()` if not authorized

---

## Key Files Reference
- **Entry Points**: `auth.ts` (auth config), `middleware.ts` (protection), `app/layout.tsx` (root layout)
- **Type Definitions**: `types/action.d.ts`, `types/global.d.ts`
- **Utilities**: `lib/utils.ts`, `lib/logger.ts` (Pino), `lib/mongoose.ts`
- **Database Models**: `database/user.model.ts`, `database/account.model.ts`
- **Routes Config**: `constant/route.ts`, `constant/index.ts`

---

## Notes for AI Agents
- Always check for existing schemas in `lib/validations.ts` before creating new ones
- When adding features, prefer reusing `ReuableDataTable.tsx` and form patterns
- Use `pnpm` for package management (monorepo support via `pnpm-workspace.yaml`)
- Ensure all server functions are marked `"use server"`
- Turbopack compilation: builds are fast; watch out for caching during development
- MongoDB and PostgreSQL coexist—verify which DB a feature should use
