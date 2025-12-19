"use client";

import { ColumnDef } from "@tanstack/react-table";

export type Income = {
  id: string;
  name: string;
  amount: string;
  date: string;
  description: string;
  author?: string;
};

export const columns: ColumnDef<Income>[] = [
  {
    accessorKey: "name",
    header: "Source",
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
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
];
