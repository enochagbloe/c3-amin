"use client";

import { ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
export type Payment = {
  id: string;
  name: string;
  amount: string;
  status: "pending" | "approved" | "failed";
  date: string;
  description: string;
  author?: string;
};

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];
