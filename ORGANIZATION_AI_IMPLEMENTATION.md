# Organization AI Implementation Guide

## Overview
This document explains how the AI feature was implemented to support both **Personal AI** (for individual users) and **Organization AI** (for organization-specific financial management).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
├─────────────────────────────────────────────────────────────┤
│  Personal Chat Page          │  Organization Chat Page       │
│  /app/(root)/prompt          │  /app/org/[id]/propmt        │
│  ChatProvider (no orgId)     │  ChatProvider (with orgId)   │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Endpoints                            │
├─────────────────────────────────────────────────────────────┤
│  Personal AI                 │  Organization AI              │
│  /api/ai/chats              │  /api/ai/organization/[orgId]│
│  - No organization context   │  - Verifies membership       │
│  - Personal data only        │  - Organization context      │
│  - Personal prompts          │  - Org-specific prompts      │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Handlers                               │
├─────────────────────────────────────────────────────────────┤
│  Personal Handlers           │  Organization Handlers        │
│  /lib/ai/handlers.ts         │  /lib/ai/handlers.ts         │
│  - handleAddExpense          │  - handleOrgAddExpense       │
│  - handleAddIncome           │  - handleOrgAddIncome        │
│  - handleQuerySpending       │  - handleOrgQuerySpending    │
│  - handleQueryIncome         │  - handleOrgQueryIncome      │
│  - handleFinancialSummary    │  - handleOrgFinancialSummary │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
├─────────────────────────────────────────────────────────────┤
│  - ExpenseTracker (with organizationId field)               │
│  - Income (with organizationId field)                       │
│  - ChatSession (with organizationId field)                  │
│  - Organization (with members relation)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### Step 1: Database Schema Updates

#### 1.1 Updated Prisma Schema
**File**: `prisma/schema.prisma`

Added `organizationId` to existing models:

```prisma
model ExpenseTracker {
  // ... existing fields
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@index([organizationId])
}

model Income {
  // ... existing fields
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@index([organizationId])
}
```

#### 1.2 Updated MongoDB Schema
**File**: `database/chatSession.model.ts`

```typescript
export interface IChatSession {
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;  // Optional organization context
  title: string;
  messages: IChatMessage[];
  isPinned: boolean;
}
```

**Key Point**: `organizationId` is optional. When `null/undefined`, it's a personal chat.

---

### Step 2: AI Prompts for Organization Context

**File**: `lib/ai/prompts.ts`

#### 2.1 Organization Context Type
```typescript
interface OrganizationContext {
  organizationId: string;
  organizationName: string;
  industry: string;
  userRole: string;
  memberCount: number;
}
```

#### 2.2 Organization-Specific System Prompt
```typescript
export const ORG_SYSTEM_PROMPT = (orgContext: OrganizationContext) => `
You are C3-Amin AI for **${orgContext.organizationName}**, 
a ${orgContext.industry} organization.

## CRITICAL: Organization Mode
All financial queries are for THIS ORGANIZATION ONLY, not personal finances.
When user says "we", "our", they mean the organization.

## Organization Context:
- Name: ${orgContext.organizationName}
- Industry: ${orgContext.industry}
- Your Role: ${orgContext.userRole}
- Team Size: ${orgContext.memberCount} members

## Industry-Specific Insights:
${getIndustryPrompt(orgContext.industry)}
...
`;
```

#### 2.3 Industry-Specific Prompts
Created different prompt additions for each industry:
- CHURCH: Track tithes, offerings, donations
- NON_PROFIT: Track grants, program expenses
- RETAIL: Track inventory, sales revenue
- SOFTWARE: Track SaaS metrics, development costs
- etc.

#### 2.4 Organization Analytics Prompt
```typescript
export const ORG_ANALYTICS_PROMPT = (financialData: {
  totalExpenses: number;
  totalIncome: number;
  pendingExpenses: number;
  approvedExpenses: number;
  rejectedExpenses: number;
  // ...
}) => `
## Organization Financial Snapshot:
- Total Expenses: $${financialData.totalExpenses.toFixed(2)}
- Expense Status: ${financialData.pendingExpenses} pending, 
  ${financialData.approvedExpenses} approved
