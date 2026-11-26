import prisma from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";
import { visibility, type RequestContext } from "./access";
export async function budgetSummary(context: RequestContext) {
  const visible = visibility(context);
  const approvals: Prisma.BudgetRequestWhereInput = { OR: [{ mainApproverId: context.userId, status: "PENDING_MAIN" }, { secondApproverId: context.userId, requesterId: { not: context.userId }, status: "PENDING_SECOND" }] };
  const cash: Prisma.BudgetRequestWhereInput = { mainApproverId: context.userId, status: "APPROVED", cashStatus: { in: ["NOT_RELEASED", "WITH_REVIEWER"] } };
  const receipts: Prisma.BudgetRequestWhereInput = { requesterId: context.userId, status: "APPROVED", cashStatus: "AWAITING_RECEIPT" };
  const select = { id: true, title: true, amount: true, currency: true, status: true, cashStatus: true, updatedAt: true } as const;
  const [approvalCount, cashCount, receiptCount, pending, tasks, recent] = await prisma.$transaction([
    prisma.budgetRequest.count({ where: { AND: [visible, approvals] } }),
    prisma.budgetRequest.count({ where: { AND: [visible, cash] } }),
    prisma.budgetRequest.count({ where: { AND: [visible, receipts] } }),
    prisma.budgetRequest.groupBy({ by: ["currency"], orderBy: { currency: "asc" }, where: { AND: [visible, { status: { in: ["PENDING_MAIN", "PENDING_SECOND"] } }] }, _sum: { amount: true } }),
    prisma.budgetRequest.findMany({ where: { AND: [visible, { OR: [approvals, cash, receipts] }] }, select, orderBy: { updatedAt: "asc" }, take: 10 }),
    prisma.budgetRequest.findMany({ where: { AND: [visible, { status: { in: ["APPROVED", "REJECTED"] } }] }, select, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);
  return { approvalCount, cashCount, receiptCount, pending: pending.map(group => ({ currency: group.currency, amount: String(group._sum?.amount ?? 0) })), tasks, recent };
}
