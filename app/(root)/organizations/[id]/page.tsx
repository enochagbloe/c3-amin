"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useRouter as useNavRouter } from "next/navigation";
import { getOrganization } from "@/lib/actions/organization.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Users, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

const OrganizationDetailPage = () => {
  const params = useParams();
  const navRouter = useNavRouter();
  const orgId = params.id as string;

  const [organization, setOrganization] = React.useState<Organization | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setIsLoading(true);
        const result = await getOrganization({ organizationId: orgId });

        if (result.success && result.data) {
          setOrganization(result.data as Organization);
        } else {
          toast.error(result.error?.message || "Failed to load organization");
          navRouter.push("/organizations");
        }
      } catch (error) {
        toast.error("Something went wrong");
        console.error(error);
        navRouter.push("/organizations");
      } finally {
        setIsLoading(false);
      }
    };

    if (orgId) {
      fetchOrganization();
    }
  }, [orgId, navRouter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Organization not found</p>
          <Button onClick={() => navRouter.push("/organizations")}>
            Back to Organizations
          </Button>
        </div>
      </div>
    );
  }

  const userRole = organization.members[0]?.role || "MEMBER";
  const totalExpenses = organization.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = organization.expenses.filter((exp) => exp.status === "pending").length;
  const approvedExpenses = organization.expenses.filter((exp) => exp.status === "approved").length;

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => navRouter.push("/organizations")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
          <p className="text-muted-foreground mt-1">{organization.industry}</p>
        </div>
        <Badge className={getRoleBadgeColor(userRole)} variant="secondary">
          {userRole}
        </Badge>
      </motion.div>

      {/* Organization Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {organization.bio && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{organization.bio}</p>
              </div>
            )}
            {organization.email && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Email</p>
                <p className="text-sm">{organization.email}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Created</p>
                <p className="text-sm">
                  {new Date(organization.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Industry</p>
                <p className="text-sm">{organization.industry}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{organization.members.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{pendingExpenses}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{approvedExpenses}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Overview</CardTitle>
                <CardDescription>
                  General information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Members</p>
                      <p className="text-lg font-semibold mt-1">
                        {organization.members.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Expenses
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        ${totalExpenses.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Pending Approval
                      </p>
                      <p className="text-lg font-semibold mt-1 text-orange-600">
                        {pendingExpenses}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Approved Expenses
                      </p>
                      <p className="text-lg font-semibold mt-1 text-green-600">
                        {approvedExpenses}
                      </p>
                    </div>
                  </div>

                  {organization.bio && (
                    <div className="pt-6 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Description
                      </p>
                      <p className="text-sm leading-relaxed">{organization.bio}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage your organization members and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Members management coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Organization Expenses</CardTitle>
                <CardDescription>
                  View and manage organization expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Expenses management coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>
                  Manage organization details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Settings management coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default OrganizationDetailPage;
