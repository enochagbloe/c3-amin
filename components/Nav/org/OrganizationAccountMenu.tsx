"use client";

import { signOut } from "next-auth/react";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Building2, ChevronDown, Home, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserOrganizations } from "@/lib/actions/org/organization.actions";
import { toast } from "sonner";

type Organization = {
  id: string;
  name: string;
  members: Array<{ role: string }>;
};

const OrganizationAccountMenu = ({ compact = false, accountName }: { compact?: boolean; accountName?: string | null }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentOrg, setCurrentOrg] = React.useState<Organization | null>(null);

  // Check if we're in org workspace
  const isOrgWorkspace = pathname.startsWith("/org/");
  const orgIdFromUrl = isOrgWorkspace ? pathname.split("/")[2] : null;

  React.useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setIsLoading(true);
        const result = await getUserOrganizations();
        if (result.success && result.data) {
          setOrganizations(result.data as Organization[]);

          // Set current org if we're in org workspace
          if (orgIdFromUrl) {
            const org = (result.data as Organization[]).find(
              (o) => o.id === orgIdFromUrl,
            );
            setCurrentOrg(org || null);
          }
        }
      } catch (error) {
        console.error("Failed to load organizations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [orgIdFromUrl]);

  const handleSwitchOrg = (orgId: string) => {
    router.push(`/org/${orgId}/dashboard`);
  };

  const handleExitToPersonal = () => {
    toast.success("Switched to personal workspace");
    router.push("/");
  };

  if (isLoading) {
    return (
      <Button variant="ghost" className="w-full justify-start" disabled aria-label="Loading accounts">
        <Building2 className="h-4 w-4 mr-2" />
        {!compact && "Loading…"}
      </Button>
    );
  }

  const canUsePersonal = organizations.length === 0 || organizations.some(org => ["OWNER", "ADMIN"].includes(org.members[0]?.role ?? ""));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto min-h-10 w-full justify-start gap-2 overflow-hidden text-left" aria-label="Switch account or workspace">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-muted text-xs font-medium">{(accountName || currentOrg?.name || "C3").slice(0, 1).toUpperCase()}</span>
          {!compact && <><span className="min-w-0 flex-1"><span className="block truncate text-sm">{accountName || "My account"}</span><span className="block truncate text-xs text-muted-foreground">{currentOrg?.name || "Personal workspace"}</span></span><ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></>}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start" className="w-[250px]">
        <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Personal Workspace */}
        {canUsePersonal && <DropdownMenuItem
          onClick={handleExitToPersonal}
          className="cursor-pointer"
          disabled={!isOrgWorkspace}
        >
          <Home className="h-4 w-4 mr-2" />
          <span>Personal Workspace</span>
          {!isOrgWorkspace && (
            <Badge variant="secondary" className="ml-auto">
              Active
            </Badge>
          )}
        </DropdownMenuItem>}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Organizations
        </DropdownMenuLabel>

        {/* Organizations List */}
        {organizations.length === 0 ? (
          <DropdownMenuItem disabled>
            <span className="text-sm text-muted-foreground">
              No organizations
            </span>
          </DropdownMenuItem>
        ) : (
          organizations.map((org) => {
            const isActive = currentOrg?.id === org.id;
            const userRole = org.members[0]?.role || "MEMBER";

            return (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitchOrg(org.id)}
                className="cursor-pointer"
                disabled={isActive}
              >
                <Building2 className="h-4 w-4 mr-2" />
                <div className="flex-1">
                  <div className="font-medium">{org.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {userRole}
                  </div>
                </div>
                {isActive && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
            );
          })
        )}

        {isOrgWorkspace && canUsePersonal && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleExitToPersonal}
              className="cursor-pointer text-orange-600 dark:text-orange-400"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Exit to Personal</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut({ callbackUrl: "/sign-in" })}><LogOut className="mr-2 h-4 w-4" />Use another account / Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrganizationAccountMenu;
