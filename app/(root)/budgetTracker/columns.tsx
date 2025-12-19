"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

// This type is used to define the shape of our data.
export type Payment = {
  id: string;
  name: string;
  amount: string;
  status: "pending" | "approved" | "rejected";
  date: string;
  description: string;
  author?: string;
};

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="font-medium truncate max-w-[120px] sm:max-w-none">
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "date",
    header: () => <span className="hidden sm:inline">Date</span>,
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return (
        <div className="hidden sm:block text-muted-foreground">
          {date.toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: () => <span className="hidden md:inline">Description</span>,
    cell: ({ row }) => (
      <div className="hidden md:block truncate max-w-[200px] text-muted-foreground">
        {row.getValue("description") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "approved"
              ? "default"
              : status === "rejected"
              ? "destructive"
              : "secondary"
          }
          className="text-xs"
        >
          <span className="hidden sm:inline">{status}</span>
          <span className="sm:hidden">
            {status === "approved" ? "✓" : status === "rejected" ? "✗" : "•"}
          </span>
        </Badge>
      );
    },
  },
];
