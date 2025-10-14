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
import { useTransition } from "react";
import { toast } from "sonner";
//import { updateExpenseStatus } from "@/lib/actions/budgetTracker.action";
// import router from "next/router";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isApprove?: boolean;
  id: string;
};
const ApproveDialog = ({ open, onOpenChange, isApprove, id}: Props) => {
  // const [pending, setTransition] = useTransition();
  const handleApprovals = async () => {
    try {
      const res = await updateExpenseStatus({
        id: id,
        status: isApprove ? "approved" : "rejected",
      });

      if (res.success) {
        onOpenChange(false); // Close dialog
        alert(`Expense ${isApprove ? "approved" : "rejected"} successfully!`);
      } else {
        alert(res.error?.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update expense. Please try again.");
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
          <AlertDialogAction onClick={handleApprovals}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ApproveDialog;
