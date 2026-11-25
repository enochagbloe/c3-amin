import { Badge } from "@/components/ui/badge";
import {
  statusLabels,
  type RequestStatus as Status,
} from "@/lib/budget-requests/types";

export default function RequestStatus({ status }: { status: Status }) {
  return (
    <Badge
      variant={status === "REJECTED" ? "destructive" : "outline"}
      className={
        status === "APPROVED"
          ? "border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
          : ""
      }
    >
      {statusLabels[status]}
    </Badge>
  );
}
