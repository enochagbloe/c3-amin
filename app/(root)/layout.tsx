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
  if(memberships.length && !memberships.some(member=>['OWNER','ADMIN'].includes(member.role)))redirect(`/org/${memberships[0].organizationId}/budget-requests`);

  return (
    <main>
      <NavBar />
      <div className="flex">
        <section className="hidden lg:block">
          <LeftSideBar />
        </section>
        <section className="flex max-h-screen flex-1 flex-col px-3 pb-3 pt-8 max-md:pb-8 sm:px-6 flex flex-col h-[calc(100vh-80px)] bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950">
          <div className="">{children}</div>
        </section>
      </div>
    </main>
  );
};

export default layout;
