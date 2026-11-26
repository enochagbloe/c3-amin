export type RequestStatus =
  "PENDING_MAIN" | "PENDING_SECOND" | "APPROVED" | "REJECTED";
export type CashStatus = "NOT_RELEASED" | "WITH_REVIEWER" | "AWAITING_RECEIPT" | "RECEIVED";
export const cashLabels: Record<CashStatus, string> = { NOT_RELEASED: "Awaiting cash collection", WITH_REVIEWER: "Cash with reviewer", AWAITING_RECEIPT: "Awaiting requester confirmation", RECEIVED: "Received · expense recorded" };
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
  cashStatus: CashStatus;
  reviewerReceivedAt: string | null;
  handedOverAt: string | null;
  receiptConfirmedAt: string | null;
  paymentReference: string | null;
  neededBy: string | null;
  createdAt: string;
  updatedAt: string;
  requester: Person;
  mainApprover: Person;
  secondApprover: Person | null;
  events: {
    id: string;
    actor: Person;
    stage: "SUBMITTED" | "MAIN" | "SECOND" | "PAYMENT";
    action: "SUBMITTED" | "APPROVED" | "REJECTED" | "REASSIGNED" | "FUNDS_RECEIVED" | "CASH_HANDED_OVER" | "RECEIPT_CONFIRMED";
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
