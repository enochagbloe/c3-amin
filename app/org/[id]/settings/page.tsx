/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loading } from "@/components/ui/loaading-spinner";
import { Settings as SettingsIcon, Trash2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { getOrganization } from "@/lib/actions/org/organization.actions";

const OrgSettingsPage = () => {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [isFetching, setIsFetching] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    bio: "",
    industry: "",
  });

  // Fetch organization data
  React.useEffect(() => {
    const fetchOrg = async () => {
      try {
        setIsFetching(true);
        const result = await getOrganization({ organizationId: orgId });
        
        if (result.success && result.data) {
          const org = result.data as any;
          setFormData({
            name: org.name || "",
            email: org.email || "",
            bio: org.bio || "",
            industry: org.industry || "",
          });
        }
      } catch (error) {
        toast.error("Failed to load organization settings");
        console.error(error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchOrg();
  }, [orgId]);

  const handleUpdate = async () => {
    setIsSubmitting(true);
    try {
      const result = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }).then((res) => res.json());

      if (result.success) {
        toast.success("Organization updated successfully");
      } else {
        toast.error(result.error?.message || "Failed to update organization");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const result = await fetch(`/api/organizations/${orgId}`, {
        method: "DELETE",
      }).then((res) => res.json());

      if (result.success) {
        toast.success("Organization deleted successfully");
        router.push("/organizations");
      } else {
        toast.error(result.error?.message || "Failed to delete organization");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <main className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization settings and preferences
          </p>
        </div>

        {/* General Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              General Information
            </CardTitle>
            <CardDescription>
              Update your organization&apos;s basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter organization name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@organization.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Description</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about your organization"
                rows={4}
              />
            </div>

            <div className="pt-4">
              <Button onClick={handleUpdate} disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-600 dark:border-red-400">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that will permanently affect your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-red-600 dark:text-red-400">
                    Delete Organization
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Once you delete an organization, there is no going back. All data will be permanently removed.
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        organization and remove all associated data including expenses,
                        income records, and member information.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isSubmitting ? "Deleting..." : "Delete Organization"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
};

export default OrgSettingsPage;
