"use client";

import { ColumnDef } from "@tanstack/react-table";

export type UserManagementTable = {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  date: string;
  userId: string;
  role: "admin" | "manager" | "member" | "viewer";
  staffId: string;
};

export const columns: ColumnDef<UserManagementTable>[] = [
  {
    accessorKey: "staffId",
    header: "Staff ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "date",
    header: "Date Joined",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
];