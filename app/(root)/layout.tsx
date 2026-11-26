import {auth} from "@/auth";
import prisma from "@/lib/prisma";
import {redirect} from "next/navigation";
import LeftSideBar from "@/components/Nav/LeftSideBar";
import NavBar from "@/components/Nav/navbar";
import React from "react";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session=await auth();
  if(!session?.user?.id)redirect('/sign-in');
  const memberships=await prisma.organizationMember.findMany({where:{userId:session.user.id},select:{organizationId:true,role:true},orderBy:{joinedAt:'asc'}});
  if(memberships.length && !memberships.some(member=>['OWNER','ADMIN'].includes(member.role)))redirect(`/org/${memberships[0].organizationId}/dashboard`);

  return (
    <main>
      <NavBar />
      <div className="flex">
        <section className="hidden lg:block">
          <LeftSideBar />
        </section>
        <section className="app-content min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </section>
      </div>
    </main>
  );
};

export default layout;
