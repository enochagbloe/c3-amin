"use client";

import { ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
export type Payment = {
  id: string;
  name: string;
  amount: string;
  date: string;
  description: string;
  source?: string;
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
      return <div className="font-medium text-green-600 dark:text-green-400">{formatted}</div>;
    },
  },
  {
    accessorKey: "source",
    header: () => <span className="hidden sm:inline">Source</span>,
    cell: ({ row }) => (
      <div className="hidden sm:block text-muted-foreground">
        {row.getValue("source") || "-"}
      </div>
    ),
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
];
