"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganizationAccess } from './OrganizationAccessProvider';
import PersonalSettings from '@/components/team/PersonalSettings';
import TeamPage from '@/components/team/TeamPage';
import OrganizationSettings from './OrganizationSettings';

export default function OrganizationSettingsPage({ initialTab }: { initialTab: string }) {
  const access = useOrganizationAccess();
  const router = useRouter();
  const allowed = access.isOwner ? ['personal', 'team', 'organization'] : ['personal'];
  const [tab, setTab] = useState(allowed.includes(initialTab) ? initialTab : 'personal');
  useEffect(() => { setTab(access.isOwner && ['team', 'organization'].includes(initialTab) ? initialTab : 'personal'); }, [initialTab, access.isOwner]);
  return <main className="space-y-6 p-3 sm:p-6"><h1 className="text-3xl font-bold">Settings</h1>
    <Tabs value={tab} onValueChange={value => { setTab(value); router.replace(`/org/${access.organizationId}/settings?tab=${value}`, { scroll: false }); }}>
      <TabsList className="flex h-auto w-fit flex-wrap"><TabsTrigger value="personal">Personal settings</TabsTrigger>{access.isOwner && <><TabsTrigger value="team">Team</TabsTrigger><TabsTrigger value="organization">Organization</TabsTrigger></>}</TabsList>
      <TabsContent value="personal"><PersonalSettings embedded /></TabsContent>
      {access.isOwner && <><TabsContent value="team"><TeamPage organizationId={access.organizationId} embedded /></TabsContent><TabsContent value="organization"><OrganizationSettings /></TabsContent></>}
    </Tabs>
  </main>;
}
