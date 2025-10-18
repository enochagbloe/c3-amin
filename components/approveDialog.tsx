"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateExpenseStatus } from "@/lib/actions/budgetTracker.action";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isApprove?: boolean;
  id: string;
  alreadyApproved?: boolean;
};
const ApproveDialog = ({
  open,
  onOpenChange,
  isApprove,
  id,
  alreadyApproved,
}: Props) => {
  // const [pending, setTransition] = useTransition();
  const handleApprovals = async () => {
    try {
      const res = await updateExpenseStatus({
        id: id,
        status: isApprove ? "approved" : "rejected",
      });

      if (res.success) {
        onOpenChange(false); // Close dialog
        toast.success(
          `Expense ${isApprove ? "approved" : "rejected"} successfully!`
        );
      } else {
        toast.error(res.error?.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update expense. Please try again.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {isApprove
              ? "Are you sure you want to approve this expense? This action cannot be undone."
              : "Are you sure you want to reject this expense? This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={alreadyApproved}
            onClick={handleApprovals}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ApproveDialog;
