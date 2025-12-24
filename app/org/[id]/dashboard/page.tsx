"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrganization } from "@/lib/actions/org/organization.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrgChatPage from "../propmt/page";

type Organization = {
  id: string;
  name: string;
  email: string | null;
  bio: string | null;
  industry: string;
  members: Array<{
    id: string;
    role: string;
  }>;
  expenses: Array<{
    id: string;
    amount: number;
    status: string;
  }>;
};

const OrgDashboardPage = () => {
  const params = useParams();
  const router = useRouter();
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
          toast.error("Failed to load organization");
          router.push("/organizations");
        }
      } catch (error) {
        toast.error("Something went wrong");
        console.error(error);
        router.push("/organizations");
      } finally {
        setIsLoading(false);
      }
    };

    if (orgId) {
      fetchOrganization();
    }
  }, [orgId, router]);

  if (isLoading || !organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalExpenses = organization.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = organization.expenses.filter((exp) => exp.status === "pending").length;
  const approvedExpenses = organization.expenses.filter((exp) => exp.status === "approved").length;

  return (
  // dashboard
    <Tabs defaultValue="dashboard" className="">
          <TabsList className="">
           <TabsTrigger value="dashboard" className="">
              Dashboard
           </TabsTrigger>
           <TabsTrigger value="prompt" className="flex-1 md:flex-none">
              Prompt
           </TabsTrigger>
          </TabsList>
        <TabsContent value="dashboard" className="w-full">
            <main>
     <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
        <p className="text-muted-foreground mt-1">Organization Dashboard</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.members.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingExpenses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedExpenses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions & Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Organization Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Industry</span>
              <span className="text-sm font-medium">{organization.industry}</span>
            </div>
            {organization.email && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contact</span>
                <span className="text-sm font-medium">{organization.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Expenses</span>
              <span className="text-sm font-medium">{organization.expenses.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No recent activity
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </main>
        </TabsContent>
        <TabsContent value="propmt" className="w-full">
       {/** Prompt content goes here */}
          <OrgChatPage/>
        </TabsContent>
        </Tabs>
  );
};

export default OrgDashboardPage;
