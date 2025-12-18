"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { IconBuilding, IconPlus, IconUsers, IconFileInvoice } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserOrganizations } from "@/lib/actions/organization.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Organization = {
  id: string;
  name: string;
  email: string | null;
  bio: string | null;
  industry: string;
  createdAt: Date;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    joinedAt: Date;
  }>;
  expenses: Array<{
    id: string;
    amount: number;
    status: string;
  }>;
};

const OrganizationsPage = () => {
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setIsLoading(true);
        const result = await getUserOrganizations();

        if (result.success && result.data) {
          setOrganizations(result.data as Organization[]);
        } else {
          toast.error(result.error?.message || "Failed to load organizations");
        }
      } catch (error) {
        toast.error("Something went wrong");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "ADMIN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "MEMBER":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "VIEWER":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUserRole = (org: Organization) => {
    // Assuming the first member is the current user's membership
    // In a real app, you'd match against the session userId
    return org.members[0]?.role || "MEMBER";
  };

  const handleCreateOrganization = () => {
    // TODO: Open create organization dialog
    toast.info("Create organization dialog coming soon!");
  };

  const handleCardClick = (orgId: string) => {
    router.push(`/organizations/${orgId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workspaces and collaborate with your team
          </p>
        </div>
        <Button onClick={handleCreateOrganization} size="default">
          <IconPlus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        // Empty State
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[400px] text-center"
        >
          <div className="rounded-full bg-muted p-6 mb-4">
            <IconBuilding className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No organizations yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create your first organization to start collaborating with your team and managing expenses together.
          </p>
          <Button onClick={handleCreateOrganization} size="lg">
            <IconPlus className="mr-2 h-5 w-5" />
            Create Your First Organization
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org, index) => {
            const userRole = getUserRole(org);
            const totalExpenses = org.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const pendingCount = org.expenses.filter((exp) => exp.status === "pending").length;

            return (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => handleCardClick(org.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <IconBuilding className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{org.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {org.industry}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getRoleBadgeColor(userRole)} variant="secondary">
                        {userRole}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {org.bio && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {org.bio}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {org.members.length} {org.members.length === 1 ? "member" : "members"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconFileInvoice className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {org.expenses.length} {org.expenses.length === 1 ? "expense" : "expenses"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Expenses</span>
                        <span className="font-semibold">${totalExpenses.toFixed(2)}</span>
                      </div>
                      {pendingCount > 0 && (
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-muted-foreground">Pending Approval</span>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {pendingCount}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrganizationsPage;