...
`;
```

---

### Step 3: Organization-Specific AI Handlers

**File**: `lib/ai/handlers.ts`

#### 3.1 Handler Context Interface
```typescript
interface OrganizationHandlerContext {
  organizationId: string;
  organizationName?: string;
  userRole?: string;
}
```

#### 3.2 Organization Handlers (Examples)

**Add Organization Expense**:
```typescript
export async function handleOrgAddExpense(
  parsed: ParsedIntent,
  orgContext: OrganizationHandlerContext
): Promise<HandlerResult> {
  // Parse user input
  const { name, amount, date, description } = parsed.data;
  
  // Create expense with organizationId
  const expense = await createBudgetExpense({
    name,
    amount: String(amount),
    date,
    description,
    organizationId: orgContext.organizationId,  // 🔑 Key: Add org context
  });
  
  return {
    success: true,
    data: `✅ Added ${formatCurrency(amount)} to ${orgContext.organizationName}`,
    metadata: { expense: expense.data, organizationId: orgContext.organizationId }
  };
}
```

**Query Organization Spending**:
```typescript
export async function handleOrgQuerySpending(
  parsed: ParsedIntent,
  orgContext: OrganizationHandlerContext
): Promise<HandlerResult> {
  const { period, status } = parsed.data;
  const { start, end } = getDateRange(period);
  
  // Query with organizationId filter
  const expenses = await prisma.expenseTracker.findMany({
    where: {
      date: { gte: start, lte: end },
      organizationId: orgContext.organizationId,  // 🔑 Filter by org
      ...(status && { status })
    }
  });
  
  // Return organization-specific data
  return {
    success: true,
    data: `${orgContext.organizationName} spent ${total} this ${period}`,
    metadata: { organizationId: orgContext.organizationId }
  };
}
```

**Get Organization Financial Context**:
```typescript
export async function getOrgFinancialContext(
  organizationId: string,
  period: string = "month"
) {
  const { start, end } = getDateRange(period);
  
  // Fetch ONLY organization data
  const expenses = await prisma.expenseTracker.findMany({
    where: { 
      date: { gte: start, lte: end },
      organizationId  // 🔑 Filter by organization
    }
  });
  
  const incomeRecords = await prisma.income.findMany({
    where: { 
      date: { gte: start, lte: end },
      organizationId  // 🔑 Filter by organization
    }
  });
  
  // Calculate status counts
  const pendingExpenses = expenses.filter(e => e.status === "pending").length;
  const approvedExpenses = expenses.filter(e => e.status === "approved").length;
  
  return {
    totalExpenses,
    totalIncome,
    pendingExpenses,
    approvedExpenses,
    // ... more org-specific metrics
  };
}
```

---

### Step 4: Organization AI Endpoint

**File**: `app/api/ai/organization/[orgId]/route.ts`

#### 4.1 POST Handler Flow

```typescript
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  
  // 1️⃣ Authenticate user
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // 2️⃣ Verify user is member of organization
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: orgId,
      },
    },
  });
  
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }
  
  // 3️⃣ Get organization details
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { members: true },
  });
  
  // 4️⃣ Build organization context
  const orgContext = {
    organizationId: orgId,
    organizationName: organization.name,
    industry: organization.industry,
    userRole: membership.role,
    memberCount: organization.members.length,
  };
  
  // 5️⃣ Build enhanced prompt with org context
  let enhancedSystemPrompt = ORG_SYSTEM_PROMPT(orgContext);
  
  // 6️⃣ Add financial context
  if (includeFinancialContext) {
    const financialData = await getOrgFinancialContext(orgId, "month");
    if (financialData) {
      enhancedSystemPrompt += "\n\n" + ORG_ANALYTICS_PROMPT(financialData);
    }
  }
  
  // 7️⃣ Call AI with organization-aware prompt
  const completion = await client.chat.send({
    model: selectedModel,
    messages: [
      { role: "system", content: enhancedSystemPrompt },
      { role: "user", content: message },
    ],
  });
  
  // 8️⃣ Parse AI response
  const parsed = safeJSON(completion.choices[0].message.content);
  
  // 9️⃣ Route to organization-specific handlers
  switch (parsed.intent) {
    case "add_expense":
      return await handleOrgAddExpense(parsed, orgContext);
    
    case "query_spending":
      return await handleOrgQuerySpending(parsed, orgContext);
    
    case "approval_status":
      // Organization-specific: Check pending expenses
      const pendingExpenses = await prisma.expenseTracker.findMany({
        where: { organizationId: orgId, status: "pending" }
      });
      return { data: `${pendingExpenses.length} pending expenses` };
    
    // ... more org-specific intents
  }
}
```

