# Organization application work

- Preserve per-organization membership, private budget visibility, owner-only team controls, and role-based finance access.
- Implement workspace UI and notifications inside organization routes. Do not redesign the personal workspace unless the user asks.
- For every user-facing organization feature or behavior change, add a short, helpful card with a new stable ID to `lib/organizations/releases.ts`. Explain what changed and where members can use it. Never reuse or rename released IDs, and never put private organization data or credentials into release cards.
- Organization activity notifications must identify the real actor and target only the relevant recipients. Finance, invitation, and team activity is owner-only unless a notification is explicitly about the receiving member.
- Verify authentication, privacy and financial workflow changes with the relevant isolated-database smoke scripts and a production build. Never send real test email without explicit authorization.
