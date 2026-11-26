export type RequestStatus =
  "PENDING_MAIN" | "PENDING_SECOND" | "APPROVED" | "REJECTED";
export type Person = { id: string; name: string };
export type BudgetRequest = {
  id: string;
  title: string;
  description: string;
  amount: string;
  currency: string;
  requesterId: string;
  mainApproverId: string;
  secondApproverId: string | null;
  status: RequestStatus;
  neededBy: string | null;
  createdAt: string;
  updatedAt: string;
  requester: Person;
  mainApprover: Person;
  secondApprover: Person | null;
  events: {
    id: string;
    actor: Person;
    stage: "SUBMITTED" | "MAIN" | "SECOND";
    action: "SUBMITTED" | "APPROVED" | "REJECTED" | "REASSIGNED";
    comment: string | null;
    createdAt: string;
  }[];
};
export type ApprovalOptions = {
  userId: string;
  isOwner: boolean;
  reviewer: Person | null;
  pastor: Person | null;
  members: (Person & { email: string })[];
};
export const statusLabels: Record<RequestStatus, string> = {
  PENDING_MAIN: "Awaiting review",
  PENDING_SECOND: "Awaiting pastor",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
export function budgetAmount(amount: string, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(
    Number(amount),
  );
}