#### 4.2 Key Differences from Personal AI

| Aspect | Personal AI | Organization AI |
|--------|-------------|-----------------|
| **Endpoint** | `/api/ai/chats` | `/api/ai/organization/[orgId]` |
| **Authorization** | User session only | User session + org membership |
| **Data Filtering** | `organizationId: null` | `organizationId: orgId` |
| **System Prompt** | `SYSTEM_PROMPT` | `ORG_SYSTEM_PROMPT(orgContext)` |
| **Context** | Personal finances | Org name, industry, role, team size |
| **Intents** | Basic financial | + approval_status, team_analytics |

---

### Step 5: Organization Chat Page

**File**: `app/org/[id]/propmt/page.tsx`

#### 5.1 Key Implementation Details

```typescript
const OrgChatPage = () => {
  const params = useParams();
  const orgId = params.id as string;  // Get org ID from URL
  
  const handleSubmit = async () => {
    // Use organization-specific endpoint
    const response = await fetch(`/api/ai/organization/${orgId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        context: previousContext,
        includeFinancialContext: true,
      }),
    });
    
    const result = await response.json();
    // result.organizationName
    // result.organizationId
    // result.data (AI response)
  };
  
  return (
    <ChatProvider organizationId={orgId} organizationName={organizationName}>
      {/* Organization-specific UI */}
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h1>{organizationName} AI Assistant</h1>
      </div>
      
      {/* Organization-specific shortcuts */}
      <button onClick={() => setPrompt("How much did we spend this month?")}>
        💰 Organization spending
      </button>
      <button onClick={() => setPrompt("Show pending expenses")}>
        ⏳ Pending approvals
      </button>
      
      {/* Chat interface */}
    </ChatProvider>
  );
};
```

---

### Step 6: Chat History Separation

**File**: `lib/context/ChatContext.tsx`

#### 6.1 Context Provider Props
```typescript
interface ChatProviderProps {
  children: React.ReactNode;
  organizationId?: string;      // 🔑 Determines context
  organizationName?: string;
}

export function ChatProvider({ 
  children, 
  organizationId, 
  organizationName 
}: ChatProviderProps) {
  // Load sessions based on organizationId
  useEffect(() => {
    const loadSessions = async () => {
      const result = await getChatSessions({ organizationId });
      // Returns ONLY sessions matching this context
      setSessions(result.data);
    };
    loadSessions();
  }, [organizationId]);  // Reload when org changes
  
  // Create sessions with org context
  const createSession = useCallback(() => {
    const newSession: ChatSession = {
      // ... other fields
      organizationId,      // 🔑 Tag session with org
      organizationName,
    };
    setSessions(prev => [newSession, ...prev]);
  }, [organizationId, organizationName]);
}
```

#### 6.2 Database Query Filtering
**File**: `lib/actions/chat.actions.ts`

```typescript
export async function getChatSessions(params: { organizationId?: string }) {
  const { organizationId } = params;
  const userId = session?.user?.id;
  
  const query: Record<string, unknown> = { userId };
  
  if (organizationId) {
    // Organization chats
    query.organizationId = new mongoose.Types.ObjectId(organizationId);
  } else {
    // Personal chats (organizationId is null or doesn't exist)
    query.$or = [
      { organizationId: { $exists: false } },
      { organizationId: null }
    ];
  }
  
  const sessions = await ChatSession.find(query)
    .sort({ isPinned: -1, updatedAt: -1 })
    .lean();
  
  return { success: true, data: sessions };
}
```

---

## Data Flow Diagrams

### Personal AI Flow
```
User (Personal Page)
    ↓
ChatProvider (no organizationId)
    ↓
