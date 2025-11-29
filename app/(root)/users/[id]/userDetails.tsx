"use client"
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserClientProp {
  userData: User
}

const UserDetailClientPage = ({
  userData
}: UserClientProp) => {

  // Destructure the actual user data
  const {
    name,
    email ,
    staffId,
    role,
    status ,
    // Add any other fields from your User model
  } = userData || {};

  // Debug log (remove after testing)
  console.log('userData in client:', userData);

  // Safety check
  if (!userData) {
    return <div className="p-6">No user data available</div>;
  }

  // Split name into first and last (if applicable)
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const initials = nameParts.map(n => n.charAt(0)).join('').toUpperCase() || 'U';

  return (
    <div className="p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span>Contact</span>
          <span>/</span>
          <span className="text-gray-900">{firstName}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Profile Card and Social Cards below */}
          <div className="flex flex-col gap-6">
            {/* Profile Card */}
            <Card className="w-full lg:w-100">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="text-xl font-semibold">{name}</h2>
                    <p className="text-sm text-gray-500 capitalize">{role}</p>
                  </div>

                  <div className="w-full space-y-3 text-left">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-600">Email</span>
                      <span className="text-gray-900 text-xs">{email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-600">Status</span>
                      <span className={`text-xs font-medium ${status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                        {status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-600">Staff ID</span>
                      <span className="text-gray-900 text-xs">{staffId}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form Card */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="statements">Statements</TabsTrigger>
                  </TabsList>
                  <TabsContent value="general" className="mt-6">
                    <div className="space-y-6">
                      {/* Name Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" defaultValue={firstName} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" defaultValue={lastName} />
                        </div>
                      </div>

                      {/* Email and Role */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input id="email" type="email" defaultValue={email} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Input id="role" defaultValue={role} />
                        </div>
                      </div>

                      {/* Status and User ID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Input id="status" defaultValue={status} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staffId">User ID</Label>
                          <Input id="staffId" defaultValue={staffId} />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button className="bg-blue-600 hover:bg-blue-700">Save</Button>
                        <Button variant="outline">Cancel</Button>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="activity">
                    <div className="py-8 text-center text-gray-500">
                      Activity content goes here
                    </div>
                  </TabsContent>
                  <TabsContent value="transactions">
                    <div className="py-8 text-center text-gray-500">
                      Transactions content goes here
                    </div>
                  </TabsContent>
                  <TabsContent value="statements">
                    <div className="py-8 text-center text-gray-500">
                      Statements content goes here
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailClientPage;