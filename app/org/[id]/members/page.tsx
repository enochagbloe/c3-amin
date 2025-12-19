/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loading } from "@/components/ui/loaading-spinner";
import { Users, UserPlus, Shield, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOrganizationMembers } from "@/lib/actions/organization.actions";

type Member = {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  joinedAt: string;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
};

const OrgMembersPage = () => {
  const params = useParams();
  const orgId = params.id as string;

  const [members, setMembers] = React.useState<Member[]>([]);
  const [isFetching, setIsFetching] = React.useState(true);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [newMemberEmail, setNewMemberEmail] = React.useState("");
  const [newMemberRole, setNewMemberRole] = React.useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");

  // Fetch org members
  React.useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsFetching(true);
        console.log("Fetching members for org:", orgId);
        const result = await getOrganizationMembers({ organizationId: orgId });
        
        console.log("Members result:", result);
        
        if (result.success && result.data) {
          const data = result.data as any;
          console.log("Members data:", data);
          setMembers(data.members || []);
        } else {
          console.error("Failed to fetch members:", result);
          toast.error(result.error?.message || "Failed to load members");
        }
      } catch (error) {
        toast.error("Failed to load organization members");
        console.error("Fetch error:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchMembers();
  }, [orgId]);

  const handleAddMember = async () => {
    if (!newMemberEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await fetch("/api/organizations/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          email: newMemberEmail,
          role: newMemberRole,
        }),
      }).then((res) => res.json());

      if (result.success) {
        toast.success("Member added successfully");
        setAddDialogOpen(false);
        setNewMemberEmail("");
        setNewMemberRole("MEMBER");
        
        // Refresh members
        const updatedResult = await getOrganizationMembers({ organizationId: orgId });
        if (updatedResult.success && updatedResult.data) {
          const data = updatedResult.data as any;
          setMembers(data.members || []);
        }
      } else {
        toast.error(result.error?.message || "Failed to add member");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    setIsSubmitting(true);
    try {
      const result = await fetch("/api/organizations/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          userId: selectedMember.userId,
        }),
      }).then((res) => res.json());

      if (result.success) {
        toast.success("Member removed successfully");
        setRemoveDialogOpen(false);
        setSelectedMember(null);
        
        // Update local state
        setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
      } else {
        toast.error(result.error?.message || "Failed to remove member");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    setIsSubmitting(true);
    try {
      const member = members.find((m) => m.id === memberId);
      if (!member) return;

      const result = await fetch("/api/organizations/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          userId: member.userId,
          role: newRole,
        }),
      }).then((res) => res.json());

      if (result.success) {
        toast.success("Member role updated successfully");
        
        // Update local state
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole as any } : m))
        );
      } else {
        toast.error(result.error?.message || "Failed to update role");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default";
      case "ADMIN":
        return "secondary";
      case "MEMBER":
        return "outline";
      case "VIEWER":
        return "outline";
      default:
        return "outline";
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Members</h1>
            <p className="text-muted-foreground">
              Manage organization members and their roles
            </p>
          </div>
          
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Add a new member to this organization by their email address
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="member@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newMemberRole} onValueChange={(value: any) => setNewMemberRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember} disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Members
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admins
              </CardTitle>
              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter((m) => m.role === "ADMIN" || m.role === "OWNER").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Members
              </CardTitle>
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter((m) => m.role === "MEMBER").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Members</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.user?.name || "Unknown User"}
                    </TableCell>
                    <TableCell>{member.user?.email || "N/A"}</TableCell>
                    <TableCell>
                      {member.role === "OWNER" ? (
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role}
                        </Badge>
                      ) : (
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleUpdateRole(member.id, value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="VIEWER">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== "OWNER" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setRemoveDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Remove Member Dialog */}
        <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {selectedMember?.user?.name || "this member"} from the organization?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveMember} disabled={isSubmitting}>
                {isSubmitting ? "Removing..." : "Remove Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </main>
  );
};

export default OrgMembersPage;