getChatSessions({ organizationId: undefined })
    ↓
MongoDB: Find { userId, organizationId: null }
    ↓
Return: Personal chats only
    ↓
POST /api/ai/chats
    ↓
Personal Handlers (no org filter)
    ↓
Personal Data (organizationId: null)
```

### Organization AI Flow
```
User (Org Page: /org/123/propmt)
    ↓
ChatProvider (organizationId: "123")
    ↓
getChatSessions({ organizationId: "123" })
    ↓
MongoDB: Find { userId, organizationId: "123" }
    ↓
Return: Org 123 chats only
    ↓
POST /api/ai/organization/123
    ↓
Verify membership → Get org details
    ↓
Build org context → Enhanced prompt
    ↓
Organization Handlers (org filter: "123")
    ↓
Organization Data (organizationId: "123")
```

---

## Key Implementation Principles

### 1. Data Isolation
- **Database Level**: All queries filtered by `organizationId`
- **Personal**: `organizationId = null` or doesn't exist
- **Organization**: `organizationId = specific org ID`

### 2. Context-Aware Prompts
- **Personal**: Generic financial assistant
- **Organization**: Industry-specific, role-aware prompts

### 3. Authorization
- **Personal**: User authentication only
- **Organization**: User authentication + membership verification

### 4. Chat History
- **Personal Page**: Wrapped with `<ChatProvider>`
- **Org Page**: Wrapped with `<ChatProvider organizationId={orgId}>`
- **Automatic Filtering**: Context determines which chats load

### 5. UI Differentiation
- **Personal**: Standard icons, "Personal" branding
- **Organization**: Building icon, org name, role indicator

---

## Testing the Implementation

### Test Case 1: Personal AI
1. Navigate to `/prompt`
2. Ask: "How much did I spend this month?"
3. ✅ Should query personal expenses only
4. ✅ Chat appears in personal history only

### Test Case 2: Organization AI
1. Navigate to `/org/123/propmt`
2. Ask: "How much did we spend this month?"
3. ✅ Should query org 123 expenses only
4. ✅ Chat appears in org 123 history only
5. ✅ Personal chats NOT visible

### Test Case 3: Multiple Organizations
1. User is member of Org A and Org B
2. Navigate to `/org/A/propmt` → See Org A chats
3. Navigate to `/org/B/propmt` → See Org B chats
4. Navigate to `/prompt` → See personal chats
5. ✅ All histories completely isolated

### Test Case 4: Authorization
1. User tries to access `/org/123/propmt` (not a member)
2. ✅ API returns 403 Forbidden
3. User added to Org 123
4. ✅ Can now access Org 123 AI

---

## File Structure Summary

```
app/
├── (root)/
│   └── prompt/
│       └── page.tsx              # Personal AI page
└── org/
    └── [id]/
        └── propmt/
            └── page.tsx          # Organization AI page

app/api/
├── ai/
│   ├── chats/
│   │   └── route.ts             # Personal AI endpoint
│   └── organization/
│       └── [orgId]/
│           └── route.ts         # Organization AI endpoint

lib/
├── ai/
│   ├── prompts.ts               # System prompts (personal + org)
│   └── handlers.ts              # Intent handlers (personal + org)
├── actions/
│   ├── chat.actions.ts          # Chat session management
│   ├── budgetTracker.action.ts # Expense actions (support orgId)
│   └── income.actions.ts        # Income actions (support orgId)
└── context/
    └── ChatContext.tsx          # Chat state management

types/
└── chat.d.ts                    # TypeScript definitions

prisma/
└── schema.prisma                # Database schema (with orgId fields)

database/
└── chatSession.model.ts         # MongoDB chat schema
```

---

## Summary

The implementation separates personal and organization AI by:

1. **Database**: Adding optional `organizationId` to data models
2. **Prompts**: Context-aware system prompts based on organization
3. **Handlers**: Separate functions that filter by `organizationId`
4. **Endpoints**: Different API routes with authorization
5. **UI**: Context-aware pages wrapped with appropriate providers
6. **Chat History**: Automatic filtering based on context

**Result**: Complete data isolation between personal and organization contexts while reusing core AI infrastructure.
