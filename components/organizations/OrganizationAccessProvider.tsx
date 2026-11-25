"use client";
import { createContext, useContext } from "react";
import type { OrganizationAccess } from "@/lib/organizations/access";
const Context = createContext<OrganizationAccess | null>(null);
export function OrganizationAccessProvider({
  access,
  children,
}: {
  access: OrganizationAccess;
  children: React.ReactNode;
}) {
  return <Context.Provider value={access}>{children}</Context.Provider>;
}
export function useOrganizationAccess() {
  const access = useContext(Context);
  if (!access) throw new Error("Organization access context is missing");
  return access;
}
