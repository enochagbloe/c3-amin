import React from 'react';
import UserDetailClientPage from './userDetails';
import { auth } from '@/auth';
import { getAllUsers } from '@/lib/actions/user.actions';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const userDetailsPage = async ({ params }: RouteParams) => {
  const { id } = await params;

  // validate ObjectId
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return notFound();

  const session = await auth();
  const user = session?.user?.name;

  if (!user) console.log('no user found');

  // fetch data from server action
  const response = await getAllUsers({ userId: id });

  if (!response.success || !response.data) return notFound();

  const userData = response.data as User;
  console.log('userData from server:', userData); // This should show the actual structure

  return (
    <div>
      <UserDetailClientPage userData={userData} />
    </div>
  );
};

export default userDetailsPage;