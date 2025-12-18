"use client";

import React from "react";

type OrgContextType = {
  organizationId: string | null;
  organizationName: string | null;
  userRole: string | null;
  setOrganization: (id: string, name: string, role: string) => void;
  clearOrganization: () => void;
};

const OrgContext = React.createContext<OrgContextType>({
  organizationId: null,
  organizationName: null,
  userRole: null,
  setOrganization: () => {},
  clearOrganization: () => {},
});

export const useOrgContext = () => {
  const context = React.useContext(OrgContext);
  if (!context) {
    throw new Error("useOrgContext must be used within OrgContextProvider");
  }
  return context;
};

export const OrgContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [organizationId, setOrganizationId] = React.useState<string | null>(null);
  const [organizationName, setOrganizationName] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);

  const setOrganization = (id: string, name: string, role: string) => {
    setOrganizationId(id);
    setOrganizationName(name);
    setUserRole(role);
    localStorage.setItem("activeOrg", JSON.stringify({ id, name, role }));
  };

  const clearOrganization = () => {
    setOrganizationId(null);
    setOrganizationName(null);
    setUserRole(null);
    localStorage.removeItem("activeOrg");
  };

  // Load from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem("activeOrg");
    if (stored) {
      try {
        const { id, name, role } = JSON.parse(stored);
        setOrganizationId(id);
        setOrganizationName(name);
        setUserRole(role);
      } catch (error) {
        console.error("Failed to parse stored org context:", error);
      }
    }
  }, []);

  return (
    <OrgContext.Provider
      value={{
        organizationId,
        organizationName,
        userRole,
        setOrganization,
        clearOrganization,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};
